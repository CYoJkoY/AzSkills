---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with semantic icon systems, adaptive support CTAs, GitHub-safe assets, accessible proof, preserved action links, dynamic repository facts, and maintainable Markdown.
---

# README Craft

Treat a GitHub README as a product interface: it should explain the project quickly, provide proof, guide the first successful action, and remain maintainable as the repository evolves.

## Scope

Use the narrowest mode that satisfies the request:

| Mode | Purpose |
| :--- | :--- |
| `audit` | Review content, hierarchy, visual quality, trust, accessibility, and maintenance without editing |
| `whole-readme` | Redesign information architecture, copy, visual system, and required assets |
| `visual-refresh` | Preserve useful information architecture while improving visual presentation |
| `asset-only` | Create only requested Hero, section, workflow, icon, diagram, showcase, or motion assets |

Never expand `asset-only` into README rewriting without explicit authorization.

## Design Intelligence

All visual README work inherits AzSkills' shared `design-intelligence.md` layer.

Resolve decisions in this order:

1. Explicit user requirements.
2. README-specific hard constraints in this Skill.
3. Shared AzSkills design intelligence.
4. Optional references and examples.

The result must look native to the repository, not like a generic template.

## Core Principles

### Project-first

Inspect the actual repository before designing. Derive visual direction from the real product, audience, outputs, existing artwork, UI, and repository identity.

Never force a fashionable visual system onto an unrelated project.

### First-screen clarity

Without scrolling, a visitor should understand what the project is, why it matters, and what to inspect or do next.

Default narrative:

`Value → Proof → Mechanism → First use → Detail`

### Proof before decoration

Prefer real screenshots, outputs, UI, artifacts, diagrams, command examples, and repository-derived material. Never invent screenshots, benchmarks, testimonials, adoption figures, or unsupported features.

### Stable composition, dynamic facts

Do not hard-code changing repository facts in multiple locations. Keep counts, versions, compatibility facts, and generated summaries tied to a canonical source when practical.

A visual asset must not require manual redesign merely because a repository fact changed.

### Visual rhythm

Long README pages need visual landmarks, but decorative repetition is a defect. Use visuals to clarify hierarchy, not to fill empty space.

## Semantic Icon System

Icons are a meaning layer, not a fixed decoration pack.

Read `references/icon-selection.md` whenever icons are used for section headers, feature groups, workflows, quick-start actions, or other semantic landmarks.

### Mandatory selection process

Before inserting an icon:

```text
content meaning
      ↓
semantic label
      ↓
project-native asset search
      ↓
verified icon-library search
      ↓
candidate scoring
      ↓
context + repetition check
      ↓
theme-safe adaptation
      ↓
placement
```

Never choose `settings`, `arrow`, `adjustment`, or another familiar icon simply because it was used earlier. The icon must match the meaning of the current content.

### Semantic diversity

Build a local icon vocabulary for the README. Typical mappings include:

```text
engineering          → gear / wrench / terminal / system
visual design        → palette / pen / layers / shapes
documentation        → document / book / edit
localization         → globe / language / translate
architecture / model → layers / nodes / stack
selection            → cursor / target / filter
installation         → download / package / plug
verification         → check / shield / test
contribution         → plus / branch / hand
support              → heart / star / gift
```

These are families, not fixed assignments. Search the available source and choose the closest concrete icon.

### Repetition guard

Default rules:

- Do not use the same icon for two adjacent section headers unless it represents the same persistent navigation concept.
- Avoid repeating one icon more than twice within a three-section window.
- Workflow steps with different actions should use different icons when clear candidates exist.
- Prefer a repeated icon over a semantically weaker substitute when the repeated meaning is genuinely the same.

The goal is a vocabulary, not a rotating set of arbitrary shapes.

### Project-native precedence

Prefer:

```text
project-owned icon / artwork
        ↓
project-derived treatment
        ↓
verified reusable icon
        ↓
simple local deterministic SVG
```

When using `Nieobie/game-icon-pack`, select the actual matching asset instead of maintaining a tiny fixed subset. When a reusable icon is visually close but not theme-safe, create a local explicit-fill derivative when licensing permits.

`zhangyu1818/appicon-forge` may be used for project-specific icon generation or customization, but third-party source rights remain independent from the tool's license.

Record reused third-party icon provenance in `THIRD_PARTY_NOTICES.md`.

## Adaptive Visual Support CTA

Support CTA generation is **zero-configuration by default**. The user should not have to choose colors, fonts, icon packs, dimensions, illustration prompts, coordinates, or light/dark variants.

Read `references/support-cta-auto-adapt.md` whenever support/sponsor/funding is present and no finished project-specific CTA already exists.

### Automatic discovery

Inspect:

```text
logo / mascot / favicon / app icon
        ↓
Hero / README artwork
        ↓
screenshots / UI / product artifacts
        ↓
CSS / themes / design tokens / manifests
        ↓
semantic icon sources
        ↓
minimal deterministic fallback
```

Extract:

```text
brand motif
primary / secondary / surface / foreground colors
shape / stroke language
icon language
typography approximation
mood / density
```

Direct project evidence outranks category assumptions.

### Subject and composition

Choose, in order:

```text
mascot / character
        ↓
logo / symbol
        ↓
real product artifact / UI
        ↓
project-derived geometric motif
        ↓
support symbol + typography
```

Then adapt the CTA automatically to the project's palette, typography approximation, geometry, aspect ratio, language, density, and GitHub light/dark backgrounds.

The scaffold is geometry only; it is not a cross-project visual template.

### No-manual-tuning rule

Do not ask for micro-brand decisions when repository evidence is sufficient. Ask only when the support destination is missing or ambiguous, or when an explicit branding constraint conflicts with inference.

### Output rules

The CTA must:

- be recognizably about the target repository;
- be compact rather than a second Hero;
- use repository-relative assets;
- keep the canonical support URL in Markdown;
- keep payment identifiers and critical instructions outside the graphic;
- remain legible on GitHub light and dark themes;
- avoid generic stock donation art when authentic project material exists.

## Preserve Links and Classify Destinations

Before a whole-README rewrite, inventory:

- source repository;
- live/demo/deployment;
- documentation;
- download/release;
- support/sponsorship;
- related repositories;
- legal/privacy destinations.

Treat these separately:

```text
Source repository → code / issues / history
Deployment / live  → website / demo / payment page
Download / release → installer / package / artifact
```

Never invent or guess a deployment URL.

## Content vs Visual Layers

Use Markdown for explanations, commands, links, configuration, API details, compatibility, limitations, security, contribution, and searchable/copyable information.

Use SVG for deterministic Heroes, workflows, semantic icon modules, compact action graphics, and structured diagrams.

Use PNG/WebP for screenshots, photo-like material, generated artwork, and complex composites.

Do not rasterize the entire README.

## Workflow

### Step 1 — Inspect

Collect repository metadata, audience, core functionality, README structure, real visual assets, manifests, badges, releases, outbound links, support destinations, and existing visual identity.

Start read-only. Inspection does not imply permission to modify.

### Step 2 — Define project story

Create:

```text
Audience:
One-sentence value:
Primary proof:
First successful action:
Native visual material:
Project character:
Primary deployment / demo destination:
Primary download destination:
Support / sponsor destination:
```

### Step 3 — Freeze visual direction

Define:

```text
Palette: background / foreground / primary / accent / muted
Typography: system-safe stack / display / body / utility
Shape: radius / stroke / spacing unit
Motif: one recurring project-specific cue
Composition: calm / editorial / technical / playful / cinematic
Density: sparse / compact / expressive
Icon language: source / stroke-weight / fill mode / corner language
```

Derive these from actual project evidence.

### Step 4 — Plan reading order

Default:

1. Hero — project name + concrete value.
2. Proof — real artifact or output.
3. What it is.
4. Why it is different.
5. How it works.
6. How to use.
7. Compatibility, limitations, security, contribution, license, and support when relevant.

### Step 5 — Choose composition

Useful patterns include `split`, `integrated`, `artifact-wall`, `before-after`, `system-map`, `annotated-specimen`, `sequence-strip`, and `title-only`.

Do not default to a left-text/right-graphic Hero.

## Hero Design

The Hero is the visual summary of the repository, not a generic banner.

A Hero may contain:

1. project/category cue;
2. project name;
3. concrete value;
4. project-native visual material;
5. small high-signal metadata.

### Hero maintenance

Changing facts must have one source of truth. Use stable SVG markers and automation when mutable facts appear inside graphics. Visual composition should remain stable when those facts change.

### GitHub-safe defaults

- Prefer a `1200`-unit SVG `viewBox`.
- Embed at `width="100%"`.
- Keep required content inside a conservative safe rectangle.
- Inspect a ~360 px preview.
- Avoid long text near rounded corners.
- Prevent decorative elements from crossing essential typography.

## GitHub-Safe SVG

Use standard SVG geometry, explicit fills/strokes, system-safe fonts, stable positioning, semantic `<title>`/`<desc>`, and repository-relative assets.

Avoid `foreignObject`, JavaScript, external stylesheets, remote fonts, remote images, fragile selectors, and essential content that depends on animation or browser-specific layout.

Standalone `<img>` SVGs do not inherit surrounding Markdown color. Use explicit theme-safe fills and inspect on both GitHub light and dark backgrounds.

Every generated SVG ends with a newline.

## Asset Organization

Prefer:

```text
assets/readme/
├── hero.svg
├── hero.png
├── hero.gif
├── showcase.png
├── section-*.svg
├── workflow.svg
├── support-cta.svg
├── icons/
│   ├── category-*.svg
│   └── utility-*.svg
└── source/
    ├── hero-layout.svg
    ├── hero-subject.*
    ├── support-layout.svg
    ├── support-subject.*
    └── support-prompt.txt
```

Keep source assets separate from published assets. Use lowercase hyphenated names except when retaining an intentional upstream filename.

Do not create dozens of icons merely to appear varied. Create only the semantic assets the README actually needs.

## README Content Engineering

- Explain the mechanism once.
- Put the shortest successful install path before advanced configuration.
- Put real examples before long explanations when immediately understandable.
- Keep limitations visible.
- Keep changing facts dynamic.
- Preserve useful outbound links.
- Prefer project-native visual support over a raw payment URL when it improves hierarchy.
- Generate support visuals from target-repository evidence automatically.
- Use semantic icons selectively and contextually.
- Do not turn every line into a decorated card.

## Verification

Before delivery, verify at realistic GitHub widths.

### Content

- First screen explains the project.
- Value proposition is concrete.
- Proof appears early.
- Installation leads to first success.
- Important limitations are visible.
- Critical instructions remain searchable/copyable.
- Release, documentation, and support destinations remain usable.
- Dynamic facts have a canonical source.

### Visual

- Hero fits completely.
- No clipping or unintended overlap.
- Typography remains readable.
- Narrow preview remains understandable.
- Contrast works on light and dark GitHub themes.
- Icons match their text semantically.
- Adjacent sections do not reuse icons without a real reason.
- The icon set feels like a semantic vocabulary, not a four-icon template.
- Support CTA is obviously clickable and looks native to the target repository.
- Long README sections have deliberate visual rhythm.

### Maintenance

- Assets use repository-relative paths.
- SVG files end with a newline.
- No remote font/script dependency.
- Dynamic facts are automated when practical.
- Third-party icon provenance is recorded.
- Unused/discarded assets are not left behind without reason.
- No unnecessary manual styling burden is placed on the user.

## Change Boundaries

If the user requests an audit, do not edit.

If the user requests asset-only work, do not silently rewrite README copy or links.

If the user requests a whole-README redesign, limit edits to the authorized README and directly required assets.

Preserve valid support destinations unless explicitly told to remove or replace them.

## References

- `references/icon-selection.md` — semantic icon discovery, scoring, diversity, and reuse limits.
- `references/support-cta-auto-adapt.md` — zero-configuration project-native support CTA generation.
- `../design-intelligence.md` — shared visual reasoning layer.
- `../THIRD_PARTY_NOTICES.md` — reused asset provenance.

## Provenance

This Skill is an AzSkills synthesis informed by public README and visual-documentation methodologies, including:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack
