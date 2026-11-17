# Preset Catalog

One place to name a style. Each row is an entry point: the id is stable, the
triggers are literal phrases a request may contain, and the package is the file
that owns the tokens.

| Preset id | Triggers | Thesis | Package |
| :--- | :--- | :--- | :--- |
| `wabi-press` | `wabi press`, `wabi-press`, `paper and ink`, `default direction`, `侘寂刊本` | Warm paper, soot ink, a single cinnabar seal, serif titles, near-zero shadow | Root `DESIGN.md` and `design-system/wabi-press.css` |
| `cobalt-kit` | `biorender`, `bio render`, `cobalt kit`, `lab canvas`, `research canvas` | Bright cobalt on a cool white canvas, one violet secondary, 4px rhythm, pill controls, flat depth | `style-presets/assets/cobalt-kit.css` |

## Selection

```text
1. Explicit preset id or trigger in the request   -> that preset
2. Authoritative project identity or DESIGN.md    -> project system
3. No direction at all                            -> wabi-press
4. Named product with no preset                   -> nearest preset, or a documented one-off
```

State the level you used. A preset is a starting direction, not a claim that the
artifact now belongs to that reference product.

## When to reach for Cobalt Kit

Use it when the subject is scientific, clinical, laboratory, or data-instrumented
and the caller asked for a bright, cool, high-legibility canvas. It suits figure
galleries, protocol browsers, sample and assay dashboards, and teaching material
that needs an airy white field with one unmistakable primary.

Avoid it for long-form reading, editorial essays, quiet archival material, and
any deck whose subject is paper, craft, or history. Wabi Press reads better there
and keeps the repository's own voice.

## What a preset may and may not do

A preset may define color roles, type roles, spacing rhythm, radius tiers, border
and elevation treatment, control geometry, and component primitives.

A preset may not copy a third-party palette, logo, icon library, illustration,
template, screenshot, or stylesheet. Product names in this catalog describe
publicly observable structure only. Each reference records its own evidence
level, and the notice file records the provenance.

## Adding a preset

1. Confirm no existing preset covers the direction; prefer a token override.
2. Write `style-presets/references/<id>.md` with thesis, token table, surface fit,
   and provenance level.
3. Write `style-presets/assets/<id>.css` scoped to `[data-style="<id>"]`.
4. Add one catalog row with stable triggers.
5. Add the keyword route to the Codex hook so a plain request resolves without
   naming the module.
6. Verify both themes at 4.5:1, then render the gallery.

Presets are additive. A new preset never becomes the repository default, and it
never edits the Wabi Press tokens.
