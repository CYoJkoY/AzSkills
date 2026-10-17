---
name: rare-ui-motion
description: Select and adapt expressive, motion-led component patterns inspired by Rare UI into a product's own visual language. Use when a distinctive interaction, sculptural shape, kinetic response, or fluid visual signature is central; compose with ui-design and ui-motion instead of replacing them.
---

# Rare UI-Inspired Interaction Craft

This Skill teaches AzSkills to recognize and adapt the design grammar demonstrated by [Rare UI](https://github.com/swamimalode07/rare-ui) and its [component gallery](https://rareui.com/components). It is a pattern-selection and translation contract, not a copied component library, framework recipe, or second design system.

The aim is to make expressive UI feel intentional: distinct form, meaningful interaction, responsive feedback, and carefully limited motion. Do not make every screen animated or force Rare UI's brand treatment onto unrelated products.

## Automatic scope

Use this Skill when a task calls for:

- a distinctive custom interaction rather than another generic card or button
- sculptural or shape-changing controls, layered spatial reveals, or expressive navigation
- pointer proximity, spring feedback, kinetic text, fluid status visuals, or motion that makes a state easier to understand
- selecting an appropriate pattern from Rare UI's public catalog and translating its principle to a different implementation
- learning Rare UI's aesthetic approach without importing its source components

Do not use it as the default for every UI task. For general page architecture and visual implementation, use ui-design. For aesthetic critique, use ui-aesthetics. For animation mechanics, exact timing, interruption, and reduced-motion construction, use ui-motion. Use ui-motion-review or ui-motion-audit for their dedicated review and audit tasks.

## Responsibility boundary

| Responsibility | Owning Skill |
| :--- | :--- |
| Pick a distinctive interaction pattern and translate its visual intent | rare-ui-motion |
| Define product layout, semantics, interaction architecture, responsive behavior, and UI QA | ui-design |
| Construct motion timing, geometry, interruption, and input-capability behavior | ui-motion |
| Critique coherence, hierarchy, restraint, and rendered polish | ui-aesthetics |
| Ingest source tokens and resolve conflicting design references | design-system |
| Review or audit existing motion | ui-motion-review / ui-motion-audit |

This Skill decides whether a Rare UI-inspired pattern earns a place and how it should fit the host product. It must not duplicate the shared motion mechanics or bypass product-level accessibility.

## Governing priority

1. Explicit user requirements and task intent.
2. The host project's existing DESIGN.md, semantic tokens, brand, and component conventions.
3. Semantic HTML, platform interaction norms, accessibility, and performance constraints.
4. ui-design and the shared rules in design-intelligence.md.
5. ui-motion/references/animation-standards.md for motion mechanics.
6. This Skill's pattern-selection and adaptation guidance.
7. Rare UI's public catalog as an optional source of inspiration.

An existing host design system wins unless the user explicitly asks to change direction. For AzSkills-owned UI, Wabi-Press remains authoritative. A Rare UI reference is a source of ideas, never a reason to replace Wabi-Press or create a second token palette.

## Visual thesis: expressive, not noisy

Treat the source as a vocabulary of carefully authored interaction details rather than one universal theme.

- **One signature per surface.** Choose one dominant interaction or visual motif. Supporting details should clarify the same idea rather than compete with it.
- **Specific silhouette before decoration.** Establish the control's shape, proportions, grouping, and static readability first. Motion should enhance a recognizable design, not conceal a generic layout.
- **Material and geometry agree.** Rounded or sculpted corners, layered surfaces, clipping, depth, and highlights must follow one coherent geometry model. Avoid mixing unrelated radii and effects.
- **Motion reveals state or spatial relationship.** Prefer a menu indicator that travels to the selected item, a segmented input that opens into editing, or a drawer that preserves its stack relationship over animation with no explanatory purpose.
- **Tactility is proportional to importance.** Strong spring, elastic, fluid, or physics-like behavior belongs to occasional and expressive interactions. Frequent controls need immediate, low-friction feedback.
- **A calm base protects a strong accent.** Reserve high contrast, a distinctive shape, or richer movement for the interaction that matters most. Do not stack glow, blur, gradients, particles, bounce, and parallax merely because each is available.
- **Tokens adapt to the host.** Rare UI is not a fixed black-and-orange theme. Reuse the host's colors, typography, radii, spacing, focus styles, and motion vocabulary. Introduce a special surface or accent only when the project context supports it.

## Pattern selection

Start with the [pattern catalog](references/pattern-catalog.md). Select the smallest pattern family that solves a real user problem.

| Product need | Candidate pattern family | Default restraint |
| :--- | :--- | :--- |
| Make selection location obvious | Adaptive navigation indicator | Animate the active geometry, not every label |
| Explain a container opening or a layered relationship | Sculptural reveal / spatial stack | Preserve a stable anchor and a clear final state |
| Make editing feel connected to the displayed value | Shape-changing / segmented control | Keep values readable throughout the transition |
| Make changing data easier to parse | Numeric or status transition | Animate meaningful changes only; keep the actual value available as text |
| Add an expressive focal visual | Fluid or procedural visual | Keep it subordinate to task content and avoid unnecessary loops |
| Make a rare first-use or storytelling moment memorable | Kinetic typography / physics | Avoid on high-frequency or reading-critical content |
| Help users navigate long content | Scroll-progress or moving section marker | Never let an animated ornament obscure the content |

Do not reproduce a catalog example pixel-for-pixel just because it is recognizable. Transfer its interaction principle to the host design and its input model.

## Selection workflow

### 1. Establish context and interaction frequency

Identify the primary task, the control's semantic purpose, how often it is used, the supported input types, the host visual tokens, and the runtime constraints. A frequent keyboard command, submit button, or list action usually does not benefit from showy motion.

### 2. Choose one pattern and name its purpose

Describe the user-facing gain in one sentence, such as clearer selection, continuity across a state change, feedback for an updated value, or a better explanation of spatial structure. If the benefit cannot be stated plainly, use a static design or simpler transition.

### 3. Design the static state first

Before animation, verify the silhouette, information hierarchy, labels, hit target, focus indicator, disabled and error states, and layout at narrow widths. A still frame should look deliberate and remain understandable without motion.

### 4. Specify the interaction contract

Define the canonical state and the transitions that can occur: idle, focus, pointer hover where available, press, drag where applicable, success, error, disabled, and cancellation. Clarify how repeated input retargets an animation and what happens when an interaction is interrupted. Keep semantics in the control state, not in animation completion callbacks.

### 5. Translate to the host-native implementation

All implementations produced by this Skill must use semantic HTML, CSS, and native TypeScript. Do not introduce or require React, Next.js, Tailwind, or any other frontend framework, and do not import Rare UI's components, registry format, or third-party animation dependencies. Treat upstream framework-based examples as interaction references only, then reconstruct the behavior with native web primitives. Prefer CSS transitions for simple state changes and the Web Animations API when explicit playback control is needed; use native TypeScript only where state or geometry requires it. SVG can provide resolution-independent shape detail. Use Canvas or WebGL only when a pixel-level or procedural effect is essential and its runtime cost is justified.

Do not transcribe an upstream component into another framework. Rebuild the behavior from its abstract interaction goal, the host's own markup, and project-specific tokens.

### 6. Match input modalities

Hover is enhancement, not the only path to state or affordance. Gate pointer-following effects with hover and fine-pointer capability, keep keyboard focus and activation equivalent, and provide sensible touch behavior. Do not infer pointer capability from viewport width alone.

### 7. Verify the full motion lifecycle

Inspect the first frame, intermediate geometry, stable end state, rapid retriggering, keyboard flow, touch behavior, reduced motion, narrow layouts, and realistic performance. Check that the interaction remains coherent when animation is skipped, interrupted, or delayed.

## Accessibility and performance contract

- Honor prefers-reduced-motion. Remove non-essential travel, elastic overshoot, parallax, particles, and continuous ambient movement when reduced motion is requested. Preserve clear state changes and useful color or opacity feedback.
- No state may be communicated only by animation, color, sound, or pointer position. Keep labels, values, focus, and status text semantically correct.
- Keep keyboard focus visible independently of animated indicators. All actions remain possible without hover or drag.
- Stop or suspend decorative continuous work when it is offscreen or no longer relevant. Avoid repeated synchronous layout reads, large-area blur loops, and animation that unnecessarily recalculates a large subtree.
- Prefer transform and opacity for routine movement. Justify layout-affecting animation or real-time visual simulation rather than treating it as the default.
- Keep controls responsive while motion runs. Animation must never gate a submit, save, delete, navigation, or recovery action.
- If the product already has motion tokens or an animation mechanism, extend that system. Do not add a new dependency for a simple fade, color change, or press response.

## Quality gates

- [ ] The pattern solves a named user problem and is proportionate to its interaction frequency.
- [ ] There is one primary visual signature, supported by the existing design system.
- [ ] The static state is legible and visually complete without motion.
- [ ] Semantics, focus, keyboard behavior, and touch behavior remain correct.
- [ ] Reduced-motion behavior is designed and verified.
- [ ] Repeated interactions are interruptible and settle in the correct state.
- [ ] Performance is appropriate for the effect; unnecessary loops and layout work are absent.
- [ ] No Rare UI component source, assets, registry data, or documentation has been copied into the deliverable.

## Output contract

When producing or reviewing an implementation, provide the component or focused change and a short verification note containing:

1. the selected pattern and user problem it solves
2. the visual features adapted to the host, including which host tokens were reused
3. the state and input model, including reduced-motion behavior
4. checks performed and any unresolved rendering or device-level limitation

When the task only asks for design guidance, return the pattern choice, its rationale, a static-state description, an interaction contract, and implementation risks. Do not invent a new design system when token adaptation is sufficient.

## Source and license boundary

This Skill is an independently written synthesis of public design and interaction patterns studied in [swamimalode07/rare-ui](https://github.com/swamimalode07/rare-ui) and its [official component gallery](https://rareui.com/components). The source project uses a license described as MIT + Commons Clause + Attribution in its [LICENSE](https://github.com/swamimalode07/rare-ui/blob/main/LICENSE).

AzSkills does not redistribute Rare UI's component code, copied assets, registry output, screenshots, or upstream documentation here. Component names in the reference catalog serve only to locate public examples for design study. The source is credited as a reference; this notice does not grant permission to sell, sublicense, or redistribute Rare UI components. Recheck the upstream license before any future proposal to ship component material.
