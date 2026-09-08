---
name: readme-craft
description: Design, rewrite, audit, and maintain project-native GitHub README homepages with evidence-first information architecture, distinctive visual direction, semantic heading icons, mandatory support/funding preservation, light/dark theme safety, accessible proof, stable action links, dynamic repository facts, and GitHub-safe Markdown/SVG implementation.
---

# README Craft

Treat a GitHub README as a product interface and a trust surface, not as a text dump. The job is to make the repository understandable, credible, visually distinctive, actionable, and maintainable.

This Skill is an AzSkills synthesis informed by public frontend-design, README-design, accessibility, and documentation practices. It is not a copy or vendor package.

## 1. Automatic scope

Apply this Skill to:

- new README creation
- full README rewrites
- visual redesigns or refreshes
- documentation homepages
- project landing pages in `README.md`
- README audits and cleanup
- hero/banner, section graphics, diagrams, icons, showcase modules, or support CTA work that will appear in a README

Use the narrowest mode that fully solves the request:

| Mode | Responsibility |
| :--- | :--- |
| `audit` | Diagnose structure, copy, trust, links, theme behavior, accessibility, visual hierarchy, and maintainability without editing |
| `whole-readme` | Redesign information architecture, copy, visual system, assets, links, support treatment, and theme behavior |
| `visual-refresh` | Preserve useful information architecture while improving visual direction, assets, hierarchy, and theme safety |
| `asset-only` | Create or revise only explicitly requested README assets |
| `maintenance` | Update existing README facts, links, screenshots, versions, support destinations, or sections without unnecessary redesign |

Never turn `asset-only` or `maintenance` into a full rewrite unless the user explicitly requests it or the existing artifact cannot remain correct without structural change.

## 2. Decision precedence

Resolve conflicts in this order:

1. Explicit user requirements.
2. Repository facts and existing project conventions.
3. README-specific hard constraints in this Skill.
4. `design-intelligence.md`.
5. Optional external references and stylistic inspiration.

Do not replace an established project identity merely because another visual style is fashionable.

## 3. Non-negotiable quality gates

A whole README redesign is incomplete until all applicable gates pass.

### Gate A — Evidence-first repository understanding

Inspect the actual repository before writing the final structure or copy.

Collect, where available:

```text
repository name / description
primary audience
core problem
actual features
README and documentation
package / project metadata
supported versions
installation method
releases / downloads
screenshots / demos
existing UI / artwork / logo / iconography
canonical links
support / sponsorship destination
license / contribution information
light/dark visual behavior
```

Do not invent:

- features
- benchmarks
- user counts
- testimonials
- screenshots
- compatibility
- deployment URLs
- support links
- payment identifiers
- version claims

When a fact is uncertain, verify it from a first-party source or omit it.

### Gate B — First-screen clarity

The first viewport should answer, with minimal scrolling:

```text
What is this?
Who is it for?
Why should I care?
What should I inspect or do next?
```

Default narrative:

`Value → Proof → Mechanism → First action → Detail`

The exact ordering may change for developer tools, libraries, games, visual assets, and other domains, but the first screen must have one obvious primary job.

### Gate C — Distinctive visual direction

Do not produce a README that looks like a generic AI-generated SaaS template.

Before styling, establish:

```text
visual thesis
project subject
audience
primary message
dominant composition
palette roles
typography roles
shape language
icon language
image treatment
light/dark strategy
```

Make at least three deliberate choices that clearly come from the project rather than from a generic template, such as:

- project-specific color relationships
- real product imagery or artwork
- project-derived geometric motif
- custom semantic icon treatment
- distinctive composition
- project-specific typographic pairing
- domain-specific visual metaphor

A README can be restrained, but it must still have a point of view.

### Gate D — Heading icon system

For a visual whole-readme redesign, major headings should use semantic repository-local icons when they materially improve scanability.

Rules:

- use at most one icon per heading line;
- place the icon immediately before the heading text;
- use real image assets rather than emoji as visual identity;
- keep icons inside the repository, normally `assets/readme/icons/`;
- use project-owned or project-derived icons before generic library icons;
- preserve a coherent stroke/fill vocabulary;
- verify every icon against GitHub light and dark backgrounds;
- do not add icons to ordinary paragraphs, commands, links, or whitespace merely for decoration.

Do not force an icon onto every heading when it makes the hierarchy noisier. Semantic value outranks decoration.

### Gate E — Support / sponsorship preservation

For a whole README rewrite, **support/funding treatment is mandatory whenever a canonical support destination exists**.

The workflow must actively inspect:

```text
README links
repository About / homepage
funding metadata
GitHub Sponsors configuration
maintainer-owned support pages
project donation/payment pages
```

When a valid support destination exists:

- keep it unless the user explicitly asks to replace it;
- give it a dedicated Support / Sponsor / Funding section when appropriate;
- explain what support helps sustain;
- link directly to the canonical destination;
- do not hide it as a badge-only element;
- include a project-native support CTA when a visual element improves hierarchy.

**Never silently remove sponsorship/support content during a README redesign.**

When a support destination cannot be verified, do not invent one. Preserve a previously valid destination if it is already present; otherwise omit destination-dependent claims.

### Gate F — Project-native support CTA

When a support CTA exists, it must be derived from the project rather than being a reusable generic donation banner.

Use at least two real project signals:

```text
logo / icon / mascot
real screenshot / UI / output
project palette
project geometry
project typography treatment
domain-specific imagery
```

Preferred subject order:

```text
mascot / character
↓
logo / symbol
↓
real product artifact
↓
project-derived motif
↓
minimal support symbol with project-native treatment
```

Keep the canonical URL as actual Markdown/HTML link text outside the image as well. Critical payment or contact information must never exist only inside a graphic.

### Gate G — Light/dark theme safety

Every README visual must be evaluated against GitHub light and dark backgrounds, including:

```text
hero
logo / marks
section icons
workflow graphics
support CTA
screenshots with framed presentation
badges / authored visual modules
```

Use one of:

1. genuinely theme-neutral artwork;
2. explicit light/dark variants;
3. theme-aware `<picture>` markup.

Preferred pattern:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/hero-light.svg">
  <img src="assets/readme/hero-light.svg" alt="Project overview">
</picture>
```

Do not assume an SVG inherits GitHub's surrounding text color.

For variants:

- keep layout and semantic content equivalent;
- change palette/contrast only when possible;
- keep the fallback image valid;
- verify both wide and narrow rendering;
- do not ship a polished light asset and a broken dark asset.

### Gate H — Link correctness

Inventory all important destinations before rewriting:

```text
source repository
live / demo / deployment
documentation
installation / quick start
download / release
support / sponsorship
related repositories
license / contribution
security / privacy when applicable
```

Keep destination semantics distinct:

```text
Source → inspect code / issues / history
Documentation → learn / integrate / configure
Demo → experience product
Release → download / install
Support → fund / sponsor / contribute financially
```

Never replace an explicit destination with a guessed one.
Never change a valid support destination to a more fashionable service without evidence.

## 4. Information architecture

Use the project's real job to choose the structure.

### General software project

```text
Hero
Proof / screenshot / output
What it is
Why it matters
Features
How it works
Quick Start
Configuration / usage
Compatibility / limitations
Roadmap or status
Contributing
License
Support / Sponsorship
```

### Developer library / framework / tool

```text
Hero
One-sentence value proposition
Documentation / Quick Start
Install
Minimal example
Core capabilities
Architecture / mechanism
API or configuration
Compatibility
Migration / limitations
Contributing
License
Support
```

For developer infrastructure, documentation and the shortest working example often deserve the highest priority after the Hero. Do not bury practical usage below marketing copy.

### Game / creative project

```text
Hero
Real screenshots / showcase
Concept
Features / content
Installation
Compatibility
Configuration
Known limitations
Credits
Support
```

### Project repository with existing strong docs

Do not duplicate an entire manual. Use the README as an entry point and route readers to the authoritative documents.

## 5. Composition rules

Start with composition, not with cards.

Useful README compositions include:

```text
integrated hero
artifact-led hero
split editorial hero
before / after
system map
annotated specimen
sequence strip
feature matrix
title-only / quiet documentation
```

Cards, pills, badges, and repeated rounded containers are optional components, not the default layout.

Avoid:

- identical card grids for every feature;
- excessive rounded panels;
- large decorative gradients with no semantic job;
- arbitrary glassmorphism;
- giant empty banners that delay useful information;
- visual repetition with no change in meaning.

## 6. Typography

Use typography as information architecture.

Define roles for:

```text
display / project statement
heading / section
body / explanation
utility / metadata
numeric / metrics
code / technical examples
```

Protect:

- line length;
- line height;
- contrast;
- wrapping;
- heading scale;
- bilingual expansion;
- code readability.

Do not shrink body type simply to fit more content.

For bilingual projects, do not manually alternate Chinese and English inside every paragraph unless the user explicitly wants a bilingual mixed layout. Prefer separate language documents or clearly separated sections.

## 7. Color system

Derive colors from the project when possible.

Use semantic roles, not scattered raw values:

```text
light.background
light.surface
light.foreground
light.muted
light.primary
light.accent
light.border
light.focus

dark.background
dark.surface
dark.foreground
dark.muted
dark.primary
dark.accent
dark.border
dark.focus
```

The dark theme is a complete design variant, not a blackened copy of the light theme.

Avoid low-contrast gray text, especially in screenshots, captions, badges, and metadata.

## 8. Images and proof

Proof outranks decoration.

Prefer, in order:

```text
real screenshot / real output
real UI
real artwork
real diagram derived from architecture
real benchmark / measurement
illustration
abstract decoration
```

Never fabricate proof.

When screenshots are used:

- show the useful state, not just an attractive screen;
- crop deliberately;
- preserve enough context to understand what is shown;
- use captions when the screenshot needs interpretation;
- avoid decorative browser chrome unless it contributes context.

## 9. Markdown and HTML safety

Keep searchable information in Markdown:

- installation commands;
- configuration;
- links;
- compatibility;
- API examples;
- limitations;
- contribution instructions;
- security/legal information.

Use HTML only where GitHub rendering materially benefits, such as:

- `<picture>` theme switching;
- centered image groups;
- controlled visual blocks.

Do not convert the README into an image-based poster.

Use repository-relative asset paths where practical.

Use descriptive alt text for informative images. Decorative images should have empty or appropriately minimal alt text.

## 10. Dynamic repository facts

Separate stable design from changing facts.

Facts such as:

```text
version
release status
skill count
supported engine version
build status
compatibility matrix
```

should come from a canonical source when practical.

Do not duplicate a volatile fact in five different sections.

A visual asset should not require redesign when a version or count changes.

## 11. Support / sponsorship writing standard

Support copy must be factual and specific.

Good support copy explains:

```text
what the maintainer is sustaining
what support helps fund
why contribution is optional
where the canonical destination is
```

Avoid guilt-based language, exaggerated promises, or fake urgency.

Preferred information architecture:

```text
## [support icon] Support

A brief statement explaining what financial support helps sustain.

[Support / Sponsor button or link]
```

When the repository already has established support language, preserve its factual meaning while improving presentation.

Do not place a payment address, account identifier, or critical support URL only inside an image.

## 12. Workflow

### Step 1 — Inspect

Read the repository and identify project facts, visual evidence, links, support destination, current README problems, and existing assets.

### Step 2 — Establish the README thesis

Write an internal design brief:

```text
Audience:
Primary job:
One-sentence value:
Primary proof:
First action:
Visual personality:
Dominant composition:
Light palette:
Dark palette:
Typography:
Icon language:
Support destination:
Theme strategy:
```

### Step 3 — Plan the hierarchy

Mark:

```text
primary information
secondary information
reference information
optional detail
```

Move high-value information upward.

### Step 4 — Plan assets

Only create assets that are actually used.

Typical structure:

```text
assets/readme/
├── hero.svg
├── hero-dark.svg
├── support-cta.svg
├── support-cta-dark.svg
└── icons/
    ├── documentation.svg
    ├── installation.svg
    ├── support.svg
    └── ...
```

Do not generate an asset library for decoration alone.

### Step 5 — Write the copy

Use concrete nouns and verbs. Prefer:

```text
problem → capability → consequence
```

over:

```text
adjective → adjective → adjective
```

Avoid filler such as “powerful”, “next-generation”, “seamless”, or “revolutionary” unless the repository can substantiate the claim.

### Step 6 — Implement

Wire every used asset, link, heading icon, support destination, and theme variant into the final README.

### Step 7 — Audit

Perform the quality protocol below before declaring completion.

## 13. Visual QA protocol

Review the rendered README at realistic GitHub widths.

Check:

### First screen

- project identity is immediate;
- primary value is understandable;
- primary next action is obvious;
- no decorative block pushes essential context below the fold.

### Hierarchy

- headings are scannable;
- important links are easy to find;
- typography has clear levels;
- visual landmarks are meaningful;
- repeated components do not dominate the page.

### Light/dark

- all authored visuals remain legible;
- icons do not disappear;
- screenshots do not acquire broken borders;
- dark surfaces do not become muddy;
- theme variants preserve meaning.

### Responsive / narrow width

- no accidental horizontal overflow;
- tables remain usable or have an appropriate alternative;
- large images scale correctly;
- headings wrap gracefully;
- code blocks remain readable;
- centered layouts do not collapse awkwardly.

### Accessibility

- informative images have alt text;
- decorative images are not announced as meaningful content;
- links identify their destination;
- heading hierarchy is logical;
- color is not the only communication channel.

### Trust / maintenance

- every major claim is supported by repository evidence;
- links point to the correct destinations;
- support URL is preserved and visible when it exists;
- versions and counts are not stale duplicates;
- generated assets are actually referenced.

## 14. Audit severity

Classify findings:

```text
BLOCKER  → wrong information, broken destination, unreadable theme, missing required support destination
HIGH     → broken hierarchy, misleading proof, major responsive failure, serious accessibility issue
MEDIUM   → visual inconsistency, weak copy, token drift, excessive decoration
LOW      → isolated polish issue
```

Fix systemic and trust failures before visual polish.

## 15. Anti-pattern filter

Reject or reconsider:

- generic purple-gradient SaaS styling unrelated to the project;
- a Hero that says only the project name and adjectives;
- fake statistics or invented screenshots;
- support information removed during redesign;
- generic donation banner copied across repositories;
- dark mode that is merely `filter: brightness(...)` or black backgrounds everywhere;
- unreadable heading icons on one theme;
- giant SVG posters replacing searchable documentation;
- repeated emoji as pseudo-iconography;
- every section wrapped in the same rounded card;
- links whose destination semantics are unclear;
- stale version numbers repeated in multiple places.

## 16. Done standard

The README is done when:

- the project can be understood quickly;
- the first action is obvious;
- proof is real and useful;
- the visual system clearly belongs to the project;
- support/sponsorship is preserved whenever a canonical destination exists;
- light and dark rendering are both intentional;
- links and facts are correct;
- the page remains usable at narrow widths;
- Markdown remains searchable and maintainable;
- additional decoration would be more likely to reduce clarity than improve it.

## Provenance

This Skill is informed by public methodologies and documentation from:

- Anthropic `frontend-design`: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- `better-web-ui`: https://github.com/aladicf/better-web-ui
- `ui-ux-pro-max`: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- UI Skills catalog: https://www.ui-skills.com/skills
- README-focused practices already present in AzSkills

AzSkills uses the transferable design and documentation principles rather than copying upstream Skill text, databases, or repository-specific assets.
