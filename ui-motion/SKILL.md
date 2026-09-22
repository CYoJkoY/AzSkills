---
name: ui-motion
description: Construct purposeful, performant, accessible motion for Web interfaces using the project's existing design system and the smallest mechanism that fully satisfies the interaction. Use for adding transitions, entrances, gesture motion, state changes, and other UI animation work; do not use for motion-only review or codebase-wide audits.
---

# UI Motion

A construction Skill for Web UI motion. Its job is to turn a motion request into an implementation that fits the host project's architecture, interaction model, visual language, accessibility policy, and performance constraints.

It composes with `ui-design` rather than replacing it.

## Scope

Use when the task asks to:

- add or redesign a UI transition
- animate an overlay, drawer, toast, menu, tooltip, control, or state change
- design gesture-driven or spring-based UI motion
- make a component feel responsive or physically coherent
- choose animation properties, timing, easing, interruption, or exit behavior

Do not use this Skill as the primary owner for:

- reviewing existing motion → `ui-motion-review`
- auditing an entire codebase or discovering motion opportunities → `ui-motion-audit`
- React Native / Expo motion → a platform-specific mobile motion Skill
- SVG-only animation authoring → `svg-animation`

## Precedence

Use this order:

1. explicit user requirements
2. existing product identity and motion tokens
3. accessibility and platform constraints
4. `ui-design` and `design-intelligence.md`
5. `ui-motion/references/animation-standards.md`
6. optional examples

Never replace an established motion library or token system just to match a reference methodology.

## Construction workflow

### 1. Decide whether motion earns a place

| Frequency | Motion posture |
| :--- | :--- |
| 100+ times/day | do not animate the interaction itself |
| Tens/day | near-imperceptible motion only when it improves communication |
| Occasional | standard UI motion when it communicates state or space |
| Rare / first-use | more expressive craft may be justified |

Keyboard-initiated actions are normally high-frequency. Do not add open/close choreography merely because the surface is visually prominent.

### 2. Name the purpose

Choose one primary purpose:

```text
feedback
spatial consistency
state indication
continuity / preventing a jarring change
explanation
deliberate delight
```

If none applies, do not animate. Do not animate information the user is actively reading merely to make it feel alive.

### 3. Inspect the host motion system

Before choosing values, inspect:

- semantic motion tokens
- easing and duration scales
- existing component transitions
- reduced-motion implementation
- pointer / hover gates
- animation library and version
- browser and device baseline

Extend existing conventions. Do not create a parallel `ease-1/ease-2` vocabulary because it is convenient.

### 4. Choose the cheapest correct mechanism

Use this ladder:

```text
CSS transition
  → CSS @starting-style
  → CSS animation
  → WAAPI
  → spring / framework motion system
```

Choose the first mechanism that supports the required state model.

Use a library only when it buys something concrete such as interruptible spring behavior, gesture coordination, layout coordination, or existing project-level motion infrastructure. A fade is not a reason to add a dependency.

### 5. Choose properties and geometry

Prefer `transform` and `opacity` for routine UI motion.

Treat layout-affecting animation as an explicit exception. If it is required, justify the tradeoff and verify the resulting frame behavior.

For anchored overlays, derive `transform-origin` from the trigger or placement relationship. A centered origin is appropriate for genuinely centered overlays such as modals.

Do not start entrances at `scale(0)`. A small initial scale such as `scale(0.95)` with opacity reduction is a reference starting point.

Prefer percentage translations when they express an element-relative relationship more robustly than hardcoded pixels.

### 6. Choose timing

Use project tokens first. When no project vocabulary exists, use the approved reference ranges:

| Interaction | Starting range |
| :--- | :--- |
| press feedback | 100–160ms |
| tooltip / small popover | 125–200ms |
| dropdown / select | 150–250ms |
| modal / drawer | 200–500ms |
| explanatory / marketing motion | may exceed UI budgets when motion is the subject |

General defaults are entering/exiting → ease-out, on-screen movement → ease-in-out, hover/color changes → ease, constant motion → linear. Avoid `ease-in` for routine UI response.

Use springs for gesture continuity, velocity-sensitive interruption, or genuinely physical interactions. Reference spring configurations live in the shared standards.

### 7. Design interruption and exit

Rapidly retriggerable UI must be interruptible. Prefer transitions that retarget from the current value or springs that preserve useful velocity.

Keep the spatial story coherent:

```text
enter → settle → interrupt → retarget
enter → settle → exit
```

Unless product semantics require otherwise, an element should leave through the same spatial relationship through which it entered.

For deliberate phases such as hold-to-confirm, the user-controlled phase may be slow while the resulting system response is quick.

### 8. Add accessibility and capability variants

Ship these with the implementation:

```css
@media (prefers-reduced-motion: reduce) {
  /* preserve semantic feedback; reduce unnecessary movement */
}

@media (hover: hover) and (pointer: fine) {
  /* hover-specific motion */
}
```

Do not use viewport width as a proxy for pointer capability.

### 9. Implement and verify

Verify the actual rendered result:

- normal state and rapid retriggering
- first frame, intermediate state, and final state
- anchored origin when applicable
- reduced-motion variant
- keyboard and touch behavior
- narrow and wide layouts
- performance under realistic page load

When feel is uncertain, inspect at 2–5× playback speed or frame-by-frame in browser tooling. Use a real touch device for gesture interactions.

## Quality gates

Do not ship motion that contains any of these without an explicit documented reason:

- `transition: all`
- `scale(0)` entrance
- `ease-in` on routine UI feedback or entry
- animation attached to a keyboard / high-frequency interaction
- trigger-anchored popover scaling from the center
- non-interruptible keyframes for rapidly retriggerable UI
- movement without a reduced-motion strategy
- ungated hover-only motion
- unnecessary layout animation
- a new motion dependency that duplicates an installed capability

## Output contract

Return the implementation plus a compact verification note:

```text
Gate:
Purpose:
Mechanism:
Properties:
Timing:
Accessibility:
Feel-check:
```

Do not turn a small animation implementation into a long design essay.

## Reference loading

Load `ui-motion/references/animation-standards.md` for exact reference curves, timing ranges, spring configurations, gesture rules, accessibility patterns, and QA heuristics.

Load `ui-motion/references/animation-vocabulary.md` when the task uses unfamiliar motion terminology or when naming a motion pattern precisely matters.

Load `ui-motion/references/animation-recipes.md` when the requested interaction matches a common motion pattern; adapt the recipe to existing project tokens and component conventions.

## Composition with the UI system

For production interface work, `ui-motion` is a focused implementation pass underneath `ui-design`. Let `ui-design` own hierarchy, component state, responsive behavior, and accessibility; let `ui-motion` own the concrete motion mechanism, timing, interruption, and rendered motion verification.
