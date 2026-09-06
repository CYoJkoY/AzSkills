# Frontend Slides — Design System & Quality Gate

This document turns the skill from a collection of implementation rules into a repeatable visual-design system. Use it before writing the full deck and again during refinement.

## 1. Visual Thesis

Write one sentence that describes the intended visual behavior of the deck, not merely its topic.

Good examples:

- “Dense technical evidence presented as calm Swiss instrumentation with one signal color.”
- “A cinematic product story built from oversized type, dark negative space, and precise interface fragments.”
- “Editorial research expressed through warm paper, serif headlines, and diagrammatic annotations.”

The thesis determines the palette, typography, composition, imagery, and motion. Do not import visual elements that contradict it.

## 2. Design Tokens

Define tokens before building repeated components.

```css
:root {
  /* Color roles */
  --color-bg: #0b0d10;
  --color-surface: #14181d;
  --color-surface-strong: #1b2128;
  --color-text: #f5f7fa;
  --color-text-muted: #9aa4b2;
  --color-accent: #67e8f9;
  --color-accent-strong: #22d3ee;
  --color-positive: #86efac;
  --color-negative: #fda4af;

  /* Typography roles */
  --font-display: "Your Display Font", sans-serif;
  --font-body: "Your Body Font", sans-serif;
  --font-mono: "Your Utility Font", monospace;

  /* Stage rhythm */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 48px;
  --space-6: 64px;
  --space-7: 96px;
  --space-8: 128px;

  /* Shape */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 28px;
  --line: 1px;

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 180ms;
  --duration-normal: 480ms;
  --duration-slow: 900ms;
}
```

Do not blindly copy this palette. Replace values to fit the visual thesis.

### Token rules

- Colors have semantic roles, not decorative names.
- Repeated spacing uses the same rhythm across the deck.
- Repeated components share geometry and type treatment.
- A new token must solve a recurring design need; avoid one-off token sprawl.

## 3. Typography System

Assign every text fragment to a role.

| Role | Typical use | Guidance |
|---|---|---|
| Display | thesis, hero title | expressive, high contrast, short lines |
| Heading | section and content titles | strong hierarchy, predictable wrapping |
| Body | explanations | readable line length and generous line height |
| Utility | dates, labels, metadata | small, restrained, often monospace |
| Numeral | KPIs, measurements | optically large, aligned, unambiguous |

### Typography checks

- Prefer a distinctive display face instead of generic defaults.
- Limit the deck to 2–3 families.
- Avoid excessive all-caps text.
- Control tracking rather than relying on arbitrary font size changes.
- Treat line breaks as composition, not accidents.
- Never sacrifice legibility for personality.

## 4. Color System

Use a dominant background/surface family, readable text tones, and a restrained accent strategy.

A practical default is 1 dominant color family + 1 primary accent + optional semantic status colors. More colors are allowed when data or subject matter genuinely requires them.

### Contrast hierarchy

1. highest contrast: primary thesis / focal data
2. high contrast: section headings and important labels
3. medium contrast: supporting explanation
4. low contrast: metadata and secondary decoration

Do not make every item high contrast. Hierarchy requires difference.

## 5. Composition Grammar

Every slide should have:

- a clear focal point
- a primary alignment axis
- a deliberate negative-space region
- a supporting visual structure
- controlled edge relationships

### Preferred archetypes

**Editorial Split** — text anchors one side; evidence/image occupies the other.

**Hero + Field** — oversized thesis with a restrained visual field behind or beside it.

**Evidence + Annotation** — one dominant chart/image/diagram plus concise callouts.

**System Map** — nodes, connectors, labels, and hierarchy communicate a process or architecture.

**Timeline Spine** — one visual axis carries chronological or procedural information.

**Comparison Matrix** — clear columns/rows with one highlighted decision.

**Metric Constellation** — a few large numbers arranged as a visual composition rather than an identical KPI card grid.

**Quote / Manifesto** — very little text, with typography carrying most of the visual weight.

**Section Divider** — a visual reset that preserves the deck's visual thesis while reducing information density.

**Full-Bleed Image** — image dominates; short typography provides orientation and narrative.

Do not use a card grid as the default response to every content problem.

## 6. Grid & Spacing

Use an underlying grid even when it is invisible. A 12-column or 24-column stage grid works well, but custom grids are acceptable when the visual thesis demands it.

For related slides, keep recurring elements on shared anchors: title baseline, left edge, page marker, footer baseline, and main image boundary.

Negative space is an active design element. Do not fill an empty region merely because it is empty.

## 7. Depth Without Visual Noise

Depth can come from:

- layered planes
- soft radial light
- thin rules
- transparent overlays
- restrained grain/noise
- subtle shadows
- geometric repetition
- masked imagery

Avoid using glow, blur, gradients, noise, glass, and shadows simultaneously. Select the smallest set that supports the visual thesis.

## 8. Data Visualization

Choose visual encodings from the analytical question:

- comparison → bars / columns
- change over time → line / area
- composition → stacked bars or carefully used radial forms
- distribution → histogram / dot plot
- relationship → scatter plot
- hierarchy → tree / nested structure
- flow → connected nodes or Sankey-like structure
- process → timeline / step spine

Highlight the intended insight rather than making every series visually equal.

For simple charts, inline SVG is preferred because it preserves the zero-dependency promise and allows precise styling.

## 9. Motion System

Every deck gets a motion language, not a pile of effects.

Choose one primary entrance pattern and one secondary emphasis pattern.

Examples:

- editorial → fade + translate + stagger
- cinematic → slow scale + opacity
- technical → clip/reveal + precise line movement
- playful → spring/bounce with restraint
- calm → long fade with near-zero translation

Keep motion purposeful. Avoid parallax or 3D tilt when they distract from reading.

## 10. Images & Graphic Assets

Treat an image as a compositional object with crop, scale, frame, caption, and surrounding negative space.

Before using an image ask:

1. What information does it add?
2. Why is this crop the right crop?
3. What should the viewer notice first?
4. Does it support the visual thesis?

Do not add stock-style illustration just to fill empty space.

## 11. Anti-Patterns

Reject these unless the user explicitly requests them:

- generic purple gradient on white
- Inter/Roboto/Arial as the expressive headline face
- identical 3/4/6-card grids repeated across the deck
- every section centered
- every element rounded
- excessive glassmorphism
- decorative blobs with no semantic purpose
- tiny text used to cram too much content
- charts with default library styling
- five unrelated visual styles in one deck
- animations on every element
- internal generation notes visible in the presentation

## 12. Refinement Pass

After the first complete deck exists, do not immediately add more elements. First perform subtraction and alignment.

Ask:

- What is the first thing I notice?
- Is that the intended thing?
- Can any element be removed without losing meaning?
- Are repeated elements aligned to the same anchors?
- Does the accent color indicate importance consistently?
- Is the negative space intentional?
- Are the weakest slides visibly weaker than the opening slide?
- Does the deck feel like one artifact rather than a collection of pages?

Then polish typography, spacing, contrast, image crops, and animation timing.

## 13. Quality Gate

Do not call the deck finished until every item passes.

### Structural

- [ ] fixed 1920×1080 stage
- [ ] exactly one visible slide at a time
- [ ] keyboard navigation works
- [ ] touch/swipe works where applicable
- [ ] no broken controls
- [ ] reduced-motion behavior exists

### Content

- [ ] every slide has one clear primary message
- [ ] titles and body copy are concise enough for the selected density
- [ ] no accidental placeholders or debug text
- [ ] no unsupported factual claims introduced by the visual treatment

### Visual

- [ ] visual thesis is consistent
- [ ] typography hierarchy is obvious within 1–2 seconds
- [ ] color roles are consistent
- [ ] major alignments repeat intentionally
- [ ] whitespace is deliberate
- [ ] no panel overlap
- [ ] no clipping or overflow
- [ ] no weakly justified decoration

### Craft

- [ ] images have intentional crops
- [ ] charts are customized rather than default-looking
- [ ] animation timings feel coherent
- [ ] section transitions reset attention
- [ ] opening and closing slides feel finished

### Render review

Inspect at minimum:

- 1920×1080
- 1280×720
- one phone-sized viewport

The phone view is not allowed to reflow the slide. It only verifies that the fixed-stage scaling and controls remain usable.

## 14. “Done” Standard

A deck is done when removing one more decorative element would likely make it better only if that element is unnecessary. The goal is not maximal visual density; it is controlled visual intent.
