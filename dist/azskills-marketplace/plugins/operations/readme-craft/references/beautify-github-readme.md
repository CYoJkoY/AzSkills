# Beautify GitHub README — Integrated Production Reference

This reference distills the useful public methodology from:
https://github.com/oil-oil/beautify-github-readme

It is adapted for AzSkills rather than copied verbatim.

## 1. First-screen test

Before editing, a new visitor should understand without scrolling:

1. What the repository is.
2. What it can do for the visitor.
3. What evidence they should inspect next.

The default narrative is:

`Value → Proof → Mechanism → First use → Detail`

Do not lead with internal architecture, contributor instructions, a long command sequence, or implementation jargon unless the repository's audience genuinely requires it.

## 2. Three-layer README model

Keep responsibilities separate:

- Markdown: searchable/copyable prose, commands, configuration, API details, links, compatibility, limitations, contribution, license.
- SVG: hero systems, section transitions, deterministic diagrams, workflow visuals, compact project-native identity modules.
- PNG/WebP/GIF: screenshots, generated artwork, complex composites, and explicitly approved motion.

Never rasterize the README as a single image.

## 3. Project-native visual derivation

Derive visual direction in this order:

1. What the project actually does.
2. Existing identity: logo, UI, screenshots, diagrams, tokens, code style, documentation tone.
3. Audience expectations: technical trust, creative energy, research clarity, operational confidence, etc.
4. Finish: palette, typography, shape, material, motif, density, composition.

Do not begin with a fashionable style and force the project into it.

Useful cues:

| Project type | Useful cues | Avoid |
| --- | --- | --- |
| CLI / developer tool | terminal rhythm, cursor, mono metadata, precise grids | fake code, neon overload |
| AI product | transformations, relationships, input/output contrast | generic glowing brains |
| Design resource | keylines, artboards, specimens, crop marks | empty portfolio decoration |
| Research/data | coordinates, annotations, measured spacing, charts | generic dashboard chrome |
| Library/framework | modules, API flow, dependency relationships | marketing-site imitation |
| Creator project | editorial voice, sequences, human-scale imagery | generic SaaS template |

## 4. Visual grammar

Freeze these decisions before drawing substantial assets:

- Palette: 3–5 colors with explicit semantic roles.
- Type: system-safe font stack and a small hierarchy of display/section/body/utility text.
- Shape: one radius family, one dominant stroke language, one spacing unit.
- Motif: one project-specific recurring cue.
- Density: deliberately sparse, compact, or expressive.

The motif is the primary anti-template device. Repeat it lightly; never turn it into wallpaper.

## 5. Hero composition

A hero is the visual summary of the repository, not a generic banner.

Possible compositions:

- Split: title + proof/artifact.
- Integrated: title and artifact share one composition grid.
- Artifact wall: several real outputs arranged with controlled scale and whitespace.
- Background proof: one real artifact is integrated behind or around the title.
- Title-only: use when there is no honest visual proof or when minimalism is itself part of the product identity.

Choose after inspecting the real project material. Do not default to left-text/right-graphic.

## 6. Proof-first rule

Prefer real evidence over decoration:

- real screenshots;
- real generated outputs;
- real command examples;
- real diagrams derived from the repository;
- real UI or artifacts;
- existing logos and artwork.

Generated imagery is allowed only when it has a specific communication job that real material cannot perform as effectively.

Never invent benchmarks, adoption, compatibility, testimonials, screenshots, or features.

## 7. GitHub-safe SVG defaults

For full-width README visuals:

- Prefer a `1200`-unit-wide `viewBox`.
- Embed with `width="100%"`.
- Use normal SVG shapes, paths, text, fills, strokes, clipping paths, and simple transforms.
- Use system font stacks; do not depend on remote fonts.
- Add `<title>` and `<desc>` to major visual modules when useful.
- Keep important content inside a conservative safe rectangle.
- End generated SVG files with a newline.
- Keep files reasonably small.

Avoid:

- `foreignObject`;
- JavaScript;
- external stylesheets;
- remote image URLs inside SVG;
- fragile selectors;
- essential information inside animation;
- layout that depends on browser-specific HTML rendering.

## 8. Render-size quality gate

Judge SVG at its actual rendered size, not just SVG coordinate values.

Use approximately `900px` rendered width as a conservative desktop acceptance target for full-width modules. At that size:

- essential diagram text: at least ~20 SVG units;
- supporting labels: at least ~18 SVG units;
- section titles: at least ~40 SVG units;
- text below ~18 SVG units is nonessential only.

Also inspect around `360px` mobile width. If required labels become unreadable, simplify, split the visual, or move detail into Markdown.

## 9. Accessibility and trust

Alt text must explain what the visual communicates, not merely call it a banner.

Critical installation instructions and copyable content must remain in Markdown.

Check light/dark GitHub backgrounds and ensure the visual's own background, when necessary, protects contrast.

## 10. Asset organization

Prefer repository-local paths such as:

```text
assets/readme/
├── hero.svg
├── hero.png
├── hero.gif
├── showcase.png
├── section-*.svg
├── workflow.svg
└── source/
    ├── hero-layout.svg
    ├── hero-subject.png
    └── hero-prompt.txt
```

Use lowercase hyphenated names. Remove discarded variants unless the user explicitly wants the exploration archive retained.

## 11. Coordinated visual modules

When several README assets are created, they must share:

- typography hierarchy;
- palette roles;
- corner/radius language;
- spacing rhythm;
- stroke language;
- motif vocabulary.

Each individual asset must still have a distinct communication job.

Useful compositions include:

- artifact wall;
- before/after;
- system map;
- annotated specimen;
- sequence strip.

## 12. Motion policy

Motion is opt-in. Use animation only when it communicates a meaningful process, state, transition, or relationship.

GitHub can display GIFs but does not play animation embedded inside SVG. Therefore:

- keep a static SVG source/fallback;
- publish GIF only after explicit approval;
- validate the loop entry, hold, exit, and boundary;
- never make essential information depend on motion.

## 13. Review workflow

Before publishing:

1. Inspect the README at realistic GitHub content width.
2. Inspect wide and narrow previews.
3. Check hero and section visuals for clipping, collision, contrast, and density.
4. Check links and relative asset paths.
5. Check that proof appears before long claims.
6. Check that Markdown remains searchable/copyable.
7. Run any local README audit available in the repository.
8. Preserve a clean diff and leave unrelated files untouched.

## 14. Approval boundary

Inspection does not imply permission to edit.

Asset-only requests must not silently change README wording, order, embeds, or links.

Whole-README work may change content and structure only within the user's authorized scope.

Do not commit, push, open a PR, or publish without explicit authorization.
