---
name: azskills-material-design
description: Repository-owned visual identity for AzSkills. Material 3 / M3 Expressive-inspired foundations for README visuals, owned SVG assets, presentation defaults, and other project-facing visual artifacts.
---

# AzSkills Material Design

AzSkills uses a Google Material 3-inspired visual system for repository-owned presentation surfaces. The goal is not to reproduce Google's product UI or brand assets. The goal is to adopt the design-system qualities that define the reference: semantic roles, tonal surfaces, systematic typography, adaptive spacing, expressive but controlled shape, restrained elevation, and coherent iconography.

## Visual thesis

```text
Purpose: make a technical Skill library feel clear, trustworthy, approachable, and systematic.
Tone: calm, modern, precise, lightly expressive.
Constraint: GitHub Markdown and SVG rendering must remain robust in both light and dark GitHub themes.
Signature: material-like tonal surfaces + Google-inspired typography hierarchy + restrained multi-accent color.
```

Direction axes:

- minimal rather than decorative
- calm rather than theatrical
- geometric rather than ornamental
- spacious rather than dense
- expressive through hierarchy and color roles rather than effects

## Source authority

Primary visual reference:

- Material 3: https://m3.material.io/
- Color roles: https://m3.material.io/styles/color/roles
- Typography: https://m3.material.io/styles/typography/overview
- Spacing: https://m3.material.io/styles/spacing
- Shape: https://m3.material.io/styles/shape/overview-principles
- Icons: https://m3.material.io/styles/icons
- Design tokens: https://m3.material.io/foundations/design-tokens
- M3 Expressive: https://m3.material.io/blog/building-with-m3-expressive

Google is the stylistic reference, not the source of a copied brand identity. Do not reproduce Google product logos, Google-specific illustrations, proprietary UI screenshots, or proprietary font files.

## Primitive tokens

### Color

Use semantic Material 3 roles rather than appearance-based names.

```text
surface                    #FBF8FF
surface-container-lowest  #FFFFFF
surface-container-low     #F6F3FA
surface-container         #F0ECF4
surface-container-high    #EAE6EF
surface-container-highest #E3E0E8

on-surface                #1A1B20
on-surface-variant        #44474F
outline                   #74777F
outline-variant           #C4C6D0

primary                   #0B57D0
on-primary                #FFFFFF
primary-container         #D3E3FD
on-primary-container     #041E49

secondary                 #0F6B4F
on-secondary              #FFFFFF
secondary-container       #C6F1DD
on-secondary-container   #002117

tertiary                  #8A4A00
on-tertiary               #FFFFFF
tertiary-container        #FFDCBE
on-tertiary-container    #2D1600

error                     #BA1A1A
on-error                  #FFFFFF
error-container           #FFDAD6
on-error-container       #410002

surface-inverse           #2F3036
on-surface-inverse        #F2F0F7
inverse-primary            #A8C7FA
```

Use blue as the primary action role. Green and amber are supporting expressive accents; red is reserved for error/destructive meaning. Do not use all accents in every artifact.

Dark theme is derived from the same semantic roles and must preserve role meaning instead of simply inverting every value.

### Typography

Material type roles are mapped as:

```text
display-large    57 / 64 / -0.25 / 400
display-medium   45 / 52 / 0    / 400
display-small    36 / 44 / 0    / 400
headline-large   32 / 40 / 0    / 400
headline-medium  28 / 36 / 0    / 400
headline-small   24 / 32 / 0    / 400
title-large      22 / 28 / 0    / 400
title-medium     16 / 24 / 0.15 / 500
title-small      14 / 20 / 0.1  / 500
body-large       16 / 24 / 0.5  / 400
body-medium      14 / 20 / 0.25 / 400
body-small       12 / 16 / 0.4  / 400
label-large      14 / 20 / 0.1  / 500
label-medium     12 / 16 / 0.5  / 500
label-small      11 / 16 / 0.5  / 500
```

Preferred family stack:

```text
"Google Sans Flex", "Google Sans", Roboto, "Noto Sans", "Segoe UI", Arial, sans-serif
```

Use a monospace face only for literal code, filenames, token identifiers, or other machine-oriented evidence. It is not the primary branding typeface.

### Spacing

Base the system on Material's 8dp spacing scale, with 4px used for fine alignment when necessary:

```text
space-1  = 4
space-2  = 8
space-3  = 12
space-4  = 16
space-5  = 20
space-6  = 24
space-8  = 32
space-10 = 40
space-12 = 48
space-16 = 64
space-20 = 80
```

Prefer padding and gaps over arbitrary margins. Reuse the scale across SVG geometry, README spacing, presentation templates, and authored visual blocks.

### Shape

Use shape as a hierarchy signal rather than making everything a pill.

```text
corner-xs  = 4
corner-sm  = 8
corner-md  = 12
corner-lg  = 16
corner-xl  = 24
corner-xxl = 28
corner-full = 9999
```

Recommended use:

- small utility/control surfaces → 8–12
- standard cards/panels → 16
- primary Hero/proof surfaces → 24
- large expressive containers → 28
- full circles → reserved for icon containers and true circular controls

### Elevation

Prefer tonal surfaces first. Shadows are secondary.

```text
level-0 → surface
level-1 → surface-container-low
level-2 → surface-container
level-3 → surface-container-high
```

Do not stack multiple shadows, glow, blur, border, and gradient effects on the same surface.

## Semantic component rules

```text
Page canvas         → surface
Primary container   → surface-container
Raised container    → surface-container-high
Primary action      → primary / on-primary
Secondary action    → secondary-container / on-secondary-container
Supporting accent   → tertiary-container / on-tertiary-container
Structural edge     → outline-variant
Emphasis edge       → outline
Primary text        → on-surface
Secondary text      → on-surface-variant
Error               → error / on-error or error-container / on-error-container
```

Buttons, chips, badges, cards, and navigation surfaces should derive from these semantic roles rather than hardcoded colors.

## Iconography

Use Material Symbols / Material-style icon geometry as the conceptual reference:

- simple, legible silhouettes
- consistent optical weight
- rounded joins where the rest of the artifact is rounded
- 24px conceptual grid for interface icons
- no emoji as a required semantic UI icon
- repository-owned SVGs may be custom, but should read as one coherent icon family

For README heading icons, keep one semantic icon per H2 as required by `readme-craft`.

## README visual grammar

```text
Canvas → light tonal surface
Identity → centered, spacious, low-noise
Hero → project evidence, not decoration
Navigation → simple text links
Badges → compact semantic metadata
H2 icon → local SVG, optical 20–24px
Tables → light separators and semantic emphasis
Code → neutral container with readable contrast
Support CTA → primary/secondary Material surface, never a dark ad-like banner
```

Avoid the previous AzSkills editorial conventions: dark canvas, teal-gold terminal palette, faux terminal chrome, sharp keyline-heavy panels, all-caps pseudo-interface labels, and decorative technical framing that does not communicate real project structure.

## SVG grammar

Every authored SVG should use this layer order:

```text
1. surface / canvas
2. project identity
3. main information structure
4. semantic accents
5. typography
6. restrained depth
```

Use a small palette per asset. Prefer 2–4 role colors over many decorative colors.

SVG text should use semantic type roles and maximum widths. Keep all critical prose searchable in the surrounding Markdown or HTML.

## Presentation grammar

`frontend-slides` keeps its exact 1920×1080 stage and interaction contract, but its visual defaults should derive from this document.

Use:

- light `surface` or dark semantic surface variants by deck intent
- clear `display`/`headline` hierarchy
- 8px-based spacing
- 16/24/28px shape family
- semantic primary/secondary/tertiary accents
- restrained elevation
- obvious focus and navigation states

Presentation-specific art direction may specialize the system, but must not reintroduce an unrelated global palette.

## Responsive and accessibility rules

- preserve semantic color-role meaning across light and dark themes
- maintain text contrast and non-color state cues
- keep critical SVG text legible when scaled
- avoid dense all-caps microcopy
- allow longer labels and localization expansion
- keep primary actions visually dominant without relying on color alone
- respect reduced-motion behavior in presentation and generated visuals

## Provenance and implementation level

Material 3 is the verified external reference. Exact repository values above are AzSkills implementation choices inspired by Material 3 roles and tuned for GitHub/SVG documentation surfaces. They are not claimed to be Google's exact token values.

External facts such as font availability or Material specifications should be rechecked against the official source when the contract changes.

## Visual QA

At minimum, broad visual changes must be checked for:

- GitHub light theme rendering
- GitHub dark theme rendering
- first-screen hierarchy
- icon consistency
- text wrapping
- surface nesting
- semantic accent usage
- contrast and focus visibility
- SVG clipping/viewBox geometry
- removal of legacy dark/editorial identity fragments

Do not sign off a repository-wide visual redesign from source inspection alone when a renderer or image preview is available.