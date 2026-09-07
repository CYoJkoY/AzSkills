# Brotato Art Direction v3 — Prompt Templates

These are construction patterns, not keyword dumps. Replace bracketed fields with concrete task information. Load `SKILL.md` first and use the smallest relevant template.

## Universal Asset

> Create a clean 2D game-ready asset using the visual grammar of Brotato. [SUBJECT]. Build the design from a strong compact organic silhouette, chunky rounded shapes, exaggerated but readable proportions, and a bold black outer contour with controlled hand-drawn irregularity. Use a limited flat-color palette, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Prioritize silhouette, function, identity, and small-size readability over detail. The asset must feel like a real in-game indie game sprite rather than a modern vector mascot, promotional illustration, concept-art sheet, anime character, or 3D render. Transparent background unless otherwise requested. Keep the design recognizable at 64x64. Remove unnecessary detail.

## Character — Identity-First Template

Do not use the old "generic potato + costume" construction. Resolve the character concept into a unique body silhouette before writing the style portion of the prompt.

> Create a single full-body 2D game character: **[CHARACTER CONCEPT]**. The character is a compact potato-like creature with a deliberately unique silhouette: **[BODY MUTATION]**. Its strongest visual hook is **[SILHOUETTE HOOK]**. Use an extremely simple face with **[EYE PLACEMENT / EXPRESSION]** and **[TINY MOUTH]**. Give the character a compact exaggerated pose: **[POSE LANGUAGE]**. Integrate **[SIGNATURE OBJECT / PRIMARY EQUIPMENT]** directly into the character silhouette so the concept is recognizable immediately. Add only **[0–3 SECONDARY MOTIFS]** when they reinforce identity. Use **[PALETTE]** as broad flat color masses. Render with a bold black organic outer contour, sparse internal lines, one or two hard-edged cartoon shadow blocks, and minimal highlights. Keep the body visually dominant, limbs short and simplified, hands and feet graphic, proportions chunky, and geometry slightly asymmetrical and organic. No realistic anatomy or detailed costume construction. Single character, full-body game-sprite framing, transparent background, highly readable at 64x64.

## Character — Concept-to-Prompt Checklist

Before producing a character prompt, resolve these fields:

```text
CHARACTER CONCEPT: what the character is
ARCHETYPE: the fastest visual category the player should perceive
BODY MUTATION: how this potato differs from the default body
SILHOUETTE HOOK: the one feature visible from far away
FACE ANCHOR: eye placement + tiny expression
POSE LANGUAGE: the character's characteristic physical attitude
SIGNATURE OBJECT: the main prop/equipment
SECONDARY MOTIFS: only identity-supporting details
PALETTE: 2–4 major color masses + black contour
```

Never leave all of these implicit for an original character. A concrete concept is more valuable than a long list of style adjectives.

## Character — Silhouette-Only Test Prompt

Use this when a generated character keeps becoming generic:

> Design **[CHARACTER]** first as a single readable black silhouette. Make the compact potato-like body itself distinctive through **[BODY MUTATION]**, with **[SILHOUETTE HOOK]** forming the dominant contour feature. Use short simplified limbs and an exaggerated compact pose **[POSE]**. The silhouette must identify the character concept before any clothing, color, facial detail, or texture is added. Then convert the silhouette into a clean 2D game sprite using bold black contour, limited flat color masses, sparse internal structure, and minimal hard-edged shading. Transparent background, 64x64-readable.

## Character — Roster Variation Template

Use this when generating multiple characters in one Mod. The shared style must remain stable while the body design changes deliberately.

> Create **[CHARACTER]** as one member of a consistent Brotato-style playable character roster. Preserve the shared compact game-sprite rendering grammar, but deliberately vary the underlying character silhouette: **[BODY MASS / LEAN / SHAPE]**. Give this character a distinct **[SILHOUETTE HOOK]**, **[FACE ANCHOR]**, and **[POSE LANGUAGE]** so it cannot be mistaken for another roster member with a different hat or accessory. Integrate **[SIGNATURE OBJECT]** into the silhouette. Use **[PALETTE]** as broad flat masses, bold black organic contour, sparse internal lines, and minimal hard-edged shading. Keep the same sprite scale, camera, outline weight, face simplicity, and shading grammar as the roster while varying body mass, silhouette, pose, prop scale, and color identity. Transparent background, full body, 64x64-readable.

## Character — Reference Redesign Template

> Preserve the supplied character's core identity, body mass, silhouette hook, face placement, pose language, signature object, palette hierarchy, and overall composition. Rebuild it using the established Brotato character grammar: compact potato-like creature, chunky simplified proportions, bold black organic outer contour, sparse internal lines, limited flat color masses, one or two hard-edged cartoon shadow blocks, minimal highlights, and strong thumbnail readability. **Modify only [REQUESTED CHANGE].** Do not replace the character with a generic oval potato, do not add unrelated accessories, and do not redesign unspecified properties. Transparent background unless otherwise requested. Maintain 64x64 readability.

## Character — Anti-Generic Prompt Addendum

Append this when the generator repeatedly produces generic potato mascots:

> The body itself must carry character identity. Do not use a perfectly symmetrical oval potato as a universal base. Avoid "same potato, different costume" construction. Introduce one deliberate body-mass variation, one strong silhouette hook, one compact pose language, and one signature object. Keep the face extremely simple. Character identity must survive after removing all micro-details.

## Character Negative Prompt

`generic potato mascot, identical oval potato body, same-body-different-hat, human miniature proportions, realistic human anatomy, long legs, narrow waist, heroic torso, realistic hands, detailed fingers, anime face, anime eyes, irises, eyelashes, detailed nose, realistic lips, detailed teeth, corporate mascot, polished vector character, glossy 3D character, concept art, character turnaround sheet, cinematic pose, realistic clothing folds, detailed armor construction, accessory overload, belts and pouches everywhere, wires everywhere, decorative clutter, texture, fabric grain, skin texture, gradients, airbrush shading, PBR, photorealistic lighting, rim light, volumetric lighting, excessive highlights, excessive particles, busy background`

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

## Theme Translation

Use this pattern when the asset belongs to a strong Mod theme:

> [ASSET] using the established Brotato Art Direction system, translated into [THEME]. Express the theme through silhouette, one or two memorable props/symbols, restrained accent colors, and simple graphic motifs. Do not replace the character/asset grammar with realistic [THEME-SPECIFIC MATERIALS/EFFECTS].

## Negative Prompt Base

`photorealistic, realistic anatomy, anime, manga, semi-realistic, 3D render, PBR, cinematic lighting, smooth gradients, painterly shading, airbrush, watercolor, oil painting, detailed texture, high-frequency detail, thin line art, hairline strokes, technical vector illustration, CAD-like geometry, cross hatching, sketch, concept art, realistic materials, photographic perspective, excessive highlights, excessive particles, busy composition, complex background`

## Template Rules

- Put concrete subject information before generic style adjectives.
- For characters, define body mutation and silhouette hook before accessories.
- Never let clothing or accessories become the only source of character identity.
- Use deliberate body variation when generating a roster.
- Keep face construction extremely simple.
- Build from silhouette before detail.
- Use only constraints relevant to the task.
- Do not repeat style keywords excessively.
- Do not force weapons/items into a universal camera angle.
- Do not use fixed color percentages as hard requirements.
- Treat 64x64 as a readability test, not necessarily the source resolution.
- For reference edits, explicitly lock unchanged properties and identify the requested delta.
- For animations, explicitly lock identity, camera, palette, scale, pivot, and frame continuity.
- If the output looks too polished, simplify instead of adding more style keywords.
