---
name: empty-reply
description: Recover a turn that ended without visible assistant text. Use when a model returns only reasoning, whitespace, or nothing at all, or when an agent loop must not accept an empty answer.
---

# Empty Reply

This plugin turns an empty finished turn into one more attempt instead of a
silent dead end.

## Contract

- Use when: a turn ends with no visible text, a reply contains only reasoning
  blocks, or an automated loop must reject empty answers.
- Do not use when: the user asked for no output, or the turn intentionally ends
  with a tool call only.
- Owns: empty-reply detection on the final assistant message and bounded
  continuation requests.
- Inputs: the final assistant message of a turn, which may be null.
- Outputs: an allowed stop, or a `block` decision that asks for the real answer.
- Compose with: nothing. This plugin is standalone.
- Gates: at most two continuations per turn; never loop.

## What counts as empty

- `null` or whitespace-only output.
- Output that becomes empty after removing `<think>`, `<thinking>`, and
  `<thought>` blocks.
- Output made only of invisible characters such as zero-width spaces.

A message containing any visible character is an answer, even a short refusal.

## Behaviour

- `stop_hook_active` is honoured so the hook cannot fight its own continuation.
- Continuations are counted per session and turn in the plugin data directory
  when it is writable, and capped at two.
- Truncated or refused replies are not empty; the hook does not retry them.

## Verification

- A null message triggers exactly one continuation request, then a second, then
  stops.
- A whitespace-only message triggers a continuation.
- A reasoning-only message triggers a continuation.
- Any visible text allows the stop.
