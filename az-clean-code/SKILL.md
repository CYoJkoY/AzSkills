---
name: az-clean-code
description: Use when coding, reviewing, or refactoring app logic; enforce explicit, flat, data-driven rules.
---

# Az Clean Code

Apply this Skill when creating or changing application behavior, reviewing code for maintainability, or refactoring nested or hard-coded business logic. Do not apply it to formatting-only work, structure-preserving performance optimization, or unrelated low-level infrastructure. A user may explicitly exempt a disposable one-off script from C7; state that scope and reason in the self-check.

All applicable code must pass C1-C7. These are acceptance constraints, not suggestions. A conflict with an existing public contract must be reported and resolved within the requested scope; do not silently break the contract. See [constraint sources](references/constraint-sources.md), [data schema](references/data-driven-schema.md), and [anti-patterns](references/anti-patterns.md).

## Constraints

- **C1 - Explicit behavior:** Validate important preconditions at the boundary. Do not depend on implicit conversion, hidden side effects, or defaults for important behavior. Do not use a Boolean parameter to select distinct operations; name the operations separately. Give complex expressions a meaningful name. See the explicitness guidance in Google Python Style Guide and the project's API conventions.
- **C2 - Spaces, no tabs:** Indent with spaces according to the repository convention; if none exists, use four spaces for C# and Java. No Tab character may occur in source files.
- **C3 - Flat control flow:** Keep nested `if`, `for`, `while`, and `try` control-flow blocks at no more than two levels inside a function. Refactor deeper paths; comments do not waive this limit.
- **C4 - Guard clauses:** Handle invalid inputs, boundary cases, and exceptional paths with explicit early returns or equivalent exits before the main path. If a third control-flow level appears, flatten it or extract a focused function.
- **C5 - Reuse and YAGNI:** Search for semantically equivalent code before adding logic. Leave the second occurrence alone when abstraction is not stable; extract on the third occurrence. Do not add abstractions with no current caller. Prefer a mature existing library for general capabilities.
- **C6 - Function size:** A function should express one responsibility and normally stay near 20 body lines; above that, verify its single responsibility and split when needed. Use no more than three parameters, except signatures imposed by a runtime or external contract; otherwise use a named options object. Do not suppress complexity diagnostics to avoid refactoring.
- **C7 - Externalize business data before coding:** Before writing logic, identify tunable values, user-facing text, reward mappings, rules, endpoints, secrets, and category identifiers. Put them in configuration, a data table, environment configuration, or a typed configuration object; code reads by stable key/ID and consumes the value. Never implement the hard-coded version first and extract configuration later. For rule sets with 30 or more lines, use data files/tables rather than code branches. Keys for localized text are stable semantic identifiers, not display copy.

## Workflow

1. Confirm that the request is code authoring, review, or refactoring within this Skill's boundary.
2. **Before coding**, identify business data and define or locate its schema and source. If no business data is involved, record that in the self-check. Never start with literal business values and promise to externalize them later.
3. List invalid inputs, boundary cases, and failure paths. Plan guards and ensure the control-flow depth will not exceed two.
4. Search the repository for existing equivalent behavior, configuration, and dependencies. Count meaningful duplicates; extract at the third occurrence and avoid speculative abstractions.
5. Implement, then verify the changed paths against C1-C7 and project checks. Attach the following self-check to the code delivery or review. For repository changes, include it in the response; do not add a one-off report file.

## Required self-check

| Constraint | Result | Evidence or fix required |
| --- | --- | --- |
| C1 Explicit behavior | PASS/FAIL | Preconditions, conversions, side effects, Boolean behavior |
| C2 Spaces, no tabs | PASS/FAIL | Files checked and indentation convention |
| C3 Nesting <= 2 | PASS/FAIL | Deepest control-flow nesting |
| C4 Guard clauses | PASS/FAIL | Early exits and main-path shape |
| C5 Third duplicate / YAGNI | PASS/FAIL | Search performed, occurrence count, current callers |
| C6 Function and parameters | PASS/FAIL | Longest function, parameter counts, justified exceptions |
| C7 Business data externalized first | PASS/FAIL | Data schema/source established before implementation, or N/A |

Any FAIL means the delivery is incomplete unless the user explicitly scoped an exception; document that exception and its reason.

## Minimal comparison

Bad: hard-coded business values and three nested branches violate C3, C4, and C7.

```python
def reward(enemy_hp, kills, player):
    if enemy_hp <= 0:
        if kills >= 100:
            if not player.has_item("paint_brush"):
                player.give_item("paint_brush", quantity=1)
```

Good: define `kill_rewards` in configuration before implementing the consumer. It contains a stable condition, threshold, reward ID, and quantity.

```python
def reward(enemy_hp, kills, player, kill_rewards):
    if enemy_hp > 0:
        return
    rule = kill_rewards.get("paint_brush_milestone")
    if rule is None or kills < rule["threshold"]:
        return
    reward_id = rule["reward_id"]
    if player.has_item(reward_id):
        return
    player.give_item(reward_id, quantity=rule["quantity"])
```

The sample illustrates data flow, not a universal schema. In a repository change, define an appropriate typed schema and include the C1-C7 self-check.
