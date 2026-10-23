---
name: ui-motion
description: Construct, review, audit, and adapt UI motion using the smallest correct mechanism, host tokens, full interruption and accessibility behavior, and rendered verification. Also owns SVG animation and expressive interaction patterns.
version: 2.0.0
status: canonical
family: interface
modes: [build, review, audit, pattern, svg]
---

# UI Motion

Turn a motion request into an implementation, a review, an audit, a pattern
choice, or an SVG animation. This Skill owns motion purpose, mechanism, timing,
physicality, interruption, accessibility, performance, and verification. It does
not own general layout, visual hierarchy, or runtime selection.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task adds, changes, reviews, or audits UI motion, chooses a motion-led interaction pattern, or authors SVG animation.
- Do not use when: the task is general interface design (`ui-design`), a runtime or framework decision (`architecture`), or static identity work (`logo-generator`).
- Owns: whether motion earns a place, which mechanism is smallest, timing, origin, interruption, reduced-motion parity, performance, and motion findings.
- Inputs: host motion tokens, component frequency, interaction purpose, current mechanism, browser baseline, input model, reduced-motion policy, and rendered evidence.
- Outputs: implemented motion, review findings, audit inventory and plan, pattern adaptation, or standalone SVG animation.
- Compose with: `ui-design` for the static interface; `design-system` for motion tokens; load `references/animation-standards.md` for exact values.
- Gates: motion has a named purpose and frequency fit; reduced motion preserves meaning; the interaction is interruptible; the rendered result is verified.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `build` | Add or change motion | Purpose, mechanism, geometry, timing, interruption, accessibility, verify | Implemented motion |
| `review` | Review a diff, component, or implementation | Context, gate, inspect, rank leverage | Read-only findings |
| `audit` | Audit a codebase or find opportunities | Inventory, frequency map, audit categories, opportunity gates | Read-only plan |
| `pattern` | A distinctive interaction is the product idea | Context, pattern family, static state, interaction contract, translate | Pattern adaptation |
| `svg` | Author or optimize SVG animation | Scope, mechanism, geometry, accessibility, performance, verify | Single-file SVG |

## Workflow

### 1. Establish context and frequency

```text
runtime and browser baseline
existing motion tokens and library
component frequency
interaction purpose
pointer, touch, and keyboard model
reduced-motion policy
performance-sensitive surfaces
```

| Frequency | Motion posture |
| :--- | :--- |
| 100+ times/day, including keyboard actions | Do not animate the interaction itself |
| Tens/day | Remove or drastically reduce; keep only subtle communication |
| Occasional | Standard UI motion may be appropriate |
| Rare or first-use | Deliberate expressive motion may be appropriate |

### 2. Gate the motion

Choose one purpose: feedback, spatial consistency, state indication,
continuity, explanation, or deliberate delight. If none applies, do not animate.
Do not animate text the user is actively reading. Do not add open/close
choreography to a keyboard-initiated action merely because it is visible.

### 3. Inspect the host system

Read semantic motion tokens, easing and duration scales, component transitions,
reduced-motion handling, pointer and hover gates, the installed motion library,
and the browser baseline. Extend the host vocabulary; do not create a parallel
ease-1/ease-2 scale.

### 4. Choose the smallest mechanism

```text
CSS transition
  -> CSS @starting-style
    -> CSS animation
      -> Web Animations API
        -> spring or framework motion system
```

Use a library only when it buys interruptible spring behavior, gesture
coordination, layout coordination, or existing project infrastructure. A fade is
not a reason for a dependency.

### 5. Choose geometry and properties

- Prefer `transform` and `opacity` for routine UI motion.
- Treat layout-affecting animation as an explicit exception with measured verification.
- Derive `transform-origin` from the trigger or placement relationship.
- Do not enter from `scale(0)`; use a small scale such as `0.95` with opacity reduction.
- Use element-relative translations when travel should scale with the element.
- Use `clip-path` only for intentional reveal or mask interactions.

### 6. Choose timing

Use project tokens first. When none exist:

| Interaction | Starting range |
| :--- | :--- |
| Press feedback | 100-160ms |
| Tooltip or small popover | 125-200ms |
| Dropdown or select | 150-250ms |
| Modal or drawer | 200-500ms |
| Explanatory or marketing | Longer may be justified |

Use `ease-out` for entering and exiting, `ease-in-out` for on-screen movement,
`ease` for hover and color, and `linear` for constant motion. Avoid `ease-in` for
ordinary UI response. Routine motion normally stays below 300ms.

### 7. Design interruption and exit

Transitions retarget from the current value and suit rapidly retriggered state.
Springs suit gesture velocity and physical continuity. Avoid restarting
keyframes for toasts, toggles, expandable controls, drag, scrub, and changing
view state. Define the exit relationship before implementation.

### 8. Add accessibility and capability variants

- Preserve opacity, color, or text feedback under `prefers-reduced-motion: reduce`; remove unnecessary travel.
- Gate hover-only behavior behind `hover: hover` and `pointer: fine` where appropriate.
- Keep focus visible and do not delay critical feedback.
- Provide a static or reduced variant for looping or decorative motion.
- Verify keyboard and touch paths, not only pointer hover.

### 9. Implement and verify

Inspect the real component at real sizes. Check entry, exit, interruption,
rapid retrigger, reduced motion, light and dark themes, and realistic load. A
motion that only works in isolation is not finished.

### 10. Review or audit without editing

For `review`, report context, gate result, implementation findings, and the
leverage order: delete, reduce, correct timing, correct geometry, add
interruption, move work to compositor-friendly properties, then add polish.

For `audit`, inventory at least transitions, animations, keyframes, motion
libraries, `transition: all`, `scale(0)`, `prefers-reduced-motion`,
`transform-origin`, and `clip-path`. Build a frequency map, audit purpose,
timing, physicality, interruption, performance, accessibility, cohesion, and
missed opportunities. Propose only high-confidence opportunities.

### 11. Pattern mode

Choose one pattern family that solves a real user problem. Establish the static
silhouette, spacing, and readable state first. Define the interaction contract,
then translate it into host-native geometry and tokens. Keep one signature per
surface. Do not copy a catalog component pixel-for-pixel or force a foreign brand
palette.

### 12. SVG mode

Prefer CSS animation, then SMIL when CSS cannot express the relationship, then a
minimal JavaScript driver. Keep the output single-file and self-contained unless
the host requires otherwise. Animate transforms and opacity; avoid layout and
large filter regions. Provide `prefers-reduced-motion` behavior and a static
fallback. For standalone SVG, declare the namespace, `viewBox`, title, and
description. For `<img>` embedding, keep animation internal and avoid external
script dependencies.

## Quality gates

- [ ] Motion has a named purpose and a frequency-appropriate posture.
- [ ] The smallest mechanism that satisfies the interaction is used.
- [ ] Timing and easing reuse host tokens when they exist.
- [ ] Origin, entry, exit, and interruption preserve spatial continuity.
- [ ] Reduced motion and input-capability variants preserve meaning.
- [ ] No layout-affecting or large paint operation is hidden behind routine polish.
- [ ] The interaction is verified at real size, under load, and on rapid retrigger.
- [ ] Reviews and audits do not edit production source.
- [ ] Pattern adaptations use host tokens and one signature per surface.
- [ ] SVG output is accessible, self-contained, and fallback-safe.

## Output contract

For implementation:

```text
Purpose and frequency:
Mechanism and properties:
Timing and origin:
Interruption and exit:
Accessibility variants:
Verification:
Unverified items:
```

For review or audit:

```text
Scope:
Verdict:
Findings ranked by leverage:
Smallest corrective action per finding:
Unverified items:
```

## References

- `references/animation-standards.md` - exact easing, duration, spring, performance, and accessibility reference.
- `references/animation-recipes.md` - implementation recipes and component patterns.
- `references/animation-vocabulary.md` - motion terms and intent vocabulary.
- `references/review.md` - detailed read-only review sequence and findings contract.
- `references/audit.md` - detailed codebase inventory, opportunity gates, and plan format.
- `references/plan-template.md` - implementation plan template for audit findings.
- `references/rare-interactions.md` - pattern-selection and adaptation contract.
- `references/rare-patterns.md` - pattern catalog.
- `references/svg-animation.md` - SVG-specific construction and optimization guide.
- `references/icon-morphing.md` - semantic SVG icon morphing, geometry, interruption, and QA.
