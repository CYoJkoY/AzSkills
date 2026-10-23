---
name: frontend-slides
description: Build or convert fixed-stage 1920x1080 HTML presentations with a deliberate visual thesis, readable density, authored assets, and rendered slide QA. Use for new decks, PowerPoint conversion, and existing HTML deck refinement.
version: 2.0.0
status: canonical
family: production
modes: [new, convert, enhance]
---

# Frontend Slides

Turn source content into a fixed-stage HTML presentation that reads as one
designed argument. This Skill owns deck narrative, stage geometry, typography,
layout, authored visual assets, and rendered slide QA. It does not own video
production or general application UI.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task needs a new HTML deck, a PowerPoint-to-HTML conversion, or a substantial visual rebuild of an existing deck.
- Do not use when: the output is a video (`remotion-production`), a product interface (`ui-design`), or a single static document.
- Owns: narrative structure, fixed-stage composition, slide density, typography, color, imagery, deck-level motion placement, and slide-level verification. Motion mechanism, timing, interruption, and motion gates belong to `ui-motion`.
- Inputs: source content, audience, occasion, duration, brand or design contract, required assets, and delivery format.
- Outputs: self-contained HTML deck, converted deck, PDF/PNG export when requested, and rendered verification.
- Compose with: `design-system` when a DESIGN.md governs the deck; `ui-motion` for slide transitions; `logo-generator` for identity assets.
- Gates: every slide fits 1920x1080 without overflow; the narrative is legible without narration; text, contrast, and assets are verified in rendered output.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `new` | Content must become a new deck | Narrative, thesis, composition, build, render QA | HTML deck |
| `convert` | PowerPoint or outline must become HTML | Extract, normalize, restyle, verify | HTML deck plus source map |
| `enhance` | Existing deck needs visual or structural repair | Audit, rank, smallest change, verify | Revised deck |

## Fixed-stage contract

- Stage: 1920x1080, one slide per viewport, no vertical page scroll during presentation.
- Delivery: one self-contained HTML file with inline CSS and local or embedded assets unless the project requires a build.
- Navigation: keyboard arrows, space, Home, End, and a visible progress or slide index.
- Print/export: deterministic slide boundaries; no clipped content in PDF or PNG.
- Fonts: self-host or use a documented fallback; never depend on a remote font at presentation time.
- Assets: local, licensed, and referenced from the deck; no hotlinked mystery images.

## Workflow

### 1. Establish the narrative

Write the argument before the slides:

```text
Audience:
Occasion and duration:
One-sentence thesis:
Three to five claims:
Evidence for each claim:
Desired ending action or understanding:
```

Remove slides that do not advance the argument. A deck is not a document with
page breaks.

### 2. Choose one visual thesis

State purpose, tone, constraint, and one or two signature ideas. Choose an art
direction from the subject and audience. AzSkills-owned narrative decks use
Wabi-Press as the default editorial direction when no stronger brief exists; it
is a default, not a mandatory skin. Interactive chrome uses the Workbench tokens
from `DESIGN.md`.

### 3. Build the slide system

Define before laying out individual slides:

```text
stage margins and safe area
type scale and measure
color roles
grid and alignment modes
title, body, quote, data, and image slide types
header, footer, page number, and source treatment
```

Use one grid and a small set of slide types. Variation comes from content and
composition, not from a new template on every page.

### 4. Set density

Default to one claim per slide and no more than three supporting points. Long
content becomes a sequence, a diagram, or a handout. Never shrink body text below
a readable presentation size to keep extra content on one slide.

### 5. Compose each slide

- Establish one focal point and a clear reading order.
- Use scale, space, and alignment before boxes and dividers.
- Keep text off busy image regions; use a solid or gradient scrim only when it preserves image meaning.
- Use real data and sources; never invent metrics, logos, or screenshots.
- Use charts only when the shape of the data matters; label axes and units.
- Keep one accent color for the primary signal and reserve it for what matters.

### 6. Add motion and interaction

Motion supports slide transition, reveal order, or a diagram relationship. It
does not run continuously in the background. Respect reduced motion. Keep
interactive demos optional and provide a static fallback.

### 7. Verify every slide

Render all slides at 1920x1080. Check overflow, clipping, font fallback, contrast,
image crop, alignment, page numbers, and source notes. Export a PDF or PNG set
when the delivery requires it and inspect the export, not only the browser.

## Quality gates

- [ ] The deck has one thesis and a clear claim sequence.
- [ ] Every slide advances the argument and fits the stage without clipping.
- [ ] Type, contrast, and measure are readable at presentation distance.
- [ ] Color roles are consistent; the accent marks one signal.
- [ ] Assets are local, licensed, and correctly cropped.
- [ ] Data, quotes, and sources are real and cited.
- [ ] Motion is purposeful, optional, and reduced-motion safe.
- [ ] Keyboard navigation and slide index work.
- [ ] The HTML file is self-contained enough to present offline.
- [ ] The rendered slides and export were inspected.

## Output contract

```text
Narrative thesis:
Visual direction:
Slide sequence:
Files and assets:
Rendered verification:
Export verification:
Unverified items:
```

For `convert`, also return a source-to-slide map and list any content that could
not be preserved.

## References

- `references/frontend-slides-guide.md` - detailed mode workflows, layout rules, image pipeline, and editing guidance.
- `DESIGN_SYSTEM.md` - deck design system and quality gate.
- `STYLE_PRESETS.md` - default art direction and token reference.
- `html-template.md` - stage shell and component markup.
- `animation-patterns.md` - slide and element motion patterns.
