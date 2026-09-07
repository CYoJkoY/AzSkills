---
name: brotato-art
description: Brotato Art Direction Skill v4. Generate and refine 2D game assets using the visual grammar of Brotato's actual in-game roster and asset system. Covers characters, weapons, items, relics, enemies, NPCs, effects, UI, cursors, and sprite animations. Character tasks use an official-roster-inspired portrait-first grammar: pale potato-creature masses, simple facial composition, bold black contours, one dominant identity feature, flat colors, minimal shading, and strict small-size readability.
---

# Brotato Art Direction v4

## Mission

Use this skill for Brotato-style or Brotato-inspired 2D game assets. The target is not generic "thick black outline + flat colors". The target is an asset that could naturally coexist with Brotato's actual in-game visual system.

For characters, prioritize the visual grammar visible across the official character roster: compact pale potato-creature masses, highly compressed facial design, strong but simple identity features, bold black contours, flat color regions, and tiny-icon readability. The official roster contains many different character identities, but they remain members of the same graphic species.

Think:

> If this asset had shipped as a native in-game Brotato asset, how would it have been constructed?

Do not turn the target into a modern mascot, polished vector illustration, mobile-game promotional art, anime, fantasy RPG character sheet, concept art, or 3D render.

## Absolute Priority

When requirements conflict:

1. Explicit user requirements.
2. Brotato visual language.
3. Character/asset silhouette and identity.
4. Small-size game readability.
5. Bold black outer contour.
6. Simple organic proportions.
7. Limited flat color blocks.
8. Sparse internal structure.
9. Minimal cartoon shading.
10. Decorative details.

If a lower-priority detail damages a higher-priority rule, delete it.

## Core Visual DNA

The visual language is defined by deliberate compression:

- compact chunky organic forms
- short or compressed proportions
- pale/neutral potato-like creature bases where appropriate
- bold black outer contours
- extremely simple faces
- limited color palettes
- flat or near-flat color regions
- small hard-edged shadow blocks
- sparse internal lines
- controlled asymmetry
- strong thumbnail readability
- obvious game-sprite construction

The hand-drawn feeling comes from shape language, proportion, and controlled contour imperfection—not sketch noise, brush texture, random jitter, or scribbles.

## Silhouette-First Construction

Every asset follows:

```text
Identity
→ silhouette
→ major color mass
→ defining feature
→ functional structure
→ minimal shading
→ simplification
→ thumbnail test
```

For characters, use the dedicated character grammar rather than treating clothing/equipment as the starting point.

Start from the black silhouette. If the subject is not recognizable as a silhouette, redesign the silhouette instead of adding detail.

## Character Grammar — Official Roster Mode

Character tasks use `character.md` as a specialized rule set.

The default character construction is:

```text
potato creature mass
→ face composition
→ body/contour variation
→ one dominant identity feature
→ optional secondary feature
→ restrained color
```

Do not default to:

```text
human character
→ potato skin
→ costume
```

or:

```text
generic oval potato
→ hat
→ job equipment
```

### Character Presentation

When the user asks for a character without specifying a full gameplay pose, prefer the visual language of the official character selection portraits:

- one compact potato creature
- pale/off-white body
- bold black contour
- face clearly visible
- front-facing or slightly directional orientation
- one or a few large identity features
- compact framing
- no environment
- no cinematic perspective

Do not automatically generate a full-body RPG character sheet.

### Character Body

The potato mass is the character, not a fixed oval template.

Allow deliberate variation:

- round
- tall
- wide
- flattened
- lopsided
- swollen
- tapered
- pointed
- compressed
- irregularly bulged
- tilted

Keep the result as a simple organic potato creature rather than realistic monster or human anatomy.

### Character Face

The face is a primary identity layer.

Prefer:

- small black eyes
- simple eyelids/brows
- tiny mouth
- small teeth/fangs only when identity requires them
- one obscured or altered eye when useful
- asymmetric placement when purposeful

Avoid detailed facial anatomy, anime eyes, realistic pupils, eyelashes, realistic noses, realistic lips, or 3D facial modeling.

### Character Identity Feature

Every original character should have one dominant graphic identity feature. It may be the body contour, face, hair/beard-like mass, hat, goggles, mask, horn, ear, mechanical block, tentacle-like extension, or another simple motif.

Do not use many small accessories to compensate for weak character design.

### Character Limbs

Portrait characters may have no visible limbs or only minimal indications. Gameplay sprites can show short chunky limbs.

Never force human arms, legs, joints, hands, or feet into the design.

### Character Color

Default potato-like characters should favor off-white, ivory, cream, or pale neutral bodies. Use one dominant accent and at most a small secondary accent unless the concept explicitly requires another body material.

### Character Shading

Use little or no shading. Prefer a flat body fill with one small hard-edged shadow region and a heavy black contour.

## Non-Character Shape Language

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

## Outline System

Use a strong black outer contour: `#000000`.

The outer contour must be visibly heavier than internal marks and feel rounded, organic, clean, and slightly hand-drawn.

A starting range of approximately 1/45–1/25 of the canvas short edge may be used as a perceived-weight guideline, not a literal requirement. Smaller assets may need heavier contours; complex assets may need slightly lighter contours.

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

For character portraits, reduce this further when necessary. No shading is often better than over-rendering.

Avoid airbrush, soft gradients, PBR, realistic reflections, rim lighting, volumetric lighting, cinematic illumination, and painterly rendering.

## Materials

Represent materials through color, silhouette, and simple structural blocks.

Do not add realistic metal reflections, leather grain, wood grain, fabric texture, skin texture, scratches, surface noise, or micro-material detail.

## Asset Modules

### Character
Load `character.md`. Priorities: potato-creature mass → face composition → body/contour variation → dominant identity feature → optional secondary feature → restrained palette → minimal shading. For unspecified character presentation, prefer official-roster portrait grammar rather than full-body RPG composition.

### Weapon
Priorities: recognizable weapon profile → orientation → major functional components → limited palette → minimal material separation. Use the most recognizable angle rather than forcing every weapon into front view.

### Item / Relic
Use one dominant object or symbol. Keep the icon compact and understandable without text. Legendary items may have unusual silhouettes or stronger accents, but “legendary” does not mean “more micro-detail”.

### Enemy / Boss
Use exaggerated silhouettes and one or two defining features. Mutant, alien, fantasy, mechanical, or Cthulhu-like concepts remain chunky, graphic, and low-detail rather than realistic creature concept art.

### NPC
Use the same body, face, outline, color, and detail grammar as playable characters. Identity comes from silhouette, clothing, equipment, or one memorable prop.

### Effect / VFX
Prefer simple circles, blobs, arcs, bursts, rings, impact shapes, flames, clouds, trails, and controlled particles. Effects should be readable before spectacular.

### UI / Cursor
Use the same simplified geometry and outline language. UI may be slightly cleaner/geometric where necessary, but must retain optical consistency.

### Environment
Use simple gameplay-readable shapes and limited decoration. Environment supports gameplay readability rather than becoming a polished illustration.

## Composition

Character: default to compact character-icon framing unless full-body gameplay sprite is explicitly requested. Keep the face and dominant identity feature large enough to survive reduction.

Weapon: single object, dynamic but readable orientation, compact composition, transparent background.

Item: one central object/symbol, compact silhouette, minimal empty space, transparent background.

Enemy: single readable enemy, clear pose, strong silhouette, transparent background.

Effect: one readable effect state, clear center, controlled particles, transparent background.

Do not add cinematic backgrounds or environmental storytelling unless explicitly requested.

## 64×64 / Thumbnail Test

Treat 64×64 as a readability test, not necessarily the source resolution. For characters, also test approximately 48×48 when practical because the official character selection presentation is icon-like.

At small size, the viewer should still identify:

- potato-creature mass
- face
- dominant identity feature
- major color grouping
- main functional feature if present

If the test fails:

```text
simplify
→ strengthen body contour
→ simplify face
→ enlarge defining feature
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

If the result looks like a Figma illustration, corporate mascot, polished SVG character, modern mobile-game asset, marketing illustration, or generic sticker pack, it has failed.

Correct by reducing geometric perfection, increasing controlled organic asymmetry, simplifying the face, strengthening the black contour, reducing color count, removing decoration, and simplifying shading.

## Anti-Human-Character Rule

If a character looks like a miniature human wearing potato-colored clothing, it has failed.

Correct by:

1. removing human anatomy
2. collapsing torso/waist/hips into one potato mass
3. shortening or hiding limbs
4. simplifying hands and feet
5. redesigning the face as graphic marks
6. making the potato contour carry identity

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

Build final prompts in this order:

### Character

1. character concept
2. potato-creature mass
3. body contour/proportion variation
4. face composition
5. one dominant identity feature
6. optional secondary feature
7. compact attitude/pose
8. palette
9. outline
10. flat shading
11. framing/readability
12. relevant negative constraints

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

> Create a single Brotato-style playable character based on **[CHARACTER CONCEPT]**. Design it first as a compact pale potato-like creature, not a human and not a potato costume. Give the underlying potato mass a deliberate shape: **[BODY CONTOUR / PROPORTION]**. Build the face as a primary identity element: **[EYE COMPOSITION]**, **[MOUTH / EXPRESSION]**. Add one dominant graphic identity feature: **[ONE FEATURE]**. If needed, add only **[OPTIONAL SECONDARY FEATURE]**. Keep the character extremely compact, with a large body mass, tiny/simple facial marks, short or minimally visible limbs, and no realistic anatomy. Use **[PALETTE]** as broad flat color regions, a heavy black organic outer contour, sparse internal lines, and minimal hard-edged cartoon shading. The result must look like one member of the official Brotato character roster: bizarre but simple, expressive through a few graphic shapes, highly readable as a tiny game character, and visually coherent with a row of small character icons. Transparent background unless otherwise requested. Readable at 48–64 px. No detailed costume, no realistic human anatomy, no cinematic pose, no concept-art rendering.

## Negative Prompt Base

`photorealistic, realistic anatomy, human in potato costume, humanoid character, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

Use only relevant negative terms. Do not add contradictory constraints.

## Reference Image Handling

When a reference image is supplied:

1. Preserve subject identity and requested composition.
2. Extract visual grammar rather than incidental noise.
3. Match silhouette, contour weight, palette, shading complexity, and detail density.
4. For characters, preserve the potato-creature mass and face grammar unless the user explicitly requests a different base form.
5. Preserve transparency/game-sprite behavior when appropriate.
6. If editing, modify only requested elements and preserve all other established properties.

Never invent a second visual system absent from the reference.

## Quality Gate

### Character
- Reads immediately as a compact potato creature.
- Body contour is deliberate, not a generic perfect oval.
- Face uses very few intentional marks.
- One dominant identity feature is obvious.
- Accessories are secondary.
- Works at approximately 48–64 px.
- Looks like a member of the official roster rather than an RPG character or mascot.

### Silhouette
- Recognizable as a black silhouette.
- Primary shape immediately obvious.
- Important appendages/equipment visible.

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

Too generic/vector-like → reduce geometric perfection, add controlled organic asymmetry, strengthen black contour, simplify color blocks.

Too polished → remove detail, gradients, reflections, and decoration; return to silhouette + flat fills + simple shadows.

Too anime → simplify eyes/facial anatomy and restore chunky proportions.

Too realistic → flatten materials/lighting and remove texture.

Too human → collapse torso/waist/hips into one potato mass, shorten limbs, simplify face, remove costume construction.

Too generic potato → redesign body contour and facial composition before adding accessories.

Same potato, different hat → vary body mass, face composition, dominant identity feature, and contour first.

Outline too thin → increase perceived outer-contour weight and remove unnecessary internal lines.

Too detailed → remove 20–40% of nonessential detail.

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

Character consistency specifically means a shared potato-creature species and graphic grammar while deliberately varying body contour, face composition, and identity features.

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
- for characters, define potato mass and face before clothing/equipment
- use high-signal style constraints
- keep prompts task-specific
- do not expose hidden reasoning
- do not claim pixel-perfect reproduction of copyrighted source artwork
- preserve consistency across related assets

## Final Rule

When uncertain: simplify.

If uncertain about a character: redesign the potato mass and face before adding accessories.

If the result looks like a human, collapse it back into a potato creature.

If the result looks too polished: simplify again.

The target is a simple, expressive, immediately readable 2D game asset that naturally belongs inside the Brotato visual ecosystem.
