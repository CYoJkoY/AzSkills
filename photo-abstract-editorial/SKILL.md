---
name: photo-abstract-editorial
description: >
  Transform one uploaded photograph into a restrained vertical editorial diptych:
  preserve the photograph faithfully and derive a sparse abstract memory panel from
  its observed spatial, tonal, and color relationships. Use for photo-plus-abstraction
  compositions, minimalist archival posters, visual memory panels, and editorial photo
  transformations that must not redraw the source photograph.
---

# Photo Abstract Editorial

Create one finished vertical editorial composition from one supplied photograph.
The photograph remains the factual source; the lower panel translates its visual
relationships into an original abstract language.

## Workflow

### 1. Observe before designing

Inspect the supplied photograph and identify 3–6 decisive facts such as:

- Subject relationships.
- Scale hierarchy.
- Major axes and direction.
- Intervals and rhythm.
- Overlap and depth.
- Dominant shapes.
- Negative space.
- Light distribution.
- Color roles.

Do not begin with a generic editorial template.

### 2. Preserve the photograph

Keep the source photograph faithful. Permit proportional scaling and only the minor crop
necessary to fit the composition.

Do not:

- Redraw the photograph.
- Extend or invent scene content.
- Replace subjects.
- Apply stylizing filters.
- Retouch away defining visual information.
- Turn the photograph into an illustration.

### 3. Translate relationships into abstraction

Create the lower memory panel from the observed relationships rather than tracing the
source literally.

Prefer:

- Position relationships.
- Scale ratios.
- Directional axes.
- Repeated intervals.
- Overlap.
- One or two distinctive recognition cues.

Avoid making a thumbnail, vector trace, silhouette sheet, or literal illustration.

Every abstract mark should be explainable by a visible fact in the source photograph.

### 4. Compose the diptych

Use a vertical composition. Keep the photograph as the upper/principal section and the
abstract memory panel below it.

- The split does not have to be exactly 50/50.
- Adapt the proportions to the visual density of the photograph.
- Join the two sections directly.
- Do not add frames, borders, tape, drop shadows, collage edges, or mockup devices.
- Keep the abstract panel background uniform and neutral ivory unless the user specifies
  another neutral background.

### 5. Control the abstract language

Use one primary mark family and no more than two supporting families.

Use a muted palette derived only from the photograph. Do not invent decorative colors or
symbols simply to make the panel more interesting.

Favor generous whitespace and asymmetry when the source supports it. Do not impose
symmetry mechanically.

For people, preserve the concept of the figure with irregular continuous short vertical
marks or gently tapered blocks. Do not draw faces, limbs, clothing, or anatomy.

For landmark architecture, retain at most 1–3 identity cues and omit surface detail.

### 6. Typography

Create one original English title of 2–5 words grounded in something visibly present in
the photograph.

Place the title only in the abstract panel. Use a restrained editorial serif direction.
Add a short subtitle only when it provides actual semantic value.

Do not add:

- Dates.
- Captions unrelated to the image.
- Logos.
- Watermarks.
- Multiple title options.

### 7. Final-output discipline

Return only the completed composition when this skill is explicitly used for generation.
Do not expose an analysis of the source photograph unless the user asks for it.

## Guardrails

The uploaded photograph is the sole content source. The abstract panel may reinterpret
relationships but must not import unrelated visual objects.

Keep the lower panel flat and clean. Exclude gradients, paper grain, scan artifacts,
glow, vignette, stains, fake aging, collage effects, and decorative noise unless the
user explicitly requests a controlled exception.

Do not let the abstraction overwhelm the photograph. The lower panel is a visual memory
of the photograph, not a second unrelated artwork.

## Prompt construction

When an image-generation model is available, build one complete prompt from the workflow
above. Describe the actual visual result and its constraints.

For models with a documented dedicated negative prompt, use the model's supported field.
For single-prompt models, use one concise `Constraints:` line.

Recommended exclusions:

`do not redraw or stylize the photograph, no invented objects, no unrelated symbols, no frame, no tape, no collage effect, no heavy shadow, no gradient, no paper texture, no grain, no watermark, no decorative clutter`

## Relationship to other AzSkills

Use `photo-abstract-editorial` for transformations where the photograph itself must remain
faithful and the abstraction is derived from it.

Use `logo-generator` when the task is to design a brand/logo system rather than preserve
a photograph.

Use `ip-as-logo` for simplified character/IP marks.

## Provenance

This skill is an original AzSkills implementation informed by the public methodology in:

- https://github.com/ZzzLc0405/photo-abstract-editorial

The upstream repository was not copied wholesale; the useful workflow principles were
re-expressed for AzSkills' modular skill conventions.
