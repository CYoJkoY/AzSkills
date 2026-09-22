---
name: ui-aesthetics
description: Strengthen visual judgment for UI and visual product work with deliberate aesthetic direction, composition-first critique, component craftsmanship, disciplined states and motion, restrained depth, anti-AI-slop review, and rendered-output self-critique. Use for generating, reviewing, refactoring, polishing, or visually refining interfaces and other product-facing visual surfaces.
---

# UI Aesthetics

A focused aesthetic-judgment Skill for AzSkills. It complements [`ui-design`](../ui-design/SKILL.md) rather than replacing its implementation and accessibility rules.

The objective is not to make every interface look "premium". The objective is to make visual decisions intentional, coherent, legible, product-specific, and proportionate to the task.

## Automatic scope

Apply when a task asks to:

- make a UI look better, cleaner, more polished, refined, modern, distinctive, or less generic
- diagnose why an interface feels cheap, cluttered, flat, noisy, or AI-generated
- redesign or visually refactor an existing page, component, dashboard, settings panel, form, table, dialog, or shell
- refine typography, spacing, hierarchy, palette, surfaces, shadows, blur, glow, icon treatment, motion, or interaction states
- review a rendered screenshot, mockup, prototype, or other product-facing visual artifact

For pure backend, data, infrastructure, or non-visual work, do not apply it mechanically.

## Governing priority

1. Explicit user requirements.
2. Existing product identity and design system.
3. Task/domain/platform conventions.
4. Usability and accessibility requirements.
5. `ui-design/SKILL.md` implementation rules.
6. This aesthetic Skill.
7. Optional stylistic references.

Aesthetic preference never overrides a product requirement, established identity, accessibility need, or real technical constraint.

## DESIGN.md input contract

When DESIGN.md is part of the task, consume the normalized result from design-system rather than treating the raw document as an aesthetic checklist.

Use the source to understand visual intent, constraints, and component relationships. Judge the adaptation against product fit, hierarchy, accessibility, and consistency. Do not silently replace a verified source token with an aesthetic preference; material deviations should be explicit.

## Aesthetic thesis before styling

Before making substantial visual changes, establish four things:

```text
Purpose: what the surface helps the user accomplish
Tone: what the experience should feel like
Constraint: what must not be compromised
Signature: the one or two ideas worth remembering
```

Useful axes:

```text
minimal ↔ expressive
editorial ↔ technical
calm ↔ energetic
formal ↔ playful
organic ↔ geometric
flat ↔ dimensional
dense ↔ spacious
```

Choose one dominant direction. Do not mix unrelated trends just to signal creativity.

## Quality hierarchy

Judge visual quality in this order:

```text
scope
↓
composition
↓
hierarchy
↓
spacing / density
↓
typography / copy fit
↓
component precision
↓
interaction states
↓
color semantics
↓
depth / lighting
↓
motion / flourish
```

If the interface fails at the top of the stack, do not compensate with detail at the bottom.

A useful grayscale test is mandatory for broad visual review: if hierarchy, grouping, and reading order are weak without color or effects, the design is not finished.

## Anti-AI-slop rules

Reject the following unless the product context specifically justifies them:

- purple-gradient SaaS defaults
- interchangeable card grids used as the entire page architecture
- excessive rounded containers, pills, badges, and decorative dividers
- arbitrary glassmorphism, glow, blur, bevel, chrome, or 3D effects
- generic hero sections added to component-level requests
- invented marketing copy, metrics, badges, or CTAs that inflate the requested scope
- asymmetry or oversized contrast used only to appear distinctive
- motion on every row, hover, or state change; route systemic motion defects to `ui-motion-review` instead of masking them with decorative polish
- selected states that look identical to pressed feedback
- typography choices made from coding convention rather than product and language context
- decorative elements with no communication, grouping, orientation, or identity role

Distinctive design does not require visual noise. Restrained precision is a valid aesthetic direction.

## Six task routes

### 1. Generation

Use when creating a new visual surface.

1. Lock artifact scope before styling.
2. Define the aesthetic thesis.
3. Establish the main composition and focal point.
4. Define a compact token vocabulary.
5. Build hierarchy and spacing before decoration.
6. Refine components as a coherent family.
7. Add semantic color.
8. Add depth only where layering needs explanation.
9. Add motion only where it improves orientation, continuity, feedback, or deliberate craft.
10. Validate the rendered result.

### 2. Review

Use when diagnosing an existing interface.

For each finding classify the dominant failure:

```text
hierarchy | composition | density | typography | component | state | color | depth | motion | content
```

Then explain:

```text
observation → user impact → direct correction
```

Start with the highest-impact structural failure. Do not spend the review on CSS trivia while a primary action, focal point, or information hierarchy is unclear.

### 3. Refactor

Choose a rewrite depth before editing:

```text
light polish       → preserve structure; tighten visual metrics
medium restructure → change grouping and hierarchy; preserve behavior
full rebuild       → replace the visual system while preserving required product behavior
```

Strip weak decoration before rebuilding. Reintroduce only what survives the hierarchy test.

### 4. Component polish

Use when the structure already works but controls feel generic.

Check related components as one system:

```text
height
padding
radius
border
icon size
label alignment
typographic roles
focus treatment
selected / pressed behavior
```

Prefer shared tokens and primitives over one-off cosmetic patches.

### 5. State / motion refinement

Treat these as a visible state system:

```text
rest → hover → focus-visible → active → selected → disabled
```

When applicable also model:

```text
loading → success / error
empty → populated
closed → open → closing
offline → reconnecting
```

Motion should explain a state change, preserve continuity, guide attention, or confirm an action. It should not become choreography.

Run the shared motion decision gate before judging timing or effects: purpose first, frequency second, mechanism third. A high-frequency interaction may be better with no animation.

When motion itself is the primary defect, keep this Skill focused on visual impact and hand off implementation-level findings to `ui-motion-review`. For repository-wide discovery, use `ui-motion-audit`.

Keep frequent transitions brief, interruptible, and consistent. Respect `prefers-reduced-motion`; static feedback must remain sufficient without animation.

### 6. Depth / lighting refinement

Give each effect one job:

```text
fill      → grouping / emphasis
border    → structure / state
shadow    → elevation
blur      → contextual depth
highlight → material emphasis
glow      → exceptional focus
```

Do not stack every effect on every surface. In dark interfaces, establish separation through surface levels and edge definition before relying on blur or glow.

## Design-system discipline

For broad work, organize decisions as:

```text
Primitive → Semantic → Component → State
```

Define only the tokens the product actually needs:

```text
canvas / surface / elevated
text / muted / subtle
accent / accent-contrast
success / warning / danger / info
focus / selected / disabled
spacing / radii / control heights
text roles / line-heights / tracking
motion durations / easing
border / elevation
```

Do not create a new token system when the project already has one.

## Visual inspection contract

When rendered output is available, inspect the actual pixels rather than trusting source code.

At minimum check:

- first-read clarity within a few seconds
- focal-point dominance
- alignment and spacing rhythm
- repeated component consistency
- long labels and wrapping
- icon optical alignment
- dark/light surface separation
- excessive borders, pills, shadows, blur, or glow
- visible focus and important semantic states
- mobile or narrow-width recomposition
- motion that feels slow, theatrical, or distracting

Use screenshots or rendered previews as evidence when available. Source inspection alone is insufficient for visual sign-off when a renderer exists.

## Self-critique gate

Before finalizing a visual change, answer:

```text
Did I preserve the requested scope?
What is the dominant visual idea?
Can the hierarchy be read without decorative effects?
Are the strongest visual decisions specific to this product?
Did I remove at least one unnecessary visual treatment?
Are state, depth, color, and motion using one coherent language?
Does the result still work at narrow widths and with larger text?
Does reduced motion preserve comprehension and feedback?
Would I recognize this as the same product in a second screen?
```

If a rendered comparison is available, prefer before/after comparison over memory.

## Output contract

For aesthetic review or refactoring, return:

```text
Visual direction:
Highest-impact problems:
Recommended corrections:
Scope / behavior preserved:
Visual QA performed:
Remaining tradeoffs:
```

For generation or implementation tasks, do not force this report shape onto the user-facing artifact; use it internally as a quality gate and report only material design decisions or tradeoffs.

## Composition with other AzSkills

Use `ui-aesthetics` for **visual judgment** and `ui-design` for **production UI execution** when both responsibilities are present:

```text
application-architecture
        ↓
frontend-architecture
        ↓
ui-design + ui-aesthetics
        ↓
rendered visual QA
```

Use `readme-craft`, `logo-generator`, `ip-as-logo`, `frontend-slides`, or other more specific visual Skills when their artifact-specific constraints apply. The more specific Skill owns its artifact contract; this Skill supplies aesthetic judgment around that contract.

## Source boundary

This Skill is an original AzSkills synthesis informed by public aesthetic methodologies, including the public `kasonye/ui-aesthetics-skill` project. It intentionally does not vendor its platform wrappers, assets, generated examples, scripts, or repository-specific reference corpus.
