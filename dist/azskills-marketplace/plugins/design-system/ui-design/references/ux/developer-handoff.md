<!-- Loaded by ui-design. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies handoff detail only. If it conflicts with the canonical
ui-design contract, the contract wins.

# Developer Handoff Workflow

## Purpose

Convert UX findings into implementation-ready engineering tasks while preserving user intent, technical constraints, and regression awareness.

## UX Finding To Engineering Task

```text
UX Observation
      ↓
User Impact
      ↓
Design Recommendation
      ↓
Implementation Scope
      ↓
Engineering Task
```

## Component Definition

Describe:

- UI element
- Responsibility
- User goal
- Related workflow

## State Coverage

Document:

- Default
- Hover
- Focus
- Active
- Loading
- Error
- Disabled
- Empty state

## Interaction Mapping

Explain:

- User action
- System response
- Data changes
- State transitions
- Failure recovery

## Issue Generation Template

```markdown
## Problem

## User Impact

## Current Behavior

## Expected Behavior

## UX Principle

## Implementation Notes

## Acceptance Criteria

## Regression Risk
```

## Accessibility Requirements

Include:

- Keyboard behavior
- Focus handling
- Semantic information
- Alternative interaction paths

## PR Review Integration

Review:

- Whether the original UX issue is solved
- Whether existing workflows remain stable
- Whether new interaction regressions are introduced
- Whether migration notes are required

## Collaboration Model

### Design Input

Provide:

- User problem
- Expected experience
- Interaction constraints
- Visual references

### Engineering Input

Provide:

- Technical limitations
- Implementation options
- Compatibility concerns
- Maintenance impact

## Output Format

Use the canonical `ui-design` build output. This workflow adds handoff evidence
to it:

```markdown
Visual thesis:
System and token changes:
Components and states:
Responsive behavior:
Accessibility and theme checks:
Verification evidence:
Handoff evidence: affected components, technical constraints, validation plan, regression risks
Unverified items:
```
