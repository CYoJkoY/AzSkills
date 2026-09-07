<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — a modular AI skill library spanning engineering, translation, localization, documentation, and visual workflows" width="100%">

# AzSkills

Reusable AI skills with explicit behavior contracts.

Small, composable, human-readable `SKILL.md` definitions for real development and content workflows.

<p>
  <a href="#-start-here">Start here</a> ·
  <a href="#-skills">Skills</a> ·
  <a href="#-how-it-works">How it works</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-contributing">Contributing</a>
</p>

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="11 skills">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
</p>

</div>

---

## ✦ Start here

**AzSkills is a library, not a framework or executable.** Each capability is packaged as an isolated Skill with a readable `SKILL.md`, so an agent can load only the rules needed for the task at hand.

| You need to… | Start with |
| :--- | :--- |
| Refactor or optimize AutoHotkey v2 | [`ahkv2-opt`](ahkv2-opt/SKILL.md) |
| Handle a complex engineering task | [`ultrathink`](ultrathink/SKILL.md) |
| Build an HTML presentation | [`frontend-slides`](frontend-slides/SKILL.md) |
| Design a logo or identity system | [`logo-generator`](logo-generator/SKILL.md) |
| Create a compact character/IP mark | [`ip-as-logo`](ip-as-logo/SKILL.md) |
| Create a photo-preserving editorial composition | [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) |
| Translate into natural Chinese | [`any2zh`](any2zh/SKILL.md) |
| Localize a game CSV into 13 languages | [`l13n`](l13n/SKILL.md) |
| Redesign a GitHub README | [`readme-craft`](readme-craft/SKILL.md) |
| Write a Steam Workshop / Mod page | [`steam-mod-page`](steam-mod-page/SKILL.md) |
| Translate Chinese chat into natural English | [`zh2en`](zh2en/SKILL.md) |

> **Rule of use:** load the smallest set of Skills that completely covers the task. Combine Skills only when their responsibilities genuinely overlap.

## What makes AzSkills different

AzSkills focuses on **behavior contracts**, not giant prompt collections. A Skill should tell an agent when it applies, what constraints matter, how to execute the work, what quality checks to perform, and what output is expected.

The repository also uses a **shared design-intelligence layer** for visual work. Common decisions about hierarchy, typography, color, spacing, composition, accessibility, motion, density, and visual QA live in one place instead of being copied into every visual Skill.

The result is a deliberately small architecture:

```text
                 ┌─────────────────────┐
                 │      AzSkills       │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
      Task-specific Skills        Shared design intelligence
              │                           │
   ┌──────────┼──────────┐                │
   │          │          │                │
Engineering  Content    Visual  ◄─────────┘
   │          │          │
   └──────────┼──────────┘
              │
              ▼
          Task output
```

---

## ◆ Skills

### Engineering

**[`ahkv2-opt`](ahkv2-opt/SKILL.md)** — AutoHotkey v2 refactoring and standardization. Covers code size limits, control flow, state management, timers, hotkeys, data structures, `DllCall`, GUI performance, memory behavior, and testing.

**[`ultrathink`](ultrathink/SKILL.md)** — deep engineering craftsmanship for difficult implementation and refactoring work. It emphasizes assumption checks, architecture mapping, caller-oriented design, naming and abstraction review, edge cases, tests, alternatives, and simplification.

### Presentation & visual design

**[`frontend-slides`](frontend-slides/SKILL.md)** — fixed 1920×1080 HTML presentations with presentation architecture, reusable design systems, animation patterns, PowerPoint extraction, and quality auditing. It inherits the shared design-intelligence layer.

**[`logo-generator`](logo-generator/SKILL.md)** — general logo and visual-identity production: concept routes, minimalist B/W exploration, SVG marks, wordmarks, mascots, colorways, identity boards, showcase layouts, small-size checks, and targeted revision.

**[`ip-as-logo`](ip-as-logo/SKILL.md)** — specialized compact character/IP marks with dominant silhouettes, restrained color, and small-size recognition rules.

**[`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)** — photo-faithful editorial transformation that derives a restrained abstract panel from the source image instead of inventing unrelated visual content.

### Documentation & publishing

**[`readme-craft`](readme-craft/SKILL.md)** — project-native GitHub README design. It covers first-screen information architecture, proof-first storytelling, GitHub-safe SVGs, render-size checks, asset organization, visual direction, accessibility, and maintenance-aware documentation.

**[`steam-mod-page`](steam-mod-page/SKILL.md)** — structured Steam Workshop / Mod Store copy and change logs with Chinese/English correspondence, BBCode discipline, practical wording, and strict feature accuracy.

### Language & localization

**[`any2zh`](any2zh/SKILL.md)** — multilingual translation into natural Chinese while preserving intent, tone, terminology, formatting, and technical context.

**[`l13n`](l13n/SKILL.md)** — structured 13-language game localization for CSV data, including schema consistency, terminology, BBCode preservation, CSV escaping, and locale completeness.

**[`zh2en`](zh2en/SKILL.md)** — Chinese-to-English conversational translation for informal, context-dependent messages across work, gaming, and everyday communication.

---

## ◇ Shared design intelligence

[`design-intelligence.md`](design-intelligence.md) is **not** another Skill. It is a cross-cutting visual foundation inherited by Skills that change how an artifact looks, feels, moves, or is interacted with.

It provides a common decision framework for:

- visual thesis before implementation;
- context-driven style selection;
- typography hierarchy and semantic color roles;
- composition, spacing, geometry, and information density;
- interaction affordances and accessibility;
- motion and reduced-motion considerations;
- anti-pattern filtering and final visual quality audits.

The layer is an AzSkills synthesis informed by the public methodology of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). AzSkills keeps the transferable design reasoning while avoiding provider-specific scripts, generated databases, and unrelated upstream implementation details.

### Inheritance rule

```text
1. Explicit user requirements
2. Skill-specific hard constraints
3. Shared design intelligence
4. Referenced guidance / examples
```

Visual Skills inherit the shared layer automatically; users do not need to invoke a separate UI/UX Skill.

---

## → How it works

The repository is intentionally boring to integrate.

```text
Task
  │
  ▼
Identify the narrowest matching Skill
  │
  ▼
Read SKILL.md
  │
  ├── load referenced support files when needed
  │
  ├── combine another Skill only when useful
  │
  └── inherit design intelligence for visual work
  │
  ▼
Apply workflow + constraints
  │
  ▼
Run the relevant quality checks
  │
  ▼
Produce task-specific output
```

A simple Skill can be as small as:

```text
my-skill/
└── SKILL.md
```

More involved Skills may include references, templates, design systems, scripts, or source assets, but those supporting files stay next to the Skill that owns them.

---

## 🚀 Installation

### 1. Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### 2. Pick a Skill

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

`design-intelligence.md` is a shared reference and is not counted as an independent Skill.

### 3. Register it with your agent

Copy or link the selected Skill directory into the skill-discovery location used by your AI agent or development environment. Keep `SKILL.md` together with any referenced support files.

Skill discovery paths vary by agent framework, so AzSkills intentionally does not prescribe one universal installation directory.

---

## 🧭 Skill selection

Use the narrowest matching capability first, then compose only where it adds real value.

```text
                    ┌─ Logo / identity ────────► logo-generator
                    │       └─ character/IP ───► ip-as-logo
                    │
                    ├─ Photo abstraction ──────► photo-abstract-editorial
                    ├─ README / docs ──────────► readme-craft
User task ──────────┼─ HTML presentation ──────► frontend-slides
                    ├─ Game localization ──────► l13n
                    ├─ Translation ────────────► any2zh / zh2en
                    ├─ Steam Mod copy ────────► steam-mod-page
                    ├─ AutoHotkey v2 ─────────► ahkv2-opt
                    │
                    └─ Complex engineering ───► ultrathink + task Skill
```

For visual tasks, the shared design-intelligence layer is applied automatically.

---

## ◇ Why the repository stays modular

### Explicit contracts

Skills document triggers, standards, workflows, constraints, quality gates, and output expectations directly in Markdown.

### Composable by design

There is no universal “do everything” prompt. Narrow capabilities remain easier to load, audit, revise, and reuse.

### Shared knowledge without duplication

Cross-domain visual reasoning belongs in `design-intelligence.md`; domain-specific behavior remains inside the relevant Skill.

### Curated synthesis

When several public Skills solve overlapping problems, AzSkills prefers one coherent capability over redundant top-level copies. Narrower workflows become explicit modes; unrelated capabilities remain independent.

### Human-readable and reviewable

The core artifacts are ordinary Markdown and repository-local files. A developer can inspect the rules, change them, review the diff, and version them with Git.

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

The Skill count badge is generated automatically by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so changing the number of `SKILL.md` files does not require manual badge maintenance.

---

## 🔎 Design & documentation principles

AzSkills treats a repository homepage and its Skills as interfaces.

For documentation and visual work, the project prefers:

**Project-native direction** over generic templates. Derive visual language from the product, its existing assets, its audience, and the task.

**Real proof** over decorative claims. Use actual outputs, screenshots, commands, diagrams, and repository artifacts whenever they explain the project better.

**Searchable Markdown** for instructions and technical detail. Use SVG or raster assets for visual communication rather than turning the entire README into an image.

**Conservative GitHub rendering.** Visual assets should survive wide and narrow layouts, use repository-relative paths, remain accessible, and avoid fragile browser-specific behavior.

The detailed README production rules live in [`readme-craft/SKILL.md`](readme-craft/SKILL.md), with the integrated reference at [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md).

---

## 🤝 Contributing

A good contribution should add a **clear capability**, not merely another prompt variant.

Before adding a Skill, check whether the behavior belongs in an existing Skill as a mode, reference, or shared rule. New top-level Skills should have a distinct scope and a concrete output contract.

For visual Skills, prefer deterministic and repository-local assets. For imported public methodologies, record provenance and licensing information in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep changes focused, readable, and easy to audit.

## 📄 License & provenance

AzSkills itself is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · modular rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
