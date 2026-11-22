/*
 * Delivery loop ledger.
 *
 * The ledger is a local, per-project coordination file. It is deliberately not
 * committed: GitHub issues and pull requests stay the durable cross-machine
 * record, while this file only arbitrates parallel work on one checkout.
 */

import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

export type TaskStatus =
  | "planned"
  | "active"
  | "review"
  | "merged"
  | "abandoned";

export interface TaskLease {
  readonly owner: string;
  readonly token: string;
  readonly heartbeatAt: string;
  readonly expiresAt: string;
}

export interface ReviewRecord {
  readonly headSha: string;
  readonly round: number;
  readonly score: number;
  readonly verdict: "PASS" | "FAIL";
  readonly at: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  touch: string[];
  dependsOn: string[];
  issue: number | null;
  branch: string | null;
  worktree: string | null;
  pr: number | null;
  lease: TaskLease | null;
  review: ReviewRecord | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowConfig {
  base: string;
  remote: string;
  maxParallel: number;
  autonomy: "full" | "manual";
  reviewThreshold: number;
  leaseTtlMinutes: number;
  mergeStrategy: "squash" | "merge" | "rebase";
  allowFrameworks: string[];
}

export interface FlowState {
  schemaVersion: 1;
  config: FlowConfig;
  sequence: number;
  tasks: Task[];
}

export const STATE_SCHEMA_VERSION = 1;

export const DEFAULT_CONFIG: FlowConfig = {
  base: "main",
  remote: "origin",
  maxParallel: 3,
  autonomy: "full",
  reviewThreshold: 4.9,
  leaseTtlMinutes: 90,
  mergeStrategy: "squash",
  allowFrameworks: [],
};

export const flowRoot = (project: string): string => path.join(project, ".azflow");
export const statePath = (project: string): string =>
  path.join(flowRoot(project), "state.json");
export const worktreesRoot = (project: string): string =>
  path.join(flowRoot(project), "worktrees");
export const reviewsRoot = (project: string): string =>
  path.join(flowRoot(project), "reviews");

const nowIso = (): string => new Date().toISOString();

export async function pathExists(target: string): Promise<boolean> {
  return stat(target)
    .then(() => true)
    .catch(() => false);
}

/** Reads the ledger, or null when the project has not been initialised. */
export async function readState(project: string): Promise<FlowState | null> {
  const text = await readFile(statePath(project), "utf8").catch(() => null);
  if (text === null) return null;
  const parsed: unknown = JSON.parse(text);
  if (!isFlowState(parsed)) {
    throw new Error("Invalid ledger at " + statePath(project));
  }
  return parsed;
}

export async function requireState(project: string): Promise<FlowState> {
  const state = await readState(project);
  if (state === null) {
    throw new Error("No ledger found. Run: azflow init");
  }
  return state;
}

export function isFlowState(value: unknown): value is FlowState {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== STATE_SCHEMA_VERSION) return false;
  if (!isRecord(value.config)) return false;
  if (!Array.isArray(value.tasks)) return false;
  if (typeof value.sequence !== "number") return false;
  return value.tasks.every(isTask) && isConfig(value.config);
}

function isConfig(value: Record<string, unknown>): boolean {
  return (
    typeof value.base === "string" &&
    value.base !== "" &&
    typeof value.remote === "string" &&
    value.remote !== "" &&
    isPositiveInt(value.maxParallel) &&
    (value.autonomy === "full" || value.autonomy === "manual") &&
    typeof value.reviewThreshold === "number" &&
    Number.isFinite(value.reviewThreshold) &&
    value.reviewThreshold >= 0 &&
    value.reviewThreshold <= 5 &&
    isPositiveInt(value.leaseTtlMinutes) &&
    (value.mergeStrategy === "squash" ||
      value.mergeStrategy === "merge" ||
      value.mergeStrategy === "rebase") &&
    isStringArray(value.allowFrameworks)
  );
}

const TASK_STATUSES: readonly TaskStatus[] = ["planned", "active", "review", "merged", "abandoned"];

function isPositiveInt(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isLease(value: unknown): value is TaskLease {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.token === "string" &&
    typeof value.heartbeatAt === "string" &&
    typeof value.expiresAt === "string"
  );
}

function isReview(value: unknown): value is ReviewRecord {
  return (
    isRecord(value) &&
    typeof value.headSha === "string" &&
    typeof value.round === "number" &&
    Number.isInteger(value.round) &&
    typeof value.score === "number" &&
    (value.verdict === "PASS" || value.verdict === "FAIL") &&
    typeof value.at === "string"
  );
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.title === "string" &&
    TASK_STATUSES.includes(value.status as TaskStatus) &&
    isStringArray(value.touch) &&
    isStringArray(value.dependsOn) &&
    (value.issue === null || typeof value.issue === "number") &&
    (value.branch === null || typeof value.branch === "string") &&
    (value.worktree === null || typeof value.worktree === "string") &&
    (value.pr === null || typeof value.pr === "number") &&
    (value.lease === null || isLease(value.lease)) &&
    (value.review === null || isReview(value.review)) &&
    typeof value.notes === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Writes the ledger through a temporary file so a crash cannot truncate it. */
export async function writeState(project: string, state: FlowState): Promise<void> {
  const target = statePath(project);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = target + "." + randomBytes(6).toString("hex") + ".tmp";
  await writeFile(temp, JSON.stringify(state, null, 2) + "\n", "utf8");
  await rename(temp, target);
}

const LOCK_STALE_MS = 30_000;
const LOCK_TIMEOUT_MS = 15_000;

/**
 * Serialises read-modify-write cycles with an exclusive directory.
 * A crashed holder expires after 30 seconds instead of blocking forever.
 */
export async function withLock<T>(
  project: string,
  action: (state: FlowState) => Promise<T>,
): Promise<T> {
  const lock = path.join(flowRoot(project), "state.lock");
  await mkdir(path.dirname(lock), { recursive: true });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let held = false;
  while (!held) {
    try {
      await mkdir(lock);
      held = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;
      const age = await stat(lock)
        .then((info) => Date.now() - info.mtimeMs)
        .catch(() => 0);
      if (age > LOCK_STALE_MS) {
        await rm(lock, { recursive: true, force: true }).catch(() => undefined);
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error("Ledger is locked by another process: " + lock);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  try {
    const state = await requireState(project);
    const result = await action(state);
    await writeState(project, state);
    return result;
  } finally {
    await rm(lock, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function newTaskId(state: FlowState): string {
  state.sequence += 1;
  return "T-" + String(state.sequence).padStart(4, "0");
}

export function makeTask(id: string, title: string, touch: string[]): Task {
  const at = nowIso();
  return {
    id,
    title,
    status: "planned",
    touch,
    dependsOn: [],
    issue: null,
    branch: null,
    worktree: null,
    pr: null,
    lease: null,
    review: null,
    notes: "",
    createdAt: at,
    updatedAt: at,
  };
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug === "" ? "task" : slug;
}

export function leaseAlive(lease: TaskLease | null, now: number): boolean {
  if (lease === null) return false;
  const expires = Date.parse(lease.expiresAt);
  return Number.isFinite(expires) && expires > now;
}

export function issueLease(
  task: Task,
  owner: string,
  ttlMinutes: number,
): TaskLease {
  const at = new Date();
  const expires = new Date(at.getTime() + ttlMinutes * 60_000);
  task.lease = {
    owner,
    token: randomBytes(8).toString("hex"),
    heartbeatAt: at.toISOString(),
    expiresAt: expires.toISOString(),
  };
  task.updatedAt = at.toISOString();
  return task.lease;
}

/** Glob support is limited to `**`, `*`, and `?`; enough for touch scopes. */
export function globToRegExp(pattern: string): RegExp {
  const normalized = pattern
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");
  let out = "^";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index] ?? "";
    if (char === "*") {
      if (normalized[index + 1] === "*") {
        index += 1;
        if (normalized[index + 1] === "/") {
          index += 1;
          out += "(?:.*/)?";
        } else {
          out += ".*";
        }
      } else {
        out += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      out += "[^/]";
      continue;
    }
    out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(out + "$");
}

export function matchesAny(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(file));
}

const isWild = (segment: string): boolean => /[*?]/.test(segment);
const onlyDeep = (segments: readonly string[]): boolean =>
  segments.length === 0 || (segments.length === 1 && segments[0] === "**");
const segmentsOf = (pattern: string): string[] => {
  const normalized = pattern
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");
  const segments = normalized.split("/");
  // A wildcard with no directory component is treated as crossing directories,
  // matching the documented conservative overlap rule (e.g. `*.ts` vs `src/a.ts`).
  if (segments.length === 1 && normalized !== "**" && isWild(normalized)) {
    return ["**", normalized];
  }
  return segments;
};

/**
 * Conservative overlap test between two touch patterns.
 * It may report an overlap that does not exist; it never misses one.
 */
export function globsIntersect(left: string, right: string): boolean {
  const a = segmentsOf(left);
  const b = segmentsOf(right);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a[i] ?? "";
    const y = b[j] ?? "";
    if (x === "**" || y === "**") return true;
    if (x === y) {
      i += 1;
      j += 1;
      continue;
    }
    if (isWild(x) || isWild(y)) {
      i += 1;
      j += 1;
      continue;
    }
    return false;
  }
  return onlyDeep(a.slice(i)) && onlyDeep(b.slice(j));
}

export function touchConflict(left: readonly string[], right: readonly string[]): string | null {
  for (const a of left) {
    for (const b of right) {
      if (globsIntersect(a, b)) return a + " vs " + b;
    }
  }
  return null;
}

export interface PlanWave {
  readonly index: number;
  readonly tasks: string[];
}

export interface PlanBlocked {
  readonly id: string;
  readonly reason: string;
}

export interface Plan {
  readonly waves: PlanWave[];
  readonly blocked: PlanBlocked[];
  readonly active: string[];
  readonly conflicts: string[];
}

/**
 * Admission is demand-driven. Work is packed into waves by dependency and
 * touch-scope disjointness, never by a fixed roster of roles. A task that
 * conflicts with an already admitted task waits for the next wave instead of
 * blocking unrelated work.
 */
export function planWaves(state: FlowState, now: number): Plan {
  const byId = new Map(state.tasks.map((task) => [task.id, task]));
  const active = state.tasks
    .filter((task) => task.status === "active" && leaseAlive(task.lease, now))
    .map((task) => task.id);
  const activeScopes = active
    .map((id) => byId.get(id))
    .filter((task): task is Task => task !== undefined)
    .map((task) => task.touch);

  const blocked: PlanBlocked[] = [];
  const ready: Task[] = [];
  for (const task of state.tasks) {
    if (task.status !== "planned") continue;
    const pending = task.dependsOn.filter((id) => {
      const dependency = byId.get(id);
      return dependency === undefined || dependency.status !== "merged";
    });
    if (pending.length > 0) {
      blocked.push({ id: task.id, reason: "waiting on " + pending.join(", ") });
      continue;
    }
    ready.push(task);
  }

  const waves: PlanWave[] = [];
  const placed = new Set<string>();
  while (placed.size < ready.length) {
    const wave: Task[] = [];
    const waveScopes: string[][] = [];
    for (const task of ready) {
      if (placed.has(task.id)) continue;
      if (wave.length >= state.config.maxParallel) break;
      const conflictsActive = activeScopes.some(
        (scope) => touchConflict(scope, task.touch) !== null,
      );
      if (conflictsActive) continue;
      const conflictsWave = waveScopes.some(
        (scope) => touchConflict(scope, task.touch) !== null,
      );
      if (conflictsWave) continue;
      wave.push(task);
      waveScopes.push(task.touch);
    }
    if (wave.length === 0) {
      for (const task of ready) {
        if (!placed.has(task.id)) {
          blocked.push({
            id: task.id,
            reason: "conflicts with an active lease or is over capacity",
          });
          placed.add(task.id);
        }
      }
      break;
    }
    waves.push({ index: waves.length + 1, tasks: wave.map((task) => task.id) });
    for (const task of wave) placed.add(task.id);
  }

  const conflicts: string[] = [];
  for (let i = 0; i < state.tasks.length; i += 1) {
    for (let j = i + 1; j < state.tasks.length; j += 1) {
      const left = state.tasks[i];
      const right = state.tasks[j];
      if (left === undefined || right === undefined) continue;
      if (left.status === "merged" || right.status === "merged") continue;
      const overlap = touchConflict(left.touch, right.touch);
      if (overlap !== null) conflicts.push(left.id + " ~ " + right.id + " (" + overlap + ")");
    }
  }

  return { waves, blocked, active, conflicts };
}

export function findTask(state: FlowState, id: string): Task {
  const task = state.tasks.find((candidate) => candidate.id === id);
  if (task === undefined) throw new Error("Unknown task: " + id);
  return task;
}

export function findTaskByPr(state: FlowState, pr: number): Task | null {
  return state.tasks.find((task) => task.pr === pr) ?? null;
}

export async function listReviewFiles(project: string): Promise<string[]> {
  const directory = reviewsRoot(project);
  const entries = await readdir(directory).catch(() => [] as string[]);
  return entries.filter((name) => name.endsWith(".json")).sort();
}

export function touch(task: Task, at = nowIso()): void {
  task.updatedAt = at;
}
