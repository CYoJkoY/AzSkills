/*
 * Long-horizon goal run for the delivery loop.
 *
 * Codex's Goal mode keeps a task alive across turns on its own. This module
 * gives the same stamina to the plugin so a run keeps moving toward one stated
 * objective even when Goal mode is off: the objective, its done-when criteria,
 * the progress ledger, the next step, and the iteration budget all live in a
 * local, git-ignored goal file. The Stop hook reads that file and refuses to end
 * the turn while the goal is active and work remains, re-injecting the compass
 * each time so a compacted context is re-grounded from disk instead of memory.
 *
 * Progress is measured from the repository and the delivery ledger, not from the
 * model's word: an unchanged HEAD, working tree, ledger, and worktrees across a
 * pass count as no progress, and a run that keeps making no progress is stalled
 * rather than continued forever.
 *
 * A long run is expected to hit the same rough edges a person would: a flaky
 * network call, a review that lands just under the bar, a budget that runs out
 * while the work is still healthy. Each of those has one bounded, recorded
 * self-repair here, so the run keeps moving without asking the user to babysit
 * it, and still stops cleanly once the repairs are spent.
 */

import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { lstat, mkdir, readFile, readdir, readlink, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { flowRoot, isRecord, planWaves, readState, reviewsRoot, statePath } from "./state.ts";
import type { FlowState } from "./state.ts";
import { describeDoneWhen, parseDoneWhen, verifyDoneWhen } from "./goal-verify.ts";
import type { DoneWhenReport } from "./goal-verify.ts";

export const GOAL_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_ITERATIONS = 1000;
export const DEFAULT_MAX_NO_PROGRESS = 4;
export const MAX_PROGRESS_ENTRIES = 60;
export const MAX_BLOCKERS = 20;
export const MAX_FIELD_CHARS = 4000;
/** Automatic budget extensions allowed before a healthy run is paused. */
export const MAX_AUTO_EXTENSIONS = 2;
/** Automatic repair rounds allowed for a review that is close but below the bar. */
export const MAX_AUTO_REPAIRS = 2;
/** Retries of a transient failure (network, 5xx, pending CI) before it stings. */
export const MAX_TRANSIENT_RETRIES = 3;
/** Passes granted for one automatic diagnosis before a stall is declared. */
export const DIAGNOSE_GRACE = 2;
/** Review score below which an automatic repair is not safe. */
export const MIN_REPAIRABLE_SCORE = 4.0;

export type GoalStatus = "active" | "paused" | "complete" | "abandoned" | "stalled";

export interface GoalProgress {
  readonly at: string;
  readonly iteration: number;
  readonly note: string;
  readonly evidence: string;
}

/** The last known good place to resume from: a commit and the step after it. */
export interface GoalCheckpoint {
  readonly sha: string;
  readonly step: string;
  readonly at: string;
}

/** A transient failure being retried, kept so a retry storm cannot hide a stall. */
export interface GoalRetry {
  readonly count: number;
  readonly at: string;
  readonly note: string;
}

export interface GoalState {
  schemaVersion: 1;
  objective: string;
  doneWhen: string[];
  status: GoalStatus;
  iteration: number;
  maxIterations: number;
  maxNoProgress: number;
  noProgress: number;
  nextStep: string;
  progress: GoalProgress[];
  blockers: string[];
  /** Fingerprint of the last observed repository/ledger state. */
  lastMarker: string;
  lastProgressAt: string;
  lastProgressIteration: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
  /** Resume point written whenever a pass makes real progress. */
  checkpoint: GoalCheckpoint | null;
  /** Pending transient-failure retry, cleared by progress or a different error. */
  retry: GoalRetry | null;
  /** Count of automatic budget extensions already granted. */
  extensions: number;
  /** Count of automatic review-repair rounds already spent. */
  autoRepairs: number;
  /** Highest review round already handled, so one failing round is not re-fixed. */
  lastRepairRound: number;
  /** True once the single automatic diagnosis pass has been used. */
  diagnosed: boolean;
  /** Command patterns the guard may auto-approve inside this project. */
  allowedCommands: string[];
}

const GOAL_STATUSES: readonly GoalStatus[] = ["active", "paused", "complete", "abandoned", "stalled"];
const LOCK_STALE_MS = 15_000;
const LOCK_TIMEOUT_MS = 6_000;

export const goalPath = (project: string): string => path.join(flowRoot(project), "goal.json");

const nowIso = (at: number): string => new Date(at).toISOString();

function clip(text: string, limit = MAX_FIELD_CHARS): string {
  const trimmed = text.trim();
  return trimmed.length <= limit ? trimmed : trimmed.slice(0, limit);
}

/** Appends a blocker while keeping the on-disk record bounded over a long run. */
export function pushBlocker(list: readonly string[], entry: string): string[] {
  return [...list, clip(entry)].slice(-MAX_BLOCKERS);
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readProgress(value: unknown): GoalProgress[] {
  if (!Array.isArray(value)) return [];
  const entries: GoalProgress[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    entries.push({
      at: typeof item.at === "string" ? item.at : "",
      iteration: typeof item.iteration === "number" && Number.isFinite(item.iteration) ? item.iteration : 0,
      note: typeof item.note === "string" ? item.note.slice(0, MAX_FIELD_CHARS) : "",
      evidence: typeof item.evidence === "string" ? item.evidence.slice(0, MAX_FIELD_CHARS) : "",
    });
  }
  return entries.slice(-MAX_PROGRESS_ENTRIES);
}

const MAX_ALLOWED_COMMANDS = 40;
const MAX_PATTERN_CHARS = 300;

function readCheckpoint(value: unknown): GoalCheckpoint | null {
  if (!isRecord(value)) return null;
  const sha = typeof value.sha === "string" ? value.sha.trim() : "";
  const step = typeof value.step === "string" ? value.step.slice(0, MAX_FIELD_CHARS) : "";
  const at = typeof value.at === "string" ? value.at : "";
  if (sha === "") return null;
  return { sha, step, at };
}

function readRetry(value: unknown): GoalRetry | null {
  if (!isRecord(value)) return null;
  const count = typeof value.count === "number" && Number.isInteger(value.count) ? value.count : 0;
  if (count <= 0) return null;
  return {
    count: Math.min(count, 20),
    at: typeof value.at === "string" ? value.at : "",
    note: typeof value.note === "string" ? value.note.slice(0, MAX_FIELD_CHARS) : "",
  };
}

function readAllowedCommands(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const patterns: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const pattern = item.trim().slice(0, MAX_PATTERN_CHARS);
    if (pattern === "") continue;
    patterns.push(pattern);
  }
  return patterns.slice(0, MAX_ALLOWED_COMMANDS);
}

function readGoalState(value: unknown): GoalState | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== GOAL_SCHEMA_VERSION) return null;
  if (typeof value.objective !== "string" || value.objective.trim() === "") return null;
  const status = value.status;
  if (typeof status !== "string" || !GOAL_STATUSES.includes(status as GoalStatus)) return null;
  if (!isStringArray(value.doneWhen)) return null;
  if (!isPositiveInt(value.maxIterations) || !isPositiveInt(value.maxNoProgress)) return null;

  const iteration = typeof value.iteration === "number" && Number.isFinite(value.iteration) ? Math.max(0, Math.floor(value.iteration)) : 0;
  const noProgress = typeof value.noProgress === "number" && Number.isFinite(value.noProgress) ? Math.max(0, Math.floor(value.noProgress)) : 0;
  const nonNegative = (raw: unknown): number =>
    typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  return {
    schemaVersion: GOAL_SCHEMA_VERSION,
    objective: clip(value.objective),
    doneWhen: value.doneWhen.map((entry) => clip(entry)).filter((entry) => entry !== ""),
    status: status as GoalStatus,
    iteration,
    maxIterations: value.maxIterations,
    maxNoProgress: value.maxNoProgress,
    noProgress,
    nextStep: typeof value.nextStep === "string" ? clip(value.nextStep) : "",
    progress: readProgress(value.progress),
    blockers: isStringArray(value.blockers) ? value.blockers.map((entry) => clip(entry)).filter((entry) => entry !== "").slice(-MAX_BLOCKERS) : [],
    lastMarker: typeof value.lastMarker === "string" ? value.lastMarker : "",
    lastProgressAt: typeof value.lastProgressAt === "string" ? value.lastProgressAt : "",
    lastProgressIteration: typeof value.lastProgressIteration === "number" && Number.isFinite(value.lastProgressIteration) ? Math.max(0, Math.floor(value.lastProgressIteration)) : 0,
    summary: typeof value.summary === "string" ? clip(value.summary) : "",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    checkpoint: readCheckpoint(value.checkpoint),
    retry: readRetry(value.retry),
    extensions: nonNegative(value.extensions),
    autoRepairs: nonNegative(value.autoRepairs),
    lastRepairRound: nonNegative(value.lastRepairRound),
    diagnosed: value.diagnosed === true,
    allowedCommands: readAllowedCommands(value.allowedCommands),
  };
}

/** Reads the goal file, or null when the project has no goal or it is malformed. */
export async function readGoal(project: string): Promise<GoalState | null> {
  const text = await readFile(goalPath(project), "utf8").catch(() => null);
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return readGoalState(parsed);
}

/** Writes the goal atomically and keeps `.azflow/` local-only. */
export async function writeGoal(project: string, goal: GoalState): Promise<void> {
  const directory = flowRoot(project);
  await mkdir(directory, { recursive: true });
  const ignore = path.join(directory, ".gitignore");
  const hasIgnore = await stat(ignore).then(() => true).catch(() => false);
  if (!hasIgnore) await writeFile(ignore, "*\n", "utf8").catch(() => undefined);
  const target = goalPath(project);
  const temp = target + "." + randomBytes(6).toString("hex") + ".tmp";
  await writeFile(temp, JSON.stringify(goal, null, 2) + "\n", "utf8");
  await rename(temp, target);
}

/**
 * Finds the nearest ancestor (including `start`) that holds an `.azflow/goal.json`.
 * A worktree under `.azflow/worktrees/<id>` still resolves to the project goal.
 */
export async function findGoalProject(start: string): Promise<string | null> {
  let current = path.resolve(start);
  for (;;) {
    const candidate = goalPath(current);
    if (await stat(candidate).then(() => true).catch(() => false)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Serialises goal read-modify-write cycles so the hook and the CLI never clobber. */
async function withGoalLock<T>(project: string, action: (goal: GoalState | null) => Promise<T>): Promise<T> {
  const lock = path.join(flowRoot(project), "goal.lock");
  await mkdir(path.dirname(lock), { recursive: true });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      await mkdir(lock);
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      const age = await stat(lock).then((info) => Date.now() - info.mtimeMs).catch(() => 0);
      if (age > LOCK_STALE_MS) {
        await rm(lock, { recursive: true, force: true }).catch(() => undefined);
        continue;
      }
      if (Date.now() > deadline) throw new Error("Goal is locked by another process: " + lock);
      await delay(25);
    }
  }
  try {
    return await action(await readGoal(project));
  } finally {
    await rm(lock, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Runs one atomic read-modify-write of the goal. Null goal means none exists. */
export async function updateGoal(
  project: string,
  update: (goal: GoalState) => GoalState,
): Promise<GoalState | null> {
  return withGoalLock(project, async (goal) => {
    if (goal === null) return null;
    const next = update(goal);
    await writeGoal(project, next);
    return next;
  });
}

function runGit(cwd: string, args: readonly string[]): string {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", windowsHide: true, timeout: 3000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error !== undefined) throw result.error;
  return result.status === 0 && typeof result.stdout === "string" ? result.stdout : "";
}

async function hashFile(file: string): Promise<string> {
  const bytes = await readFile(file).catch(() => null);
  return bytes === null ? "" : createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

async function dirtyPathMarker(file: string): Promise<string> {
  const info = await lstat(file).catch(() => null);
  if (info === null) return "missing";
  if (info.isSymbolicLink()) return "link:" + await readlink(file);
  if (!info.isFile()) return "other";
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function checkoutMarker(directory: string): Promise<string> {
  const status = runGit(directory, ["status", "--porcelain=v1", "-z", "--no-renames", "--untracked-files=all"]);
  const hash = createHash("sha256").update(JSON.stringify([
    runGit(directory, ["rev-parse", "HEAD"]),
    runGit(directory, ["diff", "--cached", "--raw", "--no-abbrev", "--no-renames", "-z"]),
    status,
  ]));
  for (const entry of status.split("\0")) {
    if (entry === "" || entry[1] === " ") continue;
    const file = entry.slice(3);
    hash.update(JSON.stringify([file, await dirtyPathMarker(path.join(directory, file))]));
  }
  return hash.digest("hex");
}

/**
 * Weak evidence of work that does not move HEAD: review reports and pull
 * request comments a reviewer wrote, plus the subject of the newest commit.
 * A run that only produced a review is still a run that advanced.
 */
async function reviewMarker(project: string): Promise<string> {
  const directory = reviewsRoot(project);
  const names = await readdir(directory).catch(() => [] as string[]);
  const reports = names.filter((name) => name.endsWith(".md")).sort().slice(-12);
  const parts: string[] = [];
  for (const name of reports) {
    const file = path.join(directory, name);
    const info = await stat(file).catch(() => null);
    if (info === null) continue;
    // Size and mtime are enough: a rewritten report changes both, and this
    // runs on every pass, so reading twelve files would be the expensive part.
    parts.push(name + ":" + String(info.size) + ":" + String(Math.round(info.mtimeMs)));
  }
  const subject = runGit(project, ["log", "-1", "--format=%H%x00%s"]);
  return createHash("sha256").update(parts.join("\u0000")).update("\u0001").update(subject).digest("hex").slice(0, 16);
}

/**
 * A fingerprint of everything that counts as real progress: the base checkout's
 * HEAD and working tree, the delivery ledger, every live worktree's HEAD and
 * working tree, and the weak evidence of a review. The model's prose does not
 * move it; a commit, an edit, a claim, a review, or a merge does.
 */
export async function progressMarker(project: string): Promise<string> {
  const parts: string[] = [];
  parts.push("base:" + await checkoutMarker(project));
  parts.push("ledger:" + (await hashFile(statePath(project))));
  parts.push("reviews:" + await reviewMarker(project));

  const worktrees = path.join(flowRoot(project), "worktrees");
  const names = await readdir(worktrees).catch(() => [] as string[]);
  for (const name of names.sort()) {
    const dir = path.join(worktrees, name);
    const info = await stat(dir).catch(() => null);
    if (info === null || !info.isDirectory()) continue;
    parts.push("wt:" + name + ":" + await checkoutMarker(dir));
  }
  return createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 32);
}

async function readFlowSafe(project: string): Promise<FlowState | null> {
  return readState(project).catch(() => null);
}

function firstOpenTask(flow: FlowState): { id: string; title: string; status: string; worktree: string | null } | null {
  const openIssue = flow.tasks.find((task) => task.status === "merged-issue-open");
  if (openIssue !== undefined) return { id: openIssue.id, title: openIssue.title, status: openIssue.status, worktree: openIssue.worktree };
  const active = flow.tasks.find((task) => task.status === "active");
  if (active !== undefined) return { id: active.id, title: active.title, status: active.status, worktree: active.worktree };
  const review = flow.tasks.find((task) => task.status === "review");
  if (review !== undefined) return { id: review.id, title: review.title, status: review.status, worktree: review.worktree };
  return null;
}

/** The single next concrete step, preferring the delivery ledger over prose. */
export function nextStepFor(goal: GoalState, flow: FlowState | null): string {
  if (flow !== null) {
    const open = firstOpenTask(flow);
    if (open !== null) {
      if (open.status === "merged-issue-open") {
        return "Run `azflow ship " + open.id + " --verify-issue` to close the merged issue and finish task " + open.id + ".";
      }
      if (open.status === "active") {
        const where = open.worktree === null ? "" : " in " + open.worktree;
        return "Continue task " + open.id + " (\"" + open.title + "\")" + where + ": finish the remaining changes, then `azflow commit`, `azflow review`, `azflow pr`, and `azflow ship " + open.id + "`.";
      }
      return "Finish task " + open.id + " (\"" + open.title + "\"): run the review and merge it with `azflow ship " + open.id + "`.";
    }
    const plan = planWaves(flow, Date.now());
    const readyId = plan.waves[0]?.tasks[0];
    if (readyId !== undefined) {
      const task = flow.tasks.find((candidate) => candidate.id === readyId);
      const title = task === undefined ? "" : " (\"" + task.title + "\")";
      return "Claim and implement the next ready task " + readyId + title + " with `azflow claim " + readyId + "`, then deliver it.";
    }
    if (flow.tasks.length > 0 && flow.tasks.every((task) => task.status === "merged" || task.status === "abandoned")) {
      return "Every recorded task is delivered. Add the next slice of tasks for the objective with `azflow add`, or verify the done-when criteria and complete the goal.";
    }
  }
  if (goal.nextStep !== "") return goal.nextStep;
  return "Take the next concrete, verifiable step toward the objective, and record what changed with `azflow goal note`.";
}

/** The compact goal compass re-injected on every continuation and session start. */
export function goalCompass(goal: GoalState, flow: FlowState | null): string {
  const lines: string[] = [
    (goal.status === "active" ? "ACTIVE GOAL: " : "GOAL: ") + goal.objective,
    "Status: " + goal.status + " | pass " + goal.iteration + " of " + goal.maxIterations + " | no-progress " + goal.noProgress + " of " + goal.maxNoProgress,
  ];
  if (goal.checkpoint !== null) {
    lines.push("Resume from: " + goal.checkpoint.sha.slice(0, 12) + (goal.checkpoint.step === "" ? "" : " - " + goal.checkpoint.step));
  }
  if (goal.retry !== null && goal.retry.count > 0) {
    lines.push("Retrying a transient failure (" + goal.retry.count + " of " + MAX_TRANSIENT_RETRIES + "): " + goal.retry.note);
  }
  if (goal.doneWhen.length === 0) {
    lines.push("Done when: (no explicit criteria; infer them from the objective)");
  } else {
    lines.push("Done when:");
    goal.doneWhen.forEach((criterion, index) => lines.push("  " + (index + 1) + ". " + criterion));
  }
  if (goal.progress.length > 0) {
    lines.push("Recent progress:");
    for (const entry of goal.progress.slice(-5)) {
      const evidence = entry.evidence === "" ? "" : " (" + entry.evidence + ")";
      lines.push("  - [" + entry.iteration + "] " + entry.note + evidence);
    }
  }
  if (goal.blockers.length > 0) {
    lines.push("Blockers on record:");
    for (const blocker of goal.blockers.slice(-3)) lines.push("  - " + blocker);
  }
  lines.push("Next step: " + nextStepFor(goal, flow));
  return lines.join("\n");
}

/** The Stop-time continuation directive. */
export function continuationReason(goal: GoalState, flow: FlowState | null): string {
  return [
    "AZFLOW GOAL RUN - CONTINUE (pass " + goal.iteration + " of " + goal.maxIterations + ").",
    "You are driving one long-horizon goal and you are not finished yet. Do not stop while any done-when criterion is still unmet.",
    "",
    goalCompass(goal, flow),
    "",
    "Do the next step now. Prefer real, verifiable progress (edits, commits, ledger changes) over narration.",
    "After each meaningful step, record it: `azflow goal note \"<what changed>\" --evidence \"<command output or commit sha>\"`.",
    "Only when every done-when criterion is verified true in the current repository and ledger, run `azflow goal complete --summary \"<result>\"` and then give the user the final report.",
    "If the user told you to stop or pause, or only the user can unblock you, run `azflow goal pause --reason \"<why>\"` and explain what you need.",
    "Never invent completion and never repeat a step that already failed; change the approach.",
  ].join("\n");
}

function stallReason(goal: GoalState, flow: FlowState | null): string {
  return [
    "AZFLOW GOAL STALLED: " + goal.maxNoProgress + " passes produced no measurable change to the repository or ledger.",
    "The goal is stalled and will not continue until the user resumes it with `azflow goal resume`.",
    "",
    goalCompass(goal, flow),
    "",
    "Summarize for the user: what is done, what remains, the last real change you made, and the exact blocker.",
    "Then stop. Do not claim progress you did not make.",
  ].join("\n");
}

function budgetReason(goal: GoalState): string {
  return [
    "AZFLOW GOAL PAUSED: the iteration budget of " + goal.maxIterations + " passes is spent.",
    "The goal has been paused so it stops cleanly instead of running without bound.",
    "",
    goalCompass(goal, null),
    "",
    "Give the user a status report: what is done, what remains, and the next step.",
    "To keep going, run `azflow goal extend --by <N>` and then `azflow goal resume`.",
  ].join("\n");
}

/** A review outcome for the task the run is currently delivering. */
export interface ReviewSignal {
  readonly taskId: string;
  readonly round: number;
  readonly score: number;
  readonly verdict: "PASS" | "FAIL";
  readonly findings: readonly string[];
}

export interface AdvanceSignal {
  /** The turn's final assistant message, used to spot a transient failure. */
  readonly reply?: string | null;
}

export interface AdvanceOutcome {
  readonly action: "continue" | "stall" | "pause" | "allow" | "complete";
  readonly reason: string | null;
  readonly goal: GoalState | null;
}

/**
 * Patterns for failures that a retry can plausibly fix. A hard failure (a
 * missing branch, a rejected credential) is deliberately absent: retrying it
 * would burn passes without changing the outcome.
 */
const TRANSIENT_PATTERNS: readonly RegExp[] = [
  /\bETIMEDOUT\b|\bECONNRESET\b|\bECONNREFUSED\b|\bEAI_AGAIN\b|\bENOTFOUND\b/i,
  /socket hang up|connection reset|network error|fetch failed|TLS handshake/i,
  /\b50[234]\b (Bad Gateway|Service Unavailable|Gateway Timeout)|Gateway Timeout/i,
  /rate limit|\b429\b|secondary rate limit/i,
  /checks? (are|is) still (running|pending)|still waiting (on|for) (checks|CI)|CI (is )?(still )?running/i,
  /\bindex\.lock\b|another git process|unable to create '.*\.lock'/i,
  /operation timed out|temporarily unavailable|try again later/i,
];

/** True when the reply describes a failure a fresh attempt could clear. */
export function isTransientFailure(reply: string | null | undefined): boolean {
  if (typeof reply !== "string" || reply.trim() === "") return false;
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(reply));
}

/**
 * An initial budget sized to the work: a small objective gets a small budget,
 * an explicitly large or multi-criterion one gets room. The bar is a starting
 * point, not a cap, because a healthy run may extend itself twice.
 */
export function estimateBudget(objective: string, doneWhen: readonly string[]): number {
  const text = objective.toLowerCase();
  const heavy = /refactor|rewrite|migrat|redesign|overhaul|全量|重构|迁移|批量|多模块|large|multi-|across the/.test(text);
  if (heavy) return 2000;
  if (doneWhen.length === 0) return DEFAULT_MAX_ITERATIONS;
  if (doneWhen.length === 1 && objective.length <= 120) return 120;
  if (doneWhen.length <= 2) return 300;
  return DEFAULT_MAX_ITERATIONS;
}

function headOf(directory: string): string {
  const sha = runGit(directory, ["rev-parse", "HEAD"]).trim();
  return /^[0-9a-f]{7,40}$/.test(sha) ? sha : "";
}

/** The deliverable task the run is on, with its full record. */
function currentTask(flow: FlowState | null): { id: string; worktree: string | null; review: { round: number; score: number; verdict: "PASS" | "FAIL" } | null } | null {
  if (flow === null) return null;
  const order = ["merged-issue-open", "active", "review"];
  for (const status of order) {
    const task = flow.tasks.find((candidate) => candidate.status === status);
    if (task !== undefined) {
      return {
        id: task.id,
        worktree: task.worktree,
        review: task.review === null ? null : { round: task.review.round, score: task.review.score, verdict: task.review.verdict },
      };
    }
  }
  return null;
}

/**
 * Reads the newest review report's finding rows so a repair directive can name
 * the exact issues instead of restating "the review failed".
 */
async function readFindings(project: string, taskId: string, round: number): Promise<string[]> {
  const text = await readFile(path.join(reviewsRoot(project), taskId + "-r" + String(round) + ".md"), "utf8").catch(() => null);
  if (text === null) return [];
  const findings: string[] = [];
  for (const line of text.split("\n")) {
    const row = /^\|\s*(P[0-4])\s*\|([^|]*)\|([^|]*)\|/.exec(line.trim());
    if (row === null) continue;
    const severity = row[1] ?? "";
    const where = (row[2] ?? "").trim();
    const summary = (row[3] ?? "").trim();
    if (summary === "" || /^:?-+:?$/.test(summary)) continue;
    findings.push(severity + " " + where + " - " + summary);
    if (findings.length >= 8) break;
  }
  return findings;
}

async function readReviewSignal(project: string, flow: FlowState | null): Promise<ReviewSignal | null> {
  const task = currentTask(flow);
  if (task === null || task.review === null) return null;
  return {
    taskId: task.id,
    round: task.review.round,
    score: task.review.score,
    verdict: task.review.verdict,
    findings: await readFindings(project, task.id, task.review.round),
  };
}

function completionReason(goal: GoalState, flow: FlowState | null, report: DoneWhenReport): string {
  return [
    "AZFLOW GOAL COMPLETE: every done-when criterion verified against the repository.",
    "",
    describeDoneWhen(report),
    "",
    goalCompass(goal, flow),
    "",
    "The automatic checker treated this goal as finished. Report the result to the user now:",
    "what shipped, the verifying evidence above, and anything left as follow-up.",
    "Do not start new work for this goal; if more is needed, the user starts a new one.",
  ].join("\n");
}

function retryReason(goal: GoalState, flow: FlowState | null, count: number): string {
  const wait = [15, 45, 90][Math.min(count - 1, 2)] ?? 90;
  return [
    "AZFLOW GOAL RUN - TRANSIENT FAILURE RETRY (" + count + " of " + MAX_TRANSIENT_RETRIES + ").",
    "The last pass ended on a failure that is usually temporary: " + (goal.retry?.note ?? "unknown"),
    "",
    "Wait about " + wait + " seconds (for example `Start-Sleep -Seconds " + wait + "`), then retry the",
    "same step once. Do not re-plan the work and do not count this as a stall.",
    "If the retry fails with the same error, change the route: re-read the log, check the",
    "tool's auth/network, or pick an equivalent path before trying again.",
    "",
    goalCompass(goal, flow),
  ].join("\n");
}

function diagnosisReason(goal: GoalState, flow: FlowState | null): string {
  return [
    "AZFLOW GOAL RUN - NO PROGRESS, AUTO-DIAGNOSIS.",
    "The last passes did not change the repository or the ledger. Before this counts as a",
    "stall you get one diagnostic pass:",
    "",
    "1. Read the last failing command's output or the relevant log and quote the real error.",
    "2. Re-run the failing step once; if it fails again, change one variable (command flag,",
    "   dependency version, branch, path) instead of repeating it.",
    "3. Record what you found with `azflow goal note \"<diagnosis>\" --evidence \"<output>\"`.",
    "",
    "If you truly cannot move without the user, run `azflow goal pause --reason \"<why>\"`.",
    "",
    goalCompass(goal, flow),
  ].join("\n");
}

function repairReason(goal: GoalState, flow: FlowState | null, review: ReviewSignal): string {
  const findings = review.findings.length === 0
    ? ["(the report did not parse individual findings; re-read the review report)"]
    : review.findings;
  return [
    "AZFLOW GOAL RUN - AUTO-REPAIR REVIEW (score " + review.score.toFixed(2) + " < 4.80, attempt " + goal.autoRepairs + " of " + MAX_AUTO_REPAIRS + ").",
    "Task " + review.taskId + " round " + review.round + " is close but below the merge bar. Fix the findings,",
    "then re-score the same commit head:",
    "",
    ...findings.map((finding) => "  - " + finding),
    "",
    "Use `azflow review " + review.taskId + "` with the scored input when the fixes are committed.",
    "Address each finding at its root cause; do not restate it in the report.",
    "",
    goalCompass(goal, flow),
  ].join("\n");
}

function humanReviewReason(goal: GoalState, flow: FlowState | null, review: ReviewSignal): string {
  return [
    "AZFLOW GOAL PAUSED: review score " + review.score.toFixed(2) + " is below " + MIN_REPAIRABLE_SCORE.toFixed(2) + ".",
    "A score that low means the approach, not a detail, is being rejected, so an automatic",
    "repair would waste passes. The goal is paused for a human decision.",
    "",
    goalCompass(goal, flow),
    "",
    "Summarize the review findings for the user, propose the change of approach, and stop.",
    "The user can resume with `azflow goal resume` once the direction is agreed.",
  ].join("\n");
}

function repairBudgetReason(goal: GoalState, flow: FlowState | null, review: ReviewSignal): string {
  return [
    "AZFLOW GOAL PAUSED: review still fails at " + review.score.toFixed(2) + " after " + MAX_AUTO_REPAIRS + " automatic repairs.",
    "Another repair round would repeat the same work, so the goal is paused for a human decision.",
    "",
    goalCompass(goal, flow),
    "",
    "Summarize what each repair changed and what still fails, then stop.",
    "The user can resume with `azflow goal resume` after adjusting the plan or the criteria.",
  ].join("\n");
}

/**
 * The Stop-hook decision. Continues an active goal while it is making progress,
 * stalls it once progress stops, and pauses it when the iteration budget is
 * spent. A healthy run extends its own budget, retries a transient failure, and
 * repairs a review that is close to the bar; every repair is bounded and
 * recorded. Any other status, or a missing goal, allows the turn to end.
 */
export async function advanceGoal(project: string, now: number, signal: AdvanceSignal = {}): Promise<AdvanceOutcome> {
  return withGoalLock(project, async (goal) => {
    if (goal === null || goal.status !== "active") return { action: "allow", reason: null, goal };
    const flow = await readFlowSafe(project);
    const marker = await progressMarker(project);
    const changed = goal.lastMarker !== "" && marker !== goal.lastMarker;
    const iteration = goal.iteration + 1;
    const at = nowIso(now);
    const task = currentTask(flow);
    const worktree = task?.worktree === null || task?.worktree === undefined ? project : path.resolve(project, task.worktree);
    const sha = headOf(worktree) || headOf(project);

    const record = (next: GoalState, pass = iteration): GoalState => ({
      ...next,
      iteration: pass,
      lastMarker: marker,
      updatedAt: at,
    });

    // A run that satisfies every machine-checkable criterion is finished, and
    // finishing it here is what keeps the user from having to notice it.
    const checkable = goal.doneWhen.length > 0 && goal.doneWhen.every((criterion) => parseDoneWhen(criterion).kind !== "manual");
    if (checkable && (changed || iteration % 3 === 0)) {
      const report = await verifyDoneWhen(project, goal.doneWhen).catch(() => null);
      if (report !== null && report.allPassed) {
        const completed = record({
          ...goal,
          status: "complete",
          noProgress: 0,
          retry: null,
          summary: goal.summary === "" ? "Complete: every done-when criterion verified." : goal.summary,
          progress: [
            ...goal.progress.slice(-(MAX_PROGRESS_ENTRIES - 1)),
            { at, iteration, note: "(auto) every done-when criterion verified", evidence: sha.slice(0, 12) },
          ],
        });
        await writeGoal(project, completed);
        return { action: "complete", reason: completionReason(completed, flow, report), goal: completed };
      }
    }

    // A healthy run that is about to exhaust its budget extends itself twice
    // before pausing; a run that has already gone quiet is left to pause.
    const healthy = changed || (goal.lastProgressIteration > 0 && iteration - goal.lastProgressIteration <= 10);
    let maxIterations = goal.maxIterations;
    let extensions = goal.extensions;
    const nearingBudget = maxIterations - iteration <= Math.ceil(maxIterations * 0.1);
    if (nearingBudget && extensions < MAX_AUTO_EXTENSIONS && healthy && iteration <= maxIterations) {
      maxIterations += Math.max(50, Math.round(maxIterations * 0.5));
      extensions += 1;
    }

    if (iteration > maxIterations) {
      const paused = record({
        ...goal,
        status: "paused",
        maxIterations,
        extensions,
        iteration: goal.iteration,
        summary: goal.summary === "" ? "Paused: iteration budget reached." : goal.summary,
        blockers: pushBlocker(goal.blockers, "Iteration budget reached (" + maxIterations + ")."),
      }, goal.iteration);
      await writeGoal(project, paused);
      return { action: "pause", reason: budgetReason(paused), goal: paused };
    }

    // A transient failure is retried without spending the no-progress budget,
    // so a flaky network cannot stall a run that is otherwise healthy.
    const transient = isTransientFailure(signal.reply);
    const retryCount = transient ? (goal.retry?.count ?? 0) + 1 : 0;
    if (transient && retryCount <= MAX_TRANSIENT_RETRIES) {
      const note = (signal.reply ?? "").replace(/\s+/g, " ").trim().slice(-180);
      const next = record({
        ...goal,
        maxIterations,
        extensions,
        noProgress: goal.noProgress,
        retry: { count: retryCount, at, note },
      });
      await writeGoal(project, next);
      return { action: "continue", reason: retryReason(next, flow, retryCount), goal: next };
    }

    const noProgress = changed ? 0 : goal.noProgress + 1;
    const progress = changed
      ? [
          ...goal.progress.slice(-(MAX_PROGRESS_ENTRIES - 1)),
          { at, iteration, note: "(auto) repository or ledger state advanced", evidence: marker.slice(0, 12) },
        ]
      : goal.progress;
    const checkpoint = changed
      ? { sha: sha === "" ? goal.checkpoint?.sha ?? "" : sha, step: nextStepFor(goal, flow), at }
      : goal.checkpoint;

    if (noProgress >= goal.maxNoProgress) {
      if (!goal.diagnosed) {
        const next = record({
          ...goal,
          maxIterations,
          extensions,
          noProgress: Math.max(0, goal.maxNoProgress - DIAGNOSE_GRACE),
          retry: null,
          diagnosed: true,
          progress,
          checkpoint,
          blockers: pushBlocker(goal.blockers, "Auto-diagnosis after " + goal.maxNoProgress + " passes without progress."),
        });
        await writeGoal(project, next);
        return { action: "continue", reason: diagnosisReason(next, flow), goal: next };
      }
      const stalled = record({
        ...goal,
        status: "stalled",
        maxIterations,
        extensions,
        noProgress,
        retry: null,
        progress,
        checkpoint,
        blockers: pushBlocker(goal.blockers, "No measurable progress across " + goal.maxNoProgress + " passes."),
      });
      await writeGoal(project, stalled);
      return { action: "stall", reason: stallReason(stalled, flow), goal: stalled };
    }

    // A review that lands just under the bar is repaired automatically, twice
    // at most, before the run asks for a human decision.
    const review = await readReviewSignal(project, flow);
    if (review !== null && review.verdict === "FAIL" && review.round > goal.lastRepairRound) {
      if (review.score < MIN_REPAIRABLE_SCORE) {
        const paused = record({
          ...goal,
          status: "paused",
          maxIterations,
          extensions,
          noProgress,
          progress,
          checkpoint,
          lastRepairRound: review.round,
          blockers: pushBlocker(goal.blockers, "Review score " + review.score.toFixed(2) + " below " + MIN_REPAIRABLE_SCORE.toFixed(2) + "."),
        });
        await writeGoal(project, paused);
        return { action: "pause", reason: humanReviewReason(paused, flow, review), goal: paused };
      }
      if (goal.autoRepairs < MAX_AUTO_REPAIRS) {
        const next = record({
          ...goal,
          maxIterations,
          extensions,
          noProgress,
          retry: null,
          diagnosed: changed ? false : goal.diagnosed,
          progress,
          checkpoint,
          autoRepairs: goal.autoRepairs + 1,
          lastRepairRound: review.round,
        });
        await writeGoal(project, next);
        return { action: "continue", reason: repairReason(next, flow, review), goal: next };
      }
      const paused = record({
        ...goal,
        status: "paused",
        maxIterations,
        extensions,
        noProgress,
        progress,
        checkpoint,
        lastRepairRound: review.round,
        blockers: pushBlocker(goal.blockers, "Review repair budget spent (" + MAX_AUTO_REPAIRS + " rounds)."),
      });
      await writeGoal(project, paused);
      return { action: "pause", reason: repairBudgetReason(paused, flow, review), goal: paused };
    }

    const next = record({
      ...goal,
      maxIterations,
      extensions,
      noProgress,
      retry: null,
      diagnosed: changed ? false : goal.diagnosed,
      progress,
      checkpoint,
      lastProgressAt: changed ? at : goal.lastProgressAt,
      lastProgressIteration: changed ? iteration : goal.lastProgressIteration,
    });
    await writeGoal(project, next);
    const extension = extensions > goal.extensions ? " Budget auto-extended to " + maxIterations + "." : "";
    return { action: "continue", reason: continuationReason(next, flow) + extension, goal: next };
  });
}

export interface CreateGoalInput {
  readonly objective: string;
  readonly doneWhen: readonly string[];
  readonly maxIterations?: number;
  readonly maxNoProgress?: number;
  readonly nextStep?: string;
  /** Command patterns the guard may auto-approve inside this project. */
  readonly allowedCommands?: readonly string[];
}

/** Creates and activates a fresh goal, refusing to clobber a still-active one. */
export async function createGoal(
  project: string,
  input: CreateGoalInput,
  options: { readonly replace?: boolean } = {},
): Promise<GoalState> {
  const objective = clip(input.objective);
  if (objective === "") throw new Error("A goal needs a non-empty objective.");
  const doneWhen = input.doneWhen.map((entry) => clip(entry)).filter((entry) => entry !== "");
  if (doneWhen.length === 0) throw new Error("A goal needs at least one --done-when criterion so completion is verifiable.");
  const maxIterations = input.maxIterations ?? estimateBudget(objective, doneWhen);
  const maxNoProgress = input.maxNoProgress ?? DEFAULT_MAX_NO_PROGRESS;
  if (!isPositiveInt(maxIterations)) throw new Error("--max-iterations must be a positive integer.");
  if (!isPositiveInt(maxNoProgress)) throw new Error("--max-no-progress must be a positive integer.");

  const marker = await progressMarker(project);
  const at = nowIso(Date.now());
  const goal: GoalState = {
    schemaVersion: GOAL_SCHEMA_VERSION,
    objective,
    doneWhen,
    status: "active",
    iteration: 0,
    maxIterations,
    maxNoProgress,
    noProgress: 0,
    nextStep: clip(input.nextStep ?? ""),
    progress: [],
    blockers: [],
    lastMarker: marker,
    lastProgressAt: "",
    lastProgressIteration: 0,
    summary: "",
    createdAt: at,
    updatedAt: at,
    checkpoint: null,
    retry: null,
    extensions: 0,
    autoRepairs: 0,
    lastRepairRound: 0,
    diagnosed: false,
    allowedCommands: readAllowedCommands(input.allowedCommands ?? []),
  };

  return withGoalLock(project, async (existing) => {
    if (existing !== null && existing.status === "active" && !options.replace) {
      throw new Error("An active goal already exists. Finish it, run `azflow goal abandon`, or pass --replace.");
    }
    await writeGoal(project, goal);
    return goal;
  });
}
