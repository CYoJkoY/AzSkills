# Prompt Templates

These templates are construction patterns, not mandatory keyword dumps. Replace bracketed fields with concrete task information.

## Universal Asset

> 2D hand-drawn flat cartoon game asset in a Brotato-inspired visual language. [SUBJECT]. Strong compact silhouette, rounded chunky shapes, exaggerated but readable proportions, bold black outer contour with controlled natural hand-drawn variation, clean saturated flat color blocks, one or two hard-edged cartoon shadow shapes, minimal highlights, low-detail high-readability game sprite design, transparent background. No photorealism, realistic anatomy, anime rendering, 3D/PBR rendering, smooth gradients, painterly shading, dense texture, thin technical linework, cinematic lighting, or excessive micro-detail.

## Character

> [CHARACTER CONCEPT], compact rounded body, [POSE], [FACE], [PRIMARY EQUIPMENT], [SECONDARY ACCESSORY]. Body visually dominant, strong readable silhouette, bold black hand-drawn outer contour, clean flat color blocks, restrained hard-edged shadows, simple facial features, exaggerated game-readable proportions, readable at 64x64, 2D indie game character sprite, transparent background.

## Weapon

> [WEAPON], immediately recognizable chunky profile, [ORIENTATION], [MAJOR COMPONENTS], limited palette, bold black outer contour, clean flat color blocks, one or two hard-edged cartoon shadows, minimal functional details, strong thumbnail readability, 2D indie game weapon sprite, transparent background.

## Item

> [ITEM], single dominant central object or symbol, compact readable silhouette, rounded simplified geometry, bold black outer contour, clean saturated flat colors, limited palette, minimal hard-edged shadow, sparse highlight, instantly recognizable game item icon, transparent background.

## Enemy

> [ENEMY], aggressive simplified cartoon creature, exaggerated readable silhouette, [SIGNATURE FEATURE], chunky organic shapes, bold black hand-drawn contour, clean saturated flat colors, restrained hard-edged shadows, minimal detail, strong gameplay readability, 2D indie game enemy sprite, transparent background.

## Effect

> [EFFECT], [MOTION OR STATE], clear graphic silhouette, simplified 2D cartoon effect, clean saturated color blocks, chunky particles, minimal hard-edged shading, controlled black contour where appropriate, strong gameplay readability, transparent background.

## UI

> [UI ELEMENT], compact highly readable game interface icon, simplified rounded geometry, bold black contour where appropriate, clean flat colors, minimal shading, consistent optical weight, strong contrast, transparent background, readable at native UI size.

## Animation

> Continuous sprite animation of [SUBJECT], [GRID], [FRAME COUNT]. Preserve exact identity, silhouette, palette, outline weight, camera, scale, pivot, and framing across every frame. Animate only [PROPERTY] with small incremental changes between adjacent frames. [LOOP REQUIREMENT]. Clean 2D hand-drawn flat cartoon game-art rendering, transparent background.

## Reference Redraw

> Preserve the supplied reference's subject identity, major silhouette, composition, palette relationships, and visual hierarchy. Re-render it using the established Brotato-inspired 2D hand-drawn flat cartoon system: bold black outer contour, rounded chunky shapes, clean flat colors, restrained hard-edged shadows, minimal detail, strong thumbnail readability. Modify only [REQUESTED CHANGE]. Transparent background unless otherwise specified.

## Negative Prompt Base

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

## Template Rules

- Put concrete subject information before style adjectives.
- Use only constraints relevant to the task.
- Do not repeat the same style keyword excessively.
- Do not combine contradictory requirements.
- Add exact dimensions, grid structure, and transparency requirements when known.
- For reference edits, explicitly lock unchanged properties and identify the requested delta.
