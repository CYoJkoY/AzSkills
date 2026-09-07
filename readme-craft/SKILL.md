---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with strong content architecture, deliberate visual identity, GitHub-safe SVG assets, accessible proof, preserved project links and support/sponsorship entry points, explicit source/deployment/download URL semantics, dynamic repository facts, and maintainable Markdown. Use when a repository homepage needs clearer storytelling, stronger visual hierarchy, hero/section assets, responsive-safe visuals, or a complete visual refresh.
---

# README Craft

Turn a GitHub repository homepage into a readable visual story without turning it into a decorative poster.

This skill combines README engineering with a project-native visual methodology: inspect the real repository first, move proof before detail, derive the visual system from the project, separate Markdown from deterministic assets, preserve important destinations and action paths, distinguish source/deployment/download URLs, keep changing repository facts dynamic when practical, and verify the result at realistic GitHub widths.

## Scope

Use the narrowest mode that satisfies the request:

| Mode | Purpose |
| :--- | :--- |
| `audit` | Review clarity, hierarchy, visual quality, trust, accessibility, and maintenance cost without editing |
| `whole-readme` | Redesign information architecture, copy hierarchy, assets, and visual system |
| `visual-refresh` | Preserve useful information architecture while replacing weak visual presentation |
| `asset-only` | Create only requested Hero, section, workflow, badge, diagram, showcase, or motion assets |

Never expand `asset-only` into README rewriting without explicit authorization.

## Design Intelligence Inheritance

All visual README work automatically inherits AzSkills' shared `design-intelligence.md` layer.

Apply it without requiring the user to mention any external design methodology. Resolve decisions in this order:

1. Explicit user requirements.
2. README-specific hard constraints in this Skill.
3. Shared AzSkills design intelligence.
4. Optional references and examples.

The result should look native to the repository, not branded as a reusable Skill template.

## Core Principles

### Project-first, not template-first

Inspect the actual repository before designing. Derive the visual language from what the project does, who uses it, what it produces, and what visual material already exists.

A CLI may use terminal rhythm and monospace metadata. An icon system may use keylines and cutouts. A game may use its own characters and screenshots. Research may use coordinates, evidence labels, and measured structure.

Never force a fashionable template onto an unrelated project.

### First-screen clarity

Without scrolling, a new visitor should understand:

1. What is this?
2. What can it do for me?
3. What should I inspect next?

The default narrative is:

`Value → Proof → Mechanism → First use → Detail`

Do not lead with internal architecture, contributor instructions, long tables, or unexplained commands when the repository is unfamiliar.

### Real proof beats decoration

Prefer real screenshots, outputs, UI, artifacts, diagrams derived from the repository, command examples, and existing project artwork. Generated material is acceptable only when it performs a specific communication job that real material cannot perform as well.

Never invent adoption numbers, benchmarks, compatibility claims, testimonials, screenshots, features, or behavior.

### Dynamic facts have one source of truth

Do not hard-code changing repository facts in multiple locations.

Common examples include:

- Skill or package counts;
- release/version labels;
- generated badges;
- repository statistics;
- generated catalog summaries;
- build or compatibility metadata.

Prefer a single authoritative source and automate derived presentation where practical:

```text
repository state
      ↓
canonical generated fact
      ↓
badge / Hero / summary / table
```

A visual asset should not require regeneration merely because a count changed. Keep changing data separate from stable composition. Use explicit machine-readable markers in deterministic SVG when automated replacement is appropriate.

### Preserve project-native links and support

README redesign is not permission to remove useful project destinations.

Before rewriting, inventory outbound links and action-oriented endpoints, including downloads/releases, documentation/demos, source or related repositories, issues/discussions, sponsorship/donation/funding, and legal/privacy destinations.

If an existing sponsorship or donation entry is intentional and still valid, preserve it unless the user explicitly asks to remove or replace it.

Support is an action layer. It should be visually recognizable and easy to activate, but never at the cost of link clarity or accessibility.

A raw standalone payment URL often reads like implementation detail rather than a polished call to action. Prefer a compact project-native linked visual CTA—typically a small SVG or badge-style button—with concise wording and an icon or symbol. The visual itself should link directly to the canonical support destination.

The canonical support URL must also remain present as ordinary searchable/copyable Markdown, either as a labeled text link or a clearly labeled direct-link line. Do not hide the only support destination inside an image.

For example:

```markdown
## Support

<div align="center">

<a href="https://example.com/support">
  <img src="assets/readme/support.svg" alt="Support Project Name" width="420">
</a>

Support the continued development of Project Name.

**Direct support link:** https://example.com/support

</div>
```

The preferred visual CTA should be repository-relative, deterministic, accessible, and stylistically consistent with the README. A shields.io badge may be used when it is genuinely the best fit, but do not introduce an external service merely because it is convenient.

Do not use a decorative graphic that looks like a button but is not clickable. Do not make the image the only place where the destination can be discovered or copied.

### Distinguish source, deployment, and download destinations

Treat these as different link types:

```text
Source repository   → code, issues, history, contribution
Deployment / live   → website, Demo, online docs, hosted dashboard, sponsor/payment page
Download / release  → installer, executable, package, release artifact
```

Do not substitute one destination type for another simply because they share a project name.

For every important external or cross-repository link, determine what the visitor is expected to do next. Then point the README to the destination that actually completes that action.

For support/payment in particular, use the deployed user-facing page when one exists. Keep the source repository as a separate, explicitly labeled source link when useful.

Example:

```text
Payment source:   https://github.com/CYoJkoY/Payment
Payment website:  https://cyojkoy.github.io/Payment/
```

Never invent, guess, or infer a deployment URL from a repository name. Verify it from project configuration, existing README links, GitHub Pages configuration when accessible, project metadata, or an explicitly supplied destination.

### Content and visual layers stay separate

Use Markdown for explanations, commands, links, configuration, API details, compatibility, limitations, security, contribution, support/sponsorship destinations, and other searchable/copyable information.

Use SVG for deterministic Heroes, workflow diagrams, identity modules, structured visual explanations, and compact action graphics.

Use PNG/WebP for screenshots, photo-like material, generated artwork, and complex composites.

Use GIF only for explicitly approved motion that communicates something meaningful. Keep a static fallback.

Never rasterize the entire README.

## Workflow

### Step 1 — Inspect the repository

Collect enough evidence to understand the project:

- repository name and description;
- audience and primary user action;
- technology stack;
- core features and first successful action;
- existing README and current structure;
- real screenshots, outputs, diagrams, UI, logos, or artwork;
- package/manifests and relevant metadata;
- badges, license, release information, and directory structure;
- outbound links, support/sponsorship destinations, and action buttons;
- whether important links resolve to source repositories, live deployments, or downloadable artifacts;
- design tokens or existing visual identity.

For a GitHub URL, inspect the live repository and default branch before proposing changes.

Start read-only. Inspection never implies permission to modify, commit, push, or publish.

### Step 2 — Define the project story

Create this internal brief:

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

Replace internal jargon with concrete outcomes. Explain each mechanism once. Move the shortest useful install path toward the first-use stage.

### Step 3 — Choose the visual direction

Freeze:

```text
Palette: background / foreground / primary / accent / muted
Typography: system-safe stack / display scale / body scale / utility scale
Shape: radius / stroke / spacing unit
Motif: one project-specific recurring cue
Composition: calm / editorial / technical / playful / cinematic
Density: sparse / compact / expressive
```

Derive those choices in this order:

1. Product semantics.
2. Existing identity and project material.
3. Audience expectations.
4. Visual finish.

Do not start from a trend and force the project to match it.

### Step 4 — Plan the reading order

Use this as the default:

1. Hero — project name + plain-language value.
2. Proof — screenshot, output, specimen, or showcase.
3. What it is — concise explanation.
4. Why it is different — mechanism, not slogans.
5. How it works — short flow or architecture.
6. How to use — installation + first successful action.
7. Compatibility, limits, security, contribution, license, and support when relevant.

Keep sponsor/support actions available without allowing them to displace the primary product narrative. A concise visual support CTA is usually appropriate near the end unless the original project intentionally places it elsewhere.

Use the project's actual information needs to override the default when necessary.

### Step 5 — Choose composition deliberately

Use one strong composition rather than many small decorative graphics.

Useful patterns include `split`, `integrated`, `artifact-wall`, `before-after`, `system-map`, `annotated-specimen`, `sequence-strip`, and `title-only`.

Do not default to a left-text/right-graphic Hero merely because it is familiar.

## Hero Design

The Hero is the visual summary of the repository, not a generic banner.

A Hero may contain:

1. Category/context cue.
2. Project name.
3. Concrete one-line value.
4. Real project-native visual material.
5. Small high-signal metadata.

Let the project artifact influence typography, composition, and motif. The project should remain recognizable even if its name is removed.

### Maintenance rule for Hero data

Never bake changing repository facts into the visual design unless there is an explicit synchronization mechanism.

When a Hero contains mutable facts such as Skill count, version, package count, supported locales, or generated statistics:

1. Identify the canonical source.
2. Give the visual a stable machine-readable marker, for example `id="skill-count"`.
3. Add automation that derives the displayed fact from the canonical source.
4. Fail loudly if the marker is missing or duplicated.
5. Keep the visual composition unchanged when the fact changes.

Prefer stable metadata such as category, architectural principle, or workflow relationship when no synchronization mechanism is needed.

### Implementation decision

For deterministic assets, prefer pure SVG.

For a meaningful subject that is difficult to represent deterministically—such as a project-specific character, complex organic material, or cinematic subject—a hybrid composition may use SVG for layout/typography plus a separately generated transparent raster subject. Publish the verified PNG/WebP and keep the SVG layout source and raster layers as editable sources.

Do not introduce generated imagery merely for decoration.

### GitHub-safe Hero defaults

- Prefer a `1200`-unit-wide SVG `viewBox`.
- Embed at `width="100%"`.
- Keep essential text inside a conservative safe rectangle.
- At ~900 CSS px rendered width, keep essential diagram text around 20 SVG units or larger, supporting labels around 18 or larger, and section titles around 40 or larger.
- Treat text below ~18 SVG units as nonessential metadata only.
- Inspect a ~360 px preview; required text that fails there must be simplified, enlarged, split out, or moved into Markdown.
- Avoid long text near rounded corners.
- Do not let decorative lines cross essential typography.

## GitHub-Safe SVG

Use standard SVG shapes, paths, text, fills, strokes, clipping paths, patterns, and simple transforms.

Use system font stacks, explicit geometry, consistent radii, semantic `<title>` / `<desc>` where useful, stable positioning, and repository-relative assets.

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
├── support.svg
└── source/
    ├── hero-layout.svg
    ├── hero-subject.png
    └── hero-prompt.txt
```

Use lowercase hyphenated names. Remove discarded variants unless the user asks to preserve the exploration archive.

For coordinated assets, share typography hierarchy, palette roles, radius/stroke language, spacing rhythm, and motif vocabulary while giving each asset a specific communication job.

## README Content Engineering

Apply these editing rules:

- Replace internal terminology with understandable outcomes where possible.
- Explain the core mechanism once; remove repeated versions.
- Put the shortest successful install path before advanced configuration.
- Put real examples before long explanations when the example is immediately understandable.
- Keep limitations visible when they affect user decisions.
- Keep searchable/copyable text in Markdown, not SVG.
- Avoid long prose in multi-column Markdown tables.
- Keep repository facts dynamic when trustworthy endpoints or automation can provide them.
- Never maintain a changing number manually when GitHub or repository automation can provide it dynamically.
- Inventory and preserve existing useful outbound links unless explicitly asked to remove them.
- Classify important links as source, deployment/live, or download/release before changing them.
- Use the destination that actually completes the user's intended action.
- Preserve valid sponsorship/donation/support destinations.
- Prefer a compact visual support CTA over a bare raw payment URL when it improves hierarchy.
- Keep the canonical support URL directly accessible in Markdown even when a visual CTA is present.
- Do not turn an action URL into image-only content.

## Support and sponsorship UX

When a project has a verified support or sponsorship destination, treat it as a small product surface rather than an afterthought.

Preferred structure:

```markdown
## Support

<div align="center">

<a href="<canonical-support-url>">
  <img src="assets/readme/support.svg" alt="Support <Project>" width="420">
</a>

<short project-native support sentence>

**Direct support link:** <canonical-support-url>

</div>
```

Use the visual CTA when it improves scanability and gives the README a coherent action affordance. Keep the direct URL because users may need to copy it, inspect it, or access it when images are blocked.

A support asset should be a compact CTA, not a second Hero. Avoid oversized donation banners, manipulative language, false urgency, unsupported commercial claims, or generic “Buy Me a Coffee” styling when it is not native to the project.

The CTA destination must be the user-facing support/payment page, not the payment project's source repository, when the deployed page is available and verified.

Never invent a funding relationship or imply sponsorship that does not exist.

## Link inventory

Before a whole-README redesign, record important destinations in an internal inventory:

| Purpose | URL type | Canonical destination | Preserve? |
| :--- | :--- | :--- | :--- |
| Source | repository | GitHub source repo | Yes |
| Live / Demo | deployment | hosted site | Yes |
| Docs | deployment or repository | actual docs destination | Yes |
| Download | release / artifact | actual download endpoint | Yes |
| Support | deployment | deployed payment/sponsor page | Yes |

Do not assume that a GitHub repository URL is the canonical destination for every action.

## Visual Quality and UX Rules

Treat a README as an interface:

- clear hierarchy before ornament;
- predictable reading order;
- strong contrast;
- accessible alt text;
- no essential information conveyed by color alone;
- no tiny body text used to carry meaning;
- no accidental horizontal overflow;
- no repeated cards when a diagram, specimen, or direct example is clearer;
- no decorative element that competes with proof;
- preserve dark/light rendering contrast where practical;
- keep important action destinations obvious and usable;
- a visual CTA must remain obviously clickable;
- support copy must not overpower the primary project narrative.

The goal is not maximal decoration. The goal is lower cognitive load and faster comprehension.

## Motion

Motion is opt-in.

Use it only when it communicates a state, process, transition, or relationship. GitHub can render GIFs but does not play animation embedded inside SVG, so an animated module must retain a static fallback.

For approved GIFs, verify entry frame, settled hold, exit, loop boundary, and readability without animation.

Never make required instructions depend on motion.

## Verification

Before delivery, verify at realistic GitHub widths.

### Content

- First screen explains the project.
- Value proposition is concrete.
- Proof appears early.
- Installation leads to first success.
- No unsupported claims.
- Important limitations are visible.
- Critical instructions remain copyable/searchable.
- Existing valid release, documentation, and support/sponsorship destinations remain available.
- Important links still point to the correct destination type: source, deployment/live, or download/release.
- Sponsor/support URLs remain directly usable when they were intentionally exposed before redesign.
- A deployed website or payment page is not accidentally replaced by its source repository URL.
- Changing repository facts have one authoritative source rather than multiple hard-coded copies.

### Visual

- Hero fits completely.
- No SVG text clipping.
- No unintended overlap.
- Typography remains readable.
- Narrow preview remains understandable.
- Contrast works on relevant GitHub backgrounds.
- Alt text is meaningful.
- Visual density is deliberate.
- Support CTA is visibly an action, not an unclickable decoration.
- Support CTA styling is consistent with the rest of the README.
- The result looks specific to the repository rather than reusable as a generic template.

### Maintenance

- Assets use repository-relative paths.
- SVG files end with newline.
- No remote font/script dependency.
- Dynamic facts are dynamic when practical.
- Hero mutable-data markers are unique and automation fails when they are missing.
- Discarded assets are removed unless intentionally retained.
- Unrelated files are untouched.
- Canonical action URLs are not replaced with fragile or incorrect endpoints.
- Source and deployment destinations remain clearly distinguished.
- A future repository update should not require manual edits in multiple locations for the same changing fact.

When the repository contains a README audit script, run it. Otherwise perform an equivalent manual audit.

## Approval and Change Boundaries

If the user requests an audit, do not edit.

If the user requests asset-only work, do not silently change README copy, ordering, embeds, or links.

If the user requests a whole-README redesign, limit edits to the authorized repository homepage and its directly required visual assets.

Preserving an existing sponsor/support link is a content-preservation requirement unless the user explicitly requests removal or replacement.

For a support CTA redesign, replacing a raw URL presentation with a linked visual CTA is allowed when the canonical URL remains directly available in Markdown and the destination itself is unchanged.

## Output Contract

For `whole-readme` work, the delivered result should include:

1. Project-native first screen.
2. Clear value and early proof.
3. Appropriate Hero and section assets.
4. Searchable installation and usage instructions.
5. Preserved and verified action links.
6. Clear support/sponsorship entry point when applicable.
7. Dynamic repository facts where practical.
8. Repository structure and maintenance notes when useful.
9. Source/deployment/download link semantics kept correct.
10. No unsupported claims.

## Provenance

This Skill is an AzSkills synthesis informed by:

- https://github.com/oil-oil/beautify-github-readme

Its methodology is adapted to AzSkills' architecture rather than mechanically vendored. Third-party provenance and licensing information should be recorded in the repository's `THIRD_PARTY_NOTICES.md` when applicable.
