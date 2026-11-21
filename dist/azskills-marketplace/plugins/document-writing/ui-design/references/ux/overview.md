# UX Review Reference

Load this reference for `ui-design` `review` mode when the task is product-level
UX rather than visual polish. The canonical `ui-design` contract owns scope,
gates, and output.

## Review layers

1. User goal and task success.
2. Information architecture and navigation.
3. Interaction behavior and feedback.
4. Visual consistency and state clarity.
5. Accessibility and engineering feasibility.

Do not start from a component inventory. Start from what the user is trying to
finish and where the flow adds cost.

## Workbench checks

For developer tools and technical libraries, inspect navigation rail usefulness,
sidebar density, search or command entry, primary-content priority, optional
panel behavior, status feedback, keyboard access, empty/loading/error states, and
narrow-screen navigation. Add a region only when it supports a real task.

Workbench structure is defined by the root [DESIGN.md](../../../DESIGN.md); this
reference reviews whether it fits the product.

## Decision frame

For each finding, separate:

```text
Observation: current behavior and user impact
Analysis: discoverability, consistency, feedback, error prevention, cognitive load, accessibility
Recommendation: expected benefit, affected area, implementation note, tradeoff
```

Do not propose a redesign without a measurable user problem. Do not call a layout
"unclear" without naming the hierarchy defect. Do not ask for motion without
naming the feedback or continuity it improves.

## Review output

Use the canonical `ui-design` review contract. This reference adds UX
evidence to it:

```text
Verdict:
Findings ranked by user impact:
Observation -> principle -> recommendation -> tradeoff:
UX evidence: user goal, information architecture, interaction feedback, accessibility
Unverified items:
```

Rank by user impact. Give the smallest correction that addresses the finding.

## References

- `ux-priority-model.md` - severity and priority model.
- `ux-regression-checklist.md` - feature-change regression checks.
- `accessibility-audit.md` - keyboard, focus, visual, and semantic audit.
- `screenshot-analysis.md` - screenshot and prototype review method.
- `developer-handoff.md` - implementation-ready handoff.
- `platform-patterns.md` - desktop, extension, settings, developer-tool, and localization patterns.
