# Codex

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Codex plugin marketplace |
| Project target | Codex plugin marketplace |
| User target | Codex plugin marketplace |
| Automation | manual-import |
| Detection | manual |
| Verification stages | package-build → plugin-install-and-hook-trust → session-context |
| Source | https://developers.openai.com/plugins/build/plugins |

## Install

Build the catalog marketplace from the AzSkills checkout, then add it to Codex:

    node scripts/package-plugin.ts --output /path/to/fresh/exports
    codex plugin marketplace add /path/to/fresh/exports/azskills-marketplace

The repository root publishes the built catalog, so the Git source can be added directly without building first:

    codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git

AzSkills is a catalog, not one plugin. The marketplace lists 8 independent plugins, each with its own `.codex-plugin/plugin.json`, skill entry, and reference closure:

- Workflow plugins: engineering, design, visual-assets, visual-production, writing, delivery-loop.
- Standalone plugins: serena, rea. These bundle an upstream MCP server, so they install only through the marketplace.
- `delivery-loop` also carries a dead-loop restart hook, a goal-run continuation hook, and a short-lived review window that admits reviewer sub-agents so an independent model scores the work instead of the session scoring itself.

Install the plugins the project needs. Each plugin is matched on its own description, so a capability no longer depends on one shared dispatcher entry. Hooks ship with `engineering` (GPT with Taste steering on session start, request, and subagents, plus the Godot 3.x write guard), `delivery-loop` (delivery-state guard that admits reviewer sub-agents only inside an open review window, dead-loop restart, and goal continuation), `serena` and `rea` (a `UserPromptSubmit` pointer to their own skill when a code-intelligence or reverse-engineering prompt matches, including short Chinese prompts), and `design`/`visual-assets`/`visual-production` (a `UserPromptSubmit` pointer to their router skill when an English or Chinese prompt looks visual); review and trust them when prompted. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces.

When upgrading from an earlier release, refresh the Git snapshot with `codex plugin marketplace upgrade azskills`, then confirm each installed plugin reports 7.12.0 or later. If a cached installation keeps an older version, remove the marketplace, add the Git source again, and reinstall the selected plugins; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes a hook manifest or a bundled script marks those hooks for review again. Open the hook list (or `/hooks` in the CLI) to review and trust the handlers, then start a new session.

## Use

Start a new Codex session and make a request covered by an installed plugin without naming it. The matching plugin is selected by its own description; no shared routing hook is involved.

## Verify

Confirm the marketplace lists every catalog plugin, install the ones the project needs, and refresh the Git snapshot with `codex plugin marketplace upgrade azskills` after a release. Check that each plugin reports the current release version, then review and trust hooks for engineering (GPT with Taste steering plus the Godot 3.x write guard), delivery-loop (delivery-state guard, review window that admits reviewer sub-agents, dead-loop restart, and goal continuation), serena and rea (a code-intelligence or reverse-engineering intent pointer), and design, visual-assets, and visual-production (a visual-intent pointer). Confirm a new session selects an installed plugin by description without naming it, and that a delivery-loop review delegates scoring to an independent reviewer instead of scoring itself.


## Remove

Uninstall the plugins you no longer need in Codex, then remove the marketplace with `codex plugin marketplace remove azskills` when it is no longer used.
