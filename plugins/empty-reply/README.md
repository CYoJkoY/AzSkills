# empty-reply

An independent Codex plugin: a `Stop` hook that detects a finished turn with no
visible assistant text and asks the model to continue, at most twice.

Reference behaviour: `magpie-community/plugins/packages/empty-reply`.

## Layout

    .codex-plugin/plugin.json   plugin manifest (hooks: ./hooks/hooks.json)
    hooks/hooks.json            Stop handler registration
    hooks/stop-hook.ts          bounded continuation decision
    lib/empty-reply.ts          visible-answer detection
    lib/think-tags.ts           reasoning-block removal
    lib/hook-runtime.ts         payload validation and per-turn state
    skills/empty-reply/         plugin skill contract

## Install

    node scripts/package-plugin.ts
    codex plugin marketplace add ./dist/azskills-marketplace

Then install `empty-reply` and trust its `Stop` hook.

## Limits

Codex does not expose model-hidden reasoning, so the hook judges only the final
assistant message. A turn that ends in a tool call without text is treated as
empty by design; disable the plugin when that is expected.
