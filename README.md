<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — Modular AI Skills for Real Work" width="100%">

### A focused collection of reusable AI skills for development, translation, localization, documentation, presentations, and specialized content workflows.

<p>
  <a href="#-overview">Overview</a> •
  <a href="#-skill-catalog">Skill Catalog</a> •
  <a href="#-installation--setup">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-contributing--feedback">Contributing</a>
</p>

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="License">
</p>

</div>

---

## 📖 Overview

**AzSkills** is a lightweight collection of reusable **AI agent skill definitions**. Each skill is isolated in its own directory and centered around a `SKILL.md` specification, making the repository easy to inspect, copy, version, and extend.

The current collection covers AutoHotkey v2 engineering, multilingual translation, game localization, README engineering, HTML presentation generation, Steam Mod page writing, deep engineering craftsmanship, and Chinese-to-English conversational translation.

AzSkills is intentionally modular: use one skill independently, combine several skills in a workflow, or add a new skill without changing the existing definitions.

> **Design principle:** one directory, one purpose, one clearly defined behavior contract.

## ✨ Core Features

| Capability | What it provides |
| :--- | :--- |
| **Modular skill definitions** | Each capability lives in a self-contained `SKILL.md` or a clearly defined modular skill package. |
| **Explicit behavior contracts** | Trigger conditions, standards, workflows, and output rules are documented directly in each skill. |
| **Development standards** | `ahkv2-opt` provides concrete AutoHotkey v2 refactoring, performance, UI, state-management, and testing guidance. |
| **Engineering craftsmanship** | `ultrathink` adds assumption-checking, architecture planning, adversarial review, iterative refinement, and simplification for complex engineering work. |
| **Localization workflows** | `l13n` defines a structured 13-language CSV localization workflow with terminology, escaping, and BBCode preservation rules. |
| **Documentation tooling** | `readme-craft` defines README structure, visual direction, SVG requirements, feature presentation, and project-type adaptations. |
| **Presentation generation** | `frontend-slides` provides fixed-stage 16:9 HTML presentation generation, design systems, animation guidance, PowerPoint extraction, and quality auditing. |
| **Steam Mod publishing** | `steam-mod-page` generates structured Chinese/English Steam-style Mod descriptions and change logs while preserving required BBCode structure. |
| **Language-aware translation** | `any2zh` and `zh2en` preserve intent, tone, formatting, and technical context instead of relying on literal conversion. |

---

## 🧩 Skill Catalog

### 🛠️ `ahkv2-opt`

**AHK v2 Code Optimization & Standardization**

A rule-driven engineering skill for refactoring and reviewing AutoHotkey v2 code. It covers file and function size limits, control-flow simplification, state management, hotkey design, timer behavior, data structures, `DllCall` usage, GUI performance, memory management, and testing.

[Open `ahkv2-opt`](ahkv2-opt/SKILL.md)

### 🧠 `ultrathink`

**Deep Engineering Craftsmanship Methodology**

A craftsmanship-oriented skill for complex engineering tasks. It explicitly questions assumptions before implementation, maps architecture and constraints, designs from the caller's perspective, scrutinizes naming and abstractions, considers edge cases, runs tests, compares alternatives, and iterates beyond the first working solution. It also emphasizes ruthless simplification and avoiding premature abstraction.

The skill was imported from [HaydenLundin/ultrathink](https://github.com/HaydenLundin/ultrathink) and retains the upstream MIT license in [`ultrathink/LICENSE`](ultrathink/LICENSE).

[Open `ultrathink`](ultrathink/SKILL.md)

### 🎞️ `frontend-slides`

**Animation-Rich HTML Presentation Generation**

A presentation-focused skill adapted from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides). It provides a fixed 1920×1080 stage model, visual style discovery, presentation architecture, a reusable design system, animation patterns, typography guidance, PowerPoint-to-web extraction, and automated quality auditing for overflow, overlap, and layout issues.

The integration includes the core skill plus the supporting files it directly depends on. The upstream MIT license is preserved in [`frontend-slides/LICENSE`](frontend-slides/LICENSE).

[Open `frontend-slides`](frontend-slides/SKILL.md) · [View design system](frontend-slides/DESIGN_SYSTEM.md) · [View quality auditor](frontend-slides/scripts/quality_audit.py)

### 🌐 `any2zh`

**Multilingual Translation to Chinese**

A general-purpose translation skill for converting content from major world languages into natural Chinese while preserving meaning, tone, terminology, formatting, and culturally specific expressions.

[Open `any2zh`](any2zh/SKILL.md)

### 🎮 `l13n`

**13-Language Game Localization**

A structured localization workflow for game CSV data. It enforces the fixed language schema, translation consistency, BBCode preservation, CSV escaping, and complete coverage across all supported locales.

[Open `l13n`](l13n/SKILL.md)

### 📝 `readme-craft`

**Professional README Generation**

A visual-first documentation skill for creating structured, polished README files. It defines Hero composition, dark-theme styling, SVG asset generation, feature presentation, project-type adaptation, and GitHub-friendly documentation patterns.

[Open `readme-craft`](readme-craft/SKILL.md)

### 🛒 `steam-mod-page`

**Steam Mod Page Writing**

A specialized writing skill for producing Steam Workshop / Mod Store descriptions and change logs. It enforces a defined four-part structure, Chinese/English correspondence, BBCode hierarchy, practical wording, and strict avoidance of invented Mod features.

[Open `steam-mod-page`](steam-mod-page/SKILL.md)

### 💬 `zh2en`

**Chinese-to-English Conversational Translation**

A chat-focused translation skill for turning informal, slang-heavy, or context-dependent Chinese messages into natural English suitable for everyday conversation, work, gaming, and social communication.

[Open `zh2en`](zh2en/SKILL.md)

---

## 🚀 Installation & Setup

AzSkills is a collection of skill definitions rather than a standalone executable application. There is no repository-wide build step.

### Clone the repository

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Select a skill

Choose the directory that matches the task you want to support:

```text
ahkv2-opt/
any2zh/
frontend-slides/
l13n/
readme-craft/
steam-mod-page/
ultrathink/
zh2en/
```

### Register the skill with your agent

Copy or link the selected skill directory into the skill-discovery location used by your AI agent or development environment. A simple skill is defined by its `SKILL.md`; skills with supporting files should keep those files together.

For `frontend-slides`, keep these files together:

```text
frontend-slides/
├── SKILL.md
├── DESIGN_SYSTEM.md
├── STYLE_PRESETS.md
├── viewport-base.css
├── html-template.md
├── animation-patterns.md
├── LICENSE
└── scripts/
    ├── extract-pptx.py
    └── quality_audit.py
```

> **Note:** Skill discovery paths vary between agent frameworks. Keep the directory name, `SKILL.md`, and any referenced support files together when integrating a skill.

---

## 📚 Usage

Each skill is designed to be invoked by matching its purpose, trigger conditions, and documented workflow.

An AutoHotkey v2 refactoring task can load `ahkv2-opt`. A documentation workflow can use `readme-craft`. A localization workflow can apply `l13n` to a structured CSV without changing its schema. `frontend-slides` can be loaded for building, converting, or enhancing HTML presentations. `steam-mod-page` can be loaded when creating Steam Workshop-style Mod copy or change logs. `any2zh` and `zh2en` handle different translation directions and conversational contexts. For complex implementation or architectural refactoring, `ultrathink` can be combined with another task-specific skill.

### Skill selection

Use the smallest set of skills that fully covers the task. Do not load unrelated skills simply because they are available.

```text
User task
   │
   ▼
Identify task domain
   │
   ▼
Select the narrowest matching skill
   │
   ▼
Read SKILL.md
   │
   ▼
Load referenced support files when needed
   │
   ▼
Apply the documented workflow and constraints
   │
   ▼
Run relevant quality checks
   │
   ▼
Produce task-specific output
```

When multiple rules apply, use this precedence order:

```text
1. Explicit user requirements
2. Skill core rules in SKILL.md
3. Most specific referenced support rules
4. Reusable examples / templates
```

The skills are deliberately explicit so an agent can inspect the rules before acting instead of depending on undocumented conventions.

---

## 🧠 Implementation Highlights

### Self-contained specifications

Every skill is packaged as a readable Markdown specification with frontmatter, purpose, workflows, and enforcement rules. This keeps the skill portable and easy to review.

### Constraint-driven workflows

The skills do more than describe goals. They define concrete constraints such as code-size limits, output schemas, formatting preservation, terminology requirements, fixed slide dimensions, BBCode structure, and verification rules.

### Specialized rather than monolithic

AzSkills does not try to create one universal prompt. Specialized skills can be selected independently and combined only when their responsibilities overlap in a useful way.

### Human-readable by design

Because the core artifact is Markdown, developers can audit, edit, review, and version-control the rules without a separate authoring toolchain.

---

## 📁 Project Structure

```tree
AzSkills/
├── 📁 .github/
│   ├── 📁 badges/
│   │   └── 📄 skills.json
│   └── 📁 workflows/
│       └── ⚙️ update-skill-badge.yml
├── 📁 ahkv2-opt/
│   └── 📄 SKILL.md
├── 📁 any2zh/
│   └── 📄 SKILL.md
├── 📁 frontend-slides/
│   ├── 📄 SKILL.md
│   ├── 📄 DESIGN_SYSTEM.md
│   ├── 📄 STYLE_PRESETS.md
│   ├── 📄 viewport-base.css
│   ├── 📄 html-template.md
│   ├── 📄 animation-patterns.md
│   ├── ⚖️ LICENSE
│   └── 📁 scripts/
│       ├── 🐍 extract-pptx.py
│       └── 🐍 quality_audit.py
├── 📁 l13n/
│   └── 📄 SKILL.md
├── 📁 readme-craft/
│   ├── ⚖️ LICENSE
│   └── 📄 SKILL.md
├── 📁 steam-mod-page/
│   └── 📄 SKILL.md
├── 📁 ultrathink/
│   ├── ⚖️ LICENSE
│   └── 📄 SKILL.md
├── 📁 zh2en/
│   └── 📄 SKILL.md
├── 📁 assets/
│   └── 🖼️ azskills-hero.svg
├── ⚖️ LICENSE
└── 📖 README.md
```

---

## 🛡️ Design & Maintenance Principles

AzSkills follows a few simple maintenance rules:

1. Keep each skill focused on a clearly bounded responsibility.
2. Keep operational rules inside the corresponding `SKILL.md` rather than scattering them across the repository.
3. Prefer explicit workflows and output contracts over vague behavioral descriptions.
4. Keep documentation and examples aligned with the actual skill definition.
5. Preserve the existing directory-level naming convention when adding new skills.
6. Preserve third-party skill licensing and attribution when importing an external skill.
7. Keep referenced support files next to the skill whenever the skill depends on them.
8. When a skill develops stable task-specific branches, prefer focused support files over an increasingly monolithic `SKILL.md`.
9. Remove documentation references to retired skills immediately so the README remains an accurate index of the repository.

The Skills badge is generated from the repository's actual `SKILL.md` files by GitHub Actions. The License badge is read directly from the repository's GitHub license metadata.

---

## 🤝 Contributing & Feedback

Contributions are welcome, especially improvements that make a skill more precise, reusable, or easier for agents to follow.

When adding a skill, include a concise frontmatter definition, clear trigger conditions, explicit workflow rules, practical examples where useful, and a scope that does not overlap unnecessarily with existing skills. When importing an external skill, preserve its applicable license and attribution information.

When a skill contains multiple stable task types, consider using a modular structure with a small core `SKILL.md` and focused supporting files. Document any loading strategy and rule precedence so agents do not need to load unrelated material.

For bug reports, describe the affected skill, the input that triggered the problem, the expected behavior, and the observed behavior.

---

## 📄 License

AzSkills is released under the **MIT License**.

See [`LICENSE`](LICENSE) for the complete license text. Individual imported skills may retain additional upstream licensing notices where required; see the corresponding skill directory for details.

---

## 💰 Support the Author

If AzSkills improves your development or documentation workflow, consider supporting the project.

<div align="center">
  <a href="https://cyojkoy.github.io/Payment/">
    <img src="https://img.shields.io/badge/Click_Here_to_Support_Me-9E8F7E?style=for-the-badge&logo=buy-me-a-coffee&logoColor=BEB8AE" alt="Support the Author">
  </a>
</div>

<div align="center">
  <br>
  <i>Built as a modular toolkit for AI-assisted work.</i>
</div>

---

<div align="center">

**AzSkills** · Modular AI Skills for Real Work

</div>
