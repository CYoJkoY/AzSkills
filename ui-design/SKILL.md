---
name: ui-design
description: Design, build, refine, and review production interfaces with one visual thesis, a token-based system, complete states, responsive behavior, accessibility, and rendered visual QA. Use for web apps, dashboards, tools, settings, forms, and component libraries.
version: 2.0.0
status: canonical
family: interface
modes: [build, refine, review, system]
---

# UI Design

Turn a product requirement into a coherent interface and a usable
implementation. This Skill owns the interface layer: hierarchy, composition,
components, states, responsive behavior, accessibility, and visual verification.
It does not choose the runtime or absorb motion-only, identity, or publishing
work.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task creates, changes, or reviews a product-facing interface, component system, or design token layer.
- Do not use when: the task is runtime selection (`architecture`), motion-only construction or audit (`ui-motion`), identity or character marks (`logo-generator`), or document publishing (`readme-craft`, `steam-mod-page`).
- Owns: visual hierarchy, composition, component behavior, state coverage, responsive layout, accessibility, and rendered UI quality.
- Inputs: repository context, existing design system, normalized DESIGN.md when present, target users, primary tasks, locales, input methods, stack, and performance limits.
- Outputs: implemented interface, refined component, review findings, or design-system contract, with evidence from the rendered result.
- Compose with: `design-system` before implementation when a DESIGN.md exists; `ui-motion` for motion; `architecture` when the stack is unresolved.
- Gates: every relevant state is visible and distinguishable; keyboard, focus, contrast, and themes hold; the rendered result is inspected at real sizes.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `build` | New page, flow, shell, or component | Context, thesis, system, composition, implementation, QA | Implemented interface |
| `refine` | Existing UI needs hierarchy, polish, or coherence | Diagnose, rank, smallest visual change, verify | Focused diff |
| `review` | Read-only audit of an existing interface | Evidence, hierarchy, states, accessibility, verdict | Ranked findings |
| `system` | Implement a contract normalized by `design-system` in the target stack | Inventory, map, implement, document, verify | Token and component implementation |

## Workflow

### 1. Read the product and the repository

Collect only what changes the design:

```text
Product and primary task:
Primary user and expertise:
Usage context and frequency:
Content density:
Locales and input methods:
Existing identity and tokens:
Framework and styling model:
Target devices and browser baseline:
Performance and accessibility constraints:
```

Inspect the app shell, routes, global styles, token files, component library,
theme handling, and existing design documentation. Preserve the existing system
unless the task explicitly replaces it.

### 2. Lock one visual thesis

Write four lines before styling:

```text
Purpose: what the surface helps the user accomplish
Tone: what it should feel like
Constraint: what must not be compromised
Signature: the one or two ideas worth remembering
```

Choose one dominant direction from the product context. Spend boldness on the
signature ideas and keep the rest quiet. Reject interchangeable purple-gradient
shells, card grids used as the whole composition, decorative glass or glow, and
emoji standing in for an icon system.

### 3. Build from tokens and composition

Use this order:

```text
primitive -> semantic -> component -> state
```

Define color roles, type roles, spacing, geometry, borders, elevation, and motion
tokens before scattering raw values. Compose the page from task hierarchy,
reading order, grouping, alignment, density, and focal points. Cards and badges
are components, not a page architecture.

### 4. Make the shell fit the work

For technical tools and dense workflows, evaluate a workbench shell: compact
navigation, contextual sidebar, content-first main region, optional secondary
panel, and status feedback. Use a region only when it supports a real task.

- Offer compact and comfortable density when repetition or long lists justify it.
- Prioritize search or command entry, persistent selection, contextual actions, and keyboard navigation.
- Use system sans-serif for interface text and monospace for code, shortcuts, and technical values.
- For CLI or TUI surfaces, follow the [Terminal / TUI contract](../DESIGN.md#terminal--tui-contract): integer cell geometry, ANSI semantic roles, one-cell glyphs with ASCII fallbacks, and `NO_COLOR` parity. Do not translate pixel spacing, radius, shadows, or hover into terminal output.

### 5. Design the state matrix

Cover the states the surface actually has:

```text
default | hover | focus | active | selected
disabled | loading | empty | no-results | error | success
partial | offline | permission-denied | recovery
```

Selection uses a marker or shape plus emphasis. Focus remains visible after the
pointer leaves. Color never carries status alone. Destructive actions have a
distinct confirmation or recovery path.

### 6. Model responsive behavior

Define breakpoints from content pressure, not device names. Decide what moves,
collapses, stacks, scrolls, or hides at each width. Preserve primary content and
state across resize. Test long labels, CJK, RTL, 200 percent text, zoom, and
keyboard-only use.

### 7. Implement the smallest coherent system

- Reuse existing components before creating a variant.
- Keep domain state outside presentational components.
- Use semantic HTML before ARIA; use ARIA only to fill a real gap.
- Prefer CSS custom properties, native nesting, `:has()`, container queries, and logical properties when the baseline supports them.
- Animate only after the static states are correct; hand motion construction to `ui-motion`.
- Keep icon geometry on one grid and one optical weight.
- Use real content or representative content; never invent metrics or proof.

### 8. Verify the rendered result

Run these passes in order: structure, states, responsive, accessibility, themes,
performance, visual QA. Inspect at realistic desktop and narrow widths, in light
and dark themes. Check a grayscale view: if hierarchy and grouping disappear
without color, the composition is not finished.

For reviews, rank findings by user impact and give one smallest corrective action
per finding. Separate observation, principle, recommendation, and tradeoff.

## Quality gates

- [ ] One visual thesis is visible in the result; decoration does not substitute for hierarchy.
- [ ] Tokens exist for color, type, spacing, geometry, and state; raw values are not scattered.
- [ ] Every relevant state is present, distinguishable, and recoverable.
- [ ] Keyboard order, focus visibility, labels, semantics, and contrast pass.
- [ ] Long content, CJK, RTL, zoom, and 200 percent text do not break layout.
- [ ] Primary content survives every target width without horizontal overflow.
- [ ] Light and dark themes are both inspected; color is not the only status cue.
- [ ] Motion, when present, has a named purpose and reduced-motion parity.
- [ ] The rendered result is inspected at real sizes and content extremes.
- [ ] The implementation stays inside the existing stack and component system.
- [ ] The result contains no invented data, proof, screenshots, or links.
- [ ] The final response states what was verified and what remains unverified.

## Output contract

For implementation:

```text
Visual thesis:
System and token changes:
Components and states:
Responsive behavior:
Accessibility and theme checks:
Verification evidence:
Unverified items:
```

For review:

```text
Verdict:
Findings ranked by user impact:
Observation -> principle -> recommendation -> tradeoff:
Unverified items:
```

## References

- `references/implementation-details.md` - detailed layout, typography, color, forms, motion handoff, performance, and review procedure.
- `references/aesthetics.md` - composition-first visual critique and anti-generic quality gate.
- `references/ux/overview.md` - product-level UX analysis, platform patterns, and review workflow.
