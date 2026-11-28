# Claude

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Claude plugin marketplace |
| Project target | Claude plugin marketplace |
| User target | Claude plugin marketplace |
| Automation | manual-import |
| Detection | manual |
| Verification stages | package-build → plugin-marketplace-install → session-context |
| Source | https://code.claude.com/docs/en/plugins/overview |

## Install

The repository root publishes a Claude Code plugin marketplace, so the Git source installs without a local build:

    claude plugin marketplace add https://github.com/CYoJkoY/AzSkills.git

Install the plugins the project needs from the `azskills` marketplace:

    /plugin install engineering@azskills

AzSkills is a catalog, not one plugin. The marketplace lists 8 independent plugins, and each packaged plugin carries both a Codex manifest (`.codex-plugin/plugin.json`) and a Claude Code manifest (`.claude-plugin/plugin.json`) over the same `skills/`, `hooks/hooks.json`, and `.mcp.json` components:

- Workflow plugins: engineering, design, visual-assets, visual-production, writing, delivery-loop.
- Standalone plugins: serena, rea. These bundle an upstream MCP server, so they install only through the marketplace.

To build the marketplace locally instead, run `node scripts/package-plugin.ts --refresh` and add `dist/azskills-marketplace` as a directory source. Validate a checkout with `claude plugin validate`. Hooks need Node.js 22.18 or newer on PATH (23.6+ on Node 23); `statusMessage` is a Codex-only hook field and is dropped from the Claude Code hook files.


## Use

Start a new session and make a request covered by an installed plugin without naming it, for example: review this architecture. Each installed plugin is its own entry, and its skills, hooks, and bundled MCP servers load from the plugin directory.

## Verify

Run /plugin to confirm the azskills marketplace lists every catalog plugin, install the ones the project needs, and confirm each reports the current release version. Check that hooks load from the plugin (engineering adds the Godot 3.x write guard and the GPT with Taste steering; delivery-loop adds the delivery guard and goal continuation), and that a new session selects an installed plugin by description without naming it. Re-run claude plugin validate after editing a plugin.


## Remove

Uninstall the plugins you no longer need with `/plugin uninstall <id>@azskills`, then remove the marketplace with `claude plugin marketplace remove azskills` when it is no longer used.
