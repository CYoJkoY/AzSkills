# Continuity

A delivery run is interrupted in ways nobody plans for: the host closes mid-turn,
a tool call is cancelled, a lease expires while the model is still writing, a push
fails on a flaky network, or the goal is marked complete while the ledger still
holds a task nobody merged. Each leaves the goal, the ledger, and the worktrees
disagreeing. A run that starts new work before it notices abandons whatever was
open, and the loss is quiet: no merge, no error, and a goal that looks done.

This reference describes what notices, what repairs, and what refuses.

## Drift

`scripts/continuity.ts` is pure. It reads a goal status, the ledger tasks, and the
worktree directory names, and reports the ways they disagree:

- `interrupted-task`: a task is `active` but holds no live lease, so the pass that
  claimed it never finished. Repair with `azflow recover`.
- `merged-issue-open`: the pull request merged but the linked issue is still open.
  Repair with `azflow ship <task> --verify-issue`.
- `goal-complete-work-open`: the goal is complete while open tasks remain. Repair
  with `azflow goal reopen`, or close the goal deliberately with
  `azflow goal complete --force`.
- `goal-active-work-done`: every ledger task is delivered but the goal is still
  active. Repair by verifying and completing the goal.
- `orphan-worktree`: a worktree directory belongs to no ledger task. Repair with
  `azflow recover --force`.

A lease is live only while it parses and has not expired. A task is terminal only
at `merged` or `abandoned`; `planned`, `active`, `review`, and `merged-issue-open`
are all still open.

## Where it shows up

- `SessionStart` injects an `<azflow-continuity>` briefing when the findings are
  non-empty, listing each finding and the one command that repairs it, plus the
  resume point. A healthy project gets nothing, so the briefing is never noise. In
  a task worktree the briefing resolves to the project that owns it.
- `azflow doctor` reports a `continuity` gate whose detail names the finding
  kinds, and fails the check while any remains. It runs outside the ledger block,
  so a project that lost its ledger but left a goal or a worktree is still
  reported.
- The `Stop` hook reopens a complete goal once when open work remains, so the run
  finishes what it started instead of reporting a delivery that did not happen.
  The reopen is budgeted at one per goal; a later turn is left alone.
- `azflow goal complete` refuses while the ledger holds open work. `--force
  --summary "<why>"` is the visible escape when the remaining tasks belong to a
  different objective.
- `azflow goal reopen` moves a `complete`, `abandoned`, or `stalled` goal back to
  `active`, refreshes the progress marker, and records the reopen.

## Blank commits

A commit with no change, or with no message, carries nothing for the review to
score and nothing for the next pass to resume from. The guard refuses
`--allow-empty`, `--allow-empty-message`, and a `-m`/`--message` argument with no
text. The step itself is still recorded with `azflow goal note`.
