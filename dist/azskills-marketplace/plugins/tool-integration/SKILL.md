---
name: azskills
description: AzSkills is a catalog of independent Codex plugins for architecture, design systems, interfaces, motion, logos, editorial images, slides, video, publishing, resumes, AI client setup, code discipline, Godot 3.x, style presets, scientific figures, and answer hygiene. Install the plugins a task needs; each one routes on its own.
version: 4.0.0
---

# AzSkills

AzSkills is a catalog of independent Codex plugins. Every capability below ships
as its own plugin with its own `.codex-plugin/plugin.json`, skill entry, reference
closure, and narrow trigger description. Nothing is loaded through a shared
dispatcher.

The catalog exists because one broad entry only fires when a prompt names it or
matches its single description. Independent plugins are matched directly, so a
capability is no longer invisible to automatic routing.

## Catalog

`catalog/plugins.json` is the distribution registry; `skills.json` remains the
canonical module and alias source. A module plugin carries the workflow of the
linked contract; the contract is not an alternative entry point.

| Plugin | Modes | Outcome |
| :--- | :--- | :--- |
| [`architecture`](references/modules/architecture.md) | runtime, frontend, migration, review | Runtime, frontend stack, persistence, and process boundaries. |
| [`design-system`](references/modules/design-system.md) | ingest, author, migrate, audit | DESIGN.md ingestion, normalization, provenance, and verification. |
| [`ui-design`](references/modules/ui-design.md) | build, refine, review, system, motion, motion-review, motion-audit, motion-pattern, svg | Interface hierarchy, components, states, responsive behavior, motion, and visual QA. |
| [`logo-generator`](references/modules/logo-generator.md) | mark, character, system | Logos, product marks, character marks, and identity systems. |
| [`photo-abstract-editorial`](references/modules/photo-abstract-editorial.md) | treatment, audit | Photograph-preserving abstract editorial diptychs. |
| [`frontend-slides`](references/modules/frontend-slides.md) | new, convert, enhance, report | Responsive HTML reports, fixed-stage presentations, and rendered QA. |
| [`remotion-production`](references/modules/remotion-production.md) | video, data, 3d, ui-showcase, motion, av | Deterministic programmatic video and render delivery. |
| [`document-writing`](references/modules/document-writing.md) | readme, readme-rewrite, readme-audit, steam-player, steam-developer, steam-audit | GitHub README and Steam Workshop documents with evidence, formatting, and QA. |
| [`localization`](references/modules/localization.md) | translate, audit | Game CSV localization with locale completeness and markup safety. |
| [`resume-evidence-workflow`](references/modules/resume-evidence-workflow.md) | evidence, tailor, review | Career evidence, requirement alignment, and editable resume delivery. |
| [`tool-integration`](references/modules/tool-integration.md) | install, configure, troubleshoot, remove | Connect AzSkills to AI clients with verified installation and setup workflows. |
| [`taste`](references/modules/taste.md) | main, subagent, independent | GPT with Taste judgment, collaboration, and execution behavior. |
| [`az-clean-code`](references/modules/az-clean-code.md) | write, review, refactor, style | Explicit, flat, reusable code with business data externalized before implementation. |
| [`godot-3-dev`](references/modules/godot-3-dev.md) | script, review, port | Godot 3.x GDScript, virtual-call safety, 3.6 API surface, and down-porting. |
| [`style-presets`](references/modules/style-presets.md) | catalog, apply, loaders, audit | Named visual presets, keyword triggers, preset token packs, and loading indicators. |
| [`scientific-figures`](references/modules/scientific-figures.md) | redraw, author, verify | Medical and scientific schematics, faithful redraws, editable SVG, and deterministic figure verification. |

Two plugins enforce answer hygiene with Stop hooks and ship no workflow contract:

| Plugin | Outcome |
| :--- | :--- |
| [`no-think-tags`](plugins/no-think-tags/skills/no-think-tags/SKILL.md) | Blocks a final reply that opens with a raw reasoning-tag block. |
| [`empty-reply`](plugins/empty-reply/skills/empty-reply/SKILL.md) | Requests a real answer when a finished turn has no visible text. |

## Install

- Marketplace: `codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git`.
  For a local build, use `node scripts/package-plugin.ts --output <dir>`, then
  add `<dir>/azskills-marketplace`.
- Skills roots: `node scripts/install-skills.ts --tool codex --plugin <id,...>`
  installs module plugins only. `--all-plugins` installs all of them.
- MCP catalog: `node scripts/azskills-mcp.ts` exposes `azskills://catalog` and
  per-plugin resources.

Installing a plugin never grants permission to publish, deploy, merge, send
messages, or change client settings. See the [README](README.md) and
[client guides](integrations/README.md).

## Examples

- "Review this app's architecture" matches the `architecture` plugin.
- "Refine this interface" matches the `ui-design` plugin.
- "Use frontend-architecture" is a legacy alias for `architecture`/frontend.
- "Set this up in Codex" matches the `tool-integration` plugin.

## References

- [Routing table](references/routing.md)
- [Shared rules](references/shared-rules.md)
- [Skill system](SKILL-SYSTEM.md)
