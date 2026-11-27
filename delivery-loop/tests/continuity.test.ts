/*
 * Unit tests for the continuity checks. A run is interrupted in ways nobody
 * plans for, so these assert that a stopped pass is reported before the next
 * one starts new work, and that a healthy run is left alone.
 */
import assert from "node:assert/strict";
import {
  TERMINAL_TASK_STATUSES,
  continuityBriefing,
  detectDrift,
  driftReopenReason,
  driftSummary,
  isTerminalStatus,
  leaseAlive,
  openTasks,
} from "../scripts/continuity.ts";
import type { ContinuityTask } from "../scripts/continuity.ts";

const now = Date.parse("2026-01-01T00:00:00.000Z");
const liveLease = { expiresAt: "2026-01-01T01:00:00.000Z" };
const deadLease = { expiresAt: "2025-12-31T23:00:00.000Z" };

const task = (patch: Partial<ContinuityTask> & { readonly id: string }): ContinuityTask => ({
  title: patch.id,
  status: "planned",
  issue: null,
  branch: null,
  worktree: null,
  lease: null,
  ...patch,
});

assert.deepEqual([...TERMINAL_TASK_STATUSES], ["merged", "abandoned"]);
assert.equal(isTerminalStatus("merged"), true);
assert.equal(isTerminalStatus("abandoned"), true);
assert.equal(isTerminalStatus("review"), false);
assert.equal(isTerminalStatus("merged-issue-open"), false);

assert.equal(leaseAlive(null, now), false);
assert.equal(leaseAlive(liveLease, now), true);
assert.equal(leaseAlive(deadLease, now), false);
assert.equal(leaseAlive({ expiresAt: "not a date" }, now), false);

assert.deepEqual(
  openTasks({
    goalStatus: "active",
    tasks: [task({ id: "T-1", status: "merged" }), task({ id: "T-2", status: "review" })],
  }).map((entry) => entry.id),
  ["T-2"],
);

// A ledger and worktree set that agree produces no findings.
assert.deepEqual(
  detectDrift(
    {
      goalStatus: "active",
      tasks: [task({ id: "T-1", status: "active", lease: liveLease, worktree: ".azflow/worktrees/T-1" })],
      worktreeDirectories: ["T-1"],
    },
    now,
  ),
  [],
);

// An active task whose lease lapsed is the pass that never finished.
const interrupted = detectDrift({ goalStatus: "active", tasks: [task({ id: "T-1", status: "active", lease: deadLease })] }, now);
assert.deepEqual(interrupted.map((finding) => finding.kind), ["interrupted-task"]);
assert.equal(interrupted[0]?.taskId, "T-1");
assert.match(interrupted[0]?.fix ?? "", /azflow recover/);

// A merged task whose issue is still open has one command left.
const merged = detectDrift({ goalStatus: "active", tasks: [task({ id: "T-1", status: "merged-issue-open" })] }, now);
assert.deepEqual(merged.map((finding) => finding.kind), ["merged-issue-open"]);
assert.match(merged[0]?.fix ?? "", /azflow ship T-1 --verify-issue/);

// A goal that claims complete while work is open, and the reverse.
const completeWithWork = detectDrift({ goalStatus: "complete", tasks: [task({ id: "T-1", status: "review" })] }, now);
assert.deepEqual(completeWithWork.map((finding) => finding.kind), ["goal-complete-work-open"]);
assert.match(completeWithWork[0]?.fix ?? "", /azflow goal reopen/);
const activeWithDone = detectDrift({ goalStatus: "active", tasks: [task({ id: "T-1", status: "merged" })] }, now);
assert.deepEqual(activeWithDone.map((finding) => finding.kind), ["goal-active-work-done"]);

// A worktree directory no task owns is left over from a task that is gone.
const orphan = detectDrift(
  { goalStatus: "paused", tasks: [task({ id: "T-1", status: "merged", worktree: ".azflow/worktrees/T-1" })], worktreeDirectories: ["T-1", "T-9"] },
  now,
);
assert.deepEqual(orphan.map((finding) => finding.kind), ["orphan-worktree"]);
assert.match(orphan[0]?.detail ?? "", /T-9/);

assert.equal(driftSummary([]), "goal, ledger, and worktrees agree");
assert.equal(driftSummary(interrupted), "interrupted-task");
assert.equal(driftSummary([...interrupted, ...orphan]), "interrupted-task, orphan-worktree");

// A healthy run gets no briefing; a drifted one names the repair.
assert.equal(continuityBriefing({ goalStatus: "active", tasks: [task({ id: "T-1", status: "review" })] }, now), null);
const briefing = continuityBriefing(
  { goalStatus: "active", tasks: [task({ id: "T-1", status: "active", lease: deadLease })] },
  now,
  "Run the failing test",
);
assert.ok(briefing !== null);
assert.match(briefing ?? "", /^<azflow-continuity>/);
assert.match(briefing ?? "", /azflow recover/);
assert.match(briefing ?? "", /Resume from: Run the failing test/);
assert.match(briefing ?? "", /<\/azflow-continuity>$/);

// Excluding a kind drops it from the briefing without touching the rest.
assert.equal(
  continuityBriefing({ goalStatus: "active", tasks: [task({ id: "T-1", status: "merged" })] }, now, "", {
    exclude: ["goal-active-work-done"],
  }),
  null,
);

const reopen = driftReopenReason(completeWithWork);
assert.match(reopen, /AZFLOW GOAL REOPENED/);
assert.match(reopen, /azflow goal complete --force/);

console.log("continuity.test.ts: lease, open tasks, drift kinds, briefing, and reopen passed");
