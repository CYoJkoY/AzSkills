# Motion Implementation Plan

- **Status**: TODO
- **Revision**: <inspected commit or tag>
- **Severity**: HIGH | MEDIUM | LOW
- **Category**: <motion audit category>
- **Estimated scope**: <n files>

## Problem

Describe the confirmed defect or missed opportunity with exact source locations and the relevant current-code excerpt.

## Target

State the end condition with exact project token names or approved reference values. Include required easing, duration, spring, transform, origin, reduced-motion, or pointer-capability behavior.

## Repo conventions

Identify the motion tokens, component patterns, architecture, and existing exemplar that the implementation must extend rather than duplicate.

## Steps

1. Re-inspect the current implementation against the stamped revision.
2. Make the smallest change that satisfies the target.
3. Verify interruption, exit behavior, and accessibility variants.
4. Re-run the repository's mechanical checks.

## Boundaries

- Do not change unrelated UI behavior.
- Do not add a dependency unless the project already requires it or the plan explicitly establishes a missing capability.
- Do not invent motion tokens or values when a project value exists.
- Stop and report when the source has drifted materially from the stamped revision.

## Verification

**Mechanical**

- Run the project's typecheck, lint, test, and build commands where applicable.

**Feel check**

- inspect the interaction at normal speed and at 2–5× slowdown
- trigger it repeatedly to test interruption
- verify entry/exit origin and spatial continuity
- toggle `prefers-reduced-motion`
- test fine-pointer hover and coarse-pointer touch where applicable
- verify no input is blocked by stagger or choreography

**Done when**

The change satisfies the target contract, preserves product behavior, and passes both mechanical and rendered motion verification.