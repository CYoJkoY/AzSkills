---
name: brotato-art
description: Generate and refine 2D game art that closely matches Brotato's visual language, including characters, weapons, items, enemies, effects, UI icons, and sprite assets. Enforces bold hand-drawn outlines, flat color blocks, simplified cartoon geometry, restrained shading, transparent game-ready output, and strong 64x64 readability.
---

# Brotato Art

Use this skill when the user asks for Brotato-style, Brotato-inspired, potato-like roguelike, or similarly simplified 2D indie game assets. The goal is not to reproduce a single reference image mechanically. The goal is to consistently reproduce the visual grammar that makes Brotato assets read as one coherent game-art family.

## Core Principle

Treat the style as a **2D hand-drawn flat cartoon game-art system**, not as generic vector art, sticker art, marker art, anime art, or polished digital painting.

The visual hierarchy is:

1. Strong readable silhouette.
2. Bold black outer contour.
3. Simple rounded and slightly organic shapes.
4. Clean flat color blocks.
5. One or two simple shadow shapes.
6. Minimal facial or structural details.
7. Only identity-defining decorative details.

If a detail conflicts with silhouette readability, remove the detail.

## Style Lock

Every generated asset should satisfy the following baseline unless the user explicitly overrides it:

- 2D game sprite or game icon.
- Hand-drawn cartoon appearance.
- Bold black outer outline.
- Rounded, chunky, simplified geometry.
- Slightly organic asymmetry rather than perfect geometric construction.
- Flat, saturated, clean colors.
- Minimal hard-edged cartoon shading.
- No photographic rendering.
- No PBR material response.
- No smooth painterly gradients.
- No dense texture.
- No excessive micro-detail.
- Strong foreground/background separation.
- Game-ready composition.
- Transparent background for standalone assets unless another background is explicitly requested.

## Outline Rules

The outline is a major visual anchor, but do **not** force a universal pixel ratio such as 1/32 of the canvas. That produces unstable results across resolutions and can make the outline consume the artwork.

Use these rules instead:

- The outer contour must be visibly thick and black.
- The contour must be substantially heavier than internal structural marks.
- Use approximately 1/45 to 1/25 of the canvas short edge as a starting range for the main contour, then adjust by subject scale and complexity.
- Smaller assets may need proportionally heavier contours.
- More complex assets may need slightly lighter contours to preserve legibility.
- Keep the visual weight consistent within one asset.
- Allow small natural variations in curvature and thickness.
- Do not introduce random severe jitter.
- Corners should generally be rounded rather than mechanically sharp.
- The contour should feel drawn, not CAD-generated.

Never describe the outline as a 40 mm marker or require a mathematically exact stroke width. The important constraint is **perceived outline weight**, not a literal physical measurement.

## Shape Language

Prefer:

- circles
- ovals
- rounded rectangles
- simple polygons
- soft organic blobs
- chunky limbs and appendages
- slightly asymmetric silhouettes

Avoid:

- realistic anatomy
- elegant fashion illustration proportions
- sharp mechanical complexity unless the object itself requires it
- intricate perspective construction
- thin technical linework
- highly symmetrical sterile geometry

Build the large silhouette first. Add internal structure only after the silhouette works.

## Character Rules

For characters, especially potato-like protagonists:

- Keep the body compact, rounded, and visually dominant.
- Use an off-white, cream, or very light potato-like base when appropriate to the concept.
- Do not automatically make the body yellow.
- Keep facial features extremely simple.
- Eyes are usually small black dots, ovals, or similarly minimal shapes.
- Mouths should be simple marks or small shapes.
- Equipment should be readable as part of the silhouette.
- Use exaggerated but immediately readable poses.
- Avoid human anatomical detail.
- Avoid anime facial construction.
- Preserve a strong face/body hierarchy.

### 64x64 Test

Assume the character may ultimately be viewed at approximately 64x64 pixels.

At that size, the viewer should still be able to identify:

- body silhouette
- face
- primary equipment
- major accessory
- dominant color grouping

If any of these disappear, simplify rather than adding more detail.

## Weapons and Items

Weapons and items should share the same visual language as characters.

Use:

- strong outer contour
- simple primary silhouette
- limited color palette
- one dominant material/color
- one or two shadow blocks
- a small number of functional details

For weapons, prioritize the recognizable weapon profile over realistic construction.

For item icons, prioritize instant category recognition at thumbnail size. Do not fill empty space with decorative texture merely to make the icon appear detailed.

## Enemies and NPCs

Enemies may be more aggressive, strange, or grotesque, but they must still belong to the same 2D cartoon system.

Use exaggerated silhouettes and simple visual motifs rather than realistic anatomy or horror rendering.

Cthulhu-like, mutant, alien, mechanical, or fantasy concepts can be incorporated through:

- unusual silhouettes
- tentacles or appendages represented as simple chunky shapes
- strong accent colors
- exaggerated eyes or mouths
- a small number of distinctive markings

Do not turn the asset into realistic body horror, detailed creature concept art, or painterly dark fantasy.

## Color System

Use clean, saturated, readable colors.

Recommended structure:

- dominant base color: approximately 60–80%
- secondary colors: approximately 15–30%
- accent colors: generally below 10%
- highlights: sparse
- shadows: sparse

Black is primarily reserved for contours and selected structural details. White or very light tones may be used for highlights and facial elements.

Do not use:

- photographic color variation
- noisy color gradients
- metallic PBR highlights
- complex material maps
- excessive neon accents
- texture overlays

## Shading System

Use **hard-edged cartoon color blocks** rather than realistic lighting.

A good default is:

- base color
- one darker shadow block
- optional small light highlight
- black contour

Shadows should clarify volume without becoming a second illustration inside the asset.

Avoid:

- airbrush shading
- soft cinematic lighting
- ambient occlusion rendering
- volumetric light
- realistic reflections
- multi-step painterly rendering

## Internal Lines

Internal lines are allowed when they communicate structure, but they are subordinate to the outer contour.

Prefer color separation first. Use black internal marks only when they improve recognition.

Good uses:

- mouth
- eye details
- weapon joints
- short structural separators
- important seams
- tiny functional indicators

Bad uses:

- cross-hatching
- dense sketch lines
- anatomy construction lines
- decorative line forests
- thin technical diagrams

## Composition

For standalone assets:

- center the subject unless the user requests a directional pose
- keep a clean safety margin
- fill most of the canvas without touching the edges
- keep the silhouette intact
- use transparent background by default

For icons:

- maximize readable subject area
- avoid unnecessary empty space
- maintain a strong thumbnail silhouette

For sprite sheets:

- keep cell dimensions explicit
- keep scale and pivot consistent
- preserve character identity across frames
- maintain consistent outline weight and palette
- avoid independent redraws between adjacent frames

## Animation and Sprite Sheets

When generating an animation sheet, treat frames as a continuous sequence rather than independent illustrations.

Requirements:

- preserve exact character identity
- preserve palette and lighting direction
- preserve camera and framing
- change only the intended animated properties
- use small incremental pose changes between adjacent frames
- maintain consistent silhouette logic
- ensure the final frame transitions naturally to the first frame for loops when looping is requested

For a looping sequence, explicitly preserve first/last-state equivalence when the requested animation requires it.

## Asset-Specific Modules

### Character module

Add:

- body silhouette
- face
- pose
- primary equipment
- secondary accessories
- class/theme identifier

Keep the body visually dominant.

### Weapon module

Add:

- weapon profile
- grip or attachment only if needed
- one dominant material/color
- minimal functional details

Keep the weapon readable without realistic engineering detail.

### Item module

Add:

- one central object or symbol
- strong outline
- simple color grouping
- minimal supporting decoration

The icon should be understandable without text.

### Effect module

Use simple graphic shapes, particles, arcs, bursts, rings, clouds, flames, or impact marks. Effects should remain stylistically compatible with the thick-outline cartoon system unless the effect is intentionally outline-free.

### UI module

UI icons should use the same simplified geometry and outline logic, but can be cleaner and more geometric when necessary for interface consistency.

## Prompt Construction Workflow

When the user asks for a new asset, construct the generation prompt in this order:

1. Asset type and purpose.
2. Subject and defining concept.
3. Silhouette and proportions.
4. Pose or orientation.
5. Primary equipment/details.
6. Color palette.
7. Outline treatment.
8. Flat shading.
9. Composition and background.
10. Resolution/readability requirements.
11. Negative constraints.

Do not repeat the same style adjective dozens of times. A concise, hierarchical prompt is more stable than a keyword pile.

## Prompt Template

Use this internal template when a generation model needs a single natural-language prompt:

> 2D hand-drawn flat cartoon game asset in a Brotato-inspired visual language. [SUBJECT]. Strong compact silhouette, rounded chunky shapes, exaggerated but readable proportions, bold black outer contour with natural hand-drawn variation, clean saturated flat color blocks, one or two hard-edged cartoon shadow shapes, minimal highlights, simplified details, high thumbnail readability, game-ready sprite design, centered composition, transparent background. Preserve a low-detail, high-readability indie-game aesthetic. No realistic anatomy, no painterly rendering, no gradients, no PBR, no texture, no thin technical linework, no anime rendering, no cinematic lighting, no excessive detail.

Replace [SUBJECT] with concrete object-specific information rather than generic style prose.

## Negative Prompt

Use only the negative terms relevant to the generation model, prioritizing:

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

Do not add contradictory negative terms. For example, do not forbid all asymmetry if the prompt explicitly requests organic hand-drawn asymmetry.

## Reference Image Handling

When a reference image is supplied:

1. Preserve its subject identity and composition unless the user asks for structural changes.
2. Extract the visual grammar rather than copying incidental noise.
3. Match silhouette, outline weight, palette, shading complexity, and detail density.
4. Preserve transparent-background behavior when the source is a game asset.
5. If editing an existing image, change only the requested elements and retain the established art language.

Never invent additional stylistic systems that are absent from the reference.

## Quality Gate

Before considering an asset complete, check:

### Silhouette
- Can it be recognized as a thumbnail?
- Is the primary shape immediately obvious?
- Are important appendages or equipment visible?

### Outline
- Is the outer contour clearly bold?
- Is it heavier than internal marks?
- Is it thick without swallowing the subject?
- Does it feel hand-drawn rather than CAD-perfect?

### Color
- Are the fills clean and mostly flat?
- Is the palette limited and readable?
- Are accents restrained?

### Shading
- Are shadows hard-edged and simple?
- Is realistic lighting absent?
- Does shading support rather than compete with the silhouette?

### Detail
- Are only useful details present?
- Is there unnecessary texture or micro-detail?
- Does the face remain readable at small size?

### Game readiness
- Is the background transparent when appropriate?
- Is the subject centered and safely inside the canvas?
- Does it look like a usable game asset rather than concept art?

## Failure Modes and Corrections

### Too much like generic vector art
Cause: perfect geometry, uniform strokes, corporate icon construction.

Correction: introduce rounded organic shapes, controlled asymmetry, bold hand-drawn contour character, and simpler color blocking.

### Too much like a sticker
Cause: exaggerated white border, glossy finish, decorative drop shadows.

Correction: use the black game-art contour as the primary edge treatment and remove sticker-specific effects.

### Too much like AI concept art
Cause: excessive texture, tiny details, dramatic lighting, complex backgrounds.

Correction: reduce detail aggressively and rebuild from silhouette + flat fills + simple shadows.

### Too much like anime
Cause: detailed eyes, human proportions, expressive facial anatomy.

Correction: simplify facial features and restore chunky cartoon proportions.

### Outline is too heavy
Cause: blindly applying a fixed mathematical stroke ratio.

Correction: reduce the contour until the body, equipment, and internal color masses remain visually dominant while the contour is still clearly bold.

### Outline is too thin
Cause: treating the asset as modern vector iconography.

Correction: increase the outer contour and remove unnecessary internal lines.

## User Overrides

The user's explicit asset requirements override the defaults for:

- canvas size
- sprite-sheet layout
- animation frame count
- subject concept
- palette
- orientation
- background
- transparency
- required accessories
- exact composition

However, preserve the core visual language unless the user explicitly asks for a different style.

## Output Behavior

When producing a prompt for an image-generation model:

- Give the concrete asset description first.
- Apply this style system implicitly and explicitly where useful.
- Do not expose internal reasoning.
- Do not claim pixel-perfect similarity to copyrighted source artwork.
- Prefer concise, high-signal constraints over enormous keyword lists.

When producing multiple related assets, reuse the same style lock and vary only the asset-specific module so the set remains visually coherent.
