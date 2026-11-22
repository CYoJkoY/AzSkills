---
name: azskills
description: AzSkills is a catalog of independent Codex plugins for engineering architecture and code style, design systems and UI motion, visual assets, slides and video, documents, resumes, client setup, Godot 3.x, and answer hygiene. Install only the plugins a task needs; each one routes on its own.
version: 5.0.0
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
| `engineering` | architecture, az-clean-code | Runtime, frontend stack, persistence, process boundaries, explicit code, and code style consistency. |
| `design` | design-system, ui-design, style-presets | Design systems, interface hierarchy, states, responsive behavior, motion, visual QA, and named presets. |
| `visual-assets` | logo-generator, photo-abstract-editorial, scientific-figures | Logos, editorial image treatments, and verified scientific or medical figures. |
| `visual-production` | frontend-slides, remotion-production | Responsive HTML reports, fixed-stage presentations, and deterministic video. |
| `writing` | document-writing, localization | GitHub READMEs, Steam Workshop pages, and game CSV localization. |
| `resume-evidence-workflow` | resume-evidence-workflow | Career evidence, requirement alignment, and editable resume delivery. |
| `operations` | tool-integration, taste | AI client installation and setup, plus judgment and collaboration behavior. |
| `delivery-loop` | delivery-loop | Concurrent issue-to-merge delivery with touch-scope leases, worktree isolation, computed review scoring, and gated auto-merge. |
| `godot-3-dev` | godot-3-dev | Godot 3.x GDScript, virtual-call safety, the 3.6 API surface, and down-porting. |
| `no-think-tags` | hook only | Blocks a final reply that opens with a raw reasoning-tag block. |
| `empty-reply` | hook only | Requests a real answer when a finished turn has no visible text. |

Every workflow plugin ships one router skill that lists its member contracts, so
selecting the plugin exposes each contract inside it.

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
- "Set this up in Codex" matches `operations`.
- "Use frontend-architecture" is a legacy alias for `engineering/architecture/frontend`.

## References

- [Routing table](references/routing.md)
- [Shared rules](references/shared-rules.md)
- [Skill system](SKILL-SYSTEM.md)
