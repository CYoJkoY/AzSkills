# Brotato Art Direction v4 — Prompt Templates

These are construction patterns, not keyword dumps. Load `SKILL.md` first and use the smallest relevant template. Character prompts follow the official roster grammar: potato-creature mass first, face second, one dominant identity feature third, accessories last.

## Universal Asset

> Create a clean 2D game-ready asset using the visual grammar of Brotato. [SUBJECT]. Build the design from a strong compact organic silhouette, chunky rounded shapes, exaggerated but readable proportions, and a bold black outer contour with controlled hand-drawn irregularity. Use a limited flat-color palette, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Prioritize silhouette, function, identity, and small-size readability over detail. The asset must feel like a real in-game indie game sprite rather than a modern vector mascot, promotional illustration, concept-art sheet, anime character, or 3D render. Transparent background unless otherwise requested. Keep the design recognizable at 64x64. Remove unnecessary detail.

## Character — Official Roster Template

Use this as the default character template. Do not start from a human character, and do not start from a generic oval potato with a costume.

> Create a single Brotato-style playable character based on **[CHARACTER CONCEPT]**. Design it first as a compact pale potato-like creature, not a human and not a potato costume. Give the underlying potato mass a deliberate shape: **[BODY CONTOUR / PROPORTION]**. Build the face as a primary identity element: **[EYE COMPOSITION]**, **[MOUTH / EXPRESSION]**. Add one dominant graphic identity feature: **[ONE FEATURE]**. If needed, add only **[OPTIONAL SECONDARY FEATURE]**. Keep the character extremely compact, with a large body mass, tiny/simple facial marks, short or minimally visible limbs, and no realistic anatomy. Use **[PALETTE]** as broad flat color regions, a heavy black organic outer contour, sparse internal lines, and minimal hard-edged cartoon shading. The result must look like one member of the official Brotato character roster: bizarre but simple, expressive through a few graphic shapes, highly readable as a tiny game character, and visually coherent with a row of small character icons. Transparent background unless otherwise requested. Readable at 48–64 px. No detailed costume, no realistic human anatomy, no cinematic pose, no concept-art rendering.

## Character — Portrait / Selection Icon

Use this when the user asks for a character portrait, selection icon, character card image, or does not specify a full gameplay sprite.

> Create a compact Brotato-style character icon of **[CHARACTER]**. Show one pale potato-like creature occupying most of the frame. The body/head mass is deliberately shaped as **[BODY SHAPE]**, not a perfect oval. Give it a simple but highly distinctive face: **[EYES]**, **[MOUTH / EXPRESSION]**. Add **[DOMINANT IDENTITY FEATURE]** as one large graphic shape attached to or integrated with the potato mass. Add at most **[0–1 SECONDARY FEATURE]**. Keep the design front-facing or only slightly directional, with no human neck, torso, waist, long limbs, or realistic anatomy. Use a restrained palette of **[PALETTE]**, broad flat color fills, a heavy black hand-drawn outer contour, sparse internal lines, and minimal hard-edged shading. Make it read immediately as one member of the Brotato character roster at approximately 48–64 px. Transparent background unless otherwise requested.

## Character — Gameplay Sprite

Use this when a true in-game full-body character sprite is explicitly requested.

> Create **[CHARACTER]** as a Brotato-style compact gameplay character. Preserve the official roster's potato-creature grammar: a large simple pale body mass, tiny/simple face, short chunky limbs, and one dominant identity feature. Body shape: **[BODY SHAPE]**. Face: **[FACE COMPOSITION]**. Dominant feature: **[FEATURE]**. Pose: **[COMPACT POSE]**. Equipment: **[PRIMARY EQUIPMENT]**, integrated as a simple silhouette mass rather than detailed gear. Use **[PALETTE]**, bold black organic contour, sparse internal lines, and minimal hard-edged cartoon shadows. Avoid humanoid torso construction, long legs, realistic hands, detailed clothing, cinematic perspective, or concept-art posing. Full body visible, transparent background, 64x64-readable.

## Character — Concept-to-Prompt Checklist

Resolve these fields before writing the final prompt:

```text
CHARACTER CONCEPT: what the character is
POTATO BODY MASS: the underlying creature form
BODY CONTOUR: how the mass differs from a generic oval
FACE COMPOSITION: eye placement + mouth/expression
DOMINANT IDENTITY FEATURE: one large readable feature
SECONDARY FEATURE: optional, only if necessary
ATTITUDE / POSE: compact visual attitude
PALETTE: pale body + 1–2 accent masses + black contour
PRESENTATION: portrait icon or gameplay sprite
```

Never leave the body mass and face completely implicit for an original character.

## Character — Silhouette-Only Test

> Design **[CHARACTER]** first as a single readable black silhouette. The underlying potato creature must have a deliberate body contour: **[BODY CONTOUR]**. Use **[DOMINANT IDENTITY FEATURE]** as the strongest contour feature. Keep the face and accessories absent at this stage. The silhouette must already look like a distinct compact game creature rather than a human or generic oval mascot. Then convert the silhouette into a clean Brotato-style character using a pale flat body fill, tiny graphic facial marks, bold black contour, minimal color accents, and sparse hard-edged shading. Readable at 48–64 px.

## Character — Face-First Test

Use this when generated characters look too similar despite different accessories.

> Design **[CHARACTER]** as a simple Brotato-style potato creature whose identity is carried primarily by facial composition. Use **[EYE ARRANGEMENT]**, **[MOUTH / EXPRESSION]**, and **[FACIAL FEATURE]**. Keep the body compact and organic with **[BODY CONTOUR]**. Add only one supporting identity feature: **[FEATURE]**. Use a heavy black contour, pale flat body color, minimal accent colors, sparse internal lines, and almost no shading. The face must remain recognizable at approximately 48–64 px. Do not use detailed human or anime facial anatomy.

## Character — Roster Variation

> Create **[CHARACTER]** as one member of a coherent Brotato character roster. Preserve the shared potato-creature species, pale body foundation, heavy black contour, simple facial grammar, flat color philosophy, and low detail. Deliberately vary the character's **body contour: [BODY SHAPE]**, **face composition: [FACE]**, and **dominant identity feature: [FEATURE]** so it cannot be mistaken for another roster member with a different hat. Add only **[OPTIONAL SECONDARY FEATURE]**. Keep the character compact and icon-readable at 48–64 px. Accessories are secondary and must never carry the entire identity.

## Character — Theme Translation

> Translate **[THEME / CHARACTER CONCEPT]** into a Brotato-style potato creature rather than a human fantasy character. Use a deliberately shaped potato mass **[BODY SHAPE]**, a distinctive simple face **[FACE]**, and one dominant graphic feature **[FEATURE]**. Express the theme through large readable shapes and restrained color accents, not realistic costume construction. Pale/off-white body, heavy black organic contour, flat colors, sparse internal lines, minimal hard-edged shading, compact icon-like framing, 48–64 px readability.

## Character — Reference Redesign

> Preserve the supplied character's identity, potato-creature mass, face composition, dominant identity feature, palette hierarchy, and overall composition. Rebuild it using the established Brotato character grammar: compact pale organic body mass, extremely simple facial marks, heavy black outer contour, limited flat colors, sparse internal lines, minimal hard-edged shading, and strong icon-level readability. **Modify only [REQUESTED CHANGE].** Do not replace the character with a generic oval potato, human character, or detailed fantasy costume. Do not add unrelated accessories. Transparent background unless otherwise requested.

## Character — Anti-Generic Addendum

Append this when the generator repeatedly produces generic potato mascots:

> The potato body itself must be deliberately designed. Do not use a perfect symmetrical oval as the universal base. Make the body contour, eye composition, and one dominant identity feature unique before adding accessories. The character must still look distinctive after the hat, clothing, weapon, and props are removed. Keep the design as a compact game icon, not a full-body RPG character.

## Character Negative Prompt

`human in potato costume, humanoid potato, human torso, neck, waist, hips, long legs, long arms, realistic anatomy, realistic hands, detailed fingers, realistic feet, anime face, anime eyes, large irises, eyelashes, realistic pupils, detailed nose, realistic lips, detailed teeth, Pixar character, Disney character, corporate mascot, polished mascot, sticker pack, perfect oval potato, identical potato body, same-body-different-hat, full RPG character, character turnaround, character sheet, fashion design, detailed costume, realistic armor, realistic clothing folds, belts, pouches, straps, buckles, excessive accessories, excessive machinery, concept art, cinematic lighting, 3D render, PBR, gradients, airbrush, painterly shading, realistic texture, fabric texture, skin texture, volumetric lighting, rim light, excessive highlights, excessive particles, busy background`

## Weapon

> [WEAPON]. Immediately recognizable chunky weapon profile, [ORIENTATION], [MAJOR FUNCTIONAL COMPONENTS]. Use a limited flat palette, bold black outer contour, simple organic/rounded construction, sparse internal structure, one or two hard-edged cartoon shadow blocks, minimal material detail, strong thumbnail readability, 2D game-ready weapon sprite, transparent background. Prefer the most recognizable angle rather than forcing a front view.

## Item / Relic

> [ITEM OR RELIC]. One dominant central object or symbol, compact readable silhouette, slightly organic orientation, bold black outer contour, limited flat colors, sparse internal lines, one or two hard-edged shadow blocks, minimal highlight, no decorative micro-detail, instantly recognizable at thumbnail size, 2D game-ready item icon, transparent background.

## Legendary Item

> [LEGENDARY ITEM]. One unusually distinctive silhouette or central visual motif, stronger but restrained accent color, bold black outer contour, limited flat palette, minimal hard-edged shading, low detail, high visual mass and instant recognition at small size. Legendary identity comes from silhouette, motif, and visual hierarchy—not micro-detail. Transparent background.

## Enemy / Boss

> [ENEMY]. Exaggerated compact organic body, strong instantly recognizable silhouette, [ONE OR TWO DEFINING FEATURES], minimal face if applicable, chunky appendages, bold black outer contour, limited flat colors, sparse internal lines, restrained hard-edged cartoon shadows, low detail, high gameplay readability, transparent background. Keep mutant, alien, fantasy, mechanical, or Cthulhu-like concepts graphic and stylized rather than realistic body horror or creature concept art.

## NPC

> [NPC CONCEPT]. Use the same compact rounded character grammar as the playable roster, but give the NPC a distinct body silhouette, one memorable identity feature, and a readable prop or clothing mass. Extremely simple face, bold black outer contour, limited flat palette, sparse internal lines, minimal hard-edged shading, low detail, transparent background, game-ready 2D sprite.

## Effect / VFX

> [EFFECT], [MOTION OR STATE]. Clear graphic silhouette using simple circles, blobs, arcs, bursts, rings, impact shapes, flames, clouds, or controlled particles. Limited high-contrast flat colors, minimal hard-edged shading, controlled black contour where appropriate, strong gameplay readability, transparent background. No particle spam, cinematic smoke, realistic fire, volumetric rendering, or excessive glow.

## UI / Cursor

> [UI ELEMENT]. Compact highly readable game-interface asset using simplified rounded geometry and the same optical weight as Brotato game art. Bold black contour where appropriate, limited flat colors, minimal shading, strong contrast, instant recognition at native UI size, testable at 32x32 where practical, transparent background.

## Animation / Sprite Sheet

> Continuous 2D game animation of [SUBJECT], [GRID], [FRAME COUNT]. Preserve exact identity, silhouette, palette, outline weight, camera, scale, pivot, framing, and relevant background pixels across all frames. Animate only [PROPERTY] with small incremental changes between adjacent frames. No independent redraws. [LOOP REQUIREMENT]. Maintain consistent Brotato visual language and 64x64 readability.

## Reference Redraw

> Preserve the supplied reference's subject identity, major silhouette, composition, palette relationships, outline hierarchy, and visual detail density. Re-render it using the established Brotato Art Direction system: organic chunky shapes, bold black outer contour, limited flat colors, sparse internal lines, restrained hard-edged cartoon shadows, minimal detail, strong thumbnail readability. Modify only [REQUESTED CHANGE]. Preserve all unspecified properties. Transparent background unless otherwise specified.

## Theme Translation — Non-Character Assets

> [ASSET] using the established Brotato Art Direction system, translated into [THEME]. Express the theme through silhouette, one or two memorable props/symbols, restrained accent colors, and simple graphic motifs. Do not replace the asset grammar with realistic [THEME-SPECIFIC MATERIALS/EFFECTS].

## Negative Prompt Base

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

## Template Rules

- For characters, start with potato-creature mass and face, not clothing or equipment.
- For unspecified character presentation, use portrait/selection-icon grammar.
- Define one dominant identity feature before adding secondary details.
- Never let clothing or accessories become the only source of character identity.
- Avoid human anatomy and full-body RPG construction unless explicitly required by the user.
- Keep character faces extremely simple.
- Use pale/off-white body colors by default for potato-like characters.
- Build from silhouette before detail.
- Treat 48–64 px as a practical character readability test.
- Use deliberate body and face variation for rosters.
- Use only constraints relevant to the task.
- Do not repeat style keywords excessively.
- Do not force weapons/items into a universal camera angle.
- For reference edits, explicitly lock unchanged properties and identify the requested delta.
- For animations, explicitly lock identity, camera, palette, scale, pivot, and frame continuity.
- If the output looks too polished or too human, simplify and collapse it back into the potato-creature grammar.
