# no-think-tags

An independent Codex plugin: a `Stop` hook that catches a final reply opening
with a raw `<think>`, `<thinking>`, or `<thought>` block and asks for exactly one
clean re-send.

Reference behaviour: `magpie-community/plugins/packages/think-tags`.

## Layout

    .codex-plugin/plugin.json   plugin manifest (hooks: ./hooks/hooks.json)
    hooks/hooks.json            Stop handler registration
    hooks/stop-hook.ts          bounded correction decision
    lib/think-tags.ts           tag detection and stripping
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
