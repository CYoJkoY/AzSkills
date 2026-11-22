#!/usr/bin/env node
/*
 * azflow - the delivery loop command line.
 *
 * One agent owns judgment and execution. This tool owns the shared record:
 * which tasks exist, which touch scopes are leased, which worktree each task
 * uses, how a review scored, and whether an auto-merge may proceed. It never
 * spawns a sub-agent; concurrency comes from independent task branches.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  currentBranch,
  defaultBranch,
  diffAddedLines,
  diffFiles,
  ghAvailable,
  git,
  issueClose,
  issueCreate,
  issueNumberFromUrl,
  prChecks,
  prComment,
  prCreate,
  prMerge,
  prReady,
  prView,
  remoteBranchExists,
  revParse,
  worktreeAddNew,
  worktreeRemove,
} from "./externals.ts";
import { mergeFindings, scanDiff } from "./scan.ts";
import type { Finding, ReviewInput, ScoreResult } from "./score.ts";
import { DEFAULT_POLICY, renderReport, scoreReview } from "./score.ts";
import {
  DEFAULT_CONFIG,
  findTask,
  findTaskByPr,
  flowRoot,
  issueLease,
  leaseAlive,
  makeTask,
  newTaskId,
  planWaves,
  readState,
  requireState,
  reviewsRoot,
  slugify,
  statePath,
  touch,
  touchConflict,
  withLock,
  worktreesRoot,
  writeState,
} from "./state.ts";
import type { FlowState, ReviewRecord, Task } from "./state.ts";

interface Args {
  readonly command: string;
  readonly positionals: string[];
  readonly options: Map<string, string[]>;
  readonly flags: Set<string>;
}

function parseArgs(argv: readonly string[]): Args {
  const options = new Map<string, string[]>();
  const flags = new Set<string>();
  const positionals: string[] = [];
  let command = "";
  let index = 0;
  while (index < argv.length) {
    const token = argv[index];
    if (token === undefined) break;
    if (token.startsWith("--")) {
      const name = token.slice(2);
      const next = argv[index + 1];
      if (next !== undefined && !next.startsWith("--")) {
        const list = options.get(name) ?? [];
        list.push(next);
        options.set(name, list);
        index += 2;
        continue;
      }
      flags.add(name);
      index += 1;
      continue;
    }
    if (command === "") command = token;
    else positionals.push(token);
    index += 1;
  }
  return { command, positionals, options, flags };
}

const lastValue = (args: Args, name: string): string | undefined => {
  const list = args.options.get(name);
  return list === undefined || list.length === 0 ? undefined : list[list.length - 1];
};

const allValues = (args: Args, name: string): string[] => args.options.get(name) ?? [];

const projectRoot = (args: Args): string => path.resolve(lastValue(args, "project") ?? process.cwd());

const nowIso = (): string => new Date().toISOString();

const print = (value: string): void => {
  process.stdout.write(value.endsWith("\n") ? value : value + "\n");
};

const printJson = (value: unknown): void => {
  print(JSON.stringify(value, null, 2));
};

function assertGitRepo(project: string): void {
  const root = git(["rev-parse", "--show-toplevel"], { cwd: project });
  if (root.status !== 0) throw new Error(project + " is not inside a git repository");
}

async function ensureIgnored(project: string): Promise<void> {
  const directory = flowRoot(project);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, ".gitignore"), "*\n", "utf8");
}

async function init(args: Args): Promise<void> {
  const project = projectRoot(args);
  assertGitRepo(project);
  const existing = await readState(project);
  if (existing !== null) {
    print("azflow already initialized at " + statePath(project));
    printJson({ base: existing.config.base, tasks: existing.tasks.length });
    return;
  }
  await ensureIgnored(project);
  const base = lastValue(args, "base") ?? defaultBranch(project);
  const state: FlowState = {
    schemaVersion: 1,
    config: {
      ...DEFAULT_CONFIG,
      base,
      maxParallel: Number(lastValue(args, "max-parallel") ?? DEFAULT_CONFIG.maxParallel),
      autonomy: lastValue(args, "autonomy") === "manual" ? "manual" : "full",
    },
    sequence: 0,
    tasks: [],
  };
  await writeState(project, state);
  print("Initialized .azflow at " + flowRoot(project));
  printJson(state.config);
}

async function add(args: Args): Promise<void> {
  const project = projectRoot(args);
  const title = args.positionals.join(" ").trim();
  if (title === "") throw new Error("add requires a task title");
  const touchScopes = allValues(args, "touch").map((value) => value.replace(/\\/g, "/"));
  if (touchScopes.length === 0) throw new Error("add requires at least one --touch glob");
  const result = await withLock(project, async (state) => {
    const id = newTaskId(state);
    const task = makeTask(id, title, touchScopes);
    task.dependsOn = allValues(args, "dep");
    const issue = lastValue(args, "issue");
    task.issue = issue === undefined ? null : Number(issue);
    task.notes = lastValue(args, "notes") ?? "";
    for (const dependency of task.dependsOn) findTask(state, dependency);
    state.tasks.push(task);
    return task;
  });
  printJson(result);
}

/** Deterministic default issue body, so creating an issue needs no prompt. */
function issueBody(task: Task): string {
  const dependencies =
    task.dependsOn.length === 0 ? "None" : task.dependsOn.map((id) => "- " + id).join("\n");
  return [
    "Task: " + task.id,
    "",
    "## Goal",
    "",
    task.notes.trim() === "" ? task.title : task.notes.trim(),
    "",
    "## Touch scopes",
    "",
    ...task.touch.map((scope) => "- `" + scope + "`"),
    "",
    "## Dependencies",
    "",
    dependencies,
    "",
    "## Acceptance",
    "",
    "- Every changed file stays inside the declared touch scopes.",
    "- The project verification command exits 0 and its output is recorded in the review.",
    "- The review scores at or above the configured threshold at the pull request head.",
  ].join("\n");
}

/** Deterministic default pull request body, linked to the issue when one exists. */
function pullRequestBody(task: Task): string {
  const lines = [
    task.issue === null ? "" : "Closes #" + String(task.issue),
    "",
    "## Summary",
    "",
    task.notes.trim() === "" ? task.title : task.notes.trim(),
    "",
    "## Touch scopes",
    "",
    ...task.touch.map((scope) => "- `" + scope + "`"),
    "",
    "## Verification",
    "",
    "Recorded by `azflow review` in the review report on this pull request.",
  ];
  return lines.join("\n").replace(/^\n+/, "");
}

function bodyFromArgs(args: Args, project: string, fallback: string): Promise<string> {
  const file = lastValue(args, "body-file");
  if (file !== undefined) return readFile(path.resolve(project, file), "utf8");
  const inline = lastValue(args, "body");
  return Promise.resolve(inline ?? fallback);
}

async function issue(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("issue requires a task id");
  const state = await requireState(project);
  const task = findTask(state, id);
  if (task.issue !== null) throw new Error(id + " already has issue #" + String(task.issue));
  const body = await bodyFromArgs(args, project, issueBody(task));
  const url = issueCreate(project, { title: task.title, body, labels: allValues(args, "label") });
  const number = issueNumberFromUrl(url);
  if (number === null) throw new Error("could not read the issue number from " + url);
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, id);
    stored.issue = number;
    touch(stored);
  });
  printJson({ task: id, issue: number, url });
}

async function openPullRequest(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("pr requires a task id");
  const state = await requireState(project);
  const task = findTask(state, id);
  if (task.branch === null) throw new Error(id + " has no branch; run 'azflow claim " + id + "' first");
  if (task.pr !== null) throw new Error(id + " already has PR #" + String(task.pr));
  if (!remoteBranchExists(project, state.config.remote, task.branch)) {
    throw new Error("push " + task.branch + " to " + state.config.remote + " before opening a pull request");
  }
  const body = await bodyFromArgs(args, project, pullRequestBody(task));
  const draft = !args.flags.has("ready");
  const url = prCreate(project, {
    title: task.title,
    body,
    base: state.config.base,
    head: task.branch,
    draft,
  });
  const number = issueNumberFromUrl(url);
  if (number === null) throw new Error("could not read the pull request number from " + url);
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, id);
    stored.pr = number;
    touch(stored);
  });
  printJson({ task: id, pr: number, draft, url });
}

async function ready(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("ready requires a task id");
  const state = await requireState(project);
  const task = findTask(state, id);
  if (task.pr === null) throw new Error(id + " has no pull request");
  prReady(project, task.pr);
  printJson({ task: id, pr: task.pr, draft: false });
}

async function plan(args: Args): Promise<void> {
  const project = projectRoot(args);
  const state = await requireState(project);
  const plan = planWaves(state, Date.now());
  if (args.flags.has("json")) {
    printJson(plan);
    return;
  }
  print("Admission waves (demand-driven, touch-scope disjoint)");
  for (const wave of plan.waves) print("  wave " + String(wave.index) + ": " + wave.tasks.join(", "));
  if (plan.active.length > 0) print("  leased: " + plan.active.join(", "));
  for (const item of plan.blocked) print("  blocked " + item.id + ": " + item.reason);
  for (const conflict of plan.conflicts) print("  overlap " + conflict);
  if (plan.waves.length === 0 && plan.blocked.length === 0) print("  no planned tasks");
}

async function claim(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("claim requires a task id");
  const owner = lastValue(args, "agent") ?? "primary";
  const created = await withLock(project, async (state) => {
    const task = findTask(state, id);
    const now = Date.now();
    const pending = task.dependsOn.filter((dependency) => findTask(state, dependency).status !== "merged");
    if (pending.length > 0) {
      throw new Error(id + " depends on unmerged " + pending.join(", "));
    }
    const active = state.tasks.filter(
      (other) => other.id !== task.id && other.status === "active" && leaseAlive(other.lease, now),
    );
    if (task.status !== "active" && active.length >= state.config.maxParallel) {
      throw new Error(
        "parallel limit reached (" + String(state.config.maxParallel) + " leases held by " +
          active.map((other) => other.id).join(", ") + ")",
      );
    }
    for (const other of state.tasks) {
      if (other.id === task.id) continue;
      if (other.status !== "active" || !leaseAlive(other.lease, now)) continue;
      const overlap = touchConflict(other.touch, task.touch);
      if (overlap !== null) throw new Error(id + " conflicts with leased task " + other.id + " on " + overlap);
    }
    if (task.status === "merged") throw new Error(id + " is already merged");
    const base = state.config.base;
    const branch = task.branch ?? "issue/" + id.toLowerCase() + "-" + slugify(task.title);
    const directory = task.worktree ?? path.join(worktreesRoot(project), id);
    await ensureIgnored(project);
    if (task.worktree === null) {
      worktreeAddNew(project, directory, branch, base);
      task.branch = branch;
      task.worktree = directory;
    }
    task.status = "active";
    issueLease(task, owner, state.config.leaseTtlMinutes);
    touch(task);
    return { id: task.id, branch, worktree: directory, lease: task.lease, owner };
  });
  printJson(created);
}

async function status(args: Args): Promise<void> {
  const project = projectRoot(args);
  const state = await requireState(project);
  const now = Date.now();
  const view = state.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    title: task.title,
    touch: task.touch,
    issue: task.issue,
    pr: task.pr,
    branch: task.branch,
    leased: leaseAlive(task.lease, now),
    owner: task.lease?.owner ?? null,
    score: task.review?.score ?? null,
    verdict: task.review?.verdict ?? null,
  }));
  if (args.flags.has("json")) {
    printJson({ config: state.config, tasks: view });
    return;
  }
  print("base=" + state.config.base + " autonomy=" + state.config.autonomy + " threshold=" + String(state.config.reviewThreshold));
  for (const item of view) {
    const review = item.verdict === null || item.score === null ? "" : " review=" + item.verdict + " " + item.score.toFixed(2);
    print("  " + item.id + " [" + item.status + "] " + item.title + (item.leased ? " lease=" + String(item.owner) : "") + review);
  }
  if (view.length === 0) print("  no tasks");
}

function readReviewInput(raw: unknown): ReviewInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("review input must be a JSON object");
  }
  return raw as ReviewInput;
}

async function review(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("review requires a task id");
  const inputFile = lastValue(args, "input");
  if (inputFile === undefined) throw new Error("review requires --input <review.json>");
  const rawText = await readFile(path.resolve(project, inputFile), "utf8");
  const input = readReviewInput(JSON.parse(rawText) as unknown);
  const state = await requireState(project);
  const task = findTask(state, id);
  const pr = lastValue(args, "pr");
  if (pr !== undefined) task.pr = Number(pr);
  const base = lastValue(args, "base") ?? state.config.base;

  // A review must be grounded in a real worktree and the mechanical scanner.
  // Trusting a model-supplied file list, or letting the scan be skipped, would
  // let a review hide defects and claim coverage it never performed.
  if (task.worktree === null) {
    throw new Error("review requires a claimed worktree; run 'azflow claim " + id + "' first");
  }
  const diff: string[] = diffFiles(task.worktree, base);
  const reviewed: string[] = Array.isArray(input.reviewedFiles) ? input.reviewedFiles : [];
  const scanned = scanDiff(diffAddedLines(task.worktree, base), {
    frameworkAllowlist: state.config.allowFrameworks,
  });
  const findings: Finding[] = mergeFindings(
    Array.isArray(input.findings) ? input.findings : [],
    scanned,
  );
  // A review only counts for the commit it actually saw. Resolve the real head
  // and reject a record that names a different commit, so an older or invented
  // SHA cannot be scored and then shipped.
  const actualHead = revParse(task.worktree, "HEAD");
  if (input.headSha !== "" && input.headSha !== actualHead) {
    throw new Error(
      "review headSha " + input.headSha + " does not match the current head " + actualHead,
    );
  }
  // Rounds advance one at a time, and a later round must carry the prior round's
  // recorded score. This stops a re-rolled or skipped round from jumping the
  // score past what the resolved findings can justify.
  const prior = task.review;
  if (prior === null) {
    if (input.round !== 1) {
      throw new Error("the first review of " + id + " must be round 1");
    }
  } else {
    if (input.round !== prior.round + 1) {
      throw new Error(
        "review round must advance by one: last recorded round " + String(prior.round) +
          ", claimed " + String(input.round),
      );
    }
    if (input.previous === null || input.previous === undefined) {
      throw new Error(
        "round " + String(input.round) + " must include a previous record (score, resolved) from round " +
          String(prior.round),
      );
    }
    if (input.previous.score !== prior.score) {
      throw new Error(
        "previous.score " + String(input.previous.score) + " does not match recorded round " +
          String(prior.round) + " score " + String(prior.score),
      );
    }
  }
  const headSha = actualHead;
  const scoredInput: ReviewInput = {
    ...input,
    diffFiles: diff,
    reviewedFiles: reviewed,
    findings,
    headSha,
  };
  const result = scoreReview(scoredInput, { ...DEFAULT_POLICY, threshold: state.config.reviewThreshold });
  const at = nowIso();
  const directory = reviewsRoot(project);
  await mkdir(directory, { recursive: true });
  const record: ReviewRecord = {
    headSha: scoredInput.headSha,
    round: scoredInput.round,
    score: result.score,
    verdict: result.verdict,
    at,
  };
  const meta = {
    taskId: task.id,
    issue: task.issue,
    previousHeadSha: task.review === null ? null : task.review.headSha,
    reviewedAt: at,
    findings,
    headSha: scoredInput.headSha,
    carryOver: scoredInput.carryOver,
    resolved: scoredInput.previous === null || scoredInput.previous === undefined ? [] : scoredInput.previous.resolved,
    dimensions: scoredInput.dimensions,
  };
  const report = renderReport(result, meta);
  await writeFile(
    path.join(directory, task.id + "-r" + String(scoredInput.round) + ".json"),
    JSON.stringify({ input: scoredInput, result }, null, 2) + "\n",
    "utf8",
  );
  await writeFile(path.join(directory, task.id + "-r" + String(scoredInput.round) + ".md"), report + "\n", "utf8");
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, task.id);
    if (task.pr !== null) stored.pr = task.pr;
    stored.review = record;
    if (stored.status !== "merged") stored.status = "review";
    touch(stored);
  });
  if (args.flags.has("post") && task.pr !== null) prComment(project, task.pr, report);
  if (args.flags.has("json")) {
    printJson({ result, record, report });
  } else {
    print(report);
  }
  if (result.verdict !== "PASS") process.exitCode = 2;
}

interface GateRow {
  readonly gate: string;
  readonly pass: boolean;
  readonly detail: string;
}

const BLOCKING_LABELS = ["do-not-merge", "blocked", "wip", "needs-decision"];

async function ship(args: Args): Promise<void> {
  const project = projectRoot(args);
  const state = await requireState(project);
  const explicitPr = lastValue(args, "pr");
  const id = args.positionals[0];
  const task = explicitPr !== undefined
    ? findTaskByPr(state, Number(explicitPr)) ?? (id === undefined ? null : findTask(state, id))
    : id === undefined
      ? null
      : findTask(state, id);
  if (task === null) throw new Error("ship requires a task id or --pr");
  const prNumber = task.pr ?? (explicitPr === undefined ? null : Number(explicitPr));
  if (prNumber === null) throw new Error(task.id + " has no pull request; pass --pr");
  const pr = prView(project, prNumber);
  const checks = prChecks(project, prNumber);
  const gates: GateRow[] = [];
  const review = task.review;
  gates.push({
    gate: "review-pass",
    pass: review !== null && review.verdict === "PASS",
    detail: review === null ? "no review record" : review.verdict + " at " + review.score.toFixed(2),
  });
  gates.push({
    gate: "review-score",
    pass: review !== null && review.score >= state.config.reviewThreshold,
    detail: review === null ? "no score" : String(review.score.toFixed(2)) + " >= " + state.config.reviewThreshold.toFixed(2),
  });
  gates.push({
    gate: "review-head",
    pass: review !== null && review.headSha === pr.headRefOid,
    detail: review === null ? "no reviewed head" : review.headSha + " vs " + pr.headRefOid,
  });
  gates.push({
    gate: "ci-green",
    pass: checks.ok,
    detail: checks.ok ? String(checks.total) + " checks green" : "failing=" + checks.failing.join(",") + " pending=" + checks.pending.join(","),
  });
  gates.push({
    gate: "mergeable",
    pass: pr.mergeable === "MERGEABLE" && pr.mergeStateStatus !== "DIRTY",
    detail: pr.mergeable + " / " + pr.mergeStateStatus,
  });
  gates.push({
    gate: "base-unchanged",
    pass: pr.baseRefName === state.config.base,
    detail: pr.baseRefName + " vs " + state.config.base,
  });
  const blocking = pr.labels.filter((label) => BLOCKING_LABELS.includes(label));
  gates.push({
    gate: "no-blocking-label",
    pass: blocking.length === 0,
    detail: blocking.length === 0 ? "none" : blocking.join(", "),
  });
  gates.push({
    gate: "not-draft",
    pass: !pr.isDraft,
    detail: pr.isDraft ? "draft" : "ready",
  });
  gates.push({
    gate: "pr-open",
    pass: pr.state === "OPEN",
    detail: pr.state,
  });
  gates.push({
    gate: "autonomy",
    pass: state.config.autonomy === "full",
    detail: state.config.autonomy,
  });
  const failed = gates.filter((gate) => !gate.pass);
  const outcome = { task: task.id, pr: prNumber, headSha: pr.headRefOid, gates, failed: failed.map((gate) => gate.gate), merged: false };
  if (args.flags.has("json")) printJson(outcome);
  else {
    print("Ship gates for " + task.id + " / PR #" + String(prNumber) + " @ " + pr.headRefOid);
    for (const gate of gates) print("  " + (gate.pass ? "PASS" : "FAIL") + " " + gate.gate + ": " + gate.detail);
  }
  if (args.flags.has("dry-run")) return;
  if (failed.length > 0) {
    process.exitCode = 2;
    return;
  }
  if (!args.flags.has("json")) {
    print("Merging PR #" + String(prNumber) + " with " + state.config.mergeStrategy);
  }
  // A live worktree pins the branch ref; free it so --delete-branch cannot fail.
  const worktree = task.worktree;
  if (worktree !== null) {
    try {
      worktreeRemove(project, worktree, true);
    } catch {
      // Keep going; branch cleanup may warn but won't block merge.
    }
  }
  prMerge(project, prNumber, state.config.mergeStrategy, true);
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, task.id);
    stored.status = "merged";
    stored.pr = prNumber;
    if (stored.worktree !== null) {
      stored.worktree = null;
    }
    touch(stored);
  });
  if (task.issue !== null) issueClose(project, task.issue, "Merged as PR #" + String(prNumber) + ".");
  const fetched = git(["fetch", state.config.remote, "--prune"], { cwd: project });
  let synced = false;
  if (fetched.status === 0) {
    const co = git(["checkout", state.config.base], { cwd: project });
    if (co.status === 0) {
      const pull = git(["pull", "--ff-only", state.config.remote, state.config.base], { cwd: project });
      synced = pull.status === 0;
    }
  }
  if (args.flags.has("json")) printJson({ ...outcome, merged: true, synced });
  else {
    if (synced) {
      print("Merged and synced " + state.config.base);
    } else {
      print("Merged PR #" + String(prNumber) + " but could not fast-forward local " + state.config.base + "; run git pull manually.");
      process.exitCode = 1;
    }
  }
}

async function recover(args: Args): Promise<void> {
  const project = projectRoot(args);
  const state = await requireState(project);
  const now = Date.now();
  const reclaimed: string[] = [];
  const revive = await withLock(project, async (state) => {
    for (const task of state.tasks) {
      if (task.status !== "active") continue;
      if (leaseAlive(task.lease, now)) continue;
      task.lease = null;
      task.status = "planned";
      touch(task);
      reclaimed.push(task.id);
    }
    return reclaimed;
  });
  const directory = worktreesRoot(project);
  let orphans: string[] = [];
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const owned = new Set(state.tasks.map((task) => (task.worktree === null ? "" : path.basename(task.worktree))));
    orphans = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((name) => !owned.has(name));
  } catch {
    orphans = [];
  }
  if (args.flags.has("force")) {
    for (const name of orphans) {
      worktreeRemove(project, path.join(directory, name), true);
    }
  }
  printJson({ reclaimed: revive, orphanWorktrees: orphans, removed: args.flags.has("force") });
}

async function doctor(args: Args): Promise<void> {
  const project = projectRoot(args);
  const checks: GateRow[] = [];
  checks.push({ gate: "node", pass: Number(process.versions.node.split(".")[0]) >= 22, detail: process.versions.node });
  const repo = git(["rev-parse", "--show-toplevel"], { cwd: project });
  checks.push({ gate: "git", pass: repo.status === 0, detail: repo.status === 0 ? repo.stdout.trim() : repo.stderr.trim() });
  const gh = ghAvailable(project);
  checks.push({ gate: "gh-auth", pass: gh, detail: gh ? "authenticated" : "run gh auth login" });
  const state = await readState(project);
  checks.push({ gate: "state", pass: state !== null, detail: state === null ? "run azflow init" : String(state.tasks.length) + " tasks" });
  if (state !== null) {
    const branch = currentBranch(project);
    checks.push({
      gate: "base-branch",
      pass: branch !== state.config.base,
      detail: branch === state.config.base ? "on base branch " + branch : branch,
    });
  }
  const failed = checks.filter((check) => !check.pass);
  if (args.flags.has("json")) printJson({ checks, failed: failed.map((check) => check.gate) });
  else {
    for (const check of checks) print((check.pass ? "PASS " : "FAIL ") + check.gate + ": " + check.detail);
  }
  if (failed.length > 0) process.exitCode = 2;
}

function help(): void {
  print(
    [
      "azflow - single-agent delivery loop",
      "",
      "Usage:",
      "  azflow init [--base main] [--max-parallel 3] [--autonomy full|manual] [--project PATH]",
      "  azflow add \"<title>\" --touch <glob> [--touch <glob>] [--dep T-0001] [--issue N]",
      "  azflow issue <task> [--body <text>|--body-file <path>] [--label <name>]",
      "  azflow pr <task> [--ready] [--body <text>|--body-file <path>]",
      "  azflow ready <task>",
      "  azflow plan [--json]",
      "  azflow claim <task> [--agent <name>]",
      "  azflow status [--json]",
      "  azflow review <task> --input <review.json> [--scan] [--post] [--pr N] [--json]",
      "  azflow ship <task>|--pr <n> [--dry-run] [--json]",
      "  azflow recover [--force]",
      "  azflow doctor [--json]",
      "",
      "Ledger: .azflow/state.json (local, git-ignored). GitHub Issue/PR stays the shared record.",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "init": await init(args); break;
    case "add": await add(args); break;
    case "issue": await issue(args); break;
    case "pr": await openPullRequest(args); break;
    case "ready": await ready(args); break;
    case "plan": await plan(args); break;
    case "claim": await claim(args); break;
    case "status": await status(args); break;
    case "review": await review(args); break;
    case "ship": await ship(args); break;
    case "recover": await recover(args); break;
    case "doctor": await doctor(args); break;
    case "help":
    case "--help":
    case "": help(); break;
    default: throw new Error("unknown command: " + args.command);
  }
}

main().catch((error: unknown) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
