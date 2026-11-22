# Audio and Video Production

## Purpose

Use this reference for narration, music, sound effects, source video, caption timing, and audiovisual synchronization.

## Shared timebase

All audiovisual cues should ultimately resolve to Remotion frames:

    timestamp / duration
    → frame conversion
    → scene timeline
    → render

Use one FPS value for the composition when converting cue timings.

## Audio layers

Treat:

    narration
    music
    SFX
    ambient

as separate layers even when they are exported together.

For each layer record:

    start frame
    trim
    duration
    volume
    playback rate
    loop
    fade
    ducking relationship

## Narration-first workflow

When voiceover is authoritative:

1. obtain or lock the narration
2. resolve its duration
3. segment the transcript into cues
4. convert cue timestamps into frames
5. design scenes around the spoken rhythm
6. generate captions from the same cue model
7. render and review A/V alignment

Do not manually move visuals after caption generation without regenerating cue positions.

## Music

Music supports pacing but should not silently become the master timeline unless the project explicitly defines it that way.

Define:

- intro point
- beat or cue markers
- intensity changes
- loop strategy
- fade in / fade out
- ducking around narration

Do not cut visuals to arbitrary waveform peaks without checking whether the musical structure actually improves the scene.

## Sound effects

SFX are best tied to explicit interaction or visual events:

    visual event
    → cue frame
    → SFX

Do not scatter decorative SFX across every transition.

## Source video

For source video embedded in a composition, record:

    source
    start
    trim
    playback rate
    loop
    volume

Verify that the first visible source-video frame aligns with the intended scene frame.

## Captions

Use one normalized caption model:

    text
    start time
    end time
    speaker / emphasis metadata when needed

Convert timestamps to frames once.

Build caption pages from explicit frame ranges rather than a free-running caption timer.

For readability, verify:

- safe area
- line length
- contrast
- localization expansion
- overlap with UI
- punctuation and timing

## Audio-reactive visuals

Audio-reactive effects should use a precomputed or deterministically sampled representation of the audio.

Prefer:

    frame
    → audio sample / envelope / spectrum
    → visual value

over a live analyser that advances independently during rendering.

## A/V quality gates

Verify:

- no drift between audio and video
- narration begins / ends at intended frames
- captions track narration
- music ducking occurs at expected cues
- SFX land on the intended visual event
- source video trim and playback are correct
- output contains the expected audio stream and sample characteristics

## Anti-patterns

Avoid:

- two independent FPS conversions
- caption timings maintained separately from narration
- free-running Web Audio analysis controlling render-critical visuals
- audio edits that invalidate scene timings without recomputing the scene map
- using music alone as a substitute for storyboard timing
