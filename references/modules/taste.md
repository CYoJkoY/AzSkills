---
name: taste
description: Apply GPT with Taste's judgment, collaboration, and execution behavior through Codex hooks and reusable role prompts.
version: 1.0.0
status: module
family: operations
modes: [main, subagent, independent]
---

# GPT with Taste

This module preserves GPT with Taste as an AzSkills capability. Codex plugin hooks automatically load the Main recipe at session start, the user steer on each request, the Sub steer for child sessions, and the agent steer after supported local-agent waits.

## Contract

- Use when: work benefits from decisive judgment, ongoing ownership, agent collaboration, and clear delivery.
- Do not use when: GPT with Taste behavior is not part of the task context.
- Owns: role prompts and lifecycle steering for Main, Sub, and Independent agents.
- Inputs: Codex lifecycle events and the user's current task.
- Outputs: role behavior loaded automatically and prompts available for explicit standalone use.
- Compose with: the AzSkills module that owns the requested artifact.
- Gates: follow the user's latest language, preserve agent ownership, and keep tool actions within actual authorization.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| main | Primary assistant work in Codex | Load at session start; refresh request steering on user turns | Taste Main behavior |
| subagent | Delegated work | Apply Sub role on child startup and child input | Bounded delegated behavior |
| independent | Standalone agent work | Load the complete Independent recipe when that role is requested | Independent role behavior |

## Workflow

1. Codex SessionStart loads the complete Main recipe.
2. UserPromptSubmit injects the user steer alongside AzSkills task routing.
3. SubagentStart and child prompts receive the Sub steer.
4. A completed supported local-agent wait injects the agent steer into Main; timeouts, partial results, and child results are ignored.
5. Load a complete Sub or Independent recipe when a separate agent needs the full role contract.

## Role prompts

- [Main behavior](../../codex-plugin/taste/recipe/main.md) defines the primary assistant role.
- [Subagent behavior](../../codex-plugin/taste/recipe/sub.md) defines delegated work.
- [Independent agent behavior](../../codex-plugin/taste/recipe/independent.md) defines standalone agent work.

## Automatic steering

- [User request steer](../../codex-plugin/taste/prompts/user-steer.md) reinforces proactive behavior on each user turn.
- [Subagent steer](../../codex-plugin/taste/prompts/sub-steer.md) preserves delegated role boundaries.
- [Agent result steer](../../codex-plugin/taste/prompts/agent-steer.md) helps Main reconcile completed work.

The Codex hook implementation is in `codex-plugin/taste/hooks`. It matches only local `wait_agent` tool variants and injects agent guidance only for completed results or the supported mailbox wake response.

## Quality gates

- [ ] The hook event is routed to its intended Main or child consumer.
- [ ] Main agent steering is emitted only for completed results or the supported mailbox wake event.
- [ ] The Codex hook output names the actual event and emits valid JSON.
- [ ] Full role recipes remain available to callers that need them.

## Output contract

Hooks emit Codex `hookSpecificOutput` with the originating `hookEventName` and `additionalContext`. Unsupported or incomplete events continue without adding context.

## References

- [Main behavior](../../codex-plugin/taste/recipe/main.md)
- [Subagent behavior](../../codex-plugin/taste/recipe/sub.md)
- [Independent behavior](../../codex-plugin/taste/recipe/independent.md)
- [Hook implementation](../../codex-plugin/taste/hooks/steer.mjs)
