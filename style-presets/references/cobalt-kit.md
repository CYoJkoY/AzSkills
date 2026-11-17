# Cobalt Kit

A cool, bright, instrument-panel direction distilled from publicly observable
structure in BioRender's product and marketing surfaces. It is an AzSkills
preset, not a BioRender theme, and it shares no values with that brand.

## Thesis

```text
Purpose:   present scientific objects, figures, and measurements without visual noise
Tone:      bright, orderly, clinical, quietly optimistic
Signature: one cobalt primary, one violet secondary, pill controls, flat surfaces
Constraint: white canvas stays dominant; colour never carries meaning alone
```

The result should read as a clean laboratory bench: a wide white field, one
unmistakable action colour, a single cool counterpoint for secondary data, and
borders doing the grouping work that shadows would otherwise do.

## Token roles

Scope the pack to `[data-style="cobalt-kit"]`. Do not apply it at `:root` of a
host application.

| Role | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--ck-canvas` | `#FFFFFF` | `#0E141C` | Page field |
| `--ck-surface` | `#F4F7FB` | `#151C26` | Panels, cards, table rows |
| `--ck-overlay` | `#E6EDF6` | `#1E2734` | Hover, selected, secondary blocks |
| `--ck-text` | `#1B2330` | `#E8EEF6` | Primary text and headings |
| `--ck-text-secondary` | `#46505F` | `#B3BECC` | Body prose |
| `--ck-text-muted` | `#5A6472` | `#95A1B0` | Metadata, captions, sources |
| `--ck-accent` | `#2A4FA8` | `#8FB2F0` | Primary action fill |
| `--ck-accent-text` | `#25468F` | `#8FB2F0` | Accent used as text or icon |
| `--ck-secondary` | `#6B3FA8` | `#BFA6EE` | Secondary series, secondary label |
| `--ck-secondary-text` | `#5E3796` | `#BFA6EE` | Secondary used as text |
| `--ck-border` | `#D3DDEB` | `#2A3644` | Hairline, control outline |
| `--ck-border-strong` | `#A9BBD4` | `#46566B` | Active and focus ink |
| `--ck-focus` | `#2A4FA8` | `#8FB2F0` | Focus ring |
| `--ck-on-accent` | `#FFFFFF` | `#0E141C` | Label on accent fill |
| `--ck-tint-accent` | `#E6EFFA` | `#152132` | Accent information carrier |
| `--ck-tint-secondary` | `#F1ECFA` | `#1E1A2B` | Secondary carrier |
| `--ck-success` | `#1F6B4A` | `#7FD3A8` | Positive result |
| `--ck-warning` | `#8A5A12` | `#E0B36A` | Caution |
| `--ck-danger` | `#A32B2B` | `#F09A9A` | Destructive and error |

Verified in the executable stylesheet: text, secondary text, muted text, accent
as text, and secondary as text each hold at least 4.5:1 on canvas, surface, and
overlay in both themes; accent and secondary fills hold at least 4.5:1 for their
labels at rest, hover, and active weights.

## Geometry

```text
Spacing   4px ramp: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
Radius    4px fields, 8px panels, 12px cards, 999px pill controls
Border    1px solid --ck-border; 2px --ck-border-strong for active and focus
Depth     no shadow on controls; one 0 1px 2px hairline seat on raised cards
Type      system sans for interface, serif reserved for figure captions if needed
Controls  32px comfortable, 26px compact, 44px minimum on touch-first surfaces
```

Pill geometry belongs to buttons, chips, and toggles only. Panels and cards keep
the smaller radius tiers; a pill panel is a different preset.

## Component primitives

| Primitive | Contract |
| :--- | :--- |
| Primary action | Accent fill, on-accent label, pill radius, no shadow, hover lightens, active darkens |
| Secondary action | Canvas fill, 1px border, accent-text label, pill radius |
| Field | 4px radius, 1px border, visible label, focus ring, error text below |
| Chip | Pill radius, tint carrier, text label, selected adds a check glyph |
| Panel | Surface fill, 1px border, 8px radius, 16px inset |
| Data row | Alternating canvas and surface, right-aligned numerics, tabular figures |
| Selection | Accent 2px outline plus a check glyph, never colour alone |

## Surface fit

| Surface | Adaptation |
| :--- | :--- |
| Web app, dashboard | Full pack; compact density for long tables |
| Report or figure page | Canvas and surface only; keep reading measure and body size |
| Deck | Cobalt primary for one signal per slide; keep slide margins generous |
| README or document | Not recommended; Wabi Press holds the repository voice |
| Terminal | Not applicable; the preset is a pixel layer |

## Provenance

| Element | Level | Note |
| :--- | :--- | :--- |
| Bright blue primary, violet secondary, white canvas | `inferred-usage` | Structure observed in public surfaces; values are AzSkills choices |
| 4px rhythm, 12px card radius, pill controls, flat depth | `inferred-usage` | Observed layout discipline |
| Semantic layering with explicit states | `verified-prose` | Documented in the interface contract |
| Exact brand hex values | `unresolved` | Aggregators disagree; no brand value is used |
| Logos, illustrations, icon library, templates | `rejected` | Not licensed for reuse; not reproduced |

BioRender is a trademark of its owner. This preset is not affiliated with,
endorsed by, or derived from copied assets of that product. See
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

## Related

- [`catalog.md`](catalog.md) - preset list and selection order.
- [`loaders.md`](loaders.md) - loader variants that inherit `--ck-accent`.
- [`../assets/cobalt-kit.css`](../assets/cobalt-kit.css) - executable tokens and primitives.
