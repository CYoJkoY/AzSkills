#!/usr/bin/env node
/*
 * Pure classifier for the delivery-loop guard.
 *
 * It turns a shell command or a tool name into a deny reason without touching
 * the filesystem, so the decision can be unit tested on its own. The dispatch
 * wrapper `delivery-guard.ts` adds the project-scope and escape-hatch checks.
 */

export interface BashContext {
  /** Current branch, or null when it cannot be determined. */
  readonly branch: string | null;
  /** Protected base branch, for example `main`. */
  readonly base: string;
  /**
   * Resolve the branch of a directory the command redirects git into with
   * `git -C <dir>` or a leading `cd <dir> &&`. Null means "not known". The
   * default only answers for the caller's own directory.
   */
  readonly branchFor?: (dir: string | null) => string | null;
}

export interface GuardOptions {
  readonly allowManualMerge?: boolean;
  readonly allowBaseWrites?: boolean;
  readonly allowGhCreate?: boolean;
}

const SUBAGENT_TOOLS = new Set([
  "task",
  "agent",
  "spawn_agent",
  "spawn_subagent",
  "subagent",
  "delegate",
  "dispatch_agent",
]);

/**
 * Tool names that carry a shell command. Harnesses differ, so match the family
 * rather than one name; `bashCommand` already reads the common input keys.
 */
const SHELL_TOOLS = new Set([
  "bash",
  "shell",
  "local_shell",
  "exec_command",
  "run_command",
  "run_shell",
  "terminal",
  "powershell",
  "pwsh",
]);

/** Normalize a tool name to a bare lowercase identifier. */
export function normalizeTool(name: string): string {
  const lower = name.trim().toLowerCase().replace(/^mcp__[a-z0-9_]+__/, "");
  const dot = lower.lastIndexOf(".");
  return dot === -1 ? lower : lower.slice(dot + 1);
}

export function isSubagentTool(name: string): boolean {
  return SUBAGENT_TOOLS.has(normalizeTool(name));
}

export function isShellTool(name: string): boolean {
  return SHELL_TOOLS.has(normalizeTool(name));
}

/**
 * Splits a shell command into simple command segments, respecting quotes. The
 * guard needs this because a delivery turn pushes through `cd <worktree> && git
 * push` and `git -C <worktree> push`, and the branch that matters is the one the
 * redirected git call runs on, not the session's current directory.
 */
export function shellSegments(command: string): string[] {
  const segments: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index] ?? "";
    if (quote !== null) {
      current += char;
      if (char === "\\" && index + 1 < command.length && quote === '"') {
        index += 1;
        current += command[index] ?? "";
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    const next = command[index + 1] ?? "";
    const pair = (char === "&" && next === "&") || (char === "|" && next === "|");
    if (pair) {
      segments.push(current);
      current = "";
      index += 1;
      continue;
    }
    if (char === ";" || char === "|" || char === "\n" || char === "\r") {
      segments.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments;
}

/** Splits one segment into tokens, dropping the quotes that grouped them. */
export function shellTokens(segment: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;
  for (let index = 0; index < segment.length; index += 1) {
    const char = segment[index] ?? "";
    if (quote !== null) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      if (started) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }
    current += char;
    started = true;
  }
  if (started) tokens.push(current);
  return tokens;
}

/** One git invocation extracted from a command, with its redirected directory. */
export interface GitCall {
  /** Directory the call was redirected into with `-C` or a leading `cd`. */
  readonly dir: string | null;
  /** Git subcommand, for example `push`. */
  readonly command: string;
  /** Arguments after the subcommand, flags included. */
  readonly args: string[];
}

/**
 * Finds every `git <subcommand>` in a command and the directory it runs in.
 * `git -C <dir> ...` and `cd <dir> && git ...` both redirect it, and both are
 * how the delivery loop reaches a task worktree, so the guard has to follow them
 * or it judges the wrong branch.
 */
export function gitCalls(command: string): GitCall[] {
  const calls: GitCall[] = [];
  let cdDir: string | null = null;
  for (const segment of shellSegments(command)) {
    const tokens = shellTokens(segment);
    const head = tokens[0] ?? "";
    if (head === "cd" || head === "pushd") {
      cdDir = tokens.slice(1).find((token) => !token.startsWith("-")) ?? null;
      continue;
    }
    if (head !== "git") continue;
    const rest = tokens.slice(1);
    let index = 0;
    let explicitDir: string | null = null;
    while (index < rest.length) {
      const token = rest[index] ?? "";
      if (token === "-C") {
        explicitDir = rest[index + 1] ?? null;
        index += 2;
        continue;
      }
      if (token.startsWith("-")) {
        index += 1;
        continue;
      }
      break;
    }
    const sub = rest[index];
    if (sub === undefined) continue;
    calls.push({ dir: explicitDir ?? cdDir, command: sub, args: rest.slice(index + 1) });
  }
  return calls;
}

/** Positional arguments of a git call, in order, with flags removed. */
function positionalArgs(args: readonly string[]): string[] {
  return args.filter((token) => token !== "" && !token.startsWith("-"));
}

const BASE_ALIASES: readonly string[] = ["main", "master"];

/** True when a ref name is the protected base branch or one of its aliases. */
function isBaseRef(name: string, base: string): boolean {
  const clean = name.replace(/^\+/, "").replace(/^refs\/heads\//, "").replace(/^refs\/remotes\/[^/]+\//, "");
  return clean === base || BASE_ALIASES.includes(clean);
}

interface PushPlan {
  /** Directory the push runs in, or null for the caller's directory. */
  readonly dir: string | null;
  /** Explicit refspecs; empty means "push the current branch". */
  readonly refspecs: string[];
  /** True when the push deletes remote branches. */
  readonly deleting: boolean;
}

/** Reads a push's refspecs so the guard can tell an explicit branch from `HEAD`. */
export function pushPlans(command: string): PushPlan[] {
  const plans: PushPlan[] = [];
  for (const call of gitCalls(command)) {
    if (call.command !== "push") continue;
    const values = positionalArgs(call.args);
    plans.push({
      dir: call.dir,
      refspecs: values.slice(1),
      deleting: call.args.includes("-d") || call.args.includes("--delete"),
    });
  }
  return plans;
}

/**
 * Decide whether a shell command violates the delivery workflow.
 * Returns a human-readable reason to deny, or null to allow.
 */
export function denyReasonForBash(
  command: string,
  context: BashContext,
  options: GuardOptions = {},
): string | null {
  const normalized = command.replace(/\s+/g, " ").trim();
  if (normalized === "") return null;

  if (!options.allowManualMerge && /\bgh\s+pr\s+merge\b/.test(normalized)) {
    return "Manual 'gh pr merge' is blocked. Ship through 'azflow ship', which verifies review, score, CI, and mergeability before merging. Set AZFLOW_ALLOW_MANUAL_MERGE=1 to override.";
  }

  // A raw `gh pr create` / `gh issue create` skips the linked-issue sections the
  // ship gates verify, so the task ends up with a pull request that closes
  // nothing. `azflow claim` opens the issue and `azflow pr` builds the body.
  if (!options.allowGhCreate && /\bgh\s+(?:pr|issue)\s+create\b/.test(normalized)) {
    return "Creating a pull request or issue with 'gh ... create' is blocked inside an azflow project: 'azflow claim' opens the linked issue and 'azflow pr' builds the pull request body the ship gates verify. Set AZFLOW_ALLOW_GH_CREATE=1 to override.";
  }

  if (options.allowBaseWrites) return null;

  const branchFor = context.branchFor ?? ((dir: string | null): string | null => (dir === null ? context.branch : null));
  const calls = gitCalls(normalized);

  for (const plan of pushPlans(normalized)) {
    const branch = branchFor(plan.dir);
    const targets = plan.refspecs.map((refspec) => {
      const [source = "", dest = ""] = refspec.split(":");
      const target = (dest === "" ? source : dest).replace(/^\+/, "");
      // `HEAD`, `@`, and an empty source all mean "the branch I am on".
      return target === "HEAD" || target === "@" || target === "" ? branch : target;
    });
    const hitsBase = targets.some((target) => target !== null && isBaseRef(target, context.base));
    if (hitsBase) {
      return "Pushing to the protected base branch '" + context.base + "' is blocked. Commit on a task branch and open a PR. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
    }
    // With an explicit refspec the push name already says what it moves, so an
    // explicit task-branch push is allowed even from the base branch — that is
    // the documented step after `azflow claim` pushes the new worktree branch.
    if (plan.refspecs.length > 0 && !plan.deleting) continue;
    if (branch !== null && branch === context.base) {
      return "Pushing from the base branch '" + context.base + "' is blocked. Claim a task worktree first. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
    }
  }

  for (const call of calls) {
    if (call.command !== "commit") continue;
    const branch = branchFor(call.dir);
    if (branch !== null && branch === context.base) {
      return "Committing on the base branch '" + context.base + "' is blocked. Work in a task worktree from 'azflow claim'. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
    }
  }

  return null;
}

/** Decide whether a tool invocation is a disallowed sub-agent spawn. */
export function denyReasonForTool(
  toolName: string,
  reviewWindow: ReviewWindowCheck | null = null,
  now: number = Date.now(),
  headSha: string | null = null,
): string | null {
  if (!isSubagentTool(toolName)) return null;
  if (reviewWindow !== null && reviewWindowOpen(reviewWindow, now, headSha)) return null;
  return (
    "Spawning a sub-agent is blocked: the delivery loop runs single-agent to avoid mid-task overhead and quality loss. " +
    "To run an independent EGM review, open a review window with 'azflow review-open <task>' and spawn the reviewers inside it. " +
    "Set AZFLOW_ALLOW_SUBAGENTS=1 to override."
  );
}

/** The subset of a review window the guard reads; kept free of filesystem access. */
export interface ReviewWindowCheck {
  readonly engine: string;
  readonly expiresAt: string;
  /** Head SHA the window was opened for; a moved head closes the window. */
  readonly headSha?: string;
}

/**
 * A review window is open only while it targets EGM, has not expired, and — when
 * both sides are known — still points at the current head. A window bound to a
 * stale head cannot authorise a spawn after new work landed.
 */
export function reviewWindowOpen(
  window: ReviewWindowCheck,
  now: number,
  headSha: string | null = null,
): boolean {
  if (window.engine !== "egm") return false;
  const expires = Date.parse(window.expiresAt);
  if (!Number.isFinite(expires) || expires <= now) return false;
  if (window.headSha !== undefined && headSha !== null && window.headSha !== headSha) return false;
  return true;
}

/** Extract the command string from a Bash tool input. */
export function bashCommand(input: unknown): string {
  if (typeof input !== "object" || input === null) return "";
  const record = input as Record<string, unknown>;
  const value = record.command ?? record.input ?? record.cmd;
  return typeof value === "string" ? value : "";
}

export const SUBAGENT_TOOL_NAMES: readonly string[] = [...SUBAGENT_TOOLS];
