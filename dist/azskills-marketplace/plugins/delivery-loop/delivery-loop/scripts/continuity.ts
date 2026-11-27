/*
 * Continuity checks for a delivery run that has to survive interruption.
 *
 * A long run is interrupted in ways nobody plans for: the host closes
 * mid-turn, a tool call is cancelled, a lease expires while the model is still
 * writing, or the goal claims completion while the ledger still holds open
 * work. Each of those leaves a state the next pass has to notice before it
 * starts something new, or the run quietly abandons a task nobody closed.
 *
 * This module is pure. It reads a goal status, the ledger tasks, and the
 * worktree directory names, and reports what drifted plus the one command that
 * repairs it. Reading the filesystem stays in the callers, so the rules are
 * unit tested without a repository.
 */

/** The lease fields continuity needs; a ledger lease carries more. */
export interface ContinuityLease {
  readonly expiresAt: string;
}

/** The task fields continuity needs; a ledger task carries more. */
export interface ContinuityTask {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly issue: number | null;
  readonly branch: string | null;
  readonly worktree: string | null;
  readonly lease: ContinuityLease | null;
}

export interface ContinuityInput {
  /** Goal status, or null when the project has no goal. */
  readonly goalStatus: string | null;
  readonly tasks: readonly ContinuityTask[];
  /** Directory names present under `.azflow/worktrees`, when known. */
  readonly worktreeDirectories?: readonly string[];
}

export type DriftKind =
  | "interrupted-task"
  | "merged-issue-open"
  | "goal-complete-work-open"
  | "goal-active-work-done"
  | "orphan-worktree";

export interface DriftFinding {
  readonly kind: DriftKind;
  /** Task the finding is about, or an empty string for a project-wide one. */
  readonly taskId: string;
  readonly detail: string;
  /** The command that repairs the finding. */
  readonly fix: string;
}

/** Statuses that need no further work; everything else is still open. */
export const TERMINAL_TASK_STATUSES: readonly string[] = ["merged", "abandoned"];

/** Findings quoted in one briefing; the rest are counted, not listed. */
const MAX_BRIEFING_FINDINGS = 6;

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_TASK_STATUSES.includes(status);
}

/** Tasks that still need a pass: planned, active, review, merged-issue-open. */
export function openTasks(input: ContinuityInput): ContinuityTask[] {
  return input.tasks.filter((task) => !isTerminalStatus(task.status));
}

/** A lease is live only while it parses and has not expired. */
export function leaseAlive(lease: ContinuityLease | null, now: number): boolean {
  if (lease === null) return false;
  const expires = Date.parse(lease.expiresAt);
  return Number.isFinite(expires) && expires > now;
}

/**
 * Every way the goal, the ledger, and the worktree directory can disagree.
 * An empty list means the run can pick up exactly where the ledger says.
 */
export function detectDrift(input: ContinuityInput, now: number): DriftFinding[] {
  const findings: DriftFinding[] = [];
  for (const task of input.tasks) {
    if (task.status === "active" && !leaseAlive(task.lease, now)) {
      findings.push({
        kind: "interrupted-task",
        taskId: task.id,
        detail: task.id + " is active but holds no live lease, so the pass that claimed it never finished.",
        fix: "azflow recover",
      });
    }
    if (task.status === "merged-issue-open") {
      findings.push({
        kind: "merged-issue-open",
        taskId: task.id,
        detail: task.id + " merged its pull request but its linked issue is still open.",
        fix: "azflow ship " + task.id + " --verify-issue",
      });
    }
  }

  const open = openTasks(input);
  if (input.goalStatus === "complete" && open.length > 0) {
    findings.push({
      kind: "goal-complete-work-open",
      taskId: "",
      detail:
        "The goal is marked complete, but the ledger still holds open work: " +
        open.map((task) => task.id + " (" + task.status + ")").join(", ") + ".",
      fix: "azflow goal reopen",
    });
  }
  if (input.goalStatus === "active" && input.tasks.length > 0 && open.length === 0) {
    findings.push({
      kind: "goal-active-work-done",
      taskId: "",
      detail: "Every ledger task is delivered, but the goal is still active.",
      fix: "azflow goal verify, then azflow goal complete",
    });
  }

  const owned = new Set(
    input.tasks
      .map((task) => (task.worktree === null ? "" : task.worktree.replace(/\\/g, "/").split("/").filter((part) => part !== "").at(-1) ?? ""))
      .filter((name) => name !== ""),
  );
  for (const name of input.worktreeDirectories ?? []) {
    if (owned.has(name)) continue;
    findings.push({
      kind: "orphan-worktree",
      taskId: "",
      detail: "Worktree directory " + name + " belongs to no ledger task.",
      fix: "azflow recover --force",
    });
  }

  return findings;
}

/** The one-line summary `azflow doctor` prints for the continuity gate. */
export function driftSummary(findings: readonly DriftFinding[]): string {
  if (findings.length === 0) return "goal, ledger, and worktrees agree";
  return findings.map((finding) => finding.kind).join(", ");
}

/**
 * The session-start briefing. Returns null when nothing drifted, so a healthy
 * run is not told about a repair it does not need.
 */
export function continuityBriefing(
  input: ContinuityInput,
  now: number,
  resume = "",
  options: { readonly exclude?: readonly DriftKind[] } = {},
): string | null {
  const exclude = options.exclude ?? [];
  const findings = detectDrift(input, now).filter((finding) => !exclude.includes(finding.kind));
  if (findings.length === 0) return null;
  const shown = findings.slice(0, MAX_BRIEFING_FINDINGS);
  const lines = [
    "<azflow-continuity>",
    "An earlier pass over this project stopped before the goal, the ledger, and the",
    "worktrees agreed. Nothing was lost: this is what is still open.",
    "",
    ...shown.map((finding) => "- " + finding.detail + " Repair with `" + finding.fix + "`."),
  ];
  if (findings.length > shown.length) {
    lines.push("- " + (findings.length - shown.length) + " more finding(s); run `azflow doctor` for the full list.");
  }
  if (resume !== "") lines.push("", "Resume from: " + resume);
  lines.push(
    "",
    "Settle these before starting new work, and do not claim the goal is complete while",
    "an open task remains.",
    "</azflow-continuity>",
  );
  return lines.join("\n");
}

/**
 * The Stop-time directive used when a goal marked complete still has open
 * ledger work. The goal is reopened once, so the run finishes what it started
 * instead of reporting a delivery that did not happen.
 */
export function driftReopenReason(findings: readonly DriftFinding[]): string {
  return [
    "AZFLOW GOAL REOPENED: the goal was marked complete while the ledger still had open work.",
    "",
    ...findings.map((finding) => "- " + finding.detail + " Repair with `" + finding.fix + "`."),
    "",
    "Finish the open work, then complete the goal again. If the remaining tasks belong",
    "to a different objective, run `azflow goal complete --force --summary \"<why>\"` to",
    "close the goal anyway; this automatic reopen happens at most once per goal.",
  ].join("\n");
}
