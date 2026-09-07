# Icon Selection Reference

Use this reference whenever a README needs semantic icons.

## Goal

Icons must explain structure, not decorate empty space. A good icon should be immediately interpretable, visually compatible with the target repository, and distinct from neighboring icons.

## Selection workflow

```text
README meaning
      ↓
semantic label
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

Treat icon choice as a local vocabulary rather than a global theme:

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

- Do not use the same semantic icon for more than one adjacent section header.
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
2. Check neighboring icons for accidental repetition.
3. Check light and dark GitHub backgrounds.
4. Check that the icon does not imply a different function than the text.
5. Check that removing the icon would reduce scanning value; if not, remove it.
6. Check that the icon set feels like a vocabulary rather than a four-icon template.
