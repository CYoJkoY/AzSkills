# Animation Vocabulary

Use this reference to name motion precisely. Detailed construction and audit rules remain in the owning Skills.

## Motion primitives

- **Fade** — opacity changes without position changes.
- **Rise / slide** — translate an element along an axis during entry or exit.
- **Scale** — change rendered size around a transform origin.
- **Rotate** — change angular orientation around an origin.
- **Morph** — continuously transform one meaningful shape into another.
- **Shared-element transition** — preserve the visual identity of an element while it changes position, size, or container.
- **Layout animation** — animate layout-driven geometry deliberately; it can cost more than compositor-friendly transforms.

## State and continuity

- **Crossfade** — overlap two states while one fades out and another fades in.
- **Continuity transition** — connect before and after states so the user can follow the same object or region.
- **Direction-aware transition** — use travel direction to encode forward/back navigation.
- **Origin-aware animation** — derive transform origin from the spatial relationship that triggered the change.
- **Accordion / collapse** — reveal or conceal content whose height follows its contents.

## Interaction

- **Press feedback** — brief response to activation, often subtle scale or opacity.
- **Hold-to-confirm** — progress motion that communicates a required hold duration.
- **Drag** — continuous pointer/touch-controlled motion.
- **Swipe-to-dismiss** — drag an element away to dismiss it.
- **Rubber-banding** — increasing resistance beyond a natural boundary followed by spring-back.
- **Momentum** — retained velocity after release or interruption.
- **Interruptible motion** — motion that can change target without snapping through stale endpoints.
- **Stagger** — offset sibling animation starts by a short interval.

## Scroll and ambient motion

- **Scroll reveal** — motion triggered as content enters the viewport.
- **Scroll-driven motion** — animation progress controlled directly by scrolling.
- **Parallax** — layers moving at different rates to imply depth.
- **Marquee / loop** — repeated autonomous movement.
- **Pulse / float** — subtle repeated movement used sparingly to attract attention or add atmosphere.

## Easing and springs

- **Ease-out** — decisive start and slower settle; common UI entry/feedback default.
- **Ease-in** — slow start; generally poor for routine UI response.
- **Ease-in-out** — slower ends; useful for movement between stable on-screen states.
- **Linear** — constant rate; appropriate for selected progress or loop mechanics.
- **Cubic-bezier** — a custom timing curve.
- **Spring** — physics-like motion driven by parameters such as mass, stiffness, damping, or bounce.
- **Perceptual duration** — how long motion appears finished to a person, not only when internal simulation reaches mathematical rest.

## Effects and performance

- **Clip-path reveal** — expand or contract a visible region through clipping.
- **Blur-masked crossfade** — restrained blur used to bridge overlapping states.
- **Jank** — visible stutter caused by missed frame deadlines.
- **Dropped frame** — a frame that fails to render on schedule.
- **Compositing** — browser processing that can move/fade an element without repeating full layout/paint work.
- **Layout thrashing** — repeated layout reads/writes that force expensive recalculation.
- **Reduced motion** — accessibility variant that lowers spatial movement while retaining understandable feedback.