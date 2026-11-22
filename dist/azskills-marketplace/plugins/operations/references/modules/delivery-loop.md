---
name: delivery-loop
description: Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically, and merges automatically on green evidence without sub-agents.
version: 1.1.0
status: module
family: operations
modes: [init, plan, work, review, ship, recover]
---

# Delivery Loop

Turn a repository's issue-to-merge work into a repeatable loop: one agent owns
judgement and execution, concurrency comes from independent tasks, and the review
score and the merge are mechanical. This module owns the task ledger, touch-scope
leases, worktree isolation, computed review scoring, the merge gates, and the guard
that blocks manual merges and sub-agent spawns. It does not own the project's own
build commands, its architecture choices, or the content of the code being shipped.

## Contract

- Use when: a repository needs issue-to-merge delivery that stays correct under several concurrent tasks, and review scoring plus merging must be automated instead of hand-driven.
- Do not use when: a one-off edit needs no branch, review record, or merge gate; make the edit directly.
- Owns: the task ledger, touch-scope leases, worktree isolation, computed review scoring, and the nine merge gates.
- Inputs: repository root, base branch, task titles with touch scopes, a structured review record, and the project's own verification command.
- Outputs: admission waves, isolated task worktrees, an English review report with a computed score, and a merged pull request with its issue closed.
- Compose with: `az-clean-code` when the delivered code must also meet explicit-code rules; `taste` when judgment and collaboration guidance should stay active during the work.
- Gates: never spawn a sub-agent, never commit or push on the base branch, never merge without a PASS review at the exact head SHA, and never let the model choose its own score.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `init` | A repository has no ledger yet | Detect the git root and base branch, write the local ledger, ignore it in git | Ledger path and detected base |
| `plan` | Several tasks must be ordered safely | Pack planned tasks into dependency waves that respect leases and touch-scope disjointness | Waves, blocked list, and scope overlaps |
| `work` | One admitted task is ready to implement | Claim the task, create its branch and worktree, implement as a single agent, commit in reviewable stages | Worktree path, branch, and commits |
| `review` | A diff is ready for scoring | Score the structured review record, inject scanner findings, write the report | Report with computed score and verdict |
| `ship` | A review passed | Re-check every gate at the current head SHA, merge with the configured strategy, close the issue | Merge outcome and synced base |
| `recover` | A lease expired or a task stalled | Release expired leases, return the task to the plan, list orphan worktrees | Reclaimed tasks and orphan list |

## Workflow

1. Run `azflow init` in the repository. It writes `.azflow/state.json` plus a
   nested `.gitignore` containing `*`, so the ledger stays local, and detects the
   base branch from `origin/HEAD`.
2. Record tasks with `azflow add "<title>" --touch <glob> [--touch <glob>]
   [--dep T-0001]`. Each task owns its touch scopes and its dependencies.
3. Run `azflow plan` to pack planned tasks into waves. A task waits when a
   dependency is unmerged, when the wave is already at `maxParallel`, or when its
   touch scopes overlap a live lease. Admission is demand-driven, never a fixed
   roster.
4. Run `azflow claim <task>` to create the branch and worktree under
   `.azflow/worktrees/`, then issue a time-bounded lease. Claim re-checks the same
   admission rules, so a task cannot start just because `plan` was skipped.
5. Implement inside the worktree and commit in small, reviewable stages.
6. Run `azflow issue <task>` for the issue, then push the branch and run
   `azflow pr <task>` to open a linked draft pull request. Run `azflow ready
   <task>` once local checks pass.
7. Run `azflow review <task> --input review.json --scan` to score the record. The
   task must have a claimed worktree; the command derives its real diff and head,
   always runs the mechanical scanner, and ignores model-supplied file lists. The
   first review must be round 1; every later round advances by one and carries the
   previous recorded score. Add `--post` to publish the report on the pull request.
8. Run `azflow ship <task>` to evaluate every gate against the current head SHA and
   merge only on a full pass, then close the issue and fast-forward the base.
9. Run `azflow recover` after an interrupted task to release its lease and return
   it to `planned`; add `--force` to remove orphan worktree directories.

## Concurrency model

Concurrency is a resource problem, not a staffing problem. The loop never splits a
task across planner, coder, tester, and reviewer roles, because those roles idle at
different rates and each handoff loses context. Instead it admits independent work:

- A task declares the paths it may touch (`--touch`). Two overlapping globs
  conflict; glob overlap is a deliberate over-approximation.
- A lease carries an owner, a token, and an expiry. An expired lease frees its
  scope for the next wave, and `recover` returns the task to `planned`.
- Each claimed task gets its own branch and worktree, so two active tasks never
  share a working tree, an index, or a HEAD. That removes the local conflict that
  appears when two agents edit one checkout at once.
- Waves pack as many disjoint tasks as `maxParallel` allows. A conflicting task
  moves to a later wave instead of blocking unrelated work.
- Merge stays serialized. `ship` re-reads the pull request immediately before
  merging and refuses when the head SHA moved, so a concurrent push is never
  overwritten.

## Review scoring

The reviewer finds defects; the script decides the number. The model supplies
findings, probe results, dimension results, and real verification output, and it
never types a score into the report.

- Base score is 5.00. Deductions are P0 2.50, P1 1.50, P2 0.50, P3 0.20, P4 0.10.
- Hard caps: any P0 caps at 2.00, any P1 at 3.50, and any P2 at 4.50. P3 and P4
  rely on their weight: one P3 lands at 4.80 and one P4 at 4.90, so a second P3 or
  P4 clears the bar only if the rest of the round is otherwise clean.
- A pass requires zero P0/P1/P2, a score at or above 4.90, and a round within the
  repair budget of six.
- An unreviewed diff file, a missing or failed verification command, an incomplete
  probe set, a dimension marked failing, or an unevidenced finding each caps the
  report and adds a blocking finding.
- The score may rise only as fast as the findings recorded as resolved justify, so
  a weak round cannot jump to a pass.
- Review records are grounded in a claimed worktree and the current head. The real
  diff is scanned on every review, and rounds cannot be replayed, skipped, or omit
  the previous recorded score.
- A mechanical scanner injects secrets, conflict markers, `any`, empty catches,
  framework imports, tab indentation, debug logs, loose equality, and TODO markers
  before scoring, so the model cannot hide them.
- The posted report follows a fixed template: head SHA, verdict, score, the
  previous-round closure table, the deduction breakdown, every P0-P4 row, and the
  four dimension summaries.

## Auto-merge gates

`azflow ship` merges only when every gate passes at the same head SHA:

1. A recorded review exists and its verdict is PASS.
2. The review score meets the threshold (default 4.90).
3. The reviewed head SHA equals the pull request head SHA.
4. Required CI checks are green with no failing or pending check.
5. The pull request is mergeable and not dirty.
6. The base branch is unchanged from the configured base.
7. No blocking label (`do-not-merge`, `blocked`, `wip`, `needs-decision`).
8. The pull request is not a draft.
9. Autonomy is `full`. Set autonomy to `manual` to require a human ship.

On a pass the loop merges with `mergeStrategy` (squash by default), records the
merge, closes the linked issue, and fast-forwards the base branch. Merge is never
delegated to a manual `gh pr merge`; the guard denies that command so the gates
cannot be skipped.

## Quality gates

- Confirm the ledger is git-ignored and the guard is active before claiming work.
- Verify each claim names disjoint touch scopes; a conflict waits for a later wave.
- Verify the shipped head SHA equals the reviewed head SHA, not an earlier commit.
- Confirm the review report carries the closure table, the breakdown, every P0-P4
  row, the four dimensions, and real command output.
- Confirm no sub-agent was spawned and no commit touched the base branch.

## Output contract

Return the admission plan or the claimed task's worktree and branch, the review
report with its computed score and gates, and the merge outcome with the issue
closed and the base branch synced. A merge without a PASS review at the same head
SHA is a failed delivery, not a shortcut.

## References

- [Concurrency model](../../delivery-loop/references/concurrency.md) - task DAG, leases, worktree isolation, and serialized merge.
- [Review scoring](../../delivery-loop/references/review.md) - review input shape, formula, caps, and anti-lenience rules.
- [Automation surface](../../delivery-loop/references/automation.md) - command surface, issue and pull request automation, and the guard.
- [Local ledger](../../delivery-loop/references/ledger.md) - ledger layout, state schema, and atomic locked writes.
- [Migration guide](../../delivery-loop/references/migration.md) - moving rules out of AGENTS.md into this plugin.
