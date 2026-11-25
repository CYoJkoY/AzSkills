# Loop guard

A delivery run is unattended, so nobody notices when it stops making progress. The
model re-runs the same failing command, or rewrites the same final answer, and the
window fills without a single commit. The loop guard treats that repetition as a
failure and restarts the turn instead of waiting for a review that never comes.

## What counts as a dead loop

Two shapes, both read from evidence rather than from a hunch:

- **Repeated tool calls.** The tail of the current turn holds one call four times
  in a row, or a cycle of two to four calls four times in a row. Call identity is
  the tool name plus its arguments with whitespace outside quotes collapsed, so
  formatting drift does not hide a repeat while quoted text stays exact.
- **Repeated replies.** The same final reply arrives three times in a row and the
  reply is long enough to be a real answer rather than a short acknowledgement.
- **Repeated blank replies.** Two final replies in a row carry no visible text once
  reasoning blocks are removed. The first one is recorded; the second shows the
  turn is not producing an answer, so it restarts the turn.

Only a run at the very end of the turn counts. A model that repeats a step and
then moves on was not stuck, and blocking it would punish ordinary retries.

The restart is scoped to a delivery project: the turn's directory or one above it
must carry `.azflow/state.json` or `.azflow/goal.json`. Outside a delivery project
an ordinary task legitimately reads the same file or re-reads the same reply, and
voiding the turn there would cut a long task short. Blank replies are still counted
everywhere, because a turn that shows nothing is always a fault.

## Two hooks, one rule

- `codex-plugin/hooks/delivery-guard.ts` (`PreToolUse`) counts consecutive
  identical shell calls and denies the fourth. The call is blocked before it runs,
  so the loop is interrupted while the model still holds the work it already did.
- `codex-plugin/hooks/delivery-stop.ts` (`Stop`) reads the turn transcript and the
  recorded reply history, then restarts a loop the tool guard could not see, such
  as repeated reads or repeated answers.

## The restart

A restart is not a new conversation and not a new session. The hook emits a block
decision whose reason does three things:

1. Names the repeated step and states that the looped attempt is void, so the model
   cannot treat its last action as completed.
2. Says that the dialog state has been restarted in place.
3. Re-sends the user prompt verbatim (up to the stored 8,000-character cap)
   between fixed markers, followed by an
   instruction to re-read it, inspect the state the earlier attempts left behind,
   and continue with a different approach.

The loop never asks the user to repeat a request and never claims work that was
not done. Everything it can rely on is the repository and task state that already
exists.

## Prompt replay

The re-sent prompt comes from `codex-plugin/hooks/delivery-prompt.ts`, a
`UserPromptSubmit` hook that stores a bounded copy of each prompt in per-session
state the moment it arrives. The transcript is only a fallback. A long run may
compact the prompt out of context, and a correction that quotes nothing forces the
model to guess what the user wanted.

The same replay is appended to every reply correction, so both guards share one
answer to memory loss after compaction.

## Budgets

- At most two restarts per turn. Without a budget a guard can chase its own
  correction forever; with one, a model that will not stop looping is stopped by
  the budget.
- The in-turn breaker resets after it fires, so a deliberate re-run of the same
  command after a real fix is allowed.
- Restart records are pruned after an hour, and the state file is bounded, so a
  long session does not accumulate state. State files for finished sessions are
  swept by age and by count, so starting many sessions does not accumulate
  prompts on disk either.
- Every read is defensive, every write is atomic, and overlapping hooks serialize
  through a per-session lock so counters are not lost. State files are created
  owner-only. A malformed payload, a missing transcript, or a read-only data
  directory never blocks a turn.

## Verification

- Four identical shell calls in a row are interrupted once, and the interruption
  names the call and repeats the prompt.
- A cycle of two alternating calls repeated four times is also interrupted.
- A turn whose transcript shows four identical calls is restarted at `Stop`, even
  when the final reply looks clean.
- The same long final reply three times is restarted, and a short repeated
  acknowledgement is not.
- A second blank final reply in the same turn is restarted instead of corrected
  again.
- The third restart in one turn does not happen.
- A repeated reply in a plain directory outside a delivery project is left alone,
  while the same reply inside a project with `.azflow/state.json` restarts.
- Every restart and correction reason carries the prompt recorded at submission,
  and a prompt recorded for a different turn is never quoted as the current one.
- Malformed input, a foreign event name, and a missing session id produce no
  output.
