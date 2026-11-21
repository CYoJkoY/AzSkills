<!-- Loaded by ui-design. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies depth only. If it conflicts with the canonical ui-design contract, the contract wins.

# UI Implementation Reference

A production frontend design skill for turning a product requirement into a coherent visual system and a usable implementation. Treat aesthetic direction, information hierarchy, interaction design, accessibility, responsiveness, motion, content, performance, and implementation architecture as one system.

This is an AzSkills synthesis of public frontend-design methodologies. It deliberately combines the strongest transferable ideas from high-profile public skills without copying or vendoring their repository-specific text or data.

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

## 18. Performance-aware interface engineering

Motion mechanism, timing, and motion-specific rendering cost belong to
`ui-motion`. At the interface layer, prevent avoidable rendering and layout work:

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
