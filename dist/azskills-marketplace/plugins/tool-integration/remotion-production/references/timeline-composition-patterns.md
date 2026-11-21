# Timeline and Composition Patterns

## Purpose

Use this reference when a production needs explicit scene timing, nested composition, transitions, reusable scenes, or deterministic frame budgeting.

## Global and local frame spaces

Use one global timeline:

    global frame
       ↓
    scene start
       ↓
    scene-local frame

A reusable scene should normally operate on local frame 0…duration-1. The parent composition decides where it appears.

This makes scenes reusable and easier to preview.

## Scene contract

A scene should have an explicit contract:

    id:
    durationInFrames:
    inputs:
    entry:
    exit:
    audio cues:
    visual layers:

Avoid hiding major timing decisions inside unrelated visual components.

## Sequence pattern

Use Sequence when a child needs:

- a local start offset
- a finite lifetime
- nested timing
- explicit pre/post-mount behavior

Keep the semantic rule visible:

    Scene starts at F
    Child starts at local frame 0
    Absolute position = F + local frame

Nested sequences are valid, but excessive nesting makes temporal reasoning difficult. Collapse layers that do not express an actual timing boundary.

## Sequential scenes

For:

    Intro → Problem → Demo → Result

keep a single ordered scene map and derive starts from declared durations rather than duplicating magic frame numbers.

Useful pattern:

    scene durations
    → cumulative starts
    → Sequence boundaries

This also makes duration changes less error-prone.

## Parallel layers

For a scene containing:

    background
    content
    annotation
    particles
    audio

treat each as a layer with an explicit lifetime. Parallelism should be intentional, not an accident of component nesting.

## Transitions

A transition has:

    source scene
    overlap range
    presentation
    destination scene

Define the overlap explicitly.

Do not solve every transition with a crossfade. Use movement, masking, geometry continuity, or hard cuts when they better communicate the scene relationship.

## Premounting

Use premounting when expensive or asynchronous content benefits from preparation before it becomes visible.

Do not rely on implicit defaults for critical timing. Set the relevant mount behavior explicitly when the scene depends on it.

Use premounting to protect startup reliability, not to hide slow rendering work indefinitely.

## Freezes and holds

A hold is a legitimate timing unit.

Examples:

    build → hold → explain → exit

Do not compress informational pauses merely to reduce duration. The required reading time is part of the frame budget.

## Frame budgeting

Budget the timeline before adding effects.

For a scene:

    entry
    + comprehension
    + action
    + transition
    = scene duration

For data visualization, allocate frames for:

    orient
    → reveal
    → compare
    → annotate
    → conclude

## Marking important frames

Keep a small list of verification frames:

    first frame
    scene boundaries
    major visual reveal
    caption changes
    audio cues
    final frame

These become the smoke-test sample set for preview rendering.

## Timing utilities

Keep reusable timing calculations pure:

    timing(progress)
    → value

Prefer functions that accept explicit frame inputs rather than reading mutable external clocks.

## Anti-patterns

Avoid:

- duplicated hard-coded scene start frames
- local components silently assuming global frame numbers
- a second timeline inside an animation library
- transitions whose overlap is not represented in scene timing
- content that becomes visible before its async dependencies are ready
- changing duration and manually repairing dozens of frame literals
