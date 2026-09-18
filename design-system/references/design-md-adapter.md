# DESIGN.md Adapter Reference

## Two-layer interpretation

machine layer = exact values
prose layer = intent, usage, hierarchy, exceptions

When both describe the same property, the machine token determines the value and prose determines role/intent. For prose-first files, explicit tables/lists are verified-prose evidence rather than synthetic tokens.

## AzSkills normal form

Context; tokens.colors; tokens.typography; tokens.spacing; tokens.rounded; tokens.elevation; components; states; responsive; accessibility; provenance; exceptions.

## Section translation

Visual Theme & Atmosphere → visual thesis
Overview / Brand & Style → visual thesis
Color Palette & Roles → colors + semantic roles
Typography Rules → typography roles
Layout Principles / Layout & Spacing → spacing + grid + composition
Depth & Elevation → surfaces + elevation
Shapes → geometry + radii
Component Stylings / Components → components + states
Do's and Don'ts → guardrails
Responsive Behavior → responsive matrix + QA
Agent Prompt Guide → convenience only

## Token precedence inside one source

explicit token
>
explicit prose/table value
>
repeated component usage
>
inferred usage
>
AzSkills implementation default

The bottom two levels must be labeled.

## Multiple-source precedence

target product source
>
target brand guideline
>
project-local DESIGN.md
>
specific design analysis
>
collection summary
>
generic inspiration

## Fidelity rule

Optimize source intent × product fit × technical feasibility. The adapter preserves design rules rather than performing literal screenshot imitation.

## Validation

Before implementation: classify; extract; map semantics; map components/states; separate responsive behavior; identify accessibility/motion requirements; list unresolved assumptions.

After implementation: check token drift; render; compare; test responsive states; keyboard/focus; localization expansion; theme contexts; provenance.
