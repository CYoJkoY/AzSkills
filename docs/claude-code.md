# Claude plugin projection

AzSkills packages for Codex. Since 7.12.0 every built plugin also carries a
Claude plugin projection over the same components, so one catalog serves both
hosts without a second build and without duplicated content.

The projection is a *manifest* layer, not a copy. The skills, the hooks, and the
bundled MCP servers stay where they already are; the Claude side adds the
manifests that make an existing directory tree loadable.

## Layout

A built plugin keeps the Codex manifest and gains the Claude files beside it:

    <plugin>/
      .codex-plugin/plugin.json     Codex manifest (unchanged)
      .claude-plugin/plugin.json    Claude manifest
      hooks/hooks.json              hooks, shared by both hosts
      .mcp.json                     bundled MCP servers, Claude shape
      skills/<id>/SKILL.md          skills, shared by both hosts

Claude discovers `skills/`, `hooks/hooks.json`, and `.mcp.json` by convention, so
the Claude manifest stays metadata only: name, version, description, author,
license, and keywords. Naming a component path there would be a second source of
truth that can drift from the directory, and it would break the moment a plugin
gains or drops a component.

The manifest is read back from the emitted Codex manifest during the build, so
the two cannot disagree about name, version, description, or license.

## Component mapping

| Component | Codex | Claude |
| :--- | :--- | :--- |
| Manifest | `.codex-plugin/plugin.json` | `.claude-plugin/plugin.json` |
| Root variable | `${PLUGIN_ROOT}` | `${CLAUDE_PLUGIN_ROOT}` |
| Hooks | `hooks/hooks.json` | `hooks/hooks.json` |
| MCP servers | `mcpServers` in the Codex manifest | `.mcp.json` |
| Skills | `skills/<id>/SKILL.md` | `skills/<id>/SKILL.md` |
| Marketplace | `.agents/plugins/marketplace.json` | `.claude-plugin/marketplace.json` |

## Hook parity

The hook file shape is the same on both hosts: a matcher list per event, a
`hooks` array per matcher, and `type: "command"` entries with `command` and
optional `timeout`. The pre-tool output protocol is the same too, so the guards
that deny a write or approve a delete behave identically.

Two differences are handled at build time:

- Every `${PLUGIN_ROOT}` is rewritten to `${CLAUDE_PLUGIN_ROOT}`, so a hook
  command resolves inside the plugin directory on either host.
- `statusMessage` is a Codex-only field. It is dropped from the Claude hook
  file rather than left in place, because an unknown field is a load error on a
  strict host and the message has no Claude equivalent.

## Marketplace

`node scripts/package-plugin.ts` writes two marketplaces with the same entries:

- `.claude-plugin/marketplace.json` at the repository root, with plugin sources
  under `./dist/azskills-marketplace/plugins/<id>`.
- `.claude-plugin/marketplace.json` inside a built marketplace directory, with
  plugin sources under `./plugins/<id>`.

Sources are relative to the directory that contains `.claude-plugin/`, use
forward slashes, and are checked for containment before they are written, so a
manifest cannot point outside the tree it ships with.

Install from the Git source:

    claude plugin marketplace add https://github.com/CYoJkoY/AzSkills.git
    /plugin install engineering@azskills

Or build locally and add `dist/azskills-marketplace` as a directory source.
`claude plugin validate` checks a checkout.

## Verification

`scripts/test-package-plugin.ts` asserts the projection per plugin and per
marketplace:

- `.claude-plugin/plugin.json` exists, and its name, version, description, and
  license match the Codex manifest.
- `hooks/hooks.json` exists exactly when the plugin declares hooks, contains no
  `${PLUGIN_ROOT}`, contains `${CLAUDE_PLUGIN_ROOT}`, carries no `statusMessage`,
  and every `${CLAUDE_PLUGIN_ROOT}/...` target resolves to a real file.
- `.mcp.json` exists exactly when the plugin declares MCP servers, and every
  server argument resolves.
- Each marketplace manifest deep-equals the manifest the catalog would produce,
  and every plugin source resolves.

## What is not verified

No Claude client is installed in this environment, so the projection is verified
as an artifact and against the documented schema, not by loading it. Installing
the marketplace and confirming the plugins appear is the first step of a real
check, and it is recorded as such in `integrations/guides/claude-code.md`.
