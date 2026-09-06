# Animation Patterns Reference

Use these patterns to match motion to the intended feeling rather than adding animation indiscriminately.

## Effect-to-Feeling Guide

| Feeling | Useful animation patterns |
|---|---|
| Dramatic / Cinematic | Slow fade-ins, large scale transitions, parallax |
| Techy / Futuristic | Neon glow, glitch/scramble text, grid reveals, particle canvas |
| Playful / Friendly | Bouncy easing, floating/bobbing, rounded motion |
| Professional / Corporate | Subtle 200–300ms transitions, clean reveals |
| Calm / Minimal | Very slow fades, restrained movement, high whitespace |
| Editorial / Magazine | Staggered text reveals, image/text interplay, grid-breaking entrances |

## Entrance Animations

```css
.reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s var(--ease-out-expo),
                transform 0.6s var(--ease-out-expo);
}
.visible .reveal {
    opacity: 1;
    transform: translateY(0);
}

.reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

.reveal-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

.reveal-blur {
    opacity: 0;
    filter: blur(10px);
    transition: opacity 0.8s, filter 0.8s var(--ease-out-expo);
}
```

## Background Effects

Prefer layered CSS effects that support the selected visual thesis: radial-gradient meshes for depth, inline SVG noise for grain, and subtle linear-gradient grids for structure.

## Interactive Effects

A restrained 3D tilt can be applied to panels when it supports the design. Prefer transform-based effects and avoid expensive per-frame work when simple opacity/translation is sufficient.

```javascript
class TiltEffect {
    constructor(element) {
        this.element = element;
        this.element.style.transformStyle = 'preserve-3d';
        this.element.style.perspective = '1000px';
        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            this.element.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'rotateY(0) rotateX(0)';
        });
    }
}
```

## Troubleshooting

Fonts not loading: verify the Fontshare/Google Fonts URL and the exact family name.

Animations not triggering: verify the `.visible` class and any Intersection Observer logic.

Mobile issues: preserve the 16:9 stage; reduce expensive effects rather than reflowing slide content.

Performance issues: prefer `transform` and `opacity`, use `will-change` sparingly, and throttle pointer/scroll handlers.
