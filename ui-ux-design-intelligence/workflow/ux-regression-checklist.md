# UX Regression Review Checklist

## Purpose

Provide a repeatable review method for detecting user experience regressions during feature changes.

## Workflow Impact

Review whether the change preserves:

- Original user goals
- Existing task completion paths
- Familiar interaction patterns
- Important keyboard workflows

## Interaction Regression

Check:

- Default state behavior
- Focus handling
- Keyboard navigation
- Loading feedback
- Error recovery
- Disabled states

## Information Regression

Check:

- Important information remains discoverable
- New options do not hide common actions
- Settings remain grouped by user intent
- Advanced features do not overwhelm primary workflows

## Platform Regression

Consider the target environment:

### Desktop Applications

- Window behavior
- Keyboard-first workflows
- System conventions

### Browser Extensions

- Popup constraints
- Permission transparency
- Fast task completion

### Developer Tools

- Information density
- Expert workflows
- Configuration visibility

## Review Output

A regression finding should include:

- Changed workflow
- User impact
- Reproduction scenario
- Severity reasoning
- Recommended fix
- Implementation considerations
