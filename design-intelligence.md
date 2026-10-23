# AzSkills Design Intelligence

This is a visual extension layer, not a Skill. [`SKILL-SYSTEM.md`](SKILL-SYSTEM.md)
owns the shared rules R01-R12 and precedence. This file adds only visual
judgment not already owned by a canonical Skill. The active Skill owns workflow,
quality gates, and output.

## Visual extensions

### Typography is structural

Define roles for display, heading, body, label, metadata, numeric data, and
controls. Verify font availability, fallback, glyph coverage, line height,
measure, and multilingual expansion. Do not shrink type to hide an overloaded
structure.

### Color is semantic

Give color explicit roles for canvas, surface, text, muted content, accent,
focus, selection, and status. Validate light and dark themes separately. Color
never carries critical meaning alone.

### Composition is not a component library

Use a focal point, a clear reading order, and a small set of recurring
structures. Prefer asymmetry, editorial splits, timelines, comparison matrices,
and annotated evidence when the content supports them. Do not assemble a page
from unrelated section templates.

### Motion is owned by `ui-motion`

Motion purpose, mechanism, timing, review, audit, patterns, and SVG output
belong to [`ui-motion`](ui-motion/SKILL.md). Visual composition may reserve a
motion role; it does not define duration, easing, or a second motion gate.

### Visual evidence

Apply R11 with visual checks: hierarchy in grayscale, real sizes, both themes,
density modes, long text, CJK and RTL, zoom, keyboard focus, and narrow width.
A result that only works in the author's viewport is unfinished.

## DESIGN.md adaptation

DESIGN.md is a visual input format, not a behavior contract. Use
[`design-system`](design-system/SKILL.md) for ingestion, normalization,
reconciliation, and provenance.

```text
Overview -> visual thesis
Colors -> semantic color roles
Typography -> type roles
Layout -> spacing and composition
Elevation -> surfaces
Shapes -> geometry
Components -> component and state matrix
Do's and Don'ts -> guardrails
Responsive -> executable QA
Agent Prompt Guide -> non-normative convenience
```

Evidence levels are `verified-token`, `verified-prose`, `inferred-usage`,
`implementation-choice`, and `unresolved`. Never present an inference as a
source fact.

## Visual owner map

The complete registry is [`skills.json`](skills.json). This map names only the
owners that inherit this visual layer:

| Decision | Owner |
| :--- | :--- |
| DESIGN.md source, tokens, semantics, provenance | `design-system` |
| Interface hierarchy, components, states, responsive behavior | `ui-design` |
| Motion construction, review, audit, SVG | `ui-motion` |
| Identity, logo, character mark | `logo-generator` |
| Photograph-derived abstract editorial treatment | `photo-abstract-editorial` |
| Fixed-stage slide narrative and composition | `frontend-slides` |
| Programmatic video and frame determinism | `remotion-production` |
| GitHub README | `readme-craft` |
| Steam Workshop page | `steam-mod-page` |

## Inheritance

Visual Skills load this layer when they need visual judgment. Never copy these
paragraphs into another Skill. Do not apply this layer to backend, data,
infrastructure, or non-visual scripting work.
