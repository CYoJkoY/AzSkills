---
name: readme-craft
description: Design, redesign, audit, and produce project-native GitHub README homepages with strong content architecture, deliberate visual identity, GitHub-safe SVG assets, accessible proof, preserved project links and support/sponsorship entry points, and maintainable Markdown. Use when a repository homepage needs clearer storytelling, stronger visual hierarchy, hero/section assets, responsive-safe visuals, or a complete visual refresh.
---

# README Craft

Turn a GitHub repository homepage into a readable visual story without turning it into a decorative poster.

This skill combines AzSkills' existing README engineering rules with an integrated README-beautification methodology: inspect the real repository first, move proof before detail, derive the visual system from the project, separate Markdown from deterministic SVG and raster assets, preserve important project-native links and support paths, and verify the result at realistic GitHub widths.

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

Prefer:

- real screenshots;
- real generated outputs;
- real UI or artifacts;
- real diagrams derived from the repository;
- real command examples;
- existing project artwork and identity assets.

Generated material is acceptable only when it performs a specific communication job that real material cannot perform as well.

Never invent adoption numbers, benchmarks, compatibility claims, testimonials, screenshots, features, or behavior.

### Preserve project-native links and support

README redesign is not permission to remove useful project destinations.

Before rewriting, inventory existing outbound links and action-oriented endpoints, including:

- download/release links;
- documentation and demos;
- source or related repositories;
- issue/discussion/support channels;
- sponsor, donation, funding, or author-support links;
- legal and privacy destinations.

If an existing sponsorship or donation entry is intentional and still valid, preserve it unless the user explicitly asks to remove or replace it.

For support or sponsorship, favor a directly usable Markdown link to the canonical destination when the original README already exposed the URL. Do not replace a convenient direct URL with an opaque image-only button merely for visual polish.

A support section is part of the project's action layer, not decorative footer content. It may appear near the end of the README, but the destination itself must remain directly accessible and easy to copy.

Never invent a sponsor URL, funding provider, payment endpoint, campaign, or support relationship. Reuse only verified project-owned or explicitly supplied destinations.

### Content and visual layers stay separate

Use Markdown for explanations, commands, links, configuration, API details, compatibility, limitations, security, contribution, support/sponsorship destinations, and other searchable/copyable information.

Use SVG for deterministic heroes, section transitions, workflow diagrams, identity modules, and structured visual explanations.

Use PNG/WebP for screenshots, photo-like material, generated artwork, and complex composites.

Use GIF only for explicitly approved motion that communicates something meaningful. Keep a static SVG/PNG fallback.

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
- current badges, license, release information, and directory structure;
- existing outbound links, support/sponsorship destinations, and action buttons;
- design tokens or existing visual identity when available.

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

Keep sponsor/support actions available without allowing them to displace the primary product narrative. A concise support block is usually appropriate near the end unless the original project intentionally places it elsewhere.

Use the project's actual information needs to override the default when necessary.

### Step 5 — Choose composition deliberately

Use one strong composition rather than many small decorative graphics.

Useful patterns:

- `split` — title plus one clear proof artifact;
- `integrated` — title and proof share one grid;
- `artifact-wall` — several real outputs with controlled scale and whitespace;
- `before-after` — useful when transformation is the product mechanism;
- `system-map` — one source feeding components or outputs;
- `annotated-specimen` — one real artifact with a few meaningful callouts;
- `sequence-strip` — three to six dependent stages;
- `title-only` — when no honest visual proof exists or severe minimalism is intentional.

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

Use:

- system font stacks;
- explicit geometry;
- consistent radii;
- semantic `<title>` / `<desc>` where useful;
- stable positioning;
- repository-relative assets.

Avoid:

- `foreignObject`;
- JavaScript;
- external stylesheets;
- remote fonts;
- remote image URLs inside SVG;
- fragile selectors;
- essential content inside animation;
- browser-specific layout tricks;
- published SVGs that depend on unresolved local raster references.

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
└── source/
    ├── hero-layout.svg
    ├── hero-subject.png
    └── hero-prompt.txt
```

Use lowercase hyphenated names. Remove discarded variants unless the user asks to preserve the exploration archive.

For a coordinated set, share typography hierarchy, palette roles, radius/stroke language, spacing rhythm, and motif vocabulary while giving each asset a specific communication job.

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
- Never maintain a changing number manually when GitHub can provide it dynamically.
- Inventory and preserve existing useful outbound links unless explicitly asked to remove them.
- Preserve valid sponsorship/donation/support destinations, especially direct URLs already present in the original README.
- Do not hide action URLs behind decorative graphics when a direct link is more convenient for users.

### Support and sponsorship block

When a project has an existing support or sponsorship destination, keep a compact action block such as:

```markdown
## Support

If this project saves you time or improves your workflow, you can support its development:

https://github.com/CYoJkoY/Payment
```

A richer badge or button may be added only when it improves the interface without removing the direct destination. The canonical URL must remain easy to discover, click, and copy.

The exact support copy should remain project-native. Do not imply commercial sponsorship, crowdfunding status, or payment-provider relationships that the repository does not establish.

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
- keep important action destinations obvious and usable.

The goal is not maximal decoration. The goal is lower cognitive load and faster comprehension.

## Motion

Motion is opt-in.

Use it only when it communicates a state, process, transition, or relationship. GitHub can render GIFs but does not play animation embedded inside SVG, so an animated module must retain a static fallback.

For approved GIFs, verify:

- entry frame;
- settled hold;
- exit;
- loop boundary;
- readability without animation.

Never make required instructions depend on motion.

## Verification

Before delivery, verify at realistic GitHub widths:

### Content

- First screen explains the project.
- Value proposition is concrete.
- Proof appears early.
- Installation leads to first success.
- No unsupported claims.
- Important limitations are visible.
- Critical instructions remain copyable/searchable.
- Existing valid release, documentation, and support/sponsorship destinations remain available.
- Sponsor/support URLs remain directly usable when they were intentionally exposed before redesign.

### Visual

- Hero fits completely.
- No SVG text clipping.
- No unintended overlap.
- Typography remains readable.
- Narrow preview remains understandable.
- Contrast works on relevant GitHub backgrounds.
- Alt text is meaningful.
- Visual density is deliberate.
- The result looks specific to the repository rather than reusable as a generic template.

### Maintenance

- Assets use repository-relative paths.
- SVG files end with newline.
- No remote font/script dependency.
- Dynamic facts are dynamic when practical.
- Discarded assets are removed unless intentionally retained.
- Unrelated files are untouched.
- Canonical action URLs are not replaced with fragile generated endpoints.

When the repository contains a README audit script, run it. Otherwise perform an equivalent manual audit.

## Approval and Change Boundaries

If the user requests an audit, do not edit.

If the user requests asset-only work, do not silently change README copy, ordering, embeds, or links.

If the user requests a whole-README redesign, limit edits to the authorized repository homepage and its directly required visual assets.

Preserving an existing sponsor/support link is considered a content-preservation requirement during redesign unless the user explicitly authorizes its removal.

Do not commit, push, open a PR, or publish without explicit authorization.

## Output Contract

### Audit

Return:

- first-screen clarity assessment;
- content architecture issues;
- visual system issues;
- accessibility/trust issues;
- maintenance risks;
- prioritized recommendations.

### Whole README / Visual refresh

Return:

- project story;
- visual thesis;
- changed content structure;
- visual asset plan;
- preserved action/link inventory, including support or sponsorship;
- verification results;
- files changed and files deliberately untouched.

### Asset-only

Return:

- asset rationale;
- implementation type (SVG / hybrid PNG/WebP / approved GIF);
- source and rendered assets;
- embed snippet when useful;
- verification notes;
- explicit statement that README content remains unchanged unless embedding was separately authorized.

## References

Read these when the task needs deeper guidance:

- `design-intelligence.md` — cross-cutting AzSkills visual design rules.
- `references/beautify-github-readme.md` — integrated README-beautification methodology, GitHub-safe canvas rules, project-native art direction, proof-first content architecture, asset organization, and motion policy.

## Provenance

This Skill is an AzSkills synthesis informed by the public methodology of:

- https://github.com/oil-oil/beautify-github-readme

The upstream project contributes the useful ideas of first-screen testing, `Value → Proof → Mechanism → First use → Detail` content sequencing, project-native visual derivation, proof-first design, GitHub-safe SVG production, realistic render-size testing, coordinated asset organization, and opt-in motion.

AzSkills rewrites these ideas to fit its own modular architecture and combines them with its existing README engineering and shared design-intelligence rules. Upstream example assets and repository-specific implementation are not mechanically vendored.
