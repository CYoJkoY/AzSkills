# Visual Critique Reference

Load this reference for `ui-design` `refine` and `review` modes. The canonical
`ui-design` contract owns scope, gates, and output. This reference supplies visual
judgment only.

## Quality hierarchy

Judge in this order. If a level fails, do not compensate with detail below it.

```text
scope
  -> composition
    -> hierarchy
      -> spacing and density
        -> typography and copy fit
          -> component precision
            -> interaction states
              -> color semantics
                -> depth and lighting
                  -> motion and flourish
```

## Grayscale test

Remove color and effects. If hierarchy, grouping, and reading order disappear,
the composition is not finished. Color may reinforce structure; it may not create
it.

## Anti-generic rules

Reject unless the product context specifically justifies it:

- purple-gradient SaaS defaults
- interchangeable card grids used as the whole page
- excessive rounded containers, pills, badges, and dividers
- arbitrary glass, glow, blur, bevel, chrome, or 3D
- generic hero sections added to component-level work
- invented metrics, testimonials, badges, or CTAs
- asymmetry or oversized contrast used only to look distinctive
- motion on every row, hover, or state
- selected states that look identical to pressed states
- decorative elements with no communication, grouping, orientation, or identity role

Distinctive does not mean noisy. Restrained precision is valid.

## Task routes

| Request | First move | Do not |
| :--- | :--- | :--- |
| Generate a new surface | Lock scope, thesis, composition, tokens | Start from a template |
| Review an existing surface | Diagnose hierarchy before styling | Redesign without a defect |
| Refactor a page | Identify the dominant failure | Polish every component |
| Polish one component | Check family fit and states | Make it novel in isolation |
| Refine state or motion | Check purpose, frequency, feedback | Add animation as decoration |
| Refine depth or lighting | Check whether layering needs explanation | Stack shadows and blur |

## Component craftsmanship

- Align to one grid; correct optical edges by eye.
- Keep one radius family and one border logic.
- Use spacing before dividers.
- Make controls look operable at rest.
- Keep focus, selected, hover, and pressed visually distinct.
- Use icons from one family and one optical weight.
- Keep labels stable across states; do not shift layout on hover.

## Depth and lighting

Use elevation only when it explains layering, focus, or a temporary surface.
Prefer a border or surface step before a shadow. Keep one shadow model. Do not
combine glow, blur, bevel, and gradient on one surface without a functional reason.

## Visual inspection

Inspect the rendered result at desktop, intermediate, and narrow widths, in every
shipped theme, with realistic and extreme content. Check:

- first-read hierarchy and focal point
- alignment and spacing rhythm
- typography wrapping, measure, and fallback
- contrast and state visibility
- image crop and aspect ratio
- overflow, clipping, and scroll behavior
- keyboard focus and selected state
- visual noise and unexplained ornament

## Self-critique gate

Before returning a visual change, answer:

1. What is the one thing the eye should see first?
2. Does the composition still work in grayscale?
3. Which element is decorative but has no job?
4. Which state is missing or indistinguishable?
5. What happens with long text, CJK, RTL, and 200 percent zoom?
6. Is the change smaller than the defect requires?

## Output

For a review, report observation, principle, recommendation, and tradeoff. Rank by
user impact. For a refinement, state the defect, the smallest change, and the
rendered evidence. Use the canonical `ui-design` output contract for the final
response.
