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

The frontend design layer is independently synthesized from public methodologies including:

- Anthropic `frontend-design`: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- NextLevelBuilder `ui-ux-pro-max`: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- `better-web-ui`: https://github.com/aladicf/better-web-ui
- `frontend-designer-skill`: https://github.com/kozz36/frontend-designer-skill
- UI Skills frontend catalog: https://www.ui-skills.com/skills/frontend
- UI Skills public methodology catalog: https://www.ui-skills.com/skills

The synthesis specifically informed:

- context-first visual direction and explicit aesthetic thesis
- anti-generic / anti-AI-slop design review
- design-system-first workflow
- stack-aware implementation instead of hardcoded framework assumptions
- design-system persistence and master/override thinking
- typography, semantic color, spacing, density, and component hierarchy
- modern CSS architecture and component-driven responsiveness
- accessibility and interaction hardening
- motion systems, reduced-motion handling, and performance-aware animation
- internationalization, RTL, and text-expansion resilience
- edge-case hardening and rendered visual QA

AzSkills intentionally does not import or reproduce external searchable databases, generated outputs, repository-specific scripts, private/internal material, or large upstream skill packages. The implementation is maintained as original AzSkills text in [`ui-design/SKILL.md`](ui-design/SKILL.md) and [`design-intelligence.md`](design-intelligence.md).

One caution from current public discussion is preserved in AzSkills' architecture: external tooling may ship much more data than an agent actually reads, and some combined modes can silently ignore options. AzSkills therefore prioritizes a compact contract with explicit trigger conditions and verification requirements over a large passive data bundle. See the public discussion around UI/UX Pro Max issue #484 for an example of this class of integration risk: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/issues/484

## `readme-craft`

Informed by:

- https://github.com/oil-oil/beautify-github-readme
- https://github.com/zhangyu1818/appicon-forge
- https://github.com/Nieobie/game-icon-pack
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/aladicf/better-web-ui
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://www.ui-skills.com/skills

The AzSkills version integrates README-specific methodology with a project-native visual system, semantic icon selection, adaptive support CTAs, GitHub-safe SVG production, realistic render-size testing, explicit source/deployment/download/support link semantics, evidence-first writing, mandatory light/dark theme verification, and preservation of canonical sponsorship/support destinations.

The README workflow treats support/funding as information architecture rather than optional decoration: when a canonical support destination exists, a whole README redesign must preserve and surface it instead of silently dropping it.

`appicon-forge` is used as a generation/customization reference for project-specific icons and compact identity assets. When its generated icons use Iconify, fonts, images, or other third-party inputs, their individual rights must be checked separately.

`game-icon-pack` is a permitted reusable icon source when a matching semantic icon exists. Its repository metadata declares `CC0-1.0`. Readme-craft requires semantic discovery and context matching rather than maintaining a fixed subset of icons.

The AzSkills README also contains locally authored project-specific semantic icons under `assets/readme/icons/`. These are original local assets and do not require attribution to `game-icon-pack`.

The integrated README reference remains [`readme-craft/references/beautify-github-readme.md`](readme-craft/references/beautify-github-readme.md). Upstream example assets and repository-specific implementations are not mechanically vendored.

## `steam-mod-page`

Informed by public Steam documentation and public community formatting references:

- https://steamcommunity.com/comment/ForumTopic/formattinghelp
- https://partner.steamgames.com/doc/features/workshop/implementation
- https://partner.steamgames.com/doc/features/workshop
- https://steamcommunity.com/sharedfiles/filedetails/?id=2807121939
- https://steamcommunity.com/sharedfiles/filedetails/?id=812684948

These references cover Steam's documented text formatting vocabulary, Workshop description handling, documentation expectations, image embedding, and known surface-specific parsing caveats.

The AzSkills version independently rewrites those practices into a conservative workflow centered on:

- Steam-BBCode-only final output;
- explicit rejection of Markdown leakage;
- separate Chinese and English deliverables;
- documentation-first placement for developer-oriented Mods;
- factual compatibility and dependency handling;
- verified link and image destinations;
- preserved sponsorship/support information when the Mod provides a real support destination;
- final syntax and content linting.

AzSkills does not copy Steam Community Guide text verbatim.

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
