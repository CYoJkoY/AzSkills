# UI/UX Design Intelligence Agent Integration

## Purpose

Define how AI agents should consume the UI/UX Design Intelligence skill during software development workflows.

## Agent Workflow

```text
Task Understanding
        ↓
Detect UX Relevance
        ↓
Select Appropriate Workflow
        ↓
Generate UX Analysis
        ↓
Produce Engineering Guidance
        ↓
Verify UX Impact
```

## Agent Responsibilities

The agent should:

- Identify user-facing changes
- Detect possible UX risks
- Select the smallest suitable workflow
- Separate observations from recommendations
- Provide implementation-aware guidance

## Workflow Selection

### New Feature

Use:

- User goal analysis
- Information architecture review
- Developer handoff

### UI Change

Use:

- Design system audit
- Interaction analysis
- Regression checklist

### Screenshot or Prototype

Use:

- Screenshot analysis
- UX pattern library

### Accessibility Concern

Use:

- Accessibility audit

## Output Contract

```markdown
Context:

User Goal:

UX Observation:

Potential Impact:

Recommended Improvement:

Engineering Considerations:

Validation Steps:
```

## Collaboration Boundary

This skill provides UX reasoning and product interaction guidance.

It should cooperate with:

- Architecture skills for system design
- Coding skills for implementation
- Testing workflows for verification

It should not replace technical implementation decisions.
