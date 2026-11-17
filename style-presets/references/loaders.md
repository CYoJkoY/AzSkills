# Loaders

Eight single-element loading primitives for busy, waiting, and progress states.
Each one is pure CSS, carries a status label, and follows `--sp-*` tokens so it
can be re-tinted per surface without editing the preset.

The executable source is
[`style-presets/assets/loaders.css`](../assets/loaders.css); the interactive
preview is [`style-presets/assets/gallery.html`](../assets/gallery.html).

Ownership split: this module owns the loader primitives, their tokens, and their
accessibility contract. `ui-motion` owns whether motion earns its place for any
non-loader interaction and owns general timing policy. A loader is motion that
already has a named purpose: an operation is in progress and the interface must
say so.

## Choose a variant

| Variant | Class | Use when | Avoid when |
| :--- | :--- | :--- | :--- |
| Ring | `sp-loader--ring` | A bounded region is busy and no value is known | The wait is under 300ms |
| Arc | `sp-loader--arc` | Busy state sits inline beside a label or inside a button | The control also shows a determinate value |
| Dots | `sp-loader--dots` | Text-adjacent waiting, typing, or assistant activity | The surface needs a precise progress read |
| Bars | `sp-loader--bars` | Media, audio, or processing hint with a rhythmic feel | The user is blocking on a single short task |
| Sweep | `sp-loader--sweep` | Content placeholder while a list or panel resolves | Content is already present and only stale |
| Squish | `sp-loader--squish` | Low-frequency, playful, brand-led surface | Dense professional tooling |
| Orbit | `sp-loader--orbit` | One long task with no measurable progress | Several loaders are visible at once |
| Meter | `sp-loader--meter` | Completion value is known | The value is unknown; use a ring instead |

Show a loader only after the operation has been pending long enough to matter -
roughly 300ms. A flash of spinner on every keystroke reads as instability.

## What routes here

An English asking verb (`add`, `need`, `show`, `use`, `replace`, ...) followed
within a short span by a loader noun routes: `spinner`, `loader`, `loading
indicator`, `progress indicator`, `skeleton screen`, `loading animation`, or
`loading state`. Chinese phrasing routes either by a named indicator
(`骨架屏`, `加载动画`, `加载指示器`, `进度加载器`, `菊花图`) or by an asking
verb (`加`, `加个`, `加一个`, `添加`, `来个`, `做个`, `需要`, `显示`) within
a short span of an English `spinner` or `skeleton`. That is why "给这个提交按钮
加一个 ring 进度加载器" and "加一个 spinner" both reach this module.

A build-tool loader stays out: `css-loader`, `sass-loader`, `style-loader`,
`esbuild-loader`, `module loader`, and any request that names a backend table,
schema, enum, column, or parser. `Add a loader to deserialize YAML` is a data
task, not a visual one.

## Tokens

| Token | Default | Meaning |
| :--- | :--- | :--- |
| `--sp-size` | `32px` | Bounding box of the indicator |
| `--sp-stroke` | `3px` | Ring, arc, track, and meter thickness |
| `--sp-gap` | `calc(var(--sp-size) / 8)` | Space between dots and between bars |
| `--sp-color` | `currentColor` | Active ink of the indicator |
| `--sp-track` | 18% ink; `rgba(128, 128, 128, 0.25)` fallback | Inactive track |
| `--sp-shine` | 32% ink; `rgba(128, 128, 128, 0.45)` fallback | Sweep highlight |
| `--sp-duration` | `900ms` | One full cycle |
| `--sp-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` | Timing curve for every variant except the linear ring, sweep, and orbit |
| `--sp-value` | `0` | Determinate percentage, `0`-`100`, meter only |

Set tokens on the loader or on any ancestor. Inheriting from the surface is the
point: a loader inside a primary button should read
`--sp-color: var(--ck-on-accent)` and nothing else.

Each token is read as `var(--sp-*, <default>)`, so a value set on an ancestor is
never shadowed by the loader's own defaults, and the bounding box always stays
exactly `--sp-size`. Dots, bars, the ring, and the orbit bead are all derived
from that box rather than from fixed pixels, so one override rescales the
whole indicator.

```css
.toolbar-tools .sp-loader { --sp-size: 20px; --sp-stroke: 2px; --sp-duration: 700ms; }
```

## Markup

```html
<span class="sp-loader sp-loader--ring" role="status">
  <span class="sp-sr-only">Loading results</span>
</span>

<button type="button" class="ck-btn ck-btn--primary" aria-busy="true">
  <span class="sp-loader sp-loader--arc" role="status">
    <span class="sp-sr-only">Saving</span>
  </span>
  Saving
</button>

<div class="sp-loader sp-loader--meter" role="progressbar" aria-label="Uploading"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="42"
     style="--sp-value: 42">
  <span class="sp-sr-only">Uploading, 42 percent</span>
</div>
```

Rules that hold for every variant:

1. `role="status"` for indeterminate work, `role="progressbar"` with
   `aria-valuenow` and `aria-label` or `aria-labelledby` for `meter`.
2. A text label inside `.sp-sr-only`, or a visible label beside the indicator.
   "Loading" alone is weak; name the object when it is known.
3. The indicator is decorative to a screen reader beyond the label; do not put
   the label inside an `aria-hidden` region.
4. Set `aria-busy="true"` on the region that is waiting, and remove it when the
   wait ends.
5. Do not pair a loader with an enabled action that duplicates it; disable the
   action and keep its label visible.

## Reduced motion

Every variant stops under `prefers-reduced-motion: reduce` and keeps a pose that
still shows the surface is busy: a two-quadrant ring, a partial arc, three
undersized dots, three short bars, an off-centre bead, or a flat tint. Nothing
disappears, and no state cue depends on the animation.

`NO_MOTION` on a terminal surface means static progress text instead. A loader
is never the only evidence that work is happening.

## Sizing and colour

| Context | Size | Stroke | Colour |
| :--- | :--- | :--- | :--- |
| Dense table row or chip | 14-16px | 2px | `--ck-text-secondary` |
| Toolbar or list | 18-20px | 2px | `--ck-accent` |
| Panel or card centre | 28-32px | 3px | `--ck-accent` |
| Empty-state block | 40px | 3-4px | `--ck-accent` |
| Inside an accent button | 16-18px | 2px | `--ck-on-accent` |

Keep contrast at 3:1 or better against the immediate background; a loader is a
graphical object, so the 4.5:1 text rule does not apply, but a loader the user
cannot see is worse than none.

## Technique provenance

The patterns - conic-gradient rings, stroke-dash arcs, staggered dot pulses,
bar sweeps, and squish morphs - are common pure-CSS techniques shown across
public loader galleries, including css-loaders.com by Temani Afif. This file
does not reproduce that site's stylesheets or examples: every variant here is
written against AzSkills tokens with its own geometry, timing, and fallback.
The gallery's licence is not documented publicly, so no code was copied. See
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).
