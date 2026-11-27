# Output hygiene

A delivery loop runs long turns, so a leaked reasoning tag costs twice: once in
the reply the user reads and once in the correction that asks for a clean
re-send, and both stay in the context the next turn must carry. A tag on screen
is also a visible defect, so the guard does not treat it as a token problem only.

## The rule

No assistant message may carry a raw reasoning block, and a final reply must
also carry visible text. Three layers enforce it, because a single end-of-turn
check cannot see the progress notes a model writes between tool calls, and the
text of those notes has already streamed by the time any hook runs.

## What counts as a leak

1. A reasoning-family opener anywhere outside Markdown code: at the start of the
   message, partway through, or opened and never closed. The family covers
   `think`, `thinking`, `thought`, `thoughts`, `reasoning`, `reflection`,
   `analysis`, `scratchpad`, `cot`, `chain-of-thought`, `deliberation`, and their
   plural, prefix, suffix, camel-case, and separator variants.
2. Only complete `<...>` openers count away from the start of a message, because
   a bare tag name is usually prose that quotes a tag. At the start a truncated
   opener, such as `<thinkingThere is ...`, still counts: the name is on screen.
3. A block ends at the first reasoning-family closer outside Markdown code. Any
   family member closes any other, and case, padding, attributes, and pipe
   special tokens such as `<|end_of_thinking|>` are tolerated. A closer inside
   inline code or a fenced block does not end a block, so a reply that documents
   the tags is left alone.

Names are normalized into words, so `antThinking`, `redacted_thinking`,
`thought_process`, and `anthropic:thinking` count while `thoughtful` and an
unrelated `class="thinking"` attribute do not.

## The three layers

- `UserPromptSubmit` (`codex-plugin/hooks/delivery-prompt.ts`) injects the
  standing rule as `additionalContext` before the turn's first visible text. It
  skips its own text when it comes back as a prompt, so a replay cannot replace
  the real request. The rule names the tag families as words, never as literal
  tags, because a literal tag in an instruction invites a copy-back.
- `PreToolUse` (`no-think-tags/hooks/tool-hook.ts`) reads the current turn's
  assistant messages from the transcript at the next tool call and injects one
  short correction for each new leak. It never blocks the call: a leaked message
  is a wording defect, and interrupting the work would not remove text already on
  screen. Each message is nudged once, by id or by a text fingerprint, and a turn
  gets at most two nudges.
- `Stop` (`no-think-tags/hooks/stop-hook.ts`) corrects the final reply. A reply
  that opens with, carries, or never closes a raw block gets one bounded re-send
  whose reason names no tag and quotes no leaked text. A reply whose blocks leave
  no visible characters is reported as blank and asked for again the same way; a
  second blank reply is a dead loop and restarts the turn (see
  [loop guard](loop-guard.md)).

The mid-turn and Stop budgets are stored under separate state namespaces, so the
nudges already spent in a turn never silence the Stop-time correction. Every
layer fails open: a malformed payload, a missing transcript, or a read-only state
directory leaves the turn untouched.

## Why not just remove the text

Streamed text cannot be recalled. A hook that says it removed a block is lying to
the user and to the model. The honest remedy is prevention before the message is
written and one clean re-send after it, so the guard never claims a block it
could not take back.

## Interaction with the rest of the loop

- The guard blocks manual merges and base-branch writes; this hook only shapes
  the text. Neither replaces the other.
- A correction costs one extra model turn, so it is spent only once per leak.
  Repeated leaks in one turn are the model's problem, not a reason to loop.
- Clean output also keeps the review report readable: a shipped reply that opens
  with reasoning text is not a delivery the user can skim.

## Verification

- A reply that opens with, carries partway through, or never closes a reasoning
  block is corrected once.
- A response that only quotes the tags inside inline code or a fenced block is
  allowed.
- A progress note carrying a block is nudged at the next tool call, once, and not
  again on later calls; a turn receives at most two nudges.
- The mid-turn budget and the Stop budget do not consume each other, and every
  correction leaves the turn unblocked.
