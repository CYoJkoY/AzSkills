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

## Stop-hook continuation

The final reply is the moment the model thinks it is done. That is the right
place to decide whether it is. On a clean stop the hook calls `advanceGoal`:

1. A missing goal, or one whose status is not `active`, allows the turn to end.
2. The hook fingerprints the repository state - the base HEAD and working tree,
   the ledger file, and every live worktree's HEAD and working tree.
3. The fingerprint is compared with the one recorded on the previous pass. A
   change is real progress; an identical fingerprint is no progress at all.
4. While the pass budget remains and progress has not stalled, the hook blocks
   with the compass and the next step, so the model continues in the same session
   with the goal in front of it.

The loop guard still runs first. A reply that repeats itself, or one that is blank
or opens with leaked reasoning, is corrected or restarted before the goal
decision, so a goal run cannot paper over a dead or unreadable reply.

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
  by default), the run is marked `stalled` and the hook sends one message asking
  for what is done, what remains, and the real blocker. The turn then ends.
- Pass budget: when `maxIterations` is exceeded (one thousand by default), the run
  is marked `paused` and the hook tells the user to `azflow goal extend --by <N>`
  and `resume` if the work should continue.

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
| `azflow goal start "<objective>" --done-when "<criterion>"` | Create and activate a goal. Repeat `--done-when`; tune with `--max-iterations` and `--max-no-progress`. |
| `azflow goal status [--json]` | Print the compass, or the goal and next step as JSON. |
| `azflow goal next` | Print only the next step. |
| `azflow goal note "<text>" [--evidence "<e>"] [--next-step "<s>"]` | Record a real step and optionally set the next step. |
| `azflow goal next-step "<text>"` | Set the manual next step used when no ledger applies. |
| `azflow goal pause [--reason "<why>"]` | Stop driving the goal until resumed. |
| `azflow goal resume` | Reactivate a paused or stalled goal and re-baseline progress. |
| `azflow goal extend --by <N>` | Raise the pass budget by `N`. |
| `azflow goal complete [--summary "<result>"]` | Mark the goal done, once every done-when criterion is verified. |
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

## Opt-in

Nothing here activates on its own. Both hooks are inert unless an
`.azflow/goal.json` with status `active` resolves from the working directory, so
installing the plugin does not change a repository that never started a goal. The
goal file is written under the same `.azflow/` directory whose nested `.gitignore`
already keeps the ledger out of version control, so a goal never leaks into a
commit.
