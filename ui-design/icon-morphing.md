# Icon Morphing Reference

This reference defines AzSkills' frontend guidance for semantic SVG icon morphing. It is an implementation capability inside `ui-design`, not a standalone Skill.

## Purpose

Use icon morphing when the relationship between two UI states is meaningful and the icon geometry can communicate continuity better than a hard swap.

Good candidates include:

- menu ↔ close
- play ↔ pause
- add ↔ check
- chevron / arrow direction changes
- search ↔ cancel
- lock ↔ unlock
- visibility ↔ hidden
- expand ↔ collapse
- loading / action-state icon transitions when the intermediate geometry remains intelligible

Do not morph unrelated semantic concepts merely because an animation is available. A hard swap is preferable when the two icons have little geometric or semantic continuity, when the motion would obscure meaning, or when the transition would add noise to a high-frequency interaction.

## Preferred implementation model

Treat the icon as a stateful visual component:

```text
semantic state
    ↓
icon A / icon B
    ↓
morph plan
    ↓
interruptible motion
    ↓
canonical target icon
```

The semantic state belongs to the product component. The morphing engine is an implementation detail.

Prefer a dedicated SVG morphing implementation such as `morphicons` when the project already uses it or when adding the dependency is justified by repeated icon-state transitions. `morphicons` provides framework bindings for React, Vue, Svelte, React Native, Astro, and a web-component/DOM path, plus a DOM-free core. It accepts stroke-based icon data or raw SVG `d` paths and supports uncontrolled, controlled, and imperative modes. The library is MIT licensed and currently exposes the package as ESM with optional framework peers.

Do not require `morphicons` when the project already has an equivalent native icon-motion system. Extend the existing system instead of introducing a competing animation stack.

## Geometry requirements

Morphing quality depends on the source geometry, not only the animation timing.

Prefer:

- stroke-centered icons rather than filled glyphs
- a shared coordinate system, commonly `24 × 24`
- consistent stroke width, caps, and joins
- literal path geometry that can be parsed as data
- icon pairs with meaningful geometric correspondence

For mixed icon packs, normalize coordinate systems before runtime use. With `morphicons`, off-grid packs can be fitted once with `fitIcon`; do this at module scope rather than during render.

Do not judge compatibility from the icon's visual name alone. Inspect the actual SVG geometry and coordinate system.

## Motion model

Prefer motion that preserves semantic continuity:

- rotation should emerge from the geometry when the shapes are congruent under rotation
- deformation should happen in an aligned frame rather than collapsing the source into an arbitrary intermediate shape
- preserve continuity when a new target arrives mid-flight
- settle to the exact canonical target path
- use spring motion for tactile state changes, but keep the response short enough for repeated interaction

Good defaults:

```text
frequent control-state morph: 160–280ms perceptual settle
slightly expressive control-state morph: 220–360ms
continuous gesture / scrubbing: direct progress control
```

These are starting ranges, not hard requirements. Existing product motion tokens take precedence.

Avoid:

- long theatrical spring chains for tiny icons
- independent rotation plus shape tween when the geometry already determines the motion
- icon motion that continues after the associated state has changed again
- animation-only communication for success, failure, selection, or disabled state

## Interruptibility

Icon morphs must be designed for rapid interaction.

When the user changes state again before the current morph settles:

1. capture the current rendered/interpolated geometry
2. re-plan toward the new target
3. preserve useful velocity when the engine supports it
4. continue without snapping through the previous endpoint

This is particularly important for menu toggles, expandable controls, segmented states, drag gestures, and rapid keyboard navigation.

A morph should always be safe to interrupt. Never assume an animation reaches `100%` before product state can change.

## Accessibility and reduced motion

The icon's semantic state must remain understandable without animation.

For every morph:

- keep the control's accessible name tied to the current action or state
- expose static state through text, label, `aria-pressed`, `aria-expanded`, or equivalent semantics where applicable
- keep visible focus independent of the morph
- honor the project's reduced-motion policy

For AzSkills projects, `prefers-reduced-motion: reduce` is authoritative unless the product explicitly documents a different policy. When using `morphicons`, opt into its reduced-motion behavior rather than leaving the icon animation to ignore the user's preference. In current `morphicons` documentation this can be expressed with `reducedMotion="user"` or the equivalent DOM-driver option.

Reduced motion should normally become a direct icon swap or another near-static state change. Do not hide state feedback because animation was disabled.

## Framework guidance

Use the binding that matches the detected stack:

```text
React       → morphicons/react
Vue         → morphicons/vue
Svelte      → morphicons/svelte
React Native→ morphicons/react-native
Astro       → morphicons/astro
plain DOM   → morphicons/dom
custom HTML → morphicons/element
```

For framework-neutral logic or custom renderers, the pure core can be used to compute a morph plan and serialize the resulting `d` path.

Do not import a framework binding that does not match the application's runtime simply because it has a convenient API.

## Three usage modes

Choose the least powerful mode that solves the interaction:

```text
uncontrolled  → component state changes the target icon
controlled    → gestures, scroll, or another continuous progress value
imperative    → scripted sequences or external coordination
```

Uncontrolled mode is preferred for ordinary UI state toggles. Controlled mode is appropriate when icon progress is part of another interaction. Imperative mode is useful for sequences and orchestration, but should not become a substitute for declarative state.

## Icon-system consistency

Morphing does not override the icon system.

Keep the same:

- icon family vocabulary
- stroke visual weight
- optical size
- corner language
- color semantics
- alignment rules

An animated icon should look like the same icon system at rest. Do not introduce a visually alien icon family only because its geometry morphs well.

## Performance

Prefer one shared animation scheduler for many active morphs rather than one independent animation loop per icon instance. Keep runtime allocations low and avoid layout-affecting animation.

For content-heavy surfaces:

- do not animate hundreds of decorative icons simultaneously without evidence of need
- avoid triggering morph plans from every render
- cache normalized icon data and pair plans when the implementation permits it
- stop scheduling an icon after it settles
- keep the rest state canonical so static rendering and SSR remain stable

Morphing is a microinteraction, not a rendering excuse for continuous high-frequency animation.

## Visual QA

Review morphs at the real rendered size, not only in an enlarged playground.

Check:

- first and final frames match the intended static icons
- no unexpected rotation or scale appears
- stroke weight stays visually stable
- corners do not melt into blobs
- subpaths do not cross in confusing ways
- rapid toggles do not snap or jump
- dark and light themes retain sufficient contrast
- reduced-motion mode remains communicative
- SSR/static first paint matches the settled client state

If a pair produces an ugly intermediate shape, change the icon pair or use a hard swap. Do not compensate for bad geometry with increasingly elaborate timing.

## Provenance

This reference is an original AzSkills integration based on the public `morphicons` project and is not a copy of its source or documentation.

Upstream project:

- https://github.com/guillermolg00/morphicons
- https://www.morphicons.com

Upstream package metadata currently identifies the project as MIT licensed. Check the upstream repository for the version and implementation details used by the target project before documenting a dependency.