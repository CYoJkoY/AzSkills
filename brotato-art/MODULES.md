# Brotato Art Module Map

`SKILL.md` is the entry point. Load the smallest module that matches the requested asset, then combine modules only when the task spans multiple asset classes.

The character module is intentionally stricter than the generic asset grammar because Brotato characters use a highly compressed roster grammar: compact pale potato-creature masses, simple facial composition, one dominant identity feature, bold black contour, and icon-level readability.

| Module | Scope | Use when |
| :--- | :--- | :--- |
| `character.md` | Characters / NPCs | Designing or refining playable characters, NPCs, bosses, potato-like characters |
| `weapon.md` | Weapons | Designing melee, ranged, magic, sci-fi, or improvised weapons |
| `item.md` | Items / relics | Designing inventory icons, passive items, relics, collectibles |
| `enemy.md` | Enemies | Designing enemies, elites, bosses, mutants, aliens, monsters |
| `effect.md` | Effects | Designing attacks, impacts, particles, magic, explosions, trails |
| `ui.md` | UI | Designing HUD icons, buttons, cursors, status symbols, interface assets |
| `sprite-animation.md` | Animation | Designing sprite sheets, loops, frame sequences, motion states |
| `prompt-templates.md` | Prompt construction | Building final image-generation prompts for any supported asset |

## Loading Strategy

For a character request, load `SKILL.md` + `character.md` + `prompt-templates.md`.

For a character portrait, selection icon, or unspecified character presentation, use the `Character — Portrait / Selection Icon` template by default.

For a true full-body gameplay sprite, explicitly use the `Character — Gameplay Sprite` template. Do not assume every character request is a full-body RPG character.

For a character that repeatedly becomes generic, additionally use the `Character — Silhouette-Only Test` and `Character — Face-First Test` templates.

For a character roster, use `character.md` + `Character — Roster Variation` and deliberately vary body contour, face composition, dominant identity feature, and accent color while keeping the rendering grammar fixed.

For a character reference redraw, use `character.md` + `Character — Reference Redesign` and lock all unspecified identity properties.

For a weapon request, load `SKILL.md` + `weapon.md` + `prompt-templates.md`.

For an item request, load `SKILL.md` + `item.md` + `prompt-templates.md`.

For an enemy request, load `SKILL.md` + `enemy.md` + `prompt-templates.md`.

For an effect request, load `SKILL.md` + `effect.md` + `prompt-templates.md`.

For a UI request, load `SKILL.md` + `ui.md` + `prompt-templates.md`.

For an animation request, load `SKILL.md` + `sprite-animation.md` + the relevant asset module + `prompt-templates.md`.

For a reference-image redraw, load `SKILL.md` + the relevant asset module + the `Reference Redraw` template.

## Combination Examples

`character + weapon` — character holding or using a weapon.

`character + animation` — character idle, attack, dodge, recoil, or movement animation.

`weapon + effect + animation` — animated attack or projectile sequence.

`enemy + effect + animation` — enemy attack, hit, death, or ability sequence.

`ui + animation` — animated cursor, status indicator, loading state, or interface feedback.

## Character-Specific Precedence

For character generation, use this precedence after explicit user requirements:

1. `character.md` official roster grammar.
2. Character-specific template in `prompt-templates.md`.
3. Generic `SKILL.md` asset rules.
4. Generic style keywords.

Character-specific rules control the body mass, face composition, identity feature, presentation, and detail ceiling. Generic style keywords must not turn the character into a human, RPG character, mascot, or detailed vector illustration.

## General Precedence

For non-character assets, when modules conflict, use this order:

1. Explicit user requirements.
2. `SKILL.md` core style lock.
3. The most specific asset module.
4. `prompt-templates.md`.

Never weaken an explicit user constraint merely because a generic module uses a different default.
