---
name: delivery-loop
description: Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically through independent Elephant-Goldfish reviewers, merges automatically on green evidence, and breaks out of dead loops.
version: 1.8.0
status: module
family: operations
modes: [init, plan, work, review, ship, recover, goal]
---

# Delivery Loop

Turn a repository's issue-to-merge work into a repeatable loop: one agent owns
judgement and execution, concurrency comes from independent tasks, and the review
score and the merge are mechanical. This module owns the task ledger, touch-scope
leases, worktree isolation, computed review scoring, the merge gates, and the guard
that blocks manual merges and sub-agent spawns outside an open review window. It
also owns the dead-loop guard, because a run that repeats one step never reaches a
review at all, and the goal run, because a durable objective outlives one turn. It
does not own the project's own build commands, its architecture choices, or the
content of the code being shipped.

## Contract

- Use when: a repository needs issue-to-merge delivery that stays correct under several concurrent tasks, and review scoring plus merging must be automated instead of hand-driven.
- Do not use when: a one-off edit needs no branch, review record, or merge gate; make the edit directly.
- Owns: the task ledger, touch-scope leases, worktree isolation, computed review scoring, the merge gates, dead-loop interruption and restart, and the long-horizon goal run.
- Inputs: repository root, base branch, task titles with touch scopes, a structured review record, and the project's own verification command.
- Outputs: admission waves, isolated task worktrees, an English review report with a computed score, and a merged pull request with its issue closed.
- Compose with: `az-clean-code` when the delivered code must also meet explicit-code rules; `taste` when judgment and collaboration guidance should stay active during the work.
- Gates: never spawn a sub-agent outside an open review window, never commit or push on the base branch, never merge without every branch commit scored and a PASS review above 4.80 at the exact head SHA, never accept a self-review or an unattested review, never let the model choose its own score, never hand-write a pull request review comment, and never let a repeated step run on. Installing the plugin delegates issue creation, branch push, pull request creation, review posting, merge, and cleanup, so the loop runs that path without asking for per-action approval.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `init` | A repository has no ledger yet | Detect the git root and base branch, write the local ledger, ignore it in git | Ledger path and detected base |
| `plan` | Several tasks must be ordered safely | Pack planned tasks into dependency waves that respect leases and touch-scope disjointness | Waves, blocked list, and scope overlaps |
| `work` | One admitted task is ready to implement | Claim the task, create its branch and worktree, implement as a single agent, commit in reviewable stages | Worktree path, branch, and commits |
| `review` | A diff is ready for scoring | Open a review window, run the independent reviewers, score the attested record, inject scanner findings, write the report | Report with computed score and verdict |
| `ship` | A review passed | Re-check every gate at the current head SHA, merge with the configured strategy, close the issue and verify it is CLOSED | Merge outcome and synced base |
| `recover` | A lease expired or a task stalled | Release expired leases, return the task to the plan, list orphan worktrees | Reclaimed tasks and orphan list |
| `goal` | One objective must keep moving across many turns without Goal mode | Start a durable goal with done-when criteria, let the Stop hook drive continuation and bounded self-repair while progress is real, and stall, pause, or complete instead of looping | Goal compass, per-pass progress, an automatic completion, and a stall or budget pause |

## Goal run

Codex's Goal mode keeps a task alive on its own; this module gives the loop the
same stamina without it. A local, git-ignored `.azflow/goal.json` holds the
objective, its done-when criteria, the next step, the progress ledger, and the pass
budget. The `Stop` hook refuses to end the turn while the goal is active and work
remains, re-injecting the compass from disk so a compacted context is re-grounded
rather than trusted to memory; a `SessionStart` hook injects it when a session
opens. Progress is read from the repository, never the model's word, so an idle
pass first gets one diagnostic pass and then stalls. A long run retries a transient
failure, extends a healthy budget, and completes only when every done-when
criterion verifies. See [goal-run.md](../../delivery-loop/references/goal-run.md)
for the state file and the full command set.

## Continuity and performance

An unattended run fails more often in quiet ways than at a red gate: the network
drops mid-push, the turn is interrupted with a task half done, a commit lands with
an empty message, or the goal reports complete while ledger work is still open.
`azflow doctor` adds a `continuity` gate that reads the ledger and worktree root
once and reports an interrupted task, an expired lease, or an orphan worktree; a
completed goal with open work reopens once, and a blank commit or whole-volume delete is refused.
Performance is a stated priority: an equally correct cheaper design wins, and a
check that costs more than the failure it prevents is dropped and named. See
[continuity.md](../../delivery-loop/references/continuity.md) and [performance.md](../../delivery-loop/references/performance.md).

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
   touch scopes overlap a live lease; admission is demand-driven, never a roster.
4. Run `azflow claim <task>` to create the branch and worktree under
   `.azflow/worktrees/`, lease it, and open the task's issue when the ledger has
   none, so the branch always has a number to cite; `--issue <n>` attaches an
   existing issue and `--no-issue` leaves the task unlinked on purpose. Claim
   re-checks admission, so a task cannot start just because `plan` was skipped.
5. Implement inside the worktree and commit in small, reviewable stages.
6. Commit each stage with `azflow commit <task> --type <type> --scope <scope>
   --subject "<subject>"`. It refuses an empty index or a ledger with no recorded
   check, runs the checks, enforces the standard below, and refuses a new stage
   while the current head has no stage record, so a red tree never gets a message
   and each commit is scored before the next lands. A successful commit also pushes
   the branch immediately, so the remote backup never waits; a push failure keeps
   the commit and exits 1, and `azflow push <task>` retries idempotently.
   `--no-push` and `AZFLOW_NO_AUTO_PUSH=1` are the visible escapes.
7. Run the project's own checks on the final head, then `azflow review-open
   <task>` so the guard permits reviewers to spawn, launch the Elephant-Goldfish
   reviewers in fresh contexts against the diff, and attest them in `review.json`.
   Score with `azflow review <task> --reviewer <fresh id> --input review.json
   --scan`: the command derives the real diff and head from the claimed worktree,
   always runs the scanner, and ignores model-supplied file lists. Round 1 comes
   first, each later round carries the previous score, the reviewer must differ
   from the implementer, and the round needs a live window and an attested
   fresh-context reviewer. A scored round publishes itself as the fixed-template
   pull request comment; a post failure keeps the record and exits 1 with the
   retry command, `--no-post` stays offline, and `azflow review-post` re-publishes.
8. Run `azflow pr <task>` to open a linked draft pull request with a derived title
   and body, then `azflow ready <task>` to take it out of draft. `pr` pushes first,
   confirms the remote branch exists, refuses any unscored commit, and refuses
   until a passing round with green verification exists, because opening the pull
   request makes the stage visible; it posts the recorded report as the first
   comment and exits 1 on a post failure without dropping the pull request.
   `--allow-unverified` opens it earlier on purpose.
9. Run `azflow ship <task>` to refresh the pull request body from the recorded
   review, evaluate every gate at the current head SHA, and merge only on a full
   pass. It opens the pull request itself when the task has none, because `gh pr
   create` is refused inside the project. It closes the issue and exits 1 if it is
   not CLOSED, leaving status `merged-issue-open`; `ship <task> --verify-issue`
   finishes that repair. Then delete the local branch and return to base.
10. Run `azflow recover` after an interrupted task to release its lease and return
    it to `planned`; add `--force` to remove orphan worktree directories.

A repair round after `ready` re-runs the checks; the pull request stays open and
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
- Hard caps: any P0 caps at 2.00, any P1 at 3.50, and any P2 at 4.50. P3 and P4 rely on their weight: one P3 lands on 4.80 and one P4 at 4.90, so only a single P4 clears the strict bar; 4.80 is a repair, not a merge.
- A pass requires zero P0/P1/P2, a score strictly above 4.80, and a round within the repair budget of five.
- Every commit is scored as its own stage before the next stage lands; the pull request merges only when every branch commit has a record and the head stage is PASS above 4.80, scored by a `--reviewer` distinct from the implementer in a fresh context; a self-review, or an EGM round with no attested fresh-context reviewer, is rejected.
- An unreviewed diff file, a missing or failed verification command, an incomplete probe set, a dimension marked failing, or an unevidenced finding each caps the report and adds a blocking finding, and the score may rise only as fast as the resolved findings justify, so a weak round cannot jump to a pass.
- Review records are grounded in a claimed worktree and the current head. The real diff is scanned on every review, and rounds cannot be replayed, skipped, or omit the previous recorded score.
- A mechanical scanner injects secrets, conflict markers, `any`, empty catches, framework imports, tab indentation, debug logs, loose equality, and TODO markers before scoring, so the model cannot hide them.
- The posted report follows a fixed template: head SHA, verdict, score, the review engine, the previous-round closure table, the deduction breakdown, every P0-P4 row, and the four dimension summaries.
- The report is published to the pull request as one comment in that fixed template, not only written to disk. `azflow review` posts it by default and `azflow pr` posts it as the first comment; the model never types a comment by hand, `validateReviewComment()` rejects anything off-template, and the guard denies `gh pr comment` and `gh pr review`.

## Review independence (EGM)

Self-review over-scores and hides the defects it introduced, so the loop never scores itself. `azflow review-open <task>` writes a short-lived `.azflow/review-window.json` bound to the task, head SHA, and expiry.
Only inside that window does the guard allow sub-agent spawns, so Elephant-Goldfish reviewers read the diff in fresh contexts and attest `engine: "egm"`.
A self review, or an EGM round with no attested reviewer, injects a P2 that caps and blocks the round; scoring deletes the window after.

## Auto-merge gates

`azflow ship` merges only when every gate passes at the same head SHA:

1. A recorded review exists and its verdict is PASS (`review-pass`).
2. The body links the task issue with `Closes #<issue>` (`issue-linked`).
3. Every branch commit has a stage record and the head stage is PASS above 4.80 (`stage-reviews`).
4. The review is EGM-attested and names a reviewer distinct from the implementer (`reviewer-independent`).
5. The review score is strictly above 4.80; an exact 4.80 fails (`review-score`).
6. The reviewed head SHA equals the pull request head SHA (`review-head`).
7. The pull request carries the fixed-template review comment for the recorded round, head, verdict, and score; on a live run a missing comment is re-posted and re-validated (`review-comment`).
8. Required CI checks are green with no failing or pending check (`ci-green`).
9. The pull request is mergeable and not dirty, and the base branch is unchanged from the configured base (`mergeable`, `base-unchanged`).
10. The pull request is open and not a draft (`not-draft`, `pr-open`) and carries no blocking label (`do-not-merge`, `blocked`, `wip`, `needs-decision`).
11. Autonomy is `full` (`autonomy`); the loop merges on green evidence and does not ask again. Set autonomy to `manual` for an explicit human ship.

On a pass the loop merges with `mergeStrategy` (squash by default), records the merge, closes the linked issue, and fast-forwards the base.
It verifies `gh issue view --json state` reads `CLOSED`, retrying once and exiting 1 otherwise.
Merge is never delegated to a manual `gh pr merge`; the guard denies it so gates cannot be skipped.

## Loop guard

An unattended run can repeat one step forever. The failure is quiet: no merge, no error, and no review record.
The loop therefore treats a repeating step as a failure of the same weight as a broken gate.

- A step repeats when the same tool call, or the same short cycle of calls, runs at the end of the turn: four times for one call, four repeats of a cycle of two to four calls, the same final reply three times in a row, or a second blank reply in one turn. The `PreToolUse` guard denies the fourth identical shell call before it runs, so a loop is interrupted mid-turn instead of burning the rest of the window.
- The `Stop` guard catches what the tool guard cannot see, including repeated replies and reads, and restarts the turn. The restart is scoped to a delivery project carrying `.azflow/state.json` or `.azflow/goal.json`; anywhere else a repeated reply or read is ordinary work, so a long task outside the loop is never cut short.
- A restart voids the looped attempt and re-sends the original prompt in the same conversation with a notice that a dead loop just happened; it never opens a new session and never asks the user to repeat the request. Restarts are budgeted at two per turn, so a model that keeps looping stops on the budget rather than an endless guard, and the counter resets after a breaker interruption so a deliberate re-run after a fix is allowed.
- The `UserPromptSubmit` hook records the prompt in per-session state the moment it arrives. That copy, not the transcript, is what a restart quotes, so the prompt survives compaction and a flooded window.

## Reasoning-leak guard

A leaked reasoning tag is a visible defect, not only wasted context, so three layers guard it and each fails open.

- The `UserPromptSubmit` hook states the rule before the turn's first message, and the `PreToolUse` hook reads the turn's visible messages at the next tool call and injects one short correction per new leak; it never blocks the call and allows two nudges per turn.
- The `Stop` hook corrects a leaking final reply with one bounded re-send and reports a blank reply the same way; the mid-turn and Stop budgets stay separate.

## Quality gates

- Confirm the ledger is git-ignored, the guard is active, and each claim names
  disjoint touch scopes before work starts; a conflict waits for a later wave.
- Verify the shipped head SHA equals the reviewed head SHA, not an earlier commit.
- Confirm the review report carries the closure table, the breakdown, every P0-P4
  row, the four dimensions, and real command output.
- Confirm the report reached the pull request as the fixed-template comment, not
  only a local file, and that no review comment was written by hand.
- Confirm sub-agents spawned only inside an open review window, that the EGM
  review is attested, and that no commit touched the base branch.
- Confirm the task branch was pushed without asking, and that the merge was
  followed by a local branch delete and a fast-forwarded base, again without
  asking. Cleanup is part of the loop, not a question for the user.
- Confirm a delete inside the project ran without a prompt and that only a
  whole-volume or home-directory delete was refused, so policy never cripples
  cleanup.
- Confirm drift was settled before new work: open ledger work blocks `goal
  complete` without `--force`, and a completed goal with open work reopens once.
- Confirm the final reply is readable text, that no visible message leaked a
  reasoning tag, and that the reply body is not blank.
- Confirm a repeating step was interrupted rather than retried, and that the
  re-sent prompt in the restart notice is the user's own prompt.

## Output contract

Return the admission plan or the claimed task's worktree and branch, the review
report with its computed score and gates, and the merge outcome with the issue
closed and the base branch synced. A merge without a PASS review at the same head
SHA is a failed delivery, not a shortcut.

## References

- [Concurrency model](../../delivery-loop/references/concurrency.md) - task DAG, leases, worktree isolation, and serialized merge.
- [Review scoring](../../delivery-loop/references/review.md) - review input shape, formula, caps, and anti-lenience rules.
- [EGM review](../../delivery-loop/references/egm-review.md) - the review window, fresh-context Goldfish reviewers, and the attestation format.
- [Review comment](../../delivery-loop/references/review-comment.md) - the fixed-template pull request comment, its publishing commands, and the merge gate.
- [Automation surface](../../delivery-loop/references/automation.md) - command surface, issue and pull request automation, and the guard.
- [Goal run](../../delivery-loop/references/goal-run.md) - durable objective, stop-hook continuation, progress from real state, and stall and budget safety.
- [Continuity](../../delivery-loop/references/continuity.md) - drift kinds, interrupted tasks, blank commits, and where each one surfaces.
- [Performance](../../delivery-loop/references/performance.md) - the performance-first rule and the checks the loop trades away for speed.
- [Panel](../../delivery-loop/references/panel.md) - the snapshot, the MCP panel server, and the config surface.
- [Loop guard](../../delivery-loop/references/loop-guard.md) - dead-loop detection, the in-turn breaker, the restart budget, and prompt replay.
- [Output hygiene](../../delivery-loop/references/output-hygiene.md) - the three-layer reasoning-leak guard and what counts as a leak.
- [Local ledger](../../delivery-loop/references/ledger.md) - ledger layout, state schema, and atomic locked writes.
- [Migration guide](../../delivery-loop/references/migration.md) - moving rules out of AGENTS.md into this plugin.
