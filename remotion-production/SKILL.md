---
name: remotion-production
description: Build programmatic video, motion graphics, and visual compositions with Remotion as the rendering orchestration layer while composing specialized animation, visualization, and interactive graphics libraries instead of relying on Remotion primitives alone.
---

# Remotion Production Workflow

A production Skill for deterministic video and motion composition. Remotion owns the React-based timeline, rendering pipeline, asset lifecycle, and composition structure. Specialized libraries provide domain-specific visual capabilities.

## Scope

Use when the task asks to:

- create programmatic videos or motion graphics
- build reusable video compositions
- render data-driven animations
- combine UI systems with video production
- create educational, product, or cinematic motion sequences

Do not use as a replacement for ordinary Web UI animation. Compose with `ui-design`, `ui-motion`, `frontend-slides`, or visualization Skills when the output is not primarily video.

## Core architecture

```text
Creative intent
      ↓
Composition planning
      ↓
Remotion timeline / React composition
      ↓
Specialized visual layers
      ├─ D3.js       data visualization
      ├─ Three.js    3D scenes, shaders, WebGL
      ├─ GSAP        complex timeline choreography
      ├─ Anime.js    lightweight procedural motion
      ├─ Popmotion   physics and value animation
      ├─ Framer Motion React motion primitives
      ├─ Rive        interactive vector state machines
      ├─ Lottie      reusable design animations
      ├─ CSS Keyframes browser-native effects
      ├─ WAAPI       imperative animation control
      ├─ Flubber     SVG morphing
      └─ Canvas      custom raster rendering
      ↓
Frame verification
      ↓
Deterministic export
```

## Library selection

Choose the smallest mechanism that owns the visual problem:

| Need | Primary mechanism |
|---|---|
| Timeline composition | Remotion |
| Charts and quantitative graphics | D3.js + Remotion |
| 3D scenes | Three.js + Remotion frame control |
| Advanced sequencing | GSAP + Remotion |
| Small procedural effects | Anime.js |
| Physics values | Popmotion |
| React component motion | Framer Motion |
| Designer-authored interactive assets | Rive / Lottie |
| Simple browser animation | CSS Keyframes / WAAPI |
| SVG shape transitions | Flubber |
| Pixel effects and particles | Canvas |

Do not introduce multiple animation engines for the same responsibility without a documented reason.

## Production workflow

### 1. Analyze the composition

Define:

- narrative structure
- scenes and transitions
- frame budget
- asset sources
- typography system
- motion language
- rendering constraints

### 2. Build the Remotion foundation

Use Remotion for:

- compositions
- sequences
- frame-based state
- rendering parameters
- reusable scene components

Avoid placing every effect directly in React state. Time-dependent behavior should be derived from the current frame.

### 3. Add specialized layers

Examples:

```text
Product video
├─ Remotion timeline
├─ Framer Motion UI overlays
├─ Lottie illustrations
└─ GSAP camera choreography

Data story
├─ Remotion timeline
├─ D3 scales and layouts
├─ Canvas particles
└─ Flubber transitions

3D showcase
├─ Remotion timing
├─ Three.js scene
└─ GSAP camera movement
```

### 4. Verify rendering

Check:

- frame consistency
- deterministic output
- font loading
- asset availability
- motion readability
- export resolution
- performance during rendering

## Quality gates

Avoid:

- using Remotion as a replacement for every animation library
- mixing independent timelines without synchronization
- non-deterministic random effects without seeded values
- animation libraries that duplicate existing project capabilities
- ignoring reduced-motion requirements for shared UI assets

## Output contract

Return:

```text
Composition:
Timeline:
Visual engines:
Synchronization strategy:
Rendering verification:
```

## Composition rules

This Skill composes with:

- `ui-design` for interface hierarchy
- `ui-motion` for interaction motion principles
- `frontend-architecture` for application integration
- `frontend-slides` for presentation rendering
- `svg-animation` for vector animation

The goal is not a Remotion-only workflow. The goal is a compositing system where Remotion coordinates time and specialized tools solve specialized visual problems.
