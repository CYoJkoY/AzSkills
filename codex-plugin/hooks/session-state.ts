/*
 * Per-session state shared by the delivery-loop hooks.
 *
 * The prompt hook records the user prompt here so the Stop and PreToolUse
 * hooks can quote it back to a model whose context was compacted or flooded.
 * The same file carries the bounded counters that stop every guard from
 * fighting its own correction.
 *
 * Every read is defensive: the file lives in a user-writable data directory,
 * so a malformed or hostile value must degrade to an empty state rather than
 * crash a hook. Writes are atomic, serialized with a lock file, and made with
 * owner-only permissions, because a prompt can carry private task context.
 */

import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const MAX_PROMPT_CHARS = 8000;
export const MAX_SAMPLE_CHARS = 2000;

export interface PromptRecord {
  readonly text: string;
  readonly turnId: string;
  readonly capturedAt: number;
}

export interface ReplyRecord {
  readonly sample: string;
  readonly at: number;
  readonly turnId: string;
}

export interface RestartRecord {
  readonly turnId: string;
  readonly at: number;
}

export interface ToolRunRecord {
  readonly fingerprint: string;
  readonly count: number;
  readonly turnId: string;
}

export interface DeliveryState {
  readonly prompt: PromptRecord | null;
  readonly replies: readonly ReplyRecord[];
  readonly restarts: readonly RestartRecord[];
  readonly toolRun: ToolRunRecord | null;
}

/** What an updater returns: the state to store (or null) plus a value for the caller. */
export interface StateUpdate<T> {
  readonly next: DeliveryState | null;
  readonly result: T;
}

const MAX_REPLIES = 4;
const MAX_RESTARTS = 12;
const RESTART_WINDOW_MS = 60 * 60 * 1000;
/** Finished sessions kept on disk; older files are swept so prompts do not pile up. */
const MAX_SESSION_FILES = 32;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOCK_TIMEOUT_MS = 3000;
const LOCK_STALE_MS = 15000;
const DIRECTORY_MODE = 0o700;
const FILE_MODE = 0o600;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function emptyState(): DeliveryState {
  return { prompt: null, replies: [], restarts: [], toolRun: null };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A stable fingerprint for repeated-content detection. */
export function fingerprint(text: string): string {
  return createHash("sha256").update(text.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 32);
}

export function stateDirectory(): string | null {
  const configured = process.env.PLUGIN_DATA;
  if (typeof configured === "string" && configured.trim() !== "") return configured;
  return tmpdir();
}

function stateFile(sessionId: string): string | null {
  const base = stateDirectory();
  if (base === null) return null;
  const key = createHash("sha256").update(sessionId).digest("hex").slice(0, 32);
  return path.join(base, "azskills-delivery-loop", key + ".json");
}

function readPrompt(value: unknown): PromptRecord | null {
  if (!isRecord(value)) return null;
  const text = value.text;
  if (typeof text !== "string" || text.trim() === "") return null;
  const turnId = typeof value.turnId === "string" ? value.turnId : "";
  const capturedAt = typeof value.capturedAt === "number" && Number.isFinite(value.capturedAt) ? value.capturedAt : 0;
  return { text: text.slice(0, MAX_PROMPT_CHARS), turnId, capturedAt };
}

function readReplies(value: unknown): ReplyRecord[] {
  if (!Array.isArray(value)) return [];
  const replies: ReplyRecord[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const sample = typeof item.sample === "string" ? item.sample.slice(0, MAX_SAMPLE_CHARS) : "";
    const at = typeof item.at === "number" && Number.isFinite(item.at) ? item.at : 0;
    const turnId = typeof item.turnId === "string" ? item.turnId : "";
    replies.push({ sample, at, turnId });
  }
  return replies.slice(-MAX_REPLIES);
}

function readRestarts(value: unknown): RestartRecord[] {
  if (!Array.isArray(value)) return [];
  const restarts: RestartRecord[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const at = typeof item.at === "number" && Number.isFinite(item.at) ? item.at : 0;
    const turnId = typeof item.turnId === "string" ? item.turnId : "";
    restarts.push({ turnId, at });
  }
  return restarts.slice(-MAX_RESTARTS);
}

function readToolRun(value: unknown): ToolRunRecord | null {
  if (!isRecord(value)) return null;
  const print = value.fingerprint;
  if (typeof print !== "string" || print === "") return null;
  const count = typeof value.count === "number" && Number.isInteger(value.count) ? value.count : 0;
  const turnId = typeof value.turnId === "string" ? value.turnId : "";
  return { fingerprint: print, count: Math.max(0, Math.min(count, 100)), turnId };
}

export async function readState(sessionId: string): Promise<DeliveryState> {
  const file = stateFile(sessionId);
  if (file === null) return emptyState();
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return emptyState();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return emptyState();
  }
  if (!isRecord(parsed)) return emptyState();
  return {
    prompt: readPrompt(parsed.prompt),
    replies: readReplies(parsed.replies),
    restarts: readRestarts(parsed.restarts),
    toolRun: readToolRun(parsed.toolRun),
  };
}

/** Prunes counters that have aged out so one file never grows without bound. */
export function pruneState(state: DeliveryState, now: number): DeliveryState {
  return {
    prompt: state.prompt,
    replies: state.replies.slice(-MAX_REPLIES),
    restarts: state.restarts.filter((restart) => now - restart.at <= RESTART_WINDOW_MS).slice(-MAX_RESTARTS),
    toolRun: state.toolRun,
  };
}

/**
 * Removes state files for finished sessions so disk usage does not grow with the
 * number of sessions. Age bounds how long a prompt is kept; the count bound caps
 * a busy machine that starts many short sessions.
 */
async function sweepSessions(directory: string): Promise<void> {
  const names = await readdir(directory).catch(() => null);
  if (names === null) return;
  const files: { name: string; mtime: number }[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const info = await stat(path.join(directory, name)).catch(() => null);
    if (info === null) continue;
    files.push({ name, mtime: info.mtimeMs });
  }
  files.sort((a, b) => b.mtime - a.mtime);
  const now = Date.now();
  for (let index = 0; index < files.length; index += 1) {
    const entry = files[index];
    if (entry === undefined) continue;
    if (now - entry.mtime > SESSION_TTL_MS || index >= MAX_SESSION_FILES) {
      await unlink(path.join(directory, entry.name)).catch(() => undefined);
    }
  }
}

/**
 * Writes the state atomically. Returns false when it cannot be stored. The temp
 * name is unique and created with exclusive mode so a pre-existing file or
 * symlink at the target cannot redirect the write.
 */
export async function writeState(sessionId: string, state: DeliveryState): Promise<boolean> {
  const file = stateFile(sessionId);
  if (file === null) return false;
  const directory = path.dirname(file);
  const temporary = file + "." + process.pid + "." + randomUUID() + ".tmp";
  try {
    await mkdir(directory, { recursive: true, mode: DIRECTORY_MODE });
    await writeFile(temporary, JSON.stringify(state) + "\n", { encoding: "utf8", mode: FILE_MODE, flag: "wx" });
    await rename(temporary, file);
    await sweepSessions(directory);
    return true;
  } catch {
    await unlink(temporary).catch(() => undefined);
    // A read-only data directory must never block a turn.
    return false;
  }
}

/** Takes the per-session lock, clearing it when a crashed holder left it stale. */
async function acquireLock(file: string): Promise<boolean> {
  const lock = file + ".lock";
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      const handle = await open(lock, "wx", FILE_MODE);
      await handle.close();
      return true;
    } catch {
      const info = await stat(lock).catch(() => null);
      if (info !== null && Date.now() - info.mtimeMs > LOCK_STALE_MS) {
        await unlink(lock).catch(() => undefined);
        continue;
      }
      if (Date.now() >= deadline) return false;
      await delay(10);
    }
  }
}

async function releaseLock(file: string): Promise<void> {
  await unlink(file + ".lock").catch(() => undefined);
}

/**
 * Runs one read-modify-write of a session's state under an advisory lock so two
 * overlapping hooks cannot both read the same counters and lose one update.
 * Returns null when the session cannot be locked or its state cannot be stored.
 */
export async function withState<T>(
  sessionId: string,
  update: (state: DeliveryState) => StateUpdate<T>,
): Promise<{ readonly stored: boolean; readonly result: T } | null> {
  const file = stateFile(sessionId);
  if (file === null) return null;
  await mkdir(path.dirname(file), { recursive: true, mode: DIRECTORY_MODE }).catch(() => undefined);
  if (!(await acquireLock(file))) return null;
  try {
    const state = await readState(sessionId);
    const { next, result } = update(state);
    const stored = next === null ? true : await writeState(sessionId, next);
    return { stored, result };
  } finally {
    await releaseLock(file);
  }
}

