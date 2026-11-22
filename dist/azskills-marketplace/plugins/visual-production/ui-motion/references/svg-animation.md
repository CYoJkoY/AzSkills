# SVG Animation Reference

Load this reference for icon motion, loaders, logo animation, illustration
micro-interactions, or animated SVG assets. The canonical `ui-motion` contract
wins when this reference and the contract disagree.

## SVG scope detail

Use for:

- animated icons and state transitions
- loading and progress indicators
- logo and identity motion
- illustration or diagram micro-interactions
- reusable, embeddable animated SVG assets

Do not use for full video production, page-level choreography, or 3D scenes.

## SVG deliverable detail

The canonical `ui-motion` output contract remains authoritative. For SVG mode,
the default deliverable is one self-contained file:

```text
namespace and viewBox
title and description for meaningful graphics
no external fonts or scripts unless the host explicitly requires them
CSS inside the SVG or an inline <style> block
prefers-reduced-motion fallback
static final frame that remains legible
```

For inline HTML, keep ids unique. For `<img>` embedding, keep all animation
inside the SVG and avoid script. For React, preserve `viewBox`, accessibility
attributes, and id scoping.

## Mechanism ladder

1. CSS animation or transition for transforms, opacity, color, stroke, and
   simple keyframes.
2. SMIL for path, shape, or timing relationships that CSS cannot express
   reliably.
3. A minimal JavaScript driver only for interaction, measurement, or runtime
   coordination that neither CSS nor SMIL can provide.

Prefer the first mechanism that fully solves the interaction.

## Design rules

- Motion must communicate state, progress, direction, continuity, or identity.
- Keep routine UI motion between 120ms and 400ms; longer motion needs a narrative
  or spatial reason.
- Use ease-out for entry, ease-in-out for movement, linear for constant loops.
- Use one motion idea per asset. Do not combine pulse, spin, bounce, glow, and
  morph because they are available.
- Loop only for indeterminate progress or ambient identity. Stop loops when the
  asset is off-screen or the task is complete.
- Use stroke-dashoffset for draw-on effects; keep path length measurable.
- Use transform-origin at the visual pivot, not the SVG origin.
- Keep the static frame readable without animation.

## Accessibility

- Add `role="img"` and a `<title>` for meaningful SVG; add `<desc>` when the
  meaning is not obvious from the title.
- Mark decorative SVG `aria-hidden="true"` and omit a redundant title.
- Respect `prefers-reduced-motion: reduce`; replace travel with opacity or a
  static state.
- Do not flash more than three times per second.
- Keep contrast and focus indicators outside the animation dependency.
- Do not encode meaning in color or motion alone.

## Performance

- Animate transform and opacity where possible.
- Avoid large animated filters, blurs, shadows, masks, and clip paths.
- Keep path counts and node counts proportionate to display size.
- Avoid layout-affecting animation and repeated synchronous measurement.
- Pause off-screen animation with `IntersectionObserver` when script is present.

## Compatibility

- CSS animation inside SVG is broadly supported but may be restricted in some
  image contexts.
- SMIL support is good in browsers but not universal in every embedded viewer.
- `<img>` embedding blocks script and external resources.
- Inline SVG allows CSS variables, interaction, and script but requires id
  scoping.
- Provide a static poster or final state for environments without animation.

## Patterns

| Pattern | Mechanism | Guardrail |
| :--- | :--- | :--- |
| Indeterminate spinner | Rotating group | Linear timing; pause when hidden |
| Stroke draw | `stroke-dasharray` and `stroke-dashoffset` | Measure path; keep one direction |
| Icon state change | Opacity and transform between layers | Keep both states aligned to one grid |
| Path morph | SMIL or script interpolation | Equal command structure; preserve silhouette |
| Progress ring | Dash offset driven by value | Keep numeric or text fallback |

## Forbidden

- animation that hides a missing static state
- infinite decorative motion on reading-critical content
- script inside `<img>`-embedded SVG
- external fonts, remote images, or unlicensed assets
- large filter regions or layout animation used for routine feedback
- motion that ignores reduced-motion policy

## SVG verification checks

These checks elaborate the canonical gates and cannot weaken them.

- [ ] The SVG has a valid namespace, `viewBox`, and intrinsic aspect ratio.
- [ ] Meaningful graphics expose a title and description; decorative graphics are hidden.
- [ ] The static state is legible and complete.
- [ ] Reduced motion preserves the state change.
- [ ] The animation uses the smallest mechanism.
- [ ] The asset renders at target sizes without clipping or misalignment.
- [ ] No external dependency is required unless the host explicitly allows it.
