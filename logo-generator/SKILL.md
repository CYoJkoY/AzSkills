---
name: logo-generator
description: >
  Design and iterate professional logos, product marks, app symbols, wordmark systems,
  mascot marks, minimalist black-and-white explorations, colorways, SVG assets, and
  brand-system boards. Use when the user asks for logo concepts, icon design, brand
  symbols, logo prompts, SVG logo generation, logo variants, black-and-white logo
  exploration, colorway exploration, or polished logo presentation boards.
---

# Logo Generator

Use this skill as AzSkills' general-purpose logo design and logo-production workflow.
It unifies conceptual logo design, minimalist exploration, geometric SVG construction,
mascot/IP routes, colorway exploration, brand-system boards, and presentation-ready
showcase output.

Before applying a visual direction, automatically inherit [`../design-intelligence.md`](../design-intelligence.md).
The design-intelligence layer is not optional for substantial visual work; it supplies
shared rules for hierarchy, style selection, typography, color semantics, spacing,
anti-pattern avoidance, and quality control. User requirements and this skill's
logo-specific constraints remain higher priority.

## Scope and mode selection

Identify the narrowest mode that satisfies the request:

| Mode | Use for |
| :--- | :--- |
| `concept` | New logo ideas, symbolic routes, design rationale |
| `exploration` | Rapid multi-direction exploration, especially black-and-white concept boards |
| `svg` | Editable vector marks, icons, simple logo assets |
| `mascot` | Character-led brand marks; defer to `ip-as-logo` for highly simplified IP characters |
| `colorway` | Palette exploration and light/dark/mono variants |
| `system-board` | Brand guideline boards, lockups, favicon, seal, applications |
| `showcase` | Premium presentation images and comparison pages |
| `revision` | Iterating an existing direction without restarting unnecessarily |

Do not load every mode for every request. Combine only the modes required by the task.

## Core workflow

### 1. Extract the brief

Collect or infer:

- Brand or product name.
- Category and audience.
- Core promise or concept.
- Personality: restrained, technical, playful, premium, editorial, human, etc.
- Primary usage surfaces: website, app icon, desktop tray, print, packaging, social avatar, favicon, merchandise.
- Existing visual references, if any.
- Hard constraints such as color, geometry, symbolism, typography, dimensions, or platform.

When the product itself already provides enough context, inspect the supplied repository/readme/product copy before asking background questions.

### 2. Deep concept analysis

Before broad exploration, analyze the brief across useful conceptual dimensions:

1. Functional attributes — what the product does.
2. Usage context — where and when it is experienced.
3. Emotional quality — the feeling it should create.
4. Cultural context — the cultural or category space it occupies.
5. Structural features — physical or conceptual structures associated with it.
6. Dynamic relationships — movement, transformation, interaction, or flow.
7. Symbolic metaphors — deeper associations that can become a visual device.
8. Brand personality — how the identity behaves as a character.
9. User perception — what should be understood at first glance.

Condense this into a `Visual Core` and, when useful, a `Key Tension` that drives exploration.

### 3. Build symbolic routes

Develop 2–4 genuinely different symbolic routes before polishing a single mark. Each route should connect a visual mechanism to a product idea rather than merely changing color or rotation.

Prefer:

- Abstracted product behavior.
- Meaningful negative space.
- Letterform integration when it improves memorability.
- Geometric systems with repeatable construction logic.
- Controlled organic forms when the brand requires personality.
- Visual puns where two meanings reinforce one another.
- One strong visual metaphor over several weak ones.

Avoid category clichés unless the brief explicitly requests them.

### 4. Exploration mode

Use `exploration` when the user wants many distinct ideas before selecting one direction, especially for minimalist or black-and-white Logo work.

The exploration board should be treated as a design archive, not as the final logo. It may include substantially different construction strategies such as:

- Negative-space marks.
- Letterform fusion.
- Geometric badges.
- Circular symbols.
- Modular grids.
- Linear marks.
- Bold black masses.
- Visual-pun structures.
- Abstract mascots.
- Product or action abstractions.
- Experimental typography.
- Wordmarks.

For a dedicated black-and-white exploration pass:

- Prefer pure black and white; minor grayscale is acceptable only when needed for hierarchy.
- Remove gradients, color effects, 3D rendering, glossy material, and decorative scenery.
- Ensure concepts are genuinely different in construction, not repeated versions with altered rotation or thickness.
- Use the grid only for exploration and comparison; never mistake it for the final brand asset.
- Favor conceptual reduction rather than literally drawing the subject as an icon.
- Explore both symbol-led and wordmark-led directions when the brief permits.

A 4×6 / 24-concept board can be used when the user explicitly asks for a large exploration batch. Smaller batches are preferable when the user asks for focused refinement.

### 5. Select a direction

For each promising route, state:

- Symbol mechanism.
- Why it is specific to the product.
- Silhouette and recognition behavior.
- Expected behavior at small sizes.
- Best usage surfaces.

Select the strongest route for execution, but preserve rejected routes as documented alternatives when the task calls for a design exploration package.

### 6. Generate the logo artifact

For SVG work:

- Use `viewBox="0 0 100 100"` unless a different canvas is required.
- Prefer clean primitives and reusable `<g>`/`<defs>` structures.
- Use `currentColor` when a single-color or theme-adaptive mark is appropriate.
- Keep geometry intentional; avoid path noise that does not improve recognition.
- Use a transparent canvas unless the user explicitly requests a background.
- Do not embed raster images inside the core SVG mark unless explicitly requested.
- Verify closed paths, fill/stroke behavior, aspect ratio, and small-size readability.

For rendered-image prompts, describe the visual result rather than leaking implementation jargon into the image prompt. State output constraints naturally.

### 7. Design-system expansion

When the user asks for a complete identity direction, expand the chosen mark into a restrained system:

1. Primary symbol.
2. Horizontal and/or stacked lockup.
3. Wordmark direction.
4. Favicon/app-icon behavior.
5. Monochrome positive/negative versions.
6. One or more practical colorways.
7. Optional seal/badge variant when appropriate.
8. A few realistic usage applications.

Do not invent applications that the brand would not plausibly need.

### 8. Colorway mode

Treat color as a system, not decoration. Generate purposeful variants such as:

- Primary brand palette.
- Dark-background version.
- Light-background version.
- One-color black/white.
- Optional restrained accent palette.

Maintain contrast and semantic consistency. Do not force gradients simply because a logo can contain them. Flat fills are preferred for marks that need maximum reproduction reliability.

### 9. System-board mode

For a brand-system board, use a square or near-square grid with clearly separated modules. A typical board can contain:

- Main mark.
- Favicon/app symbol.
- Wordmark lockup.
- Monochrome applications.
- Construction or meaning note.
- Small-size test.
- One or two material/print applications.
- Compact color specification.

Keep the board subordinate to the actual mark. The board demonstrates a coherent system; it is not the logo itself.

### 10. Showcase mode

Use showcase backgrounds only after the logo direction is stable. Choose presentation styles based on brand personality and usage context rather than offering a random background gallery.

Useful presentation families include:

- Minimal dark / high-contrast technical.
- Frosted / premium product.
- Editorial paper / cultural.
- Clean studio / corporate.
- UI-native / software product.
- Flat Swiss-style / institutional.

Do not allow showcase effects to alter the geometry or color relationships of the actual mark.

### 11. Revision mode

When revision notes are supplied, preserve the useful parts of the current direction and change only the requested dimensions.

Typical revision dimensions:

- Silhouette.
- Proportion.
- Negative space.
- Stroke weight.
- Corner radius.
- Symbol placement.
- Typography.
- Palette.
- Background.
- Complexity.

Do not restart ideation when a targeted adjustment is sufficient.

## Small-size quality gate

Every final logo direction must be checked conceptually at:

- 24 × 24.
- 32 × 32.
- 48 × 48.
- 96 × 96.
- Full presentation size.

At small sizes, prioritize silhouette, contrast, and one decisive recognition cue. Remove secondary detail before shrinking it until illegible.

## Anti-patterns

Avoid:

- Generic globe + circuit imagery for technology brands without a product-specific reason.
- Excessive gradients, glows, chrome, bevels, and 3D effects in the core mark.
- Overloaded symbolism where every letter receives an independent icon.
- Tiny typography inside marks intended for app icons or favicons.
- Presentation mockups that obscure the actual logo.
- Randomized variants that differ only by color or rotation.
- Reusing another brand's distinctive trademark silhouette.
- Treating an exploration contact sheet as if it were the production logo.

## Reference-driven design

When a reference image is provided, extract transferable properties:

- Layout hierarchy.
- Shape language.
- Stroke or contour behavior.
- Color restraint.
- Spacing.
- Typography mood.
- Presentation conventions.

Do not copy a reference logo, wordmark, trademark-specific silhouette, or distinctive proprietary asset. Translate the observed design logic into an original mark.

## Output contract

For a concept package, return:

- `Logo Direction`
- `Symbol Concept`
- `Visual Core`
- `Visual System Notes`
- `Small-size Behavior`
- `Recommended Production Route`

For exploration work, additionally return:

- Exploration strategy.
- Number and structure of concepts requested.
- Distinct construction families used.
- Selection guidance for narrowing to 2–3 directions.

For SVG work, additionally return:

- Clean SVG source.
- Canvas/viewBox information.
- Color behavior.
- Small-size notes.

For a system board, additionally return:

- Board module list.
- Lockup variants.
- Colorway list.
- Application guidance.

For showcase work, additionally return:

- Selected presentation families.
- Why each presentation fits.
- Export targets.

## Relationship to other AzSkills

Use `logo-generator` for general logo and identity work, including minimalist black-and-white exploration.

Use `ip-as-logo` when the defining requirement is an extremely simplified, cute, character-like IP mark with strict silhouette and color budgets.

Use `photo-abstract-editorial` for photo-preserving editorial abstractions. Do not treat that skill as a logo generator.

## Design Intelligence inheritance

This skill automatically inherits the shared AzSkills design-intelligence layer. Users do not need to explicitly request a UI/UX design system or name an external design methodology for these principles to apply.

For Logo work, the inherited layer contributes visual thesis formation, coherent typography and color roles, composition discipline, style-to-context matching, anti-pattern filtering, and final visual-quality review. Logo-specific construction, brand-mark recognition, and identity-system rules in this file remain authoritative.

## Provenance

This skill is an original AzSkills synthesis informed by public workflows and ideas observed in:

- https://github.com/op7418/logo-generator-skill
- https://github.com/SanbaoAI/logo-generator-skill
- https://github.com/fucha1122/minimalist-bw-logo-skill
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The unified skill removes duplicated workflows and implementation-specific assumptions while preserving useful conceptual methods. It does not copy the upstream repository's example asset library.
