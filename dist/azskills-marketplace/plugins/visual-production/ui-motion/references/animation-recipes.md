# Animation Recipes

These are AzSkills-native starting patterns derived from the shared motion model. Copy the structure, not the surrounding implementation. Project tokens, component architecture, and accessibility behavior remain authoritative.

## Button press

Purpose: feedback. Frequency: high. Keep it nearly immediate.

```css
.button {
  transition: transform 160ms var(--ease-out);
}

.button:active {
  transform: scale(0.97);
}
```

Do not add a delayed entrance animation merely because the control is pressable.

## Trigger-anchored popover

Purpose: spatial consistency. Start with a small scale and opacity change, and derive the origin from placement.

```css
.popover {
  transform-origin: var(--transform-origin);
  transition:
    transform 180ms var(--ease-out),
    opacity 180ms var(--ease-out);
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  .popover {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

Use centered origin for a genuinely centered modal, not for a trigger-anchored surface.

## Tooltip

Use an initial delay to avoid accidental activation. Once one tooltip is open, adjacent tooltips can become instant so the user can scan a toolbar without repeated waiting.

```css
.tooltip {
  transition:
    transform 150ms var(--ease-out),
    opacity 150ms var(--ease-out);
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

## Drawer / local panel

Use element-relative travel rather than a hardcoded offset.

```css
.drawer {
  transition:
    transform 300ms var(--ease-drawer),
    opacity 300ms var(--ease-drawer);
}

.drawer[data-closed] {
  transform: translateY(100%);
}
```

Keep the entry and exit path spatially coherent. For a smaller overlay, use the dropdown or popover range instead of automatically using the full drawer range.

## Toast

Toasts are rapidly added and removed, so transitions or a spring should retarget from the current state. Avoid a restart-from-zero keyframe sequence.

```css
.toast {
  transition:
    transform 200ms var(--ease-out),
    opacity 200ms var(--ease-out);
}
```

Respect the host stack's positioning and stacking behavior; the recipe only defines motion ownership.

## Accordion / collapse

Height animation is an explicit exception because transform alone cannot reveal content whose layout is intrinsically sized.

Pair the size change with opacity where useful, keep the duration in the host token system, and make the state interruptible. Do not use `transition: all`.

## Staggered entrance

Use only for grouped, infrequent content where sequence improves comprehension. Never block input until the group has finished.

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: item-in 250ms var(--ease-out) forwards;
}

.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
```

Keep inter-item delays within the shared `30–80ms` reference interval.

## Hold-to-confirm

Purpose: communicate a deliberate user-controlled duration. Use asymmetric timing: slow while the user holds, fast when the system releases.

```css
.confirm-overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms var(--ease-out);
}

.confirm:active .confirm-overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
```

Do not use this pattern when the action does not genuinely require a deliberate hold.

## Tab color reveal

When text color and surface color must move as one semantic transition, duplicate the active visual layer and reveal it with `clip-path: inset(...)` rather than timing multiple color properties independently.

Use the clipping boundary to represent the active tab's geometry. Keep the state itself owned by the tab component.

## Scroll reveal

Use motion only when entry into the viewport benefits from continuity or hierarchy.

Reference starting geometry:

```css
.reveal {
  opacity: 0;
  transform: translateY(8px);
}

.reveal[data-visible] {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 250ms var(--ease-out),
    transform 250ms var(--ease-out);
}
```

Use `IntersectionObserver` or the host framework's equivalent to set the state. Add `once` behavior only when repeating the reveal adds no value.

## Crossfade

Fix geometry and timing first. When two state snapshots still visually overlap, a restrained `filter: blur(2px)` during the transition can mask the intermediate mismatch.

```css
.state-content {
  transition: filter 180ms ease, opacity 180ms ease;
}

.state-content[data-transitioning] {
  filter: blur(2px);
  opacity: 0.7;
}
```

Blur is a bridge, not a substitute for correct layout or identity continuity.

## Drag-to-dismiss

Use pointer capture when the drag begins. Track distance and elapsed time; consider velocity as well as a distance threshold.

```text
press
  → capture pointer
  → drag with boundary damping
  → release
  → dismiss when distance or calibrated velocity is sufficient
  → spring to the canonical exit state
```

The source reference uses approximately `0.11` distance-units per millisecond as one dismissal threshold example. Treat that as a calibration starting point, not a universal constant.

Ignore additional touch points after the active drag has begun.

## Reduced motion and hover

Every recipe that moves spatially needs a reduced-motion variant, and hover-specific movement needs an input-capability gate.

```css
@media (prefers-reduced-motion: reduce) {
  /* preserve state feedback; remove unnecessary travel */
}

@media (hover: hover) and (pointer: fine) {
  /* hover-only motion */
}
```

## Composition rule

Recipes are implementation accelerators, not a second design system. Before applying one:

1. pass the frequency and purpose gate;
2. reuse project tokens and component behavior;
3. preserve the host accessibility model;
4. verify interruption and rendered feel;
5. remove the recipe entirely when motion does not earn a place.