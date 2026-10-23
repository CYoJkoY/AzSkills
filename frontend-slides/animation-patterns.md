# Animation Patterns Reference

Deck motion is placement and pacing. Mechanism, easing, timing, interruption,
reduced-motion parity, and motion gates belong to
[`ui-motion`](../../ui-motion/SKILL.md). Read
[`../../ui-motion/references/animation-standards.md`](../../ui-motion/references/animation-standards.md)
before choosing a mechanism, and use the deck tokens registered in
[`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) section 2.

## Motion budget

Each slide should normally use:

- one primary entrance pattern
- zero or one secondary emphasis pattern
- one optional background or atmospheric loop

Avoid giving every element a different animation.

## Effect to feeling

| Feeling | Deck-level pattern |
| :--- | :--- |
| Dramatic / cinematic | slow fade, large-scale reveal, restrained parallax |
| Technical / futuristic | clip reveal, line sweep, grid reveal |
| Playful / friendly | short stagger, light scale, floating accents |
| Professional / corporate | opacity and translation only, minimal easing |
| Calm / minimal | slow fades, almost no translation |
| Editorial / magazine | staggered text, image reveal, rule and column motion |

These are compositions, not curves or durations. Take both from the motion
standards, then register the adopted values once in the deck token layer.

## Entrance patterns

Use the token layer from [`html-template.md`](../html-template.md):

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity var(--duration-normal) var(--ease-paper),
    transform var(--duration-normal) var(--ease-paper);
}

.visible .reveal {
  opacity: 1;
  transform: translateY(0);
}
```

Direction, distance, and scale are deck composition choices. Duration and
easing come from the tokens; never inline a second curve.

## Staggering

Use small, deliberate delays to create reading order. A typical deck rhythm is
70 to 120 milliseconds between major elements.

Do not create a long chain of tiny delays for every child node. The viewer
should perceive one composition entering, not a queue of independent
animations.

## Slide transitions

Prefer one unified deck transition. Use a stronger transition only for section
boundaries: full-field color shift, large title fade, rule expansion, or a
controlled scale into a new composition. Avoid page turns, elastic wipes, and
random 3D rotations unless the subject calls for them.

## Background motion

Atmospheric loops may use slow radial drift, subtle grid movement, or restrained
particle drift at low opacity, so background motion never competes with text.

## Reduced motion

Under `prefers-reduced-motion: reduce`, keep the final state and drop the
movement. Do not replace one animation with another.

## Final check

Before delivery, ask whether the motion improves comprehension, hierarchy, or
pacing. If it does not, remove it.
