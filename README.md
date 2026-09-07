<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — Modular AI Skills for Real Work" width="100%">

### A focused collection of reusable AI skills for development, translation, localization, documentation, presentations, and visual design workflows.

<p>
  <a href="#-overview">Overview</a> •
  <a href="#-skill-catalog">Skill Catalog</a> •
  <a href="#-skill-selection">Skill Selection</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="License">
</p>

</div>

---

## 📖 Overview

**AzSkills** is a modular collection of reusable **AI agent skill definitions**. Each skill lives in a focused directory and is centered on a `SKILL.md` behavior contract, making the repository easy to inspect, combine, version, and maintain.

The collection now covers engineering, translation, localization, documentation, presentations, and a dedicated visual-design layer for **logo systems, character/IP marks, and photo-derived editorial compositions**.

> **Design principle:** one directory, one bounded responsibility, one explicit behavior contract.

## ✨ Core Features

| Capability | What it provides |
| :--- | :--- |
| **Modular skills** | Self-contained skill definitions that can be loaded independently. |
| **Explicit contracts** | Trigger conditions, workflows, constraints, and output rules are written directly into each skill. |
| **Engineering** | AutoHotkey v2 optimization plus deep engineering craftsmanship and review methodology. |
| **Localization & translation** | Structured game localization and intent-preserving multilingual translation. |
| **Documentation & presentation** | README engineering, HTML slide generation, visual systems, animation patterns, and quality auditing. |
| **Visual identity** | Unified logo design, SVG production, colorway/system-board workflows, simplified IP marks, and photo-derived editorial abstraction. |
| **Specialized publishing** | Steam Mod page generation with structural and formatting constraints. |

---

## 🧩 Skill Catalog

### Engineering

### 🛠️ `ahkv2-opt`

**AHK v2 Code Optimization & Standardization**

Rule-driven refactoring and review for AutoHotkey v2, covering structure, state management, hotkeys, timers, data structures, `DllCall`, GUI performance, memory behavior, and testing.

[Open `ahkv2-opt`](ahkv2-opt/SKILL.md)

### 🧠 `ultrathink`

**Deep Engineering Craftsmanship Methodology**

A disciplined method for assumption checking, architecture planning, caller-oriented design, edge-case analysis, simplification, testing, and iterative refinement.

Imported from [HaydenLundin/ultrathink](https://github.com/HaydenLundin/ultrathink); the upstream MIT license is retained in [`ultrathink/LICENSE`](ultrathink/LICENSE).

[Open `ultrathink`](ultrathink/SKILL.md)

### Language

### 🌐 `any2zh`

**Multilingual Translation to Chinese**

Translates major world languages into natural Chinese while preserving intent, tone, terminology, formatting, and cultural context.

[Open `any2zh`](any2zh/SKILL.md)

### 💬 `zh2en`

**Chinese-to-English Conversational Translation**

Turns informal or context-heavy Chinese into natural English for everyday conversation, work, gaming, and social communication.

[Open `zh2en`](zh2en/SKILL.md)

### 🎮 `l13n`

**13-Language Game Localization**

Structured CSV localization with fixed locale schema, terminology consistency, BBCode preservation, CSV escaping, and complete-coverage checks.

[Open `l13n`](l13n/SKILL.md)

### Documentation & Presentation

### 📝 `readme-craft`

**Professional README Generation**

Visual-first README engineering covering hero composition, SVG assets, feature presentation, project adaptation, and GitHub-friendly documentation patterns.

[Open `readme-craft`](readme-craft/SKILL.md)

### 🎞️ `frontend-slides`

**Animation-Rich HTML Presentation Generation**

Fixed-stage 16:9 HTML presentation generation with design systems, animation patterns, typography guidance, PowerPoint extraction, and automated layout auditing.

Adapted from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides); the upstream MIT license is retained in [`frontend-slides/LICENSE`](frontend-slides/LICENSE).

[Open `frontend-slides`](frontend-slides/SKILL.md) · [Design system](frontend-slides/DESIGN_SYSTEM.md) · [Quality auditor](frontend-slides/scripts/quality_audit.py)

### 🛒 `steam-mod-page`

**Steam Mod Page Writing**

Generates practical Chinese/English Steam Workshop-style descriptions and change logs while preserving BBCode structure and avoiding invented features.

[Open `steam-mod-page`](steam-mod-page/SKILL.md)

### Visual Design

### ◈ `logo-generator`

**Unified Logo & Visual Identity Design**

The general logo-design skill. It covers concept routes, symbolic abstraction, SVG construction, colorway exploration, mascot/logo integration, system-board composition, showcase direction, small-size quality, and targeted revision.

This skill deliberately consolidates the overlapping strengths of two public logo-generator projects instead of keeping duplicate generators:

- [op7418/logo-generator-skill](https://github.com/op7418/logo-generator-skill)
- [SanbaoAI/logo-generator-skill](https://github.com/SanbaoAI/logo-generator-skill)

[Open `logo-generator`](logo-generator/SKILL.md)

### ◉ `ip-as-logo`

**Simplified Character / IP Logo Design**

A specialist skill for cute character-led marks. It emphasizes a single strong silhouette, very small complexity budgets, purposeful semantic colors, and recognition at 32 × 32 and above.

Informed by [s1dashu/ip-as-logo-skill](https://github.com/s1dashu/ip-as-logo-skill), rewritten for the AzSkills modular convention.

[Open `ip-as-logo`](ip-as-logo/SKILL.md)

### ▱ `photo-abstract-editorial`

**Photo-Preserving Abstract Editorial Composition**

Transforms one supplied photograph into a vertical editorial diptych while keeping the photo faithful and deriving the abstract panel from the photograph's own spatial, tonal, and color relationships.

Informed by [ZzzLc0405/photo-abstract-editorial](https://github.com/ZzzLc0405/photo-abstract-editorial), with the workflow independently re-expressed for AzSkills.

[Open `photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

---

## 🧭 Skill Selection

Use the smallest set of skills that fully covers the task.

```text
Logo / visual identity
        │
        ├── General logo, SVG, brand system → logo-generator
        │
        ├── Character / mascot-led IP      → ip-as-logo
        │
        └── Photo + abstract editorial      → photo-abstract-editorial
```

When responsibilities overlap, combine skills deliberately. For example, use `ip-as-logo` to design a mascot mark and `logo-generator` to expand that mark into a broader identity system. Do not load `photo-abstract-editorial` merely because a logo presentation contains photography.

When multiple rules apply, use this precedence order:

```text
1. Explicit user requirements
2. Core rules in the selected SKILL.md
3. Referenced support rules
4. Examples and templates
```

---

## 🚀 Installation

AzSkills is a collection of skill definitions rather than a standalone executable. There is no repository-wide build step.

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

Copy or link the required skill directory into the skill-discovery location used by your AI agent. Keep `SKILL.md` together with any referenced support files.

The current skill set is:

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

For `frontend-slides`, keep its design-system, templates, styles, scripts, and license files together as documented in that skill's directory.

---

## 📁 Project Structure

```text
AzSkills/
├── .github/
│   ├── badges/
│   │   └── skills.json
│   └── workflows/
│       └── update-skill-badge.yml
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
│   ├── LICENSE
│   └── scripts/
├── ip-as-logo/
│   └── SKILL.md
├── l13n/
│   └── SKILL.md
├── logo-generator/
│   └── SKILL.md
├── photo-abstract-editorial/
│   └── SKILL.md
├── readme-craft/
│   ├── LICENSE
│   └── SKILL.md
├── steam-mod-page/
│   └── SKILL.md
├── ultrathink/
│   ├── LICENSE
│   └── SKILL.md
├── zh2en/
│   └── SKILL.md
├── assets/
│   └── azskills-hero.svg
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

---

## 🛡️ Maintenance Principles

1. Keep each skill focused on a bounded responsibility.
2. Prefer explicit behavior contracts over vague prompt collections.
3. Consolidate genuinely overlapping skills instead of maintaining duplicate variants.
4. Split stable sub-workflows into focused support files when a skill becomes unwieldy.
5. Keep README, directory structure, and badge metadata synchronized with the actual repository.
6. Preserve third-party provenance and applicable licensing information.
7. Do not vendor upstream sample assets when the skill can be expressed cleanly as original instructions.
8. Remove references to retired skills immediately.

The Skills badge is generated from the repository's actual `SKILL.md` files by GitHub Actions.

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for provenance and licensing notes for the newly integrated visual-design skills.

---

## 🤝 Contributing

Contributions are welcome when they make a skill more precise, reusable, and easier for agents to follow.

New skills should include clear frontmatter, trigger conditions, explicit workflow rules, practical constraints, and a bounded scope. When an incoming skill substantially overlaps with an existing one, prefer synthesis and consolidation over another duplicate top-level directory.

---

## 📄 License

AzSkills is released under the **MIT License**.

See [`LICENSE`](LICENSE) for the complete license text. Individual imported skills may retain additional upstream licensing notices where required.

---

<div align="center">
  <i>AzSkills · Modular AI Skills for Real Work</i>
</div>
