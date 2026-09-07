---
name: ip-as-logo
description: >
  Create extremely simplified character-led IP marks for animals, creatures, robots,
  ghosts, plants, objects, or other mascots. Use when a brand needs a cute memorable
  character symbol that remains recognizable at very small sizes.
---

# IP as Logo

Use this skill for character-led visual identities where the character itself is the
recognition mechanism. The goal is not a detailed illustration; it is a compact,
repeatable visual symbol with a strong silhouette.

## Workflow

1. Identify the IP subject and product connection.
2. If the product context is already available, infer the personality from the product.
3. If context is insufficient, ask one compact round covering product purpose, audience,
   and desired personality.
4. Propose three genuinely different treatments before generation when exploration is
   requested. Vary silhouette, defining feature, or personality rather than merely color.
5. Generate independent candidates only when the user asks for them; never force a
   six-image batch if the requested output is smaller.
6. Preserve a clear mapping between candidate, direction, and rationale.

## Shape language

- Build the character from roughly 4–7 large basic shapes.
- Favor one dominant continuous outer silhouette.
- Use thick, rounded, weighty contours and broad color masses.
- Prefer a large head, compact body, soft cheeks, and simple facial marks when a cute
  personality is appropriate.
- Use at most one major species-defining feature.
- Avoid sharp corners, needle-like appendages, thin antennae, tiny smiles, and narrow gaps.
- Preserve both members of paired identifying features such as ears, horns, wings, or eyes.

## Color discipline

Default to exactly three semantic colors:

- Two IP base colors.
- One solid background color.

Reuse the two IP colors for facial marks. Keep the background independent and visually
separated from the character. Treat palettes from examples as inspiration, not a fixed
allowlist.

When the user explicitly supplies a different palette or color count, follow the user's
requirement instead.

## Composition

- Use a square 1:1 canvas.
- Keep the character upright.
- Make the IP visually dominant, occupying roughly 85–95% of the canvas.
- A lower-left or lower-right emergence can strengthen an IP presentation, but do not
  use it when the user's intended application requires centered iconography.
- For app icons and favicons, test a centered crop as a secondary production variant.
- Keep the background flat and free of scenery, texture, vignette, or lighting effects.

## Simplicity budget

The character must remain readable at 32 × 32.

Remove any detail that becomes noise at that scale: repeated fur tufts, scales, buttons,
armor plates, text, decorative marks, tiny highlights, anatomical linework, and complex
facial rendering.

Use two simple eyes and at most one tiny mouth when needed for expression.

## Image-generation prompt rules

Describe the visual result directly. Do not tell the image model that it is making a
"logo", "app icon", or "brand asset" unless the target model specifically requires
that context.

For modern instruction-following image models, place concise exclusions in a final
`Constraints:` line. For legacy runtimes with a documented negative-prompt field, use
the adapter's dedicated field instead of duplicating exclusions.

Recommended exclusions:

`text, watermark, borders, frames, cards, extra subjects, scenery, thin fragile lines, sharp tips, photorealistic materials, strong 3D rendering, dramatic gloss, external cast shadows`

## Small-size quality gate

Review the concept at 24, 32, 48, and 96 pixels. The silhouette and single strongest
recognition cue should survive first. Simplify rather than adding detail to rescue a weak
small-size result.

## Relationship to logo-generator

`logo-generator` is the general identity skill. This skill is deliberately narrower:
it optimizes the design of a character/IP-led mark and its small-size recognition system.
For a complete brand identity, combine this skill with `logo-generator` only when the
broader system is actually required.

## Provenance

This skill is an original AzSkills adaptation informed by the public methodology in:

- https://github.com/s1dashu/ip-as-logo-skill

The implementation has been rewritten for AzSkills' modular conventions and does not
copy the upstream example asset library.
