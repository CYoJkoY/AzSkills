# Adaptive Support CTA Reference

Use this reference whenever a README contains a sponsor, donation, support, funding, contribution, or payment CTA and no finished project-specific support asset already exists.

## Objective

Generate a project-native visual support CTA with no manual style questionnaire. Infer the visual direction from repository evidence and make the final CTA reliable on GitHub light and dark themes.

## Input discovery order

Inspect these sources in order:

1. Existing project logo, mascot, icon, favicon, app icon, and brand assets.
2. Hero/banner and README visual assets.
3. Product screenshots, UI screenshots, game sprites, artwork, diagrams, and generated previews.
4. Existing CSS/theme/design tokens or application palette.
5. Package metadata, manifest, repository description, and technology/domain terms.
6. Existing semantic icons from permitted libraries when no stronger project-native asset exists.

Do not require the user to specify colors, fonts, icon style, illustration subject, composition, or light/dark variants when these can be inferred from the repository.

## Visual feature extraction

Derive a compact token set:

```text
brand motif       = strongest recognizable project cue
primary color     = dominant project brand/accent color
secondary color   = supporting UI/brand color
light surface     = dominant light-mode background/surface color
dark surface      = dominant dark-mode background/surface color
light foreground  = readable light-mode text color
dark foreground   = readable dark-mode text color
shape language    = radius / corner / stroke character
icon language     = filled / outlined / mascot / geometric
typography        = strongest safe approximation from existing project
mood              = technical / playful / editorial / cinematic / minimal / etc.
```

Prefer direct observation over semantic guessing. A repository's actual logo or screenshot always outranks assumptions based on its programming language or category.

## Asset selection algorithm

Select the strongest available visual subject using this priority:

```text
existing mascot / character
        ↓
existing logo / symbol
        ↓
real product artifact or UI element
        ↓
project-derived geometric motif
        ↓
minimal support symbol + typography
```

Reusing a project asset is allowed only when its license and repository ownership make that appropriate. Never invent ownership or licensing facts.

## Automatic composition

Use a stable responsive CTA frame, then adapt its contents automatically:

```text
┌─────────────────────────────────────────────┐
│ [project visual]  SUPPORT / SPONSOR         │
│                  short project-native line  │
└─────────────────────────────────────────────┘
```

The frame is a compositional scaffold, not a visual template. Adapt:

- aspect ratio when the source artwork is wide or tall;
- text length to the repository's language;
- visual subject scale to preserve recognizability;
- contrast for GitHub light and dark backgrounds;
- palette independently for light and dark surfaces when required;
- corner radius and stroke weight from existing UI/art language.

Keep the CTA compact. It should not become a second Hero.

## Theme strategy

The support CTA must have an explicit theme strategy:

```text
intrinsically readable on both themes
        OR
separate light/dark assets
        OR
one asset rendered through a verified theme-aware mechanism
```

For GitHub README Markdown, prefer `<picture>` when the CTA materially changes with theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/support-cta-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/support-cta-light.svg">
  <img src="assets/readme/support-cta-light.svg" alt="Support the project" width="620">
</picture>
```

Keep the light and dark compositions semantically equivalent. Do not let one variant become a different advertisement.

The fallback `<img>` must be independently readable.

## No-manual-tuning rule

The agent must not ask the user to choose among:

- exact hex colors;
- font families;
- icon packs;
- button dimensions;
- border radius;
- illustration prompts;
- light/dark variants;
- layout coordinates.

Infer these from repository evidence. Only surface a question when a missing canonical destination or explicit branding constraint prevents correct execution.

## Fallback behavior

When visual evidence is weak:

1. derive a simple geometric motif from the project name or existing mark;
2. pair it with a support/contribution symbol;
3. use restrained project-derived colors with explicit light/dark contrast;
4. keep typography system-safe;
5. avoid stock-style donation art and generic coffee-cup banners.

A missing project identity is not a reason to block the README rewrite.

## Output contract

The generated support CTA must:

- be project-specific;
- link to the canonical support destination;
- work on GitHub light and dark backgrounds;
- remain understandable at narrow README widths;
- keep important payment/support details in Markdown;
- use repository-relative assets;
- avoid external runtime dependencies;
- be reproducible from the inspected repository evidence;
- include meaningful `alt` text when the image conveys semantic information;
- document or embody an explicit light/dark strategy.

## Recommended local structure

```text
assets/readme/
├── support-cta.svg
├── support-cta-light.svg
├── support-cta-dark.svg
└── source/
    ├── support-layout.svg
    ├── support-subject.*
    └── support-prompt.txt
```

Do not create source files when the final CTA can be deterministically authored without them. Do not create a dark/light pair when a single CTA is demonstrably theme-neutral and passes both-theme verification.
