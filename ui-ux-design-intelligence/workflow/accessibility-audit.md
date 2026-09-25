# Accessibility Audit Workflow

## Purpose

Provide a structured method for evaluating interface accessibility during UI/UX reviews.

The goal is not only compliance checking, but ensuring users can complete tasks reliably across different interaction contexts.

## Audit Dimensions

## Keyboard Interaction

Check:

- All important actions are reachable without a mouse
- Tab order follows user workflow
- Focus state is visible
- Keyboard shortcuts do not conflict with platform conventions
- Dialogs trap and restore focus correctly

## Focus Management

Review:

- Initial focus placement
- Focus movement after actions
- Focus restoration after closing overlays
- Hidden or disabled elements receiving focus

## Visual Accessibility

Evaluate:

- Text readability
- Contrast between foreground and background
- Information not relying only on color
- Clear visual hierarchy
- Consistent status indicators

## Interaction Accessibility

Check:

- Click targets are sufficiently usable
- Important actions provide feedback
- Errors explain recovery steps
- Destructive operations require appropriate confirmation

## Desktop Application Considerations

Consider:

- Native keyboard workflows
- Window scaling
- High DPI displays
- System theme integration
- Screen reader compatibility

## Browser Extension Considerations

Consider:

- Popup size limitations
- Permission explanations
- Keyboard navigation inside constrained layouts
- Clear separation between browser actions and extension actions

## Developer Tool Considerations

Consider:

- Dense information presentation
- Expert shortcuts
- Configurable workflows
- Avoiding unnecessary simplification of advanced features

## Review Output Template

```markdown
Area:

Current Behavior:

Accessibility Risk:

User Impact:

Recommended Improvement:

Implementation Notes:

Compatibility Considerations:
```

## Integration With PR Review

Use this workflow to check:

- Whether UI changes introduce accessibility regressions
- Whether new components expose complete interaction states
- Whether existing keyboard workflows remain functional
- Whether platform-specific accessibility expectations are respected
