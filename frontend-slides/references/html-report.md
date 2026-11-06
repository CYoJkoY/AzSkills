# Responsive HTML Reports

Use the canonical `frontend-slides` Skill in `report` mode for reading-first,
page-by-page HTML reports, including Chinese requests for PPT-like reports.
This mode replaces the fixed-stage geometry and font pairing in the presentation
references. Do not load the fixed-stage template or inline `viewport-base.css`.

## Visual and typography contract

Use Wabi-Press (the user's named wabi-sabi editorial direction): warm washi
canvas, pine-soot ink, restrained cinnabar emphasis, 1px rules, 0-2px corners,
asymmetric desktop composition, and generous whitespace. Use the palette in
[../assets/report.css](../assets/report.css), mapped from the existing
[../../design-system/wabi-press.css](../../design-system/wabi-press.css).
No dashboard card wall, glass effects, decorative gradients, or distressed text.
Use secondary ink for readable captions; muted palette colors are not a license
to put low-contrast sources on paper.

Use **Maple Mono NF CN** for headings, body, tables, numbers, captions, and
navigation. Keep CJK tracking normal. Hierarchy comes from size, spacing and
weight, rather than switching to a serif face. The report font stack is scoped
to reports; do not change application or terminal typography.

### Font delivery

A CSS family name does not deliver a font to a phone. Obtain the exact NF CN
variant from [the official Maple Font project](https://github.com/subframe7536/maple-font),
or reuse a verified user-supplied copy. Check the bundled family metadata,
weights, license and Chinese coverage. Do not substitute NF-only or CN-only
files and claim the requested variant loaded. Do not invent a CDN URL.

Define `@font-face` with family `Maple Mono NF CN`, `font-display: swap`,
and accurate weight/style descriptors. For a single HTML deliverable, embed
licensed WOFF2/TTF bytes as data URLs and retain the license notice. For an
explicitly accepted folder deliverable, use relative font files and include the
license. Subset only after the final content is known, retaining its Chinese,
Latin, numbers and punctuation; do not ship an entire multi-weight CJK archive.
Use only the weights actually required. No runtime font CDN dependency.

The starter resolves installed copies with `local()` and then falls back to
CJK system fonts. It intentionally includes no font binary. It is a layout
starter, not a font-complete deliverable. Replace its local-only face with the
embedded or bundled font before final delivery. If the font cannot be obtained,
report the fallback explicitly and mark exact-font verification incomplete.
Wait for `document.fonts.ready`, inspect the rendered face and Chinese glyphs,
and test with local fonts unavailable and the network offline. A declaration
or `document.fonts.check()` alone is not proof of the rendered font.

## Reading geometry

- Keep ordered semantic sections with a title, one claim, evidence, sources and
  visible page number. A section is a logical report page, not a forced screen.
- Use normal document flow at all widths. Desktop sections may have a 16:9-like
  minimum height, but must grow for content. Never transform-scale the report.
- At 48rem and below, use one column and natural height. Avoid fixed heights,
  hidden overflow, mandatory scroll snapping and absolute text positioning.
- Preserve browser zoom and user text sizing. At a normal 16px root, body text
  is 18px on phones; captions, sources, tables and navigation are at least 16px.
  Use rem-based sizes; do not reduce the root to squeeze content into a page.
- Use body line-height 1.8; heading line-height 1.3-1.4. Constrain prose to
  about 32em on desktop and available width on phones. Do not insert desktop
  line breaks into Chinese paragraphs. Use 16-24px phone page padding.
- Collapse grids in DOM reading order. Wrap long links and identifiers. Put
  genuinely wide tables/code in labeled, keyboard-focusable local scroll
  regions; never introduce horizontal scrolling on the document itself.
- Responsive charts need readable axis labels, units and a text summary or
  data table. Do not shrink a desktop SVG until its labels become illegible.

## Navigation and delivery

Start from [../assets/report.html](../assets/report.html) and its CSS. Use
native anchors for contents, previous/next page and deep links. Touch targets
are at least 44px. Keep navigation in flow so it never covers text or sources;
touch scroll, keyboard scrolling and focus must work without JavaScript.
Do not hijack Space, PageDown or vertical swipes to change report pages.
Respect safe-area insets and reduced motion. No inline editor unless requested.

Deliver one self-contained HTML file by default: inline the report CSS and
embed required fonts/images. Keep citations as usable source links. Do not
include generation instructions or template labels in the reader-facing output.
Use print CSS to start each logical page on a fresh sheet and hide navigation;
allow long sections to continue onto additional sheets rather than clipping or
shrinking text. Fixed 16:9 export is a separate presentation workflow.

## Verification gates

Render every logical page at 320, 375, 390, 768, 1280 and 1920 CSS pixels wide,
including a short landscape phone. Inspect the screenshots and computed sizes,
not just media queries. Check Chinese wrapping, long titles, source URLs, dense
tables, images and the final page. Verify:

- no document horizontal overflow, clipped content, overlaps or tiny chart text;
- body/caption floors, readable contrast (4.5:1 for normal text), 200% text
  enlargement and browser zoom without loss of content;
- contents/previous/next anchors, touch-sized links, keyboard focus, deep links,
  browser Back, reduced motion and navigation with JavaScript disabled;
- font-loaded and font-unavailable states, plus offline delivery on a device
  without Maple installed;
- print preview/PDF with all sections, sources and no navigation overlay.

Run `python frontend-slides/scripts/quality_audit.py path/to/report.html --report`
before rendered review. This is a static preflight, not proof of mobile or font
quality. Return observed viewport, font and print results; label anything not
verified. Never claim a physical phone test from desktop viewport emulation.
