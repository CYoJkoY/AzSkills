# Visual Engine Matrix

## Purpose

This reference defines the responsibility boundary between Remotion and specialized visual systems. It is a selection aid, not a requirement to install or combine all technologies.

## Decision matrix

| Technology | Primary domain | Remotion role | Integration posture | Strength | Main caution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Remotion | composition / render | timeline authority | native | deterministic frame orchestration | do not make it responsible for every visual primitive |
| D3.js | data visualization | frame-driven reveal / emphasis | geometry + data adapter | scales, layouts, quantitative graphics | keep heavy layout work out of unnecessary per-frame paths |
| Three.js / R3F | 3D / WebGL | frame-driven scene state | @remotion/three where applicable | 3D scenes, materials, camera, shaders | GPU memory, renderer state, nondeterministic clocks |
| GSAP | choreography | controlled scene choreography | @remotion/gsap or explicit frame adapter | complex sequencing | do not create a competing global timeline |
| Anime.js | procedural motion | isolated effect helper | frame-adapted only | concise procedural effects | imperative playback can become a second clock |
| Popmotion | interpolation / physics | value calculation | derive values from frame | physics and value utilities | animation runner must not own render time |
| Framer Motion | React motion primitives | component-level visual behavior | no dedicated Remotion timing authority; use only when frame-resolvable and verified | React-oriented motion patterns | live browser animation can desynchronize from render frames |
| Rive | authored vector / state-machine asset | placed animation asset | @remotion/rive | designer-authored interactive/vector animation | external runtime state must remain deterministic in render |
| Lottie | authored animation asset | placed animation asset | @remotion/lottie | portable design animation playback | asset feature support and timing must be verified |
| CSS Keyframes | browser-native motion | style layer | non-authoritative only unless rendered deterministically | simple browser effects | wall-clock progress is a poor render-time authority |
| WAAPI | imperative browser animation | style layer | non-authoritative only unless explicitly frame-seekable | script-level browser control | independent document timeline can drift from Remotion |
| Flubber | SVG geometry interpolation | frame-resolved path geometry | pure interpolation | shape morphing | normalize compatible paths and avoid excessive geometry complexity |
| Canvas | custom raster graphics | per-frame drawing surface | frame-driven renderer | particles, effects, dense pixels | fill rate, resolution, and CPU/GPU pressure |

## Selection rule

Choose the smallest mechanism that fully owns the visual problem.

    Need timeline
    → Remotion

    Need data layout
    → D3.js

    Need 3D rendering
    → Three.js / R3F

    Need advanced choreography
    → GSAP

    Need physics values
    → Popmotion

    Need authored animation asset
    → Rive / Lottie

    Need SVG path interpolation
    → Flubber

    Need custom raster drawing
    → Canvas

Use Anime.js, Framer Motion, CSS Keyframes, and WAAPI only when their specific capability is genuinely useful and their timing can be reconciled with the Remotion frame model.

## Integration grades

### A — First-party frame-aware integration

Prefer when available:

- @remotion/three
- @remotion/gsap
- @remotion/lottie
- @remotion/rive

Even with a first-party package, verify the specific feature path used by the project and render it rather than trusting runtime preview behavior alone.

### B — Pure calculation adapter

Appropriate for:

- D3 scales / layouts
- Flubber geometry interpolation
- Popmotion value calculations

Use:

    frame
    → pure calculation
    → render props

### C — Isolated imperative helper

Potentially appropriate for:

- Anime.js
- Framer Motion
- WAAPI

Use only when the imperative mechanism is isolated from the authoritative timeline, or when the implementation exposes an explicit frame-seeking strategy.

### D — Browser clock risk

Treat these as high-risk for render-critical timing unless explicitly controlled:

- CSS animation playback
- free-running WAAPI timelines
- requestAnimationFrame loops
- Three.js useFrame() loops

The rule is not never use the technology. The rule is never let an uncontrolled browser clock decide the pixels that Remotion is supposed to render.

## Combination examples

### Data story

    Remotion
     ├─ D3 scales / layout
     ├─ SVG chart layer
     ├─ Canvas particle layer
     └─ Flubber transition

### 3D showcase

    Remotion
     ├─ Three.js / R3F scene
     ├─ frame-driven camera
     ├─ frame-driven materials
     └─ optional GSAP choreography adapter

### UI showcase

    ui-design
     └─ product UI
         ↓
    Remotion
     ├─ scene timing
     ├─ focus / camera framing
     ├─ annotations
     └─ transitions

### Brand animation

    design-intelligence.md
     └─ visual thesis
          ↓
    Remotion
     ├─ typography
     ├─ SVG / Flubber
     ├─ Canvas effects
     └─ authored Lottie / Rive assets

## Anti-patterns

Avoid:

- GSAP + Anime.js + Framer Motion each controlling the same property
- a Three.js clock running beside Remotion frame state
- CSS keyframes used as the hidden master timeline
- random particle seeds changing per render
- D3 rebuilding unchanged geometry every frame
- adding an engine only because it is listed in this table
