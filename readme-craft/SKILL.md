---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with deliberate visual systems, semantic iconography, GitHub-safe assets, accessible proof, preserved action links, dynamic repository facts, and maintainable Markdown.
---

# README Craft

Treat a GitHub README as a product interface: it should explain the project quickly, reduce cognitive load, provide proof, guide the first successful action, and remain maintainable as the repository evolves.

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

The result should look native to the repository, not like a generic reusable template.

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

Common examples:

- Skill/package counts;
- release/version labels;
- generated badges;
- repository statistics;
- generated catalog summaries;
- compatibility metadata.

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

A README can be technically correct and still be tiring to read when long stretches of prose have identical visual weight.

Use semantic icons to create visual landmarks at meaningful hierarchy boundaries:

- section/category headers;
- feature groups;
- workflow stages;
- quick-start actions;
- support/action CTAs;
- warnings or notes when an icon adds meaning.

Do not attach an icon to every paragraph, sentence, or table row. Excessive icon repetition becomes noise.

Aim for one recognizable visual cue every one to three major content blocks, with stronger icon treatment at section transitions and weaker treatment inside repeated content.

Icons should reinforce meaning rather than merely fill whitespace. A settings icon can signal configuration, an A-to-Z icon can signal language/localization, an arrow can signal progression, and an adjustment icon can signal design/system tuning.

### Icon source library policy

When semantic icons materially improve readability, the Skill may use these curated sources:

- `Nieobie/game-icon-pack` — primary source for reusable semantic README icons when a matching icon exists. The repository declares `CC0-1.0`, provides SVG and PNG variants, and is suitable for small UI-like and game-oriented visual cues.
- `zhangyu1818/appicon-forge` — generation/customization tool when the README needs a project-specific icon, compact identity mark, custom color treatment, or a semantic symbol that is not adequately represented by the reusable pack. Its README states that the project is MIT-licensed and supports custom SVG/images and Iconify Icons.

Repository URLs:

```text
https://github.com/Nieobie/game-icon-pack
https://github.com/zhangyu1818/appicon-forge
```

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

Do not use an external icon library merely because it is fashionable. Prefer the smallest asset that communicates the concept clearly.

For library assets, prefer copying the verified SVG into the repository when the license allows it and long-term availability matters. Avoid fragile hotlinks to upstream raw URLs when local vendoring is practical.

When using `appicon-forge`, inspect the rights of the selected source icon, font, image, or Iconify icon independently from the tool's own project license. The tool's license does not automatically transfer rights to third-party generated inputs.

Record reused third-party icon assets in `THIRD_PARTY_NOTICES.md` with source, path, license, and local destination.

### Preserve project-native links and support

README redesign is not permission to remove useful project destinations.

Inventory existing outbound links and action-oriented endpoints before rewriting:

- downloads/releases;
- documentation/demos;
- source or related repositories;
- issues/discussions;
- sponsorship/donation/funding;
- legal/privacy destinations.

A valid existing support destination must be preserved unless the user explicitly asks to remove or replace it.

Support is an action layer. It should be visually recognizable and easy to activate, but never at the cost of link clarity or accessibility.

A raw standalone payment URL often reads like implementation detail. Prefer a compact project-native linked visual CTA with concise wording and a visual motif that belongs to the project. The visual itself should link to the canonical support destination.

The support graphic is a project-specific interface asset, not a universal AzSkills asset. Never copy an existing repository's branded `support.svg`, Hero artwork, mascot, palette, or other identity-bearing CTA into another project merely because the layout works. Rebuild or retune the asset from the destination repository's own visual language.

The canonical support URL must also remain present as ordinary searchable/copyable Markdown. Never make an image the only way to discover or copy the support destination.

Preferred structure:

```markdown
## Support

<div align="center">

<a href="<canonical-support-url>">
  <img src="assets/readme/support-cta.svg" alt="Support <Project>" width="420">
</a>

<short project-native support sentence>

**Direct support link:** <canonical-support-url>

</div>
```

A support asset should be a compact CTA, not a second Hero. It should normally contain:

```text
project-native motif or illustration
        +
clear support action
        +
small amount of supporting text
```

The visual treatment should be derived from the repository's identity, not from this example's literal colors, iconography, character, or composition. Match the project's existing palette, geometry, typography, art style, mascot, product screenshot language, or other authentic cue whenever one exists.

Use the following fallback hierarchy when no strong project art exists:

```text
existing project artwork / logo / UI motif
        ↓
project-derived geometric or semantic motif
        ↓
minimal neutral donation/support illustration
```

Do not use a generic donation illustration when a strong project-native visual language is available. Conversely, do not invent a mascot or elaborate scene solely to decorate a payment link.

### Distinguish source, deployment, and download destinations

Treat these as different link types:

```text
Source repository   → code, issues, history, contribution
Deployment / live   → website, Demo, online docs, hosted dashboard, sponsor/payment page
Download / release  → installer, executable, package, release artifact
```

For support/payment, use the deployed user-facing page when one exists and is verified. Keep the source repository as a separately labeled source link when useful.

Never invent, guess, or infer a deployment URL from a repository name.

### Content and visual layers stay separate

Use Markdown for explanations, commands, links, configuration, API details, compatibility, limitations, security, contribution, support destinations, and other searchable/copyable information.

Use SVG for deterministic Heroes, workflow diagrams, icon modules, compact action graphics, and structured visual explanations.

Use PNG/WebP for screenshots, photo-like material, generated artwork, and complex composites.

Use GIF only for explicitly approved motion that communicates something meaningful, with a static fallback.

Never rasterize the entire README.

## Workflow

### Step 1 — Inspect the repository

Collect:

- repository name and description;
- audience and primary user action;
- technology and core functionality;
- existing README and structure;
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

Derive choices from product semantics, existing identity, audience expectations, then visual finish.

### Step 4 — Plan the reading order

Default:

1. Hero — project name + plain-language value.
2. Proof — screenshot, output, specimen, showcase, or repository-derived diagram.
3. What it is — concise explanation.
4. Why it is different — mechanism, not slogans.
5. How it works — short flow with semantic visual cues.
6. How to use — installation + first successful action.
7. Compatibility, limitations, security, contribution, license, and support when relevant.

Use icons to break repeated text blocks without forcing them into a visual gimmick.

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

## Iconography in README Design

Treat icons as a secondary visual language that improves scanning and separates dense text blocks.

### Semantic mapping

Before choosing an icon, write the intended meaning in one phrase:

```text
configuration → settings / adjustment
workflow      → arrow / route
engineering   → tool / gear / system
translation   → A-to-Z / language
documentation → document / editing
support       → heart / star / contribution
```

Select the closest verified asset. Do not force a semantically wrong icon because it looks attractive.

### Density rules

Use three levels:

```text
Primary section icon  → 20–32 px visual prominence
Feature/card icon     → 18–24 px
Inline utility icon   → 14–18 px
```

A long README should contain enough visual landmarks to prevent continuous text fatigue, but not so many that the icons become a second layer of noise.

A practical baseline is:

```text
1 major visual landmark every 1–3 content blocks
1 category icon per major category
0–1 utility icon per short supporting block
```

Use icons to create scanning landmarks, not to replace text. The text remains authoritative.

### Accessibility

- Give meaningful icons useful `alt` text when they carry meaning.
- Use empty alt text for purely decorative icons.
- Never make icon color the only indication of state or category.
- Keep visual contrast sufficient on GitHub backgrounds.
- Do not embed essential instructions only inside a graphic.

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

Prefer stable metadata when synchronization is unnecessary.

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
    ├── hero-subject.png
    ├── support-layout.svg
    ├── support-subject.png
    └── support-prompt.txt
```

Use lowercase hyphenated names except where an upstream filename is intentionally retained. Keep source assets separate from published assets.

For coordinated assets, share typography hierarchy, palette roles, radius/stroke language, spacing rhythm, and icon vocabulary while giving each asset a specific communication job.

## README Content Engineering

- Replace internal terminology with understandable outcomes where possible.
- Explain the core mechanism once.
- Put the shortest successful install path before advanced configuration.
- Put real examples before long explanations when the example is immediately understandable.
- Keep limitations visible.
- Keep searchable/copyable information in Markdown, not SVG.
- Avoid long prose in dense tables.
- Keep changing repository facts dynamic.
- Never maintain changing numbers manually when automation can provide them.
- Preserve useful outbound links.
- Classify important links as source, deployment/live, or download/release.
- Use the destination that actually completes the user's intended action.
- Preserve valid sponsorship/donation/support destinations.
- Prefer a compact project-native visual support CTA over a bare payment URL when it improves hierarchy.
- Do not reuse branded support artwork from another repository.
- Keep the canonical support URL accessible in Markdown.
- Use semantic icons to break visual monotony in long sections.
- Do not turn every line of documentation into a decorated card.

## Visual Support and Sponsorship UX

A support block should read as an intentional action surface:

```text
[ project-native visual support CTA ]
                ↓
short project-native explanation
                ↓
canonical direct URL
```

A local visual CTA is preferred when the repository already uses local visual assets. The CTA should be visually coherent, compact, clickable, and accessible.

The actual support endpoint remains the canonical source of truth; the graphic is only the interface layer.

### Project-specific asset rule

The support CTA must belong to the repository it appears in. Treat every support illustration as an authored project asset, not as a global template asset.

For each new repository:

1. inspect its logo, mascot, UI, screenshots, art direction, palette, typography, and recurring motifs;
2. identify one authentic visual cue that can carry the support action;
3. design a compact CTA around that cue;
4. adapt wording and visual weight to the repository's audience and overall README hierarchy;
5. retain the canonical support URL in Markdown outside the graphic.

An existing support asset from AzSkills or any other repository may be used as structural inspiration only. Do not transplant its project name, mascot, illustration, exact palette, decorative motif, or brand-specific composition into another repository unless the target project genuinely shares that identity.

### What the CTA should contain

Prefer a small visual narrative rather than a plain label:

```text
visual motif / project artifact
          +
Support / Sponsor / Contribute action
          +
optional one-line rationale
```

Good subjects include a project mascot offering a heart/star, a product artifact connected to contribution, a stylized project UI element with a support cue, or an abstract motif derived from the repository's own identity.

Do not place critical instructions, payment identifiers, legal terms, or the only support URL inside the artwork.

### Fallback when project visuals are weak

Use this order:

```text
project-native artwork
        ↓
project-native logo / UI / geometric motif
        ↓
small deterministic support symbol + typography
```

A neutral, tasteful support illustration is preferable to a visually loud but unrelated mascot or stock-style donation banner.

### Anti-patterns

Avoid:

- raw URL as the only support presentation when a visual CTA would improve hierarchy;
- a giant donation banner that behaves like a second Hero;
- generic "Buy me a coffee" artwork copied across unrelated repositories;
- AzSkills-specific support artwork transplanted into unrelated projects;
- decorative art with no recognizable support action;
- urgent or manipulative fundraising language;
- unsupported claims about impact, funding, popularity, or project sustainability.

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
- icons should clarify hierarchy or meaning rather than exist for decoration alone;
- visual density should alternate between information-rich and visual-relief blocks;
- keep action destinations obvious and usable;
- visual landmarks should be distributed through long-form README content rather than concentrated only in the Hero.

The goal is lower cognitive load and faster comprehension, not maximal decoration.

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
- Icons are sparse enough to guide scanning but frequent enough to break long text runs.
- Section-to-section visual rhythm does not become a continuous wall of text.
- Support CTA is obviously clickable.
- Support CTA looks native to the target repository rather than copied from another project.

### Maintenance

- Assets use repository-relative paths.
- SVG files end with newline.
- No remote font/script dependency.
- Dynamic facts are automated when practical.
- Third-party icon provenance is recorded.
- No duplicated source/deployment/download URLs.
- Unrelated files are untouched.
- Discarded assets are removed unless intentionally retained.

## Approval and Change Boundaries

If the user requests an audit, do not edit.

If the user requests asset-only work, do not silently change README copy, ordering, embeds, or links.

If the user requests a whole-README redesign, limit edits to the authorized homepage and directly required assets.

Preserving an existing valid sponsor/support link is a content-preservation requirement unless the user explicitly requests removal or replacement.

Adding a visual CTA or semantic icon is allowed when it improves usability, but it must not remove, obscure, or falsify canonical information.

## Output Contract

For whole-README work, the final repository should contain:

1. a clear first screen;
2. readable visual rhythm;
3. semantic iconography where it materially improves scanning;
4. proof before deep detail;
5. searchable/copyable Markdown for technical content;
6. correctly classified and preserved outbound links;
7. dynamic repository facts where automation is practical;
8. a usable support/action surface when the project has one;
9. GitHub-safe visual assets;
10. provenance for reused third-party icon assets.

## Provenance

This Skill is an AzSkills synthesis informed by public README and visual-documentation methodologies, including:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack
