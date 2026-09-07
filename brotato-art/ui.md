# UI Module

Use this module for HUD icons, buttons, status icons, inventory elements, stat symbols, cursors, indicators, and other interface graphics.

## UI Principle

UI assets share the same simplified cartoon vocabulary as the game world, but may use cleaner geometry when precision improves interface clarity.

## Construction Order

1. Define the semantic function.
2. Build the smallest recognizable silhouette.
3. Establish icon hierarchy.
4. Apply a limited palette.
5. Add the minimum necessary contour or separator.
6. Validate at the actual UI display size.

## Icon Rules

Avoid relying on text for recognition. Use a central symbol with strong contrast and a small number of supporting shapes. Maintain consistent optical scale, outline weight, corner treatment, and padding across an icon family.

## Cursor Rules

For cursor families, preserve a common visual language and hotspot logic. Individual cursor types should differ through silhouette and function, not through unrelated rendering styles.

## Prompt Skeleton

> [UI element], compact highly readable game interface icon, simplified rounded geometry, bold black contour where appropriate, clean flat colors, minimal shading, consistent visual weight, strong contrast, transparent background, readable at native UI size, 2D indie game interface asset.
