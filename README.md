<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — reusable AI skills organized as explicit, composable behavior contracts" width="100%">

# AzSkills

### Reusable AI Skills for real work.

Small, composable, human-readable `SKILL.md` specifications for engineering, translation, localization, documentation, presentations, and visual design.

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
  <a href="https://github.com/CYoJkoY/AzSkills/stargazers"><img src="https://img.shields.io/github/stars/CYoJkoY/AzSkills?style=flat-square" alt="GitHub stars"></a>
</p>

<p>
  <a href="#start-here">Start here</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#the-azskills-model">Model</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#contributing">Contributing</a>
</p>

</div>

---

## Start here

AzSkills is a **library of reusable AI instructions**. It is not a framework, runtime, or executable application.

Each capability is isolated in its own directory and centered on a `SKILL.md`. The file defines when the Skill applies, what must remain true, how the work should proceed, what quality checks matter, and what the output should look like.

### Find a Skill by task

| Task | Skill |
| :--- | :--- |
| Optimize or refactor AutoHotkey v2 | [`ahkv2-opt`](ahkv2-opt/SKILL.md) |
| Work through a difficult engineering task | [`ultrathink`](ultrathink/SKILL.md) |
| Build an HTML presentation | [`frontend-slides`](frontend-slides/SKILL.md) |
| Design a logo or identity system | [`logo-generator`](logo-generator/SKILL.md) |
| Create a compact character/IP mark | [`ip-as-logo`](ip-as-logo/SKILL.md) |
| Turn a supplied photo into an editorial abstraction | [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) |
| Translate content into natural Chinese | [`any2zh`](any2zh/SKILL.md) |
| Localize game CSV data into 13 languages | [`l13n`](l13n/SKILL.md) |
| Write or redesign a GitHub README | [`readme-craft`](readme-craft/SKILL.md) |
| Write a Steam Workshop / Mod page | [`steam-mod-page`](steam-mod-page/SKILL.md) |
| Translate Chinese chat into natural English | [`zh2en`](zh2en/SKILL.md) |

> **Selection rule:** start with the narrowest Skill that completely covers the task. Combine Skills only when each contributes a distinct responsibility.

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

This makes the resulting knowledge easier to inspect, version, test, adapt, and reuse.

### One directory, one responsibility

The smallest useful Skill looks like this:

```text
my-skill/
└── SKILL.md
```

A larger Skill can own supporting material without turning into a monolith:

```text
my-skill/
├── SKILL.md
├── references/
├── templates/
├── scripts/
└── assets/
```

Supporting files remain local to the Skill that owns their behavior.

### Compose instead of duplicate

AzSkills prefers the smallest architectural unit that solves the problem:

```text
new domain-specific capability  →  new Skill
narrow variation of a Skill     →  mode
shared reusable guidance        →  reference
cross-domain visual reasoning   →  shared design intelligence
```

That keeps Skills focused without forcing unrelated domains into one universal prompt.

---

## Skills

### Engineering

#### [`ahkv2-opt`](ahkv2-opt/SKILL.md)

**AutoHotkey v2 optimization and standardization.**

A rule-driven workflow for refactoring and reviewing AutoHotkey v2 code, including code sizing, control flow, state management, hotkeys, timers, data structures, `DllCall`, GUI performance, memory behavior, and testing.

#### [`ultrathink`](ultrathink/SKILL.md)

**Deep engineering craftsmanship for difficult implementation work.**

A methodology for complex engineering and refactoring tasks that emphasizes assumption checking, architecture mapping, caller-oriented design, abstraction review, edge cases, alternative evaluation, testing, and simplification.

### Presentation & visual design

#### [`frontend-slides`](frontend-slides/SKILL.md)

**Animation-rich HTML presentation generation.**

A fixed 1920×1080 workflow for presentation architecture, visual direction, design-system construction, typography, animation patterns, PowerPoint extraction, and quality auditing.

#### [`logo-generator`](logo-generator/SKILL.md)

**General logo and visual-identity production.**

Covers concept development, black-and-white exploration, SVG marks, wordmarks, mascot routes, colorways, identity-system boards, showcase layouts, small-size testing, and targeted revision.

#### [`ip-as-logo`](ip-as-logo/SKILL.md)

**Character-led IP and mascot marks.**

A narrower identity workflow for highly simplified character/IP symbols, with strong silhouette, restrained color, and small-size recognition requirements.

#### [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

**Photo-preserving abstract editorial composition.**

Keeps a supplied photograph faithful while deriving a restrained abstract panel from its spatial, tonal, and color relationships.

### Documentation & publishing

#### [`readme-craft`](readme-craft/SKILL.md)

**Project-native GitHub README engineering.**

Turns a repository homepage into a readable visual story through first-screen clarity, proof-first structure, project-native art direction, GitHub-safe SVGs, realistic render-size checks, accessible presentation, link preservation, and maintenance-aware documentation.

**This README is written using `readme-craft` itself.**

#### [`steam-mod-page`](steam-mod-page/SKILL.md)

**Steam Workshop / Mod Store writing.**

Produces structured Chinese/English Mod descriptions and change logs with practical wording, BBCode discipline, and strict feature accuracy.

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

Visual Skills inherit it automatically when a task changes how an artifact looks, feels, moves, or is interacted with.

It provides a common framework for:

- visual thesis and context-driven style selection;
- typography hierarchy and semantic color roles;
- composition, spacing, geometry, and information density;
- accessibility and interaction affordances;
- motion and reduced-motion behavior;
- anti-pattern filtering and visual quality review.

Its precedence is explicit:

```text
1. User requirements
2. Skill-specific hard constraints
3. Shared design intelligence
4. Referenced guidance and examples
```

The layer is an AzSkills synthesis informed by the public methodology of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). AzSkills keeps transferable design reasoning without vendoring the upstream plugin, generated database, or provider-specific tooling.

---

## How it works

A typical workflow is deliberately small:

```text
Task
  ↓
Choose the narrowest matching Skill
  ↓
Read SKILL.md
  ↓
Load references / support files when needed
  ↓
Apply workflow + constraints
  ↓
Run relevant quality checks
  ↓
Produce the task-specific result
```

Skills can be composed when the task genuinely crosses domains. For example, a complex engineering task can use `ultrathink` together with a domain-specific Skill, while a visual documentation task can use `readme-craft` and inherit the shared design layer automatically.

---

## Installation

AzSkills has no repository-wide runtime or build step. It is a collection of Markdown specifications and supporting files.

### Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Choose

Select the Skill directory that matches your task. Keep `SKILL.md` together with any support files it references.

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

Copy or link the selected Skill directory into the discovery location used by your AI agent or development environment.

Discovery paths differ between agent frameworks, so AzSkills intentionally does not prescribe a single universal install directory.

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

## Why the repository stays modular

### Explicit contracts

Skills document triggers, rules, workflows, constraints, quality gates, and output expectations directly in Markdown.

### Composable capabilities

There is no universal “do everything” prompt. Small capabilities are easier to load, audit, revise, test, and reuse.

### Shared knowledge without duplication

Cross-domain visual reasoning lives in one shared layer while domain-specific behavior remains authoritative inside each Skill.

### Curated synthesis

When public Skills overlap, AzSkills prefers one coherent capability over redundant top-level copies. Narrower workflows can become modes or references; unrelated domains stay independent.

### Human-readable by default

The core artifacts are ordinary Markdown and repository-local files, so the rules can be inspected and versioned like normal source material.

---

## Repository structure

```text
AzSkills/
├── .github/
│   ├── badges/
│   │   └── skills.json
│   └── workflows/
│       └── update-skill-badge.yml
├── assets/
│   └── azskills-hero.svg
├── ahkv2-opt/
│   └── SKILL.md
├── any2zh/
│   └── SKILL.md
├── frontend-slides/
│   ├── SKILL.md
│   ├── DESIGN_SYSTEM.md
│   ├── STYLE_PRESETS.md
│   ├── viewport-base.css
│   ├── html-template.md
│   ├── animation-patterns.md
│   └── scripts/
├── ip-as-logo/
│   └── SKILL.md
├── l13n/
│   └── SKILL.md
├── logo-generator/
│   ├── SKILL.md
│   └── references/
├── photo-abstract-editorial/
│   └── SKILL.md
├── readme-craft/
│   ├── SKILL.md
│   └── references/
├── steam-mod-page/
│   └── SKILL.md
├── ultrathink/
│   ├── SKILL.md
│   └── LICENSE
├── zh2en/
│   └── SKILL.md
├── design-intelligence.md
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

The Skill count badge is generated from the repository's `SKILL.md` files by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so the count does not need to be maintained manually.

---

## Documentation principles

AzSkills applies the same standards it teaches.

**Project-native, not template-first.** Visual direction should come from the actual project, audience, existing identity, and communication job.

**Proof before decoration.** Prefer real outputs, examples, commands, screenshots, diagrams, and repository artifacts over unsupported claims.

**Searchable Markdown.** Installation, configuration, commands, limitations, APIs, links, and other copyable information stay in Markdown instead of being trapped inside images.

**Conservative GitHub rendering.** Visual assets should survive realistic wide and narrow GitHub content widths, use repository-relative paths where possible, and avoid fragile browser-specific behavior.

For the full README production method, see [`readme-craft/SKILL.md`](readme-craft/SKILL.md) and [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md).

---

## Contributing

A strong contribution should add a **clear capability**, improve an existing workflow, fix a concrete defect, or remove unnecessary complexity.

Before creating a new top-level Skill, check whether the behavior belongs in an existing Skill as a mode, reference, or shared rule.

For imported public methodologies, record provenance and applicable licensing information in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep diffs focused, readable, and easy to audit.

## License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · reusable rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
