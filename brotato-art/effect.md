# Effect Module

Use this module for attack effects, impacts, explosions, magic, particles, status effects, trails, rings, bursts, projectiles, and environmental visual feedback.

## Graphic Language

Effects should be designed as simple, readable graphic masses: arcs, circles, rings, bursts, clouds, flames, shards, droplets, sparks, trails, and chunky particles. Use bold contours when the effect benefits from the shared style; outline-free luminous shapes are acceptable when required for readability.

## Priority

1. Communicate the gameplay event.
2. Establish a clear outer shape.
3. Use a limited color palette.
4. Add only a few supporting particles.
5. Keep the effect legible at gameplay scale.

## Animation

For animated effects, change position, scale, rotation, opacity, deformation, particle state, or shape incrementally. Adjacent frames must represent a continuous physical or graphic transition rather than unrelated redraws.

## Forbidden Rendering

Avoid realistic volumetric smoke, photorealistic fire, cinematic bloom, complex fluid simulation appearance, painterly particles, and high-frequency noise.

## Prompt Skeleton

> [Effect], bold readable graphic silhouette, [motion/state], simplified 2D cartoon effect, clean saturated color blocks, chunky particles, minimal hard-edged shading, controlled black contour where appropriate, clear gameplay readability, transparent background, game-ready sprite effect.
