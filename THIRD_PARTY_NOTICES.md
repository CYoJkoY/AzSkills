# Third-Party Skill Provenance

AzSkills includes several skills that were independently rewritten or synthesized after studying public third-party skill repositories. These notices make provenance explicit without mechanically vendoring unrelated upstream files or example assets.

## Unified `logo-generator`

Informed by:

- https://github.com/op7418/logo-generator-skill
- https://github.com/SanbaoAI/logo-generator-skill
- https://github.com/fucha1122/minimalist-bw-logo-skill
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

These public Logo workflows overlap substantially around logo ideation, prompt construction, SVG production, minimalist exploration, colorway exploration, brand-system boards, showcase presentation, and design-quality review. AzSkills therefore uses one unified `logo-generator` skill rather than maintaining competing Logo generators.

The UI/UX source contributes cross-cutting visual reasoning rather than a separate Logo implementation: contextual style selection, typography and color roles, spacing discipline, composition hierarchy, anti-pattern filtering, and final quality review.

No upstream example asset library or repository-specific implementation is included in AzSkills.

## Shared design intelligence layer

Informed by:

- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The transferable design methodology is maintained in [`design-intelligence.md`](design-intelligence.md) as a cross-cutting reference layer, not a standalone Skill.

It is inherited by visual workflows such as `logo-generator`, `frontend-slides`, and `readme-craft`. It covers visual-thesis formation, contextual style selection, semantic color and typography roles, spacing and composition, accessibility, interaction quality, motion discipline, information density, anti-pattern filtering, and visual quality gates.

AzSkills does not vendor the upstream UI/UX plugin, searchable design database, generated examples, or repository-specific scripts.

## `readme-craft`

Informed by:

- https://github.com/oil-oil/beautify-github-readme

The AzSkills version integrates the upstream project's strongest README-specific methodology: the first-screen test, `Value → Proof → Mechanism → First use → Detail` content architecture, project-native visual derivation, proof-first composition, GitHub-safe SVG production, realistic render-size testing, coordinated asset organization, and opt-in motion.

The integrated reference is [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md). Upstream example assets and repository-specific implementation are not mechanically vendored.

## `ip-as-logo`

Informed by:

- https://github.com/s1dashu/ip-as-logo-skill

The AzSkills version retains the useful concepts of extreme simplification, semantic color budgeting, strong silhouette design, small-size recognition, and character-led IP direction while rewriting the workflow for AzSkills' modular conventions.

No upstream example asset library is included.

## `photo-abstract-editorial`

Informed by:

- https://github.com/ZzzLc0405/photo-abstract-editorial

The AzSkills version independently expresses the core workflow of preserving a source photograph while deriving a restrained abstract editorial panel from observed spatial, tonal, and color relationships.

No upstream example photographs, payment assets, or repository-specific support files are included.

## Licensing note

The integrated skills are original AzSkills text written from the observed public methodologies. They are not presented as verbatim copies of the upstream repositories.

Where an upstream repository publishes code or assets under a specific license, that license remains applicable to those upstream materials at their original location. AzSkills does not repackage those materials unless a future import explicitly preserves the required license and attribution notices.
