# Style Presets Reference

Curated visual systems for Frontend Slides. Presets are starting points, not templates to copy mechanically. The deck's subject, audience, and visual thesis always outrank the preset.

**Mandatory base:** include the complete [viewport-base.css](viewport-base.css) in every generated presentation.

## How to Use Presets

1. Pick a visual thesis first.
2. Select a preset whose typography, palette, and composition support that thesis.
3. Keep the preset's visual grammar consistent across the full deck.
4. Introduce variation through composition and narrative role, not by changing the entire style every slide.
5. Refine after the first full pass; do not stop at the preset's default appearance.

## Dark Themes

### 1. Bold Signal
**Vibe:** confident, direct, high-impact

**Composition:** dark field + one dominant accent plane; large section numerals; asymmetric title block.

**Typography:** Archivo Black + Space Grotesk

**Signature:** oversized numeral, sharp accent panel, disciplined grid, concise utility labels.

**Best for:** keynotes, launches, strategy, strong opinions.

### 2. Electric Studio
**Vibe:** polished, contemporary, decisive

**Composition:** split field with one strong color zone and restrained white space.

**Typography:** Manrope

**Signature:** vertical split, accent rule, oversized statement type, low ornament.

**Best for:** product, business, portfolio, executive storytelling.

### 3. Creative Voltage
**Vibe:** energetic, experimental, retro-futurist

**Composition:** dark base + electric accent; grid/halftone details used as atmosphere rather than filler.

**Typography:** Syne + Space Mono

**Signature:** energetic labels, controlled neon, modular geometry.

**Best for:** creative technology, culture, design, entertainment.

### 4. Dark Botanical
**Vibe:** premium, literary, calm

**Composition:** deep dark background with warm organic forms and restrained editorial rules.

**Typography:** Cormorant + IBM Plex Sans

**Signature:** elegant serif scale contrast, fine rules, atmospheric forms.

**Best for:** research, culture, luxury, reflective narratives.

## Light Themes

### 5. Notebook Tabs
**Vibe:** tactile, organized, editorial

**Composition:** warm paper field with edge tabs and precise page-like geometry.

**Typography:** Bodoni Moda + DM Sans

**Signature:** tab system, binder-hole details, strong editorial hierarchy.

**Best for:** teaching, research notes, workshops, handouts.

### 6. Pastel Geometry
**Vibe:** friendly, contemporary, approachable

**Composition:** bright neutral field with geometric accents and generous whitespace.

**Typography:** Plus Jakarta Sans

**Signature:** vertical labels, geometric accents, controlled soft shapes.

**Best for:** education, community, consumer products.

### 7. Split Pastel
**Vibe:** playful, modern, human

**Composition:** two-color field with a clear vertical or diagonal division.

**Typography:** Outfit

**Signature:** rounded but not over-rounded geometry, simple status markers, clear CTA hierarchy.

**Best for:** workshops, creative products, social/community topics.

### 8. Vintage Editorial
**Vibe:** witty, confident, personality-led

**Composition:** warm paper with bordered callouts, editorial blocks, and geometric anchors.

**Typography:** Fraunces + Work Sans

**Signature:** print-like framing, expressive serif headline, restrained color.

**Best for:** culture, opinion, storytelling, brand narratives.

## Specialty Themes

### 9. Neon Cyber
**Vibe:** technical, futuristic, intense

**Composition:** dark navy field, precision grid, one cyan/magenta signal layer.

**Typography:** Clash Display + Satoshi

**Signature:** thin data-like rules, particle/grid atmosphere, selective glow.

**Best for:** software, AI, cybersecurity, emerging technology.

### 10. Terminal Green
**Vibe:** developer-first, archival, hacker

**Composition:** terminal surface with command-line hierarchy and scan-line atmosphere.

**Typography:** JetBrains Mono

**Signature:** monospace hierarchy, status markers, code motifs used sparingly.

**Best for:** engineering talks, open source, tooling, demos.

### 11. Swiss Modern
**Vibe:** precise, neutral, rigorous

**Composition:** visible grid logic, asymmetry, strong alignment, one accent.

**Typography:** Archivo + Nunito

**Signature:** measured spacing, modular blocks, typographic restraint.

**Best for:** strategy, architecture, systems, corporate communication.

### 12. Paper & Ink
**Vibe:** thoughtful, literary, archival

**Composition:** warm paper, fine rules, pull quotes, diagrammatic marginalia.

**Typography:** Cormorant Garamond + Source Serif 4

**Signature:** drop caps, elegant rules, quiet information density.

**Best for:** essays, history, research, narrative talks.

## Font Pairing Quick Reference

| Preset | Display | Body | Utility |
|---|---|---|---|
| Bold Signal | Archivo Black | Space Grotesk | Space Mono |
| Electric Studio | Manrope | Manrope | Manrope |
| Creative Voltage | Syne | Space Mono | Space Mono |
| Dark Botanical | Cormorant | IBM Plex Sans | IBM Plex Mono |
| Notebook Tabs | Bodoni Moda | DM Sans | DM Mono |
| Pastel Geometry | Plus Jakarta Sans | Plus Jakarta Sans | DM Mono |
| Split Pastel | Outfit | Outfit | Space Mono |
| Vintage Editorial | Fraunces | Work Sans | IBM Plex Mono |
| Neon Cyber | Clash Display | Satoshi | Space Mono |
| Terminal Green | JetBrains Mono | JetBrains Mono | JetBrains Mono |
| Swiss Modern | Archivo | Nunito | IBM Plex Mono |
| Paper & Ink | Cormorant Garamond | Source Serif 4 | IBM Plex Mono |

## Palette Discipline

Do not distribute colors evenly across all elements. Use semantic roles:

- background
- surface
- primary text
- muted text
- primary accent
- optional secondary accent
- status colors when needed

Keep the primary palette small, typically 2–5 core colors. The accent should indicate meaning or attention, not simply make the slide more colorful.

## Composition Discipline

Presets should vary slide composition while keeping the same visual grammar. Rotate among editorial splits, hero statements, evidence + annotation, timelines, system maps, comparisons, metric constellations, quote slides, full-bleed imagery, and section dividers.

Avoid repeating an identical 3/4/6-card grid as the deck's default content layout.

## Visual Selection Rules

When producing style previews, choose:

- one safe/restrained direction
- one strong signature direction
- one context-specific wildcard

The three must differ in typography scale, composition, or visual energy enough that a user can make a meaningful choice by looking at them.

## Avoid Generic AI Patterns

Do not use Inter/Roboto/Arial/system fonts as expressive defaults, purple-gradient-on-white clichés, decorative blobs without purpose, all-centered layouts, excessive glassmorphism, default chart styling, or motion on every element.

The final question is not “does this look stylish?” It is “does every visual decision support the deck's message and visual thesis?”

## CSS Gotcha

CSS functions cannot be negated by placing a minus sign directly before the function name. Use `calc(-1 * clamp(...))`, `calc(-1 * min(...))`, or `calc(-1 * max(...))` instead.
