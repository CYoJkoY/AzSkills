# Animation Patterns Reference

Motion is part of the design system. Use it to reveal hierarchy, signal state, and establish pacing. Do not animate simply because an element can move.

## Motion Budget

Each slide should normally use:

- one primary entrance pattern
- zero or one secondary emphasis pattern
- one optional background/atmospheric loop

Avoid giving every element a different animation.

## Effect-to-Feeling Guide

| Feeling | Useful animation patterns |
|---|---|
| Dramatic / Cinematic | slow fade, large-scale reveal, restrained parallax |
| Techy / Futuristic | clip reveal, line sweep, subtle glow, grid reveal |
| Playful / Friendly | soft spring/bounce, floating, short stagger |
| Professional / Corporate | 180–300ms opacity/translation, minimal easing |
| Calm / Minimal | slow fades, almost no translation |
| Editorial / Magazine | staggered text, image reveal, rule/column motion |

## Entrance Patterns

```css
.reveal {
    opacity: 0;
    transform: translateY(28px);
    transition:
        opacity 600ms var(--ease-out-expo),
        transform 600ms var(--ease-out-expo);
}

.visible .reveal {
    opacity: 1;
    transform: translateY(0);
}

.reveal-left {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 520ms var(--ease-out-expo),
                transform 520ms var(--ease-out-expo);
}

.reveal-scale {
    opacity: 0;
    transform: scale(0.96);
    transition: opacity 700ms var(--ease-out-expo),
                transform 700ms var(--ease-out-expo);
}

.reveal-clip {
    clip-path: inset(0 100% 0 0);
    transition: clip-path 800ms var(--ease-out-expo);
}

.visible .reveal-clip {
    clip-path: inset(0 0 0 0);
}
```

## Staggering

Use small, deliberate delays to create reading order. A typical rhythm is 70–120ms between major elements.

Do not create a long chain of tiny delays for every child node. The viewer should perceive one composition entering, not a queue of independent animations.

## Slide Transitions

Prefer a unified deck transition. Use a stronger transition only for section boundaries.

Good section transitions:

- full-field color shift
- large title fade/slide
- rule expansion
- controlled scale into a new composition

Avoid flashy page-turns, elastic wipes, and random 3D rotations unless the subject explicitly calls for them.

## Background Motion

Atmospheric loops can use:

- slow radial drift
- subtle grid movement
- restrained particle drift
- very slow noise/grain shimmer

Keep opacity low enough that background motion never competes with text.

## Interactive Motion

Micro-interactions are useful for controls and emphasis. Prefer transform/opacity. Avoid continuous per-frame effects when a state transition is sufficient.

A restrained tilt can be used on a single focal panel, but never make the whole deck behave like a 3D demo.

```javascript
class TiltEffect {
    constructor(element) {
        this.element = element;
        this.onMove = this.onMove.bind(this);
        element.addEventListener('pointermove', this.onMove);
        element.addEventListener('pointerleave', () => {
            element.style.transform = '';
        });
    }

    onMove(event) {
        const rect = this.element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        this.element.style.transform =
            `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
    }
}
```

## Animation Safety

Support reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

## Troubleshooting

Fonts not loading: verify the font URL and exact family name.

Animations not triggering: confirm the slide receives `.visible` and the animation selectors depend on that state.

Unexpectedly heavy motion: remove effects before increasing performance complexity. Prefer fewer effects with better timing.

Mobile issues: preserve the 16:9 stage; optimize expensive effects rather than reflowing slide content.

Performance issues: favor transform/opacity, use `will-change` sparingly, and avoid unnecessary pointer/scroll loops.

## Final Motion Check

Before delivery, ask whether the animation improves comprehension, hierarchy, or pacing. If the answer is no, remove it.
