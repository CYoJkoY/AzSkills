# no-think-tags

An independent Codex plugin: a `Stop` hook that catches a final reply opening
with a raw `<think>`, `<thinking>`, or `<thought>` block — closed or left open —
and asks for exactly one clean re-send.

Reference behaviour: `magpie-community/plugins/packages/think-tags`.

## Layout

    .codex-plugin/plugin.json   plugin manifest (hooks: ./hooks/hooks.json)
    hooks/hooks.json            Stop handler registration
    hooks/stop-hook.ts          bounded correction decision
    lib/think-tags.ts           tag detection, unclosed-tag detection, stripping
    lib/hook-runtime.ts         payload validation and per-turn state
    skills/no-think-tags/       plugin skill contract

## Install

Build the catalog and add the generated marketplace:

    node scripts/package-plugin.ts
    codex plugin marketplace add ./dist/azskills-marketplace

Then install `no-think-tags` and trust its `Stop` hook.

## Limits

Codex cannot recall text that already streamed to the user and cannot read
model-hidden reasoning. The hook therefore reduces repetition; it does not
retroactively erase output.

Detection is limited to the start of the reply. Any reasoning-family closing tag
ends the block, so a reply that opens with one family member and closes with a
different one still counts. A tag that never closes is treated as a leak because
nothing after it can be separated from the reasoning, so the only honest remedy
is one clean re-send.

Opener and closer matching tolerates case, inner padding, trailing attributes on
the opener, and padding around the closing slash. `stop_hook_active` is only a
fallback loop guard: it is turn-wide, so with a turn id present the hook dedupes
on its own per-turn record and still corrects a leak it has not corrected yet.
