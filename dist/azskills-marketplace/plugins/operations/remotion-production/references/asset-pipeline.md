# Asset Pipeline

## Purpose

Use this reference before implementing a production composition with external or large local assets.

## Asset inventory

Create an inventory before rendering:

| Asset class | Record |
| :--- | :--- |
| Font | family, weights, source, license, glyph coverage |
| Image | source, dimensions, crop, color space, license |
| Video | source, duration, FPS, audio, decode constraints |
| Audio | source, duration, sample rate, channels, license |
| SVG | source, viewBox, geometry assumptions, license |
| Lottie | asset version, animations, required features |
| Rive | artboard, animations / state machine, runtime features |
| 3D | model format, textures, materials, animation clips |
| Data | schema, snapshot time, provenance, refresh policy |

## Provenance

For each non-trivial external asset record:

    source:
    license / permission:
    attribution:
    local copy:
    version / revision:

Do not ship an asset merely because a URL is public.

## Render stability

Render-critical assets should preferably be:

    local
    or
    explicitly cached
    or
    otherwise guaranteed available to the render environment

Remote assets are acceptable when live retrieval is part of the requirement and failure is handled explicitly.

Do not depend on an unaudited remote font, image, model, or audio source for the only production path.

## Fonts

Font problems are visual correctness problems.

Verify:

- font loads before the frame is captured
- required weights exist
- fallback metrics are acceptable
- glyph coverage includes all supported locales
- text wrapping does not change unexpectedly
- captions and numbers use appropriate fonts

Prefer project-local or officially supported font loading mechanisms for deterministic rendering.

## Images

Before rendering:

- choose intended display dimensions
- avoid unnecessary upscaling
- remove accidental huge source dimensions when safe
- preserve aspect ratio intentionally
- define crop behavior
- verify transparent backgrounds

A 6000×4000 image used at 300×200 can become a decode and memory cost without improving the result.

## Video

For source video, record:

    start offset
    trim duration
    playback rate
    volume
    loop behavior

Use the Remotion media components and timing primitives appropriate to the current project.

Verify the first visible frame and transitions around every source clip.

## Audio

Audio assets should have explicit:

- start frame
- trim
- duration
- playback rate
- volume model
- loop behavior
- fade / ducking behavior

For narration, preserve word timing and do not move visuals independently after captions are generated without recomputing cue frames.

## SVG

Normalize geometry before runtime when necessary:

- viewBox
- coordinate system
- fill / stroke semantics
- path compatibility
- text-as-path assumptions

Do not perform expensive path normalization on every rendered frame.

## Lottie and Rive

Treat authored animation as an input asset.

Verify:

- the asset renders in the target path
- all required animation states exist
- playback duration is known
- external images / fonts are embedded or available
- the visible state at the scene boundary is correct

Do not assume editor preview parity without a rendered frame check.

## 3D assets

For GLTF / GLB or other 3D assets:

- keep texture resolution proportional to display size
- remove unused heavy assets where safe
- preload required resources intentionally
- verify camera clipping planes
- dispose resources when scenes are torn down where the integration requires it

## Data assets

For reproducibility, distinguish:

    live source
    snapshot
    derived dataset
    render fixture

A production render should consume a clearly identified snapshot or a deliberately live source with documented timing.

## Asset failure policy

When an asset cannot load:

1. fail loudly for mandatory assets
2. provide explicit fallback for optional assets
3. never silently replace a brand or legal asset with an arbitrary substitute
4. record the missing dependency in the final output

## Anti-patterns

Avoid:

- hotlinking critical fonts
- unaudited remote media
- huge images used at tiny dimensions
- hidden asset downloads inside individual visual components
- per-frame asset fetching
- inconsistent asset versions across scenes
- missing license / provenance records
