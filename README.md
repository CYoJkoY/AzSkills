<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — Modular AI Skills for Real Work" width="100%">

### A focused collection of reusable AI skills for development, translation, localization, documentation, presentations, creative production, and engineering craftsmanship.

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

The collection covers AHK v2 engineering, multilingual translation, game localization, README engineering, Chinese-to-English conversational translation, HTML presentation generation, deep engineering craftsmanship, and Brotato-inspired 2D game art production.

AzSkills is intentionally modular: use one skill independently, combine several skills in a workflow, or add your own skill without changing the existing definitions.

> **Design principle:** one directory, one purpose, one clearly defined behavior contract.

## ✨ Core Features

| Capability | What it provides |
| :--- | :--- |
| **Modular skill definitions** | Each capability lives in a self-contained `SKILL.md` or a clearly defined modular skill package. |
| **Explicit behavior contracts** | Trigger conditions, standards, workflows, and output rules are documented directly in each skill. |
| **Development standards** | AHK v2 guidance includes code-size limits, control-flow rules, performance practices, UI optimization, and testing guidance. |
| **Engineering craftsmanship** | `ultrathink` adds assumption-checking, architecture planning, adversarial review, iterative refinement, and simplification for complex engineering work. |
| **Localization workflows** | CSV-oriented localization rules cover 13 language columns, escaping, terminology, and BBCode integrity. |
| **Documentation tooling** | `readme-craft` defines README structure, visual direction, SVG requirements, feature presentation, and project-type adaptations. |
| **Presentation generation** | `frontend-slides` provides fixed-stage 16:9 HTML presentation generation, visual style discovery, animation guidance, and PowerPoint extraction. |
| **Game art production** | `brotato-art` provides a modular visual system for characters, weapons, items, enemies, effects, UI, cursors, and sprite animations. |
| **Language-aware translation** | Translation skills preserve intent, tone, formatting, and technical context instead of relying on literal conversion. |

---

## 🧩 Skill Catalog

### 🛠️ `ahkv2-opt`

**AHK v2 Code Optimization & Standardization**

A rule-driven engineering skill for refactoring and reviewing AutoHotkey v2 code. It covers file and function size limits, control-flow simplification, state management, hotkey design, timer behavior, data structures, DllCall usage, GUI performance, memory management, and testing.

[Open `ahkv2-opt`](ahkv2-opt/SKILL.md)

### 🧠 `ultrathink`

**Deep Engineering Craftsmanship Methodology**

A craftsmanship-oriented skill for complex engineering tasks. It explicitly questions assumptions before implementation, maps architecture and constraints, designs from the caller’s perspective, scrutinizes naming and abstractions, considers edge cases, runs tests, compares alternatives, and iterates beyond the first working solution. It also emphasizes ruthless simplification and avoiding premature abstraction.

The skill was imported from [HaydenLundin/ultrathink](https://github.com/HaydenLundin/ultrathink) and retains the upstream MIT license in [`ultrathink/LICENSE`](ultrathink/LICENSE).

[Open `ultrathink`](ultrathink/SKILL.md)

### 🎞️ `frontend-slides`

**Animation-Rich HTML Presentation Generation**

A presentation-focused skill adapted from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides). It provides a fixed 1920×1080 stage model, visual style discovery, presentation architecture, animation patterns, typography guidance, PowerPoint-to-web extraction, and verification rules for overflow, overlap, accessibility, and responsive viewport scaling.

The integration includes the core skill plus the supporting reference files it directly depends on. The upstream MIT license is preserved in [`frontend-slides/LICENSE`](frontend-slides/LICENSE).

[Open `frontend-slides`](frontend-slides/SKILL.md)

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

### 🎨 `brotato-art`

**Brotato-Inspired 2D Game Art System**

A modular game-art Skill for generating and refining 2D assets inspired by the visual language of **Brotato**. It is designed for characters, NPCs, enemies, bosses, weapons, items, relics, attack effects, particles, UI icons, mouse cursors, and Sprite Sheet animations.

Unlike a single image-generation prompt, `brotato-art` separates global visual rules from asset-specific construction rules and reusable prompt templates. This makes the visual language more consistent across an entire game or mod rather than optimizing each asset independently.

The core system enforces bold hand-drawn contours, chunky rounded silhouettes, flat color blocks, restrained hard-edged cartoon shading, limited palettes, strong small-size readability, transparent game-ready output where appropriate, and continuity constraints for animation.

#### Module structure

```text
brotato-art/
├── SKILL.md                 # Core visual rules and quality gates
├── MODULES.md               # Module selection and precedence
├── character.md             # Characters / NPCs / Bosses
├── weapon.md                # Weapons
├── item.md                  # Items / Relics / Collectibles
├── enemy.md                 # Enemies / Elites / Bosses
├── effect.md                # Attacks / Magic / Explosions / Particles / Trails
├── ui.md                    # HUD / UI / Icons / Cursors
├── sprite-animation.md      # Sprite Sheets and animation continuity
└── prompt-templates.md      # Reusable generation and redraw templates
```

The modules are intentionally loaded selectively. A character task does not need every effect or UI rule, while an animation task can combine the global style, the relevant asset module, and `sprite-animation.md`.

[Open `brotato-art`](brotato-art/SKILL.md) · [View module map](brotato-art/MODULES.md)

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
brotato-art/
frontend-slides/
l13n/
readme-craft/
ultrathink/
zh2en/
```

### Register the skill with your agent

Copy or link the selected skill directory into the skill-discovery location used by your AI agent or development environment. A simple skill is defined by its `SKILL.md`; modular skills such as `brotato-art` should keep `SKILL.md` together with their referenced module files.

For `frontend-slides`, keep these files together:

```text
frontend-slides/
├── SKILL.md
├── STYLE_PRESETS.md
├── viewport-base.css
├── html-template.md
├── animation-patterns.md
├── LICENSE
└── scripts/
    └── extract-pptx.py
```

For `brotato-art`, keep the core file and modules together:

```text
brotato-art/
├── SKILL.md
├── MODULES.md
├── character.md
├── weapon.md
├── item.md
├── enemy.md
├── effect.md
├── ui.md
├── sprite-animation.md
└── prompt-templates.md
```

> **Note:** Skill discovery paths vary between agent frameworks. Keep the directory name, `SKILL.md`, and any referenced support files together when integrating a skill.

---

## 📚 Usage

Each skill is designed to be invoked by matching its purpose, trigger conditions, and documented workflow.

For example, an agent working on an AutoHotkey v2 module can load `ahkv2-opt` when asked to refactor or optimize code. A documentation workflow can use `readme-craft` to generate a visual README and its SVG assets. A localization workflow can apply `l13n` to a structured CSV without changing its schema. `frontend-slides` can be loaded whenever the task involves building, converting, or enhancing HTML presentations. `brotato-art` can be loaded whenever the task involves producing or refining Brotato-inspired game assets. For complex implementation or architectural refactoring, `ultrathink` can be combined with another task-specific skill.

### Modular skill loading

For modular skills, load only the files relevant to the current task. `brotato-art` defines an explicit loading strategy:

```text
Character
→ SKILL.md
→ character.md
→ prompt-templates.md

Weapon
→ SKILL.md
→ weapon.md
→ prompt-templates.md

Item
→ SKILL.md
→ item.md
→ prompt-templates.md

Enemy
→ SKILL.md
→ enemy.md
→ prompt-templates.md

Effect
→ SKILL.md
→ effect.md
→ prompt-templates.md

UI / Cursor
→ SKILL.md
→ ui.md
→ prompt-templates.md

Sprite / Animation
→ SKILL.md
→ relevant asset module
→ sprite-animation.md
→ prompt-templates.md
```

When multiple rules apply, use this precedence order:

```text
1. Explicit user requirements
2. Skill core rules in SKILL.md
3. Most specific asset/task module
4. Reusable prompt templates
```

A typical workflow is:

```text
User task
   │
   ▼
Select relevant skill
   │
   ▼
Read SKILL.md
   │
   ▼
Load only the referenced support files needed for the task
   │
   ▼
Apply the workflow and constraints
   │
   ▼
Run the skill's quality checks
   │
   ▼
Produce task-specific output
```

The skills are deliberately explicit so an agent can inspect the rules before acting instead of depending on undocumented conventions.

---

## 🧠 Implementation Highlights

### Self-contained specifications

Every skill is packaged as a readable Markdown specification with frontmatter, purpose, workflows, and enforcement rules. This keeps the skill portable and easy to review.

### Constraint-driven workflows

The skills do more than describe goals. They define concrete constraints such as line-count limits, output schemas, formatting preservation, terminology requirements, fixed slide dimensions, visual proportions, animation continuity, and verification rules.

### Specialized rather than monolithic

AzSkills does not try to create one universal prompt. Specialized skills can be selected independently and combined only when their responsibilities overlap in a useful way.

For visual production, `brotato-art` demonstrates this approach by separating global art direction from character, weapon, item, enemy, effect, UI, and animation modules.

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
├── 📁 brotato-art/
│   ├── 📄 SKILL.md
│   ├── 📄 MODULES.md
│   ├── 📄 character.md
│   ├── 📄 weapon.md
│   ├── 📄 item.md
│   ├── 📄 enemy.md
│   ├── 📄 effect.md
│   ├── 📄 ui.md
│   ├── 📄 sprite-animation.md
│   └── 📄 prompt-templates.md
├── 📁 frontend-slides/
│   ├── 📄 SKILL.md
│   ├── 📄 STYLE_PRESETS.md
│   ├── 📄 viewport-base.css
│   ├── 📄 html-template.md
│   ├── 📄 animation-patterns.md
│   ├── ⚖️ LICENSE
│   └── 📁 scripts/
│       └── 🐍 extract-pptx.py
├── 📁 l13n/
│   └── 📄 SKILL.md
├── 📁 readme-craft/
│   ├── ⚖️ LICENSE
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
7. Keep referenced support files next to the imported skill whenever the upstream skill depends on them.
8. When a skill develops stable task-specific branches, prefer modular reference files over an increasingly monolithic `SKILL.md`.

The Skills badge is generated from the repository’s actual `SKILL.md` files by GitHub Actions. The License badge is read directly from the repository’s GitHub license metadata.

---

## 🤝 Contributing & Feedback

Contributions are welcome, especially improvements that make a skill more precise, reusable, or easier for agents to follow.

When adding a skill, include a concise frontmatter definition, clear trigger conditions, explicit workflow rules, practical examples where useful, and a scope that does not overlap unnecessarily with existing skills. When importing an external skill, preserve its applicable license and attribution information.

When a skill contains multiple stable task types, consider using a modular structure with a small core `SKILL.md` and focused supporting files. Document the loading strategy and rule precedence so agents do not need to load unrelated material.

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
