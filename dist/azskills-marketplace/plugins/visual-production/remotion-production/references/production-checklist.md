# Production Checklist

## Creative contract

- [ ] Purpose is explicit.
- [ ] Audience and channel are explicit.
- [ ] Duration is fixed or intentionally dynamic.
- [ ] Aspect ratio and resolution are defined.
- [ ] FPS is defined.
- [ ] Audio / captions requirements are defined.
- [ ] Required variants are listed.

## Storyboard and timeline

- [ ] Every scene has a purpose.
- [ ] Every scene has explicit timing.
- [ ] Local and global frame spaces are not confused.
- [ ] Transitions have explicit overlap ranges.
- [ ] Hold / reading time is sufficient.
- [ ] Important cue frames are identified.

## Architecture

- [ ] Composition boundaries are clear.
- [ ] Scene responsibilities are clear.
- [ ] Timing utilities are pure where practical.
- [ ] Data normalization is separated from rendering.
- [ ] Composition props are stable and serializable.
- [ ] Dynamic metadata has deterministic behavior.

## Animation engines

- [ ] Remotion owns the authoritative timeline.
- [ ] Each specialized engine has a single responsibility.
- [ ] No two engines control the same critical property without an explicit reason.
- [ ] Non-Remotion engines are frame-resolvable or isolated from render-critical timing.
- [ ] Randomness is seeded.
- [ ] Render-time browser clocks are not silently authoritative.

## Assets

- [ ] Fonts load reliably.
- [ ] Image dimensions are appropriate.
- [ ] Video trims and playback rates are verified.
- [ ] Audio sources are available.
- [ ] SVG geometry is normalized when needed.
- [ ] Lottie / Rive assets are verified in the render path.
- [ ] 3D models and textures are available.
- [ ] External asset provenance is recorded where required.

## Visual QA

- [ ] Frame 0 checked.
- [ ] Scene openings checked.
- [ ] Major transitions checked.
- [ ] Typography-heavy frames checked.
- [ ] Data-dense frames checked.
- [ ] 3D peak-complexity frames checked.
- [ ] Final frame checked.
- [ ] Safe areas checked.
- [ ] Contrast and readability checked.
- [ ] No clipping / unintended overflow.

## Temporal QA

- [ ] Motion enters and exits intentionally.
- [ ] Motion does not restart from stale state on scrubbing.
- [ ] Captions align with narration.
- [ ] SFX align with visual events.
- [ ] Source video is correctly trimmed and synchronized.
- [ ] Final duration matches the composition contract.

## Performance

- [ ] Render path has been measured.
- [ ] Slow frames or heavy layers are known.
- [ ] Concurrency is intentional.
- [ ] Peak memory risk is acceptable.
- [ ] WebGL / Canvas pressure is acceptable.
- [ ] Large assets are not decoded unnecessarily.

## Final delivery

- [ ] Final codec / format is correct.
- [ ] Output dimensions are correct.
- [ ] FPS is correct.
- [ ] Audio stream is present when required.
- [ ] Captions are included when required.
- [ ] All requested variants exist.
- [ ] Asset dependencies are deliverable.
- [ ] Known limitations are documented.
- [ ] Verification status is recorded.
