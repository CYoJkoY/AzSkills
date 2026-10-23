---
name: ultrathink
description: Deep reasoning overlay for ambiguous, high-risk, or architecture-level work. Use when the user asks for deeper thought or the first working solution is insufficient. Owns assumptions, alternatives, failure analysis, and the decision record.
version: 2.0.0
status: canonical
family: core
modes: [deep, rescue]
---

# Ultrathink

Add deliberate reasoning to difficult work. This Skill is an overlay, not a
domain owner: it improves how the task is framed and verified, while the domain
Skill still owns the artifact.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md) before changing this contract.

## Contract

- Use when: the task is ambiguous, high-risk, multi-step, architecture-level, or explicitly asks for deeper thought.
- Do not use when: a small reversible change is already well specified; the overlay would add ceremony without changing the result.
- Owns: problem framing, assumption testing, alternatives, failure analysis, simplification, and the decision record.
- Inputs: the request, repository evidence, constraints, existing behavior, and the owning domain Skill.
- Outputs: a short decision record plus the artifact produced by the domain Skill.
- Compose with: the owning domain Skill. This overlay improves the owner's reasoning and never replaces its contract.
- Gates: the real problem is stated; alternatives and failure modes are considered; the chosen design is the smallest sufficient one; verification is defined.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `deep` | New difficult work or an architecture decision | Reframe, map, compare, choose, verify | Decision record and artifact |
| `rescue` | A solution works but is fragile or confusing | Diagnose assumptions, remove complexity, re-verify | Corrected artifact |

## Workflow

### 1. Reframe the problem

State what the user is trying to achieve, what success looks like, and what is
out of scope. Ask whether the stated task is the real problem. Read the
surrounding code and conventions before proposing a direction.

### 2. Map the territory

```text
existing behavior and constraints
dependency and ownership boundaries
data and state lifetime
failure and recovery paths
verification surfaces
```

Name the non-negotiables and the assumptions that remain unproven.

### 3. Generate alternatives

Produce at least two materially different approaches. For each, state the idea,
the cost, the failure mode, and the condition under which it wins. Include the
option of removing or simplifying existing behavior.

### 4. Choose the smallest sufficient design

Prefer the design with fewer moving parts, fewer dependencies, and the smallest
new surface. Complexity must buy a named capability, not imagined flexibility.

### 5. Attack the choice

Ask what breaks at the edges: empty data, duplicate actions, retries, concurrent
updates, long content, localization, permissions, offline use, and migration.
Identify the first failure the user would notice.

### 6. Define verification before implementation

Name the observable checks that would prove the design works. Prefer rendered,
executed, or measured evidence over reasoning about the code.

### 7. Execute with the domain Skill

Load the owning Skill and follow its contract. Keep the reasoning record short;
do not turn it into a second specification.

### 8. Re-read and simplify

After implementation, read the result as a newcomer. Remove dead paths,
speculative abstractions, duplicate rules, and anything that does not earn its
place. Re-run the verification.

## Quality gates

- [ ] The real problem and the success condition are stated.
- [ ] Repository evidence was read before the design was chosen.
- [ ] At least two materially different approaches were considered.
- [ ] The chosen design is the smallest sufficient one.
- [ ] Failure modes and edge cases have an explicit response.
- [ ] Verification is observable and was run.
- [ ] The artifact stays inside the owning Skill's contract.
- [ ] No unsolicited refactor or speculative abstraction was added.

## Output contract

```text
Problem and success condition:
Constraints and assumptions:
Alternatives considered:
Decision and reason:
Failure modes and response:
Verification:
Unverified items:
```

For `rescue`, lead with the defect and the smallest correction. Do not replay
the whole reasoning history unless the user asks for it.

## References

- `references/craft-method.md` - extended craft method, anti-patterns, and worked reasoning heuristics.
