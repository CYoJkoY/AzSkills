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
- `delivery-loop` also carries prompt-aware output guards and a dead-loop restart hook.

Install the plugins the project needs. Each plugin is matched on its own description, so a capability no longer depends on one shared dispatcher entry. Hooks ship with `engineering` (GPT with Taste steering on session start, request, and subagents, plus the Godot 3.x write guard), `delivery-loop` (delivery-state guard, prompt-aware output correction, and dead-loop restart), and `design`/`visual-assets`/`visual-production` (a `UserPromptSubmit` pointer to their router skill when an English or Chinese prompt looks visual); review and trust them when prompted. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces.

When upgrading from an earlier release, remove the old marketplace, add the Git source again, and reinstall the selected plugins. Confirm each installed plugin reports 7.3.0 or later; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes a hook manifest or a bundled script marks those hooks for review again. Open the hook list (or `/hooks` in the CLI) to review and trust the handlers, then start a new session.

## Use

Start a new Codex session and make a request covered by an installed plugin without naming it. The matching plugin is selected by its own description; no shared routing hook is involved.

## Verify

Confirm the marketplace lists every catalog plugin, install the ones the project needs, check that each reports the current release version, review and trust hooks for engineering (GPT with Taste steering plus the Godot 3.x write guard), delivery-loop (delivery-state guard and reasoning-tag Stop hook), and design, visual-assets, and visual-production (a visual-intent pointer), then confirm a new session selects an installed plugin by description without naming it.


## Remove

Uninstall the plugins you no longer need in Codex, then remove the marketplace with `codex plugin marketplace remove azskills-local` when it is no longer used.
