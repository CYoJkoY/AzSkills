---
name: logo-generator
description: Develop logos, product marks, wordmarks, character marks, and identity systems from a product brief. Use for concept exploration, vector construction, small-size validation, colorways, and identity rules.
version: 2.0.0
status: canonical
family: visual
modes: [mark, character, system]
---

# Logo Generator

Turn a product brief into a recognizable mark and the rules that keep it
coherent. This Skill owns identity concepts, vector construction, small-size
legibility, colorways, and identity-system handoff. It does not own character
illustration beyond the simplified mark boundary, page layout, or brand copy.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task needs a logo, product mark, wordmark, mascot mark, character-led symbol, colorway, identity board, or logo revision.
- Do not use when: the task is general interface design (`ui-design`), a photo treatment (`photo-abstract-editorial`), or an illustration that must remain detailed at large sizes.
- Owns: concept routes, silhouette, vector geometry, optical correction, small-size behavior, colorways, and identity usage rules.
- Inputs: product name, category, audience, promise, competitors, existing identity, required formats, color constraints, and reproduction sizes.
- Outputs: SVG mark or identity board, colorways, clear-space and minimum-size rules, and verification evidence.
- Compose with: `ui-design` for the surface that hosts the mark; `design-system` when the identity must become tokens; `ui-motion` when the mark animates.
- Gates: the mark is recognizable at small size, works in one color, survives simplification, and has no unlicensed resemblance.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `mark` | Logo, product mark, wordmark, or symbol | Brief, routes, sketch, vector, small-size, color | Primary SVG and variants |
| `character` | A simplified character or IP-led mark | Silhouette, expression budget, shape language, small-size | Character mark |
| `system` | Identity rules, colorways, or a mark family | Inventory, geometry, roles, usage, verification | Identity board and rules |

## Workflow

### 1. Extract the brief

```text
Product and category:
Audience:
Promise or personality:
Competitors and category cliches:
Existing identity:
Required formats and sizes:
Color and reproduction limits:
Usage surfaces:
```

Do not begin with a style adjective. Begin with what the mark must make
recognizable and what it must avoid.

### 2. Build symbolic routes

Create at least three routes that use different visual mechanisms, not three
variations of one sketch:

```text
literal object
structural metaphor
letterform or monogram
process or relationship
character or mascot
negative-space or geometric construction
```

For each route, state the idea, the silhouette, the reproduction risk, and the
reason it fits. Reject routes that depend on gradients, fine detail, or a
specific background to remain legible.

### 3. Establish the shape language

Choose one geometry model: circular, squared, organic, faceted, modular, or
calligraphic. Keep radii, stroke weight, angles, and counters consistent. A mark
with three unrelated shape languages is not a system.

Use a small grid and optical alignment. Correct curves, joins, and counters by
eye at final size; mathematical alignment alone is not enough.

### 4. Build the static mark first

The primary mark must work in flat black, flat white, and one accent color. It
must remain identifiable at the smallest required size. Test:

- 16px favicon or app icon
- 24px interface mark
- 32px avatar
- 48px documentation mark
- one-color print or engraving
- dark and light backgrounds

If the idea disappears at 16px, simplify the idea rather than adding detail.

### 5. Define the character budget

For `character` mode, reduce the figure to silhouette, head or body proportion,
one expression, and one recognizable accessory. The mark is not a full
illustration. Keep the character readable in one color and at avatar size. Use
the [character reference](references/character-marks.md) for the stricter budget.

### 6. Expand into a system

For `system` mode, define:

```text
primary lockup
horizontal and stacked lockups
symbol-only mark
wordmark
clear space
minimum sizes
color roles and colorways
monochrome and reversed variants
background rules
misuse examples
```

Do not invent a full brand guideline when the task only needs a mark. Scale the
system to the actual deliverables.

### 7. Verify the artifact

Render the SVG at every required size and background. Inspect silhouette,
optical weight, alignment, counter shapes, and color separation. Confirm that the
file has a `viewBox`, no external dependencies, and clean path geometry.

## Quality gates

- [ ] The mark communicates the brief without explanatory copy.
- [ ] At least three genuinely different routes were considered.
- [ ] One shape language controls radii, weight, angles, and counters.
- [ ] The mark works in one color, at the smallest required size, on light and dark backgrounds.
- [ ] The silhouette is distinct from category cliches and known marks.
- [ ] Character marks fit the silhouette and expression budget.
- [ ] The SVG has clean geometry, a `viewBox`, and no external assets.
- [ ] Colorways preserve contrast and do not rely on gradients for recognition.
- [ ] Usage rules cover clear space, minimum size, and misuse.
- [ ] The result is rendered and inspected at real sizes.

## Output contract

```text
Concept route and rationale:
Shape language:
Primary SVG:
Lockups and variants:
Colorways:
Clear space and minimum sizes:
Small-size and one-color evidence:
Unverified items:
```

For a revision, include the specific defect, the change, and a new render. Do not
redraw the whole mark to fix one optical issue.

## References

- `references/logo-guide.md` - detailed concept, exploration, system-board, showcase, and revision workflows.
- `references/character-marks.md` - character and IP simplification budget.
