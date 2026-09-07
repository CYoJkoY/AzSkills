# Third-Party Skill Provenance

AzSkills includes several skills that were independently rewritten or synthesized after studying public third-party skill repositories. These notices make provenance explicit without mechanically vendoring unrelated upstream files or example assets.

## Unified `logo-generator`

Informed by:

- https://github.com/op7418/logo-generator-skill
- https://github.com/SanbaoAI/logo-generator-skill
- https://github.com/fucha1122/minimalist-bw-logo-skill

These public Logo workflows overlap substantially around logo ideation, prompt construction, SVG production, minimalist exploration, colorway exploration, brand-system boards, and showcase presentation. AzSkills therefore uses one unified `logo-generator` skill rather than maintaining competing Logo generators. The black-and-white source contributes an explicit `exploration` mode for broad monochrome concept development and a 24-concept archive-style option when the user requests a large exploration batch.

No upstream example asset library or repository-specific implementation is included in AzSkills.

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
