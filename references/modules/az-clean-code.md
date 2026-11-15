---
name: az-clean-code
description: Apply explicit, flat, reusable, data-driven constraints when writing, reviewing, or refactoring application code.
status: module
family: architecture
modes: [write, review, refactor]
version: 2.5.1
---

## Contract

- Use when: authoring, reviewing, or refactoring application logic for explicitness, control-flow depth, reuse, or business-data placement.
- Do not use when: formatting-only tasks, structure-preserving performance work, or unrelated low-level infrastructure.
- Owns: C1-C7 code acceptance and its required self-check.
- Inputs: requested behavior, repository conventions, existing code and configuration.
- Outputs: compliant code or review findings, plus a C1-C7 self-check.
- Compose with: `architecture`
- Gates: read `az-clean-code/SKILL.md` and apply its workflow before implementation.

## Modes

- `write`: establish business-data schema before coding, then implement and self-check.
- `review`: report each applicable C1-C7 failure with location and a concrete correction.
- `refactor`: preserve observable contracts while flattening control flow and externalizing business data.

## Workflow

Load the standalone `az-clean-code/SKILL.md` first. Follow its before-coding C7 gate, C1-C7 constraints, verification, and required self-check.

## Quality gates

- Confirm data/schema source before implementation; never extract hard-coded business data afterward.
- Verify control-flow nesting is at most two levels, functions use no more than three parameters unless externally fixed, and source has no Tab characters.
- Search for equivalent implementations; extract meaningful duplication on its third occurrence.
- Attach the complete PASS/FAIL self-check.

## Output contract

Return the requested code or review, actual verification, and a C1-C7 evidence table. An unexplained FAIL is an incomplete delivery.

## References

- Standalone contract: [Az Clean Code](../../az-clean-code/SKILL.md)
- Data schema and source limits: [data-driven schema](../../az-clean-code/references/data-driven-schema.md)
- Sources and rule thresholds: [constraint sources](../../az-clean-code/references/constraint-sources.md)
- Refactoring examples: [anti-patterns](../../az-clean-code/references/anti-patterns.md)
