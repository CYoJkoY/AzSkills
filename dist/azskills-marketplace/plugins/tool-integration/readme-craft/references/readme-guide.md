<!-- Loaded by readme-craft. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies depth only. If it conflicts with the canonical readme-craft contract, the contract wins.

# README Visual and Structure Reference

Treat a GitHub README as a product interface and trust surface, not as a text dump. Optimize for fast understanding, credible evidence, clear action, maintainability, and a visual identity derived from the actual project.

## 1. Language lock

README Craft defaults to **English**. When no language is explicitly requested, README copy, headings, labels, navigation, alt text, sponsorship copy, and authored visual text must be English.

Explicit language requests override the default. Use exactly the requested language set. Unsolicited language mixing is a **BLOCKER**.

Technical identifiers, official names, trademarks, filenames, commands, API symbols, and unchanged UI literals may retain their original form when required for accuracy.

Audit the finished README and authored visual assets for language drift.

## 2. Evidence-first repository understanding

Inspect the actual repository before writing final structure or copy. Review, when available:

```text
repository name / description
primary audience and problem
actual features and current behavior
README / docs
package / project metadata
supported versions and installation
releases / downloads
screenshots / demos / UI
existing logo / iconography / artwork
canonical links
FUNDING.yml / sponsorship metadata
license / contribution / security information
light / dark conventions
```

When a fact is uncertain, verify it from a first-party source or omit it.

## 3. First-screen and information architecture

The first viewport should answer:

```text
What is this?
Who is it for?
Why should I care?
What should I inspect or do next?
```

Prefer the narrative `Value → Proof → Mechanism → First action → Detail`, adapting it to the project's domain.

General software structure:

```text
Hero
Identity / value
Proof / real output
Overview
Features
How it works
Quick Start / Installation
Usage / Configuration
Compatibility / Limitations
Architecture / Development
Status / Roadmap
Support / Sponsorship
License
```

Treat the Hero and primary project identity as one first-screen composition rather than unrelated blocks. A Hero is preferred when the repository contains honest visual evidence or a useful project-derived visual summary; use a title-first or title-only composition when a Hero would add decoration without useful information.

When the chosen first-screen composition is visually centered, the primary project name should be centered as part of the composition, not merely centered inside an isolated line. Keep the identity zone, Hero/proof zone, and first-action zone separate enough that badges, navigation, or adjacent graphics do not pull the title off the visual center.

Do not duplicate authoritative manuals; use the README as an entry point.

### First-screen identity and title/Hero relationship

The first-screen identity may be **centered, split, integrated, or title-first** depending on the repository's visual evidence and audience. Centering is a composition choice, not a universal template.

When a centered identity is selected:

- use a GitHub-safe Markdown / HTML structure that makes the title's alignment explicit;
- center the primary project name relative to the Hero/proof composition when practical;
- keep the title baseline, Hero width, and nearby badges/navigation on a shared composition grid;
- avoid using independently centered child groups that create optical drift;
- preserve a clear vertical rhythm between Hero, project name, value proposition, proof, and first action.

When a Hero is used:

- place it in the first-screen flow where it summarizes the project's real identity or mechanism;
- make its visual hierarchy support the project name instead of competing with it;
- keep essential copy searchable in Markdown or HTML;
- give the Hero its own geometry and safe margin rather than allowing it to collide with the title or first-action area.

A Hero may be omitted when no honest visual evidence exists. A centered title may be omitted when the project's strongest first-screen composition is split or artifact-led.

## 4. Heading icon system

**For AzSkills-owned READMEs, every major H2 heading uses exactly one semantic
repository-local SVG icon.** For external repositories, follow their existing
policy. Do not add icons when the repository has no owned icon system.

For H3 and deeper headings, use a semantic SVG icon when it improves scanability without creating noise.

Rules:

- H2 → exactly one SVG icon immediately before the heading text in AzSkills-owned READMEs;
- H2 → zero added icons when the target repository has no owned icon system;
- prefer project-owned or project-derived iconography;
- store icons locally, normally under `assets/readme/icons/`;
- never use emoji as a required heading-icon substitute;
- never rely on `currentColor` inheritance in Markdown `<img>` SVGs;
- keep one coherent stroke/fill vocabulary and display scale;
- every icon passes geometry, size, render, and theme QA.

## 5. Support section policy

For AzSkills-owned `whole-readme`, `visual-refresh`, and presentation-changing
maintenance or asset work, include one Sponsorship / Support section only when
the repository has a real support destination.

For an externally owned repository, follow its support policy. A README may omit
the section when no verified destination exists. Never invent a sponsor, amount,
promise, or URL.

When the section is present, it should contain:

```text
Sponsorship / Support heading
↓
factual explanation of what support sustains
↓
visible canonical support URL in searchable Markdown / HTML
↓
project-native graphical sponsorship CTA
```

A project-native graphical CTA is preferred when the repository has an owned
visual system. A clear Markdown link remains valid when no owned graphics exist.

Before implementation, investigate README links, About/homepage, FUNDING.yml, GitHub Sponsors configuration, maintainer-owned support pages, donation pages, existing support sections, and release/documentation support links.

Use the strongest verified canonical destination. An explicit user-provided
support destination is authoritative. If none can be verified, omit the section
and record the omission; never invent a destination.

### Sponsorship CTA quality

Every graphical sponsorship CTA must:

- be visible in the README;
- be clickable and linked to the canonical destination;
- also expose the canonical URL outside the image;
- use at least two real project signals such as the project icon, real UI/output, project palette, project geometry, or project typography;
- remain legible in GitHub light and dark themes;
- pass the full SVG QA gate;
- avoid fake urgency, impact metrics, guilt language, or generic donation-banner styling.

## 6. Visual direction and composition

Do not produce a generic AI-generated SaaS README.

Before styling, define:

```text
visual thesis
project subject
audience
primary message
dominant composition
palette roles
typography roles
shape / icon language
image treatment
light / dark strategy
sponsorship visual strategy
```

Use project-specific evidence and motifs. Cards, pills, repeated rounded containers, gradients, and glass effects are optional components, never defaults.

### 7.1 SVG visual grammar

Treat SVG as a **small composition system**, not a pile of individually polished objects. The visual should have a clear reading path before decoration begins.

Define these layers before drawing:

```text
1. canvas / background
2. primary anchor
3. secondary structure
4. project-native proof
5. typography
6. restrained accents
```

Use a limited visual vocabulary:

- one dominant background treatment;
- one primary text tone and one muted tone;
- one main accent and, when justified, one secondary accent;
- one radius family;
- one principal stroke weight plus a lighter utility weight;
- one spacing rhythm, reused across groups.

A stronger SVG usually comes from **fewer stronger objects**, not more objects.

### 7.2 Layout before styling

Set the major bounding boxes first and judge the composition in monochrome or low-contrast form before adding accents.

Use explicit zones or a composition grid such as:

```text
safe margin
│
├── identity / title zone
├── proof / artifact zone
└── footer / metadata zone
```

Do not let independently authored modules compete for the same visual area. Give adjacent groups a deliberate gap and a defined maximum width.

When a composition contains multiple cards, panels, screenshots, or specimens, use **controlled asymmetry** only after the underlying grid works. Small rotations, offsets, or overlaps may add editorial energy, but they must be intentional, limited, and never used to hide alignment problems.

### 7.3 Layering and depth without visual noise

Borrow depth from **simple SVG layering**, not automatic effects:

- a low-opacity offset shape can act as a physical shadow;
- a second surface can establish hierarchy behind the main object;
- a controlled rotation of a secondary specimen can create rhythm;
- a thin outline can separate adjacent surfaces.

Do not stack multiple shadows, glows, gradients, borders, and patterns on the same object.

Any overlap must have a semantic reason, such as foreground/background, comparison, sequence, or specimen stacking. Random overlap is a geometry failure.

### 7.4 Project-native decorative signals

Before adding decoration, ask what the repository already contains that could become a visual primitive:

```text
terminal cursor
selection handle
code bracket
keyline
table row
node / connector
map marker
timeline
chart axis
grid cell
window chrome
file tree
real icon / logo
```

Transform those real signals into the SVG vocabulary. Do not add generic circuitry, binary digits, random dots, abstract waves, glow trails, or decorative grids merely to make the image look technical.

### 7.5 Editorial rhythm for complex SVGs

When one SVG must present several real concepts, use **a small sequence of clearly separated scenes** rather than squeezing everything into one diagram.

Useful patterns include:

```text
label → statement → specimen
input → transformation → output
before → change → after
problem → mechanism → result
```

Each scene should have one job. Separate scenes with whitespace or a restrained structural line instead of overlapping them.

Slightly varied scale, alignment, or rotation is acceptable for secondary specimens, but the primary message and project name should remain stable and visually dominant.

### 7.6 Typography as structure

Do not use typography as labels sprinkled over finished shapes. Typography is part of the geometry.

For each text group, define:

```text
role
maximum width
baseline
line height
alignment
weight
contrast
```

For the primary project name and Hero pairing, also define the shared composition center or split axis and the deliberate gap between the title and visual. The title should not be centered by character count alone when neighboring badges, artwork, or asymmetric proof changes the visual mass.

Prefer two to four type levels rather than many tiny labels. Long SVG text should be shortened, explicitly split into lines, or moved back into Markdown.

When a title and graphic are adjacent, measure their actual bounding boxes and maintain a clear visual gap. Never rely on approximate character counts.

### 7.7 Shape, spacing, and optical alignment

Use mathematical alignment as the starting point, then apply small optical corrections only when necessary.

Check:

- equal inset from surfaces;
- consistent gaps between repeated objects;
- icon and text centerlines;
- visually balanced left/right mass;
- visual rather than merely geometric center for asymmetrical icons;
- adequate negative space around logos and primary marks.

Do not compensate for a crowded composition by making every object smaller. Simplify or remove objects first.

## 7. SVG quality and render QA

An SVG is not finished because its source looks plausible. Render it and inspect the actual result.

### Source integrity

Check valid XML/SVG, correct `viewBox`, no accidental clipping, no malformed paths, no unnecessary raster embedding, and no broken references.

### Geometry

Check:

```text
overlap
internal spacing
optical centering
symmetry where intended
stroke consistency
cap / join consistency
corner-radius consistency
edge padding
text alignment
bounding-box separation
visual mass balance
```

Block unintended touching, visible off-center primary elements, collisions, clipping, materially unbalanced padding, or misaligned CTA frames.

### Composition audit

For every major authored SVG, explicitly answer:

```text
What is the first object I see?
What should I see second?
Which elements are evidence rather than decoration?
Where does the eye travel next?
What can be deleted without losing meaning?
```

If two elements compete for first attention, reduce the weaker one. If three or more elements explain the same idea, consolidate them.

### Multi-size

Render important SVGs at realistic sizes including `16`, `24`, `32–48`, `64–128`, `320`, `768–900`, and `1200` px when applicable. Check readability, collapsing gaps, disappearing strokes, text legibility, and silhouette recognition.

### Light / dark

Evaluate every authored SVG against GitHub light and dark contexts. Use theme-neutral artwork or explicit light/dark variants selected with `<picture>`. When SVGs are embedded with `<img>`, use explicit colors rather than assuming inherited `currentColor`.

### Rendered inspection

For heroes and sponsorship CTAs, inspect overlap, centering, text placement, whitespace balance, button/frame alignment, hierarchy, theme artifacts, and language errors. Fix and render again.

For dense or editorial SVGs, also inspect:

- negative space between scenes;
- relative scale of primary vs secondary objects;
- whether controlled rotations or offsets read as intentional;
- whether layered objects still have a clean silhouette;
- whether decorative elements can be mistaken for real product evidence.

## 8. Manual navigation must use stable anchors

Do not rely on guessed GitHub heading slugs for authored navigation.

Use an explicit custom anchor immediately before the target heading:

```html
<a name="readme-overview"></a>
## <img src="assets/readme/icons/overview.svg" width="24" height="24" alt=""> Overview
```

Every authored internal link must point exactly to an existing custom anchor:

```markdown
[Overview](#readme-overview)
```

Audit:

```text
all Markdown (#...) links
all href="#..." links
all <a name="..."></a> anchors
exact matches
anchor immediately precedes intended heading
duplicate anchors
dead / guessed fragments
```

Any mismatch is a **BLOCKER**.

## 9. Markdown / HTML and accessibility

Keep searchable information in Markdown or normal HTML, including installation, configuration, compatibility, legal/security information, important links, navigation targets, and the canonical sponsorship URL.

Use HTML only where GitHub rendering materially helps, such as `<picture>`, controlled visual groups, clickable image CTAs, and explicit anchors.

Informative images require useful alt text. Decorative images should not masquerade as content. Do not make color the only communication channel.

## 10. Dynamic facts and links

Separate stable design from changing facts. Release versions, counts, compatibility, and workflow status should come from canonical sources when practical. Do not bake volatile facts into graphics.

Audit important external destinations:

```text
repository
documentation
installation / quick start
release / download
support / sponsorship
license / contribution
security / privacy when applicable
```

Never replace a known destination with a guess.

## 11. Workflow

```text
Inspect repository and history when useful
↓
Lock output language
↓
Establish README thesis
↓
Plan hierarchy, H2 icons, stable anchors
↓
Verify sponsorship destination
↓
Plan / create required sponsorship CTA
↓
Define SVG visual grammar and composition zones
↓
Write evidence-based copy
↓
Implement Markdown / HTML / assets
↓
Render all authored SVGs
↓
Inspect sizes + light/dark + geometry + composition
↓
Audit links + navigation + sponsorship URL
↓
Final trust / accessibility / responsive audit
```

## 12. Final QA checklist

### First screen

- identity is immediate;
- value proposition is clear;
- primary next action is obvious;
- Hero is present when it provides useful project-specific visual proof or summary;
- when a centered identity composition is chosen, the project name is optically centered relative to the Hero/proof system;
- title, Hero, proof, and first action do not compete for the same visual space;
- no decorative block pushes essential context away.

### Heading icons

- every major H2 has one semantic owned SVG icon when an icon system exists;
- no icons are added when the repository has no owned icon system;
- H3+ icons are used only when meaningful;
- icons are coherent and theme-safe.

### Sponsorship

- Sponsorship / Support section is present only when a real destination exists;
- factual explanation exists;
- canonical URL is visible outside the graphic;
- graphical sponsorship CTA exists;
- CTA is clickable and canonical;
- CTA uses real project signals;
- CTA is readable in both themes.

### Navigation

- every manual link has an exact custom-anchor target;
- every target sits immediately before its intended heading;
- no guessed fragments or duplicate anchors remain.

### SVG

- no unintended overlap;
- primary elements are optically centered;
- padding is balanced;
- strokes are consistent;
- nothing is clipped;
- actual-size details remain readable;
- every major group has a distinct communication job;
- decoration does not compete with evidence;
- controlled offsets/rotations, when used, are intentional and aligned to the composition.

### Responsive / accessibility

- no accidental horizontal overflow;
- large visuals scale correctly;
- headings wrap gracefully;
- tables remain usable;
- informative images have alt text;
- canonical sponsorship URLs remain searchable.
