<!-- Loaded by ui-motion audit. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies depth only. If it conflicts with the canonical ui-motion audit contract, the contract wins.

Use [plan-template.md](plan-template.md) for the implementation plan.

# Motion Audit Reference

A read-only, codebase-scope motion audit. It combines motion correction and motion opportunity discovery under one boundary so both use the same scan vocabulary and evidence model.

It does not edit production source.

## Modes

### Audit mode

Inventory motion before judging it.

Search for at least:

```text
transition
animation
@keyframes
animate(
motion.
useSpring
ease-in
transition: all
scale(0)
prefers-reduced-motion
transform-origin
clip-path
```

Also inspect framework-specific motion APIs already present in the repository.

Build a frequency map:

```text
100+ / day → keyboard navigation, command surfaces, core repeated actions
tens / day → hover, list traversal, routine toggles
occasional → dialogs, drawers, toasts
rare → onboarding, success, celebration
```

Then audit these categories:

1. purpose & frequency
2. easing & duration
3. physicality & origin
4. interruptibility
5. performance
6. accessibility
7. cohesion & tokens
8. missed opportunities

### Opportunity mode

Only propose motion that survives all four gates:

1. frequency does not make motion burdensome
2. there is a concrete communication purpose
3. the motion preserves or explains spatial/state continuity
4. the implementation fits the existing architecture without disproportionate dependency cost

Reject:

- decorative movement on very high-frequency surfaces
- motion of data the user is actively reading
- animation added only because a component looks static
- ideas requiring a new framework when native primitives are sufficient

Cap the opportunity list at a handful of high-confidence seams.

## Recon before judgment

Record:

```text
stack
motion library
CSS architecture
motion tokens
component conventions
reduced-motion policy
pointer / touch model
rendering / performance constraints
```

Inspect the repository at the current revision. Do not assume line numbers from an older scan remain valid.

## Implementation plans

Each plan must be self-contained enough for an executor with no conversation context.

Use:

```text
Problem
Target
Repo conventions
Steps
Boundaries
Verification
```

Stamp plans with the inspected revision and verify every cited source location before writing the plan.

Do not write a plan for a finding that was not confirmed in source.
