# Frontend Slides — Design System & Quality Gate

This document turns the skill from a collection of implementation rules into a repeatable visual-design system. Use it before writing the full deck and again during refinement. Repository-owned AzSkills presentation defaults inherit the root [`DESIGN.md`](../DESIGN.md) contract.

### AzSkills default visual contract

The default presentation language is **Wabi-Press (侘寂刊本)**, defined by the root [`DESIGN.md`](../DESIGN.md) and executed from [`../design-system/wabi-press.css`](../design-system/wabi-press.css): washi canvas and pine-soot ink text instead of a dark terminal canvas, a single cinnabar seal accent with a secondary moss role, editorial serif display type at weight 500 with robust CJK/Latin fallbacks, an 8px spacing rhythm, 0–2px hand-cut corners, 1px hairline structure (no heavy shadow), and ink-absorption micro-states. Wabi-Press is the only AzSkills-owned art direction; it is not a preset among equals and no second palette may reappear.

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
  /* Wabi-Press (侘寂刊本) stage tokens — light washi spectrum.
     Values mirror design-system/wabi-press.css; do not fork them. */
  --stage-bg: #F5F3EC;            /* washi canvas */
  --slide-bg: #FAF9F5;            /* card & carrier surface */
  --color-bg-overlay: #ECE8DC;    /* secondary blocks & hover states */
  --color-hairline: rgba(40, 36, 32, 0.10);   /* 1px faded-ink rule */
  --color-hairline-strong: rgba(40, 36, 32, 0.25); /* active & focus ink line */
  --color-text: #1C1A17;          /* pine-soot ink */
  --color-text-secondary: #524C44;
  --color-text-muted: #878074;
  --color-cinnabar: #A6382A;      /* primary action / core seal */
  --color-moss: #3B5848;          /* success / secondary emphasis */

  /* Editorial type stacks. */
  --font-display: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", SFMono-Regular, Menlo, monospace;

  /* 8px stage rhythm with 4px fine alignment. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Hand-cut paper geometry. */
  --radius-cut: 2px;
  --line: 1px;
  --shadow-press: 0 1px 2px rgba(40, 36, 32, 0.04);

  /* Physical motion vocabulary. */
  --ease-paper: cubic-bezier(0.25, 1, 0.4, 1);  /* slide reveals 240–320ms */
  --ease-ink: cubic-bezier(0.16, 1, 0.3, 1);    /* micro feedback 120–150ms */
  --duration-fast: 140ms;
  --duration-normal: 280ms;
  --duration-slow: 320ms;
}

[data-theme="dark"] {
  /* Inkstone night spectrum for dark-intent decks. */
  --stage-bg: #131416;
  --slide-bg: #1B1C20;
  --color-bg-overlay: #25272D;
  --color-hairline: rgba(240, 235, 225, 0.08);
  --color-hairline-strong: rgba(240, 235, 225, 0.18);
  --color-text: #EDEAE2;
  --color-text-secondary: #A39F95;
  --color-text-muted: #68645C;
  --color-cinnabar: #C84A3B;
  --color-moss: #537B65;
}
```

These values are the Wabi-Press contract, not a swappable palette. A deck may add content-specific data colors, but canvas, ink, hairline, cinnabar, and moss roles come from the tokens above and must never be replaced by another design language.

### Token rules

- Colors have semantic roles (canvas, surface, ink text, hairline, cinnabar, moss), not decorative names.
- Never use pure `#000000` or `#FFFFFF`; both spectra are already ink-warm and paper-warm.
- Repeated spacing uses the same 8px rhythm across the deck.
- Repeated components share 0–2px cut geometry and the same type treatment.
- Hierarchy comes from 1px hairlines and lightness steps; `--shadow-press` is the only permitted shadow.
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

Every deck gets a motion language, not a pile of effects. The AzSkills-owned motion vocabulary is Wabi-Press: slide reveals and surface transitions ride `--ease-paper` (240–320ms); micro feedback rides `--ease-ink` (120–150ms). Spring and bounce entrances are prohibited.

Choose one primary entrance pattern and one secondary emphasis pattern.

Examples:

- editorial → fade + translate + stagger (Wabi-Press default)
- cinematic → slow scale + opacity, paper curve only
- technical → clip/reveal + precise hairline movement
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
- any palette other than Wabi-Press in an AzSkills-owned deck
- pure `#000000` or `#FFFFFF` surfaces or text
- broad blurred shadows used to create depth (hairlines + lightness steps only)
- spring/bounce entrances or scale-pop micro-states
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

- [ ] visual thesis is consistent with the Wabi-Press contract (the only AzSkills-owned art direction)
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
