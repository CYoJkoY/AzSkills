---
name: no-think-tags
description: Keep raw reasoning tags out of final replies. Use when a model has emitted <think>, <thinking>, or <thought> blocks to the user, or when a task must guarantee clean assistant output.
---

# No Think Tags

This plugin enforces one output-hygiene rule with a Stop hook: a final assistant
reply must not open with a raw reasoning block.

## Contract

- Use when: the user reports leaked reasoning tags, a reply must be clean final
  text, or output hygiene needs a deterministic backstop.
- Do not use when: the user asks for a transcript, a debugging dump, or a
  deliberate record of reasoning text.
- Owns: detection of leading reasoning-tag blocks and one bounded correction.
- Inputs: the final assistant message of a turn.
- Outputs: an allowed stop, or a single `block` decision with a clean re-send
  instruction.
- Compose with: nothing. This plugin is standalone and adds no catalog entry.
- Gates: no correction loop; the hook never fires twice in one turn.

## What counts as a leak

1. The message begins with optional whitespace followed by `<think>`,
   `<thinking>`, or `<thought>`.
2. Either the block closes with a closing tag from the same reasoning family
   (`</think>`, `</thinking>`, or `</thought>`, whitespace-tolerant and
   regardless of which opener started the block), or the opening tag never
   closes at all.
3. The closing tag is not inside Markdown inline code or a fenced block.

A block that never closes still counts: the opening tag is already on screen and
every following line is indistinguishable from reasoning. Blank lines between
the opening tag and the rest of the text do not exempt it.

Opener and closer matching is deliberately loose. Case, inner padding, and a
trailing attribute on the opener all still count, and so does a closer with
padding around the slash. A strict literal comparison misses real replies, which
is exactly the leak this hook exists to catch.

A message that only documents the tags, or that quotes them in code, is not a
leak.

## Behaviour

- `stop_hook_active` is only a fallback guard. That flag is turn-wide, so it also
  reads true when some other Stop hook already continued the turn; treating it as
  "this hook already fired" silences the check. When the payload carries a turn
  id, the hook dedupes on its own record and still corrects a leak it has not
  corrected yet. The shared flag suppresses a correction only when the harness
  sends no turn id, or when the correction record cannot be written.
- At most one correction is requested per turn, tracked per session and turn in
  the plugin data directory when it is writable.
- The already-emitted text is never described as removed. The reason asks for a
  clean re-send, which is the only honest remedy once text has streamed.

## Verification

- A reply that opens with `<thinking>...</thinking>` followed by text is
  corrected once.
- A reply that opens with `<think>` and never closes, across blank lines, is
  corrected once.
- A reply that opens with one reasoning tag and closes with a different tag in
  the same family is corrected once.
- A reply that opens with an upper-case, padded, or attribute-bearing tag, or
  that closes with a padded or upper-case closer, is corrected once.
- A turn where another Stop hook already continued the conversation still gets
  its leaked tag corrected, because the flag alone does not prove this hook ran.
- A reply whose tags appear inside a fenced block is allowed.
- A second Stop for the same turn is allowed without output.
