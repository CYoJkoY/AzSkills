---
name: remotion-production
description: Build deterministic programmatic video and motion graphics with Remotion as the single time authority, clear visual-engine ownership, audio and captions, frame QA, and reliable delivery. Use for rendered time-based artifacts.
version: 2.0.0
status: canonical
family: production
modes: [video, data, 3d, ui-showcase, motion, av]
---

# Remotion Production

Turn a time-based brief into a deterministic rendered artifact. Remotion owns the
composition graph, frame state, scene orchestration, media synchronization, and
render boundary. Specialized engines solve one visual problem each; none becomes
a second time authority.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: the primary deliverable is a rendered video, motion graphic, data story, 3D or UI showcase, or parameterized video.
- Do not use when: the output is an interactive interface (`ui-design`), a static slide deck (`frontend-slides`), or a standalone SVG (`ui-motion` svg mode).
- Owns: frame authority, scene graph, compositor boundaries, determinism, media synchronization, render QA, and delivery variants.
- Inputs: brief, aspect ratio, dimensions, FPS, duration, storyboard, assets, data, audio, captions, and delivery targets.
- Outputs: composition code, rendered video or image sequence, preview evidence, and a delivery manifest.
- Compose with: `ui-design` for UI semantics, `ui-motion` for motion language, `logo-generator` for identity assets, `ultrathink` for production architecture.
- Gates: every frame is deterministic; one owner controls time; frame, audio, and captions align; the final render and every variant are inspected.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `video` | Programmatic narrative or explainer | Remotion + DOM/SVG/CSS | Video |
| `data` | Charts or data-driven story | Remotion + D3 | Video |
| `3d` | Product or scene showcase | Remotion + Three.js or React Three Fiber | Video |
| `ui-showcase` | Product interface sequence | Remotion + `ui-design` | Video |
| `motion` | Motion-design or kinetic sequence | Remotion + selected engine | Video |
| `av` | Narration, music, captions, or mixed media | Remotion + audio pipeline | Video with audio and captions |

## Workflow

### 1. Lock the deliverable contract

```text
Purpose and audience:
Aspect ratio and dimensions:
FPS:
Duration or duration range:
Delivery codec and container:
Required variants:
Audio and caption requirements:
Safe areas and platform constraints:
```

A project containing React does not make Remotion the right tool. Confirm that
the deliverable is time-based and rendered.

### 2. Storyboard and scene graph

Write the sequence before code:

```text
scene -> purpose -> duration -> entry state -> exit state -> assets
```

Every scene has one job and one timing owner. Transitions belong to the scene
boundary, not to both neighbors.

### 3. Compose the timeline

- Use `useCurrentFrame()` and `useVideoConfig()` as the time source.
- Use sequences and series for scene structure; keep duration arithmetic explicit.
- Seed randomness; do not use unseeded `Math.random()` in render-critical paths.
- Snapshot external data or document a deterministic fallback.
- Avoid wall-clock animation, timers, or uncontrolled asynchronous state.
- Keep frame calculations pure where practical.

### 4. Assign one owner per visual concern

| Concern | Preferred layer |
| :--- | :--- |
| Time and composition | Remotion |
| Data geometry and scales | D3 |
| 3D scene | Three.js or React Three Fiber |
| Choreography | GSAP or a verified frame adapter |
| Authored vector playback | Lottie or Rive |
| Path morph | Flubber or SVG interpolation |
| Raster effects | Canvas |
| Simple browser-native motion | CSS or WAAPI only when deterministic |

Select the smallest engine that solves the problem. Do not add an engine for a
fade, a simple translate, or a capability the host already provides.

### 5. Build assets and media

- Keep fonts, images, video, audio, and 3D models local and licensed.
- Record source and license for every external asset.
- Normalize dimensions, color space, frame rate, and audio sample rate at ingest.
- Preload critical assets and provide deterministic fallbacks.
- Keep text as text when it must stay sharp; avoid baking copy into raster images.

### 6. Synchronize audio and captions

Place audio cues on the same frame timeline as visuals. Captions must be
time-stamped, readable, and safe-area aware. Check narration, music, sound
effects, and captions against scene boundaries. Provide a silent or captioned
variant when the delivery surface requires it.

### 7. Verify frames before the full render

Inspect the first frame, final frame, every scene boundary, transition overlap,
hold, caption, and audio cue. Render representative stills before the full video.
Check safe areas, clipping, text wrapping, color, contrast, and asset sharpness.

### 8. Render and measure

Measure render duration, slowest frames, peak memory, concurrency, asset load
time, and output size on a non-trivial project. Optimize the limiting factor, not
the most visible code.

### 9. Deliver and verify

Verify composition ID, dimensions, FPS, duration, codec, audio, captions, and all
variants. Inspect the actual output file, not only the preview. Record known
limitations and the environment used for the final render.

## Determinism rules

- Frame number is the only authoritative time input.
- Randomness is seeded and stable across renders.
- External data is snapshotted or has a documented fallback.
- Dynamic metadata resolves consistently.
- Repeated renders of the same input produce the same visual state.
- Any wall-clock or network-dependent path is isolated from render-critical code.

## Quality gates

- [ ] The deliverable is genuinely time-based and rendered.
- [ ] Aspect ratio, dimensions, FPS, duration, and codec are explicit.
- [ ] Every scene has one purpose and one timing owner.
- [ ] Every frame state is deterministic and reproducible.
- [ ] Each visual engine owns one concern and has a removal path.
- [ ] Assets are local, licensed, sharp, and correctly ingested.
- [ ] Audio and captions align with the frame timeline.
- [ ] Representative frames, boundaries, and transitions are inspected.
- [ ] Render performance is measured before optimization.
- [ ] The final file and every required variant are inspected.

## Output contract

```text
Deliverable and variants:
Composition and scene graph:
Timeline model:
Visual engines and boundaries:
Data and asset inputs:
Audio and caption plan:
Determinism evidence:
Render and performance evidence:
Delivery files:
Known limitations:
```

For review, group findings by contract, timeline, visual systems,
synchronization, assets, performance, and delivery.

## Failure handling

Classify a failed render before changing code: composition or metadata, asset
loading, timing or synchronization, browser or WebGL, memory or concurrency,
encoding, or packaging. For a visual mismatch, find the earliest incorrect state
in the frame chain and fix that state. Do not replace animation libraries at
random.

## References

- `references/production-guide.md` - full production workflow, specialized modes, and extended gates.
- `references/timeline-composition-patterns.md` - scene timing, sequences, transitions, and frame budgeting.
- `references/react-video-architecture.md` - project structure, composition boundaries, props, and metadata.
- `references/animation-engine-selection.md` - engine selection and rejection.
- `references/asset-pipeline.md` - fonts, images, video, audio, SVG, 3D, and provenance.
- `references/render-performance.md` - render speed, memory, concurrency, and frame sampling.
- `references/audio-video-production.md` - narration, music, sound, captions, and synchronization.
- `references/ai-video-workflow.md` - AI-assisted brief to storyboard to implementation.
- `references/production-checklist.md` - final preflight and delivery.
- `references/visual-engine-matrix.md` - engine comparison.
