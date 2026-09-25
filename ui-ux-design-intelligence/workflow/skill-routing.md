# Skill Routing Workflow

## Purpose

Define when `ui-ux-design-intelligence` should be selected and how its sub-workflows are composed.

## Trigger Conditions

Use this skill when a task involves:

- UI design review
- UX workflow analysis
- Interface usability issues
- Screenshot or prototype analysis
- Accessibility review
- Design system consistency checks
- Interaction flow improvements

## Avoid Triggering

Do not use this skill for:

- Backend-only changes
- Pure algorithm optimization
- Data processing without user interaction
- Formatting-only code changes

## Context Mapping

| Input Context | Workflow |
| --- | --- |
| Screenshot or mockup | screenshot-analysis |
| UI regression report | ux-regression-checklist |
| Component consistency issue | design-system-audit |
| Accessibility concern | accessibility-audit |
| UX finding requiring implementation | developer-handoff |

## Workflow Composition

```text
ui-ux-design-intelligence
├── screenshot-analysis
├── accessibility-audit
├── design-system-audit
├── developer-handoff
├── ux-pattern-library
└── ux-regression-checklist
```

## Output Contract

Every review should provide:

```markdown
Analysis:

UX Finding:

User Impact:

Recommended Change:

Implementation Notes:

Risk:
```

## Routing Principles

- Prefer the smallest workflow that answers the user's need.
- Combine workflows when multiple UX dimensions are affected.
- Clearly separate observed facts from recommendations.
- Mark assumptions that require runtime validation.
