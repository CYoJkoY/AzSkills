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
 */

import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { lstat, mkdir, readFile, readdir, readlink, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { flowRoot, isRecord, planWaves, readState, statePath } from "./state.ts";
import type { FlowState } from "./state.ts";

export const GOAL_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_ITERATIONS = 1000;
export const DEFAULT_MAX_NO_PROGRESS = 4;
export const MAX_PROGRESS_ENTRIES = 60;
export const MAX_BLOCKERS = 20;
export const MAX_FIELD_CHARS = 4000;

export type GoalStatus = "active" | "paused" | "complete" | "abandoned" | "stalled";

export interface GoalProgress {
  readonly at: string;
  readonly iteration: number;
  readonly note: string;
  readonly evidence: string;
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
 * A fingerprint of everything that counts as real progress: the base checkout's
 * HEAD and working tree, the delivery ledger, and every live worktree's HEAD and
 * working tree. The model's prose does not move it; a commit, an edit, a claim,
 * a review, or a merge does.
 */
export async function progressMarker(project: string): Promise<string> {
  const parts: string[] = [];
  parts.push("base:" + await checkoutMarker(project));
  parts.push("ledger:" + (await hashFile(statePath(project))));

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

export interface AdvanceOutcome {
  readonly action: "continue" | "stall" | "pause" | "allow";
  readonly reason: string | null;
  readonly goal: GoalState | null;
}

/**
 * The Stop-hook decision. Continues an active goal while it is making progress,
 * stalls it once progress stops, and pauses it when the iteration budget is
 * spent. Any other status, or a missing goal, allows the turn to end.
 */
export async function advanceGoal(project: string, now: number): Promise<AdvanceOutcome> {
  return withGoalLock(project, async (goal) => {
    if (goal === null || goal.status !== "active") return { action: "allow", reason: null, goal };
    const flow = await readFlowSafe(project);
    const marker = await progressMarker(project);
    const changed = goal.lastMarker !== "" && marker !== goal.lastMarker;
    const iteration = goal.iteration + 1;
    const at = nowIso(now);

    if (iteration > goal.maxIterations) {
      const paused: GoalState = {
        ...goal,
        status: "paused",
        iteration: goal.iteration,
        lastMarker: marker,
        updatedAt: at,
        summary: goal.summary === "" ? "Paused: iteration budget reached." : goal.summary,
        blockers: pushBlocker(goal.blockers, "Iteration budget reached (" + goal.maxIterations + ")."),
      };
      await writeGoal(project, paused);
      return { action: "pause", reason: budgetReason(paused), goal: paused };
    }

    const noProgress = changed ? 0 : goal.noProgress + 1;
    if (noProgress >= goal.maxNoProgress) {
      const stalled: GoalState = {
        ...goal,
        status: "stalled",
        iteration,
        noProgress,
        lastMarker: marker,
        updatedAt: at,
        blockers: pushBlocker(goal.blockers, "No measurable progress across " + goal.maxNoProgress + " passes."),
      };
      await writeGoal(project, stalled);
      return { action: "stall", reason: stallReason(stalled, flow), goal: stalled };
    }

    const progress = changed
      ? [
          ...goal.progress.slice(-(MAX_PROGRESS_ENTRIES - 1)),
          { at, iteration, note: "(auto) repository or ledger state advanced", evidence: marker.slice(0, 12) },
        ]
      : goal.progress;
    const next: GoalState = {
      ...goal,
      iteration,
      noProgress,
      lastMarker: marker,
      lastProgressAt: changed ? at : goal.lastProgressAt,
      lastProgressIteration: changed ? iteration : goal.lastProgressIteration,
      progress,
      updatedAt: at,
    };
    await writeGoal(project, next);
    return { action: "continue", reason: continuationReason(next, flow), goal: next };
  });
}

export interface CreateGoalInput {
  readonly objective: string;
  readonly doneWhen: readonly string[];
  readonly maxIterations?: number;
  readonly maxNoProgress?: number;
  readonly nextStep?: string;
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
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
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
  };

  return withGoalLock(project, async (existing) => {
    if (existing !== null && existing.status === "active" && !options.replace) {
      throw new Error("An active goal already exists. Finish it, run `azflow goal abandon`, or pass --replace.");
    }
    await writeGoal(project, goal);
    return goal;
  });
}
