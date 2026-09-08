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

## `ui-design` and shared design intelligence

The unified UI design layer is informed by public material from the UI Skills catalog:

- https://www.ui-skills.com/skills
- https://www.ui-skills.com/skills/visual
- https://www.ui-skills.com/skills/interaction
- https://www.ui-skills.com/skills/motion
- https://www.ui-skills.com/skills/accessibility
- https://www.ui-skills.com/skills/craft
- https://www.ui-skills.com/skills/taste

Specific public entries cross-checked during synthesis include `better-ui`, `better-accessibility`, and `animation-systems`.

The broader shared layer is also informed by:

- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The transferable methodology is maintained in [`ui-design/SKILL.md`](ui-design/SKILL.md) for executable UI guidance and [`design-intelligence.md`](design-intelligence.md) for cross-Skill inheritance.

AzSkills does not vendor UI Skills, the upstream UI/UX plugin, searchable design databases, generated examples, private/internal material, or repository-specific scripts.

## `readme-craft`

Informed by:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack

The AzSkills version integrates README-specific methodology with a project-native visual system, semantic icon selection, adaptive support CTAs, GitHub-safe SVG production, realistic render-size testing, and explicit source/deployment/download link semantics.

`appicon-forge` is used as a generation/customization reference for project-specific icons and compact identity assets. When its generated icons use Iconify, fonts, images, or other third-party inputs, their individual rights must be checked separately.

`game-icon-pack` is a permitted reusable icon source when a matching semantic icon exists. Its repository metadata declares `CC0-1.0`. Readme-craft requires semantic discovery and context matching rather than maintaining a fixed subset of icons.

The AzSkills README also contains locally authored project-specific semantic icons under `assets/readme/icons/`. These are original local assets and do not require attribution to `game-icon-pack`.

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
