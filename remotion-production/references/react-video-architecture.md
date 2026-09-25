# React Video Architecture

## Purpose

Use this reference when a Remotion project is large enough that composition, scene logic, visual rendering, data, and assets need explicit boundaries.

## Recommended boundary

    Root
     ↓
    Composition
     ↓
    Scene
     ↓
    Visual layer
     ↓
    Pure timing / geometry

The exact directories are flexible; the responsibility boundaries are not.

## Reference structure

    src/
    ├── compositions/
    ├── scenes/
    ├── components/
    ├── visuals/
    ├── timing/
    ├── data/
    ├── assets/
    └── Root.tsx

### compositions/

Own:

- Composition registration
- render dimensions
- FPS
- default props
- dynamic metadata
- composition-specific output defaults

### scenes/

Own:

- narrative units
- local timing
- scene-level visual layers
- scene-specific data mapping

### components/

Own:

- reusable presentational primitives
- typography
- controls
- labels
- decorative primitives

Do not let generic components silently own the global timeline.

### visuals/

Own domain renderers such as:

- charts
- diagrams
- 3D scenes
- Canvas effects
- SVG visual systems

### timing/

Own pure utilities for:

- interpolation
- easing selection
- stagger calculations
- scene boundary math
- cue conversion

### data/

Own normalized data models. Keep fetching / parsing separate from frame rendering.

## Props as the composition API

Treat composition props as a stable API:

    validated input
    → normalized data
    → deterministic scene inputs
    → visual render

Prefer serializable props for render jobs.

Do not pass browser-only objects, open sockets, DOM nodes, or mutable runtime handles as composition data.

## Dynamic metadata

Use calculateMetadata() when metadata depends on input.

Typical use cases:

- duration from content length
- dimensions from a variant
- resolved props from fetched data
- composition-specific codec defaults

The metadata calculation should be deterministic and should not mutate global application state.

When remote data is involved, respect cancellation and make failure behavior explicit.

## State policy

Prefer:

    props + frame
    → derived visual state

over React state for values that should change purely because time advanced.

React state is still appropriate for:

- user interaction in the Studio / preview UI
- non-time-based application state
- setup state that is resolved before rendering

Do not use an interval to simulate timeline progression inside a composition.

## Data and rendering separation

Use:

    raw data
    → schema / normalization
    → visual model
    → frame-driven presentation

For example, chart geometry can be precomputed once while the reveal fraction remains frame-dependent.

This prevents data processing from becoming the frame bottleneck.

## Scene composition

A practical scene:

    Scene
    ├── background
    ├── primary content
    ├── annotation
    ├── decoration
    └── audio / caption cues

Keep these responsibilities explicit.

Avoid a 600-line component that simultaneously:

- fetches data
- chooses scene timing
- lays out charts
- starts animation libraries
- manages audio
- controls transitions
- decides output settings

## Shared visual components

A component is worth extracting when it has:

- repeated use
- a stable interface
- a clear visual responsibility
- predictable frame semantics

Do not abstract one-off fragments merely because they contain JSX.

## Composition variants

For:

- 16:9
- 9:16
- 1:1

prefer explicit variant parameters or separate composition contracts when layout logic materially differs.

Do not rely on a single responsive Web page to become three production-safe video compositions without validation.

## Testing architecture

Validate independently where practical:

    timing utilities
    → pure tests

    data transforms
    → fixture tests

    visual scenes
    → sampled frame renders

    full compositions
    → final render smoke test

## Anti-patterns

Avoid:

- global mutable timeline state
- setInterval() inside rendered components
- data fetching scattered across every scene
- browser APIs used as the render-time authority
- one component owning the whole video
- duplicated timing constants
- composition props whose shape changes unpredictably between renders
