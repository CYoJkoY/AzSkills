<!-- Loaded by ui-motion pattern. The canonical SKILL.md owns scope, modes, gates, and output. -->

This reference supplies depth only. If it conflicts with the canonical ui-motion pattern contract, the contract wins.

# Rare Interaction Pattern Reference

This reference teaches AzSkills to recognize and adapt the design grammar demonstrated by [Rare UI](https://github.com/swamimalode07/rare-ui) and its [component gallery](https://rareui.com/components). It is a pattern-selection and translation guide, not a copied component library, framework recipe, or second design system.

The aim is to make expressive UI feel intentional: distinct form, meaningful interaction, responsive feedback, and carefully limited motion. Do not make every screen animated or force Rare UI's brand treatment onto unrelated products.

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

Start with the [pattern catalog](rare-patterns.md). Select the smallest pattern family that solves a real user problem.

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
