# Design System Audit Workflow

## Purpose

Provide a structured method for reviewing interface consistency beyond individual screens.

The audit focuses on reusable design rules, component behavior, and platform adaptation.

## Audit Scope

### Design Tokens

Review:

- Color roles and semantic usage
- Typography hierarchy
- Spacing scale
- Corner radius rules
- Elevation and surface treatment

Avoid evaluating isolated visual preferences. Identify whether the system communicates consistent meaning.

## Component Consistency

Review reusable components:

- Buttons
- Inputs
- Dialogs
- Menus
- Navigation elements
- Notifications

For each component check:

- Default state
- Hover state
- Focus state
- Active state
- Disabled state
- Error state

## Interaction Consistency

Verify that similar actions behave similarly.

Examples:

- Save actions provide consistent feedback
- Destructive operations use consistent confirmation patterns
- Loading states communicate progress
- Errors provide recovery paths

## Platform Adaptation

Consider target environment:

### Windows Applications

- Keyboard-first workflows
- Native window expectations
- Dense productivity layouts

### Browser Extensions

- Limited popup space
- Permission transparency
- Fast task completion

### Developer Tools

- Information density
- Advanced configuration visibility
- Expert workflows

## Audit Output Template

```markdown
Component:

Current Behavior:

Consistency Issue:

User Impact:

Recommended Pattern:

Implementation Notes:

Migration Risk:
```

## Principles

- Prefer system-level fixes over isolated patches.
- Preserve existing workflows unless a clear usability problem exists.
- Separate observation from recommendation.
- Consider engineering constraints during design review.
