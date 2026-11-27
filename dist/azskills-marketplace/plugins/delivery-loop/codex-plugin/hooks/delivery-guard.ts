#!/usr/bin/env node
/*
 * PreToolUse dispatcher for the delivery-loop guard.
 *
 * Scope is opt-in per repository: the guard only acts when `.azflow/state.json`
 * exists in the working directory. Outside an azflow project it always allows,
 * so installing the plugin never surprises an unrelated repository.
 */
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import {
  bashCommand,
  blankCommitReason,
  catastrophicDeleteReason,
  denyReasonForBash,
  denyReasonForTool,
  isBoundedPush,
  isDeleteCommand,
  isShellTool,
  shellSegments,
  shellTokens,
} from "./guard.ts";
import type { BashContext, ReviewWindowCheck } from "./guard.ts";
import { loopBreakerReason, normalizeCall } from "./loop-guard.ts";
import { fingerprint, pruneState, withState } from "./session-state.ts";
import { isAllowedCommand, isSafeBuiltinCommand, readGoalAllowlist } from "./goal-allowlist.ts";

interface StateConfig {
  readonly base: string;
}

function out(value: unknown): void {
  process.stdout.write(JSON.stringify(value));
}

function allow(): void {
  out({ continue: true });
}

/**
 * Auto-approves the call so Codex does not ask the user. Only read-only and
 * bounded commands reach this, because a long run's repeated investigations are
 * the bulk of its approval prompts.
 */
function approve(reason: string): void {
  out({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: reason,
    },
  });
}

function deny(reason: string): void {
  out({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

async function parseEvent(): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of process.stdin) raw += String(chunk);
  if (!raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function currentBranch(cwd: string): string | null {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd, encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || typeof result.stdout !== "string") return null;
  const trimmed = result.stdout.trim();
  return trimmed === "" ? null : trimmed;
}

/** Current commit SHA, or null outside a repo / on failure. */
function currentHead(cwd: string): string | null {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || typeof result.stdout !== "string") return null;
  const trimmed = result.stdout.trim();
  return trimmed === "" ? null : trimmed;
}

async function readBase(cwd: string): Promise<string | null> {
  try {
    const text = await readFile(path.join(cwd, ".azflow", "state.json"), "utf8");
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const config = (parsed as { config?: unknown }).config;
    if (typeof config !== "object" || config === null) return null;
    const base = (config as StateConfig).base;
    return typeof base === "string" && base !== "" ? base : null;
  } catch {
    return null;
  }
}

/**
 * Finds the azflow project that owns `start`. The delivery loop works inside
 * `.azflow/worktrees/<id>`, one directory below the project, so a guard that
 * only looked at the current directory would stop protecting the very turns it
 * exists for. Walking up to the nearest `.azflow/state.json` keeps the guard on
 * in a worktree and still leaves unrelated repositories untouched.
 */
async function findProjectRoot(start: string): Promise<string | null> {
  let current = path.resolve(start);
  for (;;) {
    const hasState = await readFile(path.join(current, ".azflow", "state.json"), "utf8")
      .then(() => true)
      .catch(() => false);
    if (hasState) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * Resolves the branch each `git -C <dir>` / `cd <dir> && git` target is on.
 * Without this the guard judged a worktree push by the session's branch and
 * refused the documented step of pushing a task branch from the project root.
 */
function branchResolver(project: string, cwd: string, branch: string | null): (dir: string | null) => string | null {
  const cache = new Map<string, string | null>();
  return (dir: string | null): string | null => {
    if (dir === null) return branch;
    const base = path.isAbsolute(dir) ? dir : path.resolve(project, dir);
    if (base === path.resolve(cwd)) return branch;
    const cached = cache.get(base);
    if (cached !== undefined) return cached;
    const resolved = currentBranch(base);
    cache.set(base, resolved);
    return resolved;
  };
}

/**
 * Reads the short-lived review window, if one is open. The window is the only
 * way a sub-agent spawn is allowed inside a delivery loop, and it is checked
 * again by the guard; a malformed or missing file simply means no window.
 */
async function readReviewWindow(cwd: string): Promise<ReviewWindowCheck | null> {
  try {
    const text = await readFile(path.join(cwd, ".azflow", "review-window.json"), "utf8");
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.engine !== "string" ||
      typeof record.expiresAt !== "string"
    ) {
      return null;
    }
    const headSha = typeof record.headSha === "string" && record.headSha !== "" ? record.headSha : undefined;
    return { engine: record.engine, expiresAt: record.expiresAt, headSha };
  } catch {
    return null;
  }
}

/** Reads `.azflow/goal.json`'s command allowlist, or an empty list when absent. */
async function readGoal(cwd: string): Promise<string[]> {
  return readGoalAllowlist(cwd).catch(() => []);
}

const env = (name: string): boolean => process.env[name] === "1" || process.env[name] === "true";

/** Identical consecutive shell calls that trip the in-turn loop breaker. */
const MAX_IDENTICAL_CALLS = 4;
/**
 * Breaker interruptions allowed per turn. With a known turn id the Stop hook
 * counts the same restarts, so this bounds only the breaker's share of that
 * budget; with no turn id the Stop hook counts none and this caps the breaker
 * alone.
 */
const MAX_BREAKERS_PER_TURN = 2;

/**
 * True when a segment invokes `git push`, including `git -C <dir> push`.
 */
function isPushInvocation(tokens: readonly string[]): boolean {
  if (tokens[0] !== "git") return false;
  let index = 1;
  while (index < tokens.length) {
    const token = tokens[index] ?? "";
    if (token === "-C") {
      index += 2;
      continue;
    }
    if (token.startsWith("-")) {
      index += 1;
      continue;
    }
    return token === "push";
  }
  return false;
}

/**
 * True when every simple shell segment is a built-in safe command, one of the
 * goal's own allowed patterns, a delete, or the loop's bounded task-branch
 * push. A compound command is approved only when all of its parts are, so
 * `rg x > out && rm -rf /` cannot ride in on its first half. `cd`/`pushd` are
 * navigation and are approved with at most one argument.
 */
function commandAutoApproved(command: string, patterns: readonly string[], context: BashContext): boolean {
  const segments = shellSegments(command).map((segment) => segment.trim()).filter((segment) => segment !== "");
  if (segments.length === 0) return false;
  const push = isBoundedPush(command, context);
  return segments.every((segment) => {
    const tokens = shellTokens(segment);
    const head = tokens[0] ?? "";
    if (head === "cd" || head === "pushd" || head === "Set-Location") return tokens.length <= 2;
    // Deleting is ordinary loop work -- a stale worktree, a scratch build
    // directory, a merged branch -- so it is approved without a prompt. The
    // one delete the loop refuses is a whole-volume target, and that check
    // runs as a deny rule before this function is reached.
    if (isDeleteCommand(segment)) return true;
    if (isPushInvocation(tokens)) return push;
    return isSafeBuiltinCommand(tokens) || isAllowedCommand(tokens, patterns);
  });
}

/**
 * Counts consecutive identical shell calls and returns a breaker reason once the
 * same call repeats. The counter resets on every interruption so a later,
 * deliberate re-run of the same command is not denied forever.
 */
async function breakerReason(
  event: Record<string, unknown>,
  toolName: string,
  command: string,
): Promise<string | null> {
  const sessionId = typeof event.session_id === "string" ? event.session_id : "";
  if (sessionId === "") return null;
  const turnId = typeof event.turn_id === "string" ? event.turn_id : "";
  const signature = normalizeCall({ name: toolName, arguments: command });
  if (signature === "") return null;

  const now = Date.now();
  const print = fingerprint(signature);
  const outcome = await withState(sessionId, (stored) => {
    const state = pruneState(stored, now);
    const previous = state.toolRun;
    const sameRun = previous !== null && previous.fingerprint === print && (turnId === "" || previous.turnId === turnId);
    const count = sameRun ? previous.count + 1 : 1;
    if (count < MAX_IDENTICAL_CALLS) {
      return { next: { ...state, toolRun: { fingerprint: print, count, turnId } }, result: null };
    }

    const used = state.restarts.filter((restart) => restart.turnId === turnId).length;
    const recordRestart = used < MAX_BREAKERS_PER_TURN;
    const next = {
      ...state,
      toolRun: { fingerprint: print, count: 0, turnId },
      restarts: recordRestart ? [...state.restarts, { turnId, at: now }] : state.restarts,
    };
    if (!recordRestart) return { next, result: null };

    // Quote the prompt only when it belongs to this turn; another turn's prompt
    // would mislead the model, and the pre-tool hook has no transcript to fall
    // back on.
    const prompt =
      state.prompt !== null && (turnId === "" || state.prompt.turnId === turnId) ? state.prompt.text : null;
    return { next, result: loopBreakerReason({ period: 1, repeats: count, signature, total: count }, "tool", prompt) };
  });
  if (outcome === null || !outcome.stored) return null;
  return outcome.result;
}

async function main(): Promise<void> {
  const event = await parseEvent();
  if (event.hook_event_name !== "PreToolUse") {
    allow();
    return;
  }
  const cwd = process.cwd();
  const project = await findProjectRoot(cwd);
  if (project === null) {
    allow();
    return;
  }
  const base = await readBase(project);
  if (base === null) {
    allow();
    return;
  }
  const toolName = typeof event.tool_name === "string" ? event.tool_name : "";

  if (!env("AZFLOW_ALLOW_SUBAGENTS")) {
    const reason = denyReasonForTool(
      toolName,
      await readReviewWindow(project),
      Date.now(),
      currentHead(cwd),
    );
    if (reason !== null) {
      deny(reason);
      return;
    }
  }

  if (isShellTool(toolName)) {
    const command = bashCommand(event.tool_input);
    const branch = currentBranch(cwd);
    const context: BashContext = { branch, base, branchFor: branchResolver(project, cwd, branch) };
    const reason = denyReasonForBash(command, context, {
      allowManualMerge: env("AZFLOW_ALLOW_MANUAL_MERGE"),
      allowBaseWrites: env("AZFLOW_ALLOW_BASE_WRITES"),
      allowGhCreate: env("AZFLOW_ALLOW_GH_CREATE"),
      allowManualPrComment: env("AZFLOW_ALLOW_MANUAL_PR_COMMENT"),
    });
    if (reason !== null) {
      deny(reason);
      return;
    }
    // A blank commit records nothing to review and nothing to resume from, and
    // a whole-volume delete destroys work no task owns. Both are refused before
    // the approval path, which would otherwise wave them through.
    const blank = blankCommitReason(command);
    if (blank !== null) {
      deny(blank);
      return;
    }
    const catastrophic = catastrophicDeleteReason(command);
    if (catastrophic !== null) {
      deny(catastrophic);
      return;
    }
    const loop = await breakerReason(event, toolName, command);
    if (loop !== null) {
      deny(loop);
      return;
    }
    // Approval comes after the deny rules and the dead-loop breaker: the
    // allowlist removes prompts, it never lifts a guard decision.
    if (!env("AZFLOW_NO_AUTO_APPROVE") && commandAutoApproved(command, await readGoal(project), context)) {
      approve("AZFLOW delivery loop: bounded command auto-approved.");
      return;
    }
  }

  allow();
}

main().catch((error: unknown) => {
  // A guard failure must never block unrelated edits.
  allow();
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
});
