---
name: photo-abstract-editorial
description: Turn one supplied photograph into a restrained vertical editorial diptych. The photograph stays faithful; a sparse abstract panel derives only its spatial, tonal, and color relationships.
version: 2.0.0
status: canonical
family: visual
modes: [treatment, audit]
---

# Photo Abstract Editorial

Create one finished vertical composition from one photograph. The photograph is
the factual source; the abstract panel is a memory of its relationships, not a
second artwork. This Skill does not redraw, illustrate, or stylize the source.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task supplies one photograph and needs a photo-plus-abstraction diptych, archival poster, or visual memory panel.
- Do not use when: the task is a logo or identity system (`logo-generator`), a general interface (`ui-design`), or an illustration that may invent scene content.
- Owns: source observation, photograph preservation, relationship abstraction, diptych composition, and editorial typography.
- Inputs: the photograph, desired output locale, aspect ratio, copy constraints, and any supplied palette or type direction.
- Outputs: one vertical composition or a rendered audit of an existing treatment.
- Compose with: `logo-generator` only when the abstraction must become an identity mark; `ui-design` only when the composition is placed into a larger interface.
- Gates: the photograph remains faithful; every abstract mark traces to a visible source fact; the abstraction does not overpower the photograph.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `treatment` | One photograph becomes a finished diptych | Observe, preserve, abstract, compose, verify | Final composition |
| `audit` | An existing treatment needs review | Compare source, trace marks, rank defects | Findings and smallest corrections |

## Workflow

### 1. Observe the source

Identify three to six decisive facts: subject relationships, scale hierarchy,
major axes, intervals, overlap, depth, dominant shapes, negative space, light
distribution, and color roles. Do not start from a generic template.

### 2. Preserve the photograph

Keep the photograph faithful. Permit proportional scaling and only the minor
crop needed to fit the composition. Do not redraw, extend the scene, replace
subjects, apply stylizing filters, retouch defining information, or turn the
photograph into an illustration.

### 3. Translate relationships, not outlines

Build the abstract panel from position, scale ratio, direction, repeated
interval, overlap, and one or two recognition cues. Do not trace a thumbnail,
silhouette sheet, or literal illustration. Every abstract mark must be
explainable by a visible fact in the source.

### 4. Compose the diptych

Use a vertical composition with the photograph as the principal upper section and
the abstract panel below. The split need not be 50/50; adapt it to density. Join
the sections directly. Do not add frames, borders, tape, shadows, collage edges,
or mockup devices. Keep the abstract panel background uniform and neutral unless
the brief specifies otherwise.

### 5. Control the abstract language

Use one primary mark family and at most two supporting families. Derive the muted
palette from the photograph. Do not invent decorative colors or symbols. Favor
asymmetry and whitespace when the source supports them.

For people, suggest the figure with irregular short vertical marks or tapered
blocks. Do not draw faces, limbs, clothing, or anatomy. For architecture, keep at
most one to three identity cues and omit surface detail.

### 6. Set the type

Write one original title of two to five words, grounded in something visibly
present in the photograph. Use the requested output locale; default to English
only when no locale is supplied. Place the title in the abstract panel and use a
restrained editorial serif direction. Add a subtitle only when it carries real
meaning. Do not add dates, unrelated captions, logos, watermarks, or multiple
title options.

### 7. Verify

Check source fidelity, mark traceability, panel balance, title legibility, color
separation, and output dimensions. If the abstraction competes with the
photograph, remove marks before adding detail.

## Prompt discipline

When an image model is available, build one complete prompt from the observed
facts. Describe the result and its constraints. Use the model's supported
negative-prompt field when it exists; otherwise add one concise `Constraints:`
line. Exclude redrawing, invented objects, unrelated symbols, frames, collage,
heavy shadow, gradients, texture, grain, watermarks, and decorative clutter.

## Provenance

This contract is an original AzSkills implementation informed by
https://github.com/ZzzLc0405/photo-abstract-editorial. No upstream artwork,
template, or repository text is copied.

## Quality gates

- [ ] The photograph is faithful and uncropped beyond the composition need.
- [ ] Every abstract mark maps to a visible source relationship.
- [ ] The abstract panel uses one primary and at most two supporting mark families.
- [ ] The palette derives from the photograph, not an unrelated theme.
- [ ] The photograph remains the dominant element.
- [ ] The title is grounded, legible, and in the requested locale.
- [ ] No decorative frame, texture, gradient, watermark, or mockup device is present.
- [ ] The final artifact is inspected at output size.

## Output contract

For `treatment`, return only the completed composition unless the user asks for
the source analysis. For `audit`, return:

```text
Verdict:
Findings ranked by source fidelity:
Source fact -> abstract mark -> correction:
Unverified items:
```
