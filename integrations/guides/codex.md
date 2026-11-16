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

Add the repository as a Git marketplace, or build a local marketplace from the AzSkills checkout:

    codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git

    node scripts/package-plugin.mjs
    codex plugin marketplace add ./dist/azskills-marketplace

The repository root is the plugin root. Its .agents/plugins/marketplace.json points to ./, so a Git clone already contains .codex-plugin/plugin.json, codex-plugin/hooks, the canonical SKILL.md, and the skills entries Codex discovers. The default build mirrors that layout under dist/azskills-marketplace/plugins/azskills; with a custom --output directory, import the generated azskills-marketplace directory instead.

Install AzSkills from the marketplace in Codex. Review and trust the bundled hooks when prompted. The package uses the supported `.codex-plugin/plugin.json` manifest with a direct `hooks` path. Codex 0.167.0-alpha.4.1 discovers all eight handlers in this format but silently omits them from the Agent Plugins root manifest ([upstream issue](https://github.com/openai/codex/issues/59516)). Keep a root `plugin.json` out of the plugin root; adding a compatibility manifest alongside `.codex-plugin` does not select the compatibility loader. Once trusted, matching requests need no explicit invocation. SessionStart restores routing context; UserPromptSubmit applies routing and code-task guidance; the Godot 3.x guard checks the canonical `apply_patch` command (`Write`/`Edit` are matcher aliases; synthetic `MultiEdit` events still work) against the real project and `project.godot` when it can reconstruct the proposed content, denies checker errors in PreToolUse, falls back to high-confidence lexical blocking for partial or ambiguous patches or an unavailable checker, denies shell commands that appear to write Godot files, reruns the checker after shell commands that show write evidence, and blocks further progress in PostToolUse while static errors remain; SubagentStart and the wait-agent PostToolUse handler apply Taste steering. Hooks require Node.js on PATH and support installation paths containing spaces.

When upgrading from an earlier release, refresh the marketplace source and update or reinstall AzSkills in Codex. Confirm the installed plugin reports 2.7.1 or later; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes `hooks.json` or a bundled script marks the hooks for review again; re-trust them before expecting them to run. Open the hook list (or `/hooks` in the CLI): expect eight handlers across SessionStart, UserPromptSubmit, SubagentStart, PreToolUse, and PostToolUse, visible even before trust. Review and trust the commands, then start a new session. An empty list indicates discovery or installation trouble; visible untrusted hooks require trust before execution.

## Use

Start a new Codex session and make a request covered by AzSkills without naming the plugin. The SessionStart hook should supply the AzSkills entry and routing instructions.

## Verify

Confirm the installed plugin version, list eight handlers across five events, review and trust their commands including the Godot 3.x PreToolUse/PostToolUse guard, then confirm a new session receives AzSkills routing context.


## Remove

Disable or uninstall AzSkills in Codex, then remove the azskills-local marketplace with codex plugin marketplace remove azskills-local.
