---
name: ui-design
description: Design, audit, and refine production UI with a coherent design system, interaction model, motion language, accessibility baseline, responsive behavior, and anti-generic visual quality. Apply automatically to web interfaces, controls, dashboards, tools, settings, and interactive product surfaces.
---

# UI Design

A cross-stack UI design skill for turning product requirements into coherent, production-ready interfaces. Treat visual design, interaction design, accessibility, motion, content, and implementation quality as one system.

This skill is informed by the public skill taxonomy and publicly described practices collected by UI Skills, especially its Systems, Visual, Interaction, Motion, Accessibility, and Craft categories. It is synthesized for AzSkills rather than copied or vendored.

## Automatic scope

Use this skill whenever a task changes any of the following:

- interface layout or composition
- component styling or states
- navigation, forms, settings, dialogs, menus, or controls
- responsive behavior
- hover, focus, press, drag, gesture, transition, or page motion
- typography, spacing, color, contrast, iconography, borders, or elevation
- empty, loading, error, success, disabled, or partial-content states
- internationalization or bidirectional layout behavior

For pure backend or data-only work, do not apply it mechanically.

## Priority order

1. Explicit user requirements.
2. Product/domain constraints.
3. Existing project design system and platform conventions.
4. This skill.
5. Optional aesthetic references.

Preserve product identity. Do not replace an established system merely to make the UI look fashionable.

## 1. Begin with a UI thesis

Before substantial implementation, define:

```text
Purpose:
Primary user:
Primary task:
Content density:
Visual personality:
Interaction personality:
Layout model:
Type hierarchy:
Color roles:
Motion language:
Accessibility baseline:
```

A UI thesis is a decision tool. Every major visual or motion choice should support it.

## 2. Design system before components

Build a compact token hierarchy:

```text
Primitive → Semantic → Component → State
```

At minimum define:

- color roles: canvas, surface, elevated surface, text, muted text, accent, success, warning, danger, focus
- spacing scale
- typography roles
- radii
- border and divider roles
- elevation/shadow roles
- motion durations and easing
- interaction states

Do not scatter one-off values throughout the implementation when a reusable token would express the same intent.

## 3. Layout and hierarchy

Composition comes before decoration.

Establish:

- a clear primary action
- a predictable reading order
- grouping through proximity and alignment
- a stable grid or alignment axis
- deliberate negative space
- content density appropriate to the task

Do not default to a dashboard full of identical cards. Cards, pills, badges, dividers, and floating controls are tools for grouping or interaction, not the layout strategy itself.

Prefer progressive disclosure when secondary detail competes with the primary task.

## 4. Responsive behavior

Design behavior, not just breakpoints.

For each viewport class decide what should:

- stay anchored
- compress
- wrap
- collapse
- scroll
- move into secondary navigation
- become progressively disclosed

Never rely on accidental wrapping as responsive design.

The interface must remain usable at narrow widths, text zoom, and touch input. Avoid horizontal overflow unless the content itself is intrinsically horizontal.

## 5. Typography

Treat typography as a functional hierarchy:

- display / page statement
- heading / section
- body / explanation
- utility / metadata
- numeral / data
- control / label

Protect readable line length, line height, wrapping, contrast, and optical alignment.

Do not use typography merely as decoration. Do not solve density problems by shrinking type until hierarchy collapses.

For bilingual interfaces, reserve enough width for expansion and test both scripts. Never assume translated strings will have the same length as the source language.

## 6. Color and contrast

Assign every color a semantic role. A restrained palette is usually easier to maintain than a large collection of decorative colors.

For light and dark themes, define semantic tokens rather than swapping arbitrary raw colors. Verify text, controls, borders, focus indicators, disabled states, and selected states independently.

Never make color the sole carrier of status, selection, or errors; pair color with text, icon, shape, or another redundant cue.

For image boundaries, prefer a subtle neutral outline rather than a tinted edge that visually contaminates the image.

## 7. Surfaces, borders, and elevation

Use borders for structure and state; use shadows for elevation.

For nested surfaces, keep radii visually concentric: the outer radius should account for inner padding rather than mechanically repeating the same radius.

Do not stack heavy borders, large shadows, blur, glow, and glass effects without a specific reason.

Depth should clarify hierarchy, not simulate visual complexity.

## 8. Interaction states are first-class design

Every interactive control should have an explicit model for:

```text
rest → hover → focus → active/pressed → selected → disabled
```

Where relevant, also define:

```text
loading → success / error
empty → populated
expanded → collapsed
open → closing
```

Every state should communicate through at least one static cue and, when useful, one motion cue.

Never rely on hover alone. Preserve keyboard focus. Keep controls predictable when input is interrupted.

## 9. Micro-interactions

Micro-interactions should confirm cause and effect rather than advertise themselves.

Use short transitions for frequent interactions and avoid repeated decorative animations on high-frequency events.

Preferred patterns:

- hover: subtle lift or color emphasis
- press: `scale(0.96)` when tactile feedback helps
- selected state: color/weight/indicator plus optional restrained transition
- toggle: interruptible movement or cross-fade
- toast/status: compact scale + fade or opacity transition
- modal/drawer: contextual enter/exit preserving spatial relationships

Motion is never the only feedback channel.

## 10. Motion system

Use a small reusable motion vocabulary.

### Core primitives

**Fade + rise**

Use for infrequent page-section or dialog entrances.

- opacity: 0 → 1
- translateY: 12–24px → 0
- duration: roughly 300–700ms

**Scale + fade**

Use for compact overlays, toasts, and selected-state emphasis.

- scale: 0.98 → 1
- opacity: 0 → 1

**Slide**

Use for drawers, local panels, and step transitions. Animate transform rather than layout geometry.

**Shared-element / morph**

Use only when geometry is stable and continuity materially improves comprehension, such as segmented indicators or expanding surfaces.

### Motion timing

Use ranges rather than one universal duration:

- micro interaction: 120–200ms
- UI state transition: 180–260ms
- small overlay/toast: 220–320ms
- section entrance: 400–800ms
- hero or onboarding sequence: 800–1600ms

Use a small set of easing curves. Prefer ease-out for entering and UI feedback; use faster ease-in for exits. Avoid elastic/bouncy defaults unless the product language is intentionally playful.

### Choreography

For infrequent entrances:

1. primary visual or headline first
2. supporting content second
3. primary action last

Use small stagger intervals, generally around 40–90ms, and smaller values on mobile. Do not stagger routine clicks, typing, hovering, or every child in a list.

### Interruptibility

Interactive transitions should usually use CSS transitions or an animation system that can reverse from the current state. Avoid animations that fight the user's next action.

## 11. Performance rules

Prefer compositor-friendly properties:

- `transform`
- `opacity`

Avoid repeatedly animating:

- `width`
- `height`
- `top`
- `left`
- large-area filters or blur

Do not measure layout every animation frame. Use `will-change` only when a real first-frame or rendering issue justifies it, and only for properties that benefit from compositing.

Keep concurrent motion small enough that the interface remains responsive on mid-range hardware and mobile devices.

## 12. Accessibility baseline

Use native semantics first.

- `<button>` for actions
- `<a href>` for navigation
- real `<label>` elements for inputs
- native form controls where practical

Every pointer interaction needs a keyboard path.

Focus requirements:

- use `:focus-visible`
- keep a visible focus indicator with at least a clear 2px perimeter or equivalent visible area
- never remove focus without a verified replacement

Hit areas:

- 24×24 CSS px is a minimum baseline when exceptions do not apply
- aim for 40×40 on desktop interfaces when density permits
- aim for 44×44 in touch contexts
- do not let expanded hit areas overlap adjacent controls

Icon-only controls need descriptive accessible names. Decorative content must not become focusable or announced unnecessarily.

## 13. Reduced motion

Reduced motion is a design variant, not an afterthought.

Under `prefers-reduced-motion: reduce`:

- keep content visible
- remove non-essential translation and scale
- replace motion with immediate state changes or subtle opacity changes
- disable parallax and autoplay-driven motion

Do not make essential state information depend on animation.

## 14. Dynamic content and feedback

Design all non-static states explicitly:

- loading
- success
- validation error
- server error
- offline or partial data
- empty state
- no-results state
- disabled/unavailable state

Routine updates should use a polite status region where appropriate. Urgent errors should be announced distinctly from routine feedback.

A state change should explain what happened and what the user can do next.

## 15. Forms and controls

Inputs require visible labels; placeholders are supplemental hints, not labels.

Match control type to the expected data and device input method. Do not block paste or zoom.

Keep submit actions available until an operation starts; validate at the point of submission and focus the first actionable error.

For segmented controls, tabs, menus, sliders, and other composite widgets, use established keyboard behavior instead of inventing custom navigation.

## 16. Internationalization and RTL

Treat localization as a layout concern.

Use stable message keys rather than using source-language sentences as the application's internal model.

Do not translate arbitrary user data, color names, filenames, IDs, or source labels as though they were UI strings.

Test:

- both locales on every route
- dynamically rendered content
- placeholders, titles, aria-labels, tooltips, and toasts
- longer translations and line wrapping
- date/number formatting where applicable
- RTL when the locale requires it

A UI is not localized until newly rendered and stateful content remains in the selected language.

## 17. Icons

Use one coherent icon vocabulary per surface.

Prefer semantic SVG icons using `currentColor`. Use outline icons by default and filled variants for active states when the visual system supports that distinction.

Match icon stroke weight to nearby typography and optically align asymmetric symbols rather than trusting geometric centering.

Do not use emoji as a substitute for deliberate interface iconography unless the product explicitly calls for it.

## 18. Taste and anti-generic rules

Reject visual decisions that feel copied from a generic SaaS template without a product-specific reason.

Common anti-patterns:

- excessive rounded cards
- identical card grids everywhere
- arbitrary glassmorphism or glow
- gradients added simply to look modern
- decorative blobs with no communication job
- inconsistent radii and shadows
- tiny helper text used to fit more content
- hover-only actions
- one animation duration for every interaction
- animation on every element
- excessive 3D tilt/parallax
- color used as the only status signal
- replacing meaningful icons with emoji

A distinctive UI does not require novelty everywhere. It requires consistent choices with a clear reason.

## 19. Verification protocol

Before calling a UI task complete, perform a structured pass:

### Visual

- hierarchy is obvious within a few seconds
- primary action is visually dominant
- spacing follows a repeatable rhythm
- nested radii are coherent
- shadows and borders have distinct jobs
- light and dark themes are both legible
- no accidental clipping or overflow

### Interaction

- rest / hover / focus / active / disabled states exist where relevant
- keyboard interaction completes every primary flow
- controls provide static feedback even when motion is disabled
- route, overlay, and drawer transitions preserve context

### Motion

- animations serve hierarchy, feedback, continuity, or delight
- no routine interaction is over-animated
- transforms and opacity dominate
- timings are intentional rather than universal
- interrupted interactions recover cleanly
- reduced-motion mode is usable

### Accessibility

- semantic elements are used where possible
- focus is visible
- target sizes are practical
- labels and accessible names exist
- dynamic updates are announced appropriately
- content survives zoom and narrow widths
- contrast and non-color cues are verified

### Content / i18n

- every route is checked in every supported locale
- dynamic rendering does not reintroduce source-language UI
- placeholders, titles, aria-labels, toasts, errors, and empty states are localized
- user data is not mistranslated as UI

### Code quality

- repeated visual values use tokens
- transitions specify exact properties; never use `transition: all`
- animation code is reusable rather than duplicated per component
- `will-change` is rare and justified
- no temporary debug UI or design notes remain visible

## 20. Review method

When auditing an existing interface:

1. Walk the primary flow with a mouse.
2. Walk the same flow keyboard-only.
3. Inspect hover, focus, active, loading, empty, and error states.
4. Slow animation to roughly 10% speed in browser tooling to expose timing and continuity problems.
5. Compare light/dark themes.
6. Check the smallest practical viewport and 200% text zoom.
7. Audit repeated components for token drift.
8. Remove unnecessary decoration before adding new effects.

Separate systemic findings from isolated polish issues. Fix systemic rules first.

## 21. Done standard

The UI is done when:

- the visual system is coherent across routes and states
- interaction feedback is predictable and accessible
- motion feels like one language instead of a collection of effects
- localization survives dynamic rendering
- responsive behavior is intentional
- reduced-motion remains usable
- no major accessibility or hierarchy issue remains
- additional decoration is more likely to weaken than improve the interface

## Provenance

This skill is an AzSkills synthesis informed by the public catalog and publicly described practices on:

- https://www.ui-skills.com/skills
- https://www.ui-skills.com/skills/visual
- https://www.ui-skills.com/skills/interaction
- https://www.ui-skills.com/skills/motion
- https://www.ui-skills.com/skills/accessibility
- https://www.ui-skills.com/skills/craft
- https://www.ui-skills.com/skills/taste

Specific practices were cross-checked against public descriptions of UI Skills entries such as `better-ui`, `better-accessibility`, and `animation-systems`. AzSkills does not vendor those repositories, generated assets, or private/internal source material.
