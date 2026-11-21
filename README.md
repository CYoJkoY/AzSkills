# AzSkills

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/azskills-hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/azskills-hero.svg">
  <img src="assets/azskills-hero.svg" alt="AzSkills Wabi Press overview: a catalog of independent Codex plugins" width="100%">
</picture>

Version **3.0.0**. A catalog of independent Codex plugins, not one plugin with hidden modules.

Every capability ships as its own plugin with its own manifest, skill entry, trigger description, and reference closure. A single dispatcher entry only fires when a prompt names it or matches one broad description; independent plugins are matched directly, so capabilities stop being invisible to automatic routing. `catalog/plugins.json` is the distribution registry and `skills.json` stays the canonical module and alias source.

| Kind | Plugins | Count |
| :--- | :--- | :--- |
| Workflow | architecture, design-system, ui-design, ui-motion, logo-generator, photo-abstract-editorial, frontend-slides, remotion-production, readme-craft, steam-mod-page, localization, resume-evidence-workflow, tool-integration, taste, az-clean-code, godot-3-dev, style-presets, scientific-figures | 18 |
| Hook | no-think-tags, empty-reply | 2 |

## Install

Requires Node.js 22.18 or later (23.6+ on Node 23, which enabled type stripping mid-release), because the scripts run as native TypeScript.

Install selected workflow plugins as skill folders:

```sh
node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin architecture,ui-design --dry-run
node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin architecture,ui-design --yes
```

Each selected plugin becomes `/path/to/project/.agents/skills/<id>/SKILL.md` with its own reference closure. Use `--all-plugins` for every workflow plugin, `--mode user` for the client user directory, `--target <skills-root>` to override the destination, or `--list` to see supported clients. Running without arguments opens a client-selection prompt. Bare installs select all workflow plugins.

For the full catalog including hooks, use the Codex plugin marketplace:

```sh
node scripts/package-plugin.ts --output /path/to/fresh/exports
codex plugin marketplace add /path/to/fresh/exports/azskills-marketplace
```

```sh
codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git
```

The build writes `azskills-marketplace/.agents/plugins/marketplace.json` plus one self-contained directory per plugin under `plugins/<id>/`, and deterministic archives under `zips/<id>.zip`. Install the plugins you need from the marketplace; each plugin carries a narrow description and is matched on its own. Only `taste` (steering) and `godot-3-dev` (Godot 3.x write guard) ship hooks among workflow plugins, plus the two hook plugins; review and trust those hooks when prompted. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces. The hook plugins use Stop hooks: `no-think-tags` blocks a final reply that opens with a raw reasoning-tag block, and `empty-reply` asks for a real answer when a finished turn has no visible text. See the [Codex upgrade and verification guide](integrations/guides/codex.md).

See [client integration guides](integrations/README.md) for Codex plugin setup, skill folders, manual import, and MCP configuration. Client discovery depends on the client scan scope and may require a restart. The installer verifies local contents separately from actual client discovery and invocation.

## Use

Ask naturally, for example:

- "Review the architecture of this application." matches the `architecture` plugin.
- "Refine the interface and check its states." matches the `ui-design` plugin.
- "Turn these findings into an HTML report." matches the `frontend-slides` plugin.

You may name a mode such as `architecture/frontend` or a legacy name such as `frontend-architecture`; both resolve to the plugin that owns the module. Read [routing](references/routing.md) for outcomes and modes; the [catalog index](SKILL.md) lists every plugin.

## Upgrade and rollback

The installer records installed plugin ids in a schema 4 `.azskills-manifest.json` and migrates older manifests (schemas 1 to 3, including the former single `azskills` directory). It preserves unrelated paths and refuses an unmanaged conflicting plugin directory. An old manual installation without a manifest needs manual reconciliation after reviewing its files. `--skills` remains a legacy alias for `--plugin`.

Backups live outside the scan root, in a sibling `.<skills-root-name>-azskills-backups` directory. Existing in-root AzSkills backups move there during migration so their old manifests cannot be rediscovered. Rollback restores the previous entries, previous manifest bytes, and previous in-root backup location, so it intentionally restores the previous discovery behavior too.

```sh
node scripts/install-skills.ts --verify --target /path/to/skills
node scripts/install-skills.ts --rollback --target /path/to/skills --yes
node scripts/install-skills.ts --uninstall --target /path/to/skills --yes
```

Uninstall backs up and removes managed plugin directories. Rollback restores the immediately preceding operation; an unchanged install preserves the existing rollback point. Backups are retained for recovery and are not automatically purged. A missing or modified rollback snapshot requires manual recovery.

## Workflow contracts

These contracts are ordinary Markdown files. Each one is the workflow that its plugin ships, and it retains the domain workflow and output gates.

For a visual starting point, open the [preset catalog](style-presets/references/catalog.md)
or the [interactive style and loader gallery](style-presets/assets/gallery.html).
Say "show the style catalog", "use BioRender style", or "add a CSS loader";
the prompt hook selects the matching workflow. Medical or research drawing
requests select [Scientific Figures](references/modules/scientific-figures.md),
also available as `sciprism-svg`. Its [runnable pipeline](scientific-figures/references/pipeline.md)
turns scene JSON into editable SVG and checks the result.

<!-- SKILL-CATALOG:START -->
| Family | Module | Modes | Focus |
| :--- | :--- | :--- | :--- |
| Architecture | [`architecture`](references/modules/architecture.md) | runtime, frontend, migration, review | Runtime, frontend stack, persistence, and process boundaries. |
| Interface | [`design-system`](references/modules/design-system.md) | ingest, author, migrate, audit | DESIGN.md ingestion, normalization, provenance, and verification. |
| Interface | [`ui-design`](references/modules/ui-design.md) | build, refine, review, system | Interface hierarchy, components, states, responsive behavior, and visual QA. |
| Interface | [`ui-motion`](references/modules/ui-motion.md) | build, review, audit, pattern, svg | Motion construction, review, audit, patterns, and SVG animation. |
| Visual | [`logo-generator`](references/modules/logo-generator.md) | mark, character, system | Logos, product marks, character marks, and identity systems. |
| Visual | [`photo-abstract-editorial`](references/modules/photo-abstract-editorial.md) | treatment, audit | Photograph-preserving abstract editorial diptychs. |
| Production | [`frontend-slides`](references/modules/frontend-slides.md) | new, convert, enhance, report | Responsive HTML reports, fixed-stage presentations, and rendered QA. |
| Production | [`remotion-production`](references/modules/remotion-production.md) | video, data, 3d, ui-showcase, motion, av | Deterministic programmatic video and render delivery. |
| Publishing | [`readme-craft`](references/modules/readme-craft.md) | build, rewrite, audit | GitHub README architecture, visuals, links, and QA. |
| Publishing | [`steam-mod-page`](references/modules/steam-mod-page.md) | player, developer, audit | Steam Workshop BBCode pages and bilingual delivery. |
| Publishing | [`localization`](references/modules/localization.md) | translate, audit | Game CSV localization with locale completeness and markup safety. |
| Career | [`resume-evidence-workflow`](references/modules/resume-evidence-workflow.md) | evidence, tailor, review | Career evidence, requirement alignment, and editable resume delivery. |
| Operations | [`tool-integration`](references/modules/tool-integration.md) | install, configure, troubleshoot, remove | Connect AzSkills to AI clients with verified installation and setup workflows. |
| Operations | [`taste`](references/modules/taste.md) | main, subagent, independent | Judgment, collaboration, and execution behavior automatically supplied by Codex hooks. |
| Architecture | [`az-clean-code`](references/modules/az-clean-code.md) | write, review, refactor | Explicit code, flat control flow, reuse, and business data externalized before coding. |
| Architecture | [`godot-3-dev`](references/modules/godot-3-dev.md) | script, review, port | Godot 3.x GDScript, virtual-call safety, the 3.6 API surface, and down-porting. |
| Interface | [`style-presets`](references/modules/style-presets.md) | catalog, apply, loaders, audit | Named visual presets, keyword triggers, preset token packs, and loading indicators. |
| Visual | [`scientific-figures`](references/modules/scientific-figures.md) | redraw, author, verify | Medical and scientific schematics, faithful redraws, editable SVG, and deterministic figure verification. |
<!-- SKILL-CATALOG:END -->

## Legacy names

<!-- SKILL-ALIASES:START -->
| Alias | Module | Mode |
| :--- | :--- | :--- |
| `application-architecture` | [`architecture`](references/modules/architecture.md) | runtime |
| `frontend-architecture` | [`architecture`](references/modules/architecture.md) | frontend |
| `ui-aesthetics` | [`ui-design`](references/modules/ui-design.md) | refine |
| `ui-ux-design-intelligence` | [`ui-design`](references/modules/ui-design.md) | review |
| `ui-motion-review` | [`ui-motion`](references/modules/ui-motion.md) | review |
| `ui-motion-audit` | [`ui-motion`](references/modules/ui-motion.md) | audit |
| `rare-ui-motion` | [`ui-motion`](references/modules/ui-motion.md) | pattern |
| `svg-animation` | [`ui-motion`](references/modules/ui-motion.md) | svg |
| `ip-as-logo` | [`logo-generator`](references/modules/logo-generator.md) | character |
| `l13n` | [`localization`](references/modules/localization.md) | translate |
| `biorender` | [`style-presets`](references/modules/style-presets.md) | apply |
| `biorender-style` | [`style-presets`](references/modules/style-presets.md) | apply |
| `cobalt-kit` | [`style-presets`](references/modules/style-presets.md) | apply |
| `css-loaders` | [`style-presets`](references/modules/style-presets.md) | loaders |
| `style-catalog` | [`style-presets`](references/modules/style-presets.md) | catalog |
| `sciprism-svg` | [`scientific-figures`](references/modules/scientific-figures.md) | redraw |
| `sci-figure` | [`scientific-figures`](references/modules/scientific-figures.md) | author |
<!-- SKILL-ALIASES:END -->

## MCP

Register `node scripts/azskills-mcp.ts` as a stdio server named `azskills`. Call `azskills` with `action: catalog` to list plugins, `entry` for one plugin entry, `plugin` plus `id` for plugin details, `route` for the routing table, `module` plus `id` (optionally `mode`) for one contract, or `file` plus a path for supporting content. Paths are matched against packaged files; arbitrary filesystem access is unavailable. Resources are `azskills://catalog` and `azskills://plugins/<id>[/<path>]`.

## Contributing and verification

See [module system](SKILL-SYSTEM.md), [design contract](DESIGN.md), [design intelligence](design-intelligence.md), [catalog migration](docs/plugin-catalog-migration.md), and [third-party notices](THIRD_PARTY_NOTICES.md). License: [MIT](LICENSE).

After `npm ci`, `npm run check` runs the type check, validators, and tests. The individual commands are:

```sh
node scripts/generate-routing.ts --check
node scripts/validate-skills.ts
node scripts/validate-catalog.ts
node scripts/validate-integrations.ts
node scripts/test-link-bundle.ts
node scripts/test-package-plugin.ts
node scripts/test-think-tags-hook.ts
node scripts/test-empty-reply-hook.ts
node scripts/test-install-skills.ts
node scripts/test-azskills-mcp.ts
node design-system/tui/preview.ts --check
```

The terminal preview is a contributor view of the contract catalog; it is not the client plugin panel.

Report bugs or propose plugin improvements through the repository issue templates. Keep each plugin self-contained, version changed contracts, and verify portable links and migration behavior before submitting changes.

## Support

Support maintenance of the plugins, references, and tooling.

[Support AzSkills](https://cyojkoy.github.io/Payment/)

<a href="https://cyojkoy.github.io/Payment/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/support-cta-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/readme/support-cta.svg">
    <img src="assets/readme/support-cta.svg" alt="Support AzSkills" width="640">
  </picture>
</a>
