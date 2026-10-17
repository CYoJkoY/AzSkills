# Rare UI-Inspired Pattern Catalog

Use this catalog to select an interaction concept, not to copy a ready-made component. The names below refer to examples in the public [Rare UI repository](https://github.com/swamimalode07/rare-ui) and [gallery](https://rareui.com/components). All implementations should be reconstructed around the host product's semantics, tokens, and native stack.

## Pattern families

### 1. Adaptive navigation and active geometry

**Public examples:** Bounce Sidebar, Hook Sidebar, Proximity Sidebar, Gooey Nav.

**Useful for:** Communicating the current destination, making an active section easier to track, and giving navigation a coherent spatial model.

**Transferable technique:**

- Give the active indicator a stable shape and a clear anchor.
- Move or resize the indicator to the next canonical target rather than animating every navigation label independently.
- Treat pointer proximity as an optional enhancement. Keyboard focus, selected state, and touch activation must work even when proximity motion is absent.
- Keep active-state contrast and accessible naming independent of the animation.

**Avoid:** Springing every item, moving labels away from their hit targets, using motion as the only active-state signal, or adding pointer-follow behavior to dense operational navigation.

### 2. Sculptural reveals and layered space

**Public examples:** Folder Component, Family Drawer, Scroll Progress, and shape-changing segments in Duration Picker.

**Useful for:** Explaining that a container opens, that content is stacked, or that a compact control expands into a more detailed mode.

**Transferable technique:**

- Establish the closed and open silhouettes before defining the transition.
- Preserve a shared edge, origin, or visible parent-child relationship through the reveal.
- Reveal information in the order that supports the task; do not move essential text behind the animation.
- Keep drawer or popover motion connected to its trigger and make dismissal, cancellation, and reduced-motion behavior deterministic.
- Use geometry changes or clipping only when they materially improve the spatial explanation.

**Avoid:** Animating a complex 3D illusion on a frequently used control, letting clipping cut off focus rings, or using a decorative perspective effect that harms reading.

### 3. Shape-changing and segmented controls

**Public examples:** Duration Picker, OTP Input, and Step Player.

**Useful for:** Connecting editing with display, showing progression between steps, and making grouped values feel like a single control.

**Transferable technique:**

- Let the current interaction state determine segment spacing, outline, emphasis, and iconography.
- Keep each value readable and editable throughout the transition.
- Use a canonical final geometry; do not allow spring overshoot to leave borders or labels misaligned.
- Move focus deliberately when entering edit mode and return it predictably when leaving.
- Ensure validation and disabled states do not depend on movement.

**Avoid:** Animating focus away from the active field, obscuring typed digits, using shape morphing instead of clear validation text, or introducing a dependency solely for a small control.

### 4. Kinetic typography and physics

**Public examples:** Gravity Letters.

**Useful for:** Occasional hero interactions, playful discovery, and controlled storytelling where the text itself is the visual material.

**Transferable technique:**

- Keep the message understandable in its resting state.
- Reserve physical simulation for a contained region with a clear start and stop condition.
- Separate decorative movement from semantic text and interactive elements.
- Ensure the layout retains space for the content and does not shift unpredictably as pieces move.
- Provide a static or simplified equivalent for reduced motion and small screens.

**Avoid:** Physics applied to navigation labels, long-form reading, form instructions, or content that must be scanned quickly.

### 5. Fluid and procedural focal visuals

**Public examples:** Fluid Orb and Matrix Orb.

**Useful for:** A status-bearing visual focal point, a bounded ambient detail, or a clearly identified processing/listening/thinking state.

**Transferable technique:**

- Decide whether the visual is decorative or conveys status. If status-bearing, pair it with explicit text or accessible status semantics.
- Limit the animated region and visual contrast so it does not compete with the primary task.
- Prefer CSS or SVG where they can express the effect; reserve canvas or WebGL for effects that truly need procedural rendering.
- Stop or reduce work offscreen and when the user requests reduced motion.
- Make the state visible in a static render and on devices that cannot sustain the effect.

**Avoid:** Continuous large-area blur, GPU-intensive movement behind body text, redundant motion layered over a spinner, or unbounded ambient loops.

### 6. Numeric and status transitions

**Public examples:** Animated Counter, Notification Bell, Inline AI Status, Grid Reveal.

**Useful for:** Helping users notice a meaningful count change, distinguishing progress states, or connecting a loading placeholder to the loaded result.

**Transferable technique:**

- Animate only a meaningful change, not every render or polling tick.
- Keep the canonical value available to screen readers and in a motion-free state.
- Handle large jumps, resets, loading, stale data, and empty values without displaying misleading intermediate values.
- Stop the transition at a deterministic target and preserve rapid-update correctness.
- Use text, shape, or icon state to reinforce critical statuses rather than relying on animated color alone.

**Avoid:** Rolling numbers for values that update continuously, shaking notification icons on background refresh, or using a loading effect to hide slow or missing data.

### 7. Task feedback and reading navigation

**Public examples:** Delete Button, Task List, Rail TOC, Voice Note, Web Search.

**Useful for:** Confirming an inline action, making completion state persistent, showing progress through long content, or keeping a media timeline manipulable.

**Transferable technique:**

- Make the action's result and recovery path explicit before adding motion.
- Prefer local feedback that preserves context when the task can be completed safely in place.
- Keep a destructive action cancellable or undoable according to the product's risk model; animation alone is not confirmation.
- Make progress indicators track real progress, and keep their controls keyboard-operable.
- Preserve stable reading position when content changes.

**Avoid:** Moving completed items without announcing the new order, treating a decorative pulse as a real progress update, or hiding error recovery behind a transition.

## Selection checklist

Choose a pattern only when all relevant answers are clear:

| Question | Prefer | Reject when |
| :--- | :--- | :--- |
| What does it communicate? | A named state, relationship, or useful response | The only rationale is that it looks impressive |
| How often will it run? | Expressive motion for occasional interactions | A high-frequency action would feel slower |
| Which input starts it? | Pointer, keyboard, and touch have coherent equivalents | Hover or drag is the only path |
| What is the resting state? | A complete, legible static design | Meaning appears only after animation |
| What happens with reduced motion? | Clear state change with little or no travel | Important information disappears |
| How costly is it? | Bounded effects and simple properties where possible | Continuous work competes with the task |
| Does it fit the product? | Existing colors, type, geometry, and tokens | It imposes a separate brand or palette |

## Source boundary

This catalog contains independently authored descriptions of design intentions and interaction families. It does not include the source components, code, image assets, registry payloads, or copied implementation examples. Rare UI remains the credited upstream reference, not a dependency.