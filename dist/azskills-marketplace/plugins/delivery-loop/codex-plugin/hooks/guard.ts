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
}

export interface GuardOptions {
  readonly allowManualMerge?: boolean;
  readonly allowBaseWrites?: boolean;
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

function mentionsProtectedRef(command: string, base: string): boolean {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = new RegExp("(?:^|[^\\w-])(?:main|master|" + escaped + ")(?:$|[^\\w-])");
  // `HEAD:main`, `origin main`, `push main` all target the base.
  return (
    new RegExp(":\\s*(?:main|master|" + escaped + ")\\b").test(command) ||
    new RegExp("\\borigin\\s+(?:main|master|" + escaped + ")\\b").test(command) ||
    explicit.test(command)
  );
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

  const pushes = /\bgit\s+push\b/.test(normalized);
  const commits = /\bgit\s+commit\b/.test(normalized);

  if (!options.allowBaseWrites && pushes && mentionsProtectedRef(normalized, context.base)) {
    return "Pushing to the protected base branch '" + context.base + "' is blocked. Commit on a task branch and open a PR. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
  }
  if (!options.allowBaseWrites && pushes && context.branch !== null && context.branch === context.base) {
    return "Pushing from the base branch '" + context.base + "' is blocked. Claim a task worktree first. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
  }
  if (!options.allowBaseWrites && commits && context.branch !== null && context.branch === context.base) {
    return "Committing on the base branch '" + context.base + "' is blocked. Work in a task worktree from 'azflow claim'. Set AZFLOW_ALLOW_BASE_WRITES=1 to override.";
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
