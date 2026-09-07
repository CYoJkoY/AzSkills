# Brotato Art Direction v3 — Prompt Templates

These are construction patterns, not keyword dumps. Replace bracketed fields with concrete task information. Load `SKILL.md` first and use the smallest relevant template.

## Universal Asset

> Create a clean 2D game-ready asset using the visual grammar of Brotato. [SUBJECT]. Build the design from a strong compact organic silhouette, chunky rounded shapes, exaggerated but readable proportions, and a bold black outer contour with controlled hand-drawn irregularity. Use a limited flat-color palette, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Prioritize silhouette, function, identity, and small-size readability over detail. The asset must feel like a real in-game indie game sprite rather than a modern vector mascot, promotional illustration, concept-art sheet, anime character, or 3D render. Transparent background unless otherwise requested. Keep the design recognizable at 64x64. Remove unnecessary detail.

## Character

> [CHARACTER CONCEPT]. Compact, short, rounded organic potato-like body with slightly asymmetric silhouette and low center of gravity. [POSE]. Extremely simple black dot/oval eyes and [MOUTH/EXPRESSION]. [PRIMARY EQUIPMENT]. [SECONDARY ACCESSORY]. Equipment participates in the silhouette and remains immediately readable. Bold black outer contour with controlled natural hand-drawn variation, sparse internal lines, limited flat colors, one or two hard-edged cartoon shadow blocks, minimal highlights, low detail, strong thumbnail readability, transparent background, 64x64-readable 2D game sprite.

## Weapon

> [WEAPON]. Immediately recognizable chunky weapon profile, [ORIENTATION], [MAJOR FUNCTIONAL COMPONENTS]. Use a limited flat palette, bold black outer contour, simple organic/rounded construction, sparse internal structure, one or two hard-edged cartoon shadow blocks, minimal material detail, strong thumbnail readability, 2D game-ready weapon sprite, transparent background. Prefer the most recognizable angle rather than forcing a front view.

## Item / Relic

> [ITEM OR RELIC]. One dominant central object or symbol, compact readable silhouette, slightly organic orientation, bold black outer contour, limited flat colors, sparse internal lines, one or two hard-edged shadow blocks, minimal highlight, no decorative micro-detail, instantly recognizable at thumbnail size, 2D game-ready item icon, transparent background.

## Legendary Item

> [LEGENDARY ITEM]. One unusually distinctive silhouette or central visual motif, stronger but restrained accent color, bold black outer contour, limited flat palette, minimal hard-edged shading, low detail, high visual mass and instant recognition at small size. Legendary identity comes from silhouette, motif, and visual hierarchy—not micro-detail. Transparent background.

## Enemy / Boss

> [ENEMY]. Exaggerated compact organic body, strong instantly recognizable silhouette, [ONE OR TWO DEFINING FEATURES], minimal face if applicable, chunky appendages, bold black outer contour, limited flat colors, sparse internal lines, restrained hard-edged cartoon shadows, low detail, high gameplay readability, transparent background. Keep mutant, alien, fantasy, mechanical, or Cthulhu-like concepts graphic and stylized rather than realistic body horror or creature concept art.

## NPC

> [NPC CONCEPT]. Same compact rounded body language as Brotato characters, [CLOTHING/PROP], [POSE], extremely simple face, bold black outer contour, limited flat palette, sparse internal lines, minimal hard-edged shading, one memorable identity feature, low detail, transparent background, game-ready 2D sprite.

## Effect / VFX

> [EFFECT], [MOTION OR STATE]. Clear graphic silhouette using simple circles, blobs, arcs, bursts, rings, impact shapes, flames, clouds, or controlled particles. Limited high-contrast flat colors, minimal hard-edged shading, controlled black contour where appropriate, strong gameplay readability, transparent background. No particle spam, cinematic smoke, realistic fire, volumetric rendering, or excessive glow.

## UI / Cursor

> [UI ELEMENT]. Compact highly readable game-interface asset using simplified rounded geometry and the same optical weight as Brotato game art. Bold black contour where appropriate, limited flat colors, minimal shading, strong contrast, instant recognition at native UI size, testable at 32x32 where practical, transparent background.

## Animation / Sprite Sheet

> Continuous 2D game animation of [SUBJECT], [GRID], [FRAME COUNT]. Preserve exact identity, silhouette, palette, outline weight, camera, scale, pivot, framing, and relevant background pixels across all frames. Animate only [PROPERTY] with small incremental changes between adjacent frames. No independent redraws. [LOOP REQUIREMENT]. Maintain consistent Brotato visual language and 64x64 readability.

## Reference Redraw

> Preserve the supplied reference's subject identity, major silhouette, composition, palette relationships, outline hierarchy, and visual detail density. Re-render it using the established Brotato Art Direction v3 system: organic chunky shapes, bold black outer contour, limited flat colors, sparse internal lines, restrained hard-edged cartoon shadows, minimal detail, strong thumbnail readability. Modify only [REQUESTED CHANGE]. Preserve all unspecified properties. Transparent background unless otherwise specified.

## Theme Translation

Use this pattern when the asset belongs to a strong Mod theme:

> [ASSET] using Brotato Art Direction v3, translated into [THEME]. Express the theme through silhouette, one or two memorable props/symbols, restrained accent colors, and simple graphic motifs. Do not replace the Brotato visual grammar with realistic [THEME-SPECIFIC MATERIALS/EFFECTS].

## Negative Prompt Base

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

## Template Rules

- Put concrete subject information before style adjectives.
- Build from silhouette before detail.
- Use only constraints relevant to the task.
- Do not repeat style keywords excessively.
- Do not force weapons/items into a universal camera angle.
- Do not use fixed color percentages as hard requirements.
- Treat 64x64 as a readability test, not necessarily the source resolution.
- For reference edits, explicitly lock unchanged properties and identify the requested delta.
- For animations, explicitly lock identity, camera, palette, scale, pivot, and frame continuity.
- If the output looks too polished, simplify instead of adding more style keywords.
