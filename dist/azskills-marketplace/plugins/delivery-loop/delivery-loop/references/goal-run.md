# Goal run

A long-horizon objective outlives one context window. Codex's Goal mode keeps a
task alive across turns on its own; this reference describes the plugin-native
equivalent, so the loop keeps moving toward one goal even when Goal mode is off.

The mechanism is a durable file plus two hooks. The objective, its done-when
criteria, the progress ledger, the next step, blockers, and the iteration budget
live in `.azflow/goal.json`, a local, git-ignored file beside the delivery ledger.
When the model believes the turn is finished, the `Stop` hook reads that file and
refuses to end the turn while the goal is active and work remains. The block
reason is not a nudge; it is the full compass re-injected from disk, so a
compacted context is re-grounded in the goal rather than in a faded memory of it.
When a session opens or resumes, a `SessionStart` hook injects the same compass,
so a fresh window picks up the goal without being re-asked.

## State file

`azflow goal start` writes the goal, and every hook pass updates it under a short
directory lock, so the hook and the CLI never clobber each other's writes. The
fields that matter:

- `objective`: the one outcome the run is driving toward.
- `doneWhen`: the verifiable criteria that define completion. A goal refuses to
  start without at least one, because completion needs a definition.
- `status`: `active`, `paused`, `complete`, `abandoned`, or `stalled`. Only
  `active` drives continuation; every other status lets the turn end.
- `iteration` and `maxIterations`: the pass counter and its ceiling, so a run
  cannot spin forever.
- `noProgress` and `maxNoProgress`: how many consecutive passes changed nothing
  real, and the limit before the run stalls itself.
- `nextStep`, `progress`, and `blockers`: the single next action, a bounded
  history of real steps with their evidence, and the reasons a run is stuck.
- `checkpoint`: the last commit SHA that made real progress, plus the step that
  followed it, so an interrupted run knows where to resume.
- `extensions` and `autoRepairs`: how many automatic budget extensions and
  review-repair rounds have been spent.
- `driftReopens`: how many automatic drift reopens the run has spent, capped at
  one so a completed goal is not fought forever.
- `allowedCommands`: command patterns the guard auto-approves for this goal.

## Autonomous long run

A pass that ends without a decision, or on a failure that is only temporary, is
the main reason a long run needs a user. Nine bounded mechanisms keep it moving:

- **Allowlist auto-approval**: `azflow goal start ... --allow "npm run custom"`
  records patterns in `.azflow/goal.json`. The guard auto-approves the built-in
  read commands (`git log`, `rg`, and the like), the safe bounded writes the loop
  needs (`npm test`, `git commit`, and the like), and the user's own patterns.
  Deletes are ordinary loop work - a stale worktree, a scratch build directory, a
  merged branch - so `rm`, `rmdir`, `Remove-Item`, `git rm`, `git clean`, a
  `-d`/`-D`/`--delete` ref delete, `git worktree remove`, and `find -delete` run
  without a prompt; only a whole-volume or home-directory target is refused, and
  that refusal is one deny rule. A bounded task-branch push is approved the same
  way. Output redirection and `gh pr merge` are never auto-approved. Set
  `AZFLOW_NO_AUTO_APPROVE=1` to opt out.
- **Checkpoint resume**: every pass that changes the repository records the
  current commit SHA and the next step, and the compass prints
  `Resume from: <sha> - <step>` so a fresh window picks up where the run stopped.
- **Transient failure retry**: a network error, a 5xx, pending CI, or a git index
  lock is retried up to three times with a 15/45/90-second backoff, and the retry
  does not spend the no-progress budget.
- **Auto-diagnosis**: the first time the no-progress threshold is reached, the
  run gets one diagnostic pass to read the real error, re-run the failing step
  with one changed variable, and record what it found.
- **Dynamic budget**: `--auto-budget` sizes the start from the objective: 2000
  passes for a heavy rewrite or migration, 300 for one or two criteria, 120 for a
  small objective. A healthy run within 10% of its budget extends it by 50%,
  twice, before it pauses.
- **Review auto-repair**: a review that scores between 4.00 and 4.79 (FAIL) is
  repaired automatically up to twice, and the directive quotes the findings from
  the report instead of restating "the review failed". A score below 4.00, or a
  spent repair budget, pauses the run for a human decision.
- **doneWhen verification**: a goal whose every criterion is machine-checkable (a
  merged issue or pull request, a published tag, a reachable commit, a present
  file) completes itself once all of them verify. `azflow goal verify` prints the
  same report on demand.
- **Blank-commit refusal**: a commit with `--allow-empty`,
  `--allow-empty-message`, or a `-m`/`--message` carrying no text is denied before
  it runs, because it gives the review nothing to score and the next pass nothing
  to resume from. The step is still recorded with `azflow goal note`.
- **Drift reopen**: when the goal is `complete` but the ledger still holds open
  work, the run reopens the goal once and continues instead of reporting a
  delivery that did not happen. The reopen is budgeted at one per goal, and
  `azflow goal complete` refuses open ledger work unless `--force` says the
  remaining tasks belong to another objective.
- **Fast progress marker**: with `AZFLOW_FAST=1` the per-pass fingerprint hashes
  size and mtime instead of every dirty file's content. A real edit moves both, so
  the marker stays honest while a pass stops re-reading the working tree.

## Stop-hook continuation

The final reply is the moment the model thinks it is done. That is the right
place to decide whether it is. On a clean stop the hook calls `advanceGoal`:

1. A missing goal, or one whose status is not `active`, allows the turn to end.
2. A goal whose every done-when criterion is machine-checkable and passes is
   marked `complete`, and the turn is told to report the result.
3. A healthy run about to exhaust its budget extends itself instead of pausing.
4. The reply is checked for a transient failure, which is retried without
   spending the no-progress budget.
5. The hook fingerprints the repository state - the base HEAD and working tree,
   the ledger file, the newest review report, and every live worktree's HEAD and
   working tree.
6. The fingerprint is compared with the one recorded on the previous pass. A
   change is real progress; an identical fingerprint is no progress at all.
7. A review that fails just under the bar is repaired automatically; one that is
   far below it pauses the goal.
8. A goal already marked `complete` is reopened once when open ledger work
   remains, so the run finishes what it started.
9. While the pass budget remains and progress has not stalled, the hook blocks
   with the compass and the next step, so the model continues in the same session
   with the goal in front of it.

The loop guard still runs first. A reply that repeats itself, or one that is blank,
is restarted before the goal decision, so a goal run cannot paper over a dead or
unreadable reply.

## Progress from real state

Progress is measured from the work, never from the model's claim. A commit, an
edit, a claim, a review, or a merge moves the fingerprint; a paragraph of prose
does not. This is the difference between a run that advances and one that narrates
its own advancement, and it is why a goal that keeps talking but never changes the
repository is caught rather than continued.

`azflow goal note "<what changed>" --evidence "<output or sha>"` records a step a
human can inspect later. A note neither resets the no-progress counter nor
reactivates a paused or stalled goal; the repository still has to move.

## Stall and budget safety

A guard that never stops is not a guard. Two limits bound every run:

- No progress: after `maxNoProgress` passes with an identical fingerprint (four
  by default), the run first earns one automatic diagnostic pass. If the next
  passes still change nothing, it is marked `stalled` and the hook sends one
  message asking for what is done, what remains, and the real blocker. The turn
  then ends.
- Pass budget: when `maxIterations` is exceeded (one thousand unless
  `--auto-budget` sizes it), the run is marked `paused` and the hook tells the
  user to `azflow goal extend --by <N>` and `resume` if the work should continue.
  A healthy run extends itself twice before this point.

Both outcomes leave a non-`active` status, so the next stop is allowed to end and
the loop does not fight the user. `azflow goal resume` re-baselines the
fingerprint, clears the no-progress counter, and makes the goal active again.

This is in-session continuation, not a background worker. It requires a running
Codex session with the Delivery Loop hooks enabled and trusted. It cannot keep
running while Codex is closed, wake a suspended host, or bypass host usage limits
or approvals. Reopen the project to pick up the saved checkpoint.

## Commands

| Command | Effect |
| :--- | :--- |
| `azflow goal start "<objective>" --done-when "<criterion>"` | Create and activate a goal. Repeat `--done-when`; size the budget with `--auto-budget` or `--max-iterations`, allow repeated commands with `--allow "<pattern>"`, and tune the stall limit with `--max-no-progress`. |
| `azflow goal verify [--json]` | Check every done-when criterion against the repository and print the result. |
| `azflow goal status [--json]` | Print the compass, or the goal and next step as JSON. |
| `azflow goal next` | Print only the next step. |
| `azflow goal note "<text>" [--evidence "<e>"] [--next-step "<s>"]` | Record a real step and optionally set the next step. |
| `azflow goal next-step "<text>"` | Set the manual next step used when no ledger applies. |
| `azflow goal pause [--reason "<why>"]` | Stop driving the goal until resumed. |
| `azflow goal resume` | Reactivate a paused or stalled goal and re-baseline progress. |
| `azflow goal extend --by <N>` | Raise the pass budget by `N`. |
| `azflow goal complete [--summary "<result>"] [--force]` | Mark the goal done, once every done-when criterion is verified and the ledger holds no open work. `--force` closes it anyway and reports how many open tasks stay behind. |
| `azflow goal reopen` | Move a `complete`, `abandoned`, or `stalled` goal back to `active`, refresh the progress marker, and record the reopen. |
| `azflow goal abandon [--reason "<why>"]` | Give up the goal without claiming completion. |

## Relationship to the delivery ledger

The goal run and the delivery ledger are independent, and either can exist alone.
A goal drives any objective, not only an issue-to-merge run. When a ledger does
exist, the next step is read from it: a merged issue still open becomes
`ship --verify-issue`, an active task becomes "continue it and deliver", a review
becomes "finish and merge", and a ready planned task becomes "claim and build".
With no ledger the goal falls back to its recorded next step and then to the
generic "take the next concrete, verifiable step" directive. This keeps the goal
walking the task DAG when one exists instead of guessing at it.

When a ledger exists, the two files are also checked against each other: `azflow
doctor` reports a `continuity` gate, and a `SessionStart` briefing lists each
disagreement with the one command that repairs it. See
[continuity.md](continuity.md) for the finding kinds.

## Opt-in

Nothing here activates on its own. Both hooks are inert unless an
`.azflow/goal.json` with status `active` resolves from the working directory, so
installing the plugin does not change a repository that never started a goal. The
goal file is written under the same `.azflow/` directory whose nested `.gitignore`
already keeps the ledger out of version control, so a goal never leaks into a
commit.
