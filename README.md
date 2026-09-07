<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — reusable AI skills with explicit behavior contracts, composed into checked task outputs" width="100%">

# AzSkills

**Reusable AI Skills for real work.**

A focused library of human-readable `SKILL.md` specifications for engineering, translation, localization, documentation, presentations, and visual workflows.

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
  <a href="https://github.com/CYoJkoY/AzSkills/stargazers"><img src="https://img.shields.io/github/stars/CYoJkoY/AzSkills?style=flat-square" alt="GitHub stars"></a>
</p>

<p>
  <a href="#start-here">Start here</a> ·
  <a href="#skill-catalog">Skills</a> ·
  <a href="#the-azskills-model">Model</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#support">Support</a>
</p>

</div>

---

## Start here

AzSkills is a **library of reusable AI behavior definitions**. It is not a framework, runtime, or executable application.

Each Skill lives in its own directory and is centered on a `SKILL.md` that defines its trigger boundary, hard constraints, workflow, quality gates, and output contract.

### Find the right Skill

| Your task | Start with |
| :--- | :--- |
| Optimize or refactor AutoHotkey v2 | [`ahkv2-opt`](ahkv2-opt/SKILL.md) |
| Work through a difficult engineering task | [`ultrathink`](ultrathink/SKILL.md) |
| Build an HTML presentation | [`frontend-slides`](frontend-slides/SKILL.md) |
| Design a logo or identity system | [`logo-generator`](logo-generator/SKILL.md) |
| Create a compact character/IP mark | [`ip-as-logo`](ip-as-logo/SKILL.md) |
| Turn a supplied photo into an editorial abstraction | [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) |
| Translate content into natural Chinese | [`any2zh`](any2zh/SKILL.md) |
| Localize game CSV data into 13 languages | [`l13n`](l13n/SKILL.md) |
| Design or rewrite a GitHub README | [`readme-craft`](readme-craft/SKILL.md) |
| Write a Steam Workshop / Mod page | [`steam-mod-page`](steam-mod-page/SKILL.md) |
| Translate Chinese chat into natural English | [`zh2en`](zh2en/SKILL.md) |

> **Selection rule:** use the smallest Skill that completely covers the task. Compose Skills only when each adds a distinct responsibility.

---

## The AzSkills model

AzSkills treats a Skill as a **behavior contract**, not a prompt snippet.

A useful Skill should answer five questions:

```text
When should it activate?
What must remain true?
How should the work proceed?
How is quality verified?
What should the output contain?
```

That turns working knowledge into something an agent can load, inspect, version, test, and reuse.

### One directory, one responsibility

The smallest useful Skill is intentionally simple:

```text
my-skill/
└── SKILL.md
```

When supporting material is required, it stays with the Skill that owns it:

```text
my-skill/
├── SKILL.md
├── references/
├── templates/
├── scripts/
└── assets/
```

### Compose instead of duplicate

AzSkills prefers the smallest architectural unit that solves the problem:

```text
new domain-specific behavior  →  new Skill
narrow variation              →  mode
shared reusable guidance      →  reference
cross-domain visual reasoning →  shared design intelligence
```

This keeps the catalog focused without forcing unrelated workflows into one universal prompt.

---

## Skill catalog

### Engineering

#### [`ahkv2-opt`](ahkv2-opt/SKILL.md)

**AutoHotkey v2 optimization and standardization.**

A rule-driven workflow for refactoring and reviewing AutoHotkey v2 code, covering code sizing, control flow, state management, hotkeys, timers, data structures, `DllCall`, GUI performance, memory behavior, and testing.

#### [`ultrathink`](ultrathink/SKILL.md)

**Deep engineering craftsmanship for difficult implementation work.**

A methodology for complex engineering and refactoring: question assumptions, map architecture, design from the caller's perspective, inspect abstractions, consider edge cases, test alternatives, and simplify beyond the first working implementation.

### Presentation & visual design

#### [`frontend-slides`](frontend-slides/SKILL.md)

**Animation-rich HTML presentation generation.**

A fixed 1920×1080 workflow for visual direction, narrative structure, design-system construction, typography, animation patterns, PowerPoint extraction, and quality auditing.

#### [`logo-generator`](logo-generator/SKILL.md)

**General logo and visual-identity production.**

Covers concept routes, black-and-white exploration, SVG marks, wordmarks, mascots, colorways, identity-system boards, showcase layouts, small-size testing, and targeted revision.

#### [`ip-as-logo`](ip-as-logo/SKILL.md)

**Character-led IP and mascot marks.**

A narrower workflow for highly simplified character/IP symbols, emphasizing dominant silhouette, restrained color, and small-size recognition.

#### [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

**Photo-preserving abstract editorial composition.**

Keeps a supplied photograph faithful while deriving a restrained abstract panel from its spatial, tonal, and color relationships.

### Documentation & publishing

#### [`readme-craft`](readme-craft/SKILL.md)

**Project-native GitHub README engineering.**

Treats a repository homepage as a communication interface: clarify the project first, move proof before detail, derive visual language from the real project, preserve important destinations, keep technical information searchable in Markdown, and verify visuals at realistic GitHub widths.

> This README is produced using `readme-craft` itself.

#### [`steam-mod-page`](steam-mod-page/SKILL.md)

**Steam Workshop / Mod Store writing.**

Produces structured Chinese/English Mod descriptions and change logs with BBCode discipline, practical wording, and strict feature accuracy.

### Language & localization

#### [`any2zh`](any2zh/SKILL.md)

**Multilingual translation into natural Chinese.**

Preserves meaning, tone, terminology, formatting, and technical context instead of performing literal conversion.

#### [`l13n`](l13n/SKILL.md)

**13-language game localization.**

A structured CSV localization workflow covering schema consistency, terminology, BBCode preservation, CSV escaping, and locale completeness.

#### [`zh2en`](zh2en/SKILL.md)

**Chinese-to-English conversational translation.**

Turns informal, slang-heavy, and context-dependent Chinese into natural English for everyday communication, work, gaming, and social contexts.

---

## Shared design intelligence

[`design-intelligence.md`](design-intelligence.md) is a **shared reference layer**, not another Skill.

Visual Skills inherit it when a task changes how an artifact looks, feels, moves, or is interacted with. It provides common guidance for visual thesis, style selection, typography, semantic color, composition, spacing, density, accessibility, motion, anti-pattern filtering, and visual QA.

Its precedence is:

```text
1. User requirements
2. Skill-specific hard constraints
3. Shared design intelligence
4. Referenced guidance and examples
```

The layer is an AzSkills synthesis informed by the public methodology of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

---

## How it works

The normal integration loop is intentionally small:

```text
Task
  ↓
Choose the narrowest Skill
  ↓
Read SKILL.md
  ↓
Load references / support files when needed
  ↓
Apply workflow + constraints
  ↓
Run quality checks
  ↓
Produce the result
```

Complex tasks can compose multiple Skills. A visual documentation task, for example, can use `readme-craft` while inheriting `design-intelligence.md`; a difficult implementation can pair `ultrathink` with a domain-specific Skill.

---

## Installation

AzSkills is a collection of Markdown specifications and supporting files. There is no repository-wide runtime or build step.

### Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Choose

Select the Skill directory that matches your task and keep its `SKILL.md` together with any referenced support files.

```text
ahkv2-opt/
any2zh/
frontend-slides/
ip-as-logo/
l13n/
logo-generator/
photo-abstract-editorial/
readme-craft/
steam-mod-page/
ultrathink/
zh2en/
```

`design-intelligence.md` is shared reference material and is not counted as an independent Skill.

### Register

Copy or link the selected Skill into the skill-discovery location used by your AI agent or development environment. Discovery paths vary by framework, so AzSkills does not prescribe one universal install directory.

---

## Skill selection

Use the narrowest capability first:

```text
User task
   │
   ├─ AutoHotkey v2 ───────────────► ahkv2-opt
   ├─ Complex engineering ─────────► ultrathink + task Skill
   ├─ Presentation ────────────────► frontend-slides
   ├─ Logo / identity ─────────────► logo-generator
   │      └─ character / IP ───────► ip-as-logo
   ├─ Photo + editorial ───────────► photo-abstract-editorial
   ├─ README / documentation ──────► readme-craft
   ├─ Game localization ───────────► l13n
   ├─ Translation ─────────────────► any2zh / zh2en
   └─ Steam Mod copy ───────────────► steam-mod-page
```

Visual tasks inherit `design-intelligence.md` automatically.

---

## Repository structure

```text
AzSkills/
├── .github/
│   ├── badges/skills.json
│   └── workflows/update-skill-badge.yml
├── assets/azskills-hero.svg
├── ahkv2-opt/SKILL.md
├── any2zh/SKILL.md
├── frontend-slides/
├── ip-as-logo/SKILL.md
├── l13n/SKILL.md
├── logo-generator/
├── photo-abstract-editorial/SKILL.md
├── readme-craft/
├── steam-mod-page/SKILL.md
├── ultrathink/
├── zh2en/SKILL.md
├── design-intelligence.md
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

The Skill count badge is generated from the repository's `SKILL.md` files by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so the count is not manually maintained.

---

## Documentation principles

AzSkills applies the same standards it teaches:

**Project-native, not template-first.** Visual direction comes from the actual product, audience, existing identity, and communication job.

**Proof before decoration.** Prefer real outputs, examples, commands, screenshots, diagrams, and repository artifacts over unsupported claims.

**Searchable Markdown.** Installation, configuration, commands, limitations, links, and other copyable information stay in Markdown.

**Correct destinations.** A source repository, deployed website, online documentation, payment page, and downloadable release are different destinations. README rewrites must preserve the destination that actually completes the user's intended action.

**Preserved action links.** Existing valid release, documentation, Demo, support, sponsorship, and related-project links are part of the repository's action layer and are not removed merely to improve visual polish.

**Conservative GitHub rendering.** Visual assets should survive realistic wide and narrow content widths, use repository-relative paths where possible, remain accessible, and avoid fragile browser-specific behavior.

For the complete method, see [`readme-craft/SKILL.md`](readme-craft/SKILL.md) and [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md).

---

## Contributing

A strong contribution should add a **clear capability**, improve an existing workflow, fix a concrete defect, or remove unnecessary complexity.

Before creating a new top-level Skill, check whether the behavior belongs in an existing Skill as a mode, reference, or shared rule. New Skills should have a distinct scope, clear trigger conditions, and a concrete output contract.

For imported public methodologies, record provenance and applicable licensing information in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep diffs focused, readable, and easy to audit.

---

## Support

AzSkills is open source. If these Skills save you time or improve your workflows, you can support continued development through the deployed payment page:

**https://cyojkoy.github.io/Payment/**

The payment page is the user-facing destination; the [`Payment` source repository](https://github.com/CYoJkoY/Payment) is kept separate as a source link.

---

## License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · reusable rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
