---
name: scientific-figures
description: Draw or faithfully reconstruct medical and scientific schematics as editable SVG, using a validated scene model, deterministic vector renderer, and quality checker. Use for pathway and mechanism figures or SciPrism SVG requests; ordinary SVG animation stays with ui-motion.
version: 1.0.0
status: module
family: visual
modes: [redraw, author, verify]
---

# Scientific Figures

Reconstruct a supplied figure or compose an evidenced mechanism as semantic,
editable SVG. This integrates the SciPrism SVG workflow as an AzSkills module;
the scripts are original implementations, not a bitmap tracer or a scientific
reasoning engine. Shared rules R01-R12 apply; read
[SKILL-SYSTEM.md](../../SKILL-SYSTEM.md).

## Contract

- Use when: the user asks for a medical, biological, research, pathway, or mechanism illustration, a faithful figure redraw, vector restoration, or editable SVG; the aliases include `sciprism-svg` and `sci-figure`.
- Do not use when: the deliverable is a product interface, a logo, generic SVG animation, medical advice, or a literature summary with no figure request.
- Owns: scientific figure inventory, semantic scene geometry, preserved relationships and labels, editable vector construction, and figure-specific verification.
- Inputs: source figure or explicit scientific content, reference dimensions, target display or print size, labels, legend meaning, and known versus uncertain relationships.
- Outputs: editable SVG, its scene JSON when the renderer is used, a rendered preview, and actual verification findings with unresolved scientific details.
- Compose with: `style-presets` for an explicitly named figure style; `frontend-slides` for placing an approved figure in a deck; `ui-motion` for animating verified vector groups.
- Gates: no embedded bitmap or flattened trace; preserve source aspect ratio, labels, arrow direction, and scientific meaning; text remains text and objects remain named editable groups; script success never establishes scientific correctness.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `redraw` | A supplied figure must become editable | Inventory, measure, reconstruct, compare, verify | Faithful SVG and comparison preview |
| `author` | Evidence or an explicit brief defines a new figure | Confirm meaning, lay out scene, render, inspect, verify | SVG, scene JSON, and preview |
| `verify` | An SVG needs structural and visual review | Check, render, inspect labels and relationships, rank findings | Findings and smallest corrections |

## Workflow

1. Select `redraw` when a reference is supplied; otherwise select `author`.
   Build an inventory of panels, objects, labels, arrow endpoints and direction,
   inhibition bars, scale bars, units, legends, and front-to-back order.
   Preserve unclear source content as an explicit uncertainty. Never invent
   experimental results, sample counts, biological claims, or scale bars.
2. In `redraw`, record the actual source width and height and preserve their
   ratio. Fidelity takes priority over the default style. Copy user-provided
   labels exactly; verify symbols, Greek letters, units, and CJK by inspection.
   Use the source image only as evidence, never embed it in the output.
3. In `author`, use the supplied scientific relationships. If the request
   requires new scientific claims, verify them against primary sources before
   drawing. A diagram may describe a hypothesis when explicitly labeled.
4. Read the [scene schema](../../scientific-figures/references/figure-scene.schema.json)
   and the [quality policy](../../scientific-figures/references/quality-policy.json).
   Start with the [runnable example](../../scientific-figures/references/example.scene.json)
   for the script interface. Use [the pipeline guide](../../scientific-figures/references/pipeline.md)
   for supported primitives, size handling, and customization boundaries.
5. Use `render-figure.ts` for supported geometry. Keep stable semantic ids.
   Use `check-figure.ts` after every material change. For faithful reconstruction
   beyond the scene vocabulary, construct explicit SVG primitives directly and
   run the same checker; do not force the source into an unsuitable template.
6. Render the actual SVG with an available browser or SVG-capable renderer.
   Inspect at intended final size and compare the reference side by side for
   `redraw`. Check clipping, label occlusion, arrow direction and endpoints,
   connector crossings, legend meaning, and scientific symbols. Enlarge the
   layout rather than shrinking labels below legibility. Rerun the checker
   after corrections and report any preview limitation.

## Natural invocation

Aliases and Chinese/English figure phrases live in the shared
[trigger source](../scientific-figures/figure-triggers.ts), which the Codex
prompt hook imports. A medical or research term paired with a drawing intent
also selects this module. Mentioning a medical topic without requesting a
figure does not. A bare `svg` is insufficient.

Examples: "Draw the receptor signaling pathway", "Redraw this as editable
SVG", or a Chinese request pairing a cell or research topic with a drawing
verb. Other clients use the same description, routing table, and aliases;
only Codex installs the prompt hook.

Chinese matching needs both an action and a subject. Besides the original
draw-and-build verbs, the action set accepts first-person result phrasing such
as "draw out" and "make me one", and the subject set accepts a bare pathway
noun plus pathology and anatomy nouns: tumour, immune, microenvironment,
synapse, neuron system, vessel, cardiac, metabolic, gene, virus, bacteria, and
drug. That pathway noun is a Chinese literal, and in Chinese it also names a
circuit or a sales channel, so a compound built from an electrical, logistics,
or distribution qualifier is blanked before the subject test. The literals live
in the trigger source above, so this paragraph cannot disagree with what routes.
Two limits are worth stating plainly: a subject without a drawing action stays
a question, since asking what a pathway does or why a pathway figure uses a
colour is analysis rather than a figure request; and an English request that
already names a figure artifact routes through the artifact branch whatever its
subject, which is pre-existing behaviour rather than this compound rule.

A supplied figure is usually pointed at instead of named, so a pointing phrase
plus a drawing verb routes without any subject: "redraw this figure" and
"draw this figure". A bare pronoun counts only when the sentence
also names the target format, which is how "redraw this as editable svg" reaches
the module while "redraw this chart" and "turn this editable svg into a png"
stay out. The pointing list is compound on purpose, since a bare Chinese
character for "figure" also sits inside the words for "icon" and "chart"; those
two compounds are blanked first, so an app icon or a chart keeps its owning
module, and the chart compound is only blanked when the character for "shows"
does not follow it. An analysis question that names the act it asks about, such
as "why does redrawing this figure take so long", is denied when the
interrogative and the first drawing verb share one clause, while "why are these
arrows such a mess, redraw it" keeps its drawing intent because the comma ends
the question.

A summary that takes the drawing act as its topic is analysis too: "summarize
the process of redrawing this figure" and its Chinese equivalents name both a
pointing phrase and a redraw verb, so the pointing branch would otherwise claim
them. The denial needs an explaining verb first, no clause break before the
drawing verb, and a noun about the act itself in that same clause, such as
"process", "steps", "principle", or "how long". The noun may precede the
drawing verb, as in "the steps of redrawing this figure", or follow it. Any
drawing verb later in the prompt returns the request to the module, which keeps
"redraw this figure, then summarize the redraw process" and "summarize the
steps, then redraw this figure" as drawing requests.

## Quality gates

- [ ] The source inventory matches the output's panels, objects, labels, units, arrows, and legend.
- [ ] Source ratio and relative placement survive a redraw; no default theme changes source meaning or appearance.
- [ ] The scene parses and the SVG checker returns zero blocking errors; warnings are reviewed individually.
- [ ] Each object has its own stable group; arrow shafts and heads are distinct; labels use real SVG text.
- [ ] No raster image, external resource, script, or monolithic trace is embedded.
- [ ] Text is readable at final output size; contrast, wrapping, CJK, and symbols survive actual rendering.
- [ ] The preview was inspected; geometric checks are reported separately from scientific review.

## Output contract

Deliver the SVG, scene JSON if used, and preview paths. Briefly state what the
figure conveys, source or brief used, preserved relationships, and any unclear
scientific details. Report checker command, exit code, errors and warnings,
actual preview inspection, intended final size, and unverified items. In
`verify`, lead with ranked findings and exact object ids or source locations.

## References

- [Pipeline](../../scientific-figures/references/pipeline.md) - commands, primitives, customization, and verification limits.
- [Scene schema](../../scientific-figures/references/figure-scene.schema.json) - declarative scene input.
- [Example scene](../../scientific-figures/references/example.scene.json) - minimal runnable pathway illustration.
- [Quality policy](../../scientific-figures/references/quality-policy.json) - shared geometry, themes, typography, and thresholds.
- [Renderer](../../scientific-figures/scripts/render-figure.ts) - deterministic semantic SVG generation.
- [Checker](../../scientific-figures/scripts/check-figure.ts) - structural quality gates and JSON diagnostics.
- [Provenance](../../THIRD_PARTY_NOTICES.md) - upstream review and independent implementation.
