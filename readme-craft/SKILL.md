---
name: readme-craft
description: Design, rewrite, audit, and maintain project-native GitHub README homepages with evidence-first information architecture, mandatory support/funding delivery, default English output, explicit language locking, semantic SVG heading icons, mandatory SVG geometry and render QA, light/dark theme safety, accessible proof, stable internal navigation anchors, verified action links, dynamic repository facts, and GitHub-safe Markdown/SVG implementation.
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
- hero/banner, section graphics, diagrams, icons, showcase modules, support CTA, or in-page navigation work that will appear in a README.

Use the narrowest mode that fully solves the request:

| Mode | Responsibility |
| :--- | :--- |
| `audit` | Diagnose structure, copy, language, trust, links, navigation, support/funding, theme behavior, accessibility, visual hierarchy, SVG quality, and maintainability without editing |
| `whole-readme` | Redesign information architecture, copy, language, visual system, assets, links, navigation, support treatment, and theme behavior |
| `visual-refresh` | Preserve useful information architecture while improving visual direction, assets, hierarchy, navigation, support treatment, language consistency, and theme safety |
| `asset-only` | Create or revise only explicitly requested README assets, including full SVG QA when the asset is SVG |
| `maintenance` | Update existing README facts, links, screenshots, versions, navigation targets, support destinations, language consistency, or sections without unnecessary redesign |

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

Do not infer Chinese, Japanese, or another language from the maintainer, repository owner, source code, existing README, comments, issue titles, source assets, or the language used in the user message unless the README language was explicitly requested.

Technical identifiers, official product names, trademarks, commands, filenames, package names, API symbols, and unchanged UI literals may remain in their original form when needed for factual accuracy.

### 3.2 Explicit language requests override the default

| User instruction | Output language |
| :--- | :--- |
| No language specified | **English** |
| `English`, `英文`, `English only`, or equivalent | **English only** |
| `Chinese`, `中文`, or equivalent | **Chinese only** |
| Explicitly requests multiple languages | Exactly those requested languages |

Never add a second language merely because the repository contains bilingual material.

### 3.3 English-only means English-only

When English output is selected, no unsolicited Chinese prose may appear in the final README or authored visual assets.

This prohibition includes:

```text
headings
body copy
tables
captions
navigation labels
CTA labels
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

Keep Chinese only when it is an approved proper name, official literal, trademark, or another string that must remain unchanged. Apply the same rule symmetrically to Chinese-only output.

### 3.4 Language audit

Before delivery, scan the rendered README and all authored visual assets against the language contract.

For English-only output, unexpected Chinese prose or labels are a **BLOCKER**. For Chinese-only output, unexpected English prose outside approved names, literals, code, URLs, commands, and technical identifiers is a **BLOCKER**.

## 4. Non-negotiable quality gates

A whole README redesign is incomplete until all applicable gates pass. A visual asset is incomplete until its asset QA passes. A README with manual in-page navigation is incomplete until its navigation QA passes.

### Gate A — Evidence-first repository understanding

Inspect the actual repository before writing final structure or copy.

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

Do not invent features, benchmarks, user counts, testimonials, screenshots, compatibility, deployment URLs, support links, payment identifiers, or version claims.

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

The exact order may change for developer tools, libraries, games, visual assets, and other domains, but the first screen must have one obvious primary job.

### Gate C — Distinctive visual direction

Do not produce a generic AI-generated SaaS README.

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

Make at least three deliberate choices that clearly come from the project, such as project-specific color relationships, real product imagery, a project-derived geometric motif, custom semantic icons, distinctive composition, project-specific typography, or a domain-specific visual metaphor.

### Gate D — Heading icon system

**Every level-2 (`##`) heading must have exactly one semantic repository-local SVG icon.**

For level-3 (`###`) and deeper headings, use a semantic SVG icon whenever it improves scanability without creating visual noise.

Rules:

- every `##` heading has exactly one SVG icon immediately before the heading text;
- `###` and deeper headings use SVG icons when meaningful and useful;
- use repository-local assets, normally under `assets/readme/icons/`;
- prefer project-owned or project-derived icons over generic library icons;
- preserve one coherent stroke/fill vocabulary and icon scale;
- never use emoji as a substitute for a required heading icon;
- never rely on SVG `currentColor` inheritance for Markdown/HTML `<img>` icons;
- every heading icon must pass source, geometry, size, render, and theme QA;
- if an icon cannot be both semantic and visually correct, redesign it rather than omitting a required H2 icon.

Do not place SVG icons in arbitrary paragraphs or whitespace merely for decoration.

### Gate E — Mandatory support / sponsorship discovery and delivery

For `whole-readme`, `visual-refresh`, and presentation-changing maintenance or asset work, support/funding must be actively investigated whenever a verified support destination exists.

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
1. preserve / correct the canonical destination
2. create or retain a dedicated Support / Sponsor / Funding section
3. explain what support sustains
4. provide a visible direct link
5. create and place a project-native Support CTA
6. keep the URL in searchable Markdown/HTML outside the graphic
```

Missing required support treatment is a **BLOCKER**.

### Gate F — Project-native support CTA

When a verified support destination exists, a project-native Support CTA is mandatory.

The CTA must be visible, clearly recognizable, clickable, directly linked to the verified canonical destination, project-specific, readable in both GitHub light and dark themes, and pass the same geometry/render/accessibility/language/theme QA as other authored SVGs.

Use at least two real project signals:

```text
logo / icon / mascot
real screenshot / UI / output
project palette
project geometry
project typography treatment
domain-specific imagery
```

A text-only support link, GitHub Sponsor badge alone, generic donation graphic, unlinked graphic, or CTA with the wrong destination does not satisfy this gate.

### Gate G — SVG asset quality and render QA

**An SVG is not finished because its source looks plausible. It must be rendered and visually inspected before delivery.**

#### G1 — Source integrity

Verify valid XML/SVG structure, correct `viewBox`, no accidental clipping, no oversized unused canvas, no malformed path data, no unintended effects, no embedded raster unless required, and no broken references.

#### G2 — Geometry QA

Inspect the rendered result for:

```text
overlap between independent elements
consistent internal spacing
optical center vs mathematical center
symmetry where intended
stroke width consistency
stroke cap / join consistency
corner-radius consistency
safe padding to the viewBox edges
text / label alignment
```

Block delivery when independent elements touch unintentionally, a centered symbol is visibly off-center, strokes collide, a decorative element looks attached when it should be separate, the viewBox clips artwork, or padding is materially unbalanced without a deliberate optical reason.

#### G3 — Multi-size QA

Render important SVGs at realistic sizes:

```text
16 px
20–24 px
32–48 px
64–128 px
320 px
768–900 px
1200 px when applicable
```

Check readability, collisions, disappearing strokes, collapsing gaps, text legibility, visual centering, and silhouette recognition.

#### G4 — Light / dark rendering QA

Evaluate every authored SVG against GitHub light and dark contexts. Use theme-neutral artwork, a tested `prefers-color-scheme` SVG, or explicit light/dark variants selected with `<picture>`.

When an SVG is embedded with `<img>`, do not assume `currentColor` inherits from surrounding Markdown. Use explicit colors or a tested theme mechanism.

#### G5 — Rendered screenshot inspection

Inspect actual rendered previews of non-trivial SVGs. For heroes and support CTAs, verify overlap, centering, text placement, whitespace balance, button/frame alignment, hierarchy, theme artifacts, and language errors. Fix defects and render again.

### Gate H — Light/dark README theme safety

Every README visual must be evaluated against GitHub light and dark backgrounds. The dark theme is a complete visual variant, not a blackened copy of the light theme.

### Gate I — Link correctness

Inventory all important destinations:

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

Keep destination semantics distinct and never replace an explicit destination with a guessed one.

### Gate J — In-page navigation correctness

**Manual README navigation must use stable, explicit anchors. Do not guess GitHub's automatically generated heading slugs when the README contains authored navigation.**

This gate exists because GitHub auto-generates heading anchors from rendered heading content, and those anchors can change when heading text or markup changes. GitHub also supports explicit custom anchors using `<a name="..."></a>`. citeturn320066search0

#### J1 — Stable anchor rule

Every manually authored internal navigation target must use an explicit custom anchor with a stable ASCII identifier:

```html
<a name="readme-overview"></a>
## <img src="assets/readme/icons/overview.svg" width="22" height="22" alt=""> Overview
```

Use `name`, not a guessed heading slug. Keep the anchor on its own line immediately before the target heading.

Recommended naming pattern:

```text
readme-overview
readme-features
readme-installation
readme-architecture
readme-development
readme-support
```

Do not put the custom anchor inside the heading, inside the icon, or inside a link.

#### J2 — Navigation link rule

Every in-page navigation link must point exactly to an existing custom anchor:

```markdown
[Overview](#readme-overview)
[Installation](#readme-installation)
```

Do not use forms such as:

```markdown
[Overview](#overview)
[Overview](#<guessed-github-slug>)
```

unless the link is backed by a separately verified explicit anchor with that exact name.

#### J3 — Coverage rule

For every manually authored internal `href="#..."` or Markdown link target `(#...)`:

```text
navigation target
      ↓
exact matching <a name="..."></a>
      ↓
exact target heading immediately follows
```

Every explicit anchor intended as a navigation target must be used by at least one internal link, unless it is intentionally a non-navigation utility anchor and documented as such.

#### J4 — Duplicate and collision rule

No two custom anchors may share the same `name` value. Do not reuse a generic fragment name across unrelated sections.

#### J5 — HTML safety rule

Use GitHub-supported custom anchors in the form:

```html
<a name="unique-anchor-name"></a>
```

GitHub documents custom anchors as a supported way to link directly to arbitrary points in a Markdown document. Custom anchors do not appear in GitHub's automatic document outline, which is acceptable: the README's headings remain the semantic outline while the anchors provide stable manual navigation targets. citeturn320066search0

#### J6 — Navigation QA is mandatory

Before delivery, perform an explicit audit:

```text
extract all Markdown internal links: (#...)
extract all HTML internal links: href="#..."
extract all custom anchors: <a name="..."></a>
normalize and compare exact identifiers
verify each navigation target is present
verify each target precedes the intended heading
verify no duplicate anchor names
verify there are no dead / guessed fragments
```

A missing target, typo, guessed GitHub slug, duplicate anchor, or navigation link that lands on the README root is a **BLOCKER**.

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

### Existing strong docs

Do not duplicate an entire manual. Use the README as an entry point and route readers to authoritative documents.

## 6. Composition rules

Start with composition, not with cards.

Useful README compositions include integrated hero, artifact-led hero, split editorial hero, before/after, system map, annotated specimen, sequence strip, feature matrix, or quiet documentation.

Cards, pills, badges, and repeated rounded containers are optional components, not the default layout.

Avoid identical card grids for every feature, excessive rounded panels, decorative gradients without a semantic job, arbitrary glassmorphism, giant empty banners, and repetition with no change in meaning.

## 7. Typography

Use typography as information architecture. Define roles for display, heading, body, utility, numeric, and code text.

Protect line length, line height, contrast, wrapping, heading scale, and code readability. Do not shrink body type simply to fit more content.

For multilingual output, keep language boundaries structurally explicit and follow the language contract exactly.

## 8. Color system

Derive colors from the project when possible and use semantic roles:

```text
light.background / surface / foreground / muted / primary / accent / border / focus
dark.background / surface / foreground / muted / primary / accent / border / focus
```

Avoid low-contrast gray text, especially in screenshots, captions, badges, and metadata.

## 9. Images and proof

Proof outranks decoration. Prefer:

```text
real screenshot / real output
real UI
real artwork
real diagram derived from architecture
real benchmark / measurement
illustration
abstract decoration
```

Never fabricate proof. Screenshots should show useful states, preserve enough context, use deliberate crops, and receive captions when interpretation is needed.

## 10. Markdown and HTML safety

Keep searchable information in Markdown or normal HTML text:

- installation commands;
- configuration;
- links;
- compatibility;
- API examples;
- limitations;
- contribution instructions;
- security/legal information;
- direct support URLs;
- in-page navigation targets and links.

Use HTML only where GitHub rendering materially benefits, such as `<picture>`, centered visual groups, controlled visual blocks, clickable image CTAs, and explicit custom anchors.

Do not convert the README into an image-based poster. Never put a critical support URL, payment identifier, installation instruction, or navigation target only inside an image.

## 11. Dynamic repository facts

Separate stable design from changing facts. Version, release status, counts, compatibility, and build facts should come from canonical sources when practical.

Do not duplicate volatile facts across many locations. A visual asset should not require redesign when a version or count changes.

## 12. Support / sponsorship writing standard

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

Avoid guilt-based language, exaggerated promises, or fake urgency. When no support destination can be verified, do not invent one.

## 13. Workflow

### Step 1 — Inspect

Read the repository and identify project facts, visual evidence, links, support destination, funding metadata, current README problems, existing assets, theme behavior, navigation structure, and documentation language(s).

### Step 2 — Lock the output language

Write an internal language contract:

```text
Target language: English by default
Allowed secondary language(s): none unless explicitly requested
Approved proper names / literals:
Bilingual structure requested?: no unless explicitly requested
```

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
Navigation strategy:
```

### Step 4 — Plan the hierarchy

Mark primary information, secondary information, reference information, and optional detail. Move high-value information upward.

### Step 5 — Plan headings and stable anchors

Inventory all headings.

Required:

```text
H2 → exactly one semantic SVG icon
H3+ → SVG icon when meaningful
```

For every section that will be targeted by manual navigation, assign a stable custom anchor before drafting the final README:

```text
section name → stable ASCII anchor
Overview     → readme-overview
Features     → readme-features
Install      → readme-installation
```

Do not invent navigation links from guessed heading slugs.

### Step 6 — Plan manual navigation

When a README contains a hand-authored table of contents, hero navigation, section index, or “back to section” link:

```text
1. define stable anchor names
2. place <a name="..."></a> immediately before target headings
3. link to exact #anchor values
4. keep heading text independent from anchor identifiers
5. audit every href before delivery
```

Prefer stable anchors even when GitHub's auto-generated slug would currently appear to work. This avoids future breakage when heading wording or markup changes.

### Step 7 — Plan assets

Create only assets that are actually used. Typical structure:

```text
assets/readme/
├── hero-light.svg
├── hero-dark.svg
├── support-light.svg
├── support-dark.svg
└── icons/
    ├── overview.svg
    ├── installation.svg
    ├── support.svg
    └── ...
```

Every authored visual must use the locked language unless the text is an approved proper name or literal.

### Step 8 — Write the copy

Use concrete nouns and verbs. Prefer:

```text
problem → capability → consequence
```

over adjective-heavy marketing language.

### Step 9 — Implement

Wire every used asset, link, heading icon, explicit anchor, navigation link, support destination, support CTA, and theme variant into the final README.

For heading icons and other `<img>` SVGs:

- do not rely on inherited `currentColor`;
- verify the theme mechanism in GitHub;
- keep one visual language;
- ensure every H2 has exactly one icon;
- keep the icon meaningful at display size.

For navigation:

- use `<a name="..."></a>` for manual section targets;
- keep identifiers stable and ASCII;
- place anchors immediately before their headings;
- link to exact custom anchors;
- never depend on a guessed slug generated from HTML/SVG heading markup.

### Step 10 — Render and QA assets

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

### Step 11 — Audit links and navigation

Run both external-link and in-page-fragment audits.

For in-page navigation, verify the exact correspondence:

```text
Markdown / HTML link fragment
            ↕
exact <a name="..."></a>
            ↕
intended section heading
```

Do not mark the README complete based only on visual inspection. Test the navigation targets themselves.

### Step 12 — Final audit

Perform the quality protocol below before declaring completion.

## 14. Visual and navigation QA protocol

### First screen

- project identity is immediate;
- primary value is understandable;
- primary next action is obvious;
- no decorative block pushes essential context below the fold.

### Language

- output matches the locked language;
- English is the default when no other language is explicitly requested;
- no unsolicited language mixing remains.

### Heading icons

- every H2 has exactly one semantic local SVG icon;
- H3+ headings use icons where meaningful;
- icons are visually coherent;
- icons do not rely on untested `currentColor` inheritance;
- icons pass geometry, size, render, and theme QA.

### Navigation

- every manual navigation link has a matching explicit custom anchor;
- every internal `href="#..."` has an exact `<a name="..."></a>` target;
- every Markdown `(#...)` link has an exact matching anchor;
- every navigation anchor sits immediately before the intended heading;
- no duplicate custom anchor names exist;
- no navigation target relies only on a guessed GitHub-generated slug;
- no fragment typo or dead target remains;
- navigation links were tested in the rendered GitHub context.

### Hierarchy

- headings are scannable;
- important links are easy to find;
- typography has clear levels;
- visual landmarks are meaningful;
- repeated components do not dominate the page.

### Support

- verified support destination is present when one exists;
- Support / Sponsor / Funding section exists when required;
- project-native Support CTA exists when required;
- CTA is visible and clickable;
- CTA points to the canonical destination;
- CTA remains legible in both themes;
- canonical support URL remains searchable outside the graphic.

### SVG geometry

- no unintended overlaps;
- intended groups are optically centered;
- internal symbols are centered within their frames when appropriate;
- padding is balanced;
- strokes and joins are consistent;
- nothing is clipped;
- tiny details remain readable at actual display size.

### Light/dark

- every authored visual remains legible;
- icons do not disappear;
- support CTA remains readable;
- screenshots retain useful contrast;
- theme variants preserve meaning and hierarchy.

### Responsive / narrow width

- no accidental horizontal overflow;
- tables remain usable or have an appropriate alternative;
- large images scale correctly;
- headings wrap gracefully;
- code blocks remain readable;
- centered layouts do not collapse awkwardly;
- navigation links remain readable and clickable.

### Accessibility

- informative images have alt text;
- decorative images are not announced as meaningful content;
- links identify their destination;
- heading hierarchy is logical;
- color is not the only communication channel;
- support URLs remain readable as text outside graphics;
- authored visual metadata follows the target language.

### Trust / maintenance

- major claims have repository evidence;
- links point to correct destinations;
- support URL is present when one exists;
- required support treatment exists;
- required CTA exists;
- versions and counts are not stale duplicates;
- generated assets are actually referenced;
- manual navigation remains valid if heading text changes.

## 15. Audit severity

Classify findings:

```text
BLOCKER  → wrong information, broken destination, missing required support treatment, missing required H2 icon, language-lock violation, unreadable theme, broken SVG, unintended overlap, clipping, materially off-center primary element, missing/unlinked required CTA, dead internal navigation target, guessed fragment, duplicate anchor name, navigation target mismatch
HIGH     → broken hierarchy, misleading proof, major responsive failure, serious accessibility issue, poor dark-mode hierarchy, SVG defects at actual display size, unsolicited language mixing, weak heading icon coverage below H2, fragile navigation implementation
MEDIUM   → visual inconsistency, weak copy, token drift, excessive decoration, minor optical imbalance
LOW      → isolated polish issue
```

Fix systemic, navigation, language, support, heading-icon, and trust failures before visual polish.

## 16. Anti-pattern filter

Reject or reconsider:

- generic purple-gradient SaaS styling unrelated to the project;
- a Hero that says only the project name and adjectives;
- fake statistics or invented screenshots;
- support information removed during redesign;
- a verified support destination without a visible clickable project-native CTA;
- generic donation banners copied across repositories;
- defaulting to Chinese when the user did not request Chinese;
- unsolicited language mixing;
- H2 headings without semantic SVG icons;
- excessive H3+ icons that make hierarchy noisy;
- heading icons that disappear in dark mode;
- SVGs approved only from source inspection;
- currentColor-dependent `<img>` SVGs that are not explicitly tested;
- accidental SVG stroke collisions or clipping;
- giant SVG posters replacing searchable documentation;
- repeated emoji as pseudo-iconography;
- every section wrapped in the same rounded card;
- links with unclear destination semantics;
- stale version numbers repeated in multiple places;
- manually authored navigation links built from guessed GitHub heading slugs;
- `href="#section"` links without a matching explicit `<a name="section"></a>` target;
- anchors hidden inside headings or icons;
- duplicate custom anchor names;
- navigation links that look correct in source but were not tested in the rendered GitHub context.

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
- every manual navigation target uses a stable explicit anchor;
- every manual navigation link resolves to an exact anchor match;
- no guessed or dead internal fragments remain;
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
- GitHub Markdown and section-link documentation

AzSkills uses transferable design and documentation principles rather than copying upstream Skill text, databases, or repository-specific assets.
