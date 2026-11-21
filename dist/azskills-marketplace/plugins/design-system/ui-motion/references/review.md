<!-- Loaded by ui-motion review. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies depth only. If it conflicts with the canonical ui-motion review contract, the contract wins.

# Motion Review Reference

A read-only motion review Skill. It judges whether implemented motion earns its place and whether the implementation preserves product identity, responsiveness, physical coherence, performance, accessibility, and interruptibility.

It does not fix code. It does not perform whole-codebase opportunity discovery.

## Review sequence

### 1. Context

Identify:

```text
runtime / browser baseline
motion mechanism
existing motion tokens
component frequency
interaction purpose
pointer / touch model
reduced-motion policy
```

Do not evaluate a component against generic taste before checking the host project's conventions.

### 2. Gate the motion

Ask:

1. Should this move at all?
2. What is the user-facing purpose?
3. How frequently is it encountered?
4. Is the motion communicating a state or spatial relationship, or merely decorating it?

A keyboard-initiated or extremely high-frequency action is normally a no-animation case.

### 3. Inspect the implementation

Check:

- easing choice and duration
- origin and spatial continuity
- interruption and retargeting
- entry / exit relationship
- animated properties
- reduced-motion behavior
- hover capability gates
- performance-sensitive layout / paint work
- token reuse and component cohesion

Use the exact values in `ui-motion/references/animation-standards.md` rather than inventing replacement numbers.

### 4. Escalate by leverage

Prefer this remedial order:

```text
delete unnecessary motion
    ↓
reduce frequency / range / duration
    ↓
fix easing / timing
    ↓
fix origin / geometry
    ↓
make the interaction interruptible
    ↓
move work toward compositor-friendly properties
    ↓
add controlled polish
```

A lower-level optimization does not rescue motion that should not exist.

## Findings

Report confirmed findings only.

| # | Severity | Category | Location | Observation | Direct correction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | HIGH / MEDIUM / LOW | purpose / timing / physicality / interruptibility / performance / accessibility / cohesion | `path:line` | concrete evidence | specific correction |

Severity is descriptive:

- HIGH — motion harms responsiveness, correctness, or a critical accessibility path
- MEDIUM — noticeable quality defect with a practical workaround
- LOW — refinement or consistency issue

Return the canonical output: scope, verdict, findings ranked by leverage, the smallest correction for each finding, and unverified items. The verdict is `ship`, `fix`, or `rethink` for the reviewed motion only. Never produce a numeric score or a verdict about the whole product.
