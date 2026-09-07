# Icon Selection Reference

Use this reference whenever a README needs semantic icons.

## Goal

Icons must explain structure, not decorate empty space. A good icon should be immediately interpretable, visually compatible with the target repository, and distinct from neighboring icons.

## Required implementation

For a **whole-readme redesign**, semantic heading icons are an implementation requirement whenever the README has multiple meaningful sections and suitable concepts exist.

The workflow is not complete until the final Markdown itself contains image references on the intended H2/H3 headings. Creating icon files without placing them in headings is insufficient.

Minimum implementation pattern:

```markdown
## <img src="assets/readme/icons/architecture.svg" width="20" alt=""> Architecture
## <img src="assets/readme/icons/download.svg" width="20" alt=""> Installation
```

Use actual repository-local SVG assets rather than emoji when the README design calls for a persistent visual system.

## Placement hierarchy

Icon placement is part of information architecture. Choose the placement level before choosing the exact asset.

Preferred order:

```text
heading / category title
        ↓
intentional visual component
        ↓
workflow step / diagram node / card
        ↓
inline semantic cue only when genuinely necessary
```

Default rule: an icon belongs beside a heading or inside an intentionally visual component. It should not float between unrelated content blocks.

### Heading usage

Use at most one icon immediately before an H2/H3 heading when the section benefits from a visual marker.

For whole README redesigns, prefer icons on the major H2 sections. Use H3 icons when they communicate genuinely distinct concepts rather than mechanically decorating every subsection.

Good:

```markdown
## <img src="assets/readme/icons/installation.svg" width="20" alt=""> Installation
### <img src="assets/readme/icons/package.svg" width="18" alt=""> Package model
```

Avoid:

```markdown
## Installation
<icon>

text...
```

Avoid placing an icon between a heading and its first paragraph, directly before a code fence, or as an isolated line above/below a heading.

### Visual component usage

Icons may appear in a table, card, workflow, diagram, or other deliberate visual unit when each icon has a clear semantic job inside that unit.

For example:

```text
[download icon] Install → [document icon] Configure → [check icon] Verify
```

Do not add an icon to a normal paragraph simply because that paragraph is visually plain.

### Inline exception

Inline icons are exceptional. Use one only when the icon itself carries information that would otherwise be lost, such as a tiny status marker, platform indicator, or genuinely semantic action cue. Never use inline icons as section decoration.

## Selection workflow

```text
README meaning
      ↓
semantic label
      ↓
choose placement level
      ↓
inspect project-native assets
      ↓
search verified reusable icon sources
      ↓
score candidates
      ↓
adapt contrast / scale if needed
      ↓
place with local usage context
      ↓
verify the Markdown actually references the asset
```

Do not begin by picking a favorite icon and retrofitting the meaning afterward.

## Semantic scoring

Score each candidate from 0–2 on:

| Criterion | 0 | 1 | 2 |
| :--- | :--- | :--- | :--- |
| Meaning | unrelated | broadly related | exact concept |
| Project fit | generic | compatible | derived from project language |
| Visual fit | clashes | acceptable | same visual grammar |
| Recognition | ambiguous | understandable | immediate |
| Context | repeated/misleading | neutral | reinforces section meaning |

Prefer the highest total. If two candidates are close, choose the one that is less repetitive in the surrounding README.

## Semantic diversity

Treat icon choice as a local vocabulary rather than a global theme. The shapes, stroke weight, fill behavior, corner treatment, and accent colors should also reflect the target repository when practical.

```text
Engineering          → gear / wrench / terminal / system
Visual design        → palette / layers / pen / shapes
Documentation        → document / book / edit
Localization         → globe / language / translate
Model / architecture → layers / nodes / stack
Selection            → cursor / target / filter
Installation         → download / package / plug
Verification         → check / shield / test
Contribution         → plus / hand / branch
Support              → heart / star / gift
```

These are semantic families, not fixed icon assignments. Search for the best concrete match in the available library or repository assets.

## Reuse limits

Avoid using the same icon repeatedly in nearby blocks.

Default limits:

- Do not use the same semantic icon for more than one adjacent section/category heading.
- Avoid repeating the same icon more than twice within a 3-section window unless it represents the same persistent navigation concept.
- For workflow steps, use distinct icons when each step has a different action.
- If a repeated icon is the clearest representation, keep it repeated rather than replacing it with a semantically weaker icon.

## Project-native precedence

Always prefer:

```text
project-owned icon / artwork
        ↓
project-derived icon treatment
        ↓
verified reusable icon
        ↓
simple local deterministic SVG
```

A reusable icon may be recolored or wrapped for theme safety, but its semantic shape should not be distorted.

When project-owned artwork already communicates the concept, use that evidence before introducing generic third-party iconography.

## Adaptation rules

Automatically adapt presentation without asking the user for micro-decisions:

- normalize visual size;
- preserve recognizable silhouette;
- choose explicit theme-safe fills for standalone `<img>` usage;
- derive accent color from the README's palette;
- preserve a coherent stroke/radius language;
- use consistent optical padding rather than identical raw dimensions.

Do not make all icons identical just to create consistency. Consistency comes from visual grammar, not from cloning one shape.

## Verification

Before delivery:

1. Read each icon meaning beside its text without relying on color.
2. Check placement hierarchy before checking icon variety.
3. Check neighboring icons for accidental repetition.
4. Check light and dark GitHub backgrounds.
5. Check that the icon does not imply a different function than the text.
6. Check that removing the icon would reduce scanning value; if not, remove it.
7. Check that the icon set feels like a vocabulary rather than a four-icon template.
8. Inspect the rendered Markdown source and confirm the intended H2/H3 headings contain the image references.
9. Remove any icon that was added only to fill whitespace.
