---
name: ui-design
description: Design, build, audit, and refine production frontend interfaces with an explicit visual direction, stack-aware implementation strategy, coherent design system, responsive behavior, accessible interaction model, motion language, performance discipline, localization resilience, and rigorous visual QA. Apply automatically to web interfaces, applications, dashboards, tools, settings, forms, component libraries, and interactive product surfaces.
---

# UI Design

A production frontend design skill for turning a product requirement into a coherent visual system and a usable implementation. Treat aesthetic direction, information hierarchy, interaction design, accessibility, responsiveness, motion, content, performance, and implementation architecture as one system.

This is an AzSkills synthesis of public frontend-design methodologies. It deliberately combines the strongest transferable ideas from high-profile public skills without copying or vendoring their repository-specific text or data.

## Automatic scope

Apply this skill whenever a task changes any of the following:

- page, route, shell, navigation, layout, or component structure
- visual styling, typography, color, spacing, borders, surfaces, shadows, or iconography
- responsive behavior, mobile layout, touch behavior, or viewport adaptation
- forms, dialogs, menus, tabs, tables, filters, search, settings, or other controls
- loading, empty, error, success, disabled, offline, partial-content, or permission states
- hover, focus, active, drag, gesture, transition, scroll, or page motion
- theming, light/dark mode, design tokens, or component-library consistency
- internationalization, locale switching, text expansion, or RTL behavior
- dashboard metrics, charts, data visualization, or information-density changes

For pure backend, data, infrastructure, or non-visual scripting work, do not apply it mechanically.

## Governing priority

When rules conflict, use this order:

1. Explicit user requirements.
2. Existing product identity and established design system.
3. Product/domain and platform conventions.
4. Accessibility and usability requirements.
5. This Skill.
6. Optional aesthetic references.

Do not replace an established design system merely because a newer trend exists. New visual choices must earn their place through product fit, clarity, and implementation value.

## 1. Context gathering before design

Before writing substantial UI code, inspect the project rather than designing against assumptions.

Determine:

```text
Product:
Primary user:
Primary task:
Usage context:
Content density:
Supported locales:
Primary input methods:
Existing visual identity:
Existing component system:
Framework / stack:
Styling architecture:
Browser / device constraints:
Performance constraints:
Accessibility requirements:

Visual thesis:
Interaction thesis:
Signature element:
```

Read the existing source of truth first. Depending on the project, inspect files such as:

- `package.json`
- `vite.config.*`, `next.config.*`, `astro.config.*`, framework config
- Tailwind or CSS configuration
- global styles and token files
- component-library configuration
- theme files
- route/app shell files
- existing design documentation

Never invent a parallel stack or styling system when the project already has one.

## 2. Commit to one visual direction

Before implementation, choose a deliberate visual direction rather than assembling fashionable parts.

Useful axes:

- minimal ↔ expressive
- editorial ↔ technical
- calm ↔ energetic
- formal ↔ playful
- organic ↔ geometric
- flat ↔ dimensional
- dense ↔ spacious

Choose one primary direction and record the reason it fits the product.

A strong direction answers:

```text
Purpose: What problem is the interface solving?
Tone: What should it feel like?
Constraint: What must not be compromised?
Differentiation: What visual idea will be remembered?
```

Spend most of the visual boldness on one or two signature decisions. Do not make every component novel.

Reject generic AI convergence by default:

- purple gradient SaaS screens with no product-specific rationale
- interchangeable card grids as the whole composition
- default font choices selected only because they are common in generated code
- arbitrary glassmorphism, glow, blur, bevel, chrome, or 3D effects
- decorative blobs without a communication job
- excessive pills, badges, and rounded containers
- emoji substituted for a real icon system

Distinctive does not mean noisy. Refined restraint is a valid direction.

## 3. Design-system-first workflow

For new pages, new products, or broad redesigns, create a small design system before styling isolated components.

Use this hierarchy:

```text
Primitive → Semantic → Component → State
```

At minimum define:

```text
Colors:
  canvas / surface / elevated / inverse
  text / muted / subtle
  accent / accent-contrast
  success / warning / danger / info
  focus / selected / disabled

Geometry:
  spacing scale
  radii
  border widths
  control heights

Typography:
  display / heading / body / label / metadata / numeric
  size / weight / line-height / tracking

Motion:
  micro / state / overlay / section
  easing curves

Effects:
  border / shadow / elevation / focus ring
```

Prefer a small, intentional token vocabulary. Do not create tokens for every one-off value.

For larger products, maintain one global source of truth and explicit page-level overrides rather than copying tokens into every feature.

## 4. Stack awareness

Implementation rules must follow the detected stack.

Use the project's existing conventions first. When the stack is established:

- React / Next.js: preserve the project's component and server/client boundary model.
- Vue / Nuxt: follow the existing SFC and composable conventions.
- Svelte / SvelteKit: prefer existing component and transition patterns.
- Astro: keep static-first behavior and hydrate only interactive islands.
- Plain HTML/CSS/JS: use semantic HTML, modern CSS, and progressively enhanced behavior.
- Tailwind projects: use the existing token and utility conventions rather than creating a second styling layer.
- CSS Modules / CSS-in-JS / custom CSS systems: extend the existing system before introducing another one.

Do not assume React, Tailwind, Next.js, or any other default stack merely because it is common.

When a task is implementation-heavy, distinguish three decisions:

```text
design decision → component architecture → framework implementation
```

Do not let framework convenience dictate the visual hierarchy.

## 5. Feature before shell

Design the specific user task before adding global chrome.

For every new surface, identify:

```text
Primary task
Primary action
Supporting evidence
Secondary actions
Exceptional / destructive actions
Progress or feedback
```

The shell, navigation, cards, and decorative framing should support the task rather than dominate it.

## 6. Composition and hierarchy

Composition comes before decoration.

Establish:

- clear primary and secondary emphasis
- predictable reading order
- stable alignment axes
- deliberate grouping and proximity
- useful negative space
- density appropriate to the job
- a clear focal point

Useful composition patterns include:

- hero + focal visual
- asymmetric editorial split
- evidence + annotation
- timeline / process spine
- comparison matrix
- system diagram
- full-bleed visual + typographic anchor
- content-first operational panel

Cards, pills, badges, and dividers are grouping tools, not a default page architecture.

Avoid making every section a rectangle with the same radius, border, shadow, and padding.

## 7. Modern CSS architecture

When the environment supports modern CSS, prefer native platform capabilities over unnecessary abstractions.

Use deliberately:

- CSS custom properties for tokens
- cascade layers (`@layer`) when the project benefits from explicit style precedence
- native nesting where supported by the target browser baseline
- `:has()` for parent-aware states when it materially simplifies the UI
- container queries for component-driven responsive behavior
- subgrid when shared column or row alignment materially improves consistency
- `aspect-ratio` for media and reserved visual geometry
- `clamp()` / fluid sizing where smooth scaling is more appropriate than breakpoint jumps
- logical properties for direction-aware layouts (`margin-inline`, `padding-block`, etc.)

Do not use modern CSS merely because it is available. Prefer the simplest technique that preserves the project's browser baseline and maintainability.

Do not introduce a preprocessor, utility framework, or component library solely to solve a problem the existing stack already solves cleanly.

## 8. Responsive behavior is a model

Do not define responsiveness as a list of pixel breakpoints.

For each component determine what happens as available space changes:

```text
stay anchored
compress
wrap
reflow
collapse
scroll
move to secondary navigation
progressively disclose
remove only when non-essential
```

Prefer content-driven or container-aware thresholds when the component's size matters more than the viewport.

Protect:

- no accidental horizontal overflow
- readable line lengths
- usable controls at narrow widths
- media aspect ratios
- sticky/fixed UI safe areas
- preserved primary actions

Test at least one narrow phone width, one wide desktop width, and an intermediate layout where wrapping pressure is real.

## 9. Typography as system architecture

Choose typography based on the product and language rather than generated-code convention.

Define roles for:

```text
display
page title
section heading
body
label / control
metadata
numeric / data
```

Verify:

- font fallback behavior
- weight availability
- line-height
- line length
- wrapping
- optical alignment
- tabular numerals when comparing numbers
- multilingual glyph coverage
- text expansion under localization

Avoid using typography as a density patch. If the layout is overloaded, simplify hierarchy or disclosure before shrinking type.

## 10. Color and perceptual design

Color must communicate hierarchy and state.

Prefer semantic tokens instead of hard-coded component colors.

Where the project's browser baseline allows it, OKLCH or another perceptually grounded color model can be used for palette construction and controlled lightness/chroma adjustments.

The implementation should still expose semantic roles such as:

```text
--color-bg
--color-surface
--color-surface-elevated
--color-text
--color-text-muted
--color-accent
--color-focus
--color-success
--color-warning
--color-danger
```

Light and dark themes are separate contrast problems. Validate both independently.

Never use color as the only carrier of:

- error
- success
- selection
- disabled state
- required state
- information priority

Pair color with text, icon, shape, label, position, or another redundant cue.

## 11. Surfaces, borders, and depth

Assign one job to each visual layer:

- border: structure or state
- shadow: elevation
- fill: grouping or emphasis
- blur / transparency: depth only when it helps context
- glow: intentional emphasis only

For nested surfaces, use optically concentric radii and consistent padding.

Avoid stacking border + heavy shadow + blur + glow + gradient simply to make a surface feel premium.

A good depth system remains legible in light mode, dark mode, reduced transparency, and low-end rendering conditions.

## 12. Component responsibilities and reuse

A component should have a clear responsibility boundary.

Separate:

```text
content/data
state and behavior
layout
visual tokens
accessibility semantics
```

Extract repeated patterns only after their repeated behavior is real. Do not build a giant universal component with dozens of boolean props merely to avoid a small amount of duplication.

When three or more components share the same visual rule, prefer a token or primitive before copying raw values.

## 13. Interaction state matrix

Every interactive control needs an explicit state model:

```text
rest
hover
focus-visible
active / pressed
selected
disabled
```

When applicable:

```text
loading
success
error
empty
expanded
collapsed
open
closing
offline
permission denied
```

Use at least one static cue for important state changes. Motion can reinforce the cue but must never be the only signal.

Never make hover a prerequisite for an action.

## 14. Forms and task flows

Use native semantics first:

- `<label>` for inputs
- `<button>` for actions
- `<a href>` for navigation
- native validation and input types where appropriate

Rules:

- placeholders are hints, not labels
- preserve paste and browser autofill
- do not block zoom
- group fields according to the user's mental model
- validate at a useful point in the task
- place errors next to the affected field and summarize complex errors
- preserve user input after errors
- focus the first actionable error when appropriate
- explain what happened and what the user can do next

For menus, tabs, dialogs, listboxes, comboboxes, sliders, and other composite widgets, follow established keyboard interaction patterns instead of inventing new ones.

## 15. Accessibility baseline

Use semantic HTML before ARIA.

Every pointer interaction requires a keyboard path.

Focus requirements:

- use `:focus-visible`
- keep a visible, high-contrast focus indicator
- use a clear perimeter or equivalent visible area; do not visually hide focus
- restore focus predictably after dialogs and overlays close

Target sizes:

- practical minimum: about 24×24 CSS px for exceptions where density requires it
- preferred desktop target: about 40×40 when density permits
- preferred touch target: about 44×44

Icon-only controls need accessible names. Decorative icons should not become meaningless screen-reader content.

Do not rely on hover, color, motion, or shape alone for critical information.

Respect user font scaling and system contrast preferences where the platform exposes them.

## 16. Reduced motion and motion sensitivity

Treat reduced motion as a first-class design variant.

Under `prefers-reduced-motion: reduce`:

- keep content visible
- remove non-essential translation, scale, parallax, and continuous loops
- prefer immediate state changes or subtle opacity transitions
- disable autoplay-driven decorative motion
- preserve task feedback through static cues

Never let an essential state depend on an animation completing.

## 17. Motion system

Use a small reusable motion vocabulary.

Recommended starting ranges:

```text
micro interaction:       120–200ms
UI state change:         180–260ms
overlay / toast:         220–320ms
section entrance:        400–800ms
hero / onboarding:       800–1600ms
```

Use a small set of easing curves. Ease-out is generally suitable for entering and feedback; exits should be shorter and context-preserving.

Use:

- fade + rise for infrequent entrances
- scale + fade for compact overlays and emphasis
- slide for drawers and local panel transitions
- shared-element continuity only when stable geometry materially improves comprehension

Stagger only infrequent, choreographed entrances. Do not animate every row, keystroke, or hover.

Motion must be interruptible. Prefer transitions that can reverse cleanly from the current state.

## 18. Performance-aware visual engineering

Prefer compositor-friendly animation properties:

- `transform`
- `opacity`

Avoid repeatedly animating layout-heavy properties such as:

- `width`
- `height`
- `top`
- `left`

Be cautious with large-area blur, filters, and backdrop effects.

Use `will-change` only after identifying a real rendering problem.

Prevent layout instability:

- reserve image/media dimensions
- avoid late font swaps that cause visible layout jumps when practical
- avoid unnecessary synchronous layout measurement
- virtualize genuinely large lists when the existing stack supports it
- keep decorative effects from dominating frame time

For content-heavy surfaces, consider `content-visibility` and containment only after understanding their effect on the project's browser and accessibility baseline.

## 19. Imagery and iconography

Use imagery for communication, not merely decoration.

Image treatment must account for:

- crop behavior
- focal point
- aspect ratio
- low-quality placeholders
- loading state
- light/dark surroundings
- text over image contrast

For icon systems:

- use one coherent vocabulary per surface
- prefer semantic SVG icons with `currentColor`
- keep stroke weight visually compatible with typography
- use filled variants intentionally for active/selected states
- optically align asymmetric icons
- do not use emoji as a UI icon substitute unless explicitly required

## 20. Data visualization

When UI includes charts or metrics, choose the representation from the question being answered rather than visual novelty.

First determine whether the user needs:

```text
comparison
trend
distribution
part-to-whole
relationship
ranking
single KPI
```

Then choose a chart that matches the task.

Rules:

- label axes and units where needed
- keep legends understandable
- preserve color-independent differentiation
- provide accessible text summaries or equivalent information
- avoid decoration that hides the signal
- use consistent scales across comparable charts

## 21. Internationalization and RTL

Treat localization as a layout and interaction requirement.

Use stable message keys, not source-language sentences, as the UI model.

Test all supported locales for:

- every route
- dynamically rendered content
- buttons and labels
- placeholders
- titles and tooltips
- `aria-label`s
- toasts and validation errors
- empty and error states
- long translations
- date / number / currency formatting
- RTL behavior where applicable

Use logical CSS properties where appropriate so direction changes do not require duplicating layout rules.

Do not translate user data, filenames, identifiers, IDs, or proper nouns merely because they appear in the UI.

## 22. Content hierarchy and UX writing

A polished UI is also clear copy.

Prefer labels that tell the user what an action does, not what the internal implementation calls it.

For important actions:

```text
what will happen
what object is affected
whether the action is reversible
what happens next
```

Error copy should identify:

```text
problem → impact → recovery action
```

Do not hide essential instructions in tiny helper text merely to keep a layout visually sparse.

## 23. Hardening and edge cases

Before calling a surface complete, inspect:

- empty data
- one item
- many items
- very long text
- localized text expansion
- slow network
- duplicate submissions
- failed submission
- partial data
- permission denied
- offline / reconnecting
- loading skeleton or spinner behavior
- disabled controls
- keyboard-only operation
- narrow viewport
- large text / zoom
- dark mode
- reduced motion

A UI that only works with ideal content is unfinished.

## 24. Verification protocol

Use a repeatable review loop instead of relying on visual intuition alone.

### Pass A — structure

- primary task is obvious
- hierarchy is understandable within seconds
- information architecture matches the user's mental model
- shell does not dominate feature content

### Pass B — states

- rest / hover / focus / active / selected / disabled are coherent
- loading / success / error / empty states exist where relevant
- feedback explains cause and next action
- focus restoration works after overlays close

### Pass C — responsive

- narrow phone width
- intermediate wrapping pressure
- wide desktop
- zoom / large text
- no accidental horizontal overflow

### Pass D — accessibility

- semantic elements are used
- keyboard flow completes the primary task
- focus is visible
- icon-only controls are named
- contrast and non-color cues are sufficient
- reduced motion remains usable

### Pass E — themes

- light mode verified
- dark mode verified
- focus, disabled, selected, and muted states remain legible in both
- image boundaries do not visually contaminate either theme

### Pass F — performance

- animation uses transform / opacity where possible
- expensive effects are justified
- layout shift is controlled
- no unnecessary repeated measurement
- large lists and media are handled appropriately

### Pass G — visual QA

When browser tooling or screenshots are available, inspect the rendered result rather than only the source code. Look for:

- spacing drift
- inconsistent radii
- token drift
- misaligned icons
- clipping
- awkward wrapping
- weak focal hierarchy
- excessive decoration
- motion that feels slow, noisy, or disconnected

For animation-heavy work, review at significantly reduced playback speed to expose continuity and sequencing problems.

## 25. Review method for existing interfaces

When auditing an existing implementation:

1. Walk the primary flow with a pointer.
2. Repeat it keyboard-only.
3. Inspect all relevant component states.
4. Compare narrow and wide layouts.
5. Compare light and dark themes.
6. Test large text / browser zoom.
7. Inspect localization and long strings.
8. Review animation at reduced speed.
9. Search for repeated raw values that should be tokens.
10. Separate systemic problems from isolated polish issues.
11. Fix systemic rules before adding visual effects.

When possible, classify findings as:

```text
BLOCKER   prevents task completion or violates a critical accessibility requirement
HIGH      materially harms comprehension, consistency, or usability
MEDIUM    noticeable quality defect with a practical workaround
LOW       polish / refinement
```

## 26. Anti-generic quality gate

Before delivery, ask:

```text
Could this exact page belong to another product without changing the copy?
Is there a clear reason for the typography choice?
Does the color system communicate hierarchy or merely decorate?
Does the composition serve the task?
Are effects improving comprehension or only signaling "modern"?
Is the signature element actually specific to this product?
Would the interface remain good if all gradients and shadows were removed?
```

If the answer suggests template-like output, redesign the direction before polishing details.

## 27. Done standard

The UI is done when:

- the visual thesis is coherent and product-specific
- the design system is consistent across routes and states
- the implementation matches the existing stack
- responsive behavior is intentional rather than accidental
- keyboard and touch interactions are predictable
- light and dark themes both work
- localization survives dynamic rendering and text expansion
- reduced-motion users retain a usable experience
- major accessibility and hierarchy problems are resolved
- motion is one system rather than unrelated effects
- performance costs from visual treatment are justified
- additional decoration is more likely to weaken than improve the result

## Provenance

This Skill is an original AzSkills synthesis informed by public frontend design methodologies, including:

- Anthropic's public `frontend-design` skill: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- NextLevelBuilder UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- `better-web-ui`: https://github.com/aladicf/better-web-ui
- `frontend-designer-skill`: https://github.com/kozz36/frontend-designer-skill
- UI Skills public catalog: https://www.ui-skills.com/skills/frontend

These sources were used for transferable principles such as context-first design direction, anti-generic aesthetics, design-system generation, stack awareness, responsive/component reasoning, accessibility hardening, motion discipline, visual QA, and maintainable frontend architecture. AzSkills does not vendor their repositories, generated databases, example assets, private material, or repository-specific implementation.
