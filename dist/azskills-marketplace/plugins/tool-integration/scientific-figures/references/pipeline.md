# Scientific figure pipeline

The scripts require the repository's supported Node.js version and no runtime
packages. Paths below are relative to the AzSkills root; use absolute paths when
working from another project. The portable skill and Codex plugin include the
same scripts, schema, policy, and example.

## Render and check

```sh
node scientific-figures/scripts/render-figure.ts --scene scientific-figures/references/example.scene.json --out figure.svg
node scientific-figures/scripts/check-figure.ts --svg figure.svg --json
node scientific-figures/scripts/check-figure.ts --svg figure.svg --reference 640x400 --json
node scientific-figures/scripts/render-figure.ts --self-test
node scientific-figures/scripts/check-figure.ts --self-test
node scientific-figures/scripts/check-figure-regression.ts
```

The renderer validates scene input and writes independently editable panels,
objects, connectors, and labels. The checker exits 1 on a blocking finding and
returns rule, severity, and message with `--json`. Use `--reference <width>x<height>`
with the actual source dimensions to check that a redraw preserves its ratio. Neither program
installs tools, downloads assets, or contacts a remote service.

## Scene vocabulary

The schema is the input contract. A scene has a canvas and nodes; optional
panels, connectors, free labels, and legend items add structure. Supported
node kinds are `shape`, `cell`, `nucleus`, `vesicle`, `membrane`, `receptor`,
`protein`, `channel`, `antibody`, `dna`, `well`, and `badge`. Pure typography is
a scene label rather than a node, so text is never drawn as a filled box.

Connectors name source and target node ids. Optional sides choose attachment
points; explicit coordinates require both `x` and `y`. Routes are straight or elbow. Arrow kinds are `flow`, `activation`,
`inhibition`, `transport`, `conversion`, and `feedback`. Inhibition uses a
bar rather than an arrowhead. The renderer never infers a biological
relationship from proximity or a protein name.

Coordinates and font sizes share the viewBox coordinate system. Pixel-sized
previews do not establish print-size legibility: a figure scaled down to an
85 mm journal column also scales its text. Choose canvas geometry for the
actual placement, inspect the final size, and keep publication requirements
ahead of defaults. Scale a small reference proportionally to satisfy working
canvas limits; never distort its ratio to pass a check.

## Customize

Change node geometry, tone roles, labels, and connector relationships in the
scene JSON. New figures use `cobalt`, `wabi`, or `mono` themes from the quality
policy. Preserve source colors during redraws; construct custom SVG directly
when a default theme or primitive cannot faithfully describe the source.

The policy centralizes typography, stroke sizes, palettes, tints, layout
limits, and checker thresholds, including the per-panel node ceiling and the
note and label line-length caps. A policy change affects both rendering and
verification; do not relax a threshold merely to pass a defective figure.
Wrapping reads those character caps as well as the box width, so a rendered
line never exceeds the limit the checker enforces. No BioRender icon,
illustration library, or upstream asset ships here.

## Verification boundary

The checker detects malformed XML, raster/external content, duplicate ids,
missing editable structure, tiny type, supported explicit-color contrast
failures on the composited background, exact shape overflow, approximate label
and path overflow, line-length limits, content hidden under the legend strip,
and flattened traces. Path and label boxes are estimates: a curve is bounded by
its control hull, an arc by the swept slice of its ellipse, and text by its
average glyph advance. One transform policy governs both sides of the legend
gate, so a subtree with a `transform` is excluded from the strip comparison
instead of being measured unrotated. It reads
`<style>` bodies as well as attributes, so a stylesheet cannot smuggle an
import, a data payload, or a filter past the raster gate. It is a bounded
static check. Browser CSS inheritance, complex SVG transforms, text the
checker cannot measure, font substitution, exact glyph metrics, and scientific
truth still require actual render inspection and source comparison. Do not
describe a zero-error report as a universal SVG certification or publication
approval.

An SVG preview can be rendered by a browser or an installed SVG-capable
program. Keep the SVG itself as the editable deliverable; raster previews
serve inspection only and are never embedded back into it.
