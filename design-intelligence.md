# AzSkills Design Intelligence Layer

This is a cross-cutting reference layer, not a standalone Skill. Visual and UI Skills in AzSkills inherit these rules unless explicit user requirements or a more specific Skill rule takes precedence.

The layer is an AzSkills synthesis informed by public design-engineering methodologies, including the public UI Skills catalog at https://www.ui-skills.com/ and the previously integrated `nextlevelbuilder/ui-ux-pro-max-skill`. It is deliberately adapted to AzSkills' smaller, modular skill architecture.

## Automatic application

Apply this layer automatically whenever a task changes how an artifact looks, feels, moves, or is interacted with. This includes interfaces, dashboards, web apps, settings, forms, component libraries, icons, logos, SVG identity assets, README visuals, HTML presentations, banners, and other visual deliverables.

For UI implementation or review, automatically inherit [`ui-design/SKILL.md`](ui-design/SKILL.md). The shared layer provides the cross-artifact design reasoning; `ui-design` provides the executable UI design and audit rules.

Do not apply it mechanically to pure backend logic, database work, infrastructure, or non-visual scripts.

## Priority order

1. Explicit user requirements.
2. The active Skill's hard constraints.
3. Product/domain and platform conventions.
4. `ui-design/SKILL.md` for UI work.
5. This shared design-intelligence layer.
6. Examples and optional stylistic references.

When two rules conflict, preserve the more specific requirement and document the tradeoff when it materially affects the result.

## 1. Establish a visual thesis before implementation

Before producing substantial visual output, define a compact thesis:

```text
Purpose:
Audience / primary user:
Primary task or message:
Visual personality:
Interaction personality:
Dominant composition:
Typography roles:
Semantic color roles:
Spacing / geometry rhythm:
Motion language:
Accessibility baseline:
```

The thesis should explain why the chosen system belongs to the product. Do not select fashionable effects merely because they are available.

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

Use a three-level mental model:

```text
Primitive → Semantic → Component → State
```

Define reusable roles for color, typography, spacing, radius, stroke, elevation, and motion before scattering raw values.

A token should solve a recurring design need. Avoid one-off token sprawl.

## 4. Composition before components

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

## 5. Typography is structural

Treat typography as hierarchy, not decoration. Define explicit roles for:

- Display / primary statement
- Heading / section
- Body / explanation
- Utility / metadata
- Numeric / data
- Control / label

Protect readability through line length, line height, wrapping, contrast, optical alignment, and multilingual expansion.

Do not solve density problems by shrinking typography until the artifact becomes difficult to read.

## 6. Color is semantic

Give each core color a purpose: background, surface, text, muted text, accent, status, focus, and selected-state roles.

Always verify light and dark contexts independently. Theme changes should be driven by semantic tokens rather than arbitrary raw color swaps.

Never make color the sole carrier of critical meaning. Pair it with text, iconography, shape, position, or another redundant cue.

## 7. Surfaces, structure, and depth

Use borders for structure or state; use shadows for elevation.

Nested surfaces should use concentric optical geometry: outer radius, padding, and inner radius should read as a coherent construction rather than repeated arbitrary rounding.

Do not stack border, shadow, blur, glow, glass, and gradients merely to signal "modernity." Depth should clarify hierarchy.

## 8. Interaction and accessibility are part of visual quality

For UI-like outputs:

- Preserve visible keyboard focus.
- Prefer native semantics before custom ARIA.
- Give every pointer action a keyboard path.
- Provide accessible names for icon-only controls.
- Use real labels for form controls.
- Give users static state feedback in addition to motion.
- Do not rely on hover alone.
- Keep touch targets practical; larger targets are preferable where density allows.
- Respect reduced-motion preferences.
- Preserve predictable navigation, back behavior, and focus restoration.
- Avoid accidental horizontal overflow.

The current AzSkills UI baseline is defined more precisely in [`ui-design/SKILL.md`](ui-design/SKILL.md).

## 9. Motion communicates meaning

Use animation for one or more of:

1. hierarchy
2. action confirmation
3. attention guidance
4. continuity
5. craft / polish

If an animation serves none of these jobs, remove it.

Use one coherent motion language rather than a collection of unrelated effects. Prefer reusable primitives such as fade+rise, scale+fade, slide, and measured shared-element transitions.

Prefer transform and opacity. Avoid animating layout-heavy properties when a compositor-friendly alternative exists.

## 10. Motion timing and choreography

Use ranges rather than one universal duration:

- micro interaction: roughly 120–200ms
- UI state change: roughly 180–260ms
- small overlay / toast: roughly 220–320ms
- section entrance: roughly 400–800ms
- hero / onboarding sequence: roughly 800–1600ms

Use a small, reusable set of easing curves. Entering motion should generally ease out; exits should be faster and context-preserving. Avoid elastic or bouncy defaults unless the product is intentionally playful.

For infrequent staged entrances, establish reading order: primary element first, supporting content second, primary action last. Typical stagger should remain small, roughly 40–90ms, and should be skipped for high-frequency interactions.

Interactive motion should be interruptible. Never make the UI fight the user's next action.

## 11. Micro-interactions and state design

Model component states explicitly:

```text
rest → hover → focus → active/pressed → selected → disabled
```

Where applicable also model:

```text
loading → success / error
empty → populated
collapsed → expanded
open → closing
```

Use motion as a reinforcing cue, not as the state itself. For tactile press feedback, a restrained scale around `0.96` is preferred; do not exaggerate it.

Do not add custom animation to every hover, keystroke, or repeated list interaction. High-frequency motion carries attention cost.

## 12. Responsive behavior and density

Responsive design is behavioral. For each breakpoint decide what stays anchored, compresses, wraps, collapses, scrolls, moves to secondary navigation, or becomes progressively disclosed.

Classify the artifact as experiential or operational before tuning density.

Do not cure overcrowding by shrinking type and spacing until the result is technically complete but practically unreadable.

## 13. Internationalization as design

Localization is a layout and interaction concern.

Use stable message keys for application UI rather than using source-language sentences as the internal model.

Test every supported locale on every route, including:

- dynamically rendered content
- placeholders
- titles and tooltips
- aria-labels
- toasts and status messages
- empty/error states
- longer translated strings
- number/date formatting where relevant
- RTL behavior where relevant

Never translate user data, filenames, identifiers, or cultural names as though they were UI strings.

## 14. Icons and visual language

Use one coherent icon vocabulary per surface.

Prefer semantic SVG icons using `currentColor`. Use outline as the default and filled variants only when they intentionally signal an active state.

Match icon stroke weight to nearby typography and optically align asymmetric symbols.

Do not use emoji as a substitute for deliberate interface iconography unless explicitly requested.

## 15. Performance is visual quality

Prefer compositor-friendly properties:

- `transform`
- `opacity`

Avoid repeated animation of:

- `width`
- `height`
- `top`
- `left`
- large-area filters or blur

Do not measure layout every frame. Use `will-change` only for a demonstrated rendering problem and only on properties that benefit from compositing.

Keep simultaneous motion and expensive effects low enough for mid-range hardware and mobile devices.

## 16. Anti-pattern library

Avoid these defaults unless the product specifically calls for them:

- Generic purple-gradient SaaS appearance.
- Random glassmorphism, glow, bevel, chrome, or 3D decoration.
- Overuse of cards and rounded containers.
- Repeating identical dashboard cards as the primary composition.
- Emoji used as substitute iconography.
- Inconsistent corner radii, shadows, strokes, or spacing.
- Tiny helper text used to cram in more content.
- Gray-on-gray low-contrast text.
- Hover-only interaction.
- One animation duration for every state.
- Animation on every element.
- Decorative complexity that competes with the primary action or message.
- Template-like layouts that could belong to any product.

## 17. Quality gate by artifact type

### UI / interaction

Check accessibility, responsive behavior, interaction feedback, focus states, target sizes, dynamic states, i18n, content density, motion consistency, and state recovery.

### README / documentation

Check first-screen clarity, proof placement, GitHub-safe SVG behavior, readable hierarchy, theme safety, and narrow-width resilience.

### HTML presentation

Check fixed-stage geometry where required, hierarchy, spacing rhythm, motion, contrast, overflow, overlap, reduced motion, and rendered screenshots.

### Logo / identity

Check recognition, silhouette, construction logic, monochrome behavior, colorway discipline, theme variants, and small-size performance.

## 18. Review workflow

When auditing an existing UI:

1. Walk the primary flow with a pointer.
2. Repeat it keyboard-only.
3. Inspect rest, hover, focus, active, loading, empty, and error states.
4. Review motion at roughly 10% speed in browser tooling when animation is involved.
5. Compare light and dark themes.
6. Test narrow widths and large text / zoom.
7. Look for token drift across repeated components.
8. Remove unnecessary decoration before adding new effects.
9. Separate systemic problems from isolated polish issues.
10. Fix systemic rules first.

The goal is not maximum visual novelty. The goal is a coherent, legible, responsive, accessible system whose details reinforce the product.

## 19. Inheritance model

Visual and UI Skills should not require the user to explicitly name an external methodology. Apply this layer silently whenever the active Skill falls into its scope.

Specific Skills remain authoritative about their own domain. For example:

- `ui-design` decides UI component, interaction, motion, accessibility, and responsive rules.
- `logo-generator` decides logo construction and brand-mark rules.
- `ip-as-logo` decides extreme character simplification.
- `frontend-slides` decides fixed-stage presentation implementation.
- `readme-craft` decides GitHub-safe README composition.
- `brotato-art` decides its game-art-specific visual language.

This layer supplies the shared reasoning: hierarchy, style selection, semantic tokens, typography, color, spacing, accessibility, motion, density, internationalization, performance, anti-pattern filtering, and quality control.

## Provenance

This file is an AzSkills synthesis informed by public material from:

- https://www.ui-skills.com/skills
- https://www.ui-skills.com/skills/visual
- https://www.ui-skills.com/skills/interaction
- https://www.ui-skills.com/skills/motion
- https://www.ui-skills.com/skills/accessibility
- https://www.ui-skills.com/skills/craft
- https://www.ui-skills.com/skills/taste
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

AzSkills does not vendor UI Skills, its repositories, private/internal material, generated databases, or generated assets. The purpose of this layer is to preserve transferable design reasoning in a smaller, maintainable form.
