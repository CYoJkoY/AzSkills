---
name: azskills
description: AzSkills is a catalog of independent Codex plugins for engineering architecture and code style, design systems and UI motion, visual assets, slides and video, documents, resumes, client setup, and Godot 3.x. Install only the plugins a task needs; each one routes on its own.
version: 7.10.0
---

# AzSkills

AzSkills is a catalog of independent Codex plugins. Each plugin is a complete
installation unit: its own `.codex-plugin/plugin.json`, its own skill entry, its
own reference closure, and its own narrow trigger description. Nothing is loaded
through a shared dispatcher.

Plugins are grouped by the job a request asks for, not by the folder a contract
happens to live in. Each group stays small enough to answer one kind of request,
so grouping never hides a capability behind an unrelated name.

## Plugins

| Plugin | Workflows | Outcome |
| :--- | :--- | :--- |
| `engineering` | architecture, az-clean-code, godot-3-dev, tool-integration, taste | Runtime, frontend stack, persistence, process boundaries, explicit code, code style, Godot 3.x GDScript and four-section script layout, AI client setup, and judgment and collaboration behavior. |
| `design` | design-system, ui-design, style-presets | Design systems, interface hierarchy, states, responsive behavior, motion, visual QA, and named presets. |
| `visual-assets` | logo-generator, photo-abstract-editorial, scientific-figures | Logos, editorial image treatments, and verified scientific or medical figures. |
| `visual-production` | frontend-slides, remotion-production | Responsive HTML reports, fixed-stage presentations, and deterministic video. |
| `writing` | document-writing, localization, resume-evidence-workflow | GitHub READMEs, Steam Workshop pages, game CSV localization, and evidence-backed resumes. |
| `delivery-loop` | delivery-loop | Unattended issue-to-merge delivery with touch-scope leases, worktree isolation, enforced commit and PR standards, independent Elephant-Goldfish review, and gated auto-merge. |
| `serena` | upstream MCP | Serena's semantic code intelligence for symbol-aware retrieval, editing, refactoring, and project navigation. |
| `rea` | upstream MCP | REA's reverse-engineering tools for application behavior, JavaScript bundles, and native binaries. |

Every workflow plugin ships one router skill that lists its member contracts, so
selecting the plugin exposes each contract inside it.

`serena` and `rea` are standalone plugins. Each bundles an upstream MCP server
manifest, its own repository icon, and one skill entry, and installs from the
Codex plugin marketplace; a skills root cannot carry their MCP configuration.
Their MCP servers must be installed and available on PATH before use: Serena
through `uv tool install -p 3.13 serena-agent`, REA through `npx rea-agents@latest setup`.

`engineering` also ships the GPT with Taste behavior hooks: `SessionStart`,
`UserPromptSubmit`, and `SubagentStart` load the Main recipe and steer each
turn, and a completed local-agent wait injects the agent steer. It keeps the
Godot 3.x write guard on the same manifest.

`delivery-loop` also carries the delivery guard: a PreToolUse hook that permits
reviewer sub-agents only inside an `azflow review-open` window and auto-approves
repeated reads, tests, and a goal's own `--allow` patterns, and a Stop hook that
restarts a turn stuck in a dead loop, continues an active goal, and repairs a
stalled run within bounds, so independent review and loop control install with
the workflow that runs the longest turns.

`serena` and `rea` ship a `UserPromptSubmit` hook that matches a code-intelligence
or reverse-engineering request, in English or Chinese, and injects a pointer to
the bundled skill, so the MCP-backed plugin is reached without relying on
description matching alone.

`design`, `visual-assets`, and `visual-production` ship a `UserPromptSubmit`
hook that matches a visual request, in English or Chinese, against their own
keywords and injects a pointer to the plugin's router skill. The hook guarantees the pointer is
visible; it does not guarantee the model follows it.

`catalog/plugins.json` is the distribution registry; `skills.json` stays the
canonical module and alias source. A module plugin ships the workflow of the
linked contract; the contract is not an alternative entry point.

## Install

- Marketplace: `codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git`,
  then install only the plugins a task needs.
- Local build: `node scripts/package-plugin.ts --output <dir>`, then add
  `<dir>/azskills-marketplace`.
- Skills roots: `node scripts/install-skills.ts --tool codex --plugin <id,...>`
  installs the owning plugin directories. `--all-plugins` installs all of them.
- MCP catalog: `node scripts/azskills-mcp.ts` exposes `azskills://catalog` and
  `azskills://plugins/<id>[/<path>]`.

Installing a plugin never grants permission to publish, deploy, merge, send
messages, or change client settings. See the [README](README.md) and
[client guides](integrations/README.md).

## Examples

- "Review this app's architecture and tighten the code style" matches `engineering`.
- "Refine this interface and add its motion" matches `design`.
- "Write the README for this repository" matches `writing`.
- "Set this up in Codex" matches `engineering`.
- "Use frontend-architecture" is a legacy alias for `engineering/architecture/frontend`.

## References

- [Routing table](references/routing.md)
- [Shared rules](references/shared-rules.md)
- [Skill system](SKILL-SYSTEM.md)
