# Animation Engine Selection

## Purpose

Use this reference before introducing a non-Remotion animation library into a rendered composition.

## Selection protocol

Answer these questions in order:

1. What visual property is changing?
2. Is the problem composition timing or visual behavior?
3. Does the project already have an equivalent mechanism?
4. Can the mechanism resolve from a Remotion frame?
5. Is there a first-party Remotion integration?
6. What does the engine add that simpler frame math cannot?
7. How will it be verified under scrubbing and repeated rendering?

If question 4 has no satisfactory answer, the library must not own render-critical time.

## Engine matrix

| Engine | Use for | Preferred posture | Avoid as |
| :--- | :--- | :--- | :--- |
| Remotion | scene timing and render orchestration | primary | — |
| D3.js | data transforms, scales, layouts | pure visual model | timeline engine |
| Three.js / R3F | 3D | @remotion/three, frame-driven | free-running clock |
| GSAP | sophisticated choreography | @remotion/gsap or explicit adapter | global competing timeline |
| Anime.js | compact procedural effects | isolated frame-controlled effect | long-lived playback clock |
| Popmotion | spring / physics / interpolation values | calculate from frame | independent animation runner |
| Framer Motion | React motion patterns | frame-resolvable component layer only | hidden browser master clock |
| Rive | authored vector animation | @remotion/rive | arbitrary external state machine timing |
| Lottie | authored animation | @remotion/lottie | unsupported features assumed without render test |
| CSS Keyframes | very simple browser effects | static / verified-only | authoritative video timeline |
| WAAPI | imperative browser effects | explicit frame-seekable integration only | independent document timeline |
| Flubber | SVG shape morphing | pure path interpolation | scene orchestration |
| Canvas | particles / raster effects | draw from frame | free-running animation loop |

## First-party integrations

When a first-party Remotion package exists, prefer its documented integration boundary over inventing a custom bridge.

Verified current examples include:

    @remotion/three
    @remotion/gsap
    @remotion/lottie
    @remotion/rive
    @remotion/media

The existence of an integration does not remove the need for scene-level determinism and render QA.

## Frame adapter pattern

For a library without a first-party frame-aware integration:

    const frame = useCurrentFrame();
    const progress = deriveProgress(frame);

    engine state
      = adapt(progress);

    render(engine state);

The engine should not independently decide what frame is currently being displayed.

## CSS and WAAPI caution

Browser animation systems advance against browser timelines. That can be appropriate for live interactive UI and still be the wrong authority for a rendered video.

For render-critical video behavior:

    frame
    → CSS values

is safer than:

    CSS animation starts
    → browser clock advances
    → renderer captures whatever happens to be current

Use CSS or WAAPI as a visual mechanism only when the captured result is deterministic and tested.

## GSAP pattern

Use GSAP when a scene contains genuine choreography that would be cumbersome to express as many independent frame interpolations.

Keep a single source of timing truth:

    Remotion frame
    → scene progress
    → GSAP timeline state
    → rendered scene

Do not combine a free-running GSAP timeline with independent Remotion frame interpolation on the same property.

## D3 pattern

D3 should normally produce:

    data
    → scales / geometry
    → SVG / Canvas

Remotion should produce:

    frame
    → reveal / emphasis / annotation state

Do not use D3 transitions as the authoritative video clock.

## Three.js pattern

Use the supported Remotion Three integration where appropriate.

During rendering, the 3D scene should be advanced from the requested frame. Avoid free-running render loops.

Verify:

- camera
- model transforms
- material state
- lighting
- post-processing
- texture decode
- renderer settings

## Authored assets

Rive and Lottie are best treated as authored assets inside the scene graph.

Document:

    asset
    artboard / animation / marker
    start frame
    duration
    playback rate
    fallback

Do not assume the asset's original interactive semantics are equivalent to deterministic video semantics.

## When to reject an engine

Reject a library when:

- the project already solves the same problem with less machinery
- the library requires an uncontrolled clock
- it introduces a competing timeline
- the feature used is unsupported or unstable in the target rendering path
- verification cannot establish deterministic output
- the dependency cost is not justified by a real visual requirement
