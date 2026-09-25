---
name: remotion-production
description: Build deterministic programmatic video, motion graphics, data stories, 3D showcases, and UI showcases by using Remotion as the timeline and rendering coordination layer and composing specialized visual systems for data, 3D, choreography, authored assets, vector geometry, and custom raster effects.
---

# Remotion Production Workflow

A production Skill for AI-assisted, code-driven visual production. Remotion owns the composition contract, timeline, frame state, scene orchestration, media synchronization, and final rendering boundary. Specialized systems solve specialized visual problems without becoming competing time authorities.

This Skill is a workflow contract, not a copy of Remotion documentation and not a requirement to use every listed visual technology.

## Scope

Use this Skill when the primary deliverable is a rendered visual artifact such as:

- programmatic video
- motion graphics
- data-driven video or animated chart
- product or UI showcase video
- 3D product or scene showcase
- educational or explainer sequence
- social-media video variant
- templated or parameterized video generation
- mixed-media composition containing UI, SVG, Canvas, WebGL, audio, captions, and authored animation assets

Compose it with other Skills when the task has a separate responsibility:

- ui-design → interface hierarchy, states, accessibility, and product UI semantics
- ui-motion → Web UI motion language that must be adapted into a video-safe frame model
- frontend-architecture → application/runtime architecture around a Remotion-based product
- frontend-slides → HTML presentation structure or slide art direction; Remotion owns the render only when the requested deliverable is video
- svg-animation → SVG-specific construction, optimization, accessibility, and standalone animation
- design-intelligence.md → shared visual reasoning, hierarchy, composition, typography, color, motion, accessibility, and visual QA
- ultrathink → unusually difficult decomposition, trade-off analysis, or architecture work

## When not to use

Do not activate this Skill as the primary owner when:

- the output is an ordinary interactive Web UI → use ui-design / ui-motion
- the output is a standalone SVG asset → use svg-animation
- the output is a fixed-stage HTML presentation rather than a video → use frontend-slides
- the task is only about backend, persistence, or non-visual infrastructure
- the requested visual can be produced as a static image and no time-based deliverable is required

A project containing React does not automatically make Remotion the right tool.

## Precedence

Apply rules in this order:

1. explicit user requirements
2. existing project architecture and supported runtime
3. asset licensing and delivery constraints
4. deterministic rendering requirements
5. this Skill
6. design-intelligence.md shared visual reasoning
7. specialized reference files selected by the workflow

Do not replace an existing project animation or rendering system merely because a library appears in the engine matrix.

## Core operating model

Treat the production as a layered system:

    Creative intent
          ↓
    Deliverable contract
          ↓
    Storyboard / scene graph
          ↓
    Remotion composition graph
          ↓
    Frame-driven visual layers
          ├─ Data → D3.js
          ├─ 3D → Three.js / React Three Fiber
          ├─ Choreography → GSAP or another verified adapter
          ├─ Physics values → Popmotion
          ├─ Procedural effects → Anime.js
          ├─ React motion primitives → Framer Motion when frame-resolvable
          ├─ Authored animation → Lottie / Rive
          ├─ Geometry morphing → Flubber
          ├─ Custom raster effects → Canvas
          └─ Browser-native effects → CSS / WAAPI only when deterministic
          ↓
    Media / audio / captions
          ↓
    Preview + frame QA
          ↓
    Final render
          ↓
    Delivery variants

The central invariant is:

    Remotion frame → visual state → rendered pixels

Do not allow an uncontrolled wall-clock animation to become the authoritative source of time for a rendered composition.

## Decision framework

### 1. Identify the deliverable

| Deliverable | Primary route |
| :--- | :--- |
| Programmatic video | Remotion production |
| Data story / chart video | Remotion + D3.js |
| 3D showcase | Remotion + Three.js / React Three Fiber |
| Product/UI showcase | Remotion + ui-design |
| Motion-design sequence | Remotion + ui-motion concepts + selected engine |
| Authored vector animation | Remotion + Lottie or Rive |
| SVG morph story | Remotion + Flubber / svg-animation |
| High-frequency particles or pixel effect | Remotion + Canvas |
| Interactive Web UI | ui-design / ui-motion, not Remotion by default |
| HTML slide deck | frontend-slides, with Remotion only if a video export is actually required |

### 2. Identify the dominant visual problem

Ask:

    Is the hard problem time?
    data?
    3D?
    choreography?
    authored asset playback?
    geometry interpolation?
    raster drawing?
    UI semantics?

Remotion owns time and composition. The answer to the second question determines the specialized layer.

### 3. Prefer one owner per concern

A production should have:

- one timeline authority
- one data-layout authority per chart family
- one 3D scene authority
- one primary choreography mechanism per scene
- one asset playback mechanism per authored asset type

Adding a second engine requires an explicit responsibility boundary. Do not stack libraries merely because their feature lists overlap.

## Production workflow

### Phase 0 — Establish the deliverable contract

Record:

    Purpose:
    Audience:
    Channel / surface:
    Aspect ratio:
    Width × height:
    FPS:
    Target duration:
    Audio:
    Captions:
    Required assets:
    Data inputs:
    Dynamic inputs:
    Output codec / image format:
    Variants:

Do not start implementation until the timebase, dimensions, and output expectations are sufficiently known.

### Phase 1 — Storyboard and scene graph

Turn the brief into scenes before writing implementation code.

For each scene define:

    scene id
    purpose
    start / end frame
    visual layers
    entry / exit behavior
    data inputs
    asset inputs
    audio relationship
    transition to next scene

Use scene-local time for reusable scenes and make the conversion to global time explicit.

### Phase 2 — Composition architecture

Create a small composition graph instead of one monolithic component.

Separate:

    Composition
      ↓
    Scene
      ↓
    Visual layer
      ↓
    Pure geometry / timing calculation

Keep business/data normalization outside presentational components where practical.

Use calculateMetadata() when duration, dimensions, FPS, or resolved props depend on input data. Keep the returned values JSON-serializable and deterministic.

### Phase 3 — Timeline construction

Choose the smallest composition primitives that explain the scene:

- Sequence for local timeline offsets and lifetimes
- sequential composition helpers when scenes should run one after another
- explicit frame math for reusable motion functions
- transitions for cross-scene visual handoff
- explicit premount/postmount where asynchronous media requires preparation

Prefer local frame math inside reusable scene components. Pass the absolute frame explicitly only when a child genuinely needs global timeline context.

### Phase 4 — Motion model

For every time-varying property, identify:

    value
    ↓
    start frame
    ↓
    end frame
    ↓
    easing / spring model
    ↓
    clamp / extrapolation rule
    ↓
    reduced-motion or static fallback when relevant

Prefer frame-resolved values over effects that depend on playback time.

Use springs for physical continuity or parameterized response, not as the default replacement for every interpolation.

Use motion tokens from the host design system when a product identity already exists. Do not invent a second timing vocabulary just for the video.

### Phase 5 — Specialized visual engines

Attach an engine only after the visual responsibility is clear.

Examples:

    Data narrative
    → D3 scales / layouts
    → SVG or Canvas layer
    → Remotion frame controls progression

    3D product reveal
    → Three.js / React Three Fiber
    → Remotion-controlled scene state
    → optional camera choreography

    UI showcase
    → existing UI components
    → ui-design hierarchy
    → frame-driven emphasis / transitions
    → Remotion scene orchestration

    Authored animation
    → Rive / Lottie asset
    → deterministic timeline placement
    → Remotion scene boundary

### Phase 6 — Asset pipeline

Inventory assets before final render:

- fonts
- logos
- icons
- photographs
- illustrations
- video clips
- audio
- captions
- 3D models / textures
- external data

Prefer stable local or explicitly cached sources for render-critical assets. Record source and license provenance when a project requires it.

Do not rely on a remote resource whose availability can change between preview and render unless the task explicitly requires live data and the failure mode is handled.

### Phase 7 — Audio and captions

Treat audio as a first-class timeline layer:

    narration
    music
    SFX
    ducking / volume automation
    caption timing
    scene boundaries

Align spoken words, captions, and visual beats using the same frame model.

For captions, convert transcript timestamps into composition frames once and render the caption pages from deterministic frame ranges.

### Phase 8 — Preview verification

Before a full render, inspect representative frames:

- first frame
- scene opening
- motion midpoint
- major transition
- typography-heavy frame
- highest-density data frame
- 3D peak-complexity frame
- caption / audio transition
- final frame

Use single-frame or sampled-frame renders to detect composition and timing errors early.

### Phase 9 — Final render

Use the simplest rendering path that satisfies the deliverable.

For normal final video rendering, prefer renderMedia() or the corresponding CLI path. Use renderStill() for frame-level visual checks and renderFrames() only when individual frame output or frame-level processing is genuinely required.

Tune concurrency from measured CPU and memory behavior rather than guessing. Lower concurrency may be required for memory-heavy WebGL or large-media scenes.

### Phase 10 — Delivery and variants

A finished production should identify:

    master composition
    render settings
    output location
    generated variants
    asset provenance
    known limitations
    verification status

When multiple aspect ratios or channels are required, treat them as explicit composition variants rather than manually editing a single output after rendering.

## Timeline and determinism rules

### Frame is the source of truth

Use the current Remotion frame as the authoritative time value.

A valid adapter transforms:

    frame → normalized progress → engine parameters

An invalid adapter lets a separate animation clock determine the output and hopes the capture happens at the same time.

### Avoid wall-clock APIs in render-critical paths

Be cautious with:

- requestAnimationFrame
- setTimeout / setInterval used as an animation clock
- imperative play() / resume() loops
- CSS animations whose progress is not explicitly controlled
- WAAPI timelines that advance independently
- Three.js useFrame() loops in deterministic Remotion rendering

When such an API is unavoidable, isolate it to a non-authoritative preview path or replace it with frame-seeking / frame-derived state for the rendered path.

### Seed randomness

Randomized visuals must be reproducible.

Use stable seeds derived from composition data, scene identity, or another explicit deterministic input. Never let an unseeded random source alter rendered geometry between frames.

### Keep calculations pure where practical

Prefer:

    (props, frame, config) → visual state

over:

    mount → mutate external object → wait → render

Pure calculations make preview, scrubbing, rerendering, and frame-level QA more reliable.

## Scene architecture rules

A maintainable project normally separates:

    src/
    ├── compositions/
    ├── scenes/
    ├── components/
    ├── visuals/
    ├── timing/
    ├── data/
    ├── assets/
    └── Root.tsx

This is a guideline, not a mandatory directory tree.

Use:

- compositions/ for renderable composition contracts
- scenes/ for narrative units with local timing
- components/ for reusable UI/presentation primitives
- visuals/ for domain renderers such as charts or 3D
- timing/ for pure interpolation, sequencing, and motion calculations
- data/ for normalized input models
- assets/ for project-local render inputs

Do not force this structure onto a tiny one-scene experiment.

## Animation engine policy

Read references/animation-engine-selection.md before introducing a non-Remotion animation engine.

The policy is:

1. Remotion owns composition time.
2. The specialized engine owns only the visual problem it is better suited to solve.
3. The adapter must be frame-resolvable.
4. The integration must survive scrubbing and repeated rendering.
5. If the engine cannot satisfy those constraints, do not use it for the render-critical path.

Current first-party Remotion integrations exist for technologies including GSAP, Lottie, Rive, and Three.js. Other libraries may require a frame-adapter pattern or may be better treated as conceptual influences rather than live animation clocks.

## Data visualization mode

For data-driven videos:

    Raw input
      ↓
    schema validation / normalization
      ↓
    D3 scales / layout / geometry
      ↓
    stable visual model
      ↓
    frame-driven reveal / emphasis
      ↓
    Remotion scene

Do not recalculate expensive layouts unnecessarily on every render frame when the layout itself is static across time.

Separate:

- data transformation
- geometry calculation
- animation state
- visual rendering

For streaming or live data, define a snapshot boundary before rendering so the output remains reproducible.

## 3D mode

Treat 3D as a render layer, not a second timeline.

Prefer declarative frame-driven state. For Remotion's React Three Fiber integration, use the supported Remotion three integration and keep animation state derivable from useCurrentFrame().

Do not make useFrame() or an internal renderer clock the authority of the rendered animation.

Before delivery verify:

- model and texture availability
- explicit camera state
- deterministic animation state
- lighting stability
- WebGL resource disposal
- renderer configuration required by the deployment path
- peak frame memory and render time

## UI showcase mode

A UI showcase is not ordinary UI implementation plus a video wrapper.

Use:

    ui-design
       ↓
    interface hierarchy / states / responsive intent
       ↓
    remotion-production
       ↓
    camera, emphasis, cursor focus, scene timing, playback, render

Do not distort the UI purely to make the animation easier.

Preserve recognizable product semantics and use motion to communicate:

- where attention should move
- how a state changes
- how a workflow progresses
- where controls are located
- which element is causally responsible for the change

Use static or reduced-motion variants where the underlying UI artifact will also be reused interactively.

## Motion design mode

For title sequences, kinetic typography, shape systems, transitions, particles, and abstract motion:

1. establish a small motion vocabulary
2. define reusable timing primitives
3. define spatial relationships before effects
4. choose one primary choreography mechanism per scene
5. keep visual rhythm aligned to the soundtrack when audio exists
6. reserve ornamental effects for moments where they communicate structure or tone

Do not turn every scene into an effects showcase.

## Audio-video production mode

Read references/audio-video-production.md for detailed guidance.

Keep these boundaries explicit:

    video timing
    audio timing
    caption timing
    data timing

They may share frame coordinates, but each must retain an inspectable source of truth.

When audio is authoritative, derive cue frames from its metadata and keep those derived values immutable for a given render.

## Asset and licensing mode

Read references/asset-pipeline.md before finalizing external assets.

For each render-critical external resource record:

    asset
    source
    license / usage basis
    localization requirements
    expected dimensions / duration
    fallback

Do not copy third-party source text, examples, assets, or generated material into a Skill merely because the integration is documented upstream.

## Performance engineering

Read references/render-performance.md for the detailed performance loop.

Use this model:

    measure
      ↓
    identify the slowest frame / layer
      ↓
    remove redundant work
      ↓
    reduce asset or GPU pressure
      ↓
    tune concurrency
      ↓
    measure again

Do not optimize by habit.

Common pressure points include:

- large image decode and scaling
- high-resolution Canvas drawing
- large D3 datasets
- WebGL textures / models / post-processing
- repeated DOM measurement
- excessive concurrent render processes
- expensive async asset acquisition
- unnecessarily long mounted scene trees

## Quality gates

### Contract gate

Before implementation verify:

- primary deliverable is actually video or another rendered time-based artifact
- aspect ratio, FPS, dimensions, and duration are defined or intentionally dynamic
- each scene has a timing owner
- visual engines have non-overlapping responsibilities
- project architecture does not conflict with the selected stack

### Determinism gate

Verify:

- frame-driven animation state
- no unseeded randomness in render-critical code
- no uncontrolled wall-clock timeline
- dynamic metadata resolves consistently
- external data is snapshotted or intentionally live with a documented fallback
- repeated renders do not change the visual state unexpectedly

### Visual gate

Inspect:

- composition hierarchy
- typography and text wrapping
- safe areas
- transitions
- clipping / overflow
- color and contrast
- asset sharpness
- data-label readability
- 3D artifacts
- visual rhythm

### Temporal gate

Inspect:

- first frame
- final frame
- scene boundaries
- transition overlaps
- hold durations
- motion acceleration / deceleration
- caption synchronization
- audio cue alignment
- repeated playback / scrubbing behavior

### Performance gate

Measure when the project is non-trivial:

- render duration
- slowest frames
- peak memory
- concurrency
- asset load time
- WebGL or Canvas pressure
- output size

Optimize only after identifying the limiting factor.

### Delivery gate

Before final output verify:

- correct composition ID
- correct output dimensions
- correct FPS
- expected duration
- output codec / format
- audio presence and sample rate when relevant
- captions included when required
- all expected variants generated
- assets available in the delivery environment
- known limitations documented

## Failure handling

When a render fails, classify the failure before changing code:

    composition / metadata
    → asset loading
    → timing / synchronization
    → browser / WebGL
    → memory / concurrency
    → encoding
    → delivery packaging

Do not respond to a render failure by randomly replacing animation libraries.

When a visual mismatch appears:

1. identify the frame
2. identify the scene
3. identify the authoritative state
4. compare intended vs rendered value
5. fix the earliest incorrect state in the chain

## Output contract

For implementation or production planning, return:

    Deliverable:
    Composition(s):
    Scene architecture:
    Timeline model:
    Visual engines:
    Animation-engine boundaries:
    Data / asset inputs:
    Audio / caption plan:
    Synchronization strategy:
    Rendering strategy:
    Verification performed:
    Known limitations:
    Delivery outputs:

For a review-only request, return findings grouped by:

    Contract
    Timeline
    Visual systems
    Synchronization
    Assets / media
    Performance
    Delivery

## Progressive-disclosure references

Read only the references relevant to the task:

| Reference | Use when |
| :--- | :--- |
| timeline-composition-patterns.md | scene timing, nested sequences, transitions, pre/post-mounting, frame budgeting |
| react-video-architecture.md | project structure, composition boundaries, props, dynamic metadata |
| animation-engine-selection.md | choosing or rejecting D3/Three/GSAP/Anime.js/Popmotion/Framer Motion/Rive/Lottie/CSS/WAAPI/Flubber/Canvas |
| asset-pipeline.md | fonts, images, video, audio, SVG, 3D models, external sources, provenance |
| render-performance.md | render speed, memory, concurrency, WebGL/Canvas pressure, frame sampling |
| audio-video-production.md | narration, music, SFX, captions, A/V synchronization |
| ai-video-workflow.md | AI-assisted brief → storyboard → scene graph → implementation → review |
| production-checklist.md | final preflight and delivery verification |
| visual-engine-matrix.md | quick engine comparison and composition posture |

Do not read every reference by default. Progressive disclosure is part of the Skill contract.

## Cross-Skill composition

The normal combinations are:

    Programmatic video
      → remotion-production

    UI showcase
      → ui-design
      → remotion-production
      → optionally ui-motion for motion language

    Data story
      → remotion-production
      → D3.js visual layer

    3D showcase
      → remotion-production
      → Three.js / React Three Fiber

    SVG-heavy motion
      → remotion-production
      → svg-animation

    Presentation-to-video
      → frontend-slides
      → remotion-production only when video rendering is required

    Difficult production architecture
      → ultrathink
      → remotion-production

design-intelligence.md remains a shared reasoning layer. It should not be duplicated inside these references.
