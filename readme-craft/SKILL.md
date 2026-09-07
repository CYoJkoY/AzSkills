---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with mandatory semantic heading icons, automatically adapted project-specific support CTAs, GitHub-safe assets, accessible proof, preserved action links, dynamic repository facts, and maintainable Markdown.
---

# README Craft

Treat a GitHub README as a product interface: it should explain the project quickly, provide proof, guide the first successful action, and remain maintainable as the repository evolves.

## Scope

Use the narrowest mode that satisfies the request:

| Mode | Purpose |
| :--- | :--- |
| `audit` | Review content, hierarchy, visual quality, trust, accessibility, and maintenance without editing |
| `whole-readme` | Redesign information architecture, copy, visual system, heading icon system, support visuals, and required assets |
| `visual-refresh` | Preserve useful information architecture while improving visual presentation, heading icons, and project-native visuals |
| `asset-only` | Create only requested Hero, section, workflow, icon, diagram, showcase, support, or motion assets |

Never expand `asset-only` into README rewriting without explicit authorization.

## Design Intelligence

All visual README work inherits AzSkills' shared `design-intelligence.md` layer.

Resolve decisions in this order:

1. Explicit user requirements.
2. README-specific hard constraints in this Skill.
3. Shared AzSkills design intelligence.
4. Optional references and examples.

The result must look native to the repository, not like a generic template.

## Non-negotiable output gates

A request to **redesign / rewrite / recreate a README** is not complete until all applicable gates below are satisfied.

### Gate A — Structural redesign

The result must visibly change or validate all of these dimensions:

```text
project story
information hierarchy
first-screen composition
section ordering
semantic heading system
project-native visual language
support/funding treatment when applicable
```

Simply rewriting paragraphs while retaining the old visual structure is not considered a redesign.

### Gate B — Heading icon system

For a whole README redesign, **semantic icons on section/category headings are mandatory whenever there are suitable concepts to represent**.

Minimum requirement:

- Every major H2 section that benefits from a visual marker receives one semantic icon immediately before the heading text.
- Related H3 category headings should receive icons when they introduce distinct semantic concepts or grouped content.
- Icons must be real assets, not textual emoji substitutes, unless the platform or requested format explicitly rules out image assets.
- Icon files must live inside the target repository, normally under `assets/readme/icons/`.
- The icon must be visually related to the target repository's identity rather than copied from the AzSkills README as a generic decoration.

Before delivery, inspect the final Markdown and verify that headings actually contain the icon markup. Designing icon files without wiring them into headings is a failed implementation.

### Gate C — Automatic project-native support CTA

When a README contains a support / sponsor / donation / funding CTA, the support visual must be **derived from the target repository itself** unless the repository already provides a finished project-specific support asset.

A support CTA is considered adapted only when its composition uses at least two independent project signals, such as:

```text
logo / mascot / icon
real application UI / game artwork / screenshot
project palette / theme tokens
project-specific geometric motif
project-specific typography treatment
project-specific domain imagery
```

A generic heart, coffee cup, donation icon, or AzSkills-themed panel with the project name swapped in is not an adapted CTA.

For whole-readme and visual-refresh work:

1. Inspect project identity evidence.
2. Extract visual tokens.
3. Select the strongest project-native subject.
4. Compose a compact support graphic around that subject.
5. Save it in the target repository, normally as `assets/readme/support-cta.svg`.
6. Wire the actual support destination into Markdown outside the graphic as well.

When the target project is visually weak, derive the fallback motif from the repository's own name, logo geometry, UI, domain, or technical artifacts. Do not revert to a cross-project generic donation banner.

The implementation must be repository-native and zero-configuration. Do not ask the user to select colors, fonts, layouts, dimensions, illustration prompts, or light/dark variants when repository evidence is sufficient.

### Gate D — Repository-specific visual evidence

For a whole README redesign, identify the evidence used for the visual system:

```text
identity source:
palette source:
shape/stroke source:
icon source:
support CTA subject:
```

If the final README contains a visual system that cannot be traced back to the repository, rework it.

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

Icons are a meaning layer, not a decoration layer. They should make hierarchy easier to scan or clarify the meaning of a deliberate visual component.

Read `references/icon-selection.md` whenever icons are needed.

### Placement rule — icons belong to hierarchy

Default placement is **immediately adjacent to a heading or inside a deliberate visual component**.

Preferred:

```text
## [icon] Section title
### [icon] Category title
[icon] Feature card / workflow step / diagram node
```

Avoid:

```text
[icon] paragraph
[icon] sentence
[icon] code block introduction
[icon] random whitespace
[icon] isolated line before a heading
```

Do not place a standalone icon between a heading and its first paragraph. Do not prepend icons to installation commands, prose instructions, selection notes, links, or code fences merely to create decoration.

For section headings, use at most one semantic icon immediately before the title. For category headings, use at most one semantic icon immediately before the category name. Do not place a second icon on the same heading line.

Use icons inside tables/cards/diagrams only when the component is intentionally visual and the icon contributes meaning to that component. A workflow table may use one distinct icon per step; a normal documentation paragraph should not.

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
placement at the correct hierarchy level
```

Never choose `settings`, `arrow`, `adjustment`, or another familiar icon simply because it was used earlier. The icon must match the meaning of the current content.

### Semantic diversity

Build a local icon vocabulary for the README. Typical families include:

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

- Do not use the same icon for two adjacent section or category headings unless it represents the same persistent concept.
- Avoid repeating one heading icon more than twice within a three-section window.
- Workflow steps with different actions should use different icons when clear candidates exist.
- Prefer a repeated icon over a semantically weaker substitute when the repeated meaning is genuinely the same.
- Never rotate through a fixed icon subset merely to make the README look decorated.

The goal is a coherent vocabulary, not arbitrary visual variation.

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

Support CTA generation is **zero-configuration by default**, but project adaptation is mandatory for whole README redesigns whenever a support CTA exists.

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
minimal deterministic fallback derived from the project itself
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
support symbol + project-specific treatment
```

Then adapt the CTA automatically to the project's palette, typography approximation, geometry, aspect ratio, language, density, and GitHub light/dark backgrounds.

The scaffold is geometry only; it is not a cross-project visual template.

### Zero generic CTA rule

Never reuse the same support graphic across unrelated repositories except for a plain text/link treatment where no image is used.

Two repositories with different identities must not receive the same CTA artwork with only the project name changed.

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

### Step 6 — Build the local visual asset set

For whole-readme and visual-refresh work:

```text
assets/readme/
├── hero.*
├── support-cta.svg
└── icons/
    ├── <semantic>-*.svg
    └── ...
```

Create only the assets actually used by the README, then wire every created asset into the document. An unused asset is not evidence of implementation.

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
- Use semantic icons selectively and contextually, with heading usage mandatory for whole-readme redesigns when suitable.
- Put semantic icons primarily on headings and deliberate visual components.
- Do not place icons in arbitrary paragraph margins, between headings and prose, or beside code fences.
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
- Major headings contain real semantic icon assets when applicable.
- Heading icons sit directly beside their headings.
- Standalone inline icons are absent unless they belong to an intentional visual component.
- Adjacent sections do not reuse icons without a real reason.
- The icon set feels like a semantic vocabulary, not a four-icon template.
- Support CTA is visibly project-specific, not a generic template with a renamed title.
- Support CTA visual subject can be traced to repository evidence.
- Long README sections have deliberate visual rhythm.

### Implementation

- Every newly created heading icon is referenced by the README.
- The support CTA asset is referenced by the README when a support visual is required.
- No asset exists solely as an unused decorative artifact.
- The final Markdown actually contains the intended image/icon markup rather than merely describing it in prose.

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

- `references/icon-selection.md` — semantic icon discovery, scoring, diversity, reuse limits, and placement rules.
- `references/support-cta-auto-adapt.md` — zero-configuration project-native support CTA generation.
- `../design-intelligence.md` — shared visual reasoning layer.
- `../THIRD_PARTY_NOTICES.md` — reused asset provenance.

## Provenance

This Skill is an AzSkills synthesis informed by public README and visual-documentation methodologies, including:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack
