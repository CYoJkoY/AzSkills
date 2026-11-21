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

Use role-based typography: editorial serif headings, CJK-capable system sans
body/navigation/captions, and mono only for code and identifiers. Maple Mono
NF CN is optional for technical text or an explicit user font preference.
Keep CJK tracking normal. Follow the root
[editorial reading contract](../../DESIGN.md#editorial-reading-contract) for
pigment roles, density and paragraph/list/figure/caption spacing. The report
stylesheet is a standalone mapping of those tokens; keep both copies aligned.

### Font delivery

The starter uses local system stacks and requires no font download. Verify
Chinese glyphs, punctuation, wrapping and font-unavailable fallback. If the user
requires a particular face, obtain it from its official project or a verified
user copy; check family metadata, weights, license and CJK coverage. Embed the
licensed font in a self-contained deliverable, or bundle it for an accepted
folder delivery. Subset only after final content is known. Keep license notices
and avoid a runtime CDN dependency. Never claim an exact font from a family
declaration alone: wait for document.fonts.ready and inspect rendered glyphs.
Test offline with the requested local font unavailable and report limitations.

## Reading geometry

- Keep ordered semantic sections with a title, one claim, evidence, sources and
  visible page number. A section is a logical report page, not a forced screen.
- Use normal document flow and content-driven height at all widths. A brief
  may request presentation-like breathing room; never transform-scale a report.
- At 48rem and below, use one column and natural height. Avoid fixed heights,
  hidden overflow, mandatory scroll snapping and absolute text positioning.
- Preserve browser zoom and user text sizing. At a normal 16px root, body text
  is 18px on phones; captions, sources, tables and navigation are at least 16px.
  Use rem-based sizes; do not reduce the root to squeeze content into a page.
- Use body line-height 1.8; heading line-height 1.3-1.4. Constrain prose to
  65ch for Latin and 34em for Chinese on desktop and available width on phones. Do not insert desktop
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
  without optional custom fonts installed;
- print preview/PDF with all sections, sources and no navigation overlay.

Run `python frontend-slides/scripts/quality_audit.py path/to/report.html --report`
before rendered review. This is a static preflight, not proof of mobile or font
quality. Return observed viewport, font and print results; label anything not
verified. Never claim a physical phone test from desktop viewport emulation.
