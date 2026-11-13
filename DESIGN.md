---
name: azskills-wabi-press
description: Repository-owned Wabi Press visual contract for AzSkills. Warm paper, soot ink, serif headings, CJK sans body and restrained pigments; reading, dense tools, slides and terminal targets retain their native geometry and accessible states.
---

# AzSkills Wabi Press Design System

Wabi Press (侘寂刊本) is the default visual language across AzSkills. Warm paper,
soot ink, cinnabar, moss, hairline rules and near-zero shadow support calm,
legible content. Serif titles establish hierarchy; CJK sans serves body text
and labels; mono identifies code and technical metadata.

Default precedence is maintained in [Design Intelligence](design-intelligence.md#default-visual-direction).
An explicit user direction, an authoritative target-project identity or platform
constraints take priority. Adapt composition to the task rather than copying
application chrome into every output.

The executable authority is `design-system/wabi-press.css`, its existing theme
controller, the HTML preview and the TUI preview. Material tokens apply at
`:root` without a surface attribute. The `--wb-*` compatibility API maps into that
same palette. See [Layer scope](#layer-scope).

## Visual thesis

Purpose: make technical capabilities discoverable, readable and verifiable.
Material: paper warmth, soot ink, cinnabar emphasis and moss support.
Signature: serif titles, measured prose, hairlines, restrained corners and space.
Interaction: clear selection, visible focus, search and keyboard access.
Geometry: reading rhythm for prose; compact regions for tools; fixed stages for
slides; character cells and terminal-owned backgrounds for TUI.

## Reference provenance

Wabi Press is a maintained AzSkills implementation choice, not a claim about
historical pigments. Existing repository paper/ink tokens are retained.
VSCodium / VS Code informs tool navigation and keyboard behavior only.
BioRender informed token layering, spacing discipline and grouped selection;
its brand palette, logos and proprietary assets are not part of this system.
Evidence and source reconciliation follow `design-system/SKILL.md`.

## Workbench layout

Use only regions justified by the task; do not add empty chrome for visual imitation.

- **Activity rail:** compact global destinations with explicit accessible names, active indicator, and optional count/status badges.
- **Primary sidebar:** contextual navigation, skill tree, filters, or search results. Support collapse/restore and preserve selection when switching views.
- **Content/editor area:** primary reading or editing task. Give it the largest share of available space and a stable heading/action area.
- **Secondary sidebar:** optional contextual details, related skills, metadata, or assistant tools. Hidden by default when it would compress primary content.
- **Bottom panel:** optional output, validation, diagnostics, task progress, or logs. Collapsible and resizable; never permanently consume space when empty.
- **Status bar:** concise current context such as selected skill, validation state, or workspace scope. Do not use it for marketing copy.

A single-column content view is preferred on narrow screens. Collapse the activity rail to a compact navigation control, convert sidebars to drawers, and move auxiliary panels below or behind tabs. No horizontal page overflow at 320 CSS px.

## Render targets

The workbench contract has two rendering targets. They share information architecture, semantic roles, state names, and keyboard expectations.

```text
GUI   CSS/HTML. Pixel layout, 4px spacing ramp, radius tiers, 2px focus ring, theme tokens.
TUI   ANSI text. Cell grid, row-based spacing, 1-cell glyphs, reverse or bracketed focus,
      terminal-owned background and font.
```

Render target is independent of composition. Reading and tool CSS use one palette. A terminal maps the same semantic roles while retaining its own font, background and cell grid.

## Primitive tokens

The CSS file is the executable source of truth. These semantic roles are normative; exact component styles must reference tokens rather than repeat raw values.

### Color roles

Canonical paper, ink, pigment and reading tokens live at `:root` in
`design-system/wabi-press.css`; `:root[data-theme="dark"]` remaps material values.
The report template must match them. The pigment table below documents both
themes; `scripts/check-editorial.mjs` verifies text contrast and report parity.

~~~css
:root {
  --bg-canvas: #F5F3EC;
  --bg-surface: #FAF9F5;
  --bg-overlay: #ECE8DC;
  --text-primary: #1C1A17;
  --accent-cinnabar: #A6382A;
  --accent-moss: #3B5848;
  --wb-canvas: var(--bg-canvas);
  --wb-text: var(--text-primary);
  --wb-accent: var(--accent-cinnabar);
  --wb-focus: var(--accent-indigo);
  --wb-success: var(--accent-moss);
  --wb-warning: var(--accent-ochre);
  --wb-danger: var(--accent-cinnabar);
}
~~~

- Paper and ink dominate. Avoid pure black/white, decorative gradients and heavy shadows.
- Accent marks actions and selection; status also needs an explicit label or symbol.
- Muted text remains readable. Disabled states include native disabled semantics.

### Accent ramp and state layering

Legacy `--wb-accent-50` through `--wb-accent-900` remain available as derived
aliases. Components consume semantic state roles, not arbitrary ramp steps.
Default uses cinnabar; hover mixes 88% cinnabar with primary ink; active uses
78%. Both themes use this rule, darkening in light mode and lightening in dark.
On-accent text uses canvas paper/ink, verified against every action state.

Selected surfaces use overlay paper, a strong border and a non-color marker.
Focus uses a solid 2px indigo outline with 2px offset, without glow.
Success, warning and danger map to moss, ochre and cinnabar respectively;
words and glyphs distinguish destructive/error states from primary actions.

### Spacing scale

One primitive ramp, three application tiers. Never invent an off-ramp value for a one-off gap; take the nearest step or add a named semantic token.

```css
:root {
  /* Tier 1 · primitive ramp, suffix = px */
  --wb-space-2: 2px;   --wb-space-4: 4px;   --wb-space-6: 6px;   --wb-space-8: 8px;
  --wb-space-12: 12px; --wb-space-16: 16px; --wb-space-20: 20px; --wb-space-24: 24px;
  --wb-space-32: 32px; --wb-space-40: 40px; --wb-space-48: 48px; --wb-space-56: 56px;
  --wb-space-64: 64px; --wb-space-80: 80px;

  /* Tier 2 · grouping roles */
  --wb-gap-inline: var(--wb-space-8);                    /* icon to label, chip to chip */
  --wb-gap-stack: var(--wb-space-12);                    /* fields inside one group */
  --wb-gap-group: var(--wb-space-24);                    /* groups inside one section */
  --wb-inset-control: var(--wb-space-4) var(--wb-space-12);
  --wb-inset-panel: var(--wb-space-16);

  /* Tier 3 · layout */
  --wb-section-gap: var(--wb-space-48);
}
```

- Vertical rhythm: 4px steps inside a component, 8px between components, 12–16px between groups, 24px and above between regions.
- Content gutters stay 8–24px. Reserve 32px and above for separating regions, never for padding inside a control.
- Density changes the gutter and control height, not the ramp. A compact view is tighter, not differently proportioned.
- Padding and gap must both come from the ramp. 10px next to 12px in one panel is drift, not nuance.
- The legacy editorial `--space-1` through `--space-10` module is the 8px subset of this ramp (8, 16, 24, 32, 40, 48, 64, 80). New work uses `--wb-space-*`.

### Radius tiers

Paper-like corners stay restrained. The existing `--wb-radius-sm/md/lg` names
all resolve to 2px; `--wb-radius-pill` remains 999px for compact count/status
chips only. Do not use pill controls or large rounded hero frames as decoration.
Depth comes from hairlines and adjacent paper tones, not stacked shadows.

### Typography and density

- Use editorial serif headings at weight 500; native CJK sans for UI labels and body text. Reserve monospace for code, shortcuts, IDs, and technical metadata.
- Comfortable density is the default for first-use clarity; compact density is an explicit mode for repeated technical work.
- Comfortable rows are 34px with 32px controls; compact rows and controls are 26px. Touch targets on touch-first surfaces should approach 44px.
- Use the spacing ramp in [Spacing scale](#spacing-scale). Use 12–24px tool gutters; reading composition follows the reading contract below.
- Use [Radius tiers](#radius-tiers) for corners. Use borders and surface contrast for grouping; avoid heavy shadows and ornamental cards.

### Density modes

Expose density as a semantic setting, not a page-by-page ad hoc override:

```css
[data-density="comfortable"] { --wb-row-height: 34px; --wb-control-height: 32px; --wb-content-gap: 16px; }
[data-density="compact"] { --wb-row-height: 26px; --wb-control-height: 26px; --wb-content-gap: 8px; }
```

Changing density must not hide labels, remove focus indicators, or reduce touch targets on touch-first layouts.

## Interaction contract

- Provide a global search or command entry for finding skills, actions, and documentation. Support `Ctrl/Cmd+K` when it does not conflict with the host platform.
- Navigation, tabs, tree rows, filters, and panel toggles must work with keyboard alone and expose visible `:focus-visible` styling.
- Distinguish hover, selected, active, focused, disabled, loading, modified, success, warning, and error states.
- Use contextual actions near the item they affect. Avoid icon-only actions without an accessible name or tooltip.
- Preserve sidebar selection, search query, filters, and panel visibility while switching between related views where feasible.
- Provide empty, no-results, loading, and failure states with a next action; do not leave blank panels.
- Respect `prefers-reduced-motion`. Use short state transitions (typically 100–180ms); do not animate layout for decoration.
- Avoid modal dialogs when an inline or side-panel interaction can accomplish the same task without blocking context.

## Content and navigation

- Make the information architecture visible: categories, skill names, concise purpose, compatibility/dependencies, and state.
- Search results should expose why each result matched and support keyboard navigation.
- Long-form skill content should use a stable table of contents, clear heading hierarchy, copyable code, and anchored deep links.
- Use progressive disclosure for advanced metadata, not for essential instructions or the primary action.
- Avoid nested card grids as the default. Prefer lists, trees, tables, tabs, and content sections when those forms match the information.

## Semantic component rules

```text
App shell          → workbench canvas + fixed/anchored navigation regions
Activity rail      → compact, labelled navigation with active marker
Sidebar            → dense tree/list, search/filter header, collapse affordance
Primary content    → readable line length, strong heading hierarchy, contextual toolbar
Auxiliary panel    → optional, resizable/collapsible, meaningful empty state
Status bar         → concise context and operation state
Primary action     → accent background, explicit verb label
Secondary action   → neutral surface + border
Input              → visible label, clear focus, error/help text
Selected item      → surface-active + accent marker + non-color cue
Focus              → 2px visible outline with sufficient offset and contrast
Error/success      → semantic color + icon/label; never color alone
```

## Icon style

One grid, one optical weight, two selection tiers.

```text
Canvas      24 × 24, live area inset 2px (content stays inside 2…22)
Stroke      1.75px on the 24 grid; round caps and joins; no mitred corners
Corners     1.5px radius on every rectangular joint
Geometry    orthogonal and 45° only; round only where the object is round
Fill        none by default; a solid fill marks a resolved state, never decoration
Colour      currentColor in source; README exports use cinnabar (#A6382A light / #E18C7C dark)
Sizes       16px dense rows | 20px toolbar and list | 24px headers and empty states
```

- Stroke weight is authored on the 24 grid. Inline icons carry the optical target directly: 1.75 at 24px, 1.6 at 20px, 1.5 at 16px. An exported file scales its stroke with the box it is rendered into, so set `width`/`height` on the embedding `<img>` instead of faking a size with `transform: scale()`. The shipped README assets — drawn at 1.75 and displayed at 20px — therefore render at about 1.46px; that is the accepted heading weight. For a size-specific export, raise the grid stroke instead of scaling a 24px file: 1.92 for 1.6px at 20, 2.25 for 1.5px at 16.
- Standalone SVGs loaded through `<img>` inherit no host color. README icons define light cinnabar and a prefers-color-scheme dark override inside each SVG; each is checked against its matching canvas. Workbench components read the semantic accent token.
- Do not mix filled and outlined icons in one toolbar. A filled variant means on or selected, and it must also flip the accessible name or `aria-pressed`.
- An icon that needs sub-pixel nudges to look right is mis-drawn, not mis-tuned. Redraw it on the grid.
- Icon-only controls carry an accessible name and a visible tooltip. Pair every status icon with text.
- Keep third-party logos in their own geometry and colour. Do not redraw a product mark into this family.

Selection has two tiers, adapted from how figure editors separate a primitive object from a grouped composition:

```text
Simple selection    one accent rail or 1px outline plus one non-colour cue (check, glyph, count) on the item
Grouped selection   accent outline on the container, a marker on each editable child, and a count badge
```

A group outline with no visible children is a bug: if the parts are not independently actionable, it is a simple selection. Colour never carries the difference alone.

## Terminal / TUI contract

The terminal target reuses the workbench vocabulary. It does not simulate a GUI: no pixel dimensions, rounded corners, shadows, hover, or font choice. A TUI is successful when a keyboard user can identify context, move, filter, read, and act without colour or a mouse.

Executable preview: `node design-system/tui/preview.mjs --width 120 --color truecolor`. The renderer accepts 24-240 columns; the `--check` matrix covers 40-160 columns, and plain narrow output covers 24-39 columns. It fails on width overflow, ANSI leakage, missing state cues, or missing required labels.

### Cell grid and width classes

```text
< 40 cells    Refuse full-screen mode. Print plain text, one action per line.
40-59         Single pane. Show list or detail; Enter opens, Esc returns.
60-99         Two panes. List plus detail. No activity rail.
100-139       Three panes. 4-cell activity rail, list, detail.
140+          Three panes. Widen detail; cap prose at 100 cells.
```

- Layout uses integer cells and rows only. A blank row is a layout unit, not padding.
- Size classes use terminal columns, not window pixels. Reflow on resize.
- Preserve selection, focus, query, and scroll anchor across a resize.
- At any width, critical content wraps or truncates inside the frame. Horizontal scrolling is not a fallback.

### Terminal layout

| Region | Extent | Rule |
| :--- | :--- | :--- |
| Header | 1 row | Product and current context left; theme, density, or job state right. |
| Rule | 1 row | Optional single hairline. Never stack rules. |
| Workspace | Remaining rows | Rail, list, and detail according to the width class. |
| Prompt | 1 row, while active | Search or command input with a visible label and cursor. |
| Status | 1 row | Context and operation state left; 3-5 contextual keys right. |

- Do not draw a full outer frame. It costs two columns and two rows and adds no hierarchy. A modal overlay may use one single-line frame.
- Give the detail pane the flexible width. Cap rail at 4 cells and the list at 24-32 cells.
- Right-align counts and numeric columns. Keep labels left-aligned.
- A pane that has no content is omitted; do not reserve an empty column.

### Terminal colour and attributes

| Role | 16-colour | 256 light / dark | Truecolor light | Truecolor dark | Plain fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Text | terminal default | terminal default | terminal default | terminal default | same text |
| Muted | bright black (90) | 242 / 247 | `#6E675D` | `#AAA397` | text plus label |
| Accent | red (31) | 131 / 174 | `#A6382A` | `#E18C7C` | marker |
| Border | bright black (90) | 242 / 247 | `#6E675D` | `#AAA397` | ASCII rule |
| Selection | accent marker + bold | marker + bold | marker + bold | marker + bold | `>` marker |
| Focus | reverse or underline plus brackets | same | same | same | `[ ]` brackets |
| Success | green (32) | 65 / 108 | `#3B5848` | `#9AB49E` | `OK` |
| Warning | yellow (33) | 94 / 179 | `#795B28` | `#D5B576` | `WARN` |
| Danger | red (31) | 131 / 174 | `#A6382A` | `#E18C7C` | `ERR` |

- Default to 16 colours. Use 256 or truecolor only when the terminal advertises support and the user has not disabled colour. The truecolor columns are evaluation targets for a terminal with a known light or dark palette; brand fidelity is not required.
- Never paint the full canvas background. Let the terminal own background, foreground defaults, font, cursor, and selection colours.
- Pair every attribute with a glyph or word. Bold, dim, underline, and reverse are reinforcement, not the state.
- `NO_COLOR`, `CLICOLOR=0`, or `TERM=dumb` disables ANSI colour, including when a colour mode is requested explicitly. Plain output must remain complete.
- Do not use dim as the only disabled signal, and do not use blink.
- Test the interface against a light terminal palette and a dark terminal palette. A TUI that only works on the author's theme is not finished.

### Terminal spacing and typography

```text
Inline gap       1 cell
List or menu     1 row per item, no blank rows inside
Group gap        1 blank row, detail pane only
Section gap      1 blank row compact; 2 blank rows comfortable, detail at 100+
Pane gutter      2 cells at 60+ columns: one rule plus one space
```

- Body measure is 72-100 cells in the wide class. Below that, the detail pane sets the measure; at 100 columns it is 64 cells. Long prose wraps at word and grapheme boundaries; never break a wide glyph.
- Use bold for the title and the active item. Use underline for links only. Avoid italics for critical text because terminal italic support is inconsistent.
- Short section labels may use uppercase. Sentences use sentence case. Do not uppercase prose.
- Right-align numbers in tables. Keep names and prose left-aligned.
- Truncate with `…` in Unicode mode and `...` in ASCII mode. Middle-truncate paths so the filename stays visible.
- East Asian wide characters occupy two cells; combining marks occupy zero. Wrap and truncate by grapheme, not by code unit.
- Ambiguous-width glyphs such as `─`, `│`, `▌`, `…`, `✓`, `×`, and `•` depend on terminal configuration. ASCII mode is the portable path; never use an ambiguous glyph as the only alignment device.

### Terminal glyphs

```text
Required ASCII   >  v  -  *  +  x  !  ?  OK  ERR  ...
Optional Unicode  ▌  ›  ✓  ×  …  ─  │
```

- Every functional glyph fits one cell. Do not use emoji, Nerd Font icons, Private Use Area characters, or double-width symbols for alignment.
- Every glyph has a text label nearby or in the status/help area.
- Selection uses a marker plus emphasis. A filled glyph means resolved or complete, never decoration.
- The optional Unicode set is an enhancement. The ASCII set must render the same states.

### Terminal components

```text
Header bar      product, breadcrumb, state; one row
Activity rail   four cells, one-letter destinations, active marker
List            one item per row; marker, label, secondary metadata
Detail          heading, metadata, prose, next actions
Prompt          label, input, cursor, validation message
Status bar      context left, contextual keys right
Help overlay    keyboard map; close hint; at most 60% of width
Table           header rule only; no vertical grid
Progress        percent text plus a 10-cell bar
Empty state     reason plus one next action
```

- Selected and focused are different states. Selection persists while focus moves; show both.
- Focus uses reverse video or underline plus brackets. Selection uses a marker plus bold. Neither relies on colour.
- Show at most five context keys in the status bar. Put the full map behind `?`.
- Use a single-line frame only for a modal. Do not nest boxes.
- When a list is longer than its viewport, expose position (`10/20`) or a scroll marker in the list header or status bar.
- A terminal narrower than 40 columns uses the narrow plain formatter: one action per line, no frame, no horizontal rules, no ANSI.

### Keyboard and focus

- `/` opens search, `:` opens command entry, `?` opens help.
- Arrow keys and `j`/`k` move; `g`/`G` jump to start/end; `Tab` moves focus; `Enter` opens; `Esc` goes back or cancels; `q` quits; `Ctrl+C` cancels the current operation.
- One region owns focus at a time. The focused region exposes a visible boundary; the selected item remains marked when focus leaves.
- Document every shortcut in help and show the context-relevant subset in the status bar.
- Mouse support is optional. No action may require a pointer or hover.

### Redraw, motion, and resize

- Redraw by diffing the frame. Do not clear the screen on every keystroke. Restore the cursor on exit and on error.
- No decorative motion. State changes are immediate. A spinner is allowed only for an operation longer than 150ms, in a TTY, at no more than 10 frames per second.
- `NO_MOTION` or a reduced-motion preference replaces the spinner with static progress text and leaves the value visible.
- Coalesce resize events and repaint once. Never write a frame wider than the current column count.

### Terminal accessibility and safety

- Provide `--plain` output: no ANSI, ASCII glyphs, stable line order, no cursor addressing. It must remain usable in logs, pipes, and screen readers.
- Sanitize untrusted text before writing it to the terminal. Strip C0/C1 controls, ESC, OSC, BEL, and non-application CSI sequences. Never pass a skill file's escape sequences through to the terminal.
- Do not emit OSC 8 hyperlinks from repository content. Show a URL as text, or emit a link only from trusted application chrome after an explicit opt-in.
- Test at 40, 80, and 120 columns, with colour disabled, and with a light and a dark terminal palette.
- Support localized labels and wide characters. Do not hard-code English label widths into column math.

### GUI to TUI mapping

| GUI expression | Terminal expression |
| :--- | :--- |
| Canvas and surface fills | Terminal default background; no full-screen fill |
| 2px focus ring | Reverse video or underline plus brackets |
| 2px paper corner | No radius; single-cell rules and spacing |
| 4px spacing ramp | 1-cell inline gap; 1-2 row group gap |
| 24px icon grid | 1-cell glyph with an ASCII fallback |
| 34/26px row height | One terminal row |
| Hover and pointer affordances | Focus and selection; mouse optional |

## Accessibility and responsiveness

- Use semantic HTML and native TypeScript/CSS/HTML; no frontend framework or runtime dependency is required by this contract.
- All controls need accessible names, keyboard behavior, logical focus order, and visible focus.
- Support text zoom, localization expansion, and long unbroken technical tokens without clipping.
- Keep primary content usable at 320px width; use drawers/stacking instead of horizontal overflow.
- Do not encode status only in color, motion, hover, or position.
- Check light and dark themes, compact and comfortable density, keyboard-only use, reduced motion, empty/loading/error states, and narrow viewport behavior.

## Scenario adaptation

Wabi Press supplies the fallback visual direction across visual skills. Surface
geometry and platform rules remain specific to the task.

| Surface | Shared material | Composition and constraints |
| :--- | :--- | :--- |
| Workbench and editor UI | Paper/ink, cinnabar actions, serif headings | Search, navigation, selection, 34/26px rows; sans labels |
| README and long-form docs | Serif art titles, paper/ink SVGs, hairlines | Native Markdown, readable hierarchy, theme-aware picture assets; no fake controls |
| Slide decks | Paper/ink, serif titles, restrained pigments | Fixed 1920x1080 stage; no application chrome; narrative spacing |
| Reading-first HTML reports | Canonical tokens and reading rhythm | Natural height, CJK sans body, single column on phones; no fixed-stage scaling |
| Logo and identity | Restrained palette and contrast when brief permits | Original mark geometry; target identity takes precedence |
| Hero and illustration art | Paper/ink, subtle rules and minimal depth | Editorial composition serving the subject; no invented UI behavior |
| Motion | Quiet transitions and reduced-motion parity | ui-motion owns timing and mechanism; no continuous decoration |
| Terminal UI | Semantic cinnabar/moss/ochre roles and state cues | Terminal-owned background/font; integer cells, ANSI fallback, NO_COLOR |

Adaptation changes composition, density and emphasis. It preserves state meaning,
focus and legibility. Do not force GUI fonts or paper fills into a terminal.

## Layer scope

There is one material palette with reading and tool adaptations:

- No root attribute: Wabi Press material, reading typography and `.wabi-*` primitives.
- `data-surface="editorial"`: compatible with the reading default; no opt-in required.
- `data-surface="workbench"`: same material, compact body typography and `.wb-*` geometry.
- `.editorial-prose` and `.wabi-*` also work in a mixed tool document. Generic reading
  body/heading rules are document-level; use semantic classes for a local article.
- `--wb-*` colors alias canonical paper/ink roles. Preserve stylesheet paths,
  theme-controller exports, storage key and `data-theme` light/dark behavior.
- Density affects tool rows/controls only. Do not shrink reading body text.
- TUI maps semantic roles without adding a separate brand palette or CSS layer.

Existing `--wb-*` and `.wb-*` consumers gain the paper palette without renaming.
Set `data-surface="workbench"` for a standalone dense shell that previously relied
on the old implicit tool body typography. Explicit editorial roots keep working.

## Editorial reading contract

Wabi-Press (侘寂刊本) values calm comprehension: paper warmth and restrained
pigments establish character; legible text, grouping and reading order govern
every choice. Whitespace separates ideas and keeps evidence near its claim.
Avoid faded body text and sparse content stretched over screens. These values
are maintained design choices, not historical pigment claims.

### Pigments and roles

All foregrounds below support normal text on canvas, surface and overlay in
their matching theme (4.5:1 minimum). Tints carry primary/secondary ink;
never assume arbitrary pigment-on-pigment combinations are readable.

| Token | Light | Dark | Purpose |
| :--- | :--- | :--- | :--- |
| --accent-cinnabar | #A6382A | #E18C7C | Primary action, key emphasis |
| --accent-moss | #3B5848 | #9AB49E | Positive result, supporting emphasis |
| --accent-indigo | #405F73 | #9EBBCB | References, information, focus |
| --accent-ochre | #795B28 | #D5B576 | Caution, uncertainty, annotation |
| --accent-clay | #855747 | #CEA38E | Context, quotation, secondary data |
| --text-muted | #6E675D | #AAA397 | Readable metadata and sources |
| --tint-indigo | #E4EBED | #253039 | Information carrier |
| --tint-ochre | #EFE7D5 | #342F24 | Caution carrier |
| --tint-clay | #EEE2DA | #352A27 | Context carrier |

Keep paper and ink dominant. Usually use one main accent plus one supporting
pigment per section; additional pigments need meaningful data categories.
Labels, line styles or symbols must also identify states and chart series.
Use normal ink on tints. Decorative hairlines cannot be the only control boundary.

### Typography and density

- Default body: CJK-capable system sans (--font-reading), 1.125rem, 1.75-1.8
  leading; captions and sources: at least 1rem, 1.6 leading. Keep the root at
  the reader's default size and allow zoom. Do not shrink text to fit a page.
- Titles: editorial serif, weight 500, 1.28-1.35 leading. Body emphasis may use
  600-700; avoid long bold paragraphs. Use real font weights where available.
- Code and identifiers: mono, with Maple Mono NF CN as an optional technical
  face; normal tracking. Navigation, prose, captions and CJK labels use sans.
  Tabular numerals help comparisons; avoid wide tracking on whole sentences.
- Latin prose targets 45-75 characters per line, default 65ch. Chinese prose
  uses a 34em maximum (roughly 28-36 full-width glyphs on desktop); phones use
  available width with 16-24px gutters. Never force the desktop minimum on phones.
- One claim per section, followed by evidence and sources. Use paragraphs for
  connected reasoning, lists for parallel items, and tables for comparisons.
  Long text stays in one reading column; desktop side-by-side evidence follows
  DOM order when stacked. Avoid card walls and empty minimum-height pages.
- Dense tables may use 1rem type and 1.5-1.6 leading with local horizontal
  scrolling. Keep surrounding prose at body size; never compress it to fit.

### Reading rhythm

Apply .editorial-prose to prose containers; reports use matching rules in
frontend-slides/assets/report.css. Relative gaps scale with reader text size.
One relationship owns its margin, avoiding accumulated browser default margins.

| Relationship | Token | Default |
| :--- | :--- | :--- |
| Paragraph to paragraph / adjacent blocks | --reading-paragraph-gap | 1em |
| Previous block to subheading | --reading-heading-gap | 2em |
| Heading to its content | --reading-heading-after | 0.75em |
| List item to next item | --reading-list-gap | 0.5em |
| Text to figure; figure to following text | --reading-figure-gap | 1.5em |
| Image to its caption | --reading-caption-gap | 0.5em |
| Section to next section | --reading-section-gap | 32-64px, fluid |

Use semantic figure/figcaption, meaningful alt text and nearby source links.
Keep captions closer to their image than surrounding prose. Preserve intrinsic
image proportions; pair complex charts with a text summary or table. Avoid
blank paragraphs, manual desktop line breaks and fixed-height prose containers.
CJK text keeps normal tracking and natural wrapping.

### Reading verification

Check light/dark text on every shipped surface, including tints, links, captions
and buttons. Verify 320px phones, intermediate and wide viewports, 200% text
enlargement, long Chinese titles, font fallback, keyboard focus and print.
Content must also survive user spacing of 1.5 line height, 2em paragraph gaps,
0.12em letter spacing and 0.16em word spacing without clipping or loss.
Inspect grouping and reading order, not just token declarations. Record which
checks were actually rendered; a static audit cannot prove readability.

## External reference

- VSCodium releases: https://github.com/VSCodium/vscodium/releases
- VS Code workbench layout documentation: https://code.visualstudio.com/docs/editing/getting-started/userinterface

The reference contributes proven workbench structure and interaction patterns. AzSkills must adapt them to its own skill-discovery and technical-reading tasks rather than copy the editor wholesale.

## Visual QA

- [ ] `DESIGN.md`, CSS tokens, theme controller, and preview describe the same Wabi Press default and tool adaptation.
- [ ] Light/dark themes and compact/comfortable density are represented in the preview.
- [ ] Sidebar, content, optional panel, and status regions have clear priority.
- [ ] Search, selection, focus, disabled, loading, success, warning, and error states are visible and distinguishable.
- [ ] Keyboard-only navigation and command/search entry are documented and usable.
- [ ] Narrow viewport has no horizontal overflow and preserves access to navigation.
- [ ] Long technical content remains readable; dense lists do not waste vertical space.
- [ ] Reduced-motion and localization expansion are respected.
- [ ] No new framework or runtime dependency was introduced.
- [ ] Spacing resolves to `--wb-space-*`; no off-ramp gap or padding survives review.
- [ ] Icons follow the 24px grid and stroke compensation; no toolbar mixes fill and outline.
- [ ] Selection exposes a non-colour cue; grouped selection shows child markers and a count.
- [ ] The scenario matrix was applied: no workbench chrome reached slides, identity, or editorial surfaces.
- [ ] The default needs no attribute; explicit editorial is compatible; workbench shares its palette.
- [ ] The TUI preview passes `node design-system/tui/preview.mjs --check` across 40-160 columns.
- [ ] TUI plain mode contains no ANSI sequences and no non-ASCII glyphs; critical state remains readable.
- [ ] TUI selection, focus, success, warning, and error survive `NO_COLOR` and a light or dark terminal palette.
- [ ] CJK width, grapheme-safe truncation, and escape-sequence sanitization are covered.
- [ ] No TUI surface paints the full background, uses emoji, or depends on Nerd Font or Private Use Area glyphs.
