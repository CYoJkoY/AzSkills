# AzSkills

<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — reusable AI skills for engineering, design, documentation, localization, translation, and visual production" width="100%">

**Reusable AI Skills for real work.**

Repository-local `SKILL.md` behavior contracts for engineering, architecture, frontend systems, design systems, UI quality, presentations, documentation, localization, translation, and visual production.

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/actions/workflow/status/CYoJkoY/AzSkills/validate-design-contract.yml?branch=main&style=flat-square&label=Design%20contracts" alt="Design contract validation">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
  <a href="https://github.com/CYoJkoY/AzSkills/stargazers"><img src="https://img.shields.io/github/stars/CYoJkoY/AzSkills?style=flat-square" alt="GitHub stars"></a>
</p>

<p>
  <a href="#readme-overview">Overview</a> ·
  <a href="#readme-architecture">Architecture</a> ·
  <a href="#readme-skills">Skills</a> ·
  <a href="#readme-choose">Choose</a> ·
  <a href="#readme-usage">Use</a> ·
  <a href="#readme-quality">Quality</a> ·
  <a href="#readme-contributing">Contribute</a> ·
  <a href="#readme-support">Support</a>
</p>

</div>

---

<a name="readme-overview"></a>
## <img src="assets/readme/icons/contract.svg" width="24" height="24" alt=""> Overview

AzSkills is a **modular library of reusable AI behavior contracts**.

A Skill is not a framework, runtime, agent platform, or application. It is a human-readable `SKILL.md` that defines a bounded capability with explicit rules for activation, execution, verification, and output.

The core model is deliberately small:

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

### Why behavior contracts?

Prompt fragments are easy to copy and hard to maintain. A Skill makes the important parts explicit:

| Contract element | Purpose |
| :--- | :--- |
| **Scope** | Defines when the Skill applies and when it should stay out of the way. |
| **Constraints** | Records non-negotiable technical, visual, language, or process rules. |
| **Workflow** | Turns experience into a repeatable execution sequence. |
| **Quality gates** | Defines what must be verified before work is considered complete. |
| **Output contract** | Defines the expected artifact or response shape. |

AzSkills therefore favors **small responsibilities, composition, repository-native context, explicit verification, and maintainability** over one giant universal prompt.

---

<a name="readme-architecture"></a>
## <img src="assets/readme/icons/visual-design.svg" width="24" height="24" alt=""> Architecture

AzSkills separates **behavior contracts**, **shared reasoning**, and **execution-specific Skills**.

```text
                         ┌──────────────────────┐
                         │   Explicit request   │
                         └──────────┬───────────┘
                                    ↓
                         ┌──────────────────────┐
                         │   Skill selection    │
                         │  narrowest capability│
                         └──────────┬───────────┘
                                    ↓
                 ┌──────────────────┴──────────────────┐
                 │                                     │
                 ↓                                     ↓
        Domain Skill contract                 design-system
                 │                         DESIGN.md adapter
                 │                                     │
                 │                                     ↓
                 │                            Primitive → Semantic
                 │                                     ↓
                 │                               Component → State
                 │                                     │
                 └──────────────────┬──────────────────┘
                                    ↓
                         ┌──────────────────────┐
                         │  Project context +   │
                         │ existing conventions │
                         └──────────┬───────────┘
                                    ↓
                         ┌──────────────────────┐
                         │      Execution       │
                         │  implement / produce │
                         └──────────┬───────────┘
                                    ↓
                         ┌──────────────────────┐
                         │ Verification + QA    │
                         │ render / test / audit│
                         └──────────────────────┘
```

### Shared reasoning layer

[`design-intelligence.md`](design-intelligence.md) is **not a Skill**. It is a cross-cutting reasoning layer for visual systems, interaction, composition, accessibility, motion, and visual QA.

It is intentionally separate from implementation Skills so the same visual reasoning is not duplicated across UI, presentation, identity, and documentation workflows.

### DESIGN.md integration

[`design-system`](design-system/SKILL.md) is the boundary between external design-system documents and AzSkills.

It supports three source forms:

| Source form | Interpretation |
| :--- | :--- |
| **Token-bearing** | Machine-readable values are treated as exact source values; prose supplies intent and usage. |
| **Prose-first** | Explicit values are retained as `verified-prose` evidence; missing tokens are never fabricated. |
| **Mixed** | Token values supply exact data; prose supplies behavior, rationale, states, and responsive guidance. |

The adapter then normalizes those sources into:

```text
Context
  ↓
Primitive
  ↓
Semantic
  ↓
Component
  ↓
State
  ↓
Responsive / Accessibility / Motion / QA
```

Multiple design references remain a **reference corpus**, not a system to average together. Source authority, inferred values, implementation choices, and unresolved assumptions are kept explicit.

See:

- [DESIGN.md adapter](design-system/references/design-md-adapter.md)
- [DESIGN.md schema reference](design-system/references/design-md-schema.md)
- [Source format matrix](design-system/references/source-format-matrix.md)

---

<a name="readme-skills"></a>
## <img src="assets/readme/icons/engineering.svg" width="24" height="24" alt=""> Skill catalog

Choose the smallest Skill that fully owns the task. Compose additional Skills only when they contribute a separate responsibility.

### Engineering & architecture

| Skill | Focus |
| :--- | :--- |
| [`application-architecture`](application-architecture/SKILL.md) | Runtime topology, persistence, process boundaries, and maintainable application structure. |
| [`frontend-architecture`](frontend-architecture/SKILL.md) | Frontend language, framework, styling, storage, and client/server boundaries before substantial UI work. |
| [`ultrathink`](ultrathink/SKILL.md) | Deep methodology for difficult implementation, refactoring, assumption testing, boundary design, and simplification. |

### Design systems, UI & visual production

| Skill | Focus |
| :--- | :--- |
| [`design-system`](design-system/SKILL.md) | DESIGN.md ingestion, normalization, source reconciliation, provenance, and executable design QA. |
| [`ui-design`](ui-design/SKILL.md) | Production interface design and implementation: hierarchy, responsive behavior, accessibility, interaction, motion, and visual QA. |
| [`ui-aesthetics`](ui-aesthetics/SKILL.md) | Composition-first visual critique, refinement, component craftsmanship, restrained depth, and anti-generic review. |
| [`frontend-slides`](frontend-slides/SKILL.md) | Fixed-stage 1920×1080 HTML presentations with deliberate art direction, animation, and render QA. |
| [`svg-animation`](svg-animation/SKILL.md) | SVG animation generation, optimization, accessibility, reduced-motion handling, and reusable single-file output. |
| [`logo-generator`](logo-generator/SKILL.md) | Logo, product mark, wordmark, mascot, SVG, and identity-system development. |
| [`ip-as-logo`](ip-as-logo/SKILL.md) | Character-led marks optimized for silhouette, recognition, and small-size use. |
| [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md) | Restrained editorial image treatments derived from a supplied photograph. |

### Documentation & publishing

| Skill | Focus |
| :--- | :--- |
| [`readme-craft`](readme-craft/SKILL.md) | Evidence-first GitHub README engineering, navigation, semantic SVG headings, support presentation, and visual QA. |
| [`steam-mod-page`](steam-mod-page/SKILL.md) | Steam Workshop / Mod Store copy, formatting, compatibility, links, images, and factual change logs. |

### Localization

| Skill | Focus |
| :--- | :--- |
| [`l13n`](l13n/SKILL.md) | Structured 13-language game CSV localization with terminology, BBCode, escaping, schema, and completeness checks. |

### Shared design reasoning

[`design-intelligence.md`](design-intelligence.md) is intentionally listed outside the Skill catalog because it is inherited by applicable visual Skills rather than selected as a standalone Skill.

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
│
├─ Consume / author / adapt DESIGN.md ───► design-system
│   └─ then execute with the owning visual Skill
├─ Build / redesign a UI ─────────────────► ui-design
├─ Refine an existing interface ──────────► ui-aesthetics + ui-design
├─ Create an HTML presentation ───────────► frontend-slides
├─ Create / animate SVG ──────────────────► svg-animation
├─ Create a logo / identity ──────────────► logo-generator
├─ Create a character-led symbol ─────────► ip-as-logo + logo-generator
├─ Create an editorial photo treatment ───► photo-abstract-editorial
│
├─ Write / rebuild a GitHub README ───────► readme-craft
├─ Write a Steam Mod page ────────────────► steam-mod-page
└─ Localize a 13-language game CSV ───────► l13n
```

### Composition rules

```text
New domain behavior       → new Skill
Narrow variation          → mode inside an existing Skill
Reusable cross-cutting    → shared reference
DESIGN.md ingestion       → design-system
Visual reasoning          → design-intelligence.md
Complex implementation    → ultrathink + owning domain Skill
Frontend architecture     → frontend-architecture before substantial UI work
Runtime architecture      → application-architecture before downstream UI choices
```

Do not duplicate shared rules merely to make each Skill look self-contained.

---

<a name="readme-usage"></a>
## <img src="assets/readme/icons/model.svg" width="24" height="24" alt=""> Use

AzSkills is runtime-agnostic. There is no repository-wide application to install; the deliverable is the Markdown contract itself plus any supporting references or assets.

### 1. Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### 2. Select the narrowest Skill

Start with the smallest capability that fully owns the requested work.

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
DESIGN.md + UI implementation
   ↓
design-system
   ↓
ui-design
   ↓
ui-aesthetics
```

For difficult work:

```text
ultrathink
   +
the owning domain Skill
```

### 3. Read the contract and its references

The contract is always the Skill directory's `SKILL.md`. Some Skills also contain reference documents, templates, assets, or specialized implementation guides.

Do not assume a reference file is globally applicable. Read it only when the owning Skill points to it or the task requires it.

### 4. Execute with repository context

Inspect the real project before implementing:

```text
repository
  ↓
existing architecture
  ↓
existing conventions / identity
  ↓
active Skill contract
  ↓
task-specific changes
```

Preserve project-native APIs, configuration keys, defaults, component systems, and user-visible behavior unless the task explicitly changes them.

### 5. Verify before returning the result

The standard loop is:

```text
inspect
  ↓
plan
  ↓
implement
  ↓
render / test
  ↓
inspect again
  ↓
correct
  ↓
verify
```

For design-system work, verify both the source mapping and the rendered result.

---

<a name="readme-quality"></a>
## <img src="assets/readme/icons/verification.svg" width="24" height="24" alt=""> Quality bar

AzSkills is intentionally evidence-first.

**Repository truth.** Do not invent features, benchmarks, screenshots, compatibility, versions, URLs, or destinations.

**Explicit behavior.** A Skill should define scope, constraints, workflow, quality gates, and output expectations.

**Project-native context.** Inspect the real repository before making architecture, UI, documentation, or visual decisions.

**Composition over duplication.** Shared behavior belongs in shared references; distinct behavior belongs in focused Skills.

**Design-system integrity.** Preserve exact source tokens, distinguish inference from fact, and never blend unrelated brand systems without an explicit synthesis requirement.

**Visual verification.** Authored SVGs, interfaces, and presentations should be inspected at realistic display sizes with attention to geometry, spacing, typography, themes, accessibility, and interaction states.

**Stable navigation.** Manually authored README navigation should use explicit custom anchors rather than guessed GitHub fragments.

**Searchable documentation.** Installation, configuration, limitations, legal information, important links, and canonical support destinations belong in searchable Markdown or normal HTML.

**Dynamic facts.** Repository-generated facts such as the Skill count should come from automation rather than becoming stale hardcoded prose.

### CI quality gates

The repository currently validates the DESIGN.md integration through [`validate-design-contract.yml`](.github/workflows/validate-design-contract.yml), while [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml) generates the Skill-count badge from actual `SKILL.md` files.

---

<a name="readme-repository"></a>
## <img src="assets/readme/icons/documentation.svg" width="24" height="24" alt=""> Repository map

```text
AzSkills/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── config.yml
│   │   ├── documentation.yml
│   │   ├── new_skill.yml
│   │   └── skill_improvement.yml
│   ├── badges/
│   │   └── skills.json
│   └── workflows/
│       ├── update-skill-badge.yml
│       └── validate-design-contract.yml
│
├── assets/
│   ├── azskills-hero.svg
│   └── readme/
│       ├── icons/
│       └── support-cta.svg
│
├── application-architecture/
├── design-system/
│   ├── SKILL.md
│   └── references/
├── frontend-architecture/
├── frontend-slides/
│   ├── DESIGN_SYSTEM.md
│   ├── STYLE_PRESETS.md
│   ├── animation-patterns.md
│   ├── html-template.md
│   ├── scripts/
│   └── viewport-base.css
├── ip-as-logo/
├── l13n/
├── logo-generator/
├── photo-abstract-editorial/
├── readme-craft/
│   └── references/
├── steam-mod-page/
├── svg-animation/
├── ui-aesthetics/
├── ui-design/
├── ultrathink/
│
├── design-intelligence.md
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

---

<a name="readme-contributing"></a>
## <img src="assets/readme/icons/contributing.svg" width="24" height="24" alt=""> Contributing

Good contributions add a clear capability, improve an existing workflow, fix a concrete defect, or remove unnecessary complexity.

Before creating a new Skill:

1. Check whether the behavior already belongs in an existing Skill as a mode or narrow extension.
2. Check whether it belongs in [`design-intelligence.md`](design-intelligence.md) as shared visual reasoning.
3. Make sure the proposed Skill has a distinct scope, trigger boundary, workflow, QA contract, and output contract.
4. Keep external methodologies as references or original syntheses rather than copying repositories wholesale.
5. Record provenance and applicable licensing information in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

For Skill proposals and improvements, use the repository's structured [Issue Forms](https://github.com/CYoJkoY/AzSkills/issues/new/choose).

---

<a name="readme-support"></a>
## <img src="assets/readme/icons/heart.svg" width="24" height="24" alt=""> Support

AzSkills is maintained as an open collection of reusable engineering, design, documentation, localization, translation, and visual workflows. Support helps sustain the time required to maintain the Skills, references, assets, and repository infrastructure.

<div align="center">

<a href="https://cyojkoy.github.io/Payment/">
  <img src="assets/readme/support-cta.svg" alt="Support AzSkills" width="420">
</a>

**Direct support link:** https://cyojkoy.github.io/Payment/

<sub>The support CTA is authored for AzSkills and links directly to the project's support destination.</sub>

</div>

---

<a name="readme-license"></a>
## <img src="assets/readme/icons/license.svg" width="24" height="24" alt=""> License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects and methodologies. Sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring unrelated upstream repositories.
