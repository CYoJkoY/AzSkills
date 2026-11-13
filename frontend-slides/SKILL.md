---
name: frontend-slides
description: Build responsive page-by-page HTML reports or fixed-stage 1920x1080 presentations with deliberate typography and rendered QA. Use for reading-first reports, new decks, PowerPoint conversion, and HTML deck refinement.
version: 2.1.0
status: canonical
family: production
modes: [new, convert, enhance, report]
---

# Frontend Slides

Turn source content into an HTML report or presentation that reads as one
designed argument. This Skill owns deck narrative, stage geometry, typography,
layout, authored visual assets, and rendered slide QA. It does not own video
production or general application UI.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task needs a page-by-page HTML report, a new HTML deck, a PowerPoint-to-HTML conversion, or a substantial visual rebuild of an existing deck.
- Do not use when: the output is a video (`remotion-production`), a product interface (`ui-design`), or a document without report-page structure.
- Owns: narrative structure, report reflow, stage composition, density, typography, color, imagery, deck-level motion placement, and rendered verification. Motion mechanism, timing, interruption, and motion gates belong to `ui-motion`.
- Inputs: source content, audience, occasion, duration, brand or design contract, required assets, and delivery format.
- Outputs: self-contained HTML deck, converted deck, PDF/PNG export when requested, and rendered verification.
- Compose with: `design-system` when a DESIGN.md governs the deck; `ui-motion` for slide transitions; `logo-generator` for identity assets.
- Gates: reports reflow on phones without clipping or unreadably scaled text; presentation slides fit 1920x1080; narrative, text, contrast, and assets are verified in rendered output.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `new` | Content must become a new deck | Narrative, thesis, composition, build, render QA | HTML deck |
| `convert` | PowerPoint or outline must become HTML | Extract, normalize, restyle, verify | HTML deck plus source map |
| `enhance` | Existing deck needs visual or structural repair | Audit, rank, smallest change, verify | Revised deck |
| `report` | Reading-first report with PPT-like pages, including phone readers | Wabi-Press, role-based typography, responsive flow, rendered QA | Self-contained HTML report |

## Report contract

For reading-first reports, choose `report` even when the user describes the result
as PPT-like. Read [references/html-report.md](references/html-report.md) and use
[assets/report.html](assets/report.html) with [assets/report.css](assets/report.css).
Use Wabi-Press with serif headings, CJK-capable sans body and mono technical
text unless the user explicitly overrides them. Retain logical pages, visible
page numbers and navigation on desktop and mobile. Use natural page height and a single column
on phones; never shrink a desktop stage to simulate mobile support. Body text
is 1.125rem (18px at the normal root), captions at least 1rem, with 1.8 body
line-height and 44px touch targets. Use verified system fallbacks; embed licensed
custom fonts when an exact face is required for portable offline delivery.

The fixed-stage contract and presentation references below apply to `new`,
`convert` and `enhance`. They do not override report geometry or typography.

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
the [shared Wabi Press fallback](../design-intelligence.md#default-visual-direction) when no stronger brief exists; it
is a default, not a mandatory skin. Interactive chrome uses the same paper/ink palette through --wb-* compatibility tokens
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

For reports, render at 320, 375, 390, 768, 1280 and 1920 CSS pixels wide and
check text enlargement, navigation, font delivery and print using the report
reference. For presentations, render all slides at 1920x1080.
Check overflow, clipping, font fallback, contrast,
image crop, alignment, page numbers, and source notes. Export a PDF or PNG set
when the delivery requires it and inspect the export, not only the browser.

## Quality gates

- [ ] The deck has one thesis and a clear claim sequence.
- [ ] Every page advances the argument; reports reflow and presentations fit the stage without clipping.
- [ ] Reports use Wabi-Press and role-based reading typography, with verified phone typography and offline font delivery or an explicitly reported font limitation.
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

- `references/html-report.md` - report-only design, fonts, mobile layout and verification; overrides fixed-stage reference geometry.

- `references/frontend-slides-guide.md` - detailed mode workflows, layout rules, image pipeline, and editing guidance.
- `DESIGN_SYSTEM.md` - deck design system and quality gate.
- `STYLE_PRESETS.md` - default art direction and token reference.
- `html-template.md` - stage shell and component markup.
- `animation-patterns.md` - slide and element motion patterns.
