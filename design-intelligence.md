# AzSkills Design Intelligence Layer

This is a cross-cutting reference layer, not a standalone Skill. Visual and UI Skills inherit these rules unless explicit user requirements or a more specific Skill rule takes precedence.

The layer is an AzSkills synthesis informed by public frontend design methodologies, including Anthropic's `frontend-design`, NextLevelBuilder's UI/UX Pro Max, `better-web-ui`, the framework-agnostic `frontend-designer-skill`, and the public UI Skills catalog. It intentionally keeps the architecture modular rather than importing an external skill wholesale.

## Automatic application

Apply this layer whenever a task changes how an artifact looks, feels, moves, or is interacted with. This includes interfaces, dashboards, web apps, settings, forms, component libraries, icons, logos, SVG identity assets, README visuals, HTML presentations, banners, and other visual deliverables.

For executable UI work, automatically inherit [`ui-design/SKILL.md`](ui-design/SKILL.md). The shared layer supplies cross-artifact reasoning; `ui-design` supplies the executable frontend workflow and audit contract.

Do not apply it mechanically to pure backend logic, database work, infrastructure, or non-visual scripts.

## Priority order

1. Explicit user requirements.
2. Active Skill hard constraints.
3. Existing product identity and design system.
4. Product / platform conventions and accessibility requirements.
5. `ui-design/SKILL.md` for UI work.
6. This shared layer.
7. Optional stylistic references.

When rules conflict, preserve the more specific requirement and document a material tradeoff.

## 1. Context before aesthetics

Before substantial visual work, establish:

```text
Product / purpose:
Primary user:
Primary task:
Usage context:
Content density:
Existing identity:
Supported locales:
Primary input methods:
Technical stack:
Performance constraints:
Accessibility baseline:
```

Do not let a fashionable visual pattern replace product understanding.

## 2. One visual thesis

Choose a coherent direction using product context rather than assembling isolated trends.

Useful axes:

- minimal ↔ expressive
- editorial ↔ technical
- calm ↔ energetic
- formal ↔ playful
- organic ↔ geometric
- flat ↔ dimensional
- dense ↔ spacious

Use one primary direction and spend most visual boldness on one or two signature ideas.

Reject generic convergence such as arbitrary purple-gradient SaaS layouts, interchangeable card grids, unmotivated glassmorphism, excessive pills, emoji iconography, and decoration without a communication job.

## 3. System before detail

Use:

```text
Primitive → Semantic → Component → State
```

Build reusable tokens for color, typography, spacing, geometry, borders, elevation, and motion before scattering raw values.

For larger products, maintain one master source of truth with explicit page-level overrides. Never create parallel token systems for individual routes without a real boundary.

## 4. Composition before components

Start with task hierarchy, reading order, alignment, grouping, density, and focal points.

Cards, pills, badges, and dividers are component primitives. They are not a page architecture by themselves.

Useful composition patterns include hero + focal visual, asymmetric editorial split, evidence + annotation, timeline spine, comparison matrix, system diagram, full-bleed visual + typographic anchor, and content-first operational panels.

## 5. Typography is structural

Typography defines hierarchy, density, and readability. Establish roles for display, heading, body, label, metadata, numeric data, and controls.

Verify font availability, fallback behavior, glyph coverage, line-height, wrapping, line length, and multilingual expansion.

Do not shrink type to conceal an overloaded information architecture.

## 6. Color is semantic

Give color explicit roles for canvas, surfaces, text, muted content, accent, focus, selection, and status.

Where the target browser baseline allows it, perceptually grounded color spaces such as OKLCH are useful for constructing consistent lightness/chroma relationships. The implementation should still expose semantic tokens rather than making components depend on raw coordinates.

Light and dark themes must be validated as separate contrast contexts.

Never use color alone for critical state or meaning.

## 7. Modern CSS, used deliberately

When compatible with the project baseline, prefer native CSS capabilities that improve maintainability or component responsiveness:

- custom properties
- cascade layers
- native nesting
- `:has()` for meaningful parent-aware states
- container queries for component-driven responsiveness
- subgrid for shared alignment
- `aspect-ratio` for media geometry
- `clamp()` for fluid sizing
- logical properties for direction-aware layouts

Modern CSS is a means, not a design goal. Preserve the project's compatibility and architecture instead of introducing technology for its own sake.

## 8. Responsive behavior is behavioral

For each component decide whether it stays anchored, compresses, wraps, reflows, collapses, scrolls, moves to secondary navigation, progressively discloses, or disappears only when genuinely non-essential.

Prefer content-driven or container-aware thresholds when the component's own width is the relevant constraint.

Check narrow, intermediate, and wide layouts rather than only desktop/mobile endpoints.

## 9. Interaction is part of visual quality

Model:

```text
rest → hover → focus-visible → active → selected → disabled
```

When applicable:

```text
loading → success / error
empty → populated
collapsed → expanded
open → closing
offline → reconnecting
```

Provide static feedback in addition to motion. Never make hover the only way to discover an action.

## 10. Accessibility baseline

Prefer native semantics before ARIA. Every pointer interaction needs a keyboard path.

Preserve visible focus, descriptive names for icon-only controls, usable target sizes, predictable focus restoration, and non-color cues for important state.

Treat reduced motion, zoom, text scaling, and high-contrast needs as design variants rather than post-hoc patches.

The executable baseline is defined precisely in [`ui-design/SKILL.md`](ui-design/SKILL.md).

## 11. Motion as a system

Motion should serve hierarchy, action confirmation, attention guidance, continuity, or intentional craft.

Prefer reusable primitives such as fade+rise, scale+fade, slide, and stable shared-element continuity. Prefer `transform` and `opacity` for animation.

Use short durations for frequent interactions and longer choreography only for infrequent entrances or onboarding. Keep motion interruptible and respect `prefers-reduced-motion`.

## 12. Performance is part of design

Do not treat visual quality and runtime performance as separate concerns.

Avoid unnecessary layout animation, large-area blur, continuous decorative loops, uncontrolled parallax, repeated synchronous measurement, and gratuitous `will-change`.

Reserve media geometry, control layout shift, and keep high-density surfaces responsive on mid-range devices.

## 13. Internationalization is layout

Use stable message keys. Test localized strings in controls, labels, placeholders, tooltips, toasts, validation errors, and dynamic states.

Account for text expansion, number/date formatting, and RTL where relevant. Prefer logical CSS properties when direction matters.

Do not translate user data, IDs, filenames, or identifiers as though they were UI strings.

## 14. Content clarity

Visual polish cannot compensate for ambiguous copy.

Action labels should describe outcomes. Important errors should communicate:

```text
problem → impact → recovery action
```

Use concise helper text only when it resolves a real ambiguity; do not use tiny type to save layout space.

## 15. Hardening mindset

A production interface must survive more than the happy path.

Check long strings, empty datasets, large datasets, slow requests, failed submissions, duplicate actions, partial data, permission boundaries, offline states, narrow widths, dark mode, large text, and reduced motion.

## 16. Visual QA

Whenever rendered output is available, inspect the actual result rather than trusting source code alone.

Look for:

- hierarchy drift
- inconsistent spacing or radii
- token drift
- weak focus visibility
- awkward wrapping
- clipping / overflow
- bad dark-mode contrast
- excessive decoration
- icon misalignment
- motion that feels slow or theatrical

Fix systemic issues before isolated polish.

## 17. Inheritance model

Visual and UI Skills should not require users to name an external methodology. Apply this layer silently whenever the active Skill is visual.

Specific Skills remain authoritative about their own domain:

- `ui-design` owns frontend UI architecture, interaction, responsiveness, accessibility, motion, and QA.
- `logo-generator` owns logo construction and identity-specific constraints.
- `ip-as-logo` owns extreme character/IP simplification.
- `frontend-slides` owns fixed-stage presentation implementation.
- `readme-craft` owns GitHub-safe documentation composition.
- `brotato-art` owns its game-art visual language.

This layer provides shared reasoning around hierarchy, visual thesis, semantic tokens, typography, color, responsiveness, accessibility, motion, density, internationalization, performance, anti-pattern filtering, and quality control.

## Provenance

This layer is an original AzSkills synthesis informed by public material from:

- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/aladicf/better-web-ui
- https://github.com/kozz36/frontend-designer-skill
- https://www.ui-skills.com/skills/frontend

AzSkills does not vendor these repositories, generated databases, private/internal material, or repository-specific implementation. Detailed attribution is maintained in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
