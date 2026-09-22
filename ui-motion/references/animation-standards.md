# Animation Standards Reference

This is the exact-value reference for AzSkills motion Skills. It is a reusable vocabulary, not a mandatory global token set. Existing product tokens take precedence.

## 1. Frequency and purpose gate

| Frequency | Default motion posture |
| :--- | :--- |
| 100+ times/day, including keyboard-initiated controls | No animation on the interaction itself |
| Tens/day | Remove or drastically reduce; retain only subtle communication |
| Occasional | Standard UI animation may be appropriate |
| Rare / first-use | Deliberate expressive motion may be appropriate |

Valid purposes are feedback, spatial consistency, state indication, continuity / preventing a jarring change, explanation, and deliberate delight.

## 2. Easing

| Situation | Reference easing |
| :--- | :--- |
| entering / exiting | `ease-out` |
| moving / morphing on screen | `ease-in-out` |
| hover / color change | `ease` |
| constant motion | `linear` |
| default UI response | `ease-out` |

Avoid `ease-in` for ordinary UI response.

Approved strong curves when a project has no equivalent:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Register adopted curves once in the product token layer; do not scatter them through components.

## 3. Duration

| Interaction | Reference range |
| :--- | :--- |
| button press feedback | 100–160ms |
| tooltip / small popover | 125–200ms |
| dropdown / select | 150–250ms |
| modal / drawer | 200–500ms |
| marketing / explanatory | may be longer |

Routine UI motion should normally remain below 300ms; the modal/drawer range is an explicit spatial exception.

## 4. Springs

Use springs for gesture continuity, velocity-sensitive interactions, or elements whose physicality materially improves the interaction.

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Keep bounce subtle, approximately 0.1–0.3. Treat these as reference starting points, not universal physics.

## 5. Properties and physicality

Prefer `transform` and `opacity` for routine UI motion. Layout-affecting properties need explicit justification and should be verified under realistic load.

Never use `scale(0)` as a routine entrance. A reference starting point is `scale(0.95)` with reduced opacity.

For trigger-anchored overlays, derive `transform-origin` from the placement relationship. Centered origin is correct for genuinely centered overlays.

Use element-relative translations such as `translateY(100%)` when the travel should scale with the element's own dimensions.

## 6. Interruptibility

Transitions are appropriate for rapidly retriggered state because they retarget from the current value. Springs are appropriate when gesture velocity should carry across interruption.

Avoid restarting keyframes for toasts, toggles, expandable controls, drag/scrub interactions, and rapidly changing view state.

Use `@starting-style` when entry can be expressed without script-managed mount state.

## 7. Performance

Motion quality and performance are one concern.

Avoid repeated synchronous layout reads/writes, continuous large-area blur, unnecessary parallax loops, parent CSS variables that force large child-tree recalculation, gratuitous `will-change`, and runtime animation loops when CSS or WAAPI is sufficient.

Do not treat `transform` / `opacity` as a guarantee of perfect frame rate. Measure under realistic load.

Subtle `filter: blur(2px)` may help bridge an imperfect crossfade; large-radius blur can be expensive, especially across large surfaces.

## 8. Clip-path and reveal

`clip-path: inset(top right bottom left)` is a useful fourth motion property for intentional reveal/mask interactions such as image reveals, comparison sliders, hold-to-confirm overlays, and tab-state color reveals.

```css
/* hidden from the bottom */
clip-path: inset(0 0 100% 0);

/* fully visible */
clip-path: inset(0 0 0 0);
```

Fix geometry and timing first; do not use clip-path merely to avoid a simpler mechanism.

## 9. Gestures

- capture the pointer once a drag begins
- ignore additional touch points after the active pointer is established
- use damping or rising friction at natural boundaries instead of abrupt hard stops
- consider velocity as well as distance for dismissal
- use springs when release should preserve momentum

A velocity threshold around `0.11` distance-units per millisecond is only a source reference; calibrate against the product's coordinate system and real-device feel.

## 10. Accessibility and input capability

Reduced motion should preserve semantic feedback while reducing unnecessary spatial movement.

```css
@media (prefers-reduced-motion: reduce) {
  /* preserve opacity/color feedback; remove unnecessary travel */
}

@media (hover: hover) and (pointer: fine) {
  /* hover-only motion */
}
```

Do not infer hover availability from screen width.

## 11. Stagger and crossfade

Use a short stagger only when it helps grouped content read as a sequence.

Reference interval: `30–80ms` between items.

Never block interaction until a stagger completes.

When two states visually overlap during a crossfade, restrained blur may bridge the intermediate frame. It is a mask, not a substitute for correct geometry or timing.

## 12. Asymmetric timing

When a deliberate user-controlled phase is followed by a system response, timing can be asymmetric.

```css
/* system response */
transition: clip-path 200ms ease-out;

/* deliberate hold */
transition: clip-path 2s linear;
```

Use the pattern only when the longer phase communicates intent or progress.

## 13. QA

- inspect normal-speed behavior and replay at 2–5× slower
- inspect first, intermediate, and settled frames
- trigger the state again before completion to verify interruption
- verify transform origin for anchored surfaces
- toggle reduced motion
- test hover on fine-pointer and coarse-pointer devices
- use a real device for touch / gesture work
- verify performance under realistic page load

A visually impressive animation that blocks input, loses state semantics, or stutters is not complete.