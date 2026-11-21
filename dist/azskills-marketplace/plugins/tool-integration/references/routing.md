# AzSkills routing

Choose by the requested output. Each row is an independent plugin in the catalog, and the linked contract is the workflow that plugin ships.

| Plugin | Outcome / trigger | Modes |
| :--- | :--- | :--- |
| [architecture](modules/architecture.md) | Runtime, frontend stack, persistence, and process boundaries. | runtime, frontend, migration, review |
| [design-system](modules/design-system.md) | DESIGN.md ingestion, normalization, provenance, and verification. | ingest, author, migrate, audit |
| [ui-design](modules/ui-design.md) | Interface hierarchy, components, states, responsive behavior, visual QA, motion construction, review, audit, patterns, and SVG animation. | build, refine, review, system, motion, motion-review, motion-audit, motion-pattern, svg |
| [logo-generator](modules/logo-generator.md) | Logos, product marks, character marks, and identity systems. | mark, character, system |
| [photo-abstract-editorial](modules/photo-abstract-editorial.md) | Photograph-preserving abstract editorial diptychs. | treatment, audit |
| [frontend-slides](modules/frontend-slides.md) | Responsive HTML reports, fixed-stage presentations, and rendered QA. | new, convert, enhance, report |
| [remotion-production](modules/remotion-production.md) | Deterministic programmatic video and render delivery. | video, data, 3d, ui-showcase, motion, av |
| [document-writing](modules/document-writing.md) | GitHub README architecture, visuals, links, QA, Steam Workshop BBCode pages, and bilingual delivery. | readme, readme-rewrite, readme-audit, steam-player, steam-developer, steam-audit |
| [localization](modules/localization.md) | Game CSV localization with locale completeness and markup safety. | translate, audit |
| [resume-evidence-workflow](modules/resume-evidence-workflow.md) | Career evidence, requirement alignment, and editable resume delivery. | evidence, tailor, review |
| [tool-integration](modules/tool-integration.md) | Connect AzSkills to AI clients with verified installation and setup workflows. | install, configure, troubleshoot, remove |
| [taste](modules/taste.md) | GPT with Taste judgment, collaboration, and execution behavior. | main, subagent, independent |
| [az-clean-code](modules/az-clean-code.md) | Explicit, flat, reusable code with business data externalized, code style consistency, and implementation quality guards. | write, review, refactor, style |
| [godot-3-dev](modules/godot-3-dev.md) | Godot 3.x GDScript, virtual-call safety, 3.6 API surface, and down-porting. | script, review, port |
| [style-presets](modules/style-presets.md) | Named visual presets, keyword triggers, preset token packs, and loading indicators. | catalog, apply, loaders, audit |
| [scientific-figures](modules/scientific-figures.md) | Medical and scientific schematics, faithful redraws, editable SVG, and deterministic figure verification. | redraw, author, verify |

## Legacy names

These names stay valid in prompts and issues. Resolve each one to the plugin that owns the canonical module.

| Name | Plugin | Mode |
| :--- | :--- | :--- |
| application-architecture | [architecture](modules/architecture.md) | runtime |
| frontend-architecture | [architecture](modules/architecture.md) | frontend |
| ui-aesthetics | [ui-design](modules/ui-design.md) | refine |
| ui-ux-design-intelligence | [ui-design](modules/ui-design.md) | review |
| ui-motion-review | [ui-design](modules/ui-design.md) | motion-review |
| svg-animation | [ui-design](modules/ui-design.md) | svg |
| ip-as-logo | [logo-generator](modules/logo-generator.md) | character |
| l13n | [localization](modules/localization.md) | translate |
| biorender | [style-presets](modules/style-presets.md) | apply |
| biorender-style | [style-presets](modules/style-presets.md) | apply |
| cobalt-kit | [style-presets](modules/style-presets.md) | apply |
| css-loaders | [style-presets](modules/style-presets.md) | loaders |
| style-catalog | [style-presets](modules/style-presets.md) | catalog |
| sciprism-svg | [scientific-figures](modules/scientific-figures.md) | redraw |
| sci-figure | [scientific-figures](modules/scientific-figures.md) | author |
| readme-craft | [document-writing](modules/document-writing.md) | readme |
| readme-rewrite | [document-writing](modules/document-writing.md) | readme-rewrite |
| steam-mod-page | [document-writing](modules/document-writing.md) | steam-player |
| ui-motion | [ui-design](modules/ui-design.md) | motion |
| ui-motion-build | [ui-design](modules/ui-design.md) | motion |
