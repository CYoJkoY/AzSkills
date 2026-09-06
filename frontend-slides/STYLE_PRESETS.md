# Style Presets Reference

Curated visual styles for Frontend Slides. Each preset is inspired by real design references. Abstract shapes are preferred over generic illustration clutter.

**Viewport CSS:** For mandatory base styles, see [viewport-base.css](viewport-base.css). Include it in every presentation.

---

## Dark Themes

### 1. Bold Signal
**Vibe:** Confident, bold, modern, high-impact

**Layout:** Colored card on a dark field. Number top-left, navigation top-right, title bottom-left.

**Typography:** Archivo Black + Space Grotesk

**Signature:** Bold accent card, large section numbers, breadcrumb navigation, grid alignment.

### 2. Electric Studio
**Vibe:** Bold, clean, professional, high contrast

**Layout:** Split panel with a white upper area and blue lower area.

**Typography:** Manrope

**Signature:** Vertical split, accent bar, quote-scale hero typography, restrained spacing.

### 3. Creative Voltage
**Vibe:** Creative, energetic, retro-modern

**Layout:** Electric-blue and dark split panels with mono/script accents.

**Typography:** Syne + Space Mono

**Signature:** Neon contrast, halftone/grid effects, energetic badges and callouts.

### 4. Dark Botanical
**Vibe:** Elegant, sophisticated, premium

**Layout:** Centered content on dark with abstract atmospheric shapes.

**Typography:** Cormorant + IBM Plex Sans

**Signature:** Warm accents, thin rules, editorial hierarchy, restrained abstract forms.

## Light Themes

### 5. Notebook Tabs
**Vibe:** Editorial, organized, tactile

**Typography:** Bodoni Moda + DM Sans

**Signature:** Cream paper surface, colorful edge tabs, binder-hole details.

### 6. Pastel Geometry
**Vibe:** Friendly, modern, approachable

**Typography:** Plus Jakarta Sans

**Signature:** White card, vertical pills, geometric accents, soft hierarchy.

### 7. Split Pastel
**Vibe:** Playful, modern, friendly

**Typography:** Outfit

**Signature:** Two-color vertical split, rounded badges, grid overlay, clear CTA treatment.

### 8. Vintage Editorial
**Vibe:** Witty, confident, personality-driven

**Typography:** Fraunces + Work Sans

**Signature:** Cream canvas, geometric accents, bordered callouts, editorial voice.

## Specialty Themes

### 9. Neon Cyber
**Vibe:** Futuristic, technology-forward

**Typography:** Clash Display + Satoshi

**Signature:** Dark navy, cyan/magenta accents, grid and particle atmosphere.

### 10. Terminal Green
**Vibe:** Developer-focused, hacker aesthetic

**Typography:** JetBrains Mono

**Signature:** Terminal palette, scan-line atmosphere, cursor/code motifs.

### 11. Swiss Modern
**Vibe:** Clean, precise, geometric

**Typography:** Archivo + Nunito

**Signature:** Strong grid, asymmetric layout, geometric forms, one high-contrast accent.

### 12. Paper & Ink
**Vibe:** Literary, thoughtful, editorial

**Typography:** Cormorant Garamond + Source Serif 4

**Signature:** Warm paper, drop caps, pull quotes, elegant horizontal rules.

## Font Pairing Quick Reference

| Preset | Display | Body |
|---|---|---|
| Bold Signal | Archivo Black | Space Grotesk |
| Electric Studio | Manrope | Manrope |
| Creative Voltage | Syne | Space Mono |
| Dark Botanical | Cormorant | IBM Plex Sans |
| Notebook Tabs | Bodoni Moda | DM Sans |
| Pastel Geometry | Plus Jakarta Sans | Plus Jakarta Sans |
| Split Pastel | Outfit | Outfit |
| Vintage Editorial | Fraunces | Work Sans |
| Neon Cyber | Clash Display | Satoshi |
| Terminal Green | JetBrains Mono | JetBrains Mono |

## Avoid Generic AI Patterns

Do not use Inter/Roboto/Arial/system fonts as the main display face, generic indigo or purple-gradient-on-white palettes, all-centered hero layouts, identical card grids, or decorative elements without a narrative purpose.

## CSS Gotcha

CSS functions cannot be negated by placing a minus sign directly before the function name. Use `calc(-1 * clamp(...))`, `calc(-1 * min(...))`, or `calc(-1 * max(...))` instead.
