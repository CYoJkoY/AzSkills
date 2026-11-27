/*
 * Command allowlist for a goal run.
 *
 * A long run repeats the same investigative commands: list files, search,
 * run tests, read a log. Making the user approve each one turns autonomy into
 * babysitting. This module ships a fixed set of read-only and bounded
 * write-only patterns, plus the per-goal patterns recorded in
 * `.azflow/goal.json`, and matches a parsed command against them.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

/** Safe read-only commands: inspect, search, or print without changing anything. */
export const READ_COMMANDS: readonly string[] = [
  "rg", "grep", "find", "fd", "ls", "dir", "cat", "head", "tail", "wc",
  "file", "stat", "git status", "git log", "git diff", "git show",
  "git branch", "git tag", "git remote", "git rev-parse", "git ls-files",
  "git describe", "node --version", "npm --version", "gh --version",
];

/**
 * Bounded writes the delivery loop itself needs. Tests and checks are included
 * because a run cannot verify its own work without running them. A task-branch
 * push is approved in the dispatcher, where the guard can resolve the branch
 * and refspec; a merge stays out because `azflow ship` owns it.
 */
export const SAFE_WRITE_COMMANDS: readonly string[] = [
  "npm test", "npm run typecheck", "npm run validate", "npm run check",
  "npm run lint", "npm run build", "npx tsc", "npx vitest", "npx jest",
  "npx eslint", "npx prettier --check", "npx oxlint", "git add", "git commit",
  "gh pr view", "gh pr checks", "gh pr diff", "gh run view", "gh run watch",
  "gh run list", "gh issue view", "azflow", "Start-Sleep", "python -m unittest",
  "cargo test", "cargo check", "cargo fmt --check", "go test", "go vet",
];

/** Flags that turn a read into a write; a match must not carry one. */
const DESTRUCTIVE_FLAGS: ReadonlySet<string> = new Set([
  "-d", "-D", "--delete", "-f", "--force", "--hard", "--amend", "--mirror",
  "--force-with-lease", "-o", "--output", "--prune", "--exec", "--set-upstream",
  "-delete", "-exec", "-execdir", "-ok", "--pre", "--ext-diff",
]);

interface GoalFile {
  readonly allowedCommands?: unknown;
}

/** Reads the goal's `allowedCommands`, or an empty list when there is none. */
export async function readGoalAllowlist(project: string): Promise<string[]> {
  const text = await readFile(path.join(project, ".azflow", "goal.json"), "utf8").catch(() => null);
  if (text === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return [];
  const raw = (parsed as GoalFile).allowedCommands;
  if (!Array.isArray(raw)) return [];
  const patterns: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const pattern = item.trim();
    if (pattern !== "") patterns.push(pattern);
  }
  return patterns.slice(0, 40);
}

/** A literal `^...$` or `/.../` pattern; anything else must match exactly. */
function compiled(pattern: string): RegExp | string {
  if (pattern.length >= 3 && pattern.startsWith("/") && pattern.endsWith("/")) {
    try {
      return new RegExp(pattern.slice(1, -1));
    } catch {
      return pattern;
    }
  }
  if (pattern.startsWith("^") && pattern.endsWith("$")) {
    try {
      return new RegExp(pattern);
    } catch {
      return pattern;
    }
  }
  return pattern;
}

function matches(pattern: string, tokens: readonly string[]): boolean {
  const text = tokens.join(" ").trim();
  const expected = compiled(pattern);
  if (expected instanceof RegExp) return expected.test(text);
  return text === expected;
}

/**
 * True when the command matches one of the built-in prefixes without carrying
 * a redirection or a flag that would turn the read into a destructive write.
 * `git log -5` passes; `git tag -d v1` and `rg x > out` do not.
 */
export function isSafeBuiltinCommand(tokens: readonly string[]): boolean {
  const text = tokens.join(" ").trim();
  if (text === "" || text.includes(">")) return false;
  if (tokens.some((token) => DESTRUCTIVE_FLAGS.has(token))) return false;
  for (const pattern of [...READ_COMMANDS, ...SAFE_WRITE_COMMANDS]) {
    if (text === pattern || text.startsWith(pattern + " ")) return true;
  }
  return false;
}

/** True when the parsed command matches a user pattern exactly or by regex. */
export function isAllowedCommand(tokens: readonly string[], patterns: readonly string[]): boolean {
  const text = tokens.join(" ").trim();
  if (text === "") return false;
  for (const pattern of patterns) {
    if (matches(pattern, tokens)) return true;
  }
  return false;
}
