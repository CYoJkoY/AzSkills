---
name: delivery-loop
description: Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically through independent Elephant-Goldfish reviewers, merges automatically on green evidence, and breaks out of dead loops.
version: 1.6.0
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
also owns final-reply output hygiene, because a clean reply is cheaper context and
a long run survives on cheap context, and the dead-loop guard, because a run that
repeats one step never reaches a review at all. It does not own the project's own
build commands, its architecture choices, or the content of the code being shipped.

It also owns the long-horizon goal run: a durable objective in `.azflow/goal.json`.

## Contract

- Use when: a repository needs issue-to-merge delivery that stays correct under several concurrent tasks, and review scoring plus merging must be automated instead of hand-driven.
- Do not use when: a one-off edit needs no branch, review record, or merge gate; make the edit directly.
- Owns: the task ledger, touch-scope leases, worktree isolation, computed review scoring, the merge gates, dead-loop interruption and restart, final-reply output hygiene, and the long-horizon goal run.
- Inputs: repository root, base branch, task titles with touch scopes, a structured review record, and the project's own verification command.
- Outputs: admission waves, isolated task worktrees, an English review report with a computed score, and a merged pull request with its issue closed.
- Compose with: `az-clean-code` when the delivered code must also meet explicit-code rules; `taste` when judgment and collaboration guidance should stay active during the work.
- Gates: never spawn a sub-agent outside an open review window, never commit or push on the base branch, never merge without every branch commit scored and a PASS review above 4.80 at the exact head SHA, never accept a self-review or an unattested review, never let the model choose its own score, never ship a final reply that opens with a raw reasoning block or carries no visible text, and never let a repeated step run on. Installing the plugin delegates issue creation, branch push, pull request creation, review posting, merge, and cleanup, so the loop runs that path without asking for per-action approval.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `init` | A repository has no ledger yet | Detect the git root and base branch, write the local ledger, ignore it in git | Ledger path and detected base |
| `plan` | Several tasks must be ordered safely | Pack planned tasks into dependency waves that respect leases and touch-scope disjointness | Waves, blocked list, and scope overlaps |
| `work` | One admitted task is ready to implement | Claim the task, create its branch and worktree, implement as a single agent, commit in reviewable stages | Worktree path, branch, and commits |
| `review` | A diff is ready for scoring | Open a review window, run the independent reviewers, score the attested record, inject scanner findings, write the report | Report with computed score and verdict |
| `ship` | A review passed | Re-check every gate at the current head SHA, merge with the configured strategy, close the issue and verify it is CLOSED | Merge outcome and synced base |
| `recover` | A lease expired or a task stalled | Release expired leases, return the task to the plan, list orphan worktrees | Reclaimed tasks and orphan list |
| `goal` | One objective must keep moving across many turns without Goal mode | Start a durable goal with done-when criteria, let the Stop hook drive continuation while progress is real, and stall or pause instead of looping | Goal compass, per-pass progress, and a stall or budget pause |

## Goal run

Codex's Goal mode keeps a task alive on its own; this module gives the loop the
same stamina without it. A local, git-ignored `.azflow/goal.json` holds the
objective, its done-when criteria, the next step, the progress ledger, and the pass
budget. On a clean stop the `Stop` hook refuses to end the turn while the goal is
active and work remains, re-injecting the compass from disk so a compacted context
is re-grounded rather than trusted to memory; a `SessionStart` hook injects the
same compass when a session opens. Progress is read from the repository and the
ledger, never from the model's word: an unchanged HEAD, tree, ledger, and worktree
set across a pass is no progress, so the run stalls after too many idle passes and
pauses when the budget is spent instead of spinning. `azflow goal` owns start,
status, note, next-step, complete, pause, resume, extend, and abandon, and any
non-active status lets the turn end. A goal needs no ledger, and with one the next
step is read from that ledger. See
[goal-run.md](../../delivery-loop/references/goal-run.md) for the state file and
the full command set.

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
4. Run `azflow claim <task>` to create the branch and worktree under
   `.azflow/worktrees/`, lease it, and open the task's issue when the ledger has
   none, so the branch always has a number to cite; `--issue <n>` attaches an
   existing issue and `--no-issue` leaves the task unlinked on purpose. Claim
   re-checks admission, so a task cannot start just because `plan` was skipped.
6. Implement inside the worktree and commit in small, reviewable stages.
7. Commit each stage with `azflow commit <task> --type <type> --scope <scope>
   --subject "<subject>"`. The command refuses an empty index, refuses a ledger
   that records no static check, runs the recorded checks, and enforces the commit
   standard below, so a red tree never gets a message or a commit; `--skip-check`
   is the visible escape. It also refuses a new stage while the current head has no
   stage record, so each commit is scored before the next one lands.
8. Run the project's own checks on the final head and push the branch. Run
   `azflow review-open <task>` so the guard permits reviewers to spawn, launch the
   Elephant-Goldfish reviewers in fresh contexts against the diff, and attest them
   in `review.json`. Score with `azflow review <task> --reviewer <fresh id>
   --input review.json --scan`. The task must have a claimed worktree; the command
   derives its real diff and head, always runs the mechanical scanner, and ignores
   model-supplied file lists. The first review must be round 1; every later round
   advances by one and carries the previous recorded score. The reviewer must
   differ from the implementer, and a round needs a live window and an attested
   fresh-context reviewer, so a self-review or an unattested round is rejected.
9. Run `azflow pr <task>` to open a linked draft pull request with a derived title
   and body, then `azflow ready <task>` to take it out of draft. Push without asking
   the user first; the branch push is part of opening the pull request. `pr` refuses
   any unscored branch commit and refuses until a passing review round with a green
   verification exists, because opening the pull request is the point where the
   stage becomes visible; it posts the recorded report as the first comment.
   `--allow-unverified` opens it earlier on purpose.
10. Run `azflow ship <task>` to refresh the pull request body from the recorded
   review, evaluate every gate at the current head SHA, and merge only on a full
   pass. It closes the issue and exits 1 if it is not CLOSED, leaving status
   `merged-issue-open`; `ship <task> --verify-issue` finishes that repair. Then
   delete the local branch and return to base without asking.
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
- Hard caps: any P0 caps at 2.00, any P1 at 3.50, and any P2 at 4.50. P3 and P4 rely on their weight: one P3 lands on 4.80 and one P4 at 4.90, so only a single P4 clears the strict bar; 4.80 is a repair, not a merge.
- A pass requires zero P0/P1/P2, a score strictly above 4.80, and a round within the repair budget of five.
- Every commit is scored as its own stage before the next stage lands; the pull request merges only when every branch commit has a record and the head stage is PASS above 4.80, scored by a `--reviewer` distinct from the implementer in a fresh context; a self-review, or an EGM round with no attested fresh-context reviewer, is rejected.
- An unreviewed diff file, a missing or failed verification command, an incomplete probe set, a dimension marked failing, or an unevidenced finding each caps the report and adds a blocking finding.
- The score may rise only as fast as the findings recorded as resolved justify, so a weak round cannot jump to a pass.
- Review records are grounded in a claimed worktree and the current head. The real diff is scanned on every review, and rounds cannot be replayed, skipped, or omit the previous recorded score.
- A mechanical scanner injects secrets, conflict markers, `any`, empty catches, framework imports, tab indentation, debug logs, loose equality, and TODO markers before scoring, so the model cannot hide them.
- The posted report follows a fixed template: head SHA, verdict, score, the review engine, the previous-round closure table, the deduction breakdown, every P0-P4 row, and the four dimension summaries.

## Review independence (EGM)

Self-review over-scores and hides the defects it introduced, so the loop never scores
itself. `azflow review-open <task>` writes a short-lived `.azflow/review-window.json`
bound to the task, head SHA, and expiry; only inside that window does the guard allow
sub-agent spawns, so Elephant-Goldfish reviewers read the diff in fresh contexts and
attest `engine: "egm"`. A self review, or an EGM round with no attested reviewer,
injects a P2 that caps and blocks the round; scoring deletes the window after.

## Auto-merge gates

`azflow ship` merges only when every gate passes at the same head SHA:

1. A recorded review exists and its verdict is PASS (`review-pass`).
2. The body links the task issue with `Closes #<issue>` (`issue-linked`).
3. Every branch commit has a stage record and the head stage is PASS above 4.80 (`stage-reviews`).
4. The review is EGM-attested and names a reviewer distinct from the implementer (`reviewer-independent`).
5. The review score is strictly above 4.80; an exact 4.80 fails (`review-score`).
6. The reviewed head SHA equals the pull request head SHA (`review-head`).
7. Required CI checks are green with no failing or pending check (`ci-green`).
8. The pull request is mergeable and not dirty (`mergeable`).
9. The base branch is unchanged from the configured base (`base-unchanged`).
10. No blocking label (`do-not-merge`, `blocked`, `wip`, `needs-decision`).
11. The pull request is open and not a draft (`not-draft`, `pr-open`).
12. Autonomy is `full` (`autonomy`); the loop merges on green evidence and does
   not ask again. Set autonomy to `manual` for an explicit human ship.

On a pass the loop merges with `mergeStrategy` (squash by default), records the
merge, closes the linked issue, verifies `gh issue view --json state` reads
`CLOSED` (retrying once and exiting 1 otherwise), and fast-forwards the base. Merge
is never delegated to a manual `gh pr merge`; the guard denies it so gates cannot
be skipped.

## Output hygiene

A final reply must not open with a raw reasoning block. A leaked block spends
tokens twice, once on screen and once in the correction, and the wasted text stays
in the context every later turn must carry. On a long loop that cost compounds,
so the loop ships its own `Stop` hook instead of leaving the behaviour to
convention.

- The hook ends a block at the first reasoning-family closing tag outside Markdown code, whichever member of the family opened it, and treats a block that never closes as a leak because everything after the opener reads as reasoning.
- A reply whose reasoning blocks leave no visible characters is treated as blank and corrected the same way, because a turn that shows the user nothing has not delivered anything.
- It asks for exactly one clean re-send per turn and never claims the emitted text was removed, because streamed text cannot be recalled.
- It dedupes on its own per-turn record, so a `Stop` flag set by another hook does not silence it, and it fails open on malformed input.
- The correction repeats the user prompt verbatim, because a long run may have compacted the prompt out of context by the time the correction arrives.
- Clean output is also a review requirement: a shipped reply must be text the user can read without wading through reasoning.

## Loop guard

An unattended run can repeat one step forever. The failure is quiet: no merge, no
error, and no review record. The loop therefore treats a repeating step as a
failure of the same weight as a broken gate.

- A step repeats when the same tool call, or the same short cycle of calls, runs at the end of the turn: four times for one call, and four repeats of a cycle of two to four calls. The same final reply three times in a row also counts, and so does a second blank reply in one turn: the first blank is corrected, the second proves the correction did not land.
- The `PreToolUse` guard denies the fourth identical shell call before it runs, so a loop is interrupted mid-turn instead of burning the rest of the window.
- The `Stop` guard catches everything the tool guard cannot see, including repeated replies and repeated reads, and restarts the turn. The restart is scoped to a delivery project, meaning a directory above the turn that carries `.azflow/state.json` or `.azflow/goal.json`; anywhere else a repeated reply or read is ordinary work and is left alone, so a long task outside the loop is never cut short.
- A restart voids the looped attempt and re-sends the original prompt in the same conversation, with a notice that a dead loop just happened. It never opens a new session and never asks the user to repeat the request.
- Restarts are budgeted: at most two per turn, so a model that keeps looping is stopped by the budget rather than by an endless guard. After a breaker interruption the counter resets, so a deliberate re-run of the same command after a fix is still allowed.
- The `UserPromptSubmit` hook records the prompt in per-session state the moment it arrives. That copy, not the transcript, is what a correction quotes, so the prompt survives compaction and a flooded window.

## Quality gates

- Confirm the ledger is git-ignored and the guard is active before claiming work.
- Verify each claim names disjoint touch scopes; a conflict waits for a later wave.
- Verify the shipped head SHA equals the reviewed head SHA, not an earlier commit.
- Confirm the review report carries the closure table, the breakdown, every P0-P4
  row, the four dimensions, and real command output.
- Confirm sub-agents spawned only inside an open review window, that the EGM
  review is attested, and that no commit touched the base branch.
- Confirm the task branch was pushed without asking, and that the merge was
  followed by a local branch delete and a fast-forwarded base, again without
  asking. Cleanup is part of the loop, not a question for the user.
- Confirm the final reply carries no raw reasoning block and no blank body, and
  that any correction was asked once rather than looped.
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
- [Automation surface](../../delivery-loop/references/automation.md) - command surface, issue and pull request automation, and the guard.
- [Goal run](../../delivery-loop/references/goal-run.md) - durable objective, stop-hook continuation, progress from real state, and stall and budget safety.
- [Output hygiene](../../delivery-loop/references/output-hygiene.md) - reasoning-tag detection, the one bounded correction, and why clean replies extend a run.
- [Loop guard](../../delivery-loop/references/loop-guard.md) - dead-loop detection, the in-turn breaker, the restart budget, and prompt replay.
- [Local ledger](../../delivery-loop/references/ledger.md) - ledger layout, state schema, and atomic locked writes.
- [Migration guide](../../delivery-loop/references/migration.md) - moving rules out of AGENTS.md into this plugin.
