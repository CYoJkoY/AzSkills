# Editable HTML Resume

Read this reference whenever the requested artifact is an editable HTML resume. A
static HTML page is not sufficient: the delivered file must stay directly editable,
fit predictably, and print cleanly. Start from
[the editable base](../assets/editable-resume-base.html) and adapt its document
design to the source resume.

## Editing contract

- Use block-level editing. Make each heading, paragraph, row field, and bullet
  directly editable instead of placing one `contenteditable` attribute on the whole
  page.
- `Enter` creates a usable paragraph or list break; `Shift+Enter` inserts a soft
  line break inside the current block. Empty editable paragraphs stay visible and
  deletable.
- Provide font-size decrease and increase controls.
- Provide paragraph-spacing controls plus insert-paragraph and
  delete-current-paragraph controls.
- Provide a text-color picker.
- Provide bold, left-align, center, right-align, and justify controls.
- Provide undo and redo where the browser supports them.
- Provide a one-page auto-fit control with a visible occupied-height percentage.
- Provide a visible print control that calls `window.print()`.
- Keep local save and download-HTML controls so manual edits survive closing,
  refreshing, or sharing the file.
- Keep a visible selected-block and focus state so the active block is findable by
  keyboard and pointer users.
- Show a disabled state on controls that cannot act, such as delete when no block is
  selected, and undo or redo when the browser reports the command unavailable. Do not
  rely on opacity alone; keep an accessible name and a readable label.
- Expose the same actions through keyboard navigation with visible focus rings, and
  keep button labels readable at 200 percent zoom without horizontal clipping.

## Editor chrome and document design

The file has two visual layers with separate ownership:

| Layer | Owner | Rule |
| :--- | :--- | :--- |
| Editor chrome | `ui-design` | Toolbar, copy panel, focus and disabled states, warning banner, and control grouping. Uses the semantic `--wb-*` role names with local inline values so the file stays independently openable. |
| Resume paper | This Skill | Typography, color, section order, spacing, dividers, alignment, and date placement. Preserves the source design. |

When the toolbar needs construction or refinement, compose with `ui-design` and map
the chrome onto semantic roles:

```css
:root {
  --wb-surface: #ffffff;
  --wb-surface-subtle: #f3f4f6;
  --wb-border: #d9dde3;
  --wb-text: #202124;
  --wb-text-secondary: #5f6368;
  --wb-accent: #0b57d0;
  --wb-accent-hover: #0842a0;
  --wb-focus: #0b57d0;
  --wb-warning-bg: #fff1c7;
  --wb-warning-ink: #6a4b00;
  --wb-radius-sm: 4px;
  --wb-space-8: 8px;
  --wb-space-12: 12px;
}
```

- Declare the values inline in the file. The artifact must open from any folder
  without a linked stylesheet.
- Do not apply the workbench skin to the resume paper. A recruiter reads the paper;
  the chrome supports editing only.
- Keep one radius tier inside the toolbar. Do not mix pill and square controls.
- Use spacing and border contrast for grouping rather than heavy shadows.
- Respect `prefers-reduced-motion` when the panel scroll or any state transition is
  animated.

## Text-color safety

- Save the current selection before the color picker receives focus, then restore it
  before applying the color.
- Apply only the CSS `color` property. Do not change font size, family, weight, line
  height, spacing, alignment, display mode, or block structure.
- If there is no non-collapsed selection inside the resume page, do not color a whole
  paragraph or section.
- Verify a color change on a selection inside one line and across several inline
  elements. Wrapping, order, alignment, and spacing must stay unchanged.

## One-page A4 fitting

- Measure occupation against the full A4 page height, including top and bottom page
  margins. Do not report the inner writable area alone; that can label a visually
  90 to 92 percent page as 99 percent full.
- Define the displayed percentage as the vertical position of the last visible content
  edge measured from the top edge of the full A4 page. Use the same definition for the
  status display, automatic fitting, and print preflight.
- Treat 95 to 98 percent as the reference target when content volume permits. Default
  automatic fitting to roughly 96 to 97 percent so print rounding keeps safety room.
  Do not force 98 percent when it produces a second page.
- After content edits, the auto-fit control remeasures the actual content and starts
  from the current page settings rather than resetting the resume.
- Whether compressing an overflowing page or expanding an under-filled page, adjust
  line height first, then paragraph and bullet spacing, then section spacing, then
  font size, and page margins last.
- Use small bounded steps, and continue searching when one property would overshoot.
  Do not stop the whole fit after the first rejected step.
- Obey the readability floors: body font at least 9.5pt for a dense Chinese resume,
  preferably 10 to 11pt; line height at least 1.25; page margins at least roughly
  8mm without approval.
- Never hide overflow, delete content, or compress text to an unreadable size to
  simulate a one-page result.
- If the page still overflows, propose specific content or layout changes for
  approval. A readable under-filled page can be delivered and printed; do not pad it
  to reach a percentage.
- Report both the occupied-height percentage and whether the print layout is expected
  to remain one page. Do not call fitting successful while the print-equivalent
  layout overflows.

## Print preflight and print CSS

- Immediately before `window.print()`, switch each page into its print dimensions and
  run a compression-only preflight. Open the dialog only when every page fits within
  the safety threshold.
- Run the same preflight from `beforeprint` so browser-menu printing also recalculates
  after manual edits.
- Use a fixed 297mm denominator for occupancy. During preflight, override the
  print-media auto height with the fixed measurement box; actual printing returns to
  natural height.
- Fit each language page with compression only, then remeasure every page after a
  shared style change.
- Hide the toolbar, warning banner, and copy panel in print CSS.
- Use `@page { size: A4; margin: 0; }` and let the printed `.page` use content-driven
  height after a successful preflight. A fixed 297mm element can round onto a blank
  second sheet in some browsers.
- Avoid trailing padding that creates a blank page, and place a page break only
  before subsequent sheets.
- Verify the print preview has the intended page count with no clipping or overlap.
- Verify the saved PDF contains no browser-added date, web-page title, page number,
  URL, `file://` address, or local HTML path. Those come from the browser print layer
  and cannot be reliably suppressed by page CSS, so direct the user to the setting.
- For Chrome or Edge, tell the user to open `More settings` and clear
  `Headers and footers`. For Safari, tell the user to open `Show Details` and clear
  `Print headers and footers`. Give the corresponding instruction in the document's
  own language.
- Deliver the editable HTML. Generate a separate PDF only when the user asks for one.

## Application-form copy panel

Include the base template's non-printing copy panel. Each experience has three
separate fields for the full employer name, the role or title and dates, plus a fourth
field for the overview and bullets. Each field has its own copy button.

- Mark source elements with `data-copy-field="company"`,
  `data-copy-field="role"`, and `data-copy-field="dates"`. Keep location outside the
  date element.
- Mark standalone metadata paragraphs with `data-copy-exclude="true"`. Never exclude
  real body text based on bold styling or a specific organization name.
- Keep dates and locations inside header rows rather than body paragraphs.
- Detect entries from `.row` elements containing `b.row-main`, ending at the next entry
  or `h2`. Description paragraphs and list items follow the header.
- If a master uses different markup, adapt the entry selector or provide explicit
  grouping while preserving its design.
- Include the complete verified employer name and dates. Ask when an abbreviation
  cannot be resolved from evidence.
- Build copy text from the live edited DOM, not a frozen duplicate. Refresh it after
  body edits and whenever the panel opens.
- Use plain-text clipboard writes and show success only after the write resolves. On
  denial or missing clipboard support, select the read-only field and explain the
  keyboard shortcut.
- Keep the panel outside `.page` so it cannot affect fitting, and hide it in print
  CSS.
- Do not claim the panel improves automatic ATS parsing.

Fictional markup example:

```html
<div class="row"><b class="row-main edit-block"><span data-copy-field="company">Example Company</span><br><span data-copy-field="role">Intern</span></b><span class="row-date edit-block" data-copy-field="dates">2024-2025</span></div>
<p class="edit-block" data-copy-exclude="true">Example department</p>
<p class="edit-block">Overview of the work.</p>
<ul><li class="edit-block">Description of a contribution.</li></ul>
```

## Default single-column layout

- Every section, including skills, languages, tools, and certificates, defaults to one
  column.
- Do not introduce CSS grid, multi-column CSS, or a two-column flex arrangement for
  section content merely to save space.
- If a two-column section would materially improve a crowded resume, explain which
  section and why, then obtain approval.
- Rows that place a date on the right are still a single-column structure. Their left
  field must accept manual line breaks without moving text into a second column.

## Layout preservation

When a source resume has a usable design, preserve its typography, colors, section
order, spacing, dividers, alignment, and date placement. Port the editor controls into
that design. Use the base template's visible styling only when there is no source
layout to preserve.

## Patch a master instead of rebuilding

When a reusable editable master exists, duplicate it and edit only the content blocks
and approved section structure the new requirement needs. Preserve its CSS, toolbar,
editor script, print logic, and layout primitives unless the user requested a design or
editor change.

Rebuild only when no master exists, the master is incompatible with the requested
output, or the user approves a redesign. After an approved editor fix, update the
master once so later variants inherit it.

## Verification

Test before delivery:

1. text is directly editable and the active block is visibly selected;
2. every toolbar control changes only its intended property;
3. text color does not alter layout;
4. undo and redo work where supported;
5. auto-fit never deletes content;
6. auto-fit handles an under-filled page, an overflowing page, and new text added
   after an earlier fit;
7. the final occupied-height percentage is visible and inside 95 to 98 percent
   whenever the content can safely reach it;
8. the print control opens the browser dialog after a successful preflight and stops
   when the preflight still overflows;
9. the toolbar and copy panel are absent from printed output;
10. an education detail can split across lines without disturbing the date;
11. pressing `Enter` in a skills block creates a new line below rather than a new
    right-hand column;
12. blank paragraphs can be inserted and deleted, and paragraph spacing visibly
    changes;
13. the generated PDF has exactly one page after auto-fit;
14. overview and bullet order survives copying, metadata stays excluded, and live edits
    appear in the copy panel;
15. the fallback selects the field when clipboard access is denied;
16. the file opens from a standalone folder with no console error.

Run `node tests/copy-description.test.cjs` for the DOM-extraction regression tests. It
covers grouping, metadata exclusion, ordering, live edits, and per-page print
preflight. It does not replace browser clipboard, fitting, or print verification.

## File naming

Name the file `<name>-<company>.html` in the user's language, using a fictional
example such as `Li-Ming-Example-Co.html`. Do not add the position, the requirement
title, a date, a version, or an `editable` suffix unless the user asks.
