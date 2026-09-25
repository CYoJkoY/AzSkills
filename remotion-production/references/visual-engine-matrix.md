# Visual Engine Matrix

## Purpose

This reference defines how Remotion should compose with specialized visual engines.

| Engine | Responsibility | Remotion integration |
|---|---|---|
| Remotion | timeline, composition, export | root orchestration layer |
| D3.js | data transformation and visualization | derive SVG/canvas frames from current frame |
| Three.js | WebGL and 3D rendering | synchronize scene state with frame time |
| GSAP | complex choreography | drive controlled sequences from Remotion timing |
| Anime.js | procedural effects | use for isolated lightweight effects |
| Popmotion | physics and interpolation | convert values into frame-driven motion |
| Framer Motion | React component animation | embed reusable animated components |
| Rive | interactive vector states | render authored motion assets |
| Lottie | design animation playback | use as deterministic assets |
| CSS Keyframes | simple effects | reserve for static browser-oriented layers |
| WAAPI | imperative animation | use for controlled browser effects |
| Flubber | SVG morphing | interpolate geometry between states |
| Canvas | custom drawing | render high-frequency graphics |

## Synchronization rule

The frame number from Remotion is the source of truth.

```text
Remotion frame
      ↓
normalized progress
      ↓
visual engine state
      ↓
rendered frame
```

Avoid separate clocks wherever possible.
