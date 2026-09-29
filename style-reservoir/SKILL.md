name: style-reservoir
description: Maintain a progressive-disclosure visual style reservoir and select compatible StyleKit-derived references from task context without overriding explicit or project-owned design systems. Use for underspecified UI direction, visual exploration, or context-sensitive aesthetic augmentation; stay out of pure logic/backend work and do not force a style when evidence is weak.

# Style Reservoir

The Style Reservoir is a bounded design-reference capability. It stores a local, searchable catalog of the current StyleKit styles and provides context-aware selection guidance. It is not a universal visual prompt and it does not replace the owning implementation Skills.

## Scope

### Applies when
- a UI, dashboard, web app, landing page, editor, settings surface, or other visual artifact needs a visual direction and the project has no sufficiently authoritative local direction;
- a task requests style exploration, visual direction, aesthetic alternatives, or a redesign whose visual language is underspecified;
- an existing visual direction needs a compatible augmentation for a specific surface, density, layout, platform, or interaction pattern.

### Stay out of the way when
- the project already has an authoritative DESIGN.md, token system, component library, brand guide, or established visual language that fully covers the requested work;
- the user explicitly specifies a visual system that should be followed;
- a narrowly scoped UI bug fix can be completed without changing the visual direction;
- the task is backend, data, infrastructure, or otherwise non-visual;
- available context is too weak or contradictory to justify a style selection.

## Precedence

Use these sources in order:
1. Explicit user visual requirements.
2. Existing product identity and authoritative local design system.
3. Platform, accessibility, and established component constraints.
4. The owning AzSkills implementation Skill (ui-design, ui-aesthetics, or a more specific visual Skill).
5. Style Reservoir references, only where they improve fit without conflicting with 1–4.

The reservoir is advisory at selection time. A selected style never grants permission to replace local tokens, architecture, copy, icons, motion systems, or accessibility behavior.

## Progressive disclosure

Do not load all style definitions into active reasoning.
1. Start with style-reservoir/references/stylekit-catalog.json as the compact index.
2. Filter by styleType, category, tags, keywords, colors, and compatibleWith.
3. Read only the selected style's upstream source when deeper component-level rules are actually needed.
4. Translate the selected evidence into AzSkills-native primitives, semantic tokens, component/state rules, responsive behavior, accessibility rules, and motion.
5. Keep the selected source reference recorded internally; do not expose a large style dump unless requested.

This keeps normal UI tasks small while retaining the full 148-style reservoir.

## Automatic activation model

Activation is conditional, not blanket.
Use the reservoir when all of the following are true:
- the task is visual;
- a concrete visual decision is needed;
- local or explicit direction is absent or incomplete;
- the surrounding project context contains enough signals to discriminate between styles.

Do not activate it merely because a task contains the word UI, and do not activate it for every visual task by default.

A useful internal decision is: need style reference + enough context + no higher-priority authority conflict.
If any term is false, do not force selection.

## Context model

Capture the smallest useful context vector:
| Dimension | Examples of evidence |
| --- | --- |
| Product / application scenario | SaaS, admin, editor, utility, commerce, portfolio, game, editorial, documentation |
| Surface | landing page, dashboard, settings, form, table, dialog, gallery, full-screen hero |
| Layout | bento, masonry, split screen, sidebar, dense grid, editorial grid, full-bleed, scrolling story |
| Density | compact, operational, balanced, airy |
| Platform | mobile, desktop, responsive web, embedded tool surface |
| Content | data-heavy, image-led, text-led, developer-oriented, transactional |
| Interaction | static, form-heavy, drag/scroll, direct manipulation, high-feedback |
| Visual intent | calm, playful, expressive, technical, editorial, premium, utilitarian, nostalgic |
| Motion | none, subtle, spatial, kinetic, immersive |
| Accessibility / capability | reduced motion, low-power, high-contrast, touch constraints, text scaling |
| Existing direction | local tokens, components, brand language, DESIGN.md, established patterns |

Use only evidence present in the task/project. Do not invent a product personality to make a style fit.

## Selection procedure

1. Inspect local authority. Read the existing visual system before consulting the reservoir.
2. Normalize context. Convert product, surface, layout, density, platform, content, interaction, and mood into a small context vector.
3. Filter hard constraints. Remove styles whose type or layout mechanism is incompatible with the target surface.
4. Filter semantic fit. Use descriptions, tags, keywords, and category to narrow the candidate set.
5. Check compatibility. Prefer compatibleWith relationships when combining styles. Treat missing compatibility as unknown, not as permission.
6. Choose minimal scope. Prefer one coherent visual direction. Add a second style only when one is a layout mechanism and the other supplies a compatible visual treatment that is genuinely useful.
7. Read only needed detail. Inspect the selected source file(s) for exact component, spacing, motion, and implementation guidance.
8. Adapt, do not transplant blindly. Map evidence into the project's own semantic tokens and components.
9. Check conflicts. Reject rules that contradict product identity, accessibility, platform limitations, or the project's implementation architecture.
10. Verify. Run the normal owning Skill's responsive, accessibility, interaction, performance, and visual-QA checks.

## Fit heuristics

The following are discovery signals, not hard-coded mandates:
- styleType=layout is relevant when composition or information architecture is the primary unresolved problem.
- styleType=visual is relevant when surface language, typography, color, depth, texture, or component character is the primary unresolved problem.
- category=modern often fits contemporary product surfaces, but product context still decides.
- category=minimal often fits content-first, clarity-led, or high-information interfaces where decorative load should remain low.
- category=expressive is worth considering when visual personality is itself part of the product value.
- category=retro is relevant for nostalgic, period-coded, game, media, or intentionally historical directions.
- tags and keywords are stronger evidence than category alone.
- a strong compatibleWith relationship is a positive signal when a mixed direction is necessary.
- color fields are clues for palette fit, not a reason to overwrite a local semantic color system.
- a style with no matching evidence should be ignored even if it is visually distinctive.

## Safe augmentation

When a project already has a visual system but one surface needs additional character:
- keep the local typography, spacing scale, semantic colors, accessibility rules, and component primitives unless there is an explicit reason to change them;
- borrow only the specific pattern that solves the local problem;
- document the exception in the same design-system layer rather than creating a parallel token system;
- prefer structural ideas (grid, hierarchy, component shape, interaction pattern) before importing decorative effects.

## Failure-closed behavior

Do not force a selection when:
- multiple candidates fit equally well and the choice would materially change product identity;
- the target platform cannot safely support the defining mechanism of a candidate;
- the candidate conflicts with the local design system;
- accessibility or reduced-motion requirements eliminate the defining behavior;
- the source data is incomplete for a decision that requires more detail.

In these cases, keep the existing direction and continue with the owning UI Skill.

## Output contract

The reservoir produces internal working context:
- Context vector;
- Candidate set or selected style slug(s);
- Evidence used;
- Conflicts rejected;
- Adaptation notes;
- Source reference(s).

Do not force a user-facing style report. The owning visual Skill remains responsible for the final implementation and QA contract.

## Composition

- design-system owns DESIGN.md ingestion, normalization, reconciliation, and provenance.
- ui-design owns production UI architecture, interaction, responsive behavior, accessibility, motion, and visual QA.
- ui-aesthetics owns visual judgment, critique, composition, and anti-generic refinement.
- More specific visual Skills remain authoritative for their artifact type.

The reservoir supplies reference candidates; it does not become a competing implementation system.
