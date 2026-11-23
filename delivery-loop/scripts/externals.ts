#!/usr/bin/env node
/*
 * Typed wrappers around git and gh for the delivery loop.
 *
 * Every command runs with an argument array and no shell, so a branch name or
 * PR title cannot turn into an injected command. Parsing lives here so the CLI
 * and the hooks share one reading of the tools.
 */
import { spawnSync } from "node:child_process";
import type { DiffFile } from "./scan.ts";

export interface CommandResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunOptions {
  readonly cwd?: string;
  readonly input?: string;
}

function run(command: string, args: readonly string[], options: RunOptions = {}): CommandResult {
  const result = spawnSync(command, [...args], {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) {
    return { status: -1, stdout: "", stderr: String(result.error.message ?? result.error) };
  }
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function ok(result: CommandResult): string {
  if (result.status !== 0) {
    throw new Error("command failed (" + String(result.status) + "): " + result.stderr.trim());
  }
  return result.stdout.trim();
}

export function git(args: readonly string[], options: RunOptions = {}): CommandResult {
  return run("git", args, options);
}

/**
 * Runs a project-defined verification command through the platform shell.
 * The command comes from the agent or the operator, never from repository data.
 */
export function runShell(command: string, cwd: string): CommandResult {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) {
    return { status: -1, stdout: "", stderr: String(result.error.message ?? result.error) };
  }
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * The `gh` binary. `AZFLOW_GH` overrides it, either with a different executable
 * or with an interpreter and a script path, so a harness without `gh` on PATH
 * (or a test double) can be used without changing the flow.
 */
function ghBin(): { command: string; prefix: readonly string[] } {
  const configured = (process.env.AZFLOW_GH ?? "").trim();
  const parts = (configured === "" ? "gh" : configured).split(/\s+/).filter(Boolean);
  const command = parts[0] ?? "gh";
  return { command, prefix: parts.slice(1) };
}

export function gh(args: readonly string[], options: RunOptions = {}): CommandResult {
  const bin = ghBin();
  return run(bin.command, [...bin.prefix, ...args], options);
}

export function currentBranch(cwd: string): string {
  return ok(git(["rev-parse", "--abbrev-ref", "HEAD"], { cwd }));
}

export function revParse(cwd: string, ref: string): string {
  return ok(git(["rev-parse", ref], { cwd }));
}

export function isClean(cwd: string): boolean {
  return ok(git(["status", "--porcelain"], { cwd })) === "";
}

export function fetchOrigin(cwd: string, remote = "origin"): void {
  ok(git(["fetch", remote, "--prune"], { cwd }));
}

export function defaultBranch(cwd: string): string {
  const symbolic = git(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], { cwd });
  if (symbolic.status === 0) {
    const value = symbolic.stdout.trim();
    const slash = value.lastIndexOf("/");
    if (slash !== -1) return value.slice(slash + 1);
  }
  return "main";
}

export function remoteUrl(cwd: string, remote = "origin"): string {
  const result = git(["remote", "get-url", remote], { cwd });
  return result.status === 0 ? result.stdout.trim() : "";
}

export function worktreeAdd(cwd: string, directory: string, branch: string): void {
  ok(git(["worktree", "add", directory, branch], { cwd }));
}

export function worktreeAddNew(cwd: string, directory: string, branch: string, from: string): void {
  ok(git(["worktree", "add", "-b", branch, directory, from], { cwd }));
}

export function worktreeRemove(cwd: string, directory: string, force = false): void {
  const args = ["worktree", "remove", directory];
  if (force) args.push("--force");
  ok(git(args, { cwd }));
}

export function branchExists(cwd: string, branch: string): boolean {
  return git(["rev-parse", "--verify", "--quiet", "refs/heads/" + branch], { cwd }).status === 0;
}

export function diffFiles(cwd: string, base: string): string[] {
  const output = ok(git(["diff", "--name-only", "--diff-filter=ACMR", base + "...HEAD"], { cwd }));
  return output === "" ? [] : output.split(/\r?\n/).filter(Boolean);
}

/** Parse `git diff` output into added lines grouped by file. */
export function parseAddedLines(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: { path: string; added: { line: number; text: string }[] } | null = null;
  let nextLine = 0;
  for (const raw of diffText.split(/\r?\n/)) {
    if (raw.startsWith("+++ ")) {
      const target = raw.slice(4).trim();
      const normalized = target === "/dev/null" ? null : target.replace(/^b\//, "");
      if (normalized === null) {
        current = null;
      } else {
        current = { path: normalized, added: [] };
        files.push(current);
      }
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      nextLine = Number(hunk[1] ?? "0");
      continue;
    }
    if (current === null || raw.startsWith("--- ")) continue;
    if (raw.startsWith("+")) {
      current.added.push({ line: nextLine, text: raw.slice(1) });
      nextLine += 1;
      continue;
    }
    if (raw.startsWith("-") || raw.startsWith("\\")) continue;
    nextLine += 1;
  }
  return files;
}

export function diffAddedLines(cwd: string, base: string): DiffFile[] {
  const output = ok(git(["diff", "--no-color", "--unified=0", base + "...HEAD"], { cwd }));
  return parseAddedLines(output);
}

/** True when the index holds changes, so a commit would record something. */
export function hasStagedChanges(cwd: string): boolean {
  return git(["diff", "--cached", "--quiet"], { cwd }).status === 1;
}

/** Staged paths, including new files, moves, and copies. */
export function stagedPaths(cwd: string): string[] {
  const output = ok(git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { cwd }));
  return output === "" ? [] : output.split(/\r?\n/).filter(Boolean);
}

/** Commit the staged tree with a message read from stdin, so LF survives. */
export function commitWithMessage(cwd: string, message: string): string {
  return ok(git(["commit", "-F", "-"], { cwd, input: message }));
}

export interface BranchCommit {
  readonly sha: string;
  readonly header: string;
  readonly body: string;
  /** Committer time in seconds, used to spot commits older than the task. */
  readonly committedAt: number;
}

/**
 * Commits on the task branch that the base does not carry, oldest first.
 * The separators are control characters so a message body cannot split a record.
 */
export function branchCommits(cwd: string, base: string, head = "HEAD"): BranchCommit[] {
  const result = git(["log", "--reverse", "--format=%h%x1f%s%x1f%b%x1f%ct%x1e", base + ".." + head], { cwd });
  if (result.status !== 0) return [];
  return result.stdout
    .split("\x1e")
    .map((record) => record.replace(/^\n+/, "").trim())
    .filter((record) => record !== "")
    .map((record) => {
      const parts = record.split("\x1f");
      const committedAt = Number.parseInt((parts[3] ?? "").trim(), 10);
      return {
        sha: (parts[0] ?? "").trim(),
        header: (parts[1] ?? "").trim(),
        body: (parts[2] ?? "").trim(),
        committedAt: Number.isFinite(committedAt) ? committedAt : 0,
      };
    });
}

export interface PrView {
  readonly number: number;
  readonly url: string;
  readonly title: string;
  readonly body: string;
  readonly headRefName: string;
  readonly baseRefName: string;
  readonly headRefOid: string;
  readonly state: string;
  readonly mergeable: string;
  readonly mergeStateStatus: string;
  readonly isDraft: boolean;
  readonly labels: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function ghAvailable(cwd: string): boolean {
  return gh(["auth", "status"], { cwd }).status === 0;
}

export function prView(cwd: string, pr: number): PrView {
  const fields =
    "number,url,title,body,headRefName,baseRefName,headRefOid,state,mergeable,mergeStateStatus,isDraft,labels";
  const parsed: unknown = JSON.parse(ok(gh(["pr", "view", String(pr), "--json", fields], { cwd })));
  if (!isRecord(parsed)) throw new Error("gh pr view returned an unexpected shape");
  const labels = Array.isArray(parsed.labels)
    ? parsed.labels.map((entry) => (isRecord(entry) && typeof entry.name === "string" ? entry.name : "")).filter(Boolean)
    : [];
  return {
    number: Number(parsed.number ?? pr),
    url: String(parsed.url ?? ""),
    title: String(parsed.title ?? ""),
    body: String(parsed.body ?? ""),
    headRefName: String(parsed.headRefName ?? ""),
    baseRefName: String(parsed.baseRefName ?? ""),
    headRefOid: String(parsed.headRefOid ?? ""),
    state: String(parsed.state ?? ""),
    mergeable: String(parsed.mergeable ?? ""),
    mergeStateStatus: String(parsed.mergeStateStatus ?? ""),
    isDraft: parsed.isDraft === true,
    labels,
  };
}

export interface PrChecks {
  readonly ok: boolean;
  readonly failing: readonly string[];
  readonly pending: readonly string[];
  readonly total: number;
}

export function prChecks(cwd: string, pr: number): PrChecks {
  const result = gh(["pr", "checks", String(pr), "--json", "bucket,name,state"], { cwd });
  if (result.status !== 0) {
    const message = result.stderr.trim();
    if (/no checks|no commit found/i.test(message)) return { ok: true, failing: [], pending: [], total: 0 };
    throw new Error("gh pr checks failed: " + message);
  }
  const raw = result.stdout.trim();
  if (raw === "") return { ok: true, failing: [], pending: [], total: 0 };
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("gh pr checks returned an unexpected shape");
  const failing: string[] = [];
  const pending: string[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) continue;
    const name = String(entry.name ?? "check");
    const bucket = String(entry.bucket ?? entry.state ?? "").toLowerCase();
    if (bucket === "fail" || bucket === "cancel") failing.push(name);
    else if (bucket === "pending" || bucket === "queued" || bucket === "in_progress") pending.push(name);
  }
  return { ok: failing.length === 0 && pending.length === 0, failing, pending, total: parsed.length };
}

export function prCreate(
  cwd: string,
  input: { title: string; body: string; base: string; head: string; draft: boolean },
): string {
  const args = ["pr", "create", "--title", input.title, "--body", input.body, "--base", input.base, "--head", input.head];
  if (input.draft) args.push("--draft");
  return ok(gh(args, { cwd }));
}

/** Rewrite an open pull request's title or body without opening a new one. */
export function prEdit(
  cwd: string,
  pr: number,
  input: { title?: string; body?: string },
): void {
  const args = ["pr", "edit", String(pr)];
  if (input.title !== undefined) args.push("--title", input.title);
  if (input.body !== undefined) args.push("--body", input.body);
  if (args.length === 2) return;
  ok(gh(args, { cwd }));
}

export function prComment(cwd: string, pr: number, body: string): void {
  ok(gh(["pr", "comment", String(pr), "--body", body], { cwd }));
}

/** Flip a draft pull request to ready for review. */
export function prReady(cwd: string, pr: number): void {
  ok(gh(["pr", "ready", String(pr)], { cwd }));
}

/** True when the branch is already pushed, so a pull request can reference it. */
export function remoteBranchExists(cwd: string, remote: string, branch: string): boolean {
  return git(["rev-parse", "--verify", "--quiet", "refs/remotes/" + remote + "/" + branch], { cwd }).status === 0;
}

export function prMerge(
  cwd: string,
  pr: number,
  strategy: "squash" | "merge" | "rebase",
  deleteBranch: boolean,
): void {
  const args = ["pr", "merge", String(pr), "--" + strategy];
  if (deleteBranch) args.push("--delete-branch");
  ok(gh(args, { cwd }));
}

export function issueCreate(
  cwd: string,
  input: { title: string; body: string; labels: readonly string[] },
): string {
  const args = ["issue", "create", "--title", input.title, "--body", input.body];
  for (const label of input.labels) args.push("--label", label);
  return ok(gh(args, { cwd }));
}

export function issueClose(cwd: string, issue: number, comment: string): void {
  if (comment.trim() !== "") ok(gh(["issue", "comment", String(issue), "--body", comment], { cwd }));
  ok(gh(["issue", "close", String(issue)], { cwd }));
}

/** Current state of an issue, so a merge can prove the issue is closed. */
export function issueViewState(cwd: string, issue: number): string {
  const parsed: unknown = JSON.parse(ok(gh(["issue", "view", String(issue), "--json", "state"], { cwd })));
  if (!isRecord(parsed)) throw new Error("gh issue view returned an unexpected shape");
  return String(parsed.state ?? "");
}

export function issueNumberFromUrl(url: string): number | null {
  const match = /\/(?:issues|pull)\/(\d+)(?:$|[/?#])/.exec(url.trim());
  return match?.[1] ? Number(match[1]) : null;
}
