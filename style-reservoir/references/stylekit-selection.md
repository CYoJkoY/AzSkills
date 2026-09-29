# StyleKit Selection Reference

This reference defines how the 148-style catalog should be used without turning the reservoir into a mandatory global style prompt.

## Decision gate
Before reading style records, answer:
1. Is the task visual?
2. Is a concrete visual decision unresolved?
3. Is explicit user direction absent or incomplete?
4. Does the project lack an authoritative local answer for that decision?
5. Is there enough context to distinguish at least one plausible direction?

Only continue when the answer to every question is yes.

## Hard filters

| Signal | Filter |
| --- | --- |
| Surface architecture | Remove styles whose layout mechanism conflicts with the target surface. |
| Platform | Remove mechanisms that the target platform cannot support safely or accessibly. |
| Density | Remove directions that inherently require more visual load than the product can tolerate. |
| Interaction model | Remove styles whose defining interaction cannot be represented by the product's actual controls. |
| Accessibility | Remove or adapt defining effects that break reduced-motion, contrast, focus, touch, or text-scaling requirements. |
| Existing system | Remove styles that would require replacing local tokens/components when replacement is not part of the task. |

## Soft matching signals

After hard filtering, inspect:
- product scenario and audience;
- layout/composition;
- content type;
- density;
- platform;
- interaction intensity;
- desired emotional/visual intent;
- typography character;
- palette character;
- depth/texture;
- motion character;
- StyleKit tags and keywords;
- StyleKit category;
- StyleKit compatibility links.

Prefer evidence that is specific to the current surface over broad genre labels.

## Layout/visual split

A layout style can be selected separately from a visual style when the task genuinely has two independent unanswered questions:
- How should the information be composed?
- How should the composed surface look and feel?

Do not combine two visual styles merely to increase novelty.

When combining, require:
1. no direct contradiction in geometry, density, or interaction;
2. a clear ownership boundary;
3. a reason each style solves a different design problem;
4. compatibility evidence when StyleKit provides it;
5. one dominant visual thesis after adaptation.

## Context examples

These are selection examples, not fixed mappings:
| Context | Signals worth checking |
| --- | --- |
| Dense admin dashboard | data-dense, dashboard-layout, corporate-clean, material-design, fluent-design, linear-style |
| Mobile utility | soft-utility, mobile-editorial, soft-ui, minimalist-flat, material-design |
| Editorial / publication | editorial, magazine-grid, oversized-typography, mobile-editorial, distill-style |
| Developer tool | developer-terminal, github-style, linear-style, data-dense |
| Image-led portfolio | immersive-photo, masonry-flow, gallery-dark, editorial, collage-art |
| Game / JRPG interface | jrpg, cyber-anime, visual-novel, pixel-anime, arcade-crt |
| Expressive campaign | maximalism, dopamine-design, acid-graphics, cyberpunk-neon, brutalist-web |
| Luxury retail | luxury-retail, marble-luxury, luxe-lookbook, minimalist-flat |
| Natural / craft brand | natural-organic, warm-organic, cottagecore, victorian-botanical, paper-craft |
| Technical / futuristic | sci-fi-hud, holographic, neon-gradient, liquid-glass, cyberpunk-neon |

The examples above identify candidates to inspect; they do not override the local project context.

## Selection strength

Use a qualitative internal strength:
- Strong — several independent context signals converge and no higher-priority conflict exists.
- Usable — there is a coherent fit but some signals remain ambiguous.
- Weak — only broad aesthetic similarity exists.
- Rejected — hard constraint or higher-priority system conflict.

Only Strong or Usable candidates should influence implementation. Weak candidates stay in the catalog and are not forced.

## Adaptation boundary

Never copy the selected style's component code into project components unless the task explicitly calls for such reuse and licensing/provenance is verified.

Instead:
1. extract the intended visual rule;
2. map it to project primitives;
3. map primitives to semantic tokens;
4. map semantics to components/states;
5. verify responsive and accessibility behavior.

## Progressive disclosure rule

The catalog is the default read. A style source is a second-stage read. Full style source content should only enter working context after a candidate has survived the decision gate and filters.

This is the mechanism that keeps the Style Reservoir available without making every visual task expensive or visually prescriptive.
