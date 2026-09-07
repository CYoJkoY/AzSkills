---
name: brotato-art
description: Brotato Art Direction Skill v3. Generate and refine 2D game assets using Brotato's actual visual grammar rather than generic flat-vector or cartoon aesthetics. Covers characters, weapons, items, relics, enemies, NPCs, effects, UI, cursors, and sprite animations with silhouette-first design, bold black contours, limited colors, minimal shading, low detail, and strict small-size readability.
---

# Brotato Art Direction v3

## Mission

Use this skill for Brotato-style or Brotato-inspired 2D game assets. The target is not a generic image with “thick black outline + flat colors”. The target is an asset that could naturally coexist with Brotato's real in-game visual system.

Think:

> If this asset had shipped as a native in-game Brotato asset, how would it have been constructed?

Do not turn the target into a modern mascot, polished vector illustration, mobile-game promotional art, anime, concept art, or 3D render.

## Absolute Priority

When requirements conflict:

1. Explicit user requirements.
2. Brotato visual language.
3. Silhouette readability.
4. Bold black outer contour.
5. Simple organic proportions.
6. Limited flat color blocks.
7. Sparse internal structure.
8. Minimal cartoon shading.
9. Identity-defining details.
10. Decorative details.

If a lower-priority detail damages a higher-priority rule, delete it.

## Core Visual DNA

The visual language is defined by deliberate simplicity:

- compact, chunky, organic forms
- short, low-profile proportions
- bold black outer contours
- extremely simple faces
- limited color palettes
- flat or near-flat color regions
- small hard-edged shadow blocks
- sparse internal lines
- slight asymmetry and organic imperfection
- strong thumbnail readability
- obvious game-sprite construction

The hand-drawn feeling comes from shape language, proportion, and controlled contour imperfection—not sketch noise, brush texture, random jitter, or scribbles.

## Silhouette-First Construction

Every asset follows:

```text
Identity
→ silhouette
→ primary color
→ major structure
→ face / defining feature
→ equipment
→ minimal shading
→ optional identity details
→ simplification
→ thumbnail test
```

Start from the black silhouette. If the subject is not recognizable as a silhouette, redesign the silhouette instead of adding detail.

A successful asset becomes clearer, not more confusing, when reduced in size.

## Shape Language

Prefer:

- organic ovals
- potato-like blobs
- rounded rectangles
- soft asymmetric polygons
- chunky limbs
- simple primitives
- exaggerated compact forms

Avoid:

- perfect mathematical geometry
- sterile symmetry
- realistic anatomy
- elegant fashion proportions
- complex perspective construction
- thin technical linework
- unnecessary mechanical complexity

The construction should feel intentionally simple, not unfinished.

## Character Grammar

### Body

Characters should generally be short, compact, rounded, low-center-of-gravity, slightly asymmetric, and visually dominated by the body.

The body is not a normal human torso. Avoid realistic chest, waist, muscle, bone, or heroic humanoid proportions.

For potato-like protagonists, prefer off-white, cream, ivory, or light neutral body colors when appropriate. Do not automatically make every potato yellow.

### Face

Use extremely simple:

- small black dot or oval eyes
- short mouth line or tiny mouth shape
- optional tiny eyebrow/expression mark
- normally no realistic nose

Never use detailed irises, anime eyes, eyelashes, realistic lips, or detailed facial anatomy.

### Limbs

Arms, legs, hands, and feet are short and simplified. They communicate pose and action, not anatomy.

### Equipment

Equipment must participate in the silhouette and be large enough to identify immediately. Do not turn equipment into detailed concept art.

## Outline System

Use a strong black outer contour: `#000000`.

The outer contour must be visibly heavier than internal marks and feel rounded, organic, clean, and slightly hand-drawn.

A starting range of approximately 1/45–1/25 of the canvas short edge may be used, but this is a perceived-weight guideline, not a literal mathematical requirement. Smaller assets may need heavier contours; complex assets may need slightly lighter contours.

Allowed:

- small natural curvature variation
- slight thickness variation
- controlled organic imperfection
- rounded corners

Forbidden:

- random severe jitter
- scribbling
- sketch construction lines
- CAD-perfect strokes
- hairline outlines
- technical vector linework

Optimize perceived outline weight, not physical stroke measurements.

## Internal Lines

Internal lines are subordinate to the outer contour. Prefer color separation first.

Good uses: eyes, mouth, short structural separators, important seams, weapon joints, functional indicators.

Bad uses: cross-hatching, dense anatomy lines, decorative line forests, technical diagrams, sketch construction.

## Color System

Use a restrained palette:

- one dominant color
- one or two secondary colors
- a small accent color
- black contour
- sparse highlight/shadow colors

Colors should be clean and readable. Saturated colors are allowed, but do not make every color maximally saturated.

Do not use smooth gradients, photographic color variation, cinematic grading, rainbow palettes, color noise, complex material maps, or excessive neon accents.

Do not enforce rigid percentage splits between colors. Readability and hierarchy matter more than fixed ratios.

## Shading

Use hard-edged cartoon color blocks.

Default:

```text
base color
+ one darker shadow block
+ optional small highlight
+ black contour
```

Avoid airbrush, soft gradients, PBR, realistic reflections, rim lighting, volumetric lighting, cinematic illumination, and painterly rendering.

Shading clarifies volume; it must not become a second illustration.

## Materials

Represent materials through color, silhouette, and simple structural blocks.

Do not add realistic metal reflections, leather grain, wood grain, fabric texture, skin texture, scratches, surface noise, or micro-material detail.

## Asset Modules

### Character
Priorities: body silhouette → face → pose → primary equipment → secondary accessory → theme/class identifier. Keep the body visually dominant.

### Weapon
Priorities: recognizable weapon profile → orientation → major functional components → limited palette → minimal material separation. Use the most recognizable angle: side, diagonal, horizontal, vertical, or three-quarter view. Do not force every weapon into front view.

### Item / Relic
Use one dominant object or symbol. Keep the icon compact and understandable without text. Legendary items may have unusual silhouettes, stronger accents, or distinctive visual mass, but “legendary” does not mean “more micro-detail”.

### Enemy / Boss
Use exaggerated silhouettes and one or two defining features. Mutant, alien, fantasy, mechanical, or Cthulhu-like concepts remain chunky, graphic, and low-detail rather than realistic creature concept art or body horror.

### NPC
Use the same body, face, outline, color, and detail grammar as playable characters. Identity comes from silhouette, clothing, equipment, or one memorable prop.

### Effect / VFX
Prefer simple circles, blobs, arcs, bursts, rings, impact shapes, flames, clouds, trails, and controlled particles. Effects should be readable before spectacular. Avoid particle spam, cinematic smoke, realistic fire, volumetric electricity, and excessive glow.

### UI / Cursor
Use the same simplified geometry and outline language. UI may be slightly cleaner/geometric where necessary, but must retain optical consistency. At very small sizes, prioritize instant recognition over decoration.

### Environment
Use simple gameplay-readable shapes and limited decoration. Environment supports gameplay readability rather than becoming a polished illustration.

## Composition

Character: single subject, centered unless directional pose requires otherwise, large readable body, safe margin, transparent background by default.

Weapon: single object, dynamic but readable orientation, compact composition, transparent background.

Item: one central object/symbol, compact silhouette, minimal empty space, transparent background.

Enemy: single readable enemy, clear pose, strong silhouette, transparent background.

Effect: one readable effect state, clear center, controlled particles, transparent background.

Do not add cinematic backgrounds or environmental storytelling unless explicitly requested.

## 64×64 / Thumbnail Test

Treat 64×64 as a readability test, not necessarily the source resolution. At small size, the viewer should still identify the main silhouette, face if present, primary equipment, dominant color grouping, and main functional feature.

For UI icons, test 32×32 where practical.

If the test fails:

```text
simplify
→ strengthen silhouette
→ remove internal lines
→ enlarge defining feature
→ improve color separation
```

Never add detail to solve a readability failure.

## Detail Budget

Default detail density: LOW.

Keep a detail only if it communicates identity/function, strengthens silhouette, improves gameplay readability, or distinguishes the asset from another asset. Otherwise delete it.

A useful final pass is to remove 10–30% of nonessential detail.

## Theme Translation

Mod themes must be translated into Brotato's visual language rather than replacing it.

Cosmic: simple stars, circular cosmic symbols, dark accents, compact celestial shapes.

Ancient magic: simple rune symbols, one strong accent, thick contour, simplified mystical prop.

Cyberpunk: one or two bright accents, compact geometric equipment, simplified neon-like color blocks.

Cthulhu: chunky organic tentacles, one strange facial feature, limited dark/accent palette, no realistic horror texture.

Do not use realistic nebulae, dense machinery, detailed engravings, or photorealistic horror textures merely because the theme suggests them.

## Anti-Generic-Vector Rule

If the result looks like a Figma illustration, corporate mascot, polished SVG character, modern mobile-game asset, marketing illustration, or generic sticker pack, it has failed.

Correct by reducing geometric perfection, increasing controlled organic asymmetry, simplifying the face, strengthening the black contour, reducing color count, removing decoration, and simplifying shading.

## Anti-AI-Noise Rule

Avoid random micro-details, inconsistent contour weights, meaningless decorative shapes, unnecessary highlights, random particles, excessive symmetry, unexplained texture, and over-rendering.

Every surviving detail should have a design reason.

## Anti-Pixel-Art Rule

Brotato is not pixel art. Unless explicitly requested, do not use pixel dithering, deliberate pixel staircases, pixel-block construction, or retro pixel palettes.

The target is clean 2D raster/game illustration with hand-drawn cartoon construction.

## Animation and Sprite Sheets

Treat frames as one continuous sequence, not independent illustrations.

Preserve exact identity, palette, lighting direction, outline weight, camera, scale, pivot, framing, and relevant background pixels.

Adjacent frames should differ through small incremental changes. Do not independently redraw each frame.

For loops, preserve first/last-state equivalence when requested. If the user specifies pixel-level identity between first and last frames, treat it as a hard constraint.

## Prompt Construction

Build final prompts in this order:

1. asset type and purpose
2. concrete subject
3. defining identity features
4. silhouette and proportions
5. pose/orientation
6. equipment or major structure
7. color palette
8. outline treatment
9. flat shading
10. composition/background
11. size/readability
12. relevant negative constraints

Put concrete subject information before generic style adjectives. Do not repeat style keywords dozens of times.

## Universal Prompt

> Create a clean 2D game-ready asset using the visual grammar of Brotato. [SUBJECT]. Build the design from a strong compact organic silhouette, chunky rounded shapes, exaggerated but readable proportions, and a bold black outer contour with controlled hand-drawn irregularity. Use a limited flat-color palette, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Prioritize silhouette, function, identity, and small-size readability over detail. The asset must feel like a real in-game indie game sprite rather than a modern vector mascot, promotional illustration, concept-art sheet, anime character, or 3D render. Transparent background unless otherwise requested. Keep the design recognizable at 64x64. Remove unnecessary detail.

## Negative Prompt Base

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

Use only relevant negative terms. Do not add contradictory constraints.

## Reference Image Handling

When a reference image is supplied:

1. Preserve subject identity and requested composition.
2. Extract visual grammar rather than incidental noise.
3. Match silhouette, contour weight, palette, shading complexity, and detail density.
4. Preserve transparency/game-sprite behavior when appropriate.
5. If editing, modify only requested elements and preserve all other established properties.

Never invent a second visual system absent from the reference.

## Quality Gate

### Silhouette
- Recognizable as a black silhouette.
- Primary shape immediately obvious.
- Important appendages/equipment visible.

### Outline
- Outer contour clearly bold.
- Heavier than internal marks.
- Thick without swallowing the subject.
- Organic rather than CAD-perfect.

### Color
- Mostly flat fills.
- Limited palette.
- Restrained accents.

### Shading
- Hard-edged and simple.
- No realistic lighting.
- Supports the silhouette.

### Detail
- Only useful details remain.
- No unnecessary texture/micro-detail.
- Face survives at small size.

### Game readiness
- Correct transparency.
- Safe canvas margins.
- Looks like a usable game asset, not concept art.

### Style fidelity
- Would visually coexist with Brotato-style characters, weapons, items, and enemies?
- Avoids modern commercial illustration aesthetics?
- Avoids obvious AI visual noise?

## Failure and Correction Matrix

Too generic/vector-like → reduce geometric perfection, add controlled organic asymmetry, strengthen black contour, simplify color blocks.

Too polished → remove detail, gradients, reflections, and decoration; return to silhouette + flat fills + simple shadows.

Too anime → simplify eyes/facial anatomy and restore chunky proportions.

Too realistic → flatten materials/lighting and remove texture.

Outline too thin → increase perceived outer-contour weight and remove unnecessary internal lines.

Outline too heavy → reduce contour until body/equipment color masses remain visually dominant.

Too detailed → remove 20–40% of nonessential detail.

Too generic → strengthen silhouette and add one memorable identity feature rather than many small details.

Poor readability → enlarge defining feature, increase silhouette separation, remove clutter, simplify colors.

## Consistency Across a Mod

All assets in one Mod must share:

- contour language
- perceived outline weight
- face grammar
- body/proportion philosophy
- color philosophy
- shading philosophy
- detail density
- silhouette-first construction

A sci-fi weapon, Cthulhu enemy, fantasy relic, or cosmic character may have different subject matter, but they must remain members of the same 2D game-art system.

## Modular Loading

Use `MODULES.md` to load only what the task requires.

```text
Character → SKILL.md → character.md → prompt-templates.md
Weapon → SKILL.md → weapon.md → prompt-templates.md
Item/Relic → SKILL.md → item.md → prompt-templates.md
Enemy/Boss → SKILL.md → enemy.md → prompt-templates.md
Effect/VFX → SKILL.md → effect.md → prompt-templates.md
UI/Cursor → SKILL.md → ui.md → prompt-templates.md
Animation → SKILL.md → relevant asset module → sprite-animation.md → prompt-templates.md
```

Precedence:

1. Explicit user requirements.
2. This core `SKILL.md`.
3. Most specific asset module.
4. Prompt templates.

## Output Behavior

When producing prompts:

- describe the concrete asset first
- use high-signal style constraints
- keep prompts task-specific
- do not expose hidden reasoning
- do not claim pixel-perfect reproduction of copyrighted source artwork
- preserve consistency across related assets

When generating a set, reuse the same core style lock and vary only asset-specific identity.

## Final Rule

When uncertain: simplify.

If still uncertain: simplify the silhouette.

If the result looks too polished: simplify again.

The target is not more detail. The target is a simple, expressive, immediately readable 2D game asset that naturally belongs inside the Brotato visual ecosystem.
