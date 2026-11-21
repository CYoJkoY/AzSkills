# AzSkills routing

Choose the plugin by the requested job, then select the matching workflow contract inside it.

| Plugin | Workflow | Outcome / trigger | Modes |
| :--- | :--- | :--- | :--- |
| `engineering` | [architecture](modules/architecture.md) | Runtime, frontend stack, persistence, and process boundaries. | runtime, frontend, migration, review |
| `design` | [design-system](modules/design-system.md) | DESIGN.md ingestion, normalization, provenance, and verification. | ingest, author, migrate, audit |
| `design` | [ui-design](modules/ui-design.md) | Interface hierarchy, components, states, responsive behavior, visual QA, motion construction, review, audit, patterns, and SVG animation. | build, refine, review, system, motion, motion-review, motion-audit, motion-pattern, svg |
| `visual-assets` | [logo-generator](modules/logo-generator.md) | Logos, product marks, character marks, and identity systems. | mark, character, system |
| `visual-assets` | [photo-abstract-editorial](modules/photo-abstract-editorial.md) | Photograph-preserving abstract editorial diptychs. | treatment, audit |
| `visual-production` | [frontend-slides](modules/frontend-slides.md) | Responsive HTML reports, fixed-stage presentations, and rendered QA. | new, convert, enhance, report |
| `visual-production` | [remotion-production](modules/remotion-production.md) | Deterministic programmatic video and render delivery. | video, data, 3d, ui-showcase, motion, av |
| `writing` | [document-writing](modules/document-writing.md) | GitHub README architecture, visuals, links, QA, Steam Workshop BBCode pages, and bilingual delivery. | readme, readme-rewrite, readme-audit, steam-player, steam-developer, steam-audit |
| `writing` | [localization](modules/localization.md) | Game CSV localization with locale completeness and markup safety. | translate, audit |
| `resume-evidence-workflow` | [resume-evidence-workflow](modules/resume-evidence-workflow.md) | Career evidence, requirement alignment, and editable resume delivery. | evidence, tailor, review |
| `operations` | [tool-integration](modules/tool-integration.md) | Connect AzSkills to AI clients with verified installation and setup workflows. | install, configure, troubleshoot, remove |
| `operations` | [taste](modules/taste.md) | GPT with Taste judgment, collaboration, and execution behavior. | main, subagent, independent |
| `engineering` | [az-clean-code](modules/az-clean-code.md) | Explicit, flat, reusable code with business data externalized, code style consistency, and implementation quality guards. | write, review, refactor, style |
| `godot-3-dev` | [godot-3-dev](modules/godot-3-dev.md) | Godot 3.x GDScript, virtual-call safety, 3.6 API surface, and down-porting. | script, review, port |
| `design` | [style-presets](modules/style-presets.md) | Named visual presets, keyword triggers, preset token packs, and loading indicators. | catalog, apply, loaders, audit |
| `visual-assets` | [scientific-figures](modules/scientific-figures.md) | Medical and scientific schematics, faithful redraws, editable SVG, and deterministic figure verification. | redraw, author, verify |

## Legacy names

These names stay valid in prompts and issues. Resolve each one to the plugin that owns the canonical module.

| Name | Plugin | Workflow | Mode |
| :--- | :--- | :--- | :--- |
| application-architecture | `engineering` | [architecture](modules/architecture.md) | runtime |
| frontend-architecture | `engineering` | [architecture](modules/architecture.md) | frontend |
| ui-aesthetics | `design` | [ui-design](modules/ui-design.md) | refine |
| ui-ux-design-intelligence | `design` | [ui-design](modules/ui-design.md) | review |
| ui-motion-review | `design` | [ui-design](modules/ui-design.md) | motion-review |
| ui-motion-audit | `design` | [ui-design](modules/ui-design.md) | motion-audit |
| rare-ui-motion | `design` | [ui-design](modules/ui-design.md) | motion-pattern |
| svg-animation | `design` | [ui-design](modules/ui-design.md) | svg |
| ip-as-logo | `visual-assets` | [logo-generator](modules/logo-generator.md) | character |
| l13n | `writing` | [localization](modules/localization.md) | translate |
| biorender | `design` | [style-presets](modules/style-presets.md) | apply |
| biorender-style | `design` | [style-presets](modules/style-presets.md) | apply |
| cobalt-kit | `design` | [style-presets](modules/style-presets.md) | apply |
| css-loaders | `design` | [style-presets](modules/style-presets.md) | loaders |
| style-catalog | `design` | [style-presets](modules/style-presets.md) | catalog |
| sciprism-svg | `visual-assets` | [scientific-figures](modules/scientific-figures.md) | redraw |
| sci-figure | `visual-assets` | [scientific-figures](modules/scientific-figures.md) | author |
| readme-craft | `writing` | [document-writing](modules/document-writing.md) | readme |
| readme-rewrite | `writing` | [document-writing](modules/document-writing.md) | readme-rewrite |
| steam-mod-page | `writing` | [document-writing](modules/document-writing.md) | steam-player |
| ui-motion | `design` | [ui-design](modules/ui-design.md) | motion |
| ui-motion-build | `design` | [ui-design](modules/ui-design.md) | motion |
