# Output hygiene

A delivery loop runs long turns. Every leaked reasoning tag spends tokens twice:
once in the reply the user sees and once in the correction that asks for a clean
re-send, and the wasted text stays in the context the next turn must carry. That
is why output hygiene belongs to the loop rather than to a separate optional
plugin: a clean reply is cheaper context, and cheaper context is a longer run
before the window fills.

## The rule

A final assistant reply must not open with a raw reasoning block and must carry
visible text. The `Stop` hook in `codex-plugin/hooks/delivery-stop.ts` enforces
both and asks for exactly one bounded re-send.

## What counts as a leak

1. The message begins with optional whitespace followed by an opener from the
   reasoning family. That family includes the common spellings `think`,
   `thinking`, `thought`, `thoughts`, `reasoning`, `reflection`, `analysis`,
   `scratchpad`, `cot`, `chain-of-thought`, `deliberation`, `introspection`, and
   their plural, prefix, suffix, camel-case, and separator variants.
2. The block ends at the first reasoning-family closing tag outside Markdown
   code, or the opener never closes at all.
3. Neither the opener nor the closer sits inside inline code or a fenced block.

Tag names are normalized into words rather than compared literally, which covers
the spellings models actually emit: `antThinking`, `redacted_thinking`,
`thought_process`, `scratch_pad`, `chain-of-thoughts`, and namespaced forms such
as `anthropic:thinking`. Only whole words count, so prose like `thoughtful` or a
`class="thinking"` attribute on an unrelated element is not a leak. A leading
orphan closer left by malformed nested tags is also a leak.

Termination is family-wide and loose on purpose. Any closer from the same family
ends the block, regardless of which member opened it. Case, inner padding, a
trailing attribute or self-closing opener, and padding around the closing slash
all still count. A strict literal comparison misses real replies, which is the
failure this check exists to catch.

Pipe-wrapped special tokens are recognized in both `|` and `｜` forms, including
`▁` word spacing (`<|begin▁of▁thinking|>`). These tokens usually close without a
slash, so `<|end_of_thinking|>`, `<|end▁of▁thinking|>`, and their full-width
counterparts terminate a block. A pipe token is a closer only when it names both
a reasoning family and an explicit end word, so `<|begin_of_thought|>`,
`<|channel|>`, and `<|end_of_text|>` never end a block by accident.

A block that never closes still counts: the opening tag is already on screen, and
every following line is indistinguishable from reasoning. Blank lines between the
opener and the rest of the text do not exempt it. A message that only documents
the tags, or quotes them inside code, is not a leak.

## The correction

- The hook emits one `block` decision whose reason asks for a clean re-send: no
  thinking-tag block, no preamble about the instruction, only the requested
  content.
- A reply whose reasoning blocks leave no visible characters is reported as blank
  and asked for again in the same way.
- A second blank reply in the same turn is not corrected again: the loop guard
  treats it as a dead loop and restarts the turn with the prompt re-sent.
- The already-emitted text is never described as removed, because text that has
  streamed cannot be recalled. One re-send is the only honest remedy.
- The reason repeats the user prompt verbatim between fixed markers. After a long
  run the prompt may no longer be in context, and a correction that only says
  "send it again" invites an answer to the wrong question.
- At most one correction is requested per turn, tracked per session and turn in
  the plugin data directory. A second `Stop` for the same turn is allowed.
- `stop_hook_active` is turn-wide, so it also reads true when another `Stop` hook
  already continued the turn. The hook therefore dedupes on its own per-turn
  record when the payload carries a turn id, and falls back to the shared flag
  only when no turn id arrives or the record cannot be written.
- The hook fails open: a malformed payload, an unknown event, or a crashed check
  never blocks a turn.

## Interaction with the rest of the loop

- The guard blocks manual merges and base-branch writes; this hook only shapes the
  final text. Neither replaces the other.
- The same hook checks for a dead loop first, so a wiped or repeated reply is
  handled as a loop restart rather than as a second correction. See
  [loop guard](loop-guard.md).
- A correction costs one extra model turn, so it is spent only when the leak is
  real and only once. Repeated leaks in one turn are the model's problem, not a
  reason to loop.
- Clean output also keeps the review report readable: a shipped reply that starts
  with reasoning text is not a delivery the user can skim.

## Verification

- A reply that opens with a reasoning block and closes with the same-family closer
  is corrected once.
- A reply that opens with an opener and never closes, across blank lines, is
  corrected once.
- A reply that opens with one family member and closes with another, or uses an
  upper-case, padded, or attribute-bearing spelling, is corrected once.
- A reply built from derived reasoning aliases, a self-closing opener, or
  malformed nested tags that leaves a leading orphan closer is corrected once.
- A reply that closes with a slash-less pipe token such as `<|end_of_thinking|>`
  or `<|end▁of▁thinking|>`, in `|` or `｜` form, is corrected once.
- A reply that only contains non-closing pipe tokens such as `<|channel|>` or
  `<|begin_of_thought|>` is not treated as closed by them.
- A reply whose tags appear only inside a fenced block or inline code is allowed.
- A second `Stop` for the same turn is allowed without output.
- A turn where another `Stop` hook already continued still gets its own leaked tag
  corrected, because the shared flag alone does not prove this hook ran.
- A reply made only of reasoning blocks, or only of invisible characters, is
  corrected once as blank.
- Every correction reason ends with the prompt block recorded by
  `UserPromptSubmit`, so the model can restate the request it was answering.
