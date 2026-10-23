# AzSkills Skill System

AzSkills is a small set of composable behavior contracts. It is not a prompt
library, a framework, or a collection of independent manifestos.

The model is one handle with interchangeable blades:

```text
shared rules
    -> canonical Skill
        -> mode
            -> reference
                -> task output
```

A canonical Skill owns one class of decisions. A mode changes the workflow and
quality gates inside that owner. A reference supplies depth without expanding
the owner. An alias preserves an old path but never owns a decision.

## Shared rules

These rules apply to every canonical Skill. A Skill may add a stricter rule. It
may not silently weaken one.

| ID | Rule | Check |
| :--- | :--- | :--- |
| R01 | One owner per decision. | Name the single Skill that owns the outcome. |
| R02 | Evidence before invention. | Repository facts, source tokens, and observed behavior precede proposals. |
| R03 | Project-native first. | Reuse the existing stack, identity, tokens, and conventions before introducing a parallel system. |
| R04 | One thesis, few signatures. | State the purpose, tone, constraint, and one or two memorable ideas before styling. |
| R05 | Structure before decoration. | Hierarchy, composition, spacing, and reading order precede effects. |
| R06 | Tokens before components. | Primitive, semantic, component, state. No scattered raw values. |
| R07 | Every state is designed. | Default, hover, focus, active, selected, disabled, loading, empty, error, success, and recovery where relevant. |
| R08 | Accessibility is a gate. | Keyboard, focus visibility, contrast, semantics, reduced motion, and localization survive the change. |
| R09 | Motion must earn its place. | Name the purpose and frequency; remove, reduce, then refine before adding. |
| R10 | Native before dependency. | Use the smallest mechanism that fully satisfies the interaction. |
| R11 | Render before done. | Inspect the produced artifact at real sizes, themes, states, and content extremes. |
| R12 | Output is a contract. | Return the requested artifact, evidence, unresolved items, and verification status. |

## Layers

| Layer | Owns | May change | Must not do |
| :--- | :--- | :--- | :--- |
| Shared rules | Cross-Skill invariants | Never | Duplicate domain workflow |
| Visual extension | Shared visual judgment | Extensions an owner links | Restate shared rules or own motion |
| Canonical Skill | One decision class | Contract, modes, gates | Absorb a second owner |
| Mode | Workflow variant | Sequence, gates, output shape | Redefine shared rules |
| Reference | Depth | Examples, matrices, detailed procedures | Add scope or a new owner |
| Alias | Compatibility | Target and mode | Restate a contract |

## Precedence

1. Explicit user and repository instructions.
2. The active Skill contract and shared rules R01-R12.
3. Platform, accessibility, safety, and domain requirements.
4. A normalized DESIGN.md and the existing product identity.
5. Project-native conventions not captured by the contract.
6. Reference detail loaded for the active mode.
7. Optional stylistic examples and inspiration.

When two rules conflict, keep the more specific requirement, record the
tradeoff, and never weaken a safety or accessibility gate silently.

## Canonical contract

Every canonical `SKILL.md` uses this order. The required sections stay in
sequence. Extra domain sections may appear between `## Modes` and
`## Quality gates`; they cannot replace a required section.

```markdown
---
name: skill-name
description: One sentence that names the capability, the artifact, and the boundary.
version: 2.0.0
status: canonical
family: interface
modes: [build, refine, review]
---

# Skill Name

One paragraph: what this Skill turns into what, and what it does not do.

## Contract

- Use when: concrete trigger.
- Do not use when: nearest competing owner.
- Owns: the decision class.
- Inputs: required evidence or files.
- Outputs: artifact shape.
- Compose with: canonical Skills and the reason.
- Gates: the two or three non-negotiable checks.

## Modes

| Mode | Use when | Workflow | Output |

## Workflow

Numbered steps. Each step produces or checks something.

## Quality gates

- [ ] Observable check.

## Output contract

What the user receives, including unresolved items.

## References

- `references/name.md` - when to load it.
```

The `description` field is limited to 320 characters. The contract block is
limited to seven bullets. A missing key is a validation error, not a style
preference.

Every alias uses a smaller manifest and no contract sections:

```markdown
---
name: historical-name
description: Compatibility alias for the canonical Skill in one mode.
version: 2.0.0
status: alias
canonical: canonical-name
mode: one-mode
---

# Historical Name

This path is preserved for existing callers. It does not own a contract.

Read [canonical-name](../canonical-name/SKILL.md) in `one-mode` mode.

Do not add rules here. Change the canonical contract instead.
```

## Composition grammar

```text
request
  -> select family
  -> select one canonical Skill
  -> select one mode
  -> load only the references that mode names
  -> execute
  -> run the gates
  -> return the artifact and evidence
```

- Choose one canonical owner. Add a second canonical Skill only when it owns a
  separate artifact or a separate decision class.
- `design-intelligence.md` is the visual extension layer, not a canonical owner.
  A visual Skill may load it; it adds visual judgment inside that owner's
  contract and cannot change scope, gates, or motion ownership.
- In `skills.json`, `composes` is the exact set of canonical IDs named in the
   contract's `Compose with` bullet. It describes allowed invocation, not a
   dependency DAG. A self-reference is invalid.
- Prefer a mode over a new Skill. Prefer a reference over a new mode. Prefer a
  shared rule over a copied paragraph.
- A pipeline may name an ordered set of owners, for example `readme-craft` then
  `ui-design` for a rendered README page. The order is part of the output
  contract.
- A reference never becomes a hidden second contract. If a reference changes
  scope, gates, or ownership, promote it to a mode or a canonical Skill.
- An alias may be selected directly. It forwards to one canonical Skill and one
  mode; it cannot add rules.

## Families

| Family | Canonical Skills | Purpose |
| :--- | :--- | :--- |
| core | `ultrathink` | Reasoning method for difficult work. |
| architecture | `architecture` | Runtime, frontend, storage, and process boundaries. |
| interface | `design-system`, `ui-design`, `ui-motion` | Design contracts, interface execution, and motion. |
| visual | `logo-generator`, `photo-abstract-editorial` | Identity and image-led artifacts. |
| production | `frontend-slides`, `remotion-production` | Timed or staged visual production. |
| publishing | `readme-craft`, `steam-mod-page`, `localization` | Repository, storefront, and locale delivery. |

## Sizes and progressive disclosure

| Artifact | Limit | Rule |
| :--- | :--- | :--- |
| Canonical `SKILL.md` | 280 lines | Decision contract only. |
| Alias `SKILL.md` | 24 lines | Target, mode, and one warning. |
| Description | 320 characters | Capability, artifact, boundary. |
| Reference | No line limit | One topic, loaded only when named. |
| README catalog | Registry order | No hand-maintained duplicate metadata. |

When a contract grows past 280 lines, move examples, matrices, provider notes,
or long procedures into a reference and link it from `## References`. Do not
shorten a rule until it becomes ambiguous.

## Naming

- Canonical directories and `name` fields use lowercase kebab-case.
- One canonical Skill owns a directory. Modes are values, not directories.
- Aliases keep their historical directory and point to the canonical path.
- A new canonical Skill needs a new decision class, not a new adjective.

## Lifecycle

1. Propose the decision class and the nearest existing owner.
2. Add the Skill or mode to the registry.
3. Write or update the contract and references.
4. Update routing, catalog, and notices.
5. Run `node scripts/validate-skills.mjs`.
6. Wait for CI. Do not merge without manual review.

## Validation

The validator enforces the machine-checkable part of this document:

- registry paths, IDs, families, modes, and aliases;
- frontmatter and contract keys;
- canonical and alias line budgets;
- relative link integrity, including reference-index paths and HTML asset sources;
- catalog, alias, mode, and issue-template parity;
- TUI preview parity with the canonical registry;
- no unregistered `SKILL.md` files;
- ASCII-only Skill metadata, canonical contracts, and aliases;
- link integrity in the root system, design, and provenance documents.
- canonical Skill choices in issue templates.

Passing validation does not prove design quality. It proves the assembly is
coherent enough for human review.
