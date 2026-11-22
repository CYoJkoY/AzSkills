---
name: delivery-loop
description: Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically, and merges automatically on green evidence without sub-agents.
version: 1.2.0
status: module
family: operations
modes: [init, plan, work, review, ship, recover]
---

# Delivery Loop

Turn a repository's issue-to-merge work into a repeatable loop: one agent owns
judgement and execution, concurrency comes from independent tasks, and the review
score and the merge are mechanical. This module owns the task ledger, touch-scope
leases, worktree isolation, computed review scoring, the merge gates, and the guard
that blocks manual merges and sub-agent spawns. It also owns final-reply output
hygiene, because a clean reply is cheaper context and a long run survives on cheap
context. It does not own the project's own build commands, its architecture
choices, or the content of the code being shipped.

## Contract

- Use when: a repository needs issue-to-merge delivery that stays correct under several concurrent tasks, and review scoring plus merging must be automated instead of hand-driven.
- Do not use when: a one-off edit needs no branch, review record, or merge gate; make the edit directly.
- Owns: the task ledger, touch-scope leases, worktree isolation, computed review scoring, the nine merge gates, and final-reply output hygiene.
- Inputs: repository root, base branch, task titles with touch scopes, a structured review record, and the project's own verification command.
- Outputs: admission waves, isolated task worktrees, an English review report with a computed score, and a merged pull request with its issue closed.
- Compose with: `az-clean-code` when the delivered code must also meet explicit-code rules; `taste` when judgment and collaboration guidance should stay active during the work.
- Gates: never spawn a sub-agent, never commit or push on the base branch, never merge without a PASS review at the exact head SHA, never let the model choose its own score, and never ship a final reply that opens with a raw reasoning block. Installing the plugin delegates issue creation, branch push, pull request creation, review posting, merge, and cleanup, so the loop runs that path without asking for per-action approval.

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
   nested `.gitignore` containing `*`, so the ledger stays local, detects the base
   branch from `origin/HEAD`, and records the static check commands that every
   commit must pass (`--check "<cmd>"`, or the repository's own `typecheck` and
   `lint` scripts). A ledger with no recorded check refuses commits until checks
   are added.
2. Record tasks with `azflow add "<title>" --touch <glob> [--touch <glob>]
   [--dep T-0001]`. Each task owns its touch scopes and its dependencies.
3. Run `azflow plan` to pack planned tasks into waves. A task waits when a
   dependency is unmerged, when the wave is already at `maxParallel`, or when its
   touch scopes overlap a live lease. Admission is demand-driven, never a fixed
   roster.
4. Run `azflow issue <task>` so the branch commits have an issue to cite. The
   issue is created from the task body, without asking the user first.
5. Run `azflow claim <task>` to create the branch and worktree under
   `.azflow/worktrees/`, then issue a time-bounded lease. Claim re-checks the same
   admission rules, so a task cannot start just because `plan` was skipped.
6. Implement inside the worktree and commit in small, reviewable stages.
7. Commit each stage with `azflow commit <task> --type <type> --scope <scope>
   --subject "<subject>"`. The command refuses an empty index, refuses a ledger
   that records no static check, runs the recorded checks, and enforces the commit
   standard below, so a red tree never gets a message or a commit; `--skip-check`
   is the visible escape.
8. Run the project's own checks on the final head, push the branch, then run
   `azflow review <task> --input review.json --scan` to score the record. The
   task must have a claimed worktree; the command derives its real diff and head,
   always runs the mechanical scanner, and ignores model-supplied file lists. The
   first review must be round 1; every later round advances by one and carries the
   previous recorded score.
9. Run `azflow pr <task>` to open a linked draft pull request with a derived title
   and body, then `azflow ready <task>` to take it out of draft. Push without asking
   the user first; the branch push is part of opening the pull request. `pr` refuses
   until a passing review round with a green verification exists, because opening
   the pull request is the point where the stage becomes visible; it posts the
   recorded report as the first comment. `--allow-unverified` opens it earlier on
   purpose.
10. Run `azflow ship <task>` to refresh the pull request body from the recorded
   review, evaluate every gate against the current head SHA, and merge only on a
   full pass, then close the issue and fast-forward the base. Once merged, delete
   the local task branch and return to the base branch without asking, because the
   remote already dropped the merged branch.
11. Run `azflow recover` after an interrupted task to release its lease and return
   it to `planned`; add `--force` to remove orphan worktree directories.

A repair round after `ready` re-runs the checks. The pull request stays open and
`ship` refuses while the reviewed head differs from the pull request head, so an
unreviewed fix never merges.

## Commit and pull request standard

The message format is enforced by code, not by convention, because a convention
cannot stop a malformed commit once it exists.

- ASCII only for commit messages and pull request metadata: printable
  `0x20`-`0x7E` plus real LF, with no CJK, full-width punctuation, emoji,
  zero-width characters, or literal `\n` escapes.
- Commit header `<type>(<scope>)[!]: <imperative subject>`, a type from `feat`,
  `fix`, `refactor`, `perf`, `test`, `build`, `ci`, `docs`, `chore`, a lowercase
  verb subject, no trailing period, no `#<id>`, 50 characters as the target and 72
  as the hard ceiling.
- `!` and a `BREAKING CHANGE:` footer are required together: either half alone is
  rejected.
- Exactly one `Refs: #<issue-id>` footer, so staged commits stay traceable without
  closing the issue early.
- One reviewable stage per commit, no mixed types, and no vague subjects such as
  `update files`, `misc fixes`, or `wip`.
- No stage is named or recorded while the recorded static checks fail or while the
  ledger records none; the commit command prints the failing command and its exit
  code, or the missing-check notice, instead of a message.
- Pull request title `<type>(<scope>)[!]: <summary> (#<id>)` under 72 characters;
  the body carries exactly five H2 sections in fixed order: `Linked Issue`,
  `Change summary`, `Verification & Dependencies`, `Review conclusion`,
  `Permission Notice`.
- `Blocking issues:` and `Active iteration: Round <N> of <maxRounds>` appear only
  while the verdict is FAIL, and the budget follows the scoring policy rather than
  a separate number. An override body must keep the same five-section structure.

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
  repair budget of five.
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
9. Autonomy is `full`. The grant to merge came with installing the plugin, so the
   loop merges on green evidence and does not ask again. Set autonomy to `manual`
   to keep a human ship as an explicit override.

On a pass the loop merges with `mergeStrategy` (squash by default), records the
merge, closes the linked issue, and fast-forwards the base branch. Merge is never
delegated to a manual `gh pr merge`; the guard denies that command so the gates
cannot be skipped.

## Output hygiene

A final reply must not open with a raw reasoning block. A leaked block spends
tokens twice, once on screen and once in the correction, and the wasted text stays
in the context every later turn must carry. On a long loop that cost compounds,
so the loop ships its own `Stop` hook instead of leaving the behaviour to
convention.

- The hook ends a block at the first reasoning-family closing tag outside Markdown
  code, whichever member of the family opened it, and treats a block that never
  closes as a leak because everything after the opener reads as reasoning.
- It asks for exactly one clean re-send per turn and never claims the emitted text
  was removed, because streamed text cannot be recalled.
- It dedupes on its own per-turn record, so a `Stop` flag set by another hook does
  not silence it, and it fails open on malformed input.
- Clean output is also a review requirement: a shipped reply must be text the user
  can read without wading through reasoning.

## Quality gates

- Confirm the ledger is git-ignored and the guard is active before claiming work.
- Verify each claim names disjoint touch scopes; a conflict waits for a later wave.
- Verify the shipped head SHA equals the reviewed head SHA, not an earlier commit.
- Confirm the review report carries the closure table, the breakdown, every P0-P4
  row, the four dimensions, and real command output.
- Confirm no sub-agent was spawned and no commit touched the base branch.
- Confirm the task branch was pushed without asking, and that the merge was
  followed by a local branch delete and a fast-forwarded base, again without
  asking. Cleanup is part of the loop, not a question for the user.
- Confirm the final reply carries no raw reasoning block, and that any correction
  was asked once rather than looped.

## Output contract

Return the admission plan or the claimed task's worktree and branch, the review
report with its computed score and gates, and the merge outcome with the issue
closed and the base branch synced. A merge without a PASS review at the same head
SHA is a failed delivery, not a shortcut.

## References

- [Concurrency model](../../delivery-loop/references/concurrency.md) - task DAG, leases, worktree isolation, and serialized merge.
- [Review scoring](../../delivery-loop/references/review.md) - review input shape, formula, caps, and anti-lenience rules.
- [Automation surface](../../delivery-loop/references/automation.md) - command surface, issue and pull request automation, and the guard.
- [Output hygiene](../../delivery-loop/references/output-hygiene.md) - reasoning-tag detection, the one bounded correction, and why clean replies extend a run.
- [Local ledger](../../delivery-loop/references/ledger.md) - ledger layout, state schema, and atomic locked writes.
- [Migration guide](../../delivery-loop/references/migration.md) - moving rules out of AGENTS.md into this plugin.
