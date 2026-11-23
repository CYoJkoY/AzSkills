#!/usr/bin/env node
/*
 * azflow - the delivery loop command line.
 *
 * One agent owns judgment and execution. This tool owns the shared record:
 * which tasks exist, which touch scopes are leased, which worktree each task
 * uses, how a review scored, and whether an auto-merge may proceed. It never
 * spawns a sub-agent; it opens a short-lived review window so the independent
 * reviewers can, and concurrency comes from independent task branches.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";
import {
  branchCommits,
  commitWithMessage,
  currentBranch,
  defaultBranch,
  diffAddedLines,
  diffFiles,
  ghAvailable,
  git,
  hasStagedChanges,
  issueClose,
  issueCreate,
  issueNumberFromUrl,
  issueViewState,
  prChecks,
  prComment,
  prCreate,
  prEdit,
  prMerge,
  prReady,
  prView,
  remoteBranchExists,
  runShell,
  revParse,
  stagedPaths,
  worktreeAddNew,
  worktreeRemove,
} from "./externals.ts";
import type { BranchCommit } from "./externals.ts";
import {
  DEFAULT_PERMISSION_NOTICE,
  buildCommitMessage,
  buildPullRequestBody,
  buildPullRequestTitle,
  parseCommitHeader,
  validateCommitMessage,
  validatePullRequestBody,
  validatePullRequestTitle,
} from "./message.ts";
import type { PullRequestCommit, PullRequestDimension } from "./message.ts";
import { mergeFindings, scanDiff } from "./scan.ts";
import { asciiIssues } from "./message.ts";
import type { Finding, ReviewInput, ScoreResult } from "./score.ts";
import { DEFAULT_POLICY, renderReport, scoreReview } from "./score.ts";
import {
  DEFAULT_CONFIG,
  findTask,
  findTaskByPr,
  flowRoot,
  issueLease,
  isRecord,
  leaseAlive,
  makeTask,
  newTaskId,
  planWaves,
  readState,
  requireState,
  reviewWindowPath,
  reviewsRoot,
  slugify,
  statePath,
  touch,
  touchConflict,
  matchesAny,
  withLock,
  worktreesRoot,
  writeState,
} from "./state.ts";
import type { FlowState, ReviewRecord, ReviewWindow, Task } from "./state.ts";
import {
  DEFAULT_MAX_ITERATIONS,
  DEFAULT_MAX_NO_PROGRESS,
  MAX_PROGRESS_ENTRIES,
  createGoal,
  findGoalProject,
  goalPath,
  goalCompass,
  nextStepFor,
  progressMarker,
  pushBlocker,
  readGoal,
  updateGoal,
} from "./goal.ts";
import type { GoalState } from "./goal.ts";

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

/**
 * Static checks the ledger should run before every commit. Explicit `--check`
 * flags win; otherwise a repository that names its own scripts gets them for
 * free, so a commit cannot land on a red tree by neglect.
 */
async function detectChecks(project: string): Promise<string[]> {
  const text = await readFile(path.join(project, "package.json"), "utf8").catch(() => null);
  if (text === null) return [];
  let scripts: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (isRecord(parsed) && isRecord(parsed.scripts)) scripts = parsed.scripts;
  } catch {
    return [];
  }
  return ["typecheck", "lint"]
    .filter((name) => typeof scripts[name] === "string")
    .map((name) => "npm run " + name);
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
  const requested = allValues(args, "check");
  const state: FlowState = {
    schemaVersion: 1,
    config: {
      ...DEFAULT_CONFIG,
      base,
      maxParallel: Number(lastValue(args, "max-parallel") ?? DEFAULT_CONFIG.maxParallel),
      autonomy: lastValue(args, "autonomy") === "manual" ? "manual" : "full",
      checks: requested.length > 0 ? requested : await detectChecks(project),
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
    "- Every branch commit carries a scored stage record and the pull request head scores strictly above the configured threshold.",
  ].join("\n");
}

/**
 * The review record holds the facts the pull request body cites: the command
 * that ran, its exit code, the probe results, and the dimension verdicts. The
 * body is rebuilt from that file rather than from prose the model remembers.
 */
interface ReviewFacts {
  readonly staticChecks: string;
  readonly staticRecorded: boolean;
  readonly staticGreen: boolean;
  readonly sawReview: boolean;
  readonly runtimeChecks: string;
  readonly unverified: string;
  readonly dimensions: PullRequestDimension[];
  readonly verdict: "PASS" | "FAIL";
  readonly round: number;
}

/** Review dimensions carry their own ids; map them onto the four audit rows. */
const DIMENSION_ALIASES: Record<string, string> = {
  correctness: "correctness",
  performance: "performance",
  discipline: "compatibility",
  compatibility: "compatibility",
  readability: "readability",
};

const firstLine = (text: string): string | null => {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item !== "");
  return line ?? null;
};

const isAscii = (text: string): boolean => asciiIssues(text).length === 0;

async function reviewFacts(project: string, task: Task): Promise<ReviewFacts> {
  const record = task.review;
  const pending: ReviewFacts = {
    staticChecks:
      "Not recorded yet; `azflow review` writes the command and its exit code, and `azflow ship` refreshes this body before merging.",
    staticRecorded: false,
    staticGreen: false,
    sawReview: false,
    runtimeChecks: "Not recorded yet.",
    unverified: "Review not recorded yet.",
    dimensions: [],
    verdict: "FAIL",
    round: 1,
  };
  if (record === null) return pending;

  const file = path.join(reviewsRoot(project), task.id + "-r" + String(record.round) + ".json");
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return { ...pending, verdict: record.verdict, round: record.round };
  let input: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text) as unknown;
    const candidate = isRecord(parsed) ? parsed.input : null;
    if (isRecord(candidate)) input = candidate;
  } catch {
    input = {};
  }

  const verification = isRecord(input.verification) ? input.verification : null;
  const command = typeof verification?.command === "string" ? verification.command.trim() : "";
  const exitCode = typeof verification?.exitCode === "number" ? verification.exitCode : null;
  const staticChecks =
    command === ""
      ? "No verification command was recorded; a review without one cannot pass."
      : "`" + command + "` (exit " + String(exitCode ?? "unknown") + ")";

  const probes = Array.isArray(input.probes) ? input.probes.filter(isRecord) : [];
  const passed = probes.filter((probe) => probe.status === "passed").length;
  const notApplicable = probes.filter((probe) => probe.status === "na").length;
  const runtimeChecks =
    probes.length === 0
      ? "N/A - no runtime probe was recorded."
      : String(passed) + " of " + String(probes.length) + " recorded probes passed, " +
        String(notApplicable) + " not applicable.";

  const rawDimensions = Array.isArray(input.dimensions) ? input.dimensions.filter(isRecord) : [];
  const mapped = new Map<string, PullRequestDimension>();
  for (const entry of rawDimensions) {
    const id = typeof entry.id === "string" ? entry.id : "";
    const target = DIMENSION_ALIASES[id];
    if (target === undefined || mapped.has(target)) continue;
    const status = entry.status === "pass" ? "PASS" : entry.status === "fail" ? "FAIL" : "N/A";
    const note =
      typeof entry.note === "string" && entry.note.trim() !== ""
        ? entry.note.trim()
        : "recorded without a note";
    mapped.set(target, { id: target, status, note });
  }

  const green = command !== "" && exitCode === 0;
  return {
    staticChecks,
    // A passing command with exit 0 is the only evidence strong enough to open
    // the pull request; a red run may still be reviewed, then fixed and recorded.
    staticRecorded: green,
    staticGreen: green,
    sawReview: true,
    runtimeChecks,
    unverified: "None - every assertion above was recorded locally.",
    dimensions: [...mapped.values()],
    verdict: record.verdict,
    round: record.round,
  };
}

function guardText(text: string, fallback: string): string {
  return isAscii(text) ? text : fallback;
}

function summaryCommits(commits: readonly BranchCommit[]): PullRequestCommit[] {
  return commits.map((commit) => {
    const header = guardText(commit.header, "(non-ASCII header omitted)");
    const note = firstLine(commit.body);
    return {
      sha: commit.sha,
      header,
      note:
        note === null
          ? "Changes stay inside the task's declared touch scopes."
          : guardText(note, "See the commit message for the detailed note."),
    };
  });
}

function guaranteesFor(commits: readonly BranchCommit[]): string {
  const breaking = commits
    .map((commit) => parseCommitHeader(commit.header))
    .filter((header): header is NonNullable<typeof header> => header !== null && header.breaking);
  const first = breaking[0];
  if (first === undefined) {
    return "No commit header carries a breaking marker; public APIs, configuration keys, and defaults stay as they were.";
  }
  return "Breaking change declared in `" + guardText(first.subject, "(non-ASCII subject omitted)") +
    "`; the BREAKING CHANGE footer carries the migration path.";
}

function dependenciesFor(commits: readonly BranchCommit[]): string {
  const build = commits.some((commit) => parseCommitHeader(commit.header)?.type === "build");
  return build
    ? "A build or dependency commit is on this branch; its diff carries the version pins."
    : "No build or dependency commit on this branch; the lockfile is unchanged by this task.";
}

/** The deterministic pull request title and body for a task at its current head. */
async function pullRequestContent(
  project: string,
  state: FlowState,
  task: Task,
  commits: readonly BranchCommit[],
): Promise<{
  title: string;
  body: string;
  verdict: "PASS" | "FAIL";
  staticRecorded: boolean;
  staticGreen: boolean;
  sawReview: boolean;
}> {
  const facts = await reviewFacts(project, task);
  const issueSummary = guardText(
    task.notes.trim() === "" ? task.title : task.notes.trim(),
    "See the linked issue for the objective and the technical driver.",
  ).replace(/\s+/g, " ");
  const body = buildPullRequestBody({
    issueId: task.issue,
    base: state.config.base,
    issueSummary: /[.!?]$/.test(issueSummary) ? issueSummary : issueSummary + ".",
    commits: summaryCommits(commits),
    guarantees: guaranteesFor(commits),
    staticChecks: facts.staticChecks,
    runtimeChecks: facts.runtimeChecks,
    unverified: facts.unverified,
    dependencies: dependenciesFor(commits),
    dimensions: facts.dimensions,
    verdict: facts.verdict,
    blocking: facts.verdict === "PASS" ? [] : ["The latest review record does not pass yet; re-run `azflow review`."],
    round: facts.round,
    maxRounds: DEFAULT_POLICY.maxRounds,
    stackedOn: null,
    permission: DEFAULT_PERMISSION_NOTICE,
  });

  // The title follows the branch's own commits: `azflow commit` already forces a
  // conventional header, so the earliest one names what this branch delivers.
  const derived = commits
    .map((commit) => parseCommitHeader(commit.header))
    .find((header) => header !== null) ?? null;
  const title =
    derived === null || task.issue === null
      ? task.title
      : buildPullRequestTitle({
          type: derived.type,
          scope: derived.scope,
          subject: derived.subject,
          issueId: task.issue,
          breaking: derived.breaking,
        });
  return {
    title,
    body,
    verdict: facts.verdict,
    staticRecorded: facts.staticRecorded,
    staticGreen: facts.staticGreen,
    sawReview: facts.sawReview,
  };
}

function bodyFromArgs(args: Args, project: string, fallback: string): Promise<string> {
  const file = lastValue(args, "body-file");
  if (file !== undefined) return readFile(path.resolve(project, file), "utf8");
  const inline = lastValue(args, "body");
  return Promise.resolve(inline ?? fallback);
}



/** The implementer of a task: the identity recorded when it was claimed. */
function implementerOf(task: Task): string | null {
  return task.owner ?? task.lease?.owner ?? null;
}

/**
 * Commits on the branch with no stage record. A stage that was never scored
 * is a stage nobody checked, so it blocks the pull request and the merge.
 * Shas are normalised to full ids, because a record written from a worktree
 * has to match the same commit listed from the project root.
 */
function unscoredCommits(cwd: string, base: string, head: string, task: Task): string[] {
  return branchCommits(cwd, base, head)
    .map((commit) => revParse(cwd, commit.sha))
    .filter((sha) => task.stageReviews[sha] === undefined);
}

/**
 * Close the task's issue and prove it closed. A merge that leaves its issue
 * open is a delivery that never finished, so a slow close is retried once.
 */
function closeIssue(project: string, issue: number, comment: string): boolean {
  // A merge only auto-closes the issue when the body carried "Closes #N", so
  // close it explicitly and prove the state. An already-closed issue is a
  // success, and a transient gh failure is retried once before giving up.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (issueViewState(project, issue) === "CLOSED") return true;
    } catch {
      // Ignore a read failure and attempt the close below.
    }
    try {
      issueClose(project, issue, attempt === 0 ? comment : "");
    } catch {
      // The close may still have landed; verify it before retrying.
    }
    try {
      if (issueViewState(project, issue) === "CLOSED") return true;
    } catch {
      // Fall through to the retry; the merge already happened.
    }
  }
  return false;
}

async function commit(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("commit requires a task id");
  const type = lastValue(args, "type");
  const scope = lastValue(args, "scope");
  const subject = lastValue(args, "subject");
  const body = lastValue(args, "body");
  const breaking = lastValue(args, "breaking");
  if (type === undefined || scope === undefined || subject === undefined) {
    throw new Error("commit requires --type <type> --scope <scope> --subject \"<imperative subject>\"");
  }
  const state = await requireState(project);
  const task = findTask(state, id);
  if (task.worktree === null || task.branch === null) {
    throw new Error(id + " has no claimed worktree; run 'azflow claim " + id + "' first");
  }
  if (currentBranch(task.worktree) !== task.branch) {
    throw new Error("worktree HEAD is not on " + task.branch);
  }
  if (!hasStagedChanges(task.worktree)) {
    throw new Error("staging area is empty; stage the change first, then commit it as one reviewable stage");
  }
  const staged = stagedPaths(task.worktree);
  const outside = staged.filter((file) => !matchesAny(file, task.touch));
  if (outside.length > 0) {
    process.stderr.write(
      "staged path(s) outside the declared touch scopes: " + outside.join(", ") +
        "\nupdate the task's touch scopes only through a new task boundary, or unstage the path\n",
    );
    process.exitCode = 2;
    return;
  }
  // The standard refuses to name a stage that has not passed the local static
  // checks, so the checks run here rather than after the commit exists.
  const checks = args.flags.has("skip-check") ? [] : state.config.checks;
  if (checks.length === 0 && !args.flags.has("skip-check")) {
    process.stderr.write(
      "no static checks are configured; initialize with --check \"<cmd>\" or explicitly pass --skip-check\n",
    );
    process.exitCode = 2;
    return;
  }
  const ran: { command: string; status: number }[] = [];
  for (const command of checks) {
    const result = runShell(command, task.worktree);
    ran.push({ command, status: result.status });
    if (result.status !== 0) {
      const tail = [result.stdout, result.stderr]
        .filter((part) => part.trim() !== "")
        .join("\n")
        .trim()
        .split(/\r?\n/)
        .slice(-20)
        .join("\n");
      process.stderr.write(
        "static check failed: " + command + " (exit " + String(result.status) + ")\n" +
          (tail === "" ? "" : tail + "\n") +
          "no commit message is produced from a red tree; fix the check, or pass --skip-check to record why it is skipped\n",
      );
      process.exitCode = 2;
      return;
    }
  }
  // The loop scores every commit it records. Refusing the next stage while
  // the current head is unscored keeps the branch from growing past review.
  if (branchCommits(task.worktree, state.config.base, "HEAD").length > 0) {
    const headSha = revParse(task.worktree, "HEAD");
    if (task.stageReviews[headSha] === undefined) {
      process.stderr.write(
        "head " + headSha + " has no review record; run 'azflow review " + id +
          " --input <review.json> --reviewer <fresh id>' on this stage before recording the next one\n",
      );
      process.exitCode = 2;
      return;
    }
  }
  const message = buildCommitMessage({
    type,
    scope,
    subject,
    body: body ?? null,
    breaking: breaking ?? null,
    issueId: task.issue,
  });
  const check = validateCommitMessage(message, { issueId: task.issue });
  if (check.violations.length > 0) {
    process.stderr.write(check.violations.join("\n") + "\n");
    process.exitCode = 2;
    return;
  }
  commitWithMessage(task.worktree, message);
  printJson({ task: id, branch: task.branch, header: message.split("\n")[0], checks: ran });
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
  if (task.issue === null) {
    throw new Error(id + " has no issue; run 'azflow issue " + id + "' before opening the pull request");
  }
  const worktree = task.worktree ?? project;
  const commits = branchCommits(worktree, state.config.base, task.branch);
  if (commits.length === 0) {
    throw new Error(id + " has no commits ahead of " + state.config.base + "; commit the stage first");
  }
  const generated = await pullRequestContent(project, state, task, commits);
  const title = lastValue(args, "title") ?? generated.title;
  const titleCheck = validatePullRequestTitle(title, { issueId: task.issue });
  if (titleCheck.violations.length > 0) {
    process.stderr.write(titleCheck.violations.join("\n") + "\n");
    process.exitCode = 2;
    return;
  }
  const body = await bodyFromArgs(args, project, generated.body);
  // An override may reword the body, but the five-section skeleton is fixed, so
  // a hand-written body is checked with the same rule as a generated one.
  const bodyCheck = validatePullRequestBody(body, { issueId: task.issue });
  if (bodyCheck.violations.length > 0) {
    process.stderr.write(bodyCheck.violations.join("\n") + "\n");
    process.exitCode = 2;
    return;
  }
  const draft = !args.flags.has("ready");
  const blocked = generated.verdict !== "PASS" || !generated.staticRecorded;
  if (blocked && !args.flags.has("allow-unverified")) {
    process.stderr.write(
      !generated.staticGreen && generated.sawReview
        ? "the recorded verification did not exit 0; fix it, re-run the checks, and record a review round with the green run\n"
        : generated.sawReview
          ? "the recorded review does not pass yet; finish the repair rounds before opening the pull request\n"
          : "review is not recorded yet; commit the last stage, run the project checks, then 'azflow review " +
            id +
            " --input <review.json> --scan' before opening the pull request\n",
    );
    process.exitCode = 1;
    return;
  }
  // A pull request exposes the whole branch, so every commit it carries must
  // already have a scored record, not only the head.
  const unscored = unscoredCommits(worktree, state.config.base, task.branch, task);
  if (unscored.length > 0) {
    process.stderr.write(
      "branch commits without a review record: " + unscored.join(", ") +
        "\nscore each stage with 'azflow review " + id +
        " --input <review.json> --reviewer <fresh id>' before opening the pull request\n",
    );
    process.exitCode = 2;
    return;
  }
  const url = prCreate(project, {
    title,
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
  const reportPath = path.join(
    reviewsRoot(project),
    id + "-r" + String(task.review?.round ?? 0) + ".md",
  );
  const report = await readFile(reportPath, "utf8").catch(() => null);
  if (report !== null) {
    // The pull request already exists at this point, so a comment failure must
    // not make the command look like the pull request was never opened.
    try {
      prComment(project, number, report);
    } catch {
      print("warning: pull request #" + String(number) + " opened, but the review report comment failed");
    }
  }
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
    // Record who implements this task, so a review can prove the reviewer
    // is a different context and not the author of the artifact.
    task.owner = owner;
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
    owner: implementerOf(task),
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

const REVIEWER_ID = /^[A-Za-z0-9._:-]{1,64}$/;

/** A P2 that blocks the round; injected when self-review is selected. */
function selfReviewFinding(id: string): Finding {
  return {
    severity: "P2",
    file: "review",
    line: 1,
    dimension: "correctness",
    summary: "Self-review is not accepted as a gate",
    evidence: "review engine 'self' was selected for " + id + "; self-review over-scores and hides defects",
    fix: "Run an EGM review: 'azflow review-open " + id + "', spawn Goldfish reviewers in fresh contexts, then score with engine 'egm'",
  };
}

/** A P2 that blocks the round; injected when no valid EGM review is attested. */
function unattestedFinding(id: string, windowOpen: boolean): Finding {
  return {
    severity: "P2",
    file: "review",
    line: 1,
    dimension: "correctness",
    summary: "Independent (EGM) review not attested",
    evidence: windowOpen
      ? "no reviewer reported status 'completed' in a fresh context with files read"
      : "no open review window for " + id + " at this head",
    fix: "Open a window with 'azflow review-open " + id + "', spawn Goldfish reviewers in fresh contexts, and attest each in the review input",
  };
}

/** Reads the current review window, or null when none is open or it is malformed. */
async function readReviewWindow(project: string): Promise<ReviewWindow | null> {
  const text = await readFile(reviewWindowPath(project), "utf8").catch(() => null);
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (
    typeof parsed.taskId !== "string" ||
    typeof parsed.headSha !== "string" ||
    typeof parsed.reviewer !== "string" ||
    (parsed.engine !== "egm" && parsed.engine !== "self") ||
    typeof parsed.openedAt !== "string" ||
    typeof parsed.expiresAt !== "string" ||
    typeof parsed.maxAgents !== "number"
  ) {
    return null;
  }
  return parsed as unknown as ReviewWindow;
}

/**
 * Best-effort check for the installed EGM plugin. A missing plugin only warns,
 * because the cache location differs per host and must never block a review.
 */
function egmPluginPresent(): boolean {
  const home = process.env.CODEX_HOME ?? path.join(homedir(), ".codex");
  return existsSync(path.join(home, "plugins", "cache", "egm"));
}

/**
 * Opens a short-lived review window for a task's current head. The delivery
 * guard permits sub-agent spawns only while a window is open, so an EGM review
 * can run in fresh contexts without leaving a permanent escape hatch behind.
 */
async function reviewOpen(args: Args): Promise<void> {
  const project = projectRoot(args);
  const id = args.positionals[0];
  if (id === undefined) throw new Error("review-open requires a task id");
  const reviewer = lastValue(args, "reviewer") ?? "egm-goldfish";
  if (!REVIEWER_ID.test(reviewer)) {
    throw new Error("reviewer id must be 1-64 ASCII letters, digits, or . _ : -");
  }
  const ttl = Number(lastValue(args, "ttl") ?? 20);
  if (!Number.isFinite(ttl) || ttl <= 0 || ttl > 120) {
    throw new Error("--ttl must be between 1 and 120 minutes");
  }
  const maxAgents = Number(lastValue(args, "max-agents") ?? 3);
  if (!Number.isInteger(maxAgents) || maxAgents < 1 || maxAgents > 8) {
    throw new Error("--max-agents must be between 1 and 8");
  }
  const state = await requireState(project);
  const task = findTask(state, id);
  if (task.worktree === null) {
    throw new Error("review-open requires a claimed worktree; run 'azflow claim " + id + "' first");
  }
  const headSha = revParse(task.worktree, "HEAD");
  const at = new Date();
  const window: ReviewWindow = {
    taskId: id,
    headSha,
    reviewer,
    engine: "egm",
    openedAt: at.toISOString(),
    expiresAt: new Date(at.getTime() + ttl * 60_000).toISOString(),
    maxAgents,
  };
  await mkdir(flowRoot(project), { recursive: true });
  const target = reviewWindowPath(project);
  const temp = target + "." + process.pid + ".tmp";
  await writeFile(temp, JSON.stringify(window, null, 2) + "\n", "utf8");
  await rename(temp, target);
  if (args.flags.has("json")) {
    printJson({
      window,
      instruction:
        "Spawn EGM Goldfish reviewers in fresh contexts (fork_context: false or fork_turns: none), " +
        "have them read agents/<persona>.md first, then attest each as engine 'egm' in the review input.",
    });
    return;
  }
  print("Review window open for " + id + " at head " + headSha + " until " + window.expiresAt + ".");
  print("Spawn EGM Goldfish reviewers in fresh contexts (fork_context: false), then attest them with engine 'egm'.");
  if (!egmPluginPresent()) {
    print("Note: the egm plugin was not found under CODEX_HOME; install it before spawning reviewers.");
  }
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
  // A review only counts when a fresh context produces it. The reviewer is a
  // separate identity from the implementer, so a self-review cannot pass, and
  // the record names who scored it.
  const reviewer = lastValue(args, "reviewer");
  if (reviewer === undefined || reviewer.trim() === "") {
    throw new Error("review requires --reviewer <id> naming the fresh-context reviewer");
  }
  if (asciiIssues(reviewer).length > 0 || !/^[A-Za-z0-9._:-]{1,64}$/.test(reviewer)) {
    throw new Error("reviewer id must be 1-64 ASCII letters, digits, or . _ : -");
  }
  const implementer = implementerOf(task);
  if (implementer !== null && implementer === reviewer) {
    throw new Error(
      "reviewer " + reviewer + " is the implementer of " + id +
        "; this tool only enforces distinct identity, so the review must run in a separate agent with a fresh context",
    );
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
  const reviewRoot: string = task.worktree;
  const earlier = branchCommits(reviewRoot, base, headSha)
    .map((commit) => ({ sha: revParse(reviewRoot, commit.sha), committedAt: commit.committedAt }))
    .filter((commit) => commit.sha !== headSha);
  const missingEarlier = earlier.filter((commit) => task.stageReviews[commit.sha] === undefined);
  // Commits written before the task existed predate per-commit scoring, so an
  // upgraded branch keeps them as LEGACY stages instead of becoming unshippable.
  // Every commit written while the task is open still needs its own scored stage.
  const claimedAt = Date.parse(task.createdAt);
  const legacy = missingEarlier.filter(
    (commit) => Number.isFinite(claimedAt) && commit.committedAt * 1000 < claimedAt,
  );
  const unscored = missingEarlier.filter((commit) => !legacy.includes(commit));
  if (unscored.length > 0) {
    throw new Error(
      "earlier branch commits are unscored: " + unscored.map((commit) => commit.sha).join(", ") +
        "; score each stage in order so no commit enters the branch unreviewed",
    );
  }
  // Independent review is enforced here, not inside the scorer, so the
  // deterministic scorer stays free of policy. A self-review, or an EGM run that
  // no fresh-context reviewer attests, injects an explicit P2 that caps the round
  // at 4.50 and blocks the merge. A self-score cannot quietly pass itself.
  const engine = (lastValue(args, "engine") ?? state.config.reviewEngine) as string;
  if (engine !== "egm" && engine !== "self") {
    throw new Error("--engine must be 'egm' or 'self'");
  }
  const attestation = Array.isArray(input.reviewers) ? input.reviewers : [];
  const attested = attestation.some(
    (entry) =>
      isRecord(entry) &&
      entry.status === "completed" &&
      entry.freshContext === true &&
      Array.isArray(entry.filesRead) &&
      entry.filesRead.length > 0,
  );
  const window = await readReviewWindow(project);
  const windowOpen =
    window !== null &&
    window.taskId === id &&
    window.engine === "egm" &&
    window.headSha === headSha &&
    Date.parse(window.expiresAt) > Date.now();
  if (engine === "self") {
    findings.push(selfReviewFinding(id));
  } else if (!windowOpen || !attested) {
    findings.push(unattestedFinding(id, windowOpen));
  }
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
    reviewer,
    at,
    engine: engine === "self" ? "self" : "egm",
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
    reviewer,
    engine: engine === "self" ? ("self" as const) : ("egm" as const),
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
    for (const commit of legacy) {
      if (stored.stageReviews[commit.sha] !== undefined) continue;
      stored.stageReviews[commit.sha] = {
        headSha: commit.sha,
        round: 0,
        score: 0,
        verdict: "LEGACY",
        reviewer: "pre-gate",
        at: record.at,
      };
    }
    stored.stageReviews[record.headSha] = {
      headSha: record.headSha,
      round: record.round,
      score: record.score,
      verdict: record.verdict,
      reviewer,
      at: record.at,
    };
    if (stored.status !== "merged") stored.status = "review";
    touch(stored);
  });
  // The window authorised exactly this head; once scored, a later round must
  // open its own window at the new head instead of reusing this one.
  await rm(reviewWindowPath(project), { force: true }).catch(() => undefined);
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

/**
 * Finishes a delivery whose pull request merged but whose issue did not close.
 * Only that one status is repaired here; every other state has to pass the full
 * gate list again, so a merge can never be replayed from this path.
 */
async function finishIssueClosure(project: string, task: Task, prNumber: number): Promise<void> {
  if (task.issue === null) throw new Error(task.id + " has no linked issue to verify");
  if (task.status !== "merged-issue-open") {
    throw new Error(
      task.id + " is " + task.status +
        "; --verify-issue only finishes a merged pull request whose issue is still open",
    );
  }
  const closed = closeIssue(project, task.issue, "Merged as PR #" + String(prNumber) + ".");
  if (!closed) {
    process.stderr.write("issue #" + String(task.issue) + " is still not CLOSED\n");
    process.exitCode = 1;
    return;
  }
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, task.id);
    stored.status = "merged";
    touch(stored);
  });
  print("Issue #" + String(task.issue) + " is CLOSED and " + task.id + " is merged");
}

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
  if (args.flags.has("verify-issue")) {
    await finishIssueClosure(project, task, prNumber);
    return;
  }
  const pr = prView(project, prNumber);
  const checks = prChecks(project, prNumber);
  const gates: GateRow[] = [];
  const review = task.review;
  gates.push({
    gate: "review-pass",
    pass: review !== null && review.verdict === "PASS",
    detail: review === null ? "no review record" : review.verdict + " at " + review.score.toFixed(2),
  });
  const closesIssue =
    task.issue !== null && new RegExp("Closes #" + String(task.issue) + "(?![0-9])").test(pr.body);
  gates.push({
    gate: "issue-linked",
    pass: closesIssue,
    detail:
      task.issue === null
        ? "no linked issue"
        : closesIssue
          ? "Closes #" + String(task.issue) + " in the body"
          : "body does not say Closes #" + String(task.issue),
  });
  const stageHead = pr.headRefOid !== "" ? pr.headRefOid : task.branch ?? "";
  const stageCommits = stageHead === "" ? [] : branchCommits(project, state.config.base, stageHead)
    .map((commit) => revParse(project, commit.sha));
  const stageUnscored = stageCommits.filter((sha) => task.stageReviews[sha] === undefined);
  const headStage = pr.headRefOid === "" ? null : task.stageReviews[pr.headRefOid] ?? null;
  gates.push({
    gate: "stage-reviews",
    pass:
      stageCommits.length > 0 && stageUnscored.length === 0 && headStage !== null &&
      headStage.verdict === "PASS" && headStage.score > state.config.reviewThreshold,
    detail:
      stageCommits.length === 0
        ? "no branch commits resolved"
        : stageUnscored.length > 0
          ? "unscored: " + stageUnscored.join(",")
          : headStage === null
            ? "head has no stage record"
            : String(stageCommits.length) + " scored, head " + headStage.verdict + " " + headStage.score.toFixed(2),
  });
  const implementer = implementerOf(task);
  gates.push({
    gate: "reviewer-independent",
    pass:
      review !== null && review.reviewer !== undefined && review.reviewer !== "" &&
      review.reviewer !== implementer,
    detail:
      review === null
        ? "no review record"
        : review.reviewer === undefined
          ? "review names no reviewer"
          : "reviewer " + review.reviewer + " vs implementer " + String(implementer ?? "unknown"),
  });
  gates.push({
    gate: "review-score",
    pass: review !== null && review.score > state.config.reviewThreshold,
    detail: review === null ? "no score" : String(review.score.toFixed(2)) + " > " + state.config.reviewThreshold.toFixed(2),
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
  // A dry run is still a preflight: failed gates must exit non-zero so CI can
  // gate on the report instead of reading a clean exit as a clean pull request.
  if (failed.length > 0) {
    process.exitCode = 2;
    return;
  }
  if (args.flags.has("dry-run")) return;
  // Refresh the body from the review record and the real commit list, so the
  // merged pull request carries the audit trail the gates just accepted.
  try {
    const head = task.branch ?? pr.headRefOid;
    const commits = branchCommits(project, state.config.base, head);
    const content = await pullRequestContent(project, state, task, commits);
    prEdit(project, prNumber, { body: content.body });
  } catch {
    // Metadata only: a body refresh must never block a verified merge.
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
  // The merge cannot be undone, so the issue is closed and proven CLOSED before
  // the ledger calls the delivery done. A pull request whose issue stays open
  // keeps the distinct status merged-issue-open, which --verify-issue finishes.
  const issueClosed = task.issue === null
    ? true
    : closeIssue(project, task.issue, "Merged as PR #" + String(prNumber) + ".");
  await withLock(project, async (fresh) => {
    const stored = findTask(fresh, task.id);
    stored.status = issueClosed ? "merged" : "merged-issue-open";
    stored.pr = prNumber;
    if (stored.worktree !== null) {
      stored.worktree = null;
    }
    touch(stored);
  });
  if (!issueClosed) {
    process.stderr.write(
      "merged PR #" + String(prNumber) + " but issue #" + String(task.issue) +
        " is not CLOSED; the task is recorded as merged-issue-open\n" +
        "run: azflow ship " + task.id + " --verify-issue\n",
    );
    process.exitCode = 1;
  }
  const fetched = git(["fetch", state.config.remote, "--prune"], { cwd: project });
  let synced = false;
  if (fetched.status === 0) {
    const co = git(["checkout", state.config.base], { cwd: project });
    if (co.status === 0) {
      const pull = git(["pull", "--ff-only", state.config.remote, state.config.base], { cwd: project });
      synced = pull.status === 0;
    }
  }
  if (args.flags.has("json")) printJson({ ...outcome, merged: true, synced, issueClosed });
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
    const engine = state.config.reviewEngine;
    checks.push({
      gate: "review-engine",
      pass: engine === "egm",
      detail:
        engine === "egm"
          ? "egm" + (egmPluginPresent() ? " plugin detected" : " plugin not detected; install egm before review")
          : "self review is not accepted; set reviewEngine to egm",
    });
  }
  const failed = checks.filter((check) => !check.pass);
  if (args.flags.has("json")) printJson({ checks, failed: failed.map((check) => check.gate) });
  else {
    for (const check of checks) print((check.pass ? "PASS " : "FAIL ") + check.gate + ": " + check.detail);
  }
  if (failed.length > 0) process.exitCode = 2;
}

function goalUsage(): void {
  print(
    [
      "azflow goal - long-horizon goal run that survives without Goal mode",
      "",
      "Usage:",
      "  azflow goal start \"<objective>\" --done-when \"<criterion>\" [--done-when \"<criterion>\"] [--max-iterations N] [--max-no-progress N] [--next-step \"<text>\"] [--replace]",
      "  azflow goal status [--json]",
      "  azflow goal next",
      "  azflow goal note \"<what changed>\" [--evidence \"<output or sha>\"] [--next-step \"<text>\"]",
      "  azflow goal next-step \"<text>\"",
      "  azflow goal pause [--reason \"<why>\"]",
      "  azflow goal resume",
      "  azflow goal extend --by <N>",
      "  azflow goal complete [--summary \"<result>\"]",
      "  azflow goal abandon [--reason \"<why>\"]",
      "",
      "Goal file: .azflow/goal.json (local, git-ignored). The Stop hook keeps the turn",
      "alive while the goal is active and work remains, re-injecting the compass each pass.",
    ].join("\n"),
  );
}

async function goalCommand(args: Args): Promise<void> {
  const sub = args.positionals[0] ?? "status";
  const cwd = projectRoot(args);
  const project = lastValue(args, "project") === undefined ? await findGoalProject(cwd) ?? cwd : cwd;
  const rest = args.positionals.slice(1);
  const text = rest.join(" ").trim();
  const at = nowIso();

  const positiveInt = (name: string, fallback: number): number => {
    const raw = lastValue(args, name);
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) throw new Error("--" + name + " must be a positive integer.");
    return value;
  };

  const requireGoal = async (): Promise<GoalState> => {
    const goal = await readGoal(project);
    if (goal === null) throw new Error("No goal at " + flowRoot(project) + ". Start one with `azflow goal start`.");
    return goal;
  };

  switch (sub) {
    case "start": {
      const objective = (lastValue(args, "objective") ?? text).trim();
      const goal = await createGoal(
        project,
        {
          objective,
          doneWhen: allValues(args, "done-when"),
          maxIterations: positiveInt("max-iterations", DEFAULT_MAX_ITERATIONS),
          maxNoProgress: positiveInt("max-no-progress", DEFAULT_MAX_NO_PROGRESS),
          nextStep: lastValue(args, "next-step"),
        },
        { replace: args.flags.has("replace") },
      );
      print("Goal started at " + goalPath(project));
      print(goalCompass(goal, await readState(project).catch(() => null)));
      return;
    }
    case "status": {
      const goal = await readGoal(project);
      const flow = await readState(project).catch(() => null);
      if (goal === null) {
        if (args.flags.has("json")) printJson({ goal: null });
        else print("No goal at " + flowRoot(project) + ". Start one with `azflow goal start \"<objective>\" --done-when \"<criterion>\"`.");
        return;
      }
      if (args.flags.has("json")) {
        printJson({ goal, nextStep: nextStepFor(goal, flow) });
        return;
      }
      print(goalCompass(goal, flow));
      return;
    }
    case "next": {
      const goal = await requireGoal();
      print(nextStepFor(goal, await readState(project).catch(() => null)));
      return;
    }
    case "note": {
      if (text === "") throw new Error("azflow goal note needs a note describing what changed.");
      const evidence = (lastValue(args, "evidence") ?? "").trim();
      const nextStep = lastValue(args, "next-step");
      const updated = await updateGoal(project, (goal) => {
        const entry = { at, iteration: goal.iteration, note: text.slice(0, 4000), evidence: evidence.slice(0, 4000) };
        return {
          ...goal,
          progress: [...goal.progress.slice(-(MAX_PROGRESS_ENTRIES - 1)), entry],
          nextStep: nextStep === undefined ? goal.nextStep : nextStep.trim().slice(0, 4000),
          updatedAt: at,
        };
      });
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Recorded progress on goal (pass " + updated.iteration + ", status " + updated.status + ").");
      return;
    }
    case "next-step": {
      const updated = await updateGoal(project, (goal) => ({ ...goal, nextStep: text.slice(0, 4000), updatedAt: at }));
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print(text === "" ? "Next step cleared." : "Next step: " + text);
      return;
    }
    case "pause": {
      const reason = (lastValue(args, "reason") ?? text).trim();
      const updated = await updateGoal(project, (goal) => {
        if (goal.status === "complete" || goal.status === "abandoned") throw new Error("Cannot pause a " + goal.status + " goal.");
        return {
          ...goal,
          status: "paused",
          blockers: reason === "" ? goal.blockers : pushBlocker(goal.blockers, "Paused: " + reason),
          updatedAt: at,
        };
      });
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Goal paused." + (reason === "" ? "" : " " + reason));
      return;
    }
    case "resume": {
      const marker = await progressMarker(project);
      const updated = await updateGoal(project, (goal) => {
        if (goal.status !== "paused" && goal.status !== "stalled") throw new Error("Only a paused or stalled goal can be resumed.");
        if (goal.iteration >= goal.maxIterations) throw new Error("Extend the exhausted goal budget before resuming.");
        return { ...goal, status: "active", noProgress: 0, lastMarker: marker, updatedAt: at };
      });
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Goal resumed (pass " + updated.iteration + " of " + updated.maxIterations + ").");
      return;
    }
    case "extend": {
      const rawBy = lastValue(args, "by");
      if (rawBy === undefined) throw new Error("azflow goal extend needs --by <N>.");
      const by = Number(rawBy);
      if (!Number.isInteger(by) || by <= 0) throw new Error("--by must be a positive integer.");
      const updated = await updateGoal(project, (goal) => ({ ...goal, maxIterations: goal.maxIterations + by, updatedAt: at }));
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Iteration budget extended by " + by + " to " + updated.maxIterations + ".");
      return;
    }
    case "complete": {
      const summary = (lastValue(args, "summary") ?? text).trim();
      const updated = await updateGoal(project, (goal) => ({
        ...goal,
        status: "complete",
        summary: summary === "" ? goal.summary : summary.slice(0, 4000),
        updatedAt: at,
      }));
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Goal complete." + (summary === "" ? "" : " " + summary));
      return;
    }
    case "abandon": {
      const reason = (lastValue(args, "reason") ?? text).trim();
      const updated = await updateGoal(project, (goal) => ({
        ...goal,
        status: "abandoned",
        summary: reason === "" ? goal.summary : reason.slice(0, 4000),
        updatedAt: at,
      }));
      if (updated === null) throw new Error("No goal at " + flowRoot(project) + ".");
      print("Goal abandoned." + (reason === "" ? "" : " " + reason));
      return;
    }
    default:
      goalUsage();
  }
}

function help(): void {
  print(
    [
      "azflow - single-agent delivery loop",
      "",
      "Usage:",
      "  azflow init [--base main] [--max-parallel 3] [--autonomy full|manual] [--check \"<cmd>\"] [--project PATH]",
      "  azflow add \"<title>\" --touch <glob> [--touch <glob>] [--dep T-0001] [--issue N]",
      "  azflow issue <task> [--body <text>|--body-file <path>] [--label <name>]",
      "  azflow commit <task> --type <type> --scope <scope> --subject \"<imperative>\" [--body <text>] [--breaking <text>] [--skip-check]",
      "  azflow pr <task> [--title <title>] [--ready] [--body <text>|--body-file <path>] [--allow-unverified]",
      "  azflow ready <task>",
      "  azflow plan [--json]",
      "  azflow claim <task> [--agent <name>]",
      "  azflow status [--json]",
      "  azflow review-open <task> [--reviewer <id>] [--ttl 20] [--max-agents 3] [--json]",
      "  azflow review <task> --input <review.json> --reviewer <fresh id> [--engine egm|self] [--scan] [--post] [--pr N] [--json]",
      "  azflow ship <task>|--pr <n> [--dry-run] [--verify-issue] [--json]",
      "  azflow recover [--force]",
      "  azflow goal start|status|next|note|next-step|pause|resume|extend|complete|abandon",
      "  azflow doctor [--json]",
      "",
      "Ledger: .azflow/state.json (local, git-ignored). GitHub Issue/PR stays the shared record.",
      "Goal: .azflow/goal.json (local, git-ignored). Drives a long run; see `azflow goal`.",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "init": await init(args); break;
    case "add": await add(args); break;
    case "issue": await issue(args); break;
    case "commit": await commit(args); break;
    case "pr": await openPullRequest(args); break;
    case "ready": await ready(args); break;
    case "plan": await plan(args); break;
    case "claim": await claim(args); break;
    case "status": await status(args); break;
    case "review": await review(args); break;
    case "review-open": await reviewOpen(args); break;
    case "ship": await ship(args); break;
    case "recover": await recover(args); break;
    case "goal": await goalCommand(args); break;
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
