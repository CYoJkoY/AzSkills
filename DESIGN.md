---
name: azskills-wabi-press
description: Repository-owned visual identity for AzSkills. The 侘寂刊本 Wabi-Press design system — washi paper and pine-soot ink foundations, cinnabar and moss accents, editorial serif typography, hairline structure, and ink-absorption micro-interactions — is the single visual language for README visuals, owned SVG assets, presentation defaults, and other project-facing visual artifacts.
---

# AzSkills Wabi-Press · 侘寂刊本

AzSkills uses the 侘寂刊本 (Wabi-Press) design system as its sole repository-owned visual language. The interface is built from washi paper (和纸) and pine-soot ink (松烟墨). Pure black (`#000000`), pure white (`#FFFFFF`), and heavy shadows are prohibited everywhere. This document replaces the former `azskills-material-design` (Material 3-inspired) contract; the Material 3 reference is retired and no parallel visual language remains in the repository.

The executable source of truth is [`design-system/wabi-press.css`](design-system/wabi-press.css). The theme controller is [`design-system/wabi-press-theme.ts`](design-system/wabi-press-theme.ts). The rendered verification surface is [`design-system/preview/index.html`](design-system/preview/index.html). Every AzSkills-owned visual artifact must derive from these three files.

## Visual thesis

```text
Purpose: make a technical Skill library read like a printed folio — calm, paper-warm, precise, and quietly authoritative.
Tone: 侘寂 (wabi-sabi). Imperfect but deliberate. Editorial, not decorative.
Constraint: GitHub Markdown and SVG rendering must remain robust in both light and dark GitHub themes.
Signature: washi canvas + pine-soot ink text + cinnabar seal marks + 1px hairline structure + editorial serif display type.
```

Direction axes:

- paper-warm rather than sterile white
- ink-graded rather than multi-accent
- hairline-bound rather than shadow-lifted
- spacious (間) rather than dense
- editorial serif display rather than bold sans expansion
- cinnabar seals rather than icon chips
- absorption rather than bounce in every state change

## Primitive tokens

The complete machine-readable token set, identical in `design-system/wabi-press.css`, is normative for all AzSkills-owned surfaces.

### Color · dual spectra

```text
/* [Light · 和纸鸟子谱] */
--bg-canvas: #F5F3EC;            /* 浅暖和纸基底 */
--bg-surface: #FAF9F5;           /* 卡片与承载面 */
--bg-overlay: #ECE8DC;           /* 浮层、Hover 态、次级区块 */
--border-subtle: rgba(40, 36, 32, 0.10);  /* 1px 淡墨压痕线 */
--border-strong: rgba(40, 36, 32, 0.25);  /* 激活与焦点墨线 */

--text-primary: #1C1A17;         /* 松烟墨黑（主文字/标题） */
--text-secondary: #524C44;       /* 熟褐灰（描述/段落） */
--text-muted: #878074;           /* 淡墨灰（元信息/注脚） */

--accent-cinnabar: #A6382A;      /* 朱砂印记（主操作/核心徽章） */
--accent-moss: #3B5848;          /* 铜绿苔色（成功态/次要强调） */
```

```text
/* [Dark · 砚石夜墨谱] */
--bg-canvas: #131416;            /* 深色砚石灰黑，拒绝纯黑 */
--bg-surface: #1B1C20;           /* 微提亮炭灰承载面 */
--bg-overlay: #25272D;           /* 悬浮面板与激活背景 */
--border-subtle: rgba(240, 235, 225, 0.08); /* 云母粉发丝线 */
--border-strong: rgba(240, 235, 225, 0.18);

--text-primary: #EDEAE2;         /* 暖调米纸墨白 */
--text-secondary: #A39F95;       /* 褪色骨灰 */
--text-muted: #68645C;           /* 暗炭灰（辅助标识） */

--accent-cinnabar: #C84A3B;      /* 夜间微荧光朱砂 */
--accent-moss: #537B65;          /* 幽谷苔绿 */
```

Usage rules:

- Cinnabar is the primary action and core badge role. Use it sparingly; it is a stamp, not a wash.
- Moss is the success state and secondary emphasis role.
- Never use pure `#000000` or `#FFFFFF` on any owned surface, including SVG assets.
- Dark theme is selected by the `[data-theme="dark"]` attribute; role meaning is preserved between themes, values are not inverted.

### Typography · editorial stacks

```text
--font-editorial: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", Georgia, serif;
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", SFMono-Regular, Menlo, monospace;
```

Roles:

- Display / large titles: `--font-editorial`, weight 500 (Medium) only — no bold bloat; line-height 1.2–1.35.
- Body / long-form: `--font-sans`, line-height 1.7–1.8, measure strictly `max-width: 65ch` (45–75ch band).
- Technical & index meta (IDs, versions, batches, timestamps, shortcuts, section numbers): `--font-mono` with `font-variant-numeric: tabular-nums` and `letter-spacing: 0.08em`.
- CJK display text leads the editorial stack; Latin serif (Georgia) is the fallback tail.

### Space & geometry · 間

Base the system on an 8px module. Main container whitespace is 1.5× a dense dashboard gutter (≥48px inline padding); section separation stays in the 48–80px band.

```text
--space-1: 8   --space-2: 16   --space-3: 24   --space-4: 32
--space-5: 40  --space-6: 48   --space-8: 64   --space-10: 80

--radius-subtle: 2px;            /* hand-cut paper corner; 0 is also permitted */
--shadow-press: 0 1px 2px rgba(40, 36, 32, 0.04); /* the only permitted shadow */
```

### Motion · physical curves

```text
--ease-paper: cubic-bezier(0.25, 1, 0.4, 1);  /* page switches & surface transitions, 240–320ms */
--ease-ink: cubic-bezier(0.16, 1, 0.3, 1);    /* micro-interactions, 120–150ms */
```

## Editorial rhetoric

Replace generic plastic iconography with publication marks:

- Seal badges (`.seal`, `.seal-cinnabar`, `.seal-moss`): 1px self-bordered stamps for core badges, approvals, and section seals.
- Chapter hairlines (`.hairline`, `.lead-rule`): 1px faded-ink rules that open sections and connect index columns.
- Publication markers: `VOL.`, `SEC.`, `§`, `BAT.`, `✦` in `--font-mono` with `tabular-nums` and `0.08em` tracking.
- First-letter settlement (`.drop-cap`) and footnotes (`.footnotes`, `.footnote-mark`) in editorial prose.
- No emoji as required semantic UI marks; no all-caps microcopy beyond mono index labels.

## Layout & 間 (Ma)

- Layouts follow the 8px module with main-container whitespace at 1.5× a standard dashboard.
- Asymmetric grids only: prefer a 5-column index/meta rail + 7-column primary reading flow, or a 3+6+3 ledger. Avoid rigid 50/50 splits.
- Hierarchy comes from 1px hairline borders (`--border-subtle`) and background lightness steps (`--bg-canvas` → `--bg-surface` → `--bg-overlay`), never from broad blurred shadows.
- `--shadow-press` is the single permitted elevation; it is a paper-seating whisper, not a lift.

## Semantic component rules

```text
Page canvas              → --bg-canvas
Primary container        → .wabi-card (--bg-surface + 1px --border-subtle + --radius-subtle + --shadow-press)
Hoverable / active block → .wabi-card--hoverable (--bg-overlay + --border-strong on :hover)
Secondary block          → .wabi-panel (--bg-overlay, no shadow)
Meta header              → .wabi-meta-header (mono, tabular-nums, 0.08em tracking)
Primary action           → .wabi-button--primary (cinnabar ground, canvas-colored text)
Secondary action         → .wabi-button--moss (moss ground) or .wabi-button (ink hairline)
Ghost action             → .wabi-button--ghost (transparent + hairline)
Input                    → .wabi-input (1px frame) / .wabi-input--underline (minimal underline)
Prose column             → .editorial-prose (65ch measure, 1.7–1.8 leading, pull-quote, footnotes)
Seal badge               → .seal / .seal-cinnabar / .seal-moss
Structural edge          → .hairline (1px --border-subtle)
Emphasis / focus edge    → --border-strong
Primary text             → --text-primary
Secondary text           → --text-secondary
Muted text               → --text-muted
Success / secondary      → --accent-moss
Error / destructive      → --accent-cinnabar (the cinnabar seal doubles as the destructive mark)
```

State matrix (implemented in `wabi-press.css`):

```text
rest          → surface + hairline
hover         → --bg-overlay + --border-strong
focus-visible → 1px --border-strong outline, offset 2px, no glow
active        → ink absorption: background darkens one step + ink line deepens. No transform, no scale, no bounce.
disabled      → opacity 0.45 + not-allowed cursor
reduced-motion → state feedback preserved; spatial movement removed
```

## Executable artifacts

- `design-system/wabi-press.css` — tokens (both spectra), typography reset, and all primitive components. The only CSS authority.
- `design-system/wabi-press-theme.ts` — native TypeScript theme controller: `localStorage` persistence, automatic `prefers-color-scheme` response, guard-clause driven, dependency-free.
- `design-system/preview/index.html` — semantic HTML mounting every token and primitive in both themes; the required visual verification surface for broad visual changes.

Any new AzSkills-owned surface (README asset, slide deck, generated demo) must import or reproduce these tokens verbatim. Do not fork the palette.

## SVG grammar

Every authored SVG should use this layer order:

```text
1. washi / inkstone canvas
2. project identity (cinnabar seal mark, serif wordmark)
3. main information structure (hairline-framed blocks, 0–2px corners)
4. semantic accents (cinnabar primary, moss secondary, ink gradations)
5. typography (editorial display, sans body, mono meta with 0.08em tracking)
```

- Use a small palette per asset: ink text, one cinnabar role, one moss role, washi/inkstone surfaces, hairlines. No blue, no purple, no amber.
- Corners: 0–2px cut. Circles are permitted only for true dot markers (≤4px).
- Never use `#000000` or `#FFFFFF` inside owned SVGs; use `#1C1A17` / `#EDEAE2` and `#FAF9F5` / `#1B1C20` instead.
- SVG text should use semantic roles and maximum widths. Keep all critical prose searchable in the surrounding Markdown or HTML.

## Presentation grammar

`frontend-slides` keeps its exact 1920×1080 fixed stage and interaction contract, but its visual defaults derive from this document:

- Light washi canvas (`#F5F3EC` stage, `#FAF9F5` slide) or dark inkstone (`#131416` / `#1B1C20`) by deck intent.
- Editorial serif display type at weight 500, mono index/meta with `tabular-nums` and `0.08em` tracking.
- 8px spacing rhythm; 2px shape family; hairline dividers; cinnabar seals as the only accent stamps.
- `--ease-paper` for slide reveals (240–320ms); `--ease-ink` for micro feedback (120–150ms). No spring/bounce.
- Obvious focus and navigation states via `--border-strong`.

## README visual grammar

```text
Canvas → GitHub default; assets carry their own washi/inkstone ground
Identity → centered, spacious, low-noise; serif wordmark + cinnabar seal mark
Hero → project evidence (request → contract → checked result), not decoration
Navigation → simple text links
Badges → compact semantic metadata; cinnabar accent color (#A6382A)
H2 icon → local 24px SVG, washi ground + ink strokes + cinnabar/moss accents, 2px corners
Tables → hairline separators and semantic emphasis
Code → neutral container with readable contrast
Support CTA → washi surface with cinnabar arrow, never a dark ad-like banner
```

Avoid the previous conventions: Material tonal surfaces, blue/green/amber multi-accent, Google Sans display type, 8–28px container radii, circle-badged icons, and expressive elevation.

## Responsive and accessibility rules

- Preserve semantic role meaning across light and dark themes; validate each theme as a separate contrast context.
- Maintain non-color state cues (hairline deepening, text change) alongside color.
- Keep critical SVG text legible when scaled; keep all critical prose searchable.
- Never make color alone carry critical state; cinnabar marks must pair with shape or text.
- Allow longer labels and localization expansion; 65ch measures must survive CJK expansion.
- Respect `prefers-reduced-motion`: preserve ink-absorption feedback, remove spatial movement.

## Provenance and implementation level

The Wabi-Press specification was authored by the repository owner as the single design authority for AzSkills. The exact token values above are normative implementation choices, not references to an external product system. The former Material 3 reference (m3.material.io) is fully retired from AzSkills-owned surfaces; no external brand tokens, illustrations, or font files are copied into the repository.

External facts such as font availability should be rechecked against official sources when the contract changes.

## Visual QA

At minimum, broad visual changes must be checked for:

- GitHub light theme rendering
- GitHub dark theme rendering
- `[data-theme="dark"]` rendering of `design-system/preview/index.html` in both system preference modes
- first-screen hierarchy (serif display, mono meta, cinnabar seal)
- icon consistency (washi ground, ink strokes, 0–2px corners, cinnabar/moss accents)
- text wrapping at the 65ch prose measure
- surface nesting via lightness steps and hairlines only (no broad blurred shadows)
- absence of pure `#000000` / `#FFFFFF` in owned CSS and SVG
- tabular numerals and 0.08em tracking on all mono meta
- ink-absorption active states (no bounce, no scale)
- reduced-motion behavior (state feedback preserved)
- SVG clipping/viewBox geometry

Do not sign off a repository-wide visual redesign from source inspection alone when a renderer or image preview is available.
