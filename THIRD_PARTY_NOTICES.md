# Third-Party Skill and Asset Provenance

AzSkills includes Skills that were independently rewritten or synthesized after studying public third-party methodologies, plus a small set of reusable visual assets. These notices make provenance explicit without mechanically vendoring unrelated repositories.

## Unified `logo-generator`

Informed by:

- https://github.com/op7418/logo-generator-skill
- https://github.com/SanbaoAI/logo-generator-skill
- https://github.com/fucha1122/minimalist-bw-logo-skill
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

These public workflows overlap around logo ideation, prompt construction, SVG production, minimalist exploration, colorway exploration, brand-system boards, showcase presentation, and design-quality review. AzSkills therefore uses one unified `logo-generator` Skill.

No upstream example asset library or repository-specific implementation is included.

## Shared design intelligence

Informed by:

- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The transferable design methodology is maintained in [`design-intelligence.md`](design-intelligence.md) as a cross-cutting reference layer, not a standalone Skill.

AzSkills does not vendor the upstream UI/UX plugin, searchable design database, generated examples, or repository-specific scripts.

## `readme-craft`

Informed by:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack

The AzSkills version integrates README-specific methodology with a project-native visual system, dynamic repository facts, semantic iconography, GitHub-safe SVG production, realistic render-size testing, support-action UX, and explicit source/deployment/download link semantics.

`appicon-forge` is used as a generation/customization reference for project-specific icons and compact identity assets. When its generated icons use Iconify, fonts, images, or other third-party inputs, their individual rights must be checked separately.

`game-icon-pack` is the preferred reusable icon source when a matching semantic icon exists. Its repository metadata declares `CC0-1.0`, and selected SVG assets are copied locally into AzSkills under `assets/readme/icons/` rather than hotlinked from the upstream repository.

Current local icon assets derived from `game-icon-pack`:

| Local asset | Upstream asset | License |
| :--- | :--- | :--- |
| `assets/readme/icons/settings.svg` | `svg/padding/8-ui/settings.svg` | CC0-1.0 |
| `assets/readme/icons/adjustment.svg` | `svg/padding/8-ui/adjustment.svg` | CC0-1.0 |
| `assets/readme/icons/arrow-right.svg` | `svg/padding/8-ui/arrow-right.svg` | CC0-1.0 |
| `assets/readme/icons/a-to-z.svg` | `svg/padding/11-symbols/A-to-Z.svg` | CC0-1.0 |

The integrated README reference remains [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md). Upstream example assets and repository-specific implementations are not mechanically vendored.

## `ip-as-logo`

Informed by:

- https://github.com/s1dashu/ip-as-logo-skill

The AzSkills version retains the useful concepts of extreme simplification, semantic color budgeting, strong silhouette design, small-size recognition, and character-led IP direction while rewriting the workflow for AzSkills' modular conventions.

## `photo-abstract-editorial`

Informed by:

- https://github.com/ZzzLc0405/photo-abstract-editorial

The AzSkills version independently expresses the core workflow of preserving a source photograph while deriving a restrained abstract editorial panel from observed spatial, tonal, and color relationships.

## Licensing note

The integrated Skills are original AzSkills text written from observed public methodologies. They are not presented as verbatim copies of upstream repositories.

For third-party assets that are actually copied into AzSkills, the applicable upstream license is recorded above. Tool/project licenses do not automatically grant rights to third-party materials selected or generated through those tools.
