# Screenshot Analysis Workflow

## Purpose

Provide a structured method for analyzing UI screenshots, prototypes, and visual references with AI assistance.

## Analysis Scope

### Visual Hierarchy

Review:

- Primary user goal visibility
- Content priority
- Information density
- Alignment and grouping

### Layout Quality

Inspect:

- Spacing consistency
- Grid alignment
- Responsive behavior
- Empty states
- Overflow risks

### Component Recognition

Identify:

- Existing design system components
- Custom components
- Repeated interaction patterns
- Potential component consolidation

### Interaction Inference

Analyze visible states:

- Default
- Hover
- Focus
- Selected
- Disabled
- Error
- Loading

## Cross Platform Review

### Desktop Applications

Check:

- Window sizing
- Multi-panel layouts
- Keyboard workflow expectations
- Native platform conventions

### Browser Extensions

Check:

- Limited popup space
- Permission explanation
- Quick task completion

### Developer Tools

Check:

- Information density
- Advanced user workflows
- Debugging efficiency

## AI Review Output Format

Use the canonical `ui-design` review contract. This workflow adds
screenshot evidence to it:

```markdown
Verdict:
Findings ranked by impact:
Observation -> principle -> recommendation -> tradeoff:
Screenshot evidence: context, observable pattern, runtime checks still required
Unverified items:
```

## Limitations

Screenshot analysis should identify observable UI characteristics only. Behavior that cannot be confirmed visually should be marked as requiring runtime validation.
