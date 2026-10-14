---
name: azskills-workbench
description: Repository-owned interface design contract for AzSkills. A practical, VSCodium-inspired workbench system prioritizing navigation, search, dense technical content, keyboard operation, responsive layouts, and accessible states.
---

# AzSkills Workbench Design System

AzSkills uses a **workbench-first** interface model inspired by the information architecture and interaction conventions of the current VSCodium / VS Code workbench. This is a functional reference, not a pixel-level clone: do not copy product branding, icons, screenshots, or proprietary assets.

The system is designed for a technical Skill library: frequent navigation, discovery, reading long instructions, comparing related capabilities, and moving between tasks. Aesthetic polish must not reduce scan speed, usable content area, keyboard access, or information density.

The executable authority remains `design-system/wabi-press.css`, `design-system/wabi-press-theme.ts`, and `design-system/preview/index.html`. These artifacts must express the same workbench contract.

## Visual thesis

```text
Purpose: make technical capabilities discoverable and usable with minimal navigation cost.
Model: workbench shell + contextual navigation + focused content + optional auxiliary panel.
Tone: quiet, precise, neutral, information-dense; functional before decorative.
Signature: compact chrome, clear active rail, readable content canvas, keyboard-first command/search entry, and persistent status feedback.
```

## Workbench layout

Use only regions justified by the task; do not add empty chrome for visual imitation.

- **Activity rail:** compact global destinations with explicit accessible names, active indicator, and optional count/status badges.
- **Primary sidebar:** contextual navigation, skill tree, filters, or search results. Support collapse/restore and preserve selection when switching views.
- **Content/editor area:** primary reading or editing task. Give it the largest share of available space and a stable heading/action area.
- **Secondary sidebar:** optional contextual details, related skills, metadata, or assistant tools. Hidden by default when it would compress primary content.
- **Bottom panel:** optional output, validation, diagnostics, task progress, or logs. Collapsible and resizable; never permanently consume space when empty.
- **Status bar:** concise current context such as selected skill, validation state, or workspace scope. Do not use it for marketing copy.

A single-column content view is preferred on narrow screens. Collapse the activity rail to a compact navigation control, convert sidebars to drawers, and move auxiliary panels below or behind tabs. No horizontal page overflow at 320 CSS px.

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
  --wb-text-muted: #707782;
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

### Typography and density

- Use a native system sans-serif stack for UI labels and body text. Reserve monospace for code, shortcuts, IDs, and technical metadata.
- Comfortable density is the default for first-use clarity; compact density is an explicit mode for repeated technical work.
- Comfortable row height: 32–36px. Compact row height: 24–28px. Standard controls: 28–36px. Touch targets on touch-first surfaces should approach 44px.
- Use an 4px base spacing scale (4, 8, 12, 16, 24, 32). Prefer 12–24px content gutters over oversized editorial whitespace.
- Use 4–8px corners for controls and panels. Use borders and surface contrast for grouping; avoid heavy shadows and ornamental cards.

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

## Accessibility and responsiveness

- Use semantic HTML and native TypeScript/CSS/HTML; no frontend framework or runtime dependency is required by this contract.
- All controls need accessible names, keyboard behavior, logical focus order, and visible focus.
- Support text zoom, localization expansion, and long unbroken technical tokens without clipping.
- Keep primary content usable at 320px width; use drawers/stacking instead of horizontal overflow.
- Do not encode status only in color, motion, hover, or position.
- Check light and dark themes, compact and comfortable density, keyboard-only use, reduced motion, empty/loading/error states, and narrow viewport behavior.

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
