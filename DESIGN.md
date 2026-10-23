---
name: azskills-workbench
description: Repository-owned interface design contract for AzSkills. A practical, VSCodium-inspired workbench system prioritizing navigation, search, dense technical content, keyboard operation, responsive layouts, and accessible states. Defines one 4px spacing ramp, one icon grid, a cell-based terminal rendering target, explicit colour-state layering, and per-surface adaptation rules so the workbench does not leak into slides, identity, or editorial output.
---

# AzSkills Workbench Design System

AzSkills uses a **workbench-first** interface model inspired by the information architecture and interaction conventions of the current VSCodium / VS Code workbench. This is a functional reference, not a pixel-level clone: do not copy product branding, icons, screenshots, or proprietary assets.

The system is designed for a technical Skill library: frequent navigation, discovery, reading long instructions, comparing related capabilities, and moving between tasks. Aesthetic polish must not reduce scan speed, usable content area, keyboard access, or information density.

The executable authority is `design-system/wabi-press.css`, `design-system/wabi-press-theme.ts`, `design-system/preview/index.html`, and `design-system/tui/preview.mjs`. These artifacts must express the same workbench contract. The stylesheet carries two layers with different scopes: the workbench layer applies by default, and the historical washi editorial layer applies only when `data-surface="editorial"` is set on the `<html>` root. See [Layer scope](#layer-scope).

## Visual thesis

```text
Purpose: make technical capabilities discoverable and usable with minimal navigation cost.
Model: workbench shell + contextual navigation + focused content + optional auxiliary panel.
Tone: quiet, precise, neutral, information-dense; functional before decorative.
Signature: compact chrome, clear active rail, readable content canvas, keyboard-first command/search entry, persistent status feedback, and a terminal rendering that preserves the same information hierarchy.
```

## Reference provenance

Two public references shape this contract. Both were studied for structure; neither contributes brand assets, copy, or proprietary graphics.

```text
VSCodium / VS Code workbench   → layout regions, navigation and search conventions, density, keyboard model.
BioRender (biorender.com, app.biorender.com)
                               → spacing discipline, semantic colour layering with explicit state ramps,
                                  icon grouping semantics, and per-scenario theme adaptation.
```

Evidence levels follow the vocabulary defined in [`design-system/SKILL.md`](design-system/SKILL.md).

```text
verified-token     BioRender bright-blue 50–900 ramp; primary button background default/hover/active =
                   blue 700/800/900; secondary hover/active = blue 50/100 background with blue 100/200 border;
                   card border hover = blue 700; icon accent = blue 700; spacing primitives on a 4px base;
                   three-tier token naming (primitive → grouping/molecule → organism).
verified-prose     BioRender editor information architecture: gallery home, canvas-only export, left tool
                   column, searchable icon library, top utility bar plus selection-contextual tools, a blue
                   bounding box for one simple object, a purple bounding box for a grouped object with
                   editable children, brand kits of 8 primary + 16 secondary colours with 6 fonts and 6 logos.
implementation-choice
                   Every value in this document. AzSkills keeps its own accent, type stack, and radii, and
                   adopts the reference's structure - a primitive ramp, explicit semantic states, one icon
                   grid, and a scenario matrix - rather than its palette or its layout.
```

The reference is internally inconsistent, and that inconsistency is instructive: its marketing surface runs pill buttons, 12px card radii, and generous section gaps, while its product app runs 4–6px control radii at a denser type scale. AzSkills resolves the same tension the same way: radius and spacing follow surface role, never one global value.

Third-party colour aggregators disagree with the target stylesheet on the primary value (`#2571B7` and `#0373DF` both appear). Those readings are **待确认** and are not used above; only values captured from the target's own CSS were adopted.

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

Render target is orthogonal to the two CSS layers. The editorial layer is a GUI reading surface; it has no TUI counterpart. A terminal implementation maps the workbench layer. It does not add a third palette or a third CSS layer.

## Primitive tokens

The CSS file is the executable source of truth. These semantic roles are normative; exact component styles must reference tokens rather than repeat raw values.

### Color roles

```css
:root {
  --wb-canvas: #F7F8FA;
  --wb-surface: #FFFFFF;
  --wb-surface-subtle: #F3F4F6;
  --wb-surface-active: #E8F0FE;
  --wb-border: #D9DDE3;
  --wb-border-strong: #AEB6C2;
  --wb-text: #202124;
  --wb-text-secondary: #5F6368;
  --wb-text-muted: #666C78;
  --wb-accent: #0B57D0;
  --wb-accent-hover: #0842A0;
  --wb-focus: #0B57D0;
  --wb-success: #137333;
  --wb-warning: #8A4B00;
  --wb-danger: #B3261E;
}
[data-theme="dark"] {
  --wb-canvas: #18191C;
  --wb-surface: #202127;
  --wb-surface-subtle: #282A30;
  --wb-surface-active: #263B5E;
  --wb-border: #383B43;
  --wb-border-strong: #555B66;
  --wb-text: #E6E8EC;
  --wb-text-secondary: #B4BAC4;
  --wb-text-muted: #9299A5;
  --wb-accent: #A8C7FA;
  --wb-accent-hover: #D3E3FD;
  --wb-focus: #A8C7FA;
  --wb-success: #81C995;
  --wb-warning: #FDD663;
  --wb-danger: #F2B8B5;
}
```

- Use accent for primary actions, links, selected navigation, and focus. Reserve success/warning/danger for actual state.
- Never rely on color alone: pair state with text, icon shape, border, or accessible status.
- Maintain readable contrast in both themes. Muted text must remain readable; do not use opacity as the sole disabled-state signal.

### Accent ramp and state layering

The accent is a ramp, not a single value. Components reference a semantic state token; they never reference a raw step.

```css
:root {
  --wb-accent-50: #E8F0FE;   --wb-accent-100: #D3E3FD;  --wb-accent-200: #A8C7FA;
  --wb-accent-300: #7CACF8;  --wb-accent-400: #4C8DF6;  --wb-accent-500: #1A73E8;
  --wb-accent-600: #0B57D0;  /* --wb-accent */
  --wb-accent-700: #0842A0;  /* --wb-accent-hover */
  --wb-accent-800: #062E6F;  /* --wb-accent-active */
  --wb-accent-900: #041E49;
  --wb-accent-selected: var(--wb-accent-50);
}
```

- One interaction step per state: default 600, hover 700, active 800. Treat the ramp as ordered, not as a palette to sample from.
- Selected surfaces use step 50 with a 1px step-100 border **and** a non-colour marker (rail, glyph, count). A tinted background alone is not a selection.
- Dark theme remaps the accent to `#A8C7FA` and lightens on hover (`#D3E3FD`). Step numbers describe light-theme contrast; do not reuse them literally in dark.
- Status colours keep their own ramps. Never tint success, warning, or danger with the accent.

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

Radius communicates surface role, not taste.

```css
:root {
  --wb-radius-sm: 4px;      /* dense controls: inputs, buttons, list rows, tabs */
  --wb-radius-md: 6px;      /* panels, popovers, cards at product density */
  --wb-radius-lg: 12px;     /* large containers, media wrappers, hero frames */
  --wb-radius-pill: 999px;  /* standalone primary CTA, status chip, count badge */
}
```

- Product and editor surfaces stay at 4–6px. A tool surface where every control is a pill loses scanning speed and reads as decoration.
- Pill radius is for one standalone action on a marketing-style surface, or for a small status or count chip. Do not mix pill and 4px controls in one toolbar.
- Nest radii by one step at most: a 6px panel may contain 4px controls, not 12px ones.

### Typography and density

- Use a native system sans-serif stack for UI labels and body text. Reserve monospace for code, shortcuts, IDs, and technical metadata.
- Comfortable density is the default for first-use clarity; compact density is an explicit mode for repeated technical work.
- Comfortable rows are 34px with 32px controls; compact rows and controls are 26px. Touch targets on touch-first surfaces should approach 44px.
- Use the spacing ramp in [Spacing scale](#spacing-scale). Prefer 12–24px content gutters over oversized editorial whitespace.
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
Colour      currentColor in source; README exports pin accent step 500 (#1A73E8)
Sizes       16px dense rows | 20px toolbar and list | 24px headers and empty states
```

- Stroke weight is authored on the 24 grid. Inline icons carry the optical target directly: 1.75 at 24px, 1.6 at 20px, 1.5 at 16px. An exported file scales its stroke with the box it is rendered into, so set `width`/`height` on the embedding `<img>` instead of faking a size with `transform: scale()`. The shipped README assets — drawn at 1.75 and displayed at 20px — therefore render at about 1.46px; that is the accepted heading weight. For a size-specific export, raise the grid stroke instead of scaling a 24px file: 1.92 for 1.6px at 20, 2.25 for 1.5px at 16.
- Standalone SVGs loaded through `<img>` inherit no `currentColor`, so README assets set `color` on the root. Step 500 is used there because it holds at least 4:1 against both the light and dark README canvas; workbench components still read the semantic accent token.
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
| Muted | bright black (90) | 244 / 246 | `#666C78` | `#9299A5` | text plus label |
| Accent | blue (34) | 26 / 153 | `#0B57D0` | `#A8C7FA` | marker |
| Border | bright black (90) | 240 / 238 | `#D9DDE3` | `#383B43` | ASCII rule |
| Selection | accent marker + bold | marker + bold | marker + bold | marker + bold | `>` marker |
| Focus | reverse or underline plus brackets | same | same | same | `[ ]` brackets |
| Success | green (32) | 28 / 114 | `#137333` | `#81C995` | `OK` |
| Warning | yellow (33) | 130 / 221 | `#8A4B00` | `#FDD663` | `WARN` |
| Danger | red (31) | 160 / 217 | `#B3261E` | `#F2B8B5` | `ERR` |

- Default to 16 colours. Use 256 or truecolor only when the terminal advertises support and the user has not disabled colour. The truecolor columns are evaluation targets for a terminal with a known light or dark palette; brand fidelity is not required.
- Never paint the full canvas background. Let the terminal own background, foreground defaults, font, cursor, and selection colours.
- Pair every attribute with a glyph or word. Bold, dim, underline, and reverse are reinforcement, not the state.
- `NO_COLOR`, `CLICOLOR=0`, or `TERM=dumb` disables ANSI colour. Plain output must remain complete.
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

- Body measure is 72-100 cells. Long prose wraps at word and grapheme boundaries; never break a wide glyph.
- Use bold for the title and the active item. Use underline for links only. Avoid italics for critical text because terminal italic support is inconsistent.
- Short section labels may use uppercase. Sentences use sentence case. Do not uppercase prose.
- Right-align numbers in tables. Keep names and prose left-aligned.
- Truncate with `…` in Unicode mode and `...` in ASCII mode. Middle-truncate paths so the filename stays visible.
- East Asian wide characters occupy two cells; combining marks occupy zero. Wrap and truncate by grapheme, not by code unit.

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
| 4/6/12px radius | No radius; single-cell rules and spacing |
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

The workbench contract governs interactive, repository-owned UI. It does not govern every artifact in the repository. Classify the surface before styling it.

| Surface | Adopt | Adapt | Keep as reference only | Reject |
| :--- | :--- | :--- | :--- | :--- |
| Workbench and editor UI | Regions, density modes, state contract, 4px ramp, icon grid | Accent per product identity; radius 4–6px | Pill radius | — |
| README and long-form docs | Heading hierarchy, spacing tiers, mono for technical tokens, 1px rules over shadows | Measure 65–75ch; no fixed viewport; light/dark parity via `<picture>` | Density modes (Markdown has no interactive density) | Status-bar language; keyboard badges that imply unavailable behaviour |
| Slide decks | Type-scale discipline, spacing ramp for margins, one accent family | Fixed 1920×1080 stage; section gaps may exceed the ramp (64–120px) | — | Workbench chrome; rail and sidebar metaphor |
| Logo and identity | Contrast discipline, single accent, grid construction | Own geometry system | 24px icon grid | Stroke weight, pill radius, UI tokens |
| Hero and illustration art | Palette family, radius tiers, spacing rhythm | Decorative density, perspective, depth | Colour ramp values | Interactive state semantics |
| Motion | 100–180ms state transitions, reduced-motion parity | Expressive motion for narrative surfaces | Easing tokens | Continuous decorative motion on tool surfaces |
| Terminal UI | Cell grid, pane priorities, semantic roles, keyboard model, plain mode | One-cell glyphs with ASCII fallback; ANSI 16/256/truecolor | Pixel spacing, radius, shadows, hover | Full-screen paint, emoji, Nerd Font or PUA dependency |

- A surface outside the first row still has to pass the accessibility and visual-QA requirements; it may set its own art direction.
- Adaptation changes composition and emphasis. It never changes what a state colour means or how focus behaves.
- When a surface needs a value that is not on the ramp, add a named semantic token and record it as `implementation-choice`. Do not scatter a one-off number.

## Layer scope

`design-system/wabi-press.css` carries two visual layers. Scope decides which one applies; they are not two competing themes.

```text
Workbench layer   applies to :root by default. Owns --wb-* tokens and .wb-* primitives.
Editorial layer   applies only inside html[data-surface=editorial]. Owns the washi material tokens
                  (--bg-*, --border-*, --text-*, --accent-cinnabar, --accent-moss) and the .wabi-* primitives.
Shared            Type stacks, the 8px editorial spacing module, measure, and easing curves are structural and
                  stay at :root so both layers can read them.
```

- Set `data-surface=editorial` only on a long-form reading surface that benefits from the washi treatment. Never on a tool shell.
- `data-surface=editorial` is a document-level switch on `<html>`. It does not isolate one article inside a workbench page: tokens, the body background, headings, and focus rules all key off the root element.
- Do not add a third layer. A new surface either uses the workbench tokens, opts into the editorial layer, or is covered by the scenario matrix.
- A terminal implementation is a render target of the workbench layer, not a CSS layer. Map the semantic roles in [Terminal colour and attributes](#terminal-colour-and-attributes); do not invent a second palette.
- A component may reference semantic tokens from its own layer only. Cross-layer token use is drift.
- The workbench uses a 2px focus ring. The editorial layer keeps its 1px ink line because its material rules forbid glow-like rings; both stay visible and offset.

## External reference

- VSCodium releases: https://github.com/VSCodium/vscodium/releases
- VS Code workbench layout documentation: https://code.visualstudio.com/docs/editing/getting-started/userinterface

The reference contributes proven workbench structure and interaction patterns. AzSkills must adapt them to its own skill-discovery and technical-reading tasks rather than copy the editor wholesale.

## Visual QA

- [ ] `DESIGN.md`, CSS tokens, theme controller, and preview describe the same workbench system.
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
- [ ] The default surface renders the workbench layer; `data-surface="editorial"` renders the washi layer.
- [ ] The TUI preview passes `node design-system/tui/preview.mjs --check` across 40-160 columns.
- [ ] TUI plain mode contains no ANSI sequences and no non-ASCII glyphs; critical state remains readable.
- [ ] TUI selection, focus, success, warning, and error survive `NO_COLOR` and a light or dark terminal palette.
- [ ] CJK width, grapheme-safe truncation, and escape-sequence sanitization are covered.
- [ ] No TUI surface paints the full background, uses emoji, or depends on Nerd Font or Private Use Area glyphs.
