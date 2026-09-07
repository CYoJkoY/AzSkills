# Character Module

Use this module when generating, redesigning, or refining Brotato-inspired playable characters, NPCs, bosses, or character-like creatures.

## Character Construction Order

1. Establish the body silhouette.
2. Establish face placement.
3. Establish pose and direction.
4. Add the primary equipment or identity-defining object.
5. Add secondary accessories only when they improve recognition.
6. Apply palette and minimal shading.
7. Validate at thumbnail size.

## Body

The body should normally be compact, rounded, chunky, and visually dominant. For potato-like characters, prefer off-white, cream, ivory, or very light neutral body colors unless the concept explicitly requires another color. Never default to yellow merely because the subject is a potato.

Avoid realistic anatomy. Limbs, appendages, armor, clothing, and equipment should be simplified into readable shapes.

## Face

Use extremely simple facial construction. Small black dot/oval eyes and a tiny mouth are preferred. Expression should come from small positional or shape changes rather than detailed anatomy. The face must survive a 64x64 thumbnail.

## Equipment

Primary equipment should contribute to the silhouette. Avoid attaching a detailed object that disappears into the body. A weapon, hat, backpack, mechanical part, or magical object should have a clear outer profile and limited internal structure.

## Pose

Use a clear, exaggerated pose with a low visual center of gravity. Avoid realistic anatomical gestures that become unreadable at small size. Directional poses are allowed when the user needs movement, attack, dodge, recoil, or casting states.

## Character Consistency

For a character set, keep body scale, face scale, outline weight, palette logic, shading complexity, and camera framing consistent. Individual identity should come from silhouette, accessories, color grouping, and pose rather than changing the underlying rendering system.

## 64x64 Acceptance Test

At 64x64, the following should remain recognizable:

- body silhouette
- face
- primary equipment
- dominant color grouping
- one major identity-defining accessory

If a feature disappears, simplify or enlarge it rather than adding more detail.

## Prompt Skeleton

> [Character concept], compact rounded body, exaggerated readable proportions, simple face, [pose], [primary equipment], [secondary accessory if necessary], strong silhouette, bold black hand-drawn outer contour, clean flat saturated color blocks, one or two hard-edged cartoon shadow shapes, minimal highlights, low-detail high-readability 2D indie game sprite, readable at 64x64, transparent background.
