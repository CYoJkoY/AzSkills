<div align="center">

<img src="assets/azskills-hero.svg" alt="AzSkills — reusable AI skills with explicit behavior contracts, composed into checked task outputs" width="100%">

# AzSkills

**Reusable AI Skills for real work.**

Human-readable `SKILL.md` behavior contracts for engineering, architecture, frontend systems, UI design, documentation, localization, translation, presentations, and visual workflows.

<p>
  <img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/CYoJkoY/AzSkills/main/.github/badges/skills.json&style=flat-square" alt="Skill count">
  <img src="https://img.shields.io/badge/Format-SKILL.md-7A8E8E?style=flat-square" alt="SKILL.md format">
  <img src="https://img.shields.io/github/license/CYoJkoY/AzSkills?style=flat-square&color=9E8F7E" alt="MIT License">
  <a href="https://github.com/CYoJkoY/AzSkills/stargazers"><img src="https://img.shields.io/github/stars/CYoJkoY/AzSkills?style=flat-square" alt="GitHub stars"></a>
</p>

<p>
  <a href="#overview">Overview</a> ·
  <a href="#skill-catalog">Skills</a> ·
  <a href="#choose-a-skill">Choose</a> ·
  <a href="#how-skills-work">How it works</a> ·
  <a href="#installation">Install</a> ·
  <a href="#support">Support</a>
</p>

</div>

---

<a name="overview"></a>
## <img src="assets/readme/icons/contract.svg" width="24" height="24" alt=""> Overview

AzSkills is a **library of reusable AI behavior definitions**.

It is not a framework, runtime, agent platform, or executable application. Each Skill is a repository-local `SKILL.md` specification that turns working knowledge into an inspectable, versioned, reusable contract.

A well-designed Skill answers five questions:

```text
When should it activate?
What must remain true?
How should the work proceed?
How is quality verified?
What should the output contain?
```

### What a Skill contains

The smallest useful Skill is intentionally small:

```text
my-skill/
└── SKILL.md
```

Supporting material stays with the Skill that owns it:

```text
my-skill/
├── SKILL.md
├── references/
├── templates/
├── scripts/
└── assets/
```

### What AzSkills optimizes for

| Principle | Meaning |
| :--- | :--- |
| **Explicit contracts** | Triggers, hard constraints, workflow, QA, and output expectations are written down. |
| **Small responsibilities** | Prefer one focused Skill over a universal prompt that tries to solve unrelated problems. |
| **Composition** | Combine independent Skills only when each adds a distinct responsibility. |
| **Repository-native context** | Inspect the actual project before applying visual, architectural, or documentation guidance. |
| **Verification** | Treat links, structure, rendered visuals, theme behavior, and factual accuracy as part of completion. |
| **Maintainability** | Keep technical truth searchable, versioned, and close to the artifact it governs. |

AzSkills follows the same standard it asks other Skills to follow: **project-native, evidence-first, explicit, composable, and checked**.

---

<a name="skill-catalog"></a>
## <img src="assets/readme/icons/engineering.svg" width="24" height="24" alt=""> Skill catalog

The repository currently contains a focused set of Skills rather than one monolithic instruction set. Use the narrowest capability that completely covers the task.

### Engineering & architecture

#### [`application-architecture`](application-architecture/SKILL.md)

**Runtime-first application architecture.**

Chooses the smallest sufficient runtime, process topology, persistence model, language boundary, and native/backend boundary for applications, browser extensions, desktop tools, web applications, and hybrid projects.

#### [`frontend-architecture`](frontend-architecture/SKILL.md)

**Maintainable frontend implementation architecture.**

Chooses frontend language, framework, styling, storage, browser-extension boundaries, and client/server structure from project constraints instead of defaulting to a fashionable stack or an unstructured `HTML/CSS/JS` layout.

#### [`ahkv2-opt`](ahkv2-opt/SKILL.md)

**AutoHotkey v2 optimization and standardization.**

A rule-driven workflow for refactoring and reviewing AutoHotkey v2 code, including control flow, state management, hotkeys, timers, data structures, `DllCall`, GUI behavior, performance, memory, and testing.

#### [`ultrathink`](ultrathink/SKILL.md)

**Deep engineering craftsmanship for difficult implementation work.**

A methodology for complex engineering and refactoring: inspect the repository, question assumptions, map boundaries, design from the caller's perspective, test alternatives, and simplify beyond the first working implementation.

### UI, presentation & visual design

#### [`ui-design`](ui-design/SKILL.md)

**Unified UI design and interaction quality.**

Covers visual systems, hierarchy, responsive behavior, accessibility, semantic color, typography, interaction states, motion, performance, internationalization, iconography, and visual QA for production interfaces.

#### [`frontend-slides`](frontend-slides/SKILL.md)

**Animation-rich HTML presentations.**

A fixed 1920×1080 workflow for narrative structure, visual direction, design systems, typography, animation patterns, PowerPoint extraction, and presentation QA.

#### [`logo-generator`](logo-generator/SKILL.md)

**Logo and visual-identity production.**

Covers concept routes, black-and-white exploration, SVG marks, wordmarks, mascots, colorways, identity systems, small-size testing, and targeted revision.

#### [`ip-as-logo`](ip-as-logo/SKILL.md)

**Character-led IP and mascot marks.**

A narrower workflow for simplified character/IP symbols with strong silhouettes, restrained color, and small-size recognition.

#### [`photo-abstract-editorial`](photo-abstract-editorial/SKILL.md)

**Photo-preserving abstract editorial composition.**

Keeps a supplied photograph faithful while deriving a restrained abstract panel from its spatial, tonal, and color relationships.

### Documentation & publishing

#### [`readme-craft`](readme-craft/SKILL.md)

**Project-native GitHub README engineering.**

Treats a README as a communication interface: establish value quickly, put proof before detail, derive visuals from the real project, preserve correct destinations, use stable navigation anchors, keep technical information searchable in Markdown, and verify authored SVGs at realistic GitHub sizes and themes.

> This README is itself an applied `readme-craft` artifact.

#### [`steam-mod-page`](steam-mod-page/SKILL.md)

**Steam Workshop / Mod Store writing.**

Produces structured Chinese/English Mod descriptions and change logs with BBCode discipline, practical wording, and strict feature accuracy.

### Language & localization

#### [`any2zh`](any2zh/SKILL.md)

**Natural translation into Chinese.**

Preserves meaning, tone, terminology, formatting, and technical context instead of performing literal conversion.

#### [`l13n`](l13n/SKILL.md)

**13-language game localization.**

A structured CSV localization workflow covering schema consistency, terminology, BBCode preservation, CSV escaping, and locale completeness.

#### [`zh2en`](zh2en/SKILL.md)

**Chinese-to-English conversational translation.**

Turns informal, slang-heavy, and context-dependent Chinese into natural English for everyday communication, work, gaming, and social contexts.

### Shared reference layer

[`design-intelligence.md`](design-intelligence.md) is **not a standalone Skill**. It is a shared reasoning layer inherited by visual and UI work when an artifact's appearance, interaction, motion, composition, or accessibility changes.

---

<a name="choose-a-skill"></a>
## <img src="assets/readme/icons/selection.svg" width="24" height="24" alt=""> Choose a Skill

Start with the smallest capability that fully matches the task.

```text
User task
   │
   ├─ Runtime / application architecture ──► application-architecture
   ├─ Frontend implementation architecture ─► frontend-architecture
   ├─ UI / web interface ───────────────────► ui-design
   ├─ AutoHotkey v2 ────────────────────────► ahkv2-opt
   ├─ Complex engineering ──────────────────► ultrathink + task Skill
   ├─ HTML presentation ────────────────────► frontend-slides
   ├─ Logo / identity ──────────────────────► logo-generator
   │      └─ character / IP mark ───────────► ip-as-logo
   ├─ Photo + editorial abstraction ────────► photo-abstract-editorial
   ├─ README / GitHub documentation ────────► readme-craft
   ├─ Steam Workshop / Mod page ────────────► steam-mod-page
   ├─ 13-language game CSV localization ────► l13n
   ├─ Translation into natural Chinese ─────► any2zh
   └─ Chinese → natural English chat ────────► zh2en
```

### Composition rule

Compose only when responsibilities are genuinely different:

```text
new domain-specific behavior  → new Skill
narrow variation              → mode
shared reusable guidance      → reference
cross-domain visual reasoning → design-intelligence.md
complex implementation        → ultrathink + domain Skill
frontend architecture         → frontend-architecture + ui-design when both apply
runtime architecture          → application-architecture upstream of frontend decisions
```

Do not duplicate shared rules simply to make a Skill appear self-contained.

---

<a name="how-skills-work"></a>
## <img src="assets/readme/icons/model.svg" width="24" height="24" alt=""> How skills work

A Skill is a **behavior contract**, not a prompt fragment.

The intended flow is:

```text
Task
  │
  ▼
Select the narrowest Skill
  │
  ▼
Read its SKILL.md contract
  │
  ├─ trigger boundary
  ├─ hard constraints
  ├─ workflow
  ├─ quality gates
  └─ output contract
  │
  ▼
Compose shared references / additional Skills only when justified
  │
  ▼
Execute the work
  │
  ▼
Verify the result against the contract
```

### Precedence

When several sources of guidance apply, AzSkills uses a specificity-first model:

```text
1. Explicit user requirements
2. Skill-specific hard constraints
3. Existing project identity and conventions
4. Product / platform conventions
5. More specific shared execution guidance
6. Shared design intelligence
7. Optional external references and examples
```

A more specific project requirement wins over a generic preference.

### Architecture before implementation

For application-sized work, architecture decisions precede substantial UI implementation:

```text
application-architecture
        ↓
runtime / process / capability boundary
        ↓
frontend-architecture
        ↓
language / framework / frontend boundaries
        ↓
ui-design
        ↓
visual / interaction / accessibility / responsive quality
```

This prevents a visual task from silently forcing a heavyweight runtime or an unstructured frontend.

---

<a name="design-intelligence"></a>
## <img src="assets/readme/icons/visual-design.svg" width="24" height="24" alt=""> Shared design intelligence

[`design-intelligence.md`](design-intelligence.md) is a cross-cutting reference layer for visual work.

It covers:

```text
visual thesis
style selection
semantic design tokens
typography
color
composition
spacing / density
accessibility
interaction states
motion
responsive behavior
internationalization
performance
anti-pattern filtering
visual QA
```

For executable UI work, [`ui-design`](ui-design/SKILL.md) is the primary implementation Skill; the shared layer supplies cross-artifact reasoning.

The current layer is an AzSkills synthesis informed by public design-engineering methodologies. Provenance and applicable notices are recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

---

<a name="installation"></a>
## <img src="assets/readme/icons/installation.svg" width="24" height="24" alt=""> Installation

AzSkills is a collection of Markdown specifications and supporting files. There is no repository-wide runtime or build step.

### Clone

```bash
git clone https://github.com/CYoJkoY/AzSkills.git
cd AzSkills
```

### Use a Skill

Select the directory that matches your task and keep its `SKILL.md` together with any referenced support files.

```text
application-architecture/
frontend-architecture/
ui-design/
readme-craft/
...
```

Then copy, link, or otherwise register that Skill in the skill-discovery location used by your AI agent or development environment.

Discovery paths vary by agent framework, so AzSkills intentionally does not prescribe one universal installation directory.

### Practical rule

Load the smallest useful Skill first. Add another Skill only when it owns a separate responsibility required by the task.

---

<a name="repository-structure"></a>
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
│           ├── contract.svg
│           ├── engineering.svg
│           ├── documentation.svg
│           ├── visual-design.svg
│           ├── localization.svg
│           ├── model.svg
│           ├── installation.svg
│           ├── selection.svg
│           ├── read.svg
│           ├── verification.svg
│           ├── contributing.svg
│           ├── heart.svg
│           └── license.svg
├── application-architecture/SKILL.md
├── frontend-architecture/SKILL.md
├── ui-design/
├── frontend-slides/
├── readme-craft/
├── steam-mod-page/
├── ahkv2-opt/SKILL.md
├── any2zh/SKILL.md
├── ip-as-logo/SKILL.md
├── l13n/SKILL.md
├── logo-generator/
├── photo-abstract-editorial/SKILL.md
├── ultrathink/
├── zh2en/SKILL.md
├── design-intelligence.md
├── THIRD_PARTY_NOTICES.md
├── LICENSE
└── README.md
```

The Skill-count badge is generated from the repository's `SKILL.md` files by [`update-skill-badge.yml`](.github/workflows/update-skill-badge.yml); the count is therefore not maintained manually.

---

<a name="quality-principles"></a>
## <img src="assets/readme/icons/verification.svg" width="24" height="24" alt=""> Quality principles

AzSkills is intentionally opinionated about trust and maintainability.

**Evidence before claims.** Do not invent features, compatibility, benchmarks, screenshots, versions, destinations, or other repository facts.

**Explicit behavior over vague prompting.** A Skill should define when it applies, what must remain true, how to work, how to verify, and what to return.

**Project-native over template-first.** Architecture, visual language, README graphics, and workflow choices should come from the actual repository and product context.

**Searchable information stays textual.** Installation, commands, configuration, limitations, legal information, important links, and canonical support destinations stay in Markdown or normal HTML.

**Visuals are verified assets.** SVGs are treated as authored geometry: check structure, bounds, centering, spacing, theme readability, realistic display sizes, and rendered output.

**Navigation is explicit.** Authored in-page navigation uses stable custom anchors rather than guessed GitHub heading slugs.

**Composition beats duplication.** Shared behavior belongs in a shared reference; distinct behavior belongs in a focused Skill.

**Design is not decoration.** Every major visual element should communicate, guide scanning, provide proof, or establish the project's identity.

---

<a name="contributing"></a>
## <img src="assets/readme/icons/contributing.svg" width="24" height="24" alt=""> Contributing

A strong contribution should add a clear capability, improve an existing workflow, fix a concrete defect, or remove unnecessary complexity.

Before creating a new top-level Skill:

1. Check whether the behavior belongs in an existing Skill as a mode or narrow extension.
2. Check whether it belongs in `design-intelligence.md` as shared visual reasoning.
3. Check whether the proposed Skill has a distinct scope, trigger boundary, workflow, QA contract, and output contract.
4. Record provenance and applicable licensing information for imported public methodologies in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Keep changes focused, inspectable, and easy to audit.

---

<a name="support"></a>
## <img src="assets/readme/icons/heart.svg" width="24" height="24" alt=""> Support

AzSkills is maintained as an open collection of reusable engineering, design, documentation, and language workflows. Support helps sustain the time required to maintain the Skills, references, examples, and repository infrastructure.

<div align="center">

<a href="https://cyojkoy.github.io/Payment/">
  <img src="assets/readme/support-cta.svg" alt="Support AzSkills" width="420">
</a>

**Direct support link:** https://cyojkoy.github.io/Payment/

<sub>This CTA is designed specifically for AzSkills. Other repositories should derive their own support visual from their own project identity rather than reuse this asset. The payment page is the user-facing destination; the <a href="https://github.com/CYoJkoY/Payment">Payment source repository</a> remains available for inspection.</sub>

</div>

---

<a name="license"></a>
## <img src="assets/readme/icons/license.svg" width="24" height="24" alt=""> License & provenance

AzSkills is released under the [MIT License](LICENSE).

Some Skills incorporate or adapt ideas from public upstream projects and methodologies. Their sources and applicable notices are documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Integrated Skills are rewritten to fit AzSkills' architecture rather than mechanically vendoring upstream repositories.

---

<div align="center">

**AzSkills** · reusable rules for reusable AI workflows

[GitHub](https://github.com/CYoJkoY/AzSkills) · [MIT License](LICENSE)

</div>
