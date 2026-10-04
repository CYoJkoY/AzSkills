# Style Presets Reference

Curated art directions for Frontend Slides. A preset is a starting point, not a template to copy mechanically. The deck's subject, audience, and visual thesis always outrank the preset.

**Mandatory base:** include the complete [viewport-base.css](viewport-base.css) in every generated presentation.

## The Single AzSkills Art Direction

AzSkills owns exactly one visual language. All AzSkills-owned decks — examples, documentation, system diagrams, Skill-library explainers, and any presentation without a stronger subject-specific requirement — are built from **Wabi-Press (侘寂刊本)**. There is no preset catalog of alternative styles: the former preset collection was retired together with the Material 3-inspired identity, and no other palette may reappear in owned surfaces.

### Wabi-Press · 侘寂刊本

**Vibe:** paper-warm, ink-graded, quietly authoritative — a printed folio rather than a dashboard.

**Composition:** washi canvas (light `#F5F3EC` stage / `#FAF9F5` slide, or inkstone `#131416` / `#1B1C20` for dark-intent decks) + serif display anchor + hairline-bound blocks + generous 間 (whitespace as an active element). Asymmetric 5/7 or 3/6/3 structure preferred over 50/50 splits.

**Typography:**
- Display: `"Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", Georgia, serif` — weight 500 only, line-height 1.2–1.35, no bold bloat.
- Body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — line-height 1.7–1.8, measure 45–75ch (65ch default).
- Index/meta (VOL., SEC., §, BAT., page numbers, timestamps): `"JetBrains Mono", SFMono-Regular, Menlo, monospace` with `font-variant-numeric: tabular-nums` and `letter-spacing: 0.08em`.

**Signature:** one cinnabar seal accent (`#A6382A` light / `#C84A3B` dark) as the only primary mark — stamps, primary rules, and the single emphasized data series; a secondary moss role (`#3B5848` / `#537B65`) for success and tertiary emphasis; 1px hairline borders (`rgba(40, 36, 32, 0.10)` / `rgba(240, 235, 225, 0.08)`) and 0–2px hand-cut corners; `--shadow-press` (`0 1px 2px rgba(40, 36, 32, 0.04)`) as the only permitted depth; ink-absorption active states (background darkens one step + ink line deepens, never transform/bounce); `--ease-paper` reveals 240–320ms, `--ease-ink` micro feedback 120–150ms.

**Best for:** every AzSkills-owned presentation by default; research, documentation, and narrative talks are especially well served.

**Token source:** [../DESIGN.md](../DESIGN.md), executed from [../design-system/wabi-press.css](../design-system/wabi-press.css). Stage-mapped tokens live in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) §2 and [viewport-base.css](viewport-base.css).

### When a subject genuinely requires another direction

Only when the user explicitly requests a non-Wabi-Press direction, or the subject's evidence makes Wabi-Press incoherent (for example, a deck that must mimic an external brand the user provides), a custom direction may be designed. In that case it is a one-off art direction for that deck: document the thesis, keep the fixed-stage and accessibility contracts, and never register it as an AzSkills preset or let it leak into owned repository surfaces.

## Font Pairing (Wabi-Press)

| Role | Stack |
|---|---|
| Display | Source Han Serif SC / Noto Serif CJK SC / Songti SC / Georgia |
| Body | -apple-system / BlinkMacSystemFont / Segoe UI / Roboto |
| Utility / index | JetBrains Mono / SFMono-Regular / Menlo (tabular-nums, 0.08em) |

Limit the deck to these three roles. No fourth family without a compelling, documented reason.

## Palette Discipline

Do not distribute colors evenly across all elements. Use semantic roles:

- canvas (washi `#F5F3EC` / inkstone `#131416`)
- surface (`#FAF9F5` / `#1B1C20`)
- overlay / secondary block (`#ECE8DC` / `#25272D`)
- primary ink text (`#1C1A17` / `#EDEAE2`)
- secondary ink text (`#524C44` / `#A39F95`)
- muted ink (`#878074` / `#68645C`)
- cinnabar accent (`#A6382A` / `#C84A3B`)
- moss accent (`#3B5848` / `#537B65`)
- status colors only when data genuinely requires them

Keep the core palette at these eight roles. Cinnabar indicates action and core emphasis; it is a stamp, not a wash. Never use pure `#000000` or `#FFFFFF`.

## Composition Discipline

Vary slide composition while keeping the same visual grammar. Rotate among editorial splits (5/7 asymmetric), hero statements, evidence + annotation, timelines, system maps, comparisons, metric constellations, quote slides, full-bleed imagery, and section dividers.

Avoid repeating an identical 3/4/6-card grid as the deck's default content layout. Negative space is an active element; do not fill an empty region merely because it is empty.

## Visual Selection Rules

When producing style previews for a user, keep Wabi-Press as the default and differentiate previews by composition and narrative role (editorial split vs. hero statement vs. evidence-led) rather than by inventing new palettes. Only offer a non-Wabi-Press preview when the subject explicitly justifies it and the user asks for the choice.

## Avoid Generic AI Patterns

Do not use Inter/Roboto/Arial/system fonts as expressive headline faces (the body stack is not a display face), purple-gradient-on-white clichés, decorative blobs without purpose, all-centered layouts, excessive glassmorphism, default chart styling, spring/bounce motion, or motion on every element.

The final question is not "does this look stylish?" It is "does every visual decision support the deck's message, and does it read as Wabi-Press?"

## CSS Gotcha

CSS functions cannot be negated by placing a minus sign directly before the function name. Use `calc(-1 * clamp(...))`, `calc(-1 * min(...))`, or `calc(-1 * max(...))` instead.
