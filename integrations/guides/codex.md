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

AzSkills is a catalog, not one plugin. The marketplace lists 11 independent plugins, each with its own `.codex-plugin/plugin.json`, skill entry, and reference closure:

- Workflow plugins: engineering, design, visual-assets, visual-production, writing, resume-evidence-workflow, operations, delivery-loop, godot-3-dev.
- Hook plugins: no-think-tags and empty-reply, each a Stop-hook backstop for answer hygiene.

Install the plugins the project needs. Each plugin is matched on its own description, so a capability no longer depends on one shared dispatcher entry. Hooks ship only with `operations` (taste steering) and `godot-3-dev` (Godot 3.x write guard), plus the two hook plugins; review and trust them when prompted. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces.

When upgrading from an earlier release, remove the old marketplace, add the Git source again, and reinstall the selected plugins. Confirm each installed plugin reports 5.0.0 or later; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes a hook manifest or a bundled script marks those hooks for review again. Open the hook list (or `/hooks` in the CLI) to review and trust the handlers, then start a new session.

## Use

Start a new Codex session and make a request covered by an installed plugin without naming it. The matching plugin is selected by its own description; no shared routing hook is involved.

## Verify

Confirm the marketplace lists 11 plugins, install the ones the project needs, check that each reports version 5.0.0 or later, review and trust hooks for operations (taste), delivery-loop, godot-3-dev, no-think-tags, and empty-reply, then confirm a new session selects an installed plugin by description without naming it.


## Remove

Uninstall the plugins you no longer need in Codex, then remove the marketplace with `codex plugin marketplace remove azskills-local` when it is no longer used.
