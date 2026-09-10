---
name: readme-craft
description: Design, rewrite, audit, and maintain project-native GitHub README homepages with evidence-first information architecture, mandatory support/funding delivery, default English output, explicit language locking, mandatory project-native support CTA, semantic SVG heading icons, mandatory SVG geometry and render QA, light/dark theme safety, accessible proof, stable action links, dynamic repository facts, and GitHub-safe Markdown/SVG implementation.
---

# README Craft

Treat a GitHub README as a product interface and trust surface, not as a text dump. The job is to make the repository understandable, credible, visually distinctive, actionable, maintainable, and faithful to the project's actual identity.

This Skill is an AzSkills synthesis informed by public frontend-design, README-design, accessibility, documentation, and visual-quality practices. It is not a copy or vendor package.

## 1. Automatic scope

Apply this Skill to:

- new README creation;
- full README rewrites;
- visual redesigns or refreshes;
- documentation homepages;
- project landing pages in `README.md`;
- README audits and cleanup;
- hero/banner, section graphics, diagrams, icons, showcase modules, or support CTA work that will appear in a README.

Use the narrowest mode that fully solves the request:

| Mode | Responsibility |
| :--- | :--- |
| `audit` | Diagnose structure, copy, language, trust, links, support/funding, theme behavior, accessibility, visual hierarchy, SVG quality, and maintainability without editing |
| `whole-readme` | Redesign information architecture, copy, language, visual system, assets, links, support treatment, and theme behavior |
| `visual-refresh` | Preserve useful information architecture while improving visual direction, assets, hierarchy, support treatment, language consistency, and theme safety |
| `asset-only` | Create or revise only explicitly requested README assets, including full SVG QA when the asset is SVG |
| `maintenance` | Update existing README facts, links, screenshots, versions, support destinations, language consistency, or sections without unnecessary redesign |

Never turn `asset-only` or `maintenance` into a full rewrite unless the user explicitly requests it or the existing artifact cannot remain correct without structural change.

## 2. Decision precedence

Resolve conflicts in this order:

1. Explicit user requirements.
2. Explicit output-language instruction.
3. Repository facts and existing project conventions.
4. README-specific hard constraints in this Skill.
5. `design-intelligence.md`.
6. Optional external references and stylistic inspiration.

Do not replace an established project identity merely because another visual style is fashionable.

## 3. Language lock — mandatory

### 3.1 Default language is English

**README Craft defaults to English output.**

When the user does not explicitly request another language, the README copy, headings, tables, labels, CTA text, navigation, authored alt text, and authored visual text must be written in **English**.

Do not infer Chinese, Japanese, or another language from:

- the maintainer's identity;
- the repository owner;
- the source code language;
- the language of an existing README;
- comments or issue titles;
- source assets;
- the language used in a user message when the user did not request that language for the README.

Technical identifiers, official product names, trademarks, commands, filenames, package names, API symbols, and unchanged UI literals may remain in their original form when needed for factual accuracy.

### 3.2 Explicit language requests override the default

Use this decision table:

| User instruction | Output language |
| :--- | :--- |
| No language specified | **English** |
| `English`, `英文`, `English only`, or equivalent | **English only** |
| `Chinese`, `中文`, or equivalent | **Chinese only** |
| Explicitly requests multiple languages | Exactly those requested languages |

Never add a second language merely because the repository contains bilingual material.

### 3.3 English-only means English-only

When English output is selected, no unsolicited Chinese prose may appear in the final README or authored visual assets.

This prohibition applies to:

```text
headings
body copy
tables
captions
navigation labels
CTA labels
button labels
image alt text
figure descriptions
SVG visible text
SVG title / desc / metadata
HTML aria-labels
HTML titles
HTML comments
support copy
release labels
authored badge labels
```

Do not copy Chinese explanatory text from the repository into an English README. Keep Chinese only when it is an approved proper name, official literal, trademark, or another string that must remain unchanged.

The same rule applies symmetrically to Chinese-only output.

### 3.4 Source-language inheritance is not permission to mix languages

Repository content is evidence, not an instruction to reproduce every source language.

For a single-language README:

```text
source content
    ↓
extract facts
    ↓
rewrite into target language
    ↓
retain only required names / literals
    ↓
run language audit
```

Do not alternate languages paragraph-by-paragraph unless explicitly requested.

### 3.5 Language audit is a hard gate

Before delivery, scan the rendered README and all authored visual assets against the language contract.

For English-only output, unexpected Chinese prose or labels are a **BLOCKER**.

For Chinese-only output, unexpected English prose outside approved names, literals, code, URLs, commands, and technical identifiers is a **BLOCKER**.

For bilingual output, verify the requested language boundaries section-by-section and asset-by-asset.

## 4. Non-negotiable quality gates

A whole README redesign is incomplete until all applicable gates pass. A visual asset is incomplete until its own asset QA gates pass. A single-language README is incomplete until its language audit passes.

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
funding metadata
license / contribution information
light/dark visual behavior
existing documentation language(s)
```

Do not invent:

- features;
- benchmarks;
- user counts;
- testimonials;
- screenshots;
- compatibility;
- deployment URLs;
- support links;
- payment identifiers;
- version claims.

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
support visual strategy
```

Make at least three deliberate choices that clearly come from the project rather than from a generic template, such as:

- project-specific color relationships;
- real product imagery or artwork;
- project-derived geometric motif;
- custom semantic icon treatment;
- distinctive composition;
- project-specific typographic pairing;
- domain-specific visual metaphor.

A README can be restrained, but it must still have a point of view.

### Gate D — Heading icon system

**Every level-2 (`##`) heading must have a semantic repository-local SVG icon.** This is mandatory for `whole-readme`, `visual-refresh`, and any README presentation work that leaves level-2 headings in place.

For level-3 (`###`) and deeper headings, use a semantic SVG icon whenever it improves scanability without creating visual noise. Prefer coverage over omission, but do not force a weak or meaningless icon solely to satisfy decoration.

Rules:

- every `##` heading must have exactly one semantic SVG icon immediately before the heading text;
- `###` and deeper headings should have SVG icons whenever a meaningful icon can be designed without repetition or ambiguity;
- use repository-local assets, normally under `assets/readme/icons/`;
- use project-owned or project-derived icons before generic library icons;
- preserve a coherent stroke/fill vocabulary and icon scale;
- never use emoji as a substitute for a required heading SVG;
- never rely on SVG `currentColor` inheritance for Markdown/HTML `<img>` icons;
- every heading icon must pass the SVG source, geometry, size, render, and theme QA defined below;
- if an icon cannot be made both semantic and visually correct, redesign the icon rather than silently omitting the required level-2 icon.

Do not add SVG icons to ordinary paragraphs, code blocks, or arbitrary whitespace merely for decoration.

### Gate E — Mandatory support / sponsorship discovery and delivery

For `whole-readme`, `visual-refresh`, and any maintenance or asset task that changes README presentation, support/funding must be actively investigated and handled as a required deliverable whenever a verified support destination exists.

Inspect:

```text
README links
repository About / homepage
FUNDING.yml / funding metadata
GitHub Sponsors configuration when visible
maintainer-owned support pages
project donation/payment pages
existing Support / Sponsor / Funding sections
release or documentation pages that point to support
```

When a verified support destination exists:

```text
Support treatment is REQUIRED
        ↓
1. preserve / correct the canonical destination
2. create or retain a dedicated Support / Sponsor / Funding section
3. explain what support sustains
4. provide a visible direct link
5. create and place a project-native Support CTA
6. keep the URL in searchable Markdown/HTML outside the graphic
```

A verified support destination without meaningful support treatment is a **BLOCKER**.

### Gate F — Project-native support CTA

When a verified support destination exists, a project-native Support CTA is **mandatory**.

The CTA must:

- be visible in the rendered README;
- be clearly recognizable as a support action;
- be clickable;
- link directly to the verified canonical support destination;
- use project-specific visual signals rather than a generic donation banner;
- remain understandable in both GitHub light and dark themes;
- pass the same geometry, rendering, accessibility, language, and theme checks as every other authored SVG.

Use at least two real project signals:

```text
logo / icon / mascot
real screenshot / UI / output
project palette
project geometry
project typography treatment
domain-specific imagery
```

Do not satisfy the CTA requirement with:

```text
text-only support link
GitHub Sponsor badge alone
generic heart / coffee / donation graphic with no project identity
unlinked CTA graphic
CTA whose destination differs from the canonical support URL
```

Keep the canonical URL as actual Markdown/HTML link text outside the image as well.

When no support destination can be verified:

- do not invent one;
- do not fabricate a payment address, username, QR code, or donation service;
- do not imply that a funding channel exists;
- record the absence during the internal audit.

### Gate G — SVG asset quality and render QA

**An SVG is not finished because its source looks plausible. It must be rendered and visually inspected before delivery.**

This gate applies to heroes, heading icons, support CTAs, diagrams, workflow graphics, logos, and other authored SVGs.

#### G1 — Source integrity

Verify:

```text
valid XML / SVG structure
correct viewBox
no accidental clipping
no unused giant canvas
no malformed path data
no unintended filters or effects
no embedded raster unless explicitly required
no broken references
```

Prefer simple, inspectable SVGs. Remove construction artifacts and unused definitions before delivery.

#### G2 — Geometry QA

Check the actual rendered geometry, not just source coordinates.

Inspect:

```text
overlap between independent elements
consistent internal spacing
optical center vs mathematical center
symmetry where intended
stroke width consistency
stroke cap / join consistency
corner-radius consistency
safe padding to the viewBox edges
baseline / alignment when text or labels are present
```

A visual is **BLOCKED** when:

- separate elements touch unintentionally;
- a centered symbol is visibly off-center inside its frame;
- strokes collide at small sizes;
- a decorative element appears attached when it should be separate;
- the viewBox clips a stroke, shadow, corner, or letter;
- padding is materially unbalanced without a deliberate optical reason.

### G3 — Multi-size QA

Render important SVGs at realistic sizes:

```text
16 px / favicon-scale icon
20–24 px / README heading icon
32–48 px / compact icon
64–128 px / extension or product icon when applicable
320 px / narrow README visual
768–900 px / normal README visual
1200 px / hero or wide CTA when applicable
```

At each size check:

- readability;
- collisions;
- stroke disappearance;
- tiny gaps collapsing;
- text wrapping or illegibility;
- visual centering;
- silhouette recognition.

### G4 — Light / dark rendering QA

Every authored SVG must be evaluated against GitHub light and dark contexts.

Use one of:

1. theme-neutral artwork with sufficient contrast in both contexts;
2. a tested `prefers-color-scheme` SVG implementation;
3. explicit light/dark variants selected with `<picture>`.

When an SVG is embedded with `<img>`, do not assume `currentColor` inherits the surrounding heading color. Use explicit colors or a tested theme-aware implementation.

Check:

```text
foreground contrast
accent contrast
border visibility
icon silhouette
surface separation
small details
hierarchy
project identity
```

A dark-mode asset that merely remains visible but loses hierarchy, detail, or identity does not pass.

### G5 — Rendered screenshot inspection

Before delivery, inspect an actual rendered preview of every non-trivial SVG.

For composite assets such as heroes and support CTAs, inspect:

```text
unintended overlaps
off-center groups
crowded text
unbalanced whitespace
misaligned buttons or frames
weak visual hierarchy
theme-specific artifacts
language-specific text errors
```

For simple icons, inspect the rasterized result at 16–48 px and at the actual README display size.

If the first render reveals a defect, revise the geometry and render again. Do not ship a known imperfect first pass merely because the SVG is technically valid.

### Gate H — Light/dark README theme safety

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

Do not assume an SVG inherits GitHub's surrounding text color.

### Gate I — Link correctness

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

## 5. Information architecture

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

Do not duplicate an entire manual. Use the README as an entry point and route readers to authoritative documents.

## 6. Composition rules

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

## 7. Typography

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
- bilingual expansion only when explicitly requested;
- code readability.

Do not shrink body type simply to fit more content.

For multilingual output, keep language boundaries structurally explicit and follow the language contract exactly.

## 8. Color system

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

## 9. Images and proof

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

## 10. Markdown and HTML safety

Keep searchable information in Markdown:

- installation commands;
- configuration;
- links;
- compatibility;
- API examples;
- limitations;
- contribution instructions;
- security/legal information;
- direct support URLs.

Use HTML only where GitHub rendering materially benefits, such as:

- `<picture>` theme switching;
- centered image groups;
- controlled visual blocks;
- clickable image CTAs.

Do not convert the README into an image-based poster.

Use repository-relative asset paths where practical.

Use descriptive alt text for informative images. Decorative images should have empty or appropriately minimal alt text.

Never put a critical support URL, payment identifier, or installation instruction only inside an image.

## 11. Dynamic repository facts

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

## 12. Support / sponsorship writing standard

Support copy must be factual and specific.

When a verified support destination exists, the following output is mandatory:

```text
Support / Sponsor / Funding section
↓
short factual explanation
↓
direct canonical Markdown/HTML link
↓
visible clickable project-native Support CTA
```

The CTA is mandatory whenever the destination exists; it is not optional even when the README already contains a text link or badge.

Avoid guilt-based language, exaggerated promises, or fake urgency.

When the repository already has established support language, preserve its factual meaning while translating it into the locked target language when required.

## 13. Workflow

### Step 1 — Inspect

Read the repository and identify project facts, visual evidence, links, support destination, funding metadata, current README problems, existing assets, theme behavior, and existing documentation language(s).

### Step 2 — Lock the output language

Write an internal language contract before drafting:

```text
Target language: English by default
Allowed secondary language(s): none unless explicitly requested
Approved proper names / literals:
Bilingual structure requested?: no unless explicitly requested
```

Do not continue to final copy until the language contract is fixed.

### Step 3 — Establish the README thesis

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
Support CTA concept:
Theme strategy:
```

### Step 4 — Plan the hierarchy

Mark:

```text
primary information
secondary information
reference information
optional detail
```

Move high-value information upward.

### Step 5 — Plan heading icons

Before writing the final README, inventory all headings.

Required:

```text
H2 → SVG icon required
H3+ → SVG icon preferred when meaningful
```

Build or reuse a coherent semantic icon set. Every icon must pass SVG QA and theme QA before integration.

Do not finish the README with any level-2 heading lacking an icon.

### Step 6 — Plan assets

Only create assets that are actually used.

Typical structure:

```text
assets/readme/
├── hero-light.svg
├── hero-dark.svg
├── support-cta.svg
├── support-cta-light.svg
├── support-cta-dark.svg
└── icons/
    ├── documentation.svg
    ├── installation.svg
    ├── support.svg
    └── ...
```

Every authored visual must use the locked language unless the text is an approved proper name or literal.

If a verified support destination exists, a project-native Support CTA must be planned here and must not be skipped later for convenience.

Select the simplest theme strategy that remains reliable in GitHub rendering.

### Step 7 — Write the copy

Use concrete nouns and verbs. Prefer:

```text
problem → capability → consequence
```

over:

```text
adjective → adjective → adjective
```

Avoid filler such as “powerful”, “next-generation”, “seamless”, or “revolutionary” unless the repository can substantiate the claim.

Keep every authored sentence inside the language contract.

### Step 8 — Implement

Wire every used asset, link, heading icon, support destination, support CTA, and theme variant into the final README.

For heading icons and other `<img>` SVGs:

- do not rely on inherited `currentColor`;
- verify the chosen theme mechanism actually renders in GitHub;
- keep the visual language consistent across all icons;
- ensure every H2 has exactly one icon;
- ensure the icon remains semantically meaningful at the actual display size.

### Step 9 — Render and QA assets

Before declaring the README complete:

```text
render SVGs
↓
inspect geometry
↓
inspect native / small / wide sizes
↓
inspect light mode
↓
inspect dark mode
↓
inspect authored SVG text language
↓
inspect CTA link target
↓
fix defects
↓
render again
```

Never skip directly from “SVG source looks correct” to “done”.

### Step 10 — Audit

Perform the quality protocol below before declaring completion.

## 14. Visual QA protocol

Review the rendered README at realistic GitHub widths and inspect authored visuals at their real display sizes.

### First screen

- project identity is immediate;
- primary value is understandable;
- primary next action is obvious;
- no decorative block pushes essential context below the fold.

### Language

- the final output matches the locked language exactly;
- English is the default when no other language is explicitly requested;
- no unsolicited Chinese appears in an English-only README;
- no unsolicited English prose appears in a Chinese-only README;
- bilingual structure is used only when requested;
- proper names and technical literals are not incorrectly translated.

### Heading icons

- every H2 has exactly one semantic SVG icon;
- H3+ headings use SVG icons whenever a meaningful icon can be provided without noise;
- icons are repository-local;
- icons are visually coherent as one family;
- no heading icon relies on untested `currentColor` inheritance;
- every icon passes geometry, size, render, and theme QA.

### Hierarchy

- headings are scannable;
- important links are easy to find;
- typography has clear levels;
- visual landmarks are meaningful;
- repeated components do not dominate the page.

### Support

- a verified support destination is present when one exists;
- the Support / Sponsor / Funding section exists when required;
- the project-native Support CTA exists when required;
- the CTA is visible and clickable;
- the CTA points to the canonical support destination;
- the CTA remains legible in both themes;
- the canonical support URL remains visible as searchable text outside the graphic.

### SVG geometry

For every non-trivial SVG:

- no unintended overlaps;
- intended groups are optically centered;
- internal symbols are centered within their frames when appropriate;
- padding is balanced;
- strokes and joins are consistent;
- nothing is clipped;
- no tiny details collapse at the actual display size;
- there are no unexplained asymmetries.

For composite heroes / CTAs, additionally check:

- text block alignment;
- image/frame alignment;
- spacing between visual groups;
- button alignment;
- negative-space balance.

### Light/dark

- every authored visual remains legible;
- icons do not disappear;
- support CTA remains readable;
- screenshots do not acquire broken borders;
- dark surfaces do not become muddy;
- theme variants preserve meaning and hierarchy.

### Responsive / narrow width

- no accidental horizontal overflow;
- tables remain usable or have an appropriate alternative;
- large images scale correctly;
- headings wrap gracefully;
- code blocks remain readable;
- centered layouts do not collapse awkwardly;
- SVGs preserve their intended visual center when reduced.

### Accessibility

- informative images have alt text;
- decorative images are not announced as meaningful content;
- links identify their destination;
- heading hierarchy is logical;
- color is not the only communication channel;
- support links remain readable as text outside graphics;
- authored visual metadata follows the target language unless a proper name or literal is required.

### Trust / maintenance

- every major claim is supported by repository evidence;
- links point to the correct destinations;
- the verified support URL is present when one exists;
- the required Support / Sponsor / Funding section exists when applicable;
- the required project-native CTA exists when applicable;
- versions and counts are not stale duplicates;
- generated assets are actually referenced;
- assets do not need manual repair after routine repository fact changes.

## 15. Audit severity

Classify findings:

```text
BLOCKER  → wrong information, broken destination, missing required support treatment, missing required H2 icon, language-lock violation, unreadable theme, broken SVG, unintended overlap, clipping, materially off-center primary element, missing/unlinked required CTA
HIGH     → broken hierarchy, misleading proof, major responsive failure, serious accessibility issue, poor dark-mode hierarchy, SVG defects at actual display size, unsolicited language mixing, weak heading icon coverage below H2
MEDIUM   → visual inconsistency, weak copy, token drift, excessive decoration, minor optical imbalance
LOW      → isolated polish issue
```

Fix systemic, language, support, heading-icon, and trust failures before visual polish.

## 16. Anti-pattern filter

Reject or reconsider:

- generic purple-gradient SaaS styling unrelated to the project;
- a Hero that says only the project name and adjectives;
- fake statistics or invented screenshots;
- support information removed during redesign;
- a verified support destination omitted because “README does not need sponsorship”;
- a verified support destination without a visible clickable project-native CTA;
- generic donation banner copied across repositories;
- defaulting to Chinese when the user did not request Chinese;
- unsolicited Chinese in an English-only README;
- unsolicited English prose in a Chinese-only README;
- bilingual prose added merely because the repository itself is bilingual;
- H2 headings without semantic SVG icons;
- excessive H3+ icons that make hierarchy noisy;
- heading icons that disappear or lose hierarchy in dark mode;
- dark mode that is merely `filter: brightness(...)` or black backgrounds everywhere;
- SVGs approved only from source inspection without a rendered preview;
- SVGs whose mathematical center is correct but whose optical center is visibly wrong;
- currentColor-dependent `<img>` SVGs that have not been explicitly tested in GitHub;
- tiny SVG gaps that collapse at 16–24 px;
- accidental stroke collisions or clipped viewBox edges;
- giant SVG posters replacing searchable documentation;
- repeated emoji as pseudo-iconography;
- every section wrapped in the same rounded card;
- links whose destination semantics are unclear;
- stale version numbers repeated in multiple places.

## 17. Done standard

The README is done only when:

- the project can be understood quickly;
- the first action is obvious;
- proof is real and useful;
- the visual system clearly belongs to the project;
- the output language is explicitly locked, with **English as the default**;
- no unsolicited language mixing remains;
- every H2 has exactly one semantic repository-local SVG icon;
- H3+ headings use icons wherever meaningful and useful;
- support/funding discovery has been explicitly completed;
- the verified support destination is preserved and meaningfully presented when one exists;
- the Support / Sponsor / Funding section is present when required;
- the required project-native Support CTA is visible, clickable, canonical, and visually correct;
- all authored SVGs have passed geometry, size, render, and theme QA;
- light and dark rendering are both intentional;
- heading icons work in GitHub's actual image-rendering context;
- links and facts are correct;
- the page remains usable at narrow widths;
- Markdown remains searchable and maintainable;
- additional decoration would be more likely to reduce clarity than improve it.

## Provenance

This Skill is informed by public methodologies and documentation from:

- Anthropic `frontend-design`
- `better-web-ui`
- `ui-ux-pro-max`
- UI Skills catalog
- README-focused practices already present in AzSkills

AzSkills uses transferable design and documentation principles rather than copying upstream Skill text, databases, or repository-specific assets.
