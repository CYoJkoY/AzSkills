---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with deliberate visual systems, semantic iconography, adaptive support CTAs, GitHub-safe assets, accessible proof, preserved action links, dynamic repository facts, and maintainable Markdown.
---

# README Craft

Treat a GitHub README as a product interface. It should explain the project quickly, reduce cognitive load, provide proof, guide the first successful action, and remain maintainable as the repository evolves.

## Scope

Use the narrowest mode that satisfies the request:

| Mode | Purpose |
| :--- | :--- |
| `audit` | Review content, hierarchy, visual quality, trust, accessibility, and maintenance without editing |
| `whole-readme` | Redesign information architecture, copy, visual system, and required assets |
| `visual-refresh` | Preserve useful information architecture while improving visual presentation |
| `asset-only` | Create only requested Hero, section, workflow, icon, diagram, showcase, or motion assets |

Never expand `asset-only` into README rewriting without explicit authorization.

## Design Intelligence Inheritance

All visual README work inherits AzSkills' shared `design-intelligence.md` layer.

Resolve decisions in this order:

1. Explicit user requirements.
2. README-specific hard constraints in this Skill.
3. Shared AzSkills design intelligence.
4. Optional references and examples.

The result must look native to the repository, not like a generic reusable template.

## Core Principles

### Project-first, not template-first

Inspect the actual repository before designing. Derive visual language from what the project does, who uses it, what it produces, and what project-native material already exists.

Never force a fashionable template onto an unrelated project.

### First-screen clarity

Without scrolling, a new visitor should understand:

1. What is this?
2. What can it do for me?
3. What should I inspect next?

Default narrative:

`Value → Proof → Mechanism → First use → Detail`

### Real proof beats decoration

Prefer real screenshots, outputs, UI, artifacts, repository-derived diagrams, command examples, and existing project artwork. Generated material is justified only when it performs a specific communication job.

Never invent adoption numbers, benchmarks, testimonials, screenshots, features, or behavior.

### Dynamic facts have one source of truth

Do not hard-code changing repository facts in multiple locations.

Common examples include Skill/package counts, release/version labels, generated badges, repository statistics, generated catalog summaries, and compatibility metadata.

Prefer:

```text
repository state
      ↓
canonical generated fact
      ↓
badge / Hero / summary / table
```

A visual asset must not require manual redesign merely because a count changed. Keep mutable data separate from stable composition. Use machine-readable SVG markers and automation when a mutable fact must appear inside a graphic.

### Visual rhythm: icons are information aids, not decoration

Use semantic icons at meaningful hierarchy boundaries: sections, feature groups, workflow stages, quick-start actions, support/action CTAs, and warnings/notes where an icon adds meaning.

Do not attach an icon to every paragraph, sentence, or table row. Excessive repetition becomes noise.

Aim for one recognizable visual cue every one to three major content blocks, with stronger icon treatment at section transitions and weaker treatment inside repeated content.

## Icon Source Library Policy

When semantic icons materially improve readability, these curated sources are permitted:

- `Nieobie/game-icon-pack` — primary reusable semantic icon source. The repository declares `CC0-1.0` and provides SVG/PNG assets.
- `zhangyu1818/appicon-forge` — generation/customization tool for project-specific icons, compact identity marks, and custom color treatments. Its own project is MIT-licensed, but third-party inputs keep their own rights.

Use this decision order:

```text
existing project icon/asset
        ↓ no suitable asset
CC0 reusable icon from game-icon-pack
        ↓ no suitable semantic match
custom icon generated/tuned with appicon-forge
        ↓ still unsuitable
simple deterministic SVG authored locally
```

Prefer local copies over fragile upstream hotlinks when redistribution is permitted. Record reused third-party icon provenance in `THIRD_PARTY_NOTICES.md`.

## Preserve Project-Native Links and Support

README redesign is not permission to remove useful project destinations. Inventory downloads/releases, documentation/demos, related repositories, issues/discussions, sponsorship/donation/funding, and legal/privacy destinations before rewriting.

A valid support destination must be preserved unless the user explicitly asks to remove or replace it.

A raw payment URL is a destination, not a complete presentation. Prefer a compact visual support CTA when it improves hierarchy, while retaining the canonical support URL as normal searchable/copyable Markdown.

## Adaptive Visual Support CTA

Support CTA generation is **zero-configuration by default**. The user should not have to provide exact colors, fonts, icon choices, dimensions, illustration prompts, or layout coordinates when the repository already contains enough evidence to infer them.

Read `references/support-cta-auto-adapt.md` whenever a support/sponsor/funding CTA is needed and no finished project-specific asset is already available.

### Automatic discovery

Inspect, in order:

```text
project logo / mascot / favicon / app icon
        ↓
Hero / README assets
        ↓
screenshots / UI / artwork / sprites / diagrams
        ↓
CSS / theme / design tokens / package metadata
        ↓
semantic icon libraries
        ↓
minimal deterministic fallback
```

Extract a compact visual token set without asking the user to tune it manually:

```text
brand motif
primary / secondary / surface / foreground colors
shape / stroke language
icon language
typography approximation
mood / density
```

Direct project evidence outranks category-based assumptions.

### Automatic subject selection

Choose the strongest recognizable subject using:

```text
mascot / character
        ↓
logo / symbol
        ↓
real product artifact or UI
        ↓
project-derived geometric motif
        ↓
support symbol + typography
```

The CTA must remain recognizably about the target project, not about a generic donation theme.

### Automatic composition

Use a stable responsive scaffold only as geometry:

```text
┌─────────────────────────────────────────────┐
│ [project visual]  SUPPORT / SPONSOR         │
│                  short native rationale     │
└─────────────────────────────────────────────┘
```

Automatically adapt:

- aspect ratio to the source artwork;
- scale to preserve recognizability;
- text length to the repository language;
- palette to extracted project colors;
- radius/stroke to existing visual language;
- contrast for GitHub light and dark backgrounds;
- visual density to the surrounding README.

The scaffold is not a cross-project template. Project identity controls the appearance.

### No-manual-tuning rule

Do not ask the user to choose exact:

- hex colors;
- font families;
- icon packs;
- button dimensions;
- border radius;
- illustration prompts;
- coordinates;
- light/dark variants.

Infer them from repository evidence. Ask only when the canonical support destination is missing/ambiguous or when the user explicitly imposes a branding constraint.

### Fallback

When project visuals are weak:

```text
project-native artwork
        ↓
project-native logo / UI / geometric motif
        ↓
small deterministic support symbol + typography
```

Do not block the README because project art is incomplete. Do not invent a mascot solely for a payment CTA.

### Support asset output

Use a compact local asset such as:

```text
assets/readme/support-cta.svg
```

Keep the actual support URL outside the SVG. The image is only the interface layer.

## Distinguish Source, Deployment, and Download Destinations

Treat these as different link types:

```text
Source repository   → code, issues, history, contribution
Deployment / live   → website, demo, online docs, hosted dashboard, payment page
Download / release  → installer, executable, package, release artifact
```

For support/payment, use the verified user-facing deployment when one exists. Keep the source repository as a separately labeled source link when useful.

Never invent or guess a deployment URL.

## Content and Visual Layers Stay Separate

Use Markdown for explanations, commands, links, configuration, API details, compatibility, limitations, security, contribution, support destinations, and other searchable/copyable information.

Use SVG for deterministic Heroes, workflow diagrams, icons, compact action graphics, and structured visual explanations.

Use PNG/WebP for screenshots, photo-like material, generated artwork, and complex composites.

Use GIF only for explicitly approved motion that communicates something meaningful, with a static fallback.

Never rasterize the entire README.

## Workflow

### Step 1 — Inspect the repository

Collect:

- repository name and description;
- audience and primary user action;
- technology and core functionality;
- README and document structure;
- real screenshots, outputs, UI, logos, artwork, and diagrams;
- package/manifests and metadata;
- badges, license, release information, and directory structure;
- outbound links, support/sponsorship destinations, and action buttons;
- current visual identity and design tokens;
- whether important links point to source, deployment, or downloads.

For a GitHub URL, inspect the live default branch before proposing changes.

Start read-only. Inspection does not imply permission to modify or publish.

### Step 2 — Define the project story

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

### Step 3 — Choose the visual direction

Freeze:

```text
Palette: background / foreground / primary / accent / muted
Typography: system-safe stack / display / body / utility
Shape: radius / stroke / spacing unit
Motif: one recurring project-specific cue
Composition: calm / editorial / technical / playful / cinematic
Density: sparse / compact / expressive
Icon language: source / stroke-weight / fill mode / corner language
```

Derive choices from actual project semantics and evidence before visual polish.

### Step 4 — Plan the reading order

Default:

1. Hero — project name + plain-language value.
2. Proof — screenshot, output, specimen, showcase, or repository-derived diagram.
3. What it is — concise explanation.
4. Why it is different — mechanism, not slogans.
5. How it works — short flow with semantic visual cues.
6. How to use — installation + first successful action.
7. Compatibility, limitations, security, contribution, license, and support when relevant.

### Step 5 — Choose composition deliberately

Useful patterns:

- `split` — title plus one clear proof artifact;
- `integrated` — title and proof share one grid;
- `artifact-wall` — several real outputs with controlled scale and whitespace;
- `before-after` — useful when transformation is the mechanism;
- `system-map` — source feeding components or outputs;
- `annotated-specimen` — one artifact with meaningful callouts;
- `sequence-strip` — three to six dependent stages;
- `title-only` — when no honest visual proof exists.

Do not default to a left-text/right-graphic Hero.

## Iconography

Treat icons as a secondary visual language.

### Semantic mapping

```text
configuration → settings / adjustment
workflow      → arrow / route
engineering   → tool / gear / system
translation   → A-to-Z / language
documentation → document / editing
support       → heart / star / contribution
```

Select the closest verified asset. Do not force a semantically wrong icon because it looks attractive.

### Density

```text
Primary section icon  → 20–32 px
Feature/card icon     → 18–24 px
Inline utility icon   → 14–18 px
```

Use one major visual landmark every one to three content blocks, one category icon per major category, and at most one utility icon per short supporting block.

### Accessibility

- Give meaningful icons useful `alt` text.
- Use empty alt text for purely decorative icons.
- Never make icon color the only state indicator.
- Keep contrast sufficient on GitHub light and dark backgrounds.
- Keep essential instructions out of graphics.

## Hero Design

The Hero is the visual summary of the repository, not a generic banner.

A Hero may contain:

1. category/context cue;
2. project name;
3. concrete one-line value;
4. project-native visual material;
5. small high-signal metadata.

### Hero maintenance rule

Never bake changing repository facts into the composition unless synchronization exists.

For mutable Hero data:

1. identify the canonical source;
2. add a stable machine-readable marker such as `id="skill-count"`;
3. automate the displayed fact from that source;
4. fail loudly when the marker is missing or duplicated;
5. keep the visual composition unchanged when the fact changes.

### GitHub-safe Hero defaults

- Prefer a `1200`-unit-wide SVG `viewBox`.
- Embed at `width="100%"`.
- Keep essential text inside a conservative safe rectangle.
- Keep required text readable at realistic GitHub widths.
- Inspect a ~360 px preview.
- Avoid long text near rounded corners.
- Do not let decorative elements cross essential typography.

## GitHub-Safe SVG

Use standard SVG shapes, paths, text, fills, strokes, clipping paths, patterns, and transforms.

Use system font stacks, explicit geometry, consistent radii, semantic `<title>`/`<desc>`, stable positioning, and repository-relative assets.

Avoid `foreignObject`, JavaScript, external stylesheets, remote fonts, remote image URLs inside SVG, fragile selectors, essential content inside animation, browser-specific layout tricks, and unresolved local raster references.

Every generated SVG must end with a newline.

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

Use lowercase hyphenated names except where an upstream filename is intentionally retained. Keep source assets separate from published assets.

For coordinated assets, share hierarchy, spacing rhythm, and semantic vocabulary while allowing every asset to retain project-specific visual identity.

## README Content Engineering

- Explain the core mechanism once.
- Put the shortest successful install path before advanced configuration.
- Put real examples before long explanations when the example is immediately understandable.
- Keep limitations visible.
- Keep searchable/copyable information in Markdown, not SVG.
- Avoid long prose in dense tables.
- Keep changing repository facts dynamic.
- Preserve useful outbound links.
- Classify important links as source, deployment/live, or download/release.
- Preserve valid sponsorship/donation/support destinations.
- Prefer a compact visual support CTA over a bare payment URL when it improves hierarchy.
- Generate that CTA from target-repository evidence automatically whenever possible.
- Do not reuse branded support artwork from another repository.

## Third-Party Icon Provenance

When icons from `game-icon-pack` or icons generated through `appicon-forge` are used:

1. record the source repository;
2. record the exact local asset path or source icon name;
3. record the applicable license or rights status;
4. keep required attribution/notices in `THIRD_PARTY_NOTICES.md`;
5. do not assume the tool's license covers third-party inputs;
6. prefer local copies over fragile upstream hotlinks when redistribution is permitted.

## Link Inventory

Before a whole-README redesign, record:

| Purpose | URL type | Canonical destination | Preserve? |
| :--- | :--- | :--- | :--- |
| Source | repository | GitHub source repo | Yes |
| Live / Demo | deployment | hosted site | Yes |
| Docs | deployment or repository | actual docs destination | Yes |
| Download | release / artifact | actual download endpoint | Yes |
| Support | deployment | deployed payment/sponsor page | Yes |

Do not assume a GitHub repository URL is the canonical destination for every action.

## Visual Quality and UX Rules

Treat a README as an interface:

- hierarchy before ornament;
- predictable reading order;
- strong contrast;
- accessible alt text;
- no essential information conveyed by color alone;
- no tiny body text carrying meaning;
- no accidental horizontal overflow;
- no repetitive card walls when a diagram, specimen, or direct example is clearer;
- no decorative element that competes with proof;
- icons clarify hierarchy or meaning rather than exist for decoration alone;
- visual density alternates between information-rich and visual-relief blocks;
- action destinations remain obvious and usable;
- support CTAs look native to the target repository;
- support CTAs are adapted automatically rather than delegated to user styling work.

## Verification

Before delivery, verify at realistic GitHub widths.

### Content

- First screen explains the project.
- Value proposition is concrete.
- Proof appears early.
- Installation leads to first success.
- No unsupported claims.
- Important limitations are visible.
- Critical instructions remain searchable and copyable.
- Existing valid release, documentation, and support destinations remain available.
- Important links point to the correct destination type.
- Sponsor/support URLs remain directly usable.
- Dynamic facts have a canonical source.

### Visual

- Hero fits completely.
- No SVG clipping or unintended overlap.
- Typography remains readable.
- Narrow preview remains understandable.
- Contrast works on relevant GitHub backgrounds.
- Alt text is meaningful.
- Icon language is visually coherent.
- Icons are sparse enough to guide scanning.
- Section-to-section visual rhythm does not become a continuous wall of text.
- Support CTA is obviously clickable.
- Support CTA clearly belongs to the target repository.
- Support CTA does not look transplanted from AzSkills or another unrelated project.
- Support CTA remains legible on both light and dark GitHub themes.

### Maintenance

- Assets use repository-relative paths.
- SVG files end with newline.
- No remote font/script dependency.
- Dynamic facts are automated when practical.
- Third-party icon provenance is recorded.
- No duplicated source/deployment/download URLs.
- Unrelated files are untouched.
- Discarded assets are removed unless intentionally retained.
- Support asset source material is retained only when it is useful for reproducibility.

## Approval and Change Boundaries

If the user requests an audit, do not edit.

If the user requests asset-only work, do not silently change README copy, ordering, embeds, or links.

If the user requests a whole-README redesign, limit edits to the authorized homepage and directly required assets.

Preserving an existing valid sponsor/support link is a content-preservation requirement unless the user explicitly requests removal or replacement.

Adding or automatically generating a visual CTA is allowed when it improves usability, but it must not remove, obscure, or falsify canonical information.

## Output Contract

For whole-README work, the final repository should contain:

1. a clear first screen;
2. readable visual rhythm;
3. semantic iconography where it materially improves scanning;
4. proof before deep detail;
5. searchable/copyable Markdown for technical content;
6. correctly classified and preserved outbound links;
7. dynamic repository facts where automation is practical;
8. a project-native support/action surface when the project has one;
9. GitHub-safe visual assets;
10. provenance for reused third-party icon assets;
11. no unnecessary manual styling burden placed on the user.

## References

- Adaptive support CTA workflow: `references/support-cta-auto-adapt.md`
- Shared design intelligence: `../design-intelligence.md`
- Third-party provenance: `../THIRD_PARTY_NOTICES.md`

## Provenance

This Skill is an AzSkills synthesis informed by public README and visual-documentation methodologies, including:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack
