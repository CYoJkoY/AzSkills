---
name: frontend-slides
description: Create distinctive, animation-rich HTML presentations from scratch or by converting PowerPoint files. Use when the user wants to build a web presentation, convert a PPT/PPTX to HTML, or enhance an existing HTML deck.
---

# Frontend Slides

Create production-quality, zero-dependency HTML presentations that run entirely in the browser. Prefer distinctive, authored visual systems over generic dashboard-like layouts.

## Core Principles

1. **Zero Dependencies** — Final presentations are single HTML files with inline CSS and JavaScript. No framework or build step is required.
2. **Show, Don't Tell** — When the user has not specified an aesthetic, generate three visual title-slide directions so the user can react to concrete designs.
3. **Distinctive Design** — Avoid generic AI aesthetics, predictable card grids, excessive glassmorphism, and purple-gradient-on-white clichés.
4. **Progressive Disclosure** — Read lightweight style references first. Load detailed template rules only after a direction has been selected.
5. **Fixed 16:9 Stage** — Every slide is authored at exactly 1920×1080 and the complete stage scales uniformly to the viewport. Never reflow slide content for phones.

## Fixed Stage Rules

Every deck must:

- Use a full-window `.deck-viewport`.
- Place all slides inside a 1920×1080 `.deck-stage`.
- Scale the whole stage uniformly to fit the viewport.
- Keep slide content at fixed stage coordinates rather than responsive reflow.
- Use `.active` / `.visible` with `visibility`, `opacity`, and `pointer-events` for slide switching. Do not switch slides with `display: none` / `display: block` because later layout declarations can override them.
- Use `clamp()` only for controls outside the slide stage or small previews.
- Support `prefers-reduced-motion`.
- Negate CSS functions with `calc(-1 * ...)`, never `-clamp()`, `-min()`, or `-max()`.

**Always read `viewport-base.css` and include its full contents in every generated presentation.**

## Content Density

Ask whether the deck is primarily:

- **Low density / speaker-led** — one idea per slide, large type, generous negative space, 1–3 bullets, more slides when needed.
- **High density / reading-first** — self-contained slides, structured grids, tables, annotations, roughly 4–8 bullets or 4–6 cards when readable.

Never solve overflow by shrinking text until it becomes uncomfortable. Split or redesign the slide instead.

## Mode Detection

### Mode A — New Presentation

Use when creating a deck from a topic, notes, or ready content.

### Mode B — PowerPoint Conversion

Use when the user provides a `.pptx` and wants a web presentation. Start with `scripts/extract-pptx.py` to extract slide text, images, and notes.

### Mode C — HTML Enhancement

Use when modifying an existing HTML deck. Before changes, inspect slide element count and content density. After changes, verify fixed-stage dimensions, text overflow, panel overlap, and behavior at 1280×720 plus a phone viewport.

## New Presentation Workflow

### Phase 1 — Content Discovery

Collect these together:

1. Purpose: pitch, teaching, conference, internal, or similar.
2. Approximate length: short, medium, or long.
3. Content readiness: complete content, rough notes, or topic only.
4. Density: speaker-led or reading-first.

If images are provided, inspect them before outlining the deck. Determine what each image communicates, whether it is usable, its dominant colors, and where it can meaningfully shape the slide structure.

Do not ask users to choose inline-editing behavior before seeing a draft. Inline editing is a post-draft affordance and should be included unless explicitly excluded.

### Phase 2 — Style Discovery

When the user has not already specified a visual direction, create three distinct single-slide HTML previews. Each preview should look like a genuine title slide from the user's deck, never like a diagnostic card.

Use `STYLE_PRESETS.md` for safe preset candidates. Favor substantial visual contrast between the three options.

Preview rules:

- Do not show words such as `preview`, `template`, `preset`, `wildcard`, `Option A/B/C`, file names, paths, or internal workflow notes on the slide.
- Template names belong in the surrounding agent message, not in the rendered deck.
- Keep previews as self-contained HTML files under `.frontend-slides/slide-previews/` when working in a project.
- Open the previews so the user can compare them visually.

If the user has already specified a clear style, skip unnecessary exploration and honor it.

### Phase 3 — Generate the Deck

Build the full presentation around the selected visual system.

Every presentation must be:

- A single self-contained HTML file.
- Fixed-stage 1920×1080.
- Fully styled with inline CSS and JavaScript.
- Explicitly commented by section.
- Keyboard navigable.
- Touch/swipe navigable where practical.
- Free of overflow and overlapping panels.

Use `html-template.md` for the reference architecture and `animation-patterns.md` to match motion to the intended feeling.

### Phase 4 — PowerPoint Conversion

Run:

```bash
python scripts/extract-pptx.py <input.pptx> <output_dir>
```

The extraction result contains slide titles, text content, images, and speaker notes. Confirm the extracted structure, then apply the normal style-discovery and fixed-stage generation workflow.

## Typography & Visual Direction

Avoid overused display defaults such as Inter, Roboto, Arial, and system fonts. Prefer a deliberate display/body pairing appropriate to the deck.

Commit to a coherent palette. Strong dominant colors with restrained accents generally produce clearer hierarchy than evenly distributed colors.

Use atmosphere and depth intentionally: gradients, grids, geometric patterns, particles, and restrained texture can support the visual thesis when they fit the subject.

Motion should reinforce the message. Prefer `transform` and `opacity`, staggered reveals, and one or two strong cinematic moments over many disconnected effects.

## Image Pipeline

When images are provided:

1. Inspect them.
2. Reuse only images that materially support the narrative.
3. Process oversized assets before embedding.
4. Never overwrite originals.
5. Keep placement inside the 1920×1080 stage.

For image processing, Pillow-based helpers such as circular crops and max-dimension resizing are appropriate.

## Inline Editing

Include an inline editing affordance after the first draft unless the user explicitly requests a locked/export-only file.

Use JavaScript-based hotzone handling with a grace-period timeout instead of relying on the CSS `~` sibling hover pattern. Support an edit toggle, local autosave, and export/save behavior.

## Verification

Before finalizing:

- Verify `.deck-stage` remains 1920×1080.
- Verify exactly one intended slide is visible at a time.
- Check for text overflow.
- Check for visual panel overlap; DOM or `scrollHeight` checks alone are insufficient.
- Verify keyboard navigation.
- Verify reduced-motion behavior.
- Render or inspect at 1280×720 and one phone viewport.
- For modifications, compare against the pre-change layout rather than blindly accumulating elements.

## Supporting Files

- `STYLE_PRESETS.md` — curated visual systems and typography/color guidance.
- `viewport-base.css` — mandatory fixed-stage CSS base.
- `html-template.md` — presentation architecture and inline editing reference.
- `animation-patterns.md` — motion patterns by mood and interaction type.
- `scripts/extract-pptx.py` — PowerPoint content/image/note extraction helper.

Source: adapted from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides). Preserve the upstream license and attribution in this directory.
