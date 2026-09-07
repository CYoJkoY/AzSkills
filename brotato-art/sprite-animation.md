# Sprite Animation Module

Use this module for sprite sheets, looping animations, attack animations, idle motion, recoil, projectile motion, hit reactions, cursor animations, and frame-by-frame game assets.

## Core Rule

Animation frames are a continuous temporal sequence. Never treat every frame as a fresh independent illustration.

## Fixed Properties

Unless intentionally animated, keep these identical across frames:

- character or object identity
- camera and framing
- cell size
- scale
- pivot/hotspot
- palette
- outline language
- lighting direction
- background/transparency behavior

## Animated Properties

Only modify the requested motion variables, such as:

- position
- rotation
- scale
- squash/stretch
- limb or appendage pose
- facial expression
- particle state
- opacity
- deformation
- projectile trajectory

Changes between adjacent frames should be small and continuous.

## Looping

When a seamless loop is requested, make the final state transition naturally into the first state. If the user explicitly requires first and last frames to be identical, preserve that exact requirement.

## Sprite Sheet Layout

Respect the requested grid exactly. Use row-major order unless the user specifies another order. Keep every frame inside its cell and do not allow neighboring cells to overlap.

## Special Continuity Rule

For rotation, recoil, bouncing, wing motion, flowing sand, floating objects, or other cyclic motion, preserve physical state continuity. Do not reset the object arbitrarily between frames.

## Prompt Skeleton

> Continuous sprite animation of [subject], [grid and frame count], preserve exact character identity, silhouette, palette, outline weight, camera, and framing across all frames. Animate only [specified property] with small incremental changes between adjacent frames. [Loop requirement]. Clean 2D hand-drawn flat cartoon game-art rendering, transparent background.

## Failure Modes

If frames look like separate illustrations, reduce per-frame changes, lock camera and palette, and explicitly state temporal continuity. If the subject drifts in scale or position, establish a fixed pivot and reference pose before animating.
