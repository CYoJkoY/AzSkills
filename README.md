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
  <a href="#-start-here">Start here</a> ·
  <a href="#-skill-catalog">Skill catalog</a> ·
  <a href="#-the-azskills-model">Model</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## ✦ Start here

**AzSkills is a library of reusable instructions, not a framework and not an executable application.** Each capability lives in its own directory and is centered on a `SKILL.md` that tells an AI agent when the skill applies, what constraints matter, how the work should be done, and how the result should be checked.

The practical model is simple:

```text
User task
   ↓
Choose the narrowest matching Skill
   ↓
Read SKILL.md
   ↓
Load references / supporting files when needed
   ↓
Apply workflow + constraints
   ↓
Run quality checks
   ↓
Produce the task-specific result
```

### Find the right Skill

| I need to… | Use |
| :--- | :--- |
| Optimize or refactor AutoHotkey v2 | [`ahkv2-opt`](ahkv2-opt/SKILL.md) |
| Handle a difficult engineering or refactoring task | [`ultrathink`](ultrathink/SKILL.md) |
| Build an HTML presentation | [`frontend-slides`](frontend-slides/SKILL.md) |
| Design a logo or visual identity | [`logo-generator`](logo-generator/SKILL.md) |
| Create a compact character/IP mark | [`ip-as-logo`](ip-as-logo/SKILL.md) |
| Transform a supplied photo into an editorial abstraction | [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) |
| Translate content into natural Chinese | [`any2zh`](any2zh/SKILL.md) |
| Localize game CSV data into 13 languages | [`l13n`](l13n/SKILL.md) |
| Design or rewrite a GitHub README | [`readme-craft`](readme-craft/SKILL.md) |
| Write a Steam Workshop / Mod page | [`steam-mod-page`](steam-mod-page/SKILL.md) |
| Translate Chinese chat into natural English | [`zh2en`](zh2en/SKILL.md) |

> **Selection rule:** start with the smallest Skill that completely covers the task. Compose multiple Skills only when each contributes a distinct responsibility.

---

## ◇ The AzSkills model

AzSkills is built around **behavior contracts** rather than large collections of generic prompts.

A strong Skill answers five questions:

```text
When should it activate?
What must remain true?
How should the work proceed?
How is quality verified?
What should the output look like?
```

This makes the instructions easier to inspect, version, adapt, and reuse across different projects and agent environments.

### One directory, one responsibility

The default packaging model is deliberately small:

```text
my-skill/
└── SKILL.md
```

A Skill can grow when necessary, but supporting files remain local to the Skill that owns them:

```text
my-skill/
├── SKILL.md
├── references/
├── templates/
├── scripts/
└── assets/
```

### Compose instead of duplicating

Do not create a new top-level Skill every time two workflows share a small amount of knowledge. AzSkills prefers:

```text
new domain-specific behavior → new Skill
narrow variation of existing behavior → mode
shared reusable guidance → reference
cross-domain visual reasoning → shared design intelligence
```

This keeps the catalog smaller and the contracts more precise.

---

## ◆ Skill catalog

### Engineering

#### [`ahkv2-opt`](ahkv2-opt/SKILL.md)

**AutoHotkey v2 optimization and standardization.**

A rule-driven workflow for refactoring and reviewing AutoHotkey v2 code. It covers code and function sizing, control flow, state management, hotkeys, timers, data structures, `DllCall`, GUI performance, memory behavior, and testing.

#### [`ultrathink`](ultrathink/SKILL.md)

**Deep engineering craftsmanship for difficult implementation work.**

A methodology for complex engineering and refactoring tasks: question assumptions, map architecture, design from the caller's perspective, inspect naming and abstractions, consider edge cases, test alternatives, and simplify beyond the first working implementation.

### Presentation & visual design

#### [`frontend-slides`](frontend-slides/SKILL.md)

**Animation-rich HTML presentation generation.**

A fixed 1920×1080 presentation workflow covering visual direction, narrative structure, design-system construction, animation patterns, typography, PowerPoint extraction, and quality auditing.

#### [`logo-generator`](logo-generator/SKILL.md)

**General logo and visual-identity production.**

Covers concept routes, black-and-white exploration, SVG logo construction, wordmarks, mascot directions, colorways, identity-system boards, showcase layouts, small-size checks, and targeted revision.

#### [`ip-as-logo`](ip-as-logo/SKILL.md)

**Character-led IP and mascot marks.**

A narrower identity workflow for extremely simplified character/IP symbols, emphasizing dominant silhouette, restrained color, and small-size recognition.

#### [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

**Photo-preserving abstract editorial composition.**

Keeps a supplied photograph faithful while deriving a sparse abstract panel from observed spatial, tonal, and color relationships. It is intentionally separate from logo generation.

### Documentation & publishing

#### [`readme-craft`](readme-craft/SKILL.md)

**Project-native GitHub README engineering.**

Treats the repository homepage as a communication interface: clarify the project first, put proof before detail, derive the visual language from the real product, keep technical information searchable in Markdown, and verify assets at realistic GitHub widths.

This README is maintained with that Skill.

#### [`steam-mod-page`](steam-mod-page/SKILL.md)

**Steam Workshop / Mod Store writing.**

Produces structured Chinese/English Mod descriptions and change logs with BBCode discipline, practical wording, and strict feature accuracy.

### Language & localization

#### [`any2zh`](any2zh/SKILL.md)

**Multilingual translation into natural Chinese.**

Preserves meaning, tone, terminology, formatting, and technical context rather than translating word-for-word.

#### [`l13n`](l13n/SKILL.md)

**13-language game localization.**

A structured CSV localization workflow with fixed schema requirements, terminology consistency, BBCode preservation, CSV escaping, and locale completeness.

#### [`zh2en`](zh2en/SKILL.md)

**Chinese-to-English conversational translation.**

Turns informal, slang-heavy, and context-dependent Chinese into natural English for everyday communication, work, gaming, and social contexts.

---

## ◇ Shared design intelligence

[`design-intelligence.md`](design-intelligence.md) is a **cross-cutting reference layer**, not another Skill.

When a task changes how something looks, feels, moves, or is interacted with, the shared layer provides a common decision framework for:

- visual thesis and style selection;
- typography hierarchy;
- semantic color roles and contrast;
- composition, spacing, geometry, and density;
- interaction affordances and accessibility;
- motion and reduced-motion behavior;
- anti-pattern filtering and visual QA.

Its priority is explicit:

```text
1. User requirements
2. Skill-specific hard constraints
3. Shared design intelligence
4. Referenced guidance / examples
```

The design layer is an AzSkills synthesis informed by the public methodology of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). It retains transferable design reasoning without importing the upstream plugin, provider-specific tooling, or generated data library.

---

## → How Skills are authored

A Skill is treated as a small specification, not as a magic prompt.

Typical structure:

```markdown
---
name: my-skill
description: ...
---

# My Skill

## Scope

## Workflow

## Constraints

## Verification

## Output contract
```

The important part is the contract around the instructions. Useful Skills make trigger conditions, constraints, quality gates, and boundaries explicit enough that another person can audit them without reverse-engineering the author's intent.

### Modes, references, and shared rules

AzSkills uses different packaging levels for different kinds of reuse:

| Need | Preferred form |
| :--- | :--- |
| Distinct task domain | New Skill |
| Narrow workflow variation | Mode inside an existing Skill |
| Reusable deep guidance | Reference file |
| Cross-domain visual rules | `design-intelligence.md` |
| Implementation support | Skill-local scripts / templates / assets |

---

## 🚀 Installation

AzSkills does not require a repository-wide build step. Install only the Skill directories relevant to your agent or workflow.

### Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Select

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

### Register with your agent

Copy or link the selected Skill directory into the skill-discovery location used by your AI agent or development environment. Keep `SKILL.md` with the support files it references.

There is intentionally no single universal installation directory: discovery conventions differ between agent frameworks.

---

## 🧭 Choosing and composing Skills

Use the smallest set that completely describes the work.

```text
                         ┌─ logo / identity ──────► logo-generator
                         │       └─ character/IP ─► ip-as-logo
                         │
                         ├─ photo abstraction ────► photo-abstract-editorial
                         ├─ README / docs ────────► readme-craft
                         ├─ presentation ─────────► frontend-slides
User task ───────────────┼─ localization ────────► l13n
                         ├─ translation ──────────► any2zh / zh2en
                         ├─ Steam Mod copy ──────► steam-mod-page
                         ├─ AutoHotkey v2 ───────► ahkv2-opt
                         │
                         └─ complex engineering ─► ultrathink + task Skill
```

For visual work, apply the shared design intelligence automatically. It is a supporting layer, not a second Skill the user needs to invoke.

### Example: README work

A typical README task uses:

```text
readme-craft
   │
   ├─ design-intelligence.md
   │
   └─ readme-craft/references/* (when needed)
```

A visual identity task can similarly use:

```text
logo-generator
   │
   └─ design-intelligence.md
```

Complex engineering documentation can combine task-specific and reasoning Skills when their responsibilities are genuinely separate.

---

## ◈ Quality principles

AzSkills treats its own Skills as maintained engineering artifacts.

### Explicit contracts

Triggers, workflow steps, constraints, quality gates, and output expectations should be readable in Markdown.

### Real evidence

When a Skill is used to document or present a real project, prefer real outputs, screenshots, commands, diagrams, and repository artifacts over decorative claims.

### Searchable technical information

Commands, configuration, limitations, APIs, compatibility notes, and other copyable information stay in Markdown instead of being trapped inside images.

### Small-size and realistic rendering

Visual assets are judged at realistic output sizes, not only at their source dimensions. SVGs should remain usable at both wide GitHub content widths and narrow previews.

### Controlled synthesis

When external public Skills overlap with an existing AzSkills capability, merge useful behavior into the narrowest existing home when that produces a clearer contract. Preserve independent scopes when the responsibilities are genuinely different.

### Provenance matters

Adapted public methodologies are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). AzSkills does not pretend that upstream ideas originated here.

---

## 📁 Repository structure

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

The Skills badge is generated automatically by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so the displayed Skill count is derived from the repository rather than maintained by hand.

---

## 🤝 Contributing

A useful contribution should add a clear capability, materially improve an existing workflow, fix a concrete problem, or reduce unnecessary complexity.

Before creating a new top-level Skill, check whether the behavior belongs in an existing Skill as a mode, reference, or shared rule.

New Skills should have:

- a distinct scope;
- clear trigger conditions;
- explicit constraints;
- a concrete workflow;
- meaningful verification rules;
- a defined output contract.

For imported public methodologies, update [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) with provenance and applicable licensing information.

Keep changes focused and easy to audit.

---

## 📄 License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · reusable rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
