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
2. The block closes with its own closing tag.
3. The closing tag is not inside Markdown inline code or a fenced block.

A message that only documents the tags, or that quotes them in code, is not a
leak.

## Behaviour

- `stop_hook_active` is honoured: the hook does not re-block its own
  continuation.
- At most one correction is requested per turn, tracked per session and turn in
  the plugin data directory when it is writable.
- The already-emitted text is never described as removed. The reason asks for a
  clean re-send, which is the only honest remedy once text has streamed.

## Verification

- A reply that opens with `<thinking>...</thinking>` followed by text is
  corrected once.
- A reply whose tags appear inside a fenced block is allowed.
- A second Stop for the same turn is allowed without output.
