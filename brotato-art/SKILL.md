---
name: brotato-art
description: Brotato Art Direction Skill v5. Generate and refine 2D game assets using the visual grammar of Brotato's actual in-game roster and asset system. Covers characters, weapons, items, relics, enemies, NPCs, effects, UI, cursors, environments, and sprite animations. Character tasks use an authentic roster grammar: a compact pale potato-creature base, extremely simple facial composition, one dominant identity feature, restrained body variation, bold black contours, flat color masses, minimal hard-edged shading, and strict icon-scale readability.
---

# Brotato Art Direction v5

## Mission

Use this skill for Brotato-style or Brotato-inspired 2D game assets. The target is not merely "thick black outline + flat colors". The target is an asset that could naturally coexist with Brotato's actual in-game visual system.

The reference standard is the visual construction of the real Brotato character roster and game assets. The current character roster contains many distinct identities while preserving a shared compact creature/icon language: pale potato-like bodies, extremely compressed facial graphics, a small number of large identity features, heavy contours, broad flat colors, and minimal shading. citehttps://brotato.wiki.spellsandguns.com/Characters

Think:

> If this asset had shipped as a native in-game Brotato asset, how would it have been constructed?

Do not turn the target into a modern mascot, polished SVG illustration, mobile-game promotional asset, anime character, fantasy RPG character sheet, realistic creature, concept-art render, or 3D model.

## Absolute Priority

When requirements conflict:

1. Explicit user requirements.
2. Brotato visual language.
3. Character/asset identity.
4. Icon/sprite readability.
5. Strong black outer contour.
6. Compact organic proportions.
7. Limited flat color masses.
8. Sparse internal structure.
9. Minimal hard-edged cartoon shading.
10. Decorative detail.

If a lower-priority detail damages a higher-priority rule, delete it.

## Core Visual DNA

The visual language is defined by deliberate visual compression:

- compact chunky organic forms
- pale/off-white potato-like creature bases where appropriate
- bold black outer contours
- extremely simple faces
- one or a few strong identity features
- limited flat color regions
- small hard-edged shadow blocks
- sparse internal lines
- controlled asymmetry
- high recognition at small sizes
- obvious game-asset construction

The hand-drawn quality comes from shape language, proportion, and controlled contour irregularity—not sketch noise, brush texture, random jitter, or scribbles.

## Authentic Roster Principle

Brotato characters are a coherent species/system, not 62 unrelated character designs. Do not force every character to have a radically different body.

The correct target is:

```text
shared potato-creature foundation
→ face identity
→ primary visual identity feature
→ expression
→ 0–3 secondary features
→ subtle body variation when useful
→ optional equipment
→ restrained color
→ minimal shading
```

The wrong target is:

```text
generic potato
→ elaborate costume
→ weapon
→ accessories
→ decorative detail
```

and also:

```text
human character
→ potato skin
→ human anatomy
```

Character identity should usually come from the face plus one or a few large graphic features, not from excessive equipment.

## Character Presentation

When the user asks for a character without explicitly requesting a gameplay animation or full-body action pose, prefer the compact character-icon language used by the roster:

- one compact potato creature
- pale/off-white body unless the concept explicitly requires another material
- thick black contour
- face large and clearly readable
- mostly frontal or slightly directional orientation
- one dominant identity feature
- compact framing
- minimal visible limbs
- no environment
- no cinematic perspective

Do not automatically create an RPG-style full-body illustration, turnaround sheet, or dramatic scene.

## Character Base Body

The default body is a simple potato-like organic mass. It is not a mathematically perfect oval and it is not a human torso.

Allow restrained variation:

- round
- slightly tall
- slightly wide
- slightly flattened
- lopsided
- swollen
- tapered
- subtly pointed
- compressed
- irregularly bulged
- slightly tilted

Do not force extreme deformation. The character should still belong to the same visual species as the roster.

## Character Face

The face is a primary identity layer and must remain extremely simple.

Useful elements:

- tiny black eyes
- small oval eyes
- simple eyelids
- tiny eyebrows
- short mouth
- tiny curved mouth
- small teeth/fangs only when necessary
- one obscured or altered eye
- asymmetric eye placement
- simple facial marking

Avoid:

- anime eyes
- detailed irises
- realistic pupils
- eyelashes
- realistic nose
- realistic lips
- detailed teeth
- realistic facial anatomy
- 3D facial modeling

Facial personality comes from placement, scale, angle, and a few black graphic shapes—not detail.

## Primary Identity Feature

Every original character should have one obvious graphic identity feature. Suitable examples include:

- hat
- helmet
- goggles
- eye patch
- mask
- hair mass
- beard/moustache mass
- horns
- ears
- unusual eye
- simple mechanical block
- tentacle-like extension
- scarf
- crown
- large facial marking
- simple cape
- distinctive body protrusion

One strong feature is preferable to many small accessories.

## Secondary Features

Use zero to three secondary features. Keep them subordinate to the face and primary identity feature.

Do not fill empty space merely because it is available.

## Character Limbs

For portrait/icon characters, limbs may be absent or only minimally visible. For gameplay sprites, use short chunky appendages.

Never force human anatomy into the design. Avoid realistic elbows, knees, fingers, feet, musculature, shoulders, hips, or a narrow waist.

Hands and feet are graphic shapes.

## Character Clothing and Equipment

Clothing is a graphic mass, not a realistic garment.

Prefer:

- simple coat
- simple robe
- simple helmet
- simple cape
- simple collar
- simple belt

Avoid:

- realistic folds
- fabric weave
- detailed stitching
- layered fashion
- complex armor construction
- dozens of straps or pouches

Starting weapons are gameplay data and should not automatically become part of the character illustration. Include a weapon only when the user explicitly asks for it or when it is inseparable from the visual identity.

## Character Color

Default potato-creature bodies should favor:

- pale ivory
- off-white
- cream
- light neutral

Do not automatically make the body yellow, golden, orange, or brown.

Use a restrained palette:

```text
body
+ primary identity color
+ optional secondary color
+ tiny accent
+ black contour
```

## Character Shading

Use very little shading.

Default:

```text
flat body fill
+ one small hard-edged shadow block
+ optional tiny highlight
+ black contour
```

For character icons, no shading can be better than over-rendering.

## Silhouette System

All assets should begin from a readable shape, but character silhouette testing must be interpreted correctly.

For many roster characters, the silhouette primarily communicates:

- the shared potato-creature body
- the head shape
- hat/hair/goggles/ears/horns or another large identity feature

Do not require the black silhouette alone to identify every exact character. Facial composition is an essential identity layer and should be tested separately.

Character validation order:

```text
base creature test
→ silhouette test
→ face test
→ identity-feature test
→ roster test
→ thumbnail test
```

## Non-Character Shape Language

Prefer:

- organic ovals
- potato-like blobs
- rounded rectangles
- soft asymmetric polygons
- chunky appendages
- simple primitives
- exaggerated compact forms

Avoid:

- sterile mathematical geometry
- perfect symmetry
- realistic anatomy
- elegant fashion proportions
- complex perspective construction
- thin technical linework
- unnecessary mechanical complexity

## Outline System

Use a strong black outer contour: `#000000`.

The outer contour must be visibly heavier than internal marks and feel rounded, organic, clean, and slightly hand-drawn.

A perceived-weight range of approximately 1/45–1/25 of the canvas short edge may be used as a starting guideline, not a literal requirement. Smaller assets may need heavier contours.

## Internal Lines

Internal lines are subordinate to the outer contour. Prefer color separation first.

Good uses: eyes, mouth, facial marks, short structural separators, important seams, weapon joints, and functional indicators.

Bad uses: cross-hatching, dense anatomy lines, decorative line forests, technical diagrams, and sketch construction.

## Color System

Use a restrained palette:

- one dominant color
- one or two secondary colors
- a small accent
- black contour
- sparse shadow/highlight colors

Do not use smooth gradients, photographic color variation, cinematic grading, rainbow palettes, color noise, complex material maps, or excessive neon accents.

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

## Materials

Represent materials through color, silhouette, and simple structural blocks.

Do not add realistic metal reflections, leather grain, wood grain, fabric texture, skin texture, scratches, surface noise, or micro-material detail.

## Asset Modules

### Character
Load `character.md`. Priorities: shared potato-creature foundation → face identity → primary identity feature → expression → 0–3 secondary features → subtle body variation when useful → restrained palette → minimal shading. For unspecified presentation, use compact roster/icon grammar rather than a full-body RPG composition.

### Weapon
Priorities: recognizable weapon profile → orientation → major functional components → limited palette → minimal material separation. Use the most recognizable angle rather than forcing every weapon into front view.

### Item / Relic
Use one dominant object or symbol. Keep the icon compact and understandable without text. Legendary identity comes from silhouette, motif, and hierarchy, not micro-detail.

### Enemy / Boss
Use an exaggerated compact silhouette and one or two defining features. Mutant, alien, fantasy, mechanical, or Cthulhu-like concepts remain graphic and low-detail rather than realistic creature concept art.

### NPC
Use the same creature, face, contour, color, and detail grammar as playable characters. Identity comes from a clear silhouette, clothing mass, equipment, or one memorable prop.

### Effect / VFX
Prefer simple circles, blobs, arcs, bursts, rings, impact shapes, flames, clouds, trails, and controlled particles. Effects should be readable before spectacular.

### UI / Cursor
Use simplified geometry and the same optical weight as the game art. UI may be slightly cleaner where required, but should remain visually compatible.

### Environment
Use simple gameplay-readable shapes and limited decoration. Environment supports gameplay readability rather than becoming a polished illustration.

## Composition

Character: compact character-icon framing by default. Keep the face and primary identity feature large enough to survive reduction.

Weapon: single object, dynamic but readable orientation, compact composition, transparent background.

Item: one central object/symbol, compact silhouette, minimal empty space, transparent background.

Enemy: single readable enemy, clear pose, strong silhouette, transparent background.

Effect: one readable effect state, clear center, controlled particles, transparent background.

Do not add cinematic backgrounds or environmental storytelling unless explicitly requested.

## Thumbnail Test

Treat 64×64 as a readability test, not necessarily the source resolution. For character icons, also test approximately 48×48 and 32×32 when practical.

At small size, the viewer should still identify:

- potato-creature mass
- face
- primary identity feature
- major color grouping
- main functional feature if present

If the test fails:

```text
simplify
→ strengthen contour
→ simplify face
→ enlarge identity feature
→ improve color separation
→ remove decoration
```

Never add detail to solve a readability failure.

## Detail Budget

Default detail density: LOW.

For characters, use an especially low detail ceiling. Keep a detail only if it communicates identity/function, strengthens silhouette, improves gameplay readability, or distinguishes the asset from another asset.

## Theme Translation

Mod themes must be translated into Brotato's visual language rather than replacing it.

Cosmic: simple stars, circular cosmic symbols, dark accents, compact celestial shapes.

Ancient magic: simple rune symbols, one strong accent, thick contour, simplified mystical prop.

Cyberpunk: one or two bright accents, compact geometric equipment, simplified neon-like color blocks.

Cthulhu: chunky organic tentacles, one strange facial feature, limited dark/accent palette, no realistic horror texture.

Frankenstein-inspired: asymmetrical face/body marks, one crude mechanical/electrical motif, compact potato creature; never a realistic human Frankenstein costume.

## Anti-Generic-Vector Rule

If the result looks like a Figma illustration, corporate mascot, polished SVG character, modern mobile-game marketing asset, or generic sticker pack, it has failed.

Correct by reducing geometric perfection, simplifying the face, strengthening the black contour, reducing color count, removing decoration, and simplifying shading.

## Anti-Human-Character Rule

If a character looks like a miniature human wearing potato-colored clothing, it has failed.

Correct by:

1. removing human anatomy
2. collapsing torso/waist/hips into one potato mass
3. shortening or hiding limbs
4. simplifying hands and feet
5. redesigning the face as graphic marks
6. making the potato contour carry the character

## Anti-AI-Noise Rule

Avoid random micro-details, inconsistent contour weights, meaningless decorative shapes, unnecessary highlights, random particles, excessive symmetry, unexplained texture, and over-rendering.

Every surviving detail should have a design reason.

## Anti-Pixel-Art Rule

Brotato is not pixel art. Unless explicitly requested, do not use pixel dithering, deliberate pixel staircases, pixel-block construction, or retro pixel palettes.

## Animation and Sprite Sheets

Treat frames as one continuous sequence, not independent illustrations.

Preserve exact identity, palette, lighting direction, outline weight, camera, scale, pivot, framing, and relevant background pixels.

Adjacent frames should differ through small incremental changes. Do not independently redraw each frame.

## Prompt Construction

Build final prompts in this order.

### Character

1. character concept
2. shared potato-creature foundation
3. face composition
4. primary identity feature
5. expression
6. optional secondary features
7. subtle body variation when useful
8. optional equipment
9. palette
10. outline
11. flat shading
12. icon framing/readability
13. relevant negative constraints

### Other Assets

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

Put concrete subject information before generic style adjectives.

## Universal Prompt

> Create a clean 2D game-ready asset using the visual grammar of Brotato. [SUBJECT]. Build the design from a strong compact organic silhouette, chunky rounded shapes, exaggerated but readable proportions, and a bold black outer contour with controlled hand-drawn irregularity. Use a limited flat-color palette, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Prioritize silhouette, function, identity, and small-size readability over detail. The asset must feel like a real in-game indie game sprite rather than a modern vector mascot, promotional illustration, concept-art sheet, anime character, or 3D render. Transparent background unless otherwise requested. Keep the design recognizable at 64x64. Remove unnecessary detail.

## Character Prompt

> Create a single Brotato-style playable character based on **[CHARACTER CONCEPT]**. Design it as a compact pale ivory/off-white potato-like creature, not a human and not a potato costume. Keep the base creature simple and roster-consistent. Define the character primarily through **[FACE IDENTITY]**, **[PRIMARY IDENTITY FEATURE]**, and **[EXPRESSION]**. Add only **[0–3 SECONDARY FEATURES]** when they materially strengthen identity. Use **[SUBTLE BODY VARIATION]** only if it helps the concept; do not radically transform the body by default. If explicitly required, include **[OPTIONAL EQUIPMENT]** as a simple graphic element rather than detailed equipment design. Keep the body compact, facial marks tiny but expressive, limbs short or minimally visible, and anatomy non-human. Use **[PALETTE]** as broad flat color masses, a heavy black organic outer contour, sparse internal lines, one small hard-edged shadow block, and minimal highlights. Mostly frontal compact character-icon composition, transparent background, highly readable at 96x96, 64x64, and approximately 48x48. The result must look like one member of the actual Brotato character roster: bizarre but simple, expressive through a few graphic shapes, coherent with the shared creature species, and immediately readable at small size. No detailed costume, realistic anatomy, cinematic pose, concept-art rendering, or polished mascot treatment.

## Negative Prompt Base

`photorealistic, realistic anatomy, human in potato costume, humanoid character, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

Use only relevant negative terms. Do not add contradictory constraints.

## Reference Image Handling

When a reference image is supplied:

1. Preserve subject identity and requested composition.
2. Extract visual grammar rather than incidental noise.
3. Match silhouette, contour weight, palette, shading complexity, and detail density.
4. For characters, preserve the potato-creature foundation and facial grammar unless the user explicitly requests a different base form.
5. Preserve transparency/game-sprite behavior when appropriate.
6. If editing, modify only requested elements and preserve all other established properties.

Never invent a second visual system absent from the reference.

## Quality Gate

### Character
- Reads immediately as a compact potato creature.
- Body contour is deliberate, but extreme body mutation is not mandatory.
- Face uses very few intentional marks.
- One primary identity feature is obvious.
- Accessories remain secondary.
- Works at approximately 48–64 px.
- Looks like a member of the actual roster rather than an RPG character or mascot.

### Silhouette
- Shared creature mass is obvious.
- Primary external feature is immediately visible.
- Important appendages/equipment are readable when present.

### Face
- Eyes and mouth remain simple.
- Expression survives reduction.
- No realistic facial anatomy.

### Outline
- Outer contour clearly bold.
- Heavier than internal marks.
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

## Failure and Correction Matrix

Too generic/vector-like → reduce geometric perfection, simplify the face, strengthen black contour, reduce color count, remove decoration.

Too much like a human → collapse torso/hips into one creature mass, shorten limbs, remove anatomy, simplify face.

Too much like a fantasy RPG character → remove costume layers, weapons, armor, and cinematic pose; return to compact icon grammar.

Too much like a mascot → remove polished symmetry, simplify expression, reduce accessory count, restore chunky organic mass.

Too much like a generic potato → strengthen the face, add one dominant identity feature, change expression, and use a subtle body variation only if necessary.

Too detailed → remove micro-detail before changing the silhouette.

Too flat → add one hard-edged shadow block, not a gradient.

Too realistic → remove texture, material rendering, anatomy, and cinematic lighting.

Too pixel-art-like → use clean raster/vector-like shapes without deliberate pixel construction.

Character loses identity at small size → enlarge the face/primary identity feature, simplify secondary features, increase silhouette separation.

Character looks like "same potato, different hat" → change the facial composition and expression first, then adjust body proportion or add one secondary identity feature. Do not solve it by adding more accessories.

## Final Rule

The strongest Brotato asset is not the most detailed asset. It is the asset that communicates identity with the fewest visual decisions.

For characters specifically:

> Shared potato creature + distinctive face + one strong identity feature + restrained variation + flat graphic rendering.

If the result cannot survive simplification, it is not finished.
