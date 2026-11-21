# DESIGN.md Schema Reference for AzSkills

## Document layers

Optional YAML front matter carries exact tokens. Markdown sections carry rationale and application guidance.

## Common token groups

colors, typography, spacing, rounded, components.

Unknown groups should be preserved as source context, not silently discarded.

## Value forms

Expect CSS colors, CSS dimensions, explicit unitless numbers, typography objects, and token references such as {colors.primary}. Preserve source syntax unless the target implementation requires adaptation.

## Canonical body order

Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts.

Public corpora may add Responsive Behavior and Agent Prompt Guide. AzSkills treats those as execution metadata.

## Component variants

Keys such as button-primary, button-primary-hover, and button-primary-active normalize into component=button, variant=primary, state=rest/hover/pressed.

## AzSkills extension record

source; sourceFormat; confidence; targetSurface; normalizedToken; mapping; exception; verification.

These are adapter concepts, not upstream DESIGN.md fields.

## Translation

colors/typography/spacing/rounded → Primitive → Semantic → Component → State → Responsive + Accessibility + Motion QA.
