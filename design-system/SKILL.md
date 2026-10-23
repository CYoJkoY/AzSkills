---
name: design-system
description: Consume, author, normalize, migrate, and audit DESIGN.md visual contracts with exact source evidence, semantic mapping, provenance, and executable QA. Use when a project has DESIGN.md, brand evidence must become rules, or an AzSkills surface needs contract validation.
version: 2.0.0
status: canonical
family: interface
modes: [ingest, author, migrate, audit]
---

# Design System

Convert design evidence into a contract that implementation Skills can execute.
This Skill owns source classification, token and semantic mapping, component and
state normalization, provenance, reconciliation, and design-contract QA. It does
not choose the frontend framework or produce the final interface.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task consumes, authors, migrates, reconciles, or audits a DESIGN.md or another explicit visual contract.
- Do not use when: a project has no design source and only needs interface implementation (`ui-design`), or the task is runtime selection (`architecture`).
- Owns: source evidence, token normalization, semantic roles, component and state mapping, provenance, and design-contract verification.
- Inputs: DESIGN.md or source evidence, product context, existing tokens, target stack, themes, locales, accessibility baseline, and rendered surfaces.
- Outputs: normalized DESIGN.md contract, token map, component/state matrix, implementation notes, or audit findings.
- Compose with: `ui-design` to implement, `ui-motion` for motion roles, `architecture` for stack boundaries, `frontend-slides` for fixed-stage mapping.
- Gates: no invented tokens; provenance is explicit; semantic roles and states are complete; representative output is rendered in every shipped theme.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `ingest` | An external DESIGN.md must become implementation rules | Classify, extract, normalize, map, verify | Normalized contract |
| `author` | A new DESIGN.md is needed | Inventory, token model, sections, examples, validation | New contract |
| `migrate` | An existing visual system must change | Preserve source, map, stage, verify, record | Migration plan and contract |
| `audit` | An existing contract needs review | Evidence, semantic coverage, state coverage, render | Ranked findings |

## Workflow

### 1. Classify the source

| Source class | Treatment |
| :--- | :--- |
| Token-bearing | Machine-readable values are exact; prose supplies intent and usage. |
| Prose-first | Explicit statements are `verified-prose`; do not fabricate a token database. |
| Mixed | Tokens supply values; prose supplies behavior, states, responsive rules, and rationale. |

Read the whole source before extracting. Preserve the original file unchanged as
evidence.

### 2. Extract primitives

Collect raw color, type, spacing, radius, border, elevation, and motion values.
Preserve source notation unless the target implementation requires a conversion.
Keep conversion formulas and rounding in the provenance record.

### 3. Map semantic roles

```text
canvas -> surface -> text -> muted -> accent -> focus -> selection -> status
```

- Map colors by observed role, not by names such as `primary`.
- Map type into display, page title, section heading, body, label, metadata, numeric, and code roles.
- Map spacing into a reusable scale; keep one-off values local only when the source treats them as exceptions.
- Map motion into duration, easing, distance, and reduced-motion roles.

### 4. Map components and states

Use component -> variant -> state. Cover only real components, but include every
state the source or product supports: rest, hover, focus-visible, active, selected,
disabled, loading, empty, error, success, expanded, offline, and recovery.

### 5. Normalize into the AzSkills form

```text
Context -> Primitive -> Semantic -> Component -> State
          + Responsive + Accessibility + Motion + Provenance + Exceptions
```

The nine-section source vocabulary maps into this hierarchy; do not copy it into
every downstream Skill.

### 6. Record provenance

Classify every material decision:

| Level | Meaning |
| :--- | :--- |
| `verified-token` | Explicit machine-readable source value. |
| `verified-prose` | Explicit statement or table value in prose. |
| `inferred-usage` | Derived from repeated source usage. |
| `implementation-choice` | Selected for the target stack. |
| `unresolved` | Source is missing or ambiguous. |

Never present an inference as a source fact.

### 7. Reconcile multiple sources

Multiple DESIGN.md files are a reference corpus, not one averaged system.
Determine whether they describe one product or separate references; choose one
authority per visual domain; use secondary sources only for named gaps; record
precedence; re-run component and state mapping after reconciliation.

### 8. Contextualize before implementation

Inspect the target surface, existing system, stack, browser baseline, locales,
accessibility, performance limits, and existing icon and motion systems.
Classify each imported rule as adopt, adapt to platform, adapt to product, keep
as reference, or reject.

### 9. Verify the rendered contract

Render representative components at realistic sizes, in every shipped theme and
density. Check token consumption, hierarchy, state visibility, contrast, wrapping,
CJK and RTL, and narrow widths. Fix the mapping before polishing one component.

## AzSkills surfaces

AzSkills owns one system with two scoped layers:

| Surface | Layer | Attribute |
| :--- | :--- | :--- |
| Repository UI, README art, demos, slide chrome | Workbench | None |
| Standalone long-form reading document | Editorial | `data-surface="editorial"` on `<html>` |
| Terminal application or CLI surface | Workbench (TUI target) | None; ANSI generated at runtime |

The workbench layer is the default. The editorial layer is opt-in and does not
provide article-level isolation inside a workbench page. Both execute from
`wabi-press.css`; the theme controller and preview are verification surfaces.
Do not introduce a second palette, a heavy component library, or a parallel
visual language.

New or changed AzSkills UI must pass the conformance gate in `DESIGN.md`: token-only
spacing, the icon grid, explicit state layering, a non-color selection cue, and no
horizontal overflow at 320 CSS px.

## Terminal target

The workbench contract includes a terminal render target defined in
[`DESIGN.md`](../DESIGN.md#terminal--tui-contract). The executable preview is
[`tui/preview.mjs`](tui/preview.mjs). It uses cell and row geometry, ANSI
semantic roles, ASCII fallbacks, and `NO_COLOR` plain mode. It is not a third
CSS layer or a separate palette; the workbench information architecture remains
the source of truth.

## Quality gates

- [ ] Source format is classified and the original evidence is preserved.
- [ ] Token and prose evidence are distinguished; unresolved values are labeled.
- [ ] Raw values map to semantic roles and component states.
- [ ] Responsive, accessibility, and motion rules are executable.
- [ ] Existing product identity and stack are preserved.
- [ ] Multi-source conflicts have an explicit authority and precedence record.
- [ ] Representative output is rendered in each shipped theme and density.
- [ ] Contrast, focus, selection, and status cues survive without color alone.
- [ ] Terminal surfaces fit declared width classes and preserve plain-mode state cues.
- [ ] No complete third-party DESIGN.md or preview asset is copied.

## Output contract

```text
Source class and authority:
Visual thesis:
Primitive tokens:
Semantic roles:
Component and state matrix:
Responsive rules:
Accessibility and motion rules:
Implementation mapping:
Provenance and exceptions:
Verification evidence:
```

For implementation-only work, keep the contract as working context and return
only the decisions that change the artifact.

## References

- `references/design-system-guide.md` - detailed extraction, section mapping, reconciliation, editorial conformance, and migration procedure.
- `references/design-md-adapter.md` - source-to-contract adapter.
- `references/design-md-schema.md` - DESIGN.md schema reference.
- `references/source-format-matrix.md` - source class matrix.
- [`tui/preview.mjs`](tui/preview.mjs) - executable terminal preview and conformance gate.
