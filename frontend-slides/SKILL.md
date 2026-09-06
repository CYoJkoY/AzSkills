---
name: frontend-slides
description: Create production-quality, distinctive HTML presentations from scratch, from PowerPoint, or by enhancing an existing deck. Use when the user needs a polished web presentation with strong visual hierarchy, deliberate art direction, animation, and high-fidelity layout.
---

# Frontend Slides

Create presentation-grade, zero-dependency HTML decks that feel designed rather than generated. The default quality bar is a polished editorial or product-design artifact: clear hierarchy, deliberate composition, cohesive typography, controlled motion, and no accidental visual noise.

This skill is deliberately inspired by the visual craft and fixed-stage workflow of `zarazhangrui/frontend-slides`, and by the design-system, token, accessibility, and visual-hierarchy discipline of `nextlevelbuilder/ui-ux-pro-max-skill`. Do not copy their templates mechanically. Extract the principles and apply them to the user's subject.

## Core Principles

1. **Design system before markup** — establish a visual thesis, tokens, type pairing, spacing rhythm, contrast strategy, and component grammar before expanding the deck.
2. **Show, don't tell** — when the aesthetic is not specified, create three genuine title-slide directions so the user can select by looking at the work.
3. **Distinctive, contextual design** — avoid generic dashboards, repetitive card grids, purple-gradient clichés, and decoration without narrative purpose.
4. **Fixed 16:9 stage** — every slide is authored at exactly 1920×1080 and the complete stage scales uniformly to the viewport. Never reflow slide content for phones.
5. **Visual communication first** — turn structure, data, comparison, progression, and emphasis into spatial relationships before adding explanatory text.
6. **Progressive disclosure** — read compact indexes first; load detailed template/design recipes only after a direction is selected.
7. **Craft over accumulation** — the second pass should usually refine, simplify, align, and strengthen hierarchy instead of adding more decoration.
8. **Verify the rendered result** — DOM checks alone are insufficient. Inspect the actual visual composition for overflow, overlap, contrast, rhythm, and accidental artifacts.

## Fixed Stage Rules

Every deck must:

- Use a full-window `.deck-viewport`.
- Place every slide inside a 1920×1080 `.deck-stage`.
- Scale the entire stage uniformly to the viewport.
- Keep slide content at fixed stage coordinates rather than responsive reflow.
- Use `.active` / `.visible` with `visibility`, `opacity`, and `pointer-events` for slide switching. Do not use `display: none` / `display: block` for slide navigation.
- Use `clamp()` only for controls outside the slide stage or compact previews.
- Support `prefers-reduced-motion`.
- Never write `-clamp()`, `-min()`, or `-max()`; use `calc(-1 * ...)` when a negative CSS function result is required.
- Include the complete contents of `viewport-base.css` in every final deck.
- Keep every visual element inside the stage's safe area with intentional margins.

## Content Density

Classify the deck as either:

- **Low density / speaker-led** — one main idea per slide, large type, generous negative space, 1–3 supporting bullets, more slides rather than compressed slides.
- **High density / reading-first** — self-contained structured layouts, tables, annotations, 4–8 bullets or 4–6 cards only when readability remains high.

Never solve overflow by shrinking typography until it becomes uncomfortable. Split, simplify, or redesign instead.

## Mode Detection

### Mode A — New Presentation
Use when creating a deck from a topic, notes, or ready content.

### Mode B — PowerPoint Conversion
Use when a `.pptx` is supplied. Start with `scripts/extract-pptx.py`, inspect the extracted slide structure, then rebuild using the normal design workflow instead of blindly reproducing the source layout.

### Mode C — HTML Enhancement
Use when modifying an existing HTML deck. Preserve useful content but redesign weak hierarchy where necessary.

For Mode C, before changing anything:
1. Count major visual elements and assess content density.
2. Record the existing type scale, palette, spacing rhythm, and component patterns.
3. Identify collisions, overflow, repetitive patterns, weak contrast, and visual dead zones.
4. Decide what should be preserved, refined, or removed.

After every substantial modification, recheck stage dimensions, text bounds, overlap, visible-slide state, navigation, and screenshots.

## Visual Craft Pipeline

Treat every deck as a five-pass design process.

### Pass 1 — Content Architecture
Define the narrative hierarchy before styling:

- Title / thesis
- Section transitions
- Primary evidence or visual argument
- Comparisons / processes / timelines / data
- Key takeaway
- Closing or call to action

Prefer one dominant message per slide. A slide should have a clear answer to “what should the viewer notice first?”

### Pass 2 — Visual Thesis
Write a one-sentence visual thesis before expanding the deck. Examples: “clinical precision with warm editorial contrast” or “high-energy systems thinking expressed through modular geometry.”

Choose:

- dominant visual mode: editorial, cinematic, Swiss, technical, organic, brutalist, playful, etc.
- 2–5 core colors with explicit semantic roles
- display/body/utility typography roles
- spacing base unit and major rhythm
- one signature graphic device
- one motion language

Do not mix unrelated aesthetic vocabularies merely because individual pieces look attractive.

### Pass 3 — Composition
Use layout archetypes deliberately rather than defaulting to cards:

- asymmetrical editorial split
- hero statement + visual field
- evidence + annotation
- timeline / process spine
- comparison matrix
- metric constellation
- quote / manifesto
- full-bleed image with typographic anchor
- diagram / system map
- section divider

Cards are allowed, but repeated identical card grids should not become the deck's visual default.

### Pass 4 — Craft & Motion
Refine:

- typographic optical alignment
- line length and wrapping
- baseline rhythm
- whitespace and edge tension
- contrast between primary/secondary information
- subtle depth, layering, and atmospheric effects
- animation sequencing

Prefer one strong compositional reveal over many unrelated micro-animations. Use transform and opacity for motion whenever possible.

### Pass 5 — Quality Gate
Before delivery, run the checks in `DESIGN_SYSTEM.md`, run the static audit when a local HTML file exists, and inspect rendered screenshots. A technically valid deck that looks crowded, generic, repetitive, or unfinished is not considered complete.

```bash
python scripts/quality_audit.py path/to/deck.html
```

Treat `FAIL` results as blocking. Treat `WARN` results as review items that require a conscious decision.

## New Presentation Workflow

### Phase 1 — Content Discovery
Collect in one round:

1. Purpose / audience
2. Approximate length
3. Content readiness
4. Density: speaker-led or reading-first

When images are provided, inspect them before outlining the deck. Images are narrative inputs, not decoration added at the end.

Do not ask the user to choose inline-editing behavior before seeing a draft. Inline editing is a post-draft affordance.

### Phase 2 — Style Discovery
When no clear style is specified, create three distinct title-slide previews.

Each preview must:

- look like a genuine first slide from the intended deck
- use a coherent type + color + composition system
- be visually different from the other two
- contain no workflow metadata
- avoid words such as `preview`, `template`, `preset`, `wildcard`, `Option A/B/C`, file names, or internal notes

Use `STYLE_PRESETS.md` for safe starting directions. A preview can also be custom-designed when the subject benefits from a more specific visual thesis.

If a bold template library is available, select candidates using purpose, mood, formality, density, and visual contrast. Read only the preview file first. Load the full design recipe only after selection.

### Phase 3 — Generate the Deck
Build the deck around the selected visual system.

Every final presentation must be:

- one self-contained HTML file
- fixed-stage 1920×1080
- keyboard navigable
- touch/swipe navigable where practical
- reduced-motion aware
- semantically structured
- free from visible overflow and panel overlap
- visually coherent across all slides

Use `html-template.md`, `animation-patterns.md`, and `DESIGN_SYSTEM.md` as the implementation references.

### Phase 4 — PowerPoint Conversion
Run:

```bash
python scripts/extract-pptx.py <input.pptx> <output_dir>
```

Confirm extracted titles, text, images, and notes. Reconstruct the content using the design workflow rather than preserving poor source formatting.

## Typography Rules

Avoid generic display defaults such as Inter, Roboto, Arial, or bare system fonts as the primary expressive face. Choose typography intentionally by mood and subject.

Use a hierarchy with explicit roles:

- display / thesis
- heading / section
- body / explanation
- utility / metadata
- numerals / data

Do not use more than 2–3 font families without a compelling reason. Large type is useful only when hierarchy and wrapping are controlled. Never allow accidental orphaned words, cramped tracking, or decorative type that harms legibility.

## Color Rules

Commit to a palette instead of distributing colors evenly across every element.

Every color should have a semantic role: background, surface, text, muted text, primary accent, secondary accent, positive/negative/status, etc.

Prefer 2–5 core colors. Check contrast for essential text and controls. Avoid using color as the sole carrier of meaning.

## Layout Rules

Use a measurable spacing system instead of ad hoc pixel values. Align major elements to a visible grid or an explicit optical axis.

Typical safe-area guidance:

- keep primary content comfortably inside stage edges
- use consistent left/right anchors across related slides
- maintain repeated header and footer baselines
- leave enough negative space for the focal object to breathe

When a slide needs more content than it can comfortably hold, split the narrative instead of shrinking every element.

## Data Visualization

When data matters, make the visual form communicate the relationship before the labels explain it.

- choose chart type from the message: comparison, trend, distribution, composition, correlation, flow, etc.
- remove ornamental chart chrome that does not aid interpretation
- highlight the one data series or value that matters most
- keep axes, labels, and annotations readable at 1920×1080
- use a consistent data palette across the deck

Chart.js or another client-side library is acceptable only when it materially improves the result. Zero-dependency SVG/CSS charts are preferred for simple visuals.

## Image Pipeline

When images are provided:

1. Inspect them before outlining the deck.
2. Keep only images that materially support the story.
3. Crop and resize oversized assets before embedding when practical.
4. Preserve originals.
5. Use image treatment as part of the visual system: crop, frame, masking, captioning, grain, or color treatment should be deliberate.
6. Never let an image collide with text, controls, or stage boundaries.

## Inline Editing

Include an inline editing affordance after the first draft unless the user explicitly requests a locked/export-only file.

Use JavaScript hotzones with a short grace-period timeout instead of fragile CSS sibling-hover chains. Support an edit toggle, local autosave, and save/export behavior.

## Verification

Minimum verification before finalizing:

- `.deck-stage` is exactly 1920×1080.
- Exactly one intended slide is active/visible at a time.
- No text overflow or clipped content.
- No panel overlap or accidental z-index collisions.
- Navigation works with Arrow keys and Space where appropriate.
- Touch/swipe works when the environment supports it.
- Reduced-motion mode disables or minimizes nonessential motion.
- The deck remains a fixed 16:9 composition at 1280×720.
- A phone viewport does not cause content reflow or break the stage.
- The static audit passes without blocking failures.
- At least one screenshot inspection pass checks visual rhythm, whitespace, hierarchy, contrast, and alignment.
- The deck does not contain internal generation notes, template labels, placeholder text, or accidental debug output.

## Supporting Files

- `DESIGN_SYSTEM.md` — visual thesis, tokens, layout archetypes, anti-patterns, and the final quality gate.
- `STYLE_PRESETS.md` — curated visual systems and typography/color guidance.
- `viewport-base.css` — mandatory fixed-stage CSS base.
- `html-template.md` — presentation architecture, interaction, accessibility, and editing reference.
- `animation-patterns.md` — motion patterns and performance guidance.
- `scripts/extract-pptx.py` — PowerPoint extraction helper.
- `scripts/quality_audit.py` — dependency-free static quality audit for generated HTML.

Source lineage: adapted from `zarazhangrui/frontend-slides`; visual design discipline is additionally informed by `nextlevelbuilder/ui-ux-pro-max-skill`. Preserve the upstream license and attribution in this directory.
