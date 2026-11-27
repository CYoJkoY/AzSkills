# Performance

A long run spends most of its time inside the loop's own bookkeeping, not inside
the delivered code. This reference records where that time goes and which checks
are dropped for it.

## The rule

Performance is a stated priority, ranked above checks that only buy reassurance.
When two designs are equally correct, take the cheaper one. When a check costs
more than the failure it prevents, drop it and say so in the change summary. Speed
is not an excuse for a wrong answer, a lost task, or a merge that skipped a gate;
those are correctness, and they keep their cost.

## What was dropped, and why

- The progress marker hashed every dirty file's full content on every pass. With
  `AZFLOW_FAST=1` it hashes size and mtime instead. A pass that edits a file moves
  both, so the marker still detects real progress; the rare edit that keeps length
  and mtime identical is accepted as a miss, because reading every dirty file twice
  per turn is the larger cost.
- Review-report freshness uses size and mtime rather than re-reading twelve
  reports. A rewritten report changes both.
- `azflow doctor` reads the worktree directory once and runs the pure continuity
  rules over what it already read, instead of one filesystem probe per task.
- The drift reopen is bounded to one per goal, so a completed goal costs one
  ledger read and one directory listing, then no further work on later turns.

## What stays

- The ledger write stays locked and atomic: a clobbered ledger loses a task, and
  that is the failure the loop exists to prevent.
- Review scoring and the merge gates read the real diff and the real head SHA.
  Cheap here means reading the wrong thing.
- The loop breaker still counts identical calls. A dead loop is the most expensive
  failure of all, because it spends the whole window and returns nothing.

## Choosing a trade

Prefer a check that is O(1) in the number of files, or that runs once per turn, or
that only runs on drift. A check that runs per file, per pass, per task, or per
message is the one to question. If dropping it can silently corrupt the ledger,
the goal, or the merge decision, it stays.
