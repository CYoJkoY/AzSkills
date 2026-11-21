# Render Performance

## Purpose

Use this reference when the render is slow, memory-heavy, unstable, or contains complex WebGL, Canvas, media, or data layers.

## Performance loop

    measure
    ↓
    find slow frame / layer
    ↓
    identify dominant resource
    ↓
    change one variable
    ↓
    render again
    ↓
    compare

Do not optimize from intuition alone.

## First diagnostics

Record:

    composition:
    resolution:
    fps:
    duration:
    total render time:
    slowest frames:
    peak memory:
    concurrency:
    media / WebGL / Canvas usage:

A 10-second 30 FPS video is only 300 frames, but a high-resolution 3D scene can make each frame expensive. Frame count alone is not a performance model.

## Frame sampling

Before full renders, sample representative frames:

- frame 0
- first frame of every scene
- one dense frame
- one 3D-heavy frame
- one media-heavy frame
- one caption-heavy frame
- last frame

Use renderStill() or frame sampling through the renderer / CLI.

## Render path

For final video:

- prefer renderMedia() for a single integrated media render
- use renderStill() for still validation
- use renderFrames() when individual image frames or explicit frame-level processing are required

Avoid building a custom frame-stitching pipeline unless the deliverable requires it.

## Concurrency

Concurrency is a resource allocation decision.

More concurrent render work can improve throughput when CPU and memory permit it.

Too much concurrency can increase:

- memory pressure
- browser process contention
- asset duplication
- WebGL instability
- total render time

Tune it using measured results.

For memory-bound compositions, reduce concurrency before rewriting visual code.

## Parallel encoding

When output memory is constrained, disabling parallel encoding may reduce memory pressure at the expense of speed.

Treat this as a measured rendering configuration, not a universal default.

## CPU-heavy layers

Common CPU pressure:

- large D3 data transforms
- repeated SVG path work
- expensive text measurement
- image processing
- large JSON parsing
- repeated geometry generation

Prefer precomputation when the result does not change with frame.

## Canvas

For Canvas:

- avoid unnecessary redraws
- keep coordinate transforms stable
- avoid allocating large arrays on every frame
- cap particle count to the visual requirement
- match canvas resolution to actual output needs
- profile fill rate for full-screen effects

Do not use a high-density particle field when the same visual language can be achieved with fewer elements.

## WebGL / Three.js

For 3D:

- reuse geometries and materials when appropriate
- control texture dimensions
- avoid unnecessary post-processing passes
- limit shadow complexity to what is visually needed
- dispose resources correctly
- verify renderer settings for the target environment

Do not optimize away necessary visual fidelity without confirming the actual bottleneck.

## DOM and typography

For DOM-heavy scenes:

- avoid repeated synchronous layout measurement
- reuse stable dimensions
- do not measure every text node every frame
- avoid unnecessary component remounting
- keep hidden scene trees bounded

Typography can become a performance issue when the composition contains thousands of independently laid-out text nodes.

## Data visualization

For D3-heavy scenes:

    static dataset
    → compute scales / geometry once
    → animate visibility / emphasis from frame

Do not rebuild all scales, paths, and labels on every frame unless the data or viewport actually changes.

## Async rendering

When using asynchronous assets or metadata:

- keep timeouts explicit
- use cancellation where the API supports it
- make retries intentional
- fail clearly on mandatory resources

Do not increase timeout values indefinitely to mask a resource pipeline problem.

## Performance quality gate

A non-trivial composition should have:

    known render settings
    known concurrency
    known slow-path
    known asset load behavior
    known peak memory risk

The final output should record any deliberate performance trade-off that materially affects delivery.
