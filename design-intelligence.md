# AzSkills Design Intelligence Layer

This is a cross-cutting reference layer, not a standalone Skill. Visual skills in AzSkills inherit these rules unless explicit user requirements or a more specific skill rule takes precedence.

The layer is an AzSkills synthesis informed by the public methodology of `nextlevelbuilder/ui-ux-pro-max-skill`. It is deliberately adapted to AzSkills' smaller, modular skill architecture.

## Automatic application

Apply this layer automatically whenever a task changes how an artifact looks, feels, moves, or is interacted with. This includes logos, SVG identity assets, README visuals, HTML presentations, banners, interfaces, icons, dashboards, and other visual deliverables.

Do not apply it mechanically to pure backend logic, database work, infrastructure, or non-visual scripts.

## Priority order

Use this decision order when visual quality is involved:

1. Explicit user requirements.
2. The active Skill's hard constraints.
3. This design-intelligence layer.
4. Examples and optional stylistic references.

When two rules conflict, preserve the more specific requirement and document the tradeoff when it materially affects the result.

## 1. Establish a visual thesis before implementation

Before producing substantial visual output, define a compact visual thesis:

```text
Purpose:
Audience:
Primary message:
Visual personality:
Dominant composition:
Typography roles:
Core palette:
Spacing / geometry rhythm:
Signature motif:
Motion language:
```

The thesis should explain why the chosen visual system belongs to the product. Do not select fashionable effects merely because they are available.

## 2. Match style to the product

Choose style from product context, audience, usage surface, and interaction needs. Treat style as a system rather than an isolated effect.

Useful axes include:

- Minimal ↔ expressive
- Editorial ↔ technical
- Formal ↔ playful
- Organic ↔ geometric
- Calm ↔ energetic
- Flat ↔ dimensional
- Dense ↔ spacious

Do not mix incompatible style vocabularies without a clear compositional reason.

## 3. Build a coherent token system

For interfaces and complex visual artifacts, use a three-level mental model:

```text
Primitive → Semantic → Component / Usage
```

Define color, typography, spacing, radius, stroke, elevation, and motion roles before scattering raw values.

For static graphic assets, the same principle applies conceptually: define a compact palette, geometry grammar, stroke language, and spacing rhythm and reuse them consistently.

## 4. Typography is structural

Treat typography as a hierarchy, not decoration. Define explicit roles for:

- Display / primary statement
- Heading / section
- Body / explanation
- Utility / metadata
- Numeric / data

Prefer deliberate font pairing and avoid defaulting to generic system typography when the artifact is brand-forward or editorial. For GitHub-safe SVG, use reliable embedded/system font stacks and never make remote fonts a requirement.

Protect readability through line length, line height, wrapping, contrast, and optical alignment.

## 5. Color is semantic

Give each core color a purpose instead of distributing colors evenly. Typical roles are background, surface, primary text, muted text, primary accent, secondary accent, and status colors.

Prefer restrained palettes. Gradients, glows, glass effects, shadows, or strong dimensional effects belong to a specific visual thesis, not to a generic "modern" preset.

Always consider contrast, including dark/light contexts and state changes. Never make color the sole carrier of critical meaning.

## 6. Composition before components

Establish hierarchy and spatial relationships before filling the canvas with components.

Prefer purposeful composition patterns such as:

- Hero + focal visual
- Asymmetric editorial split
- Evidence + annotation
- Timeline / process spine
- Comparison matrix
- System diagram
- Full-bleed visual + typographic anchor
- Quiet title-only composition

Cards, pills, badges, and repeated grids are components, not a default layout strategy. Use them only when they clarify grouping or interaction.

## 7. Interaction and accessibility are part of visual quality

For UI-like outputs:

- Preserve visible keyboard focus.
- Keep interactive targets comfortably large; 44×44px is the default touch target floor when the platform permits.
- Leave adequate spacing between adjacent targets.
- Provide labels for icon-only controls.
- Give users state feedback for actions and loading.
- Do not rely on hover alone.
- Respect reduced-motion preferences.
- Preserve predictable navigation and back behavior.
- Avoid horizontal overflow when the target platform expects responsive content.

Adapt these principles to the platform rather than blindly forcing web rules onto non-web artifacts.

## 8. Motion communicates meaning

Use animation when it improves hierarchy, continuity, feedback, or storytelling.

Prefer a consistent motion language with sensible enter/exit relationships. Avoid giving every element a separate animation.

Use transform and opacity when possible. Avoid animating layout-heavy properties unnecessarily. Always provide a reduced-motion path for interfaces and HTML presentations.

## 9. Information density is a design decision

Decide whether the artifact is:

- Speaker-led / experiential — low density, large focal elements, generous whitespace.
- Reading-first / operational — higher density, stronger structure, tighter but still comfortable rhythm.

Do not solve overcrowding by shrinking typography or spacing until the artifact becomes technically complete but practically unreadable.

## 10. Use real content and real evidence

Design around the actual product, content, screenshots, data, logo, or repository material whenever available.

Do not fabricate visual proof merely to make a design appear richer. Decorative material needs a communication job.

## 11. Visual hierarchy and affordance audit

Before delivery, check:

- What is noticed first?
- Is the primary action obvious?
- Is there a clear focal point?
- Are related elements grouped by spacing and alignment?
- Is there enough negative space?
- Are repeated patterns genuinely useful?
- Are interaction states understandable?
- Does the visual system remain coherent across all variants/pages/slides?

## 12. Anti-pattern library

Avoid these defaults unless the product specifically calls for them:

- Generic purple-gradient SaaS appearance.
- Random glassmorphism, glow, bevel, chrome, or 3D decoration.
- Overuse of cards and rounded containers.
- Emoji used as a substitute for deliberate iconography.
- Inconsistent corner radii, shadows, strokes, or spacing.
- Too many fonts or unrelated visual styles.
- Tiny unreadable helper text.
- Gray-on-gray low-contrast text.
- Hover-only interaction.
- One animation duration for every state.
- Decorative complexity that competes with the main message.
- Template-like layouts that could belong to any product.

## 13. Quality gate by artifact type

### Logo / identity

Check recognition, silhouette, construction logic, monochrome behavior, colorway discipline, and small-size performance.

### README / documentation

Check first-screen clarity, proof placement, GitHub-safe SVG behavior, readable hierarchy, and narrow-width resilience.

### HTML presentation

Check fixed-stage geometry where required, hierarchy, spacing rhythm, motion, contrast, overflow, overlap, and rendered screenshots.

### UI / interaction

Check accessibility, responsive behavior, interaction feedback, focus states, touch targets, content density, and state consistency.

## 14. Inheritance model

Visual Skills should not require the user to say "use UI/UX Pro Max". Apply this layer silently whenever the active Skill falls into its scope.

Specific Skills remain authoritative about their own domain. For example:

- `logo-generator` decides logo construction and brand-mark rules.
- `ip-as-logo` decides extreme character simplification.
- `frontend-slides` decides fixed-stage presentation implementation.
- `readme-craft` decides GitHub-safe README composition.

This layer supplies shared visual intelligence: hierarchy, style selection, tokens, typography, color semantics, spacing, accessibility, motion, density, anti-patterns, and quality control.

## Provenance

Adapted from the public methodology of:

- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

AzSkills does not vendor the upstream plugin, database, generated example assets, or repository-specific scripts. The purpose of this file is to preserve the transferable design reasoning while keeping AzSkills modular and maintainable.
