---
name: design-system
description: Consume, author, normalize, adapt, and verify DESIGN.md files as AzSkills-native visual contracts. Use when a project provides DESIGN.md, a brand reference must become implementation rules, or a design contract needs validation.
---

# Design System

This Skill is the boundary between external DESIGN.md systems and AzSkills. It does not replace ui-design, ui-aesthetics, or frontend-architecture; it converts design evidence into an AzSkills-native contract that those Skills can execute.

## Core pipeline

DESIGN.md → classify → extract → normalize → contextualize → Primitive → Semantic → Component → State → implement → verify → record provenance.

## Scope

Apply when consuming, authoring, migrating, reconciling, or auditing DESIGN.md. Do not apply mechanically to pure backend/infrastructure work or to UI work whose authoritative local token system is already complete and no DESIGN.md is involved.

## Precedence

1. Explicit user requirements.
2. Active Skill hard constraints.
3. Existing product identity and authoritative local design system.
4. Platform, accessibility, and domain requirements.
5. AzSkills-normalized DESIGN.md contract.
6. Owning implementation Skill such as ui-design or frontend-slides.
7. ui-aesthetics judgment.
8. Raw external inspiration.

A DESIGN.md is an input protocol, not unconditional authority.

## Source classes

### Token-bearing

YAML front matter contains machine-readable tokens. Treat exact token values as normative inside that document; use prose for intent and usage.

### Prose-first

No token front matter. Extract explicit values and rules as verified-prose evidence. Do not fabricate a token database from prose.

### Mixed

Use tokens for exact values and prose for composition, states, responsive behavior, accessibility, motion, and rationale.

## Normal form

Context → Primitive → Semantic → Component → State, with Responsive, Accessibility, Motion, Provenance, and Exceptions as execution metadata.

### Primitive

Raw colors, typography, spacing, radii, borders, elevation, motion primitives.

### Semantic

Canvas, surfaces, text roles, accent roles, status roles, focus, selection, disabled, semantic motion.

### Component

Navigation, buttons, inputs, cards, lists/tables, overlays, and domain-specific components.

### State

Rest, hover, focus-visible, active/pressed, selected, disabled, and applicable loading/success/error/empty/expanded/offline states.

## Section mapping

| DESIGN.md source | AzSkills mapping |
|---|---|
| Overview / Brand & Style / Visual Theme & Atmosphere | Context + visual thesis |
| Colors / Color Palette & Roles | Primitive + Semantic colors |
| Typography / Typography Rules | Primitive + Semantic typography |
| Layout / Layout Principles | spacing + grid + composition |
| Elevation & Depth | surfaces + elevation |
| Shapes | geometry + radii |
| Components / Component Stylings | Component + State |
| Do's and Don'ts | guardrails |
| Responsive Behavior | responsive behavior + QA |
| Agent Prompt Guide | convenience hints only |

The extended nine-section corpus vocabulary is mapped into the canonical AzSkills hierarchy instead of copied into every downstream Skill.

## Token extraction

### Colors

Prefer semantic roles over appearance names.

primary → accent/action
secondary → supporting accent or surface, depending on context
neutral → canvas/surface/text according to usage
success / warning / danger / info → status roles

Do not assume primary means CTA color without reading component usage. Preserve exact source color notation unless the target implementation requires adaptation.

### Typography

Normalize into display, page-title, section-heading, body, label, metadata, numeric, and mono/code roles. Preserve font family, size, weight, line-height, letter-spacing, and font-feature information when present.

A proprietary source font is not silently replaced during normalization. A fallback is an implementation choice and must be labeled as such.

### Spacing and shapes

Preserve the source scale before creating an internal scale. Normalize repeated dimensions into reusable tokens; keep one-off values local only when the source clearly treats them as exceptional.

### Components

Prefer component-type → variant → state. Do not turn every prose example into a new component token.

## Provenance

Classify every material decision as:

- verified-token: explicit machine-readable source token;
- verified-prose: explicit source statement/table value;
- inferred-usage: derived from repeated source usage;
- implementation-choice: selected for the target stack;
- unresolved: source is insufficient or ambiguous.

Never present inferred or implementation choices as source facts.

## Multi-source reconciliation

Multiple DESIGN.md files form a reference corpus, not one averaged design system.

1. Determine whether they describe one product or separate references.
2. Select an authority per visual domain.
3. Use secondary sources only for explicit gaps.
4. Record source precedence.
5. Re-run component/state mapping after reconciliation.

Do not merge unrelated brands merely because individual values are attractive.

## External reference handling

Public collections such as awesome-design-md are used to understand schema shape and source-analysis techniques. Prefer target brand/source evidence over collection summaries. Do not copy complete DESIGN.md files or third-party preview assets into AzSkills. Verify material values against the target project's own source where practical.

## Contextualization

Before implementation inspect:

target surface
existing design system
frontend stack
browser/device baseline
supported locales
accessibility baseline
performance limits
existing icon/motion/component systems

Classify each imported rule as:

adopt unchanged
adapt to platform
adapt to existing product system
keep as reference only
reject as conflicting

DESIGN.md must not silently become an architectural specification.

## Cross-Skill composition

- frontend-architecture defines implementation boundaries; DESIGN.md does not choose the framework.
- ui-design is the primary implementation, accessibility, interaction, responsive, and visual-QA layer.
- ui-aesthetics critiques and refines after normalization.
- frontend-slides maps the contract into its fixed stage.
- logo-generator handles identity-specific extraction only.
- readme-craft keeps GitHub rendering and information architecture authoritative.
- ultrathink is appropriate for ambiguous migrations and multi-source conflicts.

## Authoring a new DESIGN.md

Start with the canonical YAML token layer, follow the ordered body sections, document meaningful component states and responsive behavior, explain intent rather than repeating values, mark intentional omissions, and validate representative rendered output.

## Migration workflow

1. Preserve the source file unchanged as evidence.
2. Classify the format.
3. Extract explicit tokens and rules.
4. Map source vocabulary into AzSkills semantic roles.
5. Build component/state mappings.
6. Separate responsive, accessibility, and motion guidance from static styling.
7. Record inferred values and implementation choices.
8. Resolve conflicts with the target project's local system.
9. Validate the normalized result.
10. Verify rendered output against source intent and local product context.

Do not rewrite an external DESIGN.md merely to make it easier to consume.

## Quality gates

### Source integrity
- [ ] source format classified;
- [ ] token and prose evidence distinguished;
- [ ] token references resolve or are explicitly unresolved;
- [ ] external prose/assets were not copied wholesale.

### Semantic integrity
- [ ] raw values map to semantic roles;
- [ ] component/state mappings are explicit;
- [ ] responsive rules are executable;
- [ ] accessibility requirements are explicit;
- [ ] motion never becomes the only state signal.

### Project integrity
- [ ] existing product identity inspected;
- [ ] frontend architecture preserved;
- [ ] existing icon/motion/component systems reused where applicable;
- [ ] localization/RTL implications checked.

### Visual integrity
- [ ] representative components rendered;
- [ ] spacing and alignment checked at realistic sizes;
- [ ] typography wrapping/fallback checked;
- [ ] contrast checked in each shipped theme;
- [ ] interactive states remain coherent;
- [ ] narrow, intermediate, and wide layouts inspected.

### Provenance
- [ ] material decisions identify evidence level;
- [ ] exceptions are documented;
- [ ] inferred values are not presented as source facts.

## Output contract

Produce an AzSkills-native contract containing: Context; Visual thesis; Normalized tokens; Component/state matrix; Responsive matrix; Accessibility/interaction rules; Implementation mapping; Provenance/exceptions.

For implementation-only tasks, keep this as internal working context and avoid unnecessary source-analysis output.

## Anti-patterns

Never copy a complete third-party DESIGN.md for convenience, average unrelated brands, let DESIGN.md dictate framework choice, treat an Agent Prompt Guide as normative, turn every example into a component, or invent missing tokens without labeling the inference.

## Verification loop

source → normalize → implement → render → compare
          ↑                         ↓
          └────── correct gaps ─────┘

Fix systemic mapping errors before polishing isolated elements.
