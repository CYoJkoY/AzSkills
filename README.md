<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — a modular library of reusable AI skills for engineering, content, localization, translation, and visual workflows" width="100%">

# AzSkills

**Reusable AI skills with explicit behavior contracts.**

Small, composable, human-readable `SKILL.md` definitions for real development and content workflows.

<p>
  <a href="#-start-here">Start here</a> ·
  <a href="#-skill-catalog">Skill catalog</a> ·
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

**AzSkills is a library, not a framework or executable.** Each capability is packaged as an isolated Skill centered on a readable `SKILL.md`. Load only what the task needs, combine Skills when their responsibilities genuinely overlap, and keep the resulting workflow inspectable.

| Task | Skill |
| :--- | :--- |
| Refactor or optimize AutoHotkey v2 | [`ahkv2-opt`](ahkv2-opt/SKILL.md) |
| Reason through a complex engineering task | [`ultrathink`](ultrathink/SKILL.md) |
| Build an HTML presentation | [`frontend-slides`](frontend-slides/SKILL.md) |
| Design a general logo or identity system | [`logo-generator`](logo-generator/SKILL.md) |
| Create a compact character/IP mark | [`ip-as-logo`](ip-as-logo/SKILL.md) |
| Turn a supplied photo into an abstract editorial composition | [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) |
| Translate content into natural Chinese | [`any2zh`](any2zh/SKILL.md) |
| Localize game CSV data into 13 languages | [`l13n`](l13n/SKILL.md) |
| Design or redesign a GitHub README | [`readme-craft`](readme-craft/SKILL.md) |
| Write a Steam Workshop / Mod page | [`steam-mod-page`](steam-mod-page/SKILL.md) |
| Translate Chinese chat into natural English | [`zh2en`](zh2en/SKILL.md) |

> **Selection rule:** choose the narrowest Skill that completely covers the task. Add another Skill only when it contributes a distinct responsibility.

## What AzSkills is built around

AzSkills is designed around **behavior contracts**, not giant prompt collections.

A useful Skill should define when it applies, what constraints matter, how the work should be executed, what quality checks are required, and what output is expected. The goal is to turn tacit working knowledge into reusable, versioned instructions.

The repository intentionally keeps three layers separate:

```text
                    AzSkills
                       │
         ┌─────────────┴─────────────┐
         │                           │
   Task-specific Skills      Shared design intelligence
         │                           │
   ┌─────┼─────┐                     │
   │     │     │                     │
Engineering Content Visual ◄─────────┘
   │     │     │
   └─────┼─────┘
         │
         ▼
     Task output
```

Task-specific rules remain inside their Skills. [`design-intelligence.md`](design-intelligence.md) is a shared visual foundation rather than another Skill, so visual reasoning can stay consistent without duplicating the same rules across multiple domains.

---

## ◆ Skill catalog

### Engineering

#### [`ahkv2-opt`](ahkv2-opt/SKILL.md)

**AutoHotkey v2 optimization and standardization.**

A rule-driven engineering workflow for refactoring and reviewing AutoHotkey v2 code. It covers file/function size, control flow, state management, hotkeys, timers, data structures, `DllCall`, GUI performance, memory behavior, and testing.

#### [`ultrathink`](ultrathink/SKILL.md)

**Deep engineering craftsmanship for difficult implementation work.**

A methodology for complex engineering and refactoring tasks. It emphasizes assumption checking, architecture mapping, caller-oriented design, naming and abstraction review, edge cases, tests, alternative evaluation, and simplification beyond the first working solution.

### Presentation & visual design

#### [`frontend-slides`](frontend-slides/SKILL.md)

**Animation-rich HTML presentation generation.**

A fixed 1920×1080 presentation workflow with visual style discovery, presentation architecture, design-system construction, animation patterns, typography guidance, PowerPoint extraction, and quality auditing. Visual work inherits the shared design-intelligence layer automatically.

#### [`logo-generator`](logo-generator/SKILL.md)

**General logo and visual-identity production.**

Covers concept development, black-and-white exploration, SVG marks, wordmarks, mascot routes, colorways, identity-system boards, showcase layouts, small-size testing, and targeted revision.

#### [`ip-as-logo`](ip-as-logo/SKILL.md)

**Character-led IP and mascot marks.**

A narrower logo workflow for extremely simplified character/IP symbols, emphasizing dominant silhouette, restrained color, and recognition at small sizes.

#### [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

**Photo-preserving abstract editorial composition.**

Keeps an uploaded photograph faithful while deriving a sparse abstract panel from its observed spatial, tonal, and color relationships. It is intentionally separate from logo generation.

### Documentation & publishing

#### [`readme-craft`](readme-craft/SKILL.md)

**Project-native GitHub README engineering.**

Treats the repository homepage as a readable visual interface. It covers first-screen clarity, proof-first storytelling, GitHub-safe SVGs, responsive render-size checks, asset organization, visual direction, accessibility, motion policy, and maintenance-aware documentation.

This README is itself an example of that Skill in use.

#### [`steam-mod-page`](steam-mod-page/SKILL.md)

**Steam Workshop / Mod Store writing.**

Generates structured Chinese/English Mod descriptions and change logs with BBCode discipline, practical wording, and strict avoidance of invented features.

### Language & localization

#### [`any2zh`](any2zh/SKILL.md)

**Multilingual translation into natural Chinese.**

Preserves meaning, tone, terminology, formatting, and technical context across major source languages instead of performing literal word replacement.

#### [`l13n`](l13n/SKILL.md)

**13-language game localization.**

A structured CSV localization workflow with fixed schema requirements, terminology consistency, BBCode preservation, CSV escaping, and complete locale coverage.

#### [`zh2en`](zh2en/SKILL.md)

**Chinese-to-English conversational translation.**

Converts informal, slang-heavy, and context-dependent Chinese into natural English for everyday communication, work, gaming, and social contexts.

---

## ◇ Shared design intelligence

[`design-intelligence.md`](design-intelligence.md) is a **cross-cutting reference layer**, not a top-level Skill.

When a task changes how an artifact **looks, feels, moves, or is interacted with**, the shared layer supplies common decisions for visual thesis formation, context-driven style selection, typography hierarchy, semantic color roles, composition, spacing, information density, accessibility, motion, anti-pattern filtering, and visual QA.

Its precedence is deliberate:

```text
1. Explicit user requirements
2. Skill-specific hard constraints
3. Shared design intelligence
4. Referenced guidance and examples
```

The layer is an AzSkills synthesis informed by the public methodology of [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). It keeps transferable design reasoning without vendoring the upstream plugin, searchable data library, generated examples, or provider-specific tooling.

---

## → How it works

The integration model is intentionally simple:

```text
Task
  │
  ▼
Identify the narrowest matching Skill
  │
  ▼
Read SKILL.md
  │
  ├── load references/support files when needed
  ├── combine Skills only when responsibilities overlap
  └── inherit design intelligence for visual work
  │
  ▼
Apply workflow + constraints
  │
  ▼
Run relevant quality checks
  │
  ▼
Produce task-specific output
```

A minimal Skill can be only:

```text
my-skill/
└── SKILL.md
```

More involved Skills may own references, templates, scripts, design systems, or source assets. Those supporting materials stay with the Skill that defines their behavior.

---

## 🚀 Installation

AzSkills is a collection of definitions and supporting files. There is no repository-wide runtime or build step.

### Clone the repository

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Select a Skill

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

### Register it with your agent

Copy or link the selected Skill directory into the skill-discovery location used by your AI agent or development environment. Keep `SKILL.md` together with every support file it references.

Discovery paths differ between agent frameworks, so AzSkills intentionally does not prescribe a single universal installation directory.

---

## 🧭 Skill selection

Start narrow and compose only when needed.

```text
User task
   │
   ├─ AutoHotkey v2 ───────────────► ahkv2-opt
   ├─ Complex engineering ─────────► ultrathink + task Skill
   ├─ Presentation ────────────────► frontend-slides
   ├─ Logo / identity ─────────────► logo-generator
   │      └─ character/IP ─────────► ip-as-logo
   ├─ Photo + editorial abstraction ► photo-abstract-editorial
   ├─ README / documentation ──────► readme-craft
   ├─ Game localization ───────────► l13n
   ├─ Translation ──────────────────► any2zh / zh2en
   └─ Steam Mod copy ───────────────► steam-mod-page
```

For visual tasks, the shared design-intelligence layer is inherited automatically.

---

## ◇ Why the repository stays modular

### Explicit contracts

Skills document triggers, standards, workflows, constraints, quality gates, and output expectations directly in Markdown.

### Composable capabilities

There is no universal “do everything” prompt. Smaller capabilities are easier to load, audit, revise, test, and reuse.

### Shared knowledge without duplication

Cross-domain visual reasoning belongs in `design-intelligence.md`; domain-specific behavior remains authoritative inside the relevant Skill.

### Curated synthesis

When several public Skills overlap, AzSkills prefers one coherent capability over redundant top-level copies. Narrower workflows become explicit modes; unrelated capabilities remain independent.

### Human-readable by default

The core artifacts are ordinary Markdown and repository-local files. A developer can inspect the rules, edit them, review the diff, and version them with Git.

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

The Skill count badge is generated by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so the number of Skills is derived from the repository rather than manually maintained.

---

## 🔎 Documentation principles

AzSkills uses the same standards it teaches other projects.

**Project-native over template-first.** Visual direction should come from the actual product, audience, existing assets, and communication job.

**Proof over decoration.** Real outputs, examples, commands, screenshots, and repository artifacts are more valuable than unsupported claims or decorative graphics.

**Searchable Markdown for technical information.** Installation, commands, configuration, limitations, APIs, and other copyable facts stay in Markdown instead of being trapped inside images.

**Conservative rendering.** Visual assets should survive GitHub's realistic wide and narrow content widths, use repository-local paths where possible, remain accessible, and avoid fragile browser-specific behavior.

For the full README production workflow, see [`readme-craft/SKILL.md`](readme-craft/SKILL.md) and [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md).

---

## 🤝 Contributing

Good contributions add a **clear capability**, improve an existing workflow, fix a concrete defect, or reduce unnecessary complexity.

Before adding a new top-level Skill, check whether the behavior belongs in an existing Skill as a mode, reference, or shared rule. New Skills should have a distinct scope, clear trigger conditions, and a concrete output contract.

For imported public methodologies, document provenance and applicable licensing information in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep diffs focused, readable, and easy to audit.

---

## 📄 License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · modular rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
