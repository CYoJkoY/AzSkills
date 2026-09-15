<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — reusable AI skills for engineering, design, documentation, localization, and visual work" width="100%">

# AzSkills

**Reusable AI Skills for real work.**

Repository-local `SKILL.md` behavior contracts for engineering, architecture, frontend systems, UI quality, presentations, documentation, localization, translation, and visual production.

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
  <a href="https://github.com/CYoJkoY/AzSkills/stargazers"><img src="https://img.shields.io/github/stars/CYoJkoY/AzSkills?style=flat-square" alt="GitHub stars"></a>
</p>

<p>
  <a href="#readme-overview">Overview</a> ·
  <a href="#readme-skills">Skills</a> ·
  <a href="#readme-choose">Choose</a> ·
  <a href="#readme-usage">Use</a> ·
  <a href="#readme-contributing">Contribute</a> ·
  <a href="#readme-support">Support</a>
</p>

</div>

---

<a name="readme-overview"></a>
## <img src="assets/readme/icons/contract.svg" width="24" height="24" alt=""> Overview

AzSkills is a **modular library of reusable AI behavior contracts**.

A Skill is not a framework, runtime, or agent platform. It is a human-readable `SKILL.md` that defines a bounded capability with explicit rules for activation, execution, verification, and output.

```text
Task
  ↓
Select the narrowest Skill
  ↓
Read the contract
  ↓
Execute with project context
  ↓
Verify against the contract
  ↓
Return the checked result
```

### Why this model

Prompt fragments are easy to copy and hard to maintain. A Skill makes the important parts explicit:

| Contract element | Purpose |
| :--- | :--- |
| **Scope** | Defines when the Skill applies and when it should stay out of the way. |
| **Constraints** | Records non-negotiable technical, visual, language, or process rules. |
| **Workflow** | Turns experience into a repeatable sequence instead of ad-hoc prompting. |
| **Quality gates** | Specifies what must be checked before work is considered complete. |
| **Output contract** | Defines what the resulting artifact or response should contain. |

AzSkills favors **small responsibilities, composition, repository-native context, explicit verification, and maintainability** over one giant universal prompt.

---

<a name="readme-skills"></a>
## <img src="assets/readme/icons/engineering.svg" width="24" height="24" alt=""> Skill catalog

The repository currently contains **12 focused Skills**. Pick the smallest one that fully owns the task, then compose additional Skills only when they contribute a separate responsibility.

### Engineering & architecture

| Skill | Focus |
| :--- | :--- |
| [`application-architecture`](application-architecture/SKILL.md) | Choose the smallest maintainable runtime, process topology, persistence model, and application boundary before implementation. |
| [`frontend-architecture`](frontend-architecture/SKILL.md) | Establish a maintainable frontend language, framework, styling, storage, and client/server boundary before substantial UI work. |
| [`ahkv2-opt`](ahkv2-opt/SKILL.md) | Refactor and review AutoHotkey v2 code with explicit rules for control flow, state, hotkeys, timers, GUI behavior, performance, and testing. |
| [`ultrathink`](ultrathink/SKILL.md) | Deep engineering methodology for difficult implementation and refactoring work: inspect, challenge assumptions, design boundaries, test alternatives, and simplify. |

### UI, visual design & presentation

| Skill | Focus |
| :--- | :--- |
| [`ui-design`](ui-design/SKILL.md) | Production UI design and implementation quality: hierarchy, responsive behavior, accessibility, typography, color, motion, iconography, and visual QA. |
| [`ui-aesthetics`](ui-aesthetics/SKILL.md) | Deliberate aesthetic judgment for visual refinement, composition, typography, surfaces, motion, and anti-generic / anti-AI-slop review. |
| [`frontend-slides`](frontend-slides/SKILL.md) | Production HTML presentations with a fixed 1920×1080 canvas, deliberate art direction, animation, and presentation QA. |
| [`logo-generator`](logo-generator/SKILL.md) | Professional logo, product-mark, wordmark, mascot, SVG, and identity-system development with iterative visual testing. |
| [`ip-as-logo`](ip-as-logo/SKILL.md) | Simplified character-led IP and mascot marks designed for recognizability at very small sizes. |
| [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) | Turn one supplied photograph into a restrained editorial diptych while preserving the source image and deriving a sparse abstract companion panel. |

### Documentation & publishing

| Skill | Focus |
| :--- | :--- |
| [`readme-craft`](readme-craft/SKILL.md) | Evidence-first GitHub README engineering: information architecture, stable navigation, semantic SVG headings, sponsorship, link verification, and visual QA. |
| [`steam-mod-page`](steam-mod-page/SKILL.md) | Production-ready Steam Workshop / Mod Store descriptions and change logs with strict BBCode and feature-accuracy discipline. |

### Localization

| Skill | Focus |
| :--- | :--- |
| [`l13n`](l13n/SKILL.md) | Structured 13-language game CSV localization with terminology, BBCode, escaping, schema, and locale-completeness checks. |

> `design-intelligence.md` is **not a standalone Skill**. It is a shared reasoning layer for visual systems, interaction, composition, accessibility, and visual QA.

---

<a name="readme-choose"></a>
## <img src="assets/readme/icons/selection.svg" width="24" height="24" alt=""> Choose a Skill

Use this routing map as the first decision point:

```text
What are you doing?
│
├─ Application / runtime architecture ───► application-architecture
├─ Frontend implementation architecture ─► frontend-architecture
├─ Complex engineering / refactoring ────► ultrathink + domain Skill
├─ AutoHotkey v2 ─────────────────────────► ahkv2-opt
│
├─ Build / redesign a UI ─────────────────► ui-design
├─ Make a UI feel more refined ───────────► ui-aesthetics + ui-design
├─ Create an HTML presentation ───────────► frontend-slides
├─ Create a logo / identity ──────────────► logo-generator
├─ Create a character-led symbol ─────────► ip-as-logo + logo-generator
├─ Create an editorial photo treatment ───► photo-abstract-editorial
│
├─ Write or rebuild a GitHub README ──────► readme-craft
├─ Write a Steam Mod page ────────────────► steam-mod-page
└─ Localize a 13-language game CSV ───────► l13n
```

### Composition rule

```text
New domain behavior       → new Skill
Narrow variation          → mode inside an existing Skill
Reusable cross-cutting    → shared reference
Visual reasoning          → design-intelligence.md
Complex implementation    → ultrathink + the owning domain Skill
Frontend architecture     → frontend-architecture before substantial UI work
Runtime architecture      → application-architecture before downstream UI choices
```

Do not copy shared rules into multiple Skills just to make each file look self-contained.

---

<a name="readme-usage"></a>
## <img src="assets/readme/icons/model.svg" width="24" height="24" alt=""> How to use

AzSkills is deliberately runtime-agnostic. It is a collection of Markdown specifications and supporting files, so there is no repository-wide application to install or execute.

### 1. Clone the repository

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### 2. Select the Skill

Start with the narrowest relevant directory and keep its support files together:

```text
ui-design/
├── SKILL.md
└── icon-morphing.md

readme-craft/
├── SKILL.md
└── references/
```

Not every Skill has supporting files. The contract is always `SKILL.md`.

### 3. Register it with your environment

Copy, link, or register the selected Skill in the skill-discovery location used by your AI agent or development environment.

AzSkills does not prescribe a universal installation directory because discovery conventions differ across agent runtimes.

### 4. Add context only when it is owned by another capability

For example:

```text
New application
   ↓
application-architecture
   ↓
frontend-architecture
   ↓
ui-design
```

Or:

```text
Complex UI refactor
   ↓
ultrathink + ui-design + ui-aesthetics
```

The goal is not to load the most Skills. The goal is to load the **right** Skills.

---

<a name="readme-model"></a>
## <img src="assets/readme/icons/read.svg" width="24" height="24" alt=""> Behavior model

Skills act as **behavior contracts**, not static prompt snippets.

### Precedence

When multiple sources of guidance apply, use the following specificity order:

```text
1. Explicit user requirements
2. Skill-specific hard constraints
3. Existing project identity and conventions
4. Platform / product conventions
5. More specific shared execution guidance
6. Shared design intelligence
7. Optional external references
```

A project-specific requirement wins over a generic preference.

### Verification is part of the work

A Skill is incomplete when the artifact only appears correct. The intended workflow is:

```text
inspect → plan → implement → render / test → inspect again → correct → verify
```

For visual work, this includes rendered output, realistic display sizes, geometry, theme safety, hierarchy, and accessibility where applicable. For documentation work, it includes destinations, navigation anchors, repository facts, and searchable technical information.

---

<a name="readme-structure"></a>
## <img src="assets/readme/icons/documentation.svg" width="24" height="24" alt=""> Repository structure

```text
AzSkills/
├── .github/
│   ├── badges/
│   │   └── skills.json
│   └── workflows/
│       └── update-skill-badge.yml
├── assets/
│   ├── azskills-hero.svg
│   └── readme/
│       ├── support-cta.svg
│       └── icons/
├── application-architecture/
├── frontend-architecture/
├── frontend-slides/
├── ahkv2-opt/
├── ip-as-logo/
├── l13n/
├── logo-generator/
├── photo-abstract-editorial/
├── readme-craft/
├── steam-mod-page/
├── ui-aesthetics/
├── ui-design/
├── ultrathink/
├── design-intelligence.md
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

The Skill-count badge is generated from the repository's `SKILL.md` files by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml), so the badge count is not manually maintained in the README.

---

<a name="readme-quality"></a>
## <img src="assets/readme/icons/verification.svg" width="24" height="24" alt=""> Quality bar

AzSkills is intentionally evidence-first.

**Repository truth.** Do not invent features, benchmarks, screenshots, compatibility, versions, or destinations.

**Explicit behavior.** A Skill should define its scope, constraints, workflow, quality gates, and output expectations.

**Project-native context.** Inspect the real repository before making architecture, UI, documentation, or visual decisions.

**Searchable information.** Installation, configuration, limitations, legal information, important links, and canonical support URLs belong in searchable Markdown or normal HTML.

**Visual verification.** Authored SVGs should be checked for valid structure, geometry, spacing, centering, realistic display size, and light/dark readability.

**Stable navigation.** Manually authored README navigation should resolve to explicit custom anchors rather than guessed GitHub fragments.

**Composition over duplication.** Shared behavior belongs in a shared layer; distinct behavior belongs in a focused Skill.

---

<a name="readme-contributing"></a>
## <img src="assets/readme/icons/contributing.svg" width="24" height="24" alt=""> Contributing

Good contributions add a clear capability, improve an existing workflow, fix a concrete defect, or remove unnecessary complexity.

Before creating a new top-level Skill:

1. Check whether the behavior already belongs in an existing Skill as a mode or narrow extension.
2. Check whether it belongs in [`design-intelligence.md`](design-intelligence.md) as shared visual reasoning.
3. Make sure the proposed Skill has a distinct scope, trigger boundary, workflow, QA contract, and output contract.
4. Record provenance and applicable licensing information for imported public methodologies in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep changes focused, inspectable, and easy to audit.

---

<a name="readme-support"></a>
## <img src="assets/readme/icons/heart.svg" width="24" height="24" alt=""> Support

AzSkills is maintained as an open collection of reusable engineering, design, documentation, and language workflows. Support helps sustain the time required to maintain the Skills, references, assets, and repository infrastructure.

<div align="center">

<a href="https://cyojkoy.github.io/Payment/">
  <img src="assets/readme/support-cta.svg" alt="Support AzSkills" width="420">
</a>

**Direct support link:** https://cyojkoy.github.io/Payment/

<sub>The CTA is authored for AzSkills and links directly to the project's support destination.</sub>

</div>

---

<a name="readme-license"></a>
## <img src="assets/readme/icons/license.svg" width="24" height="24" alt=""> License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects and methodologies. Sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.
