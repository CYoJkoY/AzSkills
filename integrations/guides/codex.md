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

To import the repository root, first run the default build above. Its .agents/plugins/marketplace.json points to ./dist/azskills-marketplace/plugins/azskills, the complete built plugin. The source codex-plugin directory alone has no bundled skills and must not be installed. With a custom --output directory, import the generated azskills-marketplace directory instead.

Install AzSkills from the marketplace in Codex. Review and trust the bundled hooks when prompted. The package uses the supported `.codex-plugin/plugin.json` manifest with a direct `hooks` path. Codex 0.167.0-alpha.4.1 discovers all six handlers in this format but silently omits them from the Agent Plugins root manifest ([upstream issue](https://github.com/openai/codex/issues/59516)). Keep the plugin root free of `plugin.json`; adding a compatibility manifest alongside it does not select the compatibility loader. Once trusted, matching requests need no explicit invocation. SessionStart restores routing context; UserPromptSubmit applies routing and code-task guidance; SubagentStart and PostToolUse apply Taste steering. Hooks require Node.js on PATH and support installation paths containing spaces.

When upgrading from 2.5.1, rebuild into a fresh output directory, refresh the marketplace source, and update or reinstall AzSkills in Codex. Confirm the installed plugin reports 2.5.2 or later; changing the checkout alone does not replace a cached installation. Open the hook list (or `/hooks` in the CLI): expect six handlers across SessionStart, UserPromptSubmit, SubagentStart, and PostToolUse, visible even before trust. Review and trust the commands, then start a new session. An empty list indicates discovery or installation trouble; visible untrusted hooks require trust before execution.

## Use

Start a new Codex session and make a request covered by AzSkills without naming the plugin. The SessionStart hook should supply the AzSkills entry and routing instructions.

## Verify

Confirm the installed plugin version, list all six handlers across four events, review and trust their commands, then confirm a new session receives AzSkills routing context.


## Remove

Disable or uninstall AzSkills in Codex, then remove the azskills-local marketplace with codex plugin marketplace remove azskills-local.
