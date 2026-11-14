# AzSkills module system

Version: 2.0.0

AzSkills exposes one root SKILL.md. Its routing table selects internal module contracts under references/modules/. Modes and references load on demand. Legacy aliases exist only in skills.json and never create additional installable entries.

## Shared rules

Read [shared rules](references/shared-rules.md). They are maintained in one place.

## Layers

| Layer | Owns | May change | Must not do |
| :--- | :--- | :--- | :--- |
| Shared rules | Cross-Skill invariants | Never | Duplicate domain workflow |
| Visual extension | Shared visual judgment | Extensions an owner links | Restate shared rules or own motion |
| Internal module | One decision class | Contract, modes, gates | Absorb a second owner |
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

Every internal `references/modules/<id>.md` uses this order. The required sections stay in
sequence. Extra domain sections may appear between `## Modes` and
`## Quality gates`; they cannot replace a required section.

```markdown
---
name: skill-name
description: One sentence that names the capability, the artifact, and the boundary.
version: 2.0.0
status: module
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
- Compose with: internal modules and the reason.
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

Aliases are registry-only records in skills.json. They have no manifest or directory. Each record declares id, status alias, canonical module, and mode.

## Composition grammar

```text
request
  -> select family
  -> select one internal module
  -> select one mode
  -> load only the references that mode names
  -> execute
  -> run the gates
  -> return the artifact and evidence
```

- Choose one canonical owner. Add a second internal module only when it owns a
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
  scope, gates, or ownership, promote it to a mode or an internal module.
- An alias may be selected directly. It forwards to one internal module and one
  mode; it cannot add rules.

## Families

| Family | Internal modules | Purpose |
| :--- | :--- | :--- |
| architecture | `architecture` | Runtime, frontend, storage, and process boundaries. |
| interface | `design-system`, `ui-design`, `ui-motion` | Design contracts, interface execution, and motion. |
| visual | `logo-generator`, `photo-abstract-editorial` | Identity and image-led artifacts. |
| production | `frontend-slides`, `remotion-production` | Timed or staged visual production. |
| publishing | `readme-craft`, `steam-mod-page`, `localization` | Repository, storefront, and locale delivery. |
| career | `resume-evidence-workflow` | Career evidence, requirement alignment, and resume delivery. |
| operations | `tool-integration` | Connect and manage AzSkills across supported AI clients. |

## Sizes and progressive disclosure

| Artifact | Limit | Rule |
| :--- | :--- | :--- |
| Public `SKILL.md` | 100 lines | Routing and shared rules only. |
| Internal module | 280 lines | Decision contract only. |
| Alias | Registry metadata only | Target and mode. |
| Description | 320 characters | Capability, artifact, boundary. |
| Reference | No line limit | One topic, loaded only when named. |
| README catalog | Registry order | No hand-maintained duplicate metadata. |

When a contract grows past 280 lines, move examples, matrices, provider notes,
or long procedures into a reference and link it from `## References`. Do not
shorten a rule until it becomes ambiguous.

## Naming

- Canonical directories and `name` fields use lowercase kebab-case.
- One internal module owns a directory. Modes are values, not directories.
- Aliases keep historical IDs in the registry and point to an internal module.
- A new internal module needs a new decision class, not a new adjective.

## Lifecycle

1. Propose the decision class and the nearest existing owner.
2. Add the internal module or mode to the registry.
3. Write or update the contract and references.
4. Update routing, catalog, and notices.
5. Run `node scripts/validate-skills.mjs` and `node design-system/tui/preview.mjs --check`.
6. Wait for CI. Do not merge without manual review.

## Validation

The validator enforces the machine-checkable part of this document:

- registry paths, IDs, families, modes, and aliases;
- frontmatter and contract keys;
- public entry and internal module line budgets;
- relative link integrity across every Markdown file, including reference-index paths and HTML asset sources;
- catalog, alias, mode, and issue-template parity;
- no unregistered `SKILL.md` files;
- ASCII-only Skill metadata, canonical contracts, and aliases;
- link integrity in the root system, design, and provenance documents.
- internal module choices in issue templates.

CI also runs `node design-system/tui/preview.mjs --check`, which fails when the
terminal preview drifts from the registry.

Passing validation does not prove design quality. It proves the assembly is
coherent enough for human review.
