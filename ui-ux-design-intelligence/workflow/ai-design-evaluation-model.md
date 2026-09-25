# AI Design Evaluation Model

## Purpose

Provide a structured evaluation framework for AI-assisted UI/UX reviews.

The goal is not to produce a subjective design score, but to make review reasoning consistent, traceable, and actionable.

## Evaluation Dimensions

### User Goal Alignment

Evaluate whether the interface supports the intended user task.

Consider:

- Task completion clarity
- Workflow efficiency
- Unnecessary user effort
- Goal visibility

### Information Architecture

Evaluate whether information is organized according to user mental models.

Consider:

- Feature grouping
- Navigation structure
- Priority visibility
- Progressive disclosure

### Interaction Quality

Evaluate whether users understand system behavior.

Consider:

- Feedback after actions
- State visibility
- Error recovery
- Keyboard and input behavior

### Accessibility

Evaluate whether the interface supports different user abilities and contexts.

Consider:

- Keyboard navigation
- Focus management
- Text readability
- Contrast
- Alternative interaction methods

### Engineering Feasibility

Evaluate whether recommendations can be implemented safely.

Consider:

- Component impact
- State changes
- Compatibility risks
- Maintenance cost

## Review Output

Every evaluation should contain:

1. Observation
2. User impact
3. UX principle involved
4. Proposed improvement
5. Implementation considerations
6. Trade-offs

## Avoid

Do not:

- Replace user problems with personal visual preference
- Recommend redesign without identifying a usability issue
- Optimize isolated screens while ignoring complete workflows
- Ignore platform conventions

## Integration With PR Reviews

During pull request reviews, use this model to check:

- Whether new features preserve existing workflows
- Whether interaction states are complete
- Whether UI changes introduce regression risks
- Whether implementation matches the intended user experience
