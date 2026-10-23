---
name: readme-craft
description: Design, rewrite, and audit GitHub README homepages with evidence-first information architecture, theme-safe SVG headings, stable anchors, verified links, dynamic repository facts, and rendered QA. Use for repository landing pages.
version: 2.0.0
status: canonical
family: publishing
modes: [build, rewrite, audit]
---

# README Craft

Turn a repository into a readable, verifiable GitHub landing page. This Skill
owns information architecture, first-screen identity, heading icons, navigation,
repository facts, support presentation, and README visual QA. It does not invent
product claims, screenshots, benchmarks, or destinations.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task creates, rewrites, or audits a GitHub README or a major README section.
- Do not use when: the task is a Steam Workshop page (`steam-mod-page`), a standalone document, or a general website (`ui-design`).
- Owns: README structure, first-screen hierarchy, heading icon system, anchors, evidence, links, support CTA, and rendered Markdown/SVG QA.
- Inputs: repository tree, package and release metadata, existing docs, screenshots, assets, license, support destinations, and target language.
- Outputs: README Markdown, SVG icons or hero assets, navigation, and verification evidence.
- Compose with: `ui-design` for a rendered custom page; `logo-generator` for identity marks.
- Gates: every fact is sourced; every link resolves; every anchor is stable; icons and hero render in light and dark themes.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `build` | New repository landing page | Evidence, IA, visual thesis, assets, QA | README and assets |
| `rewrite` | Existing README needs restructuring | Audit, preserve evidence, rewrite sections, QA | Revised README |
| `audit` | Read-only review | Evidence, structure, links, render | Ranked findings |

## Workflow

### 1. Build the evidence inventory

Read the repository before writing:

```text
name and one-line purpose
primary users and tasks
install and first run
core features that exist
supported platforms and versions
license and contribution path
support and sponsor destinations
existing screenshots, logos, and badges
```

Record the source for every material claim. If a fact is absent, omit it or mark
it unresolved. Do not infer benchmarks, compatibility, or roadmap.

### 2. Lock the language

Default to English. If the user requests another output language, use it
consistently in prose, headings, alt text, and link labels. Do not mix languages
except for proper names, commands, and file paths. Preserve the project's
established language when the README is being maintained rather than rebuilt.

### 3. Design the information architecture

The first screen answers: what is this, who is it for, why use it, and what is
the first action. Then order the rest by the reader's job:

```text
identity and one-line promise
primary action or quick start
proof or preview
capabilities
installation and configuration
usage
compatibility and limitations
support, license, and contribution
```

Use only the sections the repository can support. A short honest README beats a
long invented one. Keep the first screen free of navigation clutter and badges
that do not help a decision.

### 4. Establish the visual thesis

```text
Purpose: what the page helps the reader do
Tone: what the project should feel like
Constraint: GitHub Markdown, themes, and asset limits
Signature: one or two memorable ideas
```

The hero may combine a title, one-line promise, and one authored SVG or image.
It must remain legible in light and dark themes and at narrow width. Do not use a
generic banner that could belong to any repository.

### 5. Build the heading icon system

For AzSkills-owned READMEs, every major `##` section uses one semantic SVG icon
from `assets/readme/icons/`; minor subsections do not need icons. For an external
repository, follow its existing icon policy. Do not add icons without an owned
icon set, and do not use emoji as a substitute.

- Draw on a 24px grid with one optical stroke weight.
- Use `currentColor` or theme-safe colors; never bake a single theme background into the icon.
- Include an empty `alt` for decorative heading icons and a visible text label beside the heading.
- Keep icons simple enough to read at 20-24px.
- Set explicit `width` and `height` on the embedding `<img>`.

### 6. Present support without inventing a destination

For AzSkills-owned whole-README work, include one support or sponsorship section
only when the repository has a real destination. Use the existing destination
from the repository; do not invent a sponsor, amount, promise, or link. The CTA
must adapt to light and dark themes and remain visually subordinate to the
project's primary action. For external projects, follow the repository owner's
policy and omit the section when no destination exists.

### 7. Make navigation and facts stable

- Use explicit custom anchors such as `<a name="readme-usage"></a>`; do not guess GitHub heading fragments.
- Use relative repository links for local files and absolute HTTPS links for external destinations.
- Verify every link target and every image path.
- Generate dynamic facts, such as skill counts, from repository automation; do not hardcode a number that will drift.
- Keep the table of contents limited to major sections and place it after the first screen.

### 8. Build and verify the visual assets

For authored SVG, check source geometry, viewBox, typography, clipping, and theme
contrast. Render the README at desktop and narrow width, in light and dark modes.
Inspect the first screen, headings, code blocks, tables, images, and CTA. A broken
image or invisible icon is a defect, not a cosmetic issue.

For a read-only audit, rank findings by reader impact: false claim, broken link,
unreadable first screen, broken asset, navigation failure, then polish.

## Quality gates

- [ ] The first screen states what the project is, who it is for, and the first action.
- [ ] Every feature, version, benchmark, screenshot, and compatibility claim is sourced.
- [ ] The output language is consistent and explicitly chosen.
- [ ] Major headings use one owned semantic icon, or no icons when the repository has no icon system.
- [ ] The support section exists only with a real destination and does not invent a sponsor.
- [ ] Every internal anchor and external link resolves.
- [ ] Dynamic facts come from automation, not stale prose.
- [ ] SVG assets render in light and dark themes at the intended sizes.
- [ ] The README renders without horizontal overflow at narrow width.
- [ ] The final response lists verification and unresolved items.

## Output contract

```text
Reader and first action:
Information architecture:
Visual thesis:
Assets created or changed:
Evidence and source links:
Link and anchor verification:
Theme and narrow-width verification:
Unverified items:
```

For `audit`, return a verdict, findings ranked by reader impact, and one smallest
correction per finding.

## References

- `references/readme-guide.md` - detailed first-screen, SVG grammar, layout, composition, and QA procedure.
- `references/beautify-github-readme.md` - README information architecture and visual patterns.
- `references/icon-selection.md` - icon selection and scoring.
- `references/support-cta-auto-adapt.md` - theme-adaptive support CTA.
