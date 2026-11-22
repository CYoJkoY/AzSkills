# Concurrency model

Concurrency is framed as resource admission, not as a roster of agents. The loop
answers one question per turn: which tasks can run now without sharing a mutable
path or a branch?

## The problem with fixed roles

Splitting an agent into planner, coder, tester, and reviewer roles fixes supply.
Real work does not arrive at a constant rate per role, so most roles idle while one
becomes the bottleneck. Each handoff also loses context, which lowers quality and
adds latency. This loop keeps one decision maker and gains concurrency only where
work is genuinely independent.

## Task DAG

A task has:

- `touch`: the glob list it may modify. Two tasks conflict when any glob pair
  overlaps.
- `dependsOn`: task ids that must be `merged` before this task is admissible.
- `status`: `planned`, `active`, `review`, `merged`, or `abandoned`.

The planner walks `planned` tasks in creation order and packs each wave greedily:

1. Skip a task whose dependency is not `merged`.
2. Skip a task whose touch scopes overlap any live lease.
3. Skip a task that overlaps a task already placed in this wave.
4. Stop adding to the wave at `maxParallel`.

The result is a set of waves with an explicit blocked list. Nothing waits on a role;
a task waits only on a real dependency or a real path conflict.

## Touch-scope leases

A lease is `{ owner, token, heartbeatAt, expiresAt }`. Claiming a task issues a
lease for `leaseTtlMinutes` (default 90). The lease is the mutual exclusion token
for the task's paths.

- A lease that has not expired blocks any overlapping claim.
- A lease that has expired is ignored by the planner and reclaimed by `recover`.
- The lease is informational in `azflow plan` and authoritative in `azflow
  claim`, so admission never waits on anyone to approve a wave.
- `azflow claim` enforces the same admission rules the planner reports: a task
  with an unmerged dependency or past the `maxParallel` cap cannot start, even if
  `plan` was never run.

Glob overlap is a conservative over-approximation. `src/**` overlaps `src/a.ts`,
and `*.ts` overlaps `src/a.ts` because `*` is treated as crossing directories when
the pattern has no directory component. Over-approximating is deliberate: a false
conflict costs a wave, a missed conflict costs a corrupted merge.

## Worktree isolation

Each claimed task gets its own branch and its own checkout under
`.azflow/worktrees/<task>/`. Two active tasks therefore never share a working
tree, an index, or a HEAD. This removes the local conflict that appears when two
agents edit the same branch checkout at the same time.

Worktrees are disposable. `recover --force` removes a worktree whose directory is
not referenced by any task. The branch and its commits stay in the repository, so
nothing is lost.

## Serialized merge

Merging is the one step that stays single-threaded. `azflow ship` re-reads the pull
request immediately before merging and refuses when the head SHA moved, CI is not
green, or the base changed. That check is what makes concurrent branches safe to
merge: a stale review cannot merge a newer head.

## Recovery

`azflow recover`:

1. Finds every `active` task whose lease expired.
2. Clears the lease and returns the task to `planned`.
3. Lists worktree directories that no task owns.
4. With `--force`, removes those orphan directories.

Recovery is safe to run at any time. It never deletes a branch.
