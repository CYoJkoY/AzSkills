---
name: style-presets
description: Resolve a named visual style, a style keyword, or a loading indicator to one maintained AzSkills preset, then apply it through owned tokens. Use for style-name requests, BioRender-derived direction, loader and progress states, and preset audits.
version: 1.0.0
status: module
family: interface
modes: [catalog, apply, loaders, audit]
---

# Style Presets

Turn a style request into one named preset applied through its own token pack,
or a loading state into one preset variant with markup, tokens, and an
accessible fallback. This module owns preset identity, trigger keywords, token
packs, loader variants, and preset-level customization. It does not normalize a
project `DESIGN.md`, choose a product's layout, or decide general motion.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../../design-intelligence.md).

## Contract

- Use when: a request names a style, a style keyword, or a reference product; asks which styles AzSkills ships; needs a ready-made loading, progress, or busy indicator; or asks to re-tint an existing preset.
- Do not use when: the task consumes or normalizes a project visual contract (`design-system`), builds or reviews a product interface (`ui-design`), decides whether non-loader motion earns its place (`ui-motion`), or composes a deck narrative (`frontend-slides`).
- Owns: preset ids and trigger keywords, preset token packs, component primitives for a preset, loader variants and their customization tokens, and preset provenance levels.
- Inputs: the requested outcome, any named style or keyword, existing project tokens, target surface, theme, density, and the artifact that will carry the preset.
- Outputs: a resolved preset with its token pack and the primitives the artifact uses, a scoped customization, or a loader variant with markup, tokens, and fallback.
- Compose with: `design-system` when a project contract governs the artifact; `ui-design` for hierarchy and states; `ui-motion` for non-loader motion; `frontend-slides` for deck surfaces.
- Gates: no brand asset, logo, illustration, or upstream stylesheet is reproduced; text roles hold 4.5:1 in both themes; every loader carries status semantics plus a reduced-motion fallback; a preset never silently replaces an authoritative project identity.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `catalog` | The request needs the list of shipped styles or one preset's thesis | Identify, compare, recommend, record | Preset recommendation |
| `apply` | One named preset must reach an artifact | Resolve, compare, emit, customize, verify | Token pack and primitives |
| `loaders` | A busy, loading, or progress state needs an indicator | Resolve, select variant, emit markup, adapt, verify | Loader markup and tokens |
| `audit` | An existing preset use needs review | Inventory, contrast, states, motion, verdict | Ranked findings |

## Preset registry

Two maintained presets ship today. Wabi Press is the repository default; Cobalt
Kit is an opt-in sibling. The catalog is
[`style-presets/references/catalog.md`](../../style-presets/references/catalog.md).

| Preset id | Trigger keywords | Standing |
| :--- | :--- | :--- |
| `wabi-press` | wabi press, paper and ink, default direction | Default for owned surfaces; contract lives in `DESIGN.md` |
| `cobalt-kit` | biorender, cobalt, lab, bright-blue research canvas | Opt-in only; never becomes the default |

Wabi Press is not restated here. Its tokens, geometry, and gates stay in the root
[`DESIGN.md`](../../DESIGN.md) and its stylesheet. This module owns only the
decision of which preset an artifact uses, and the pack for presets that are not
the repository default.

## Binding rules

1. Read the request for a preset id, a trigger keyword, or a named reference
   product before inventing a direction. A named product resolves to its
   registered preset, not to an imitation of that product.
2. Precedence: an explicit preset request, then an authoritative project
   identity, then the Wabi Press default, then a documented one-off direction.
   Record which level you used.
3. A preset is opt-in per artifact. Two presets never share one artifact, and a
   preset never rewrites `:root` of a host application.
4. Preset tokens carry their own prefix: `--ck-*` for Cobalt Kit, `--sp-*` for
   loader geometry. A component rule references tokens, never raw values.
5. Customize by token override at a container, not by editing the preset file.
   That keeps the shared pack reusable and the diff reviewable.
6. A style request may describe a brand that AzSkills cannot legally imitate.
   Distill structure, rename it, and state the provenance level; never copy its
   palette, logo, illustration library, or stylesheet.

## Workflow

### 1. Resolve the request to one preset

```text
Requested preset, keyword, or reference product:
Resolved preset id:
Resolution level: explicit | project identity | default | one-off
Target surface: web app | report | deck | README | loader only
```

If the request names a product with no registered preset, choose the nearest
maintained preset or a documented one-off, and say which. Do not silently mint a
new preset id during an ordinary task.

### 2. Compare against what the artifact already has

Inspect existing tokens, theme handling, and component names. Keep the host
system when it is authoritative; apply the preset only where the request gives
it standing. Never introduce two palettes for one surface.

### 3. Emit the token pack

Load the preset reference and copy only the roles the artifact consumes. State
the scope element that carries `data-style`, so the pack cannot leak into
unrelated regions.

### 4. Emit only the primitives in use

A preset ships primitives, not a page. Emit the button, field, chip, panel, or
selection rule that the artifact actually renders. Prefer the host's existing
component and re-tint it through tokens.

### 5. Close the state set

Cover rest, hover, focus-visible, active, selected, disabled, loading, empty, and
error where the artifact supports them. Selection needs a non-colour cue; focus
needs a visible ring; a disabled state keeps native disabled semantics.

### 6. Verify the rendered artifact

Render at realistic sizes and at 320 CSS px. Check both themes, contrast, focus
order, long labels, and CJK. For loaders, also check the reduced-motion pose and
the announced status text. Report which checks ran.

## Loader library

Loader work is a mode, not a second owner: motion purpose, frequency, and
non-loader animation stay with `ui-motion`. This module supplies eight
single-element primitives driven by `--sp-*` tokens, documented in
[`style-presets/references/loaders.md`](../../style-presets/references/loaders.md)
and implemented in [`style-presets/assets/loaders.css`](../../style-presets/assets/loaders.css).

| Variant | Use when |
| :--- | :--- |
| `ring` | Generic busy state in a bounded region |
| `arc` | Inline or button-adjacent busy state |
| `dots` | Text-adjacent typing or waiting |
| `bars` | Media, audio, or processing hint |
| `sweep` | Content placeholder shimmer |
| `squish` | Playful, low-frequency brand surface |
| `orbit` | Long single task with no progress data |
| `meter` | Known completion value |

Every loader keeps a status role (`role="status"`, or `role="progressbar"` with a
value for `meter`) and a visually hidden label, honours `--sp-size`,
`--sp-color`, and `--sp-duration`, and drops its animation for a static pose
under `prefers-reduced-motion: reduce`. A loader never communicates state by
motion alone.

## Quality gates

- [ ] The resolved preset id and its resolution level are stated.
- [ ] Rules reference `--ck-*`, `--sp-*`, or host tokens; no raw value sits in a component rule.
- [ ] Text, muted text, accent-as-text, and secondary-as-text hold 4.5:1 on canvas, surface, and overlay in both themes.
- [ ] Accent fill labels hold 4.5:1 at rest, hover, and active weights.
- [ ] Selected, focus, disabled, loading, and error states are present and distinguishable without colour alone.
- [ ] Each loader has status semantics, a text label, a size token, and a reduced-motion pose.
- [ ] No brand palette, logo, illustration, icon library, or upstream CSS is reproduced.
- [ ] The rendered artifact was inspected at real sizes, in both themes, at 320 CSS px.

## Output contract

```text
Resolved preset and resolution level:
Token pack and scope element:
Surface adaptation:
Components and states emitted:
Loader variant, markup, and tokens:
Contrast, focus, and reduced-motion evidence:
Unverified items:
```

For `audit`, return the verdict, findings ranked by user impact, and the smallest
corrective action per finding. For `catalog`, return the recommendation with the
decisive reason and the alternatives that were rejected.

## References

- `../../style-presets/references/catalog.md` - preset ids, triggers, thesis, token source, and selection rules.
- `../../style-presets/references/cobalt-kit.md` - BioRender-derived preset contract, token table, and provenance.
- `../../style-presets/references/loaders.md` - variant selection, markup, customization, and accessibility rules.
- `../../style-presets/assets/cobalt-kit.css` - executable Cobalt Kit token and primitive layer.
- `../../style-presets/assets/loaders.css` - executable loader primitives.
- `../../style-presets/assets/gallery.html` - interactive preview for presets and loaders.
