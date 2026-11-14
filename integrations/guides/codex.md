# Codex

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Codex plugin with session hook |
| Project target | Codex plugin marketplace |
| User target | Codex plugin marketplace |
| Automation | manual-import |
| Detection | manual |
| Verification stages | package-build → plugin-install-and-hook-trust → session-context |
| Source | https://developers.openai.com/plugins/build/plugins |

## Install

Build the Codex plugin and its local marketplace from the AzSkills checkout:

    node scripts/package-plugin.mjs
    codex plugin marketplace add ./dist/azskills-marketplace

For a direct checkout import, select the AzSkills repository root; its .agents/plugins/marketplace.json points to the source plugin directory.

Install AzSkills from the marketplace in Codex. Review and trust the bundled SessionStart and UserPromptSubmit hooks when prompted. Once trusted, matching requests need no explicit invocation. SessionStart restores routing context on startup, resume, clear, compaction, and fork. UserPromptSubmit adds a short reminder for each request. Both hooks require Node.js on PATH and support installation paths containing spaces. The plugin bundles its AzSkills icon for the composer and plugin details.

## Use

Start a new Codex session and make a request covered by AzSkills without naming the plugin. The SessionStart hook should supply the AzSkills entry and routing instructions.

## Verify

Install the AzSkills plugin from its local marketplace, trust the session hook, then confirm a new session receives AzSkills routing context.


## Remove

Disable or uninstall AzSkills in Codex, then remove the azskills-local marketplace with codex plugin marketplace remove azskills-local.
