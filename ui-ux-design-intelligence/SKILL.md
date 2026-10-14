---
name: ui-ux-design-intelligence
description: Analyze, review, and improve software interfaces using the repository-owned Workbench design contract, modern UX principles, accessibility standards, localized product design patterns, and implementation-aware workflows.
---

# UI/UX Design Intelligence

## Purpose

This skill provides product-level interface reasoning instead of simple visual styling suggestions. It connects user goals, interaction design, accessibility, and engineering constraints.

## Core Responsibilities

- Analyze information architecture and user journeys
- Review interaction clarity and feedback loops
- Evaluate consistency with design systems
- Identify accessibility problems
- Recommend implementation-ready improvements
- Detect UX regression risks during feature changes

## Design Philosophy Sources

Integrate ideas from:

- Workbench-first UX — root [`DESIGN.md`](../DESIGN.md) and [`design-system/wabi-press.css`](../design-system/wabi-press.css) define compact navigation, information density, keyboard-first interaction, semantic states, responsive behavior, and light/dark tokens
- Human-centered design principles
- Accessibility-first practices
- Desktop application UX patterns
- Browser extension UX patterns
- Developer tool workflows

Material 3 survives in this Skill only as an archived analysis reference ([`philosophy/material3.md`](philosophy/material3.md)) for reviewing products that already use Material; it is not a visual direction AzSkills applies.

## Local Adaptation

Do not blindly copy any external visual language. Treat VSCodium / VS Code as a workbench interaction reference, not a visual clone target. Adapt recommendations for:

- Windows applications
- Browser extensions
- Open-source utilities
- Developer tools
- Chinese and international users

Consider platform expectations, input methods, screen constraints, and user expertise.

## Workbench Usability Checks

For developer tools and technical libraries, review navigation-rail usefulness, sidebar density, search/command entry, primary-content priority, optional panel behavior, status feedback, keyboard access, empty/loading/error states, and narrow-screen navigation. Do not add workbench regions unless they support a real task.

## Review Method

Analyze interfaces through five layers:

1. User goal
2. Information architecture
3. Interaction behavior
4. Visual consistency
5. Engineering feasibility

## Review Output

When reviewing an interface, provide:

1. User goal analysis
2. Current experience assessment
3. Information hierarchy review
4. Interaction problems
5. Visual consistency issues
6. Accessibility concerns
7. Priority-ranked improvement suggestions
8. Implementation considerations

## Engineering Collaboration

Recommendations should be actionable for developers:

- Describe affected components
- Explain required states
- Identify data or state changes
- Consider backward compatibility
- Avoid unnecessary redesigns when incremental improvement is sufficient

## Decision Framework

UX recommendations should separate observations from proposals:

### Observation

Describe the current behavior and the user impact without assuming the cause.

### Analysis

Explain the likely usability principle involved:

- Discoverability
- Consistency
- Feedback
- Error prevention
- Cognitive load
- Accessibility

### Recommendation

Provide an actionable improvement with:

- Expected user benefit
- Affected interface area
- Implementation considerations
- Possible trade-offs

## Quality Requirements

A UI/UX review should avoid generic visual comments. Prefer concrete analysis:

- Do not only say that a layout is unclear; identify the information hierarchy problem.
- Do not only suggest adding animations; explain whether motion improves feedback.
- Do not only recommend consistency; identify the conflicting mental models.
- Do not redesign working flows without identifying a measurable user problem.

## Platform Awareness

Recommendations must consider the target environment:

- Desktop applications should respect keyboard workflows and window behavior.
- Browser extensions should consider popup limitations and permission trust.
- Developer tools should preserve information density and expert workflows.
- Open-source utilities should balance simplicity with advanced configuration needs.
