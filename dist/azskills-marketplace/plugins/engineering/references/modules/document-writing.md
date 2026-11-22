---
name: document-writing
description: Write, rewrite, and audit publication-ready documents for GitHub repositories and Steam Workshop. Use for README architecture, heading icons, evidence-first structure, stable anchors, Steam BBCode Workshop descriptions, bilingual delivery, and final syntax lint.
version: 3.0.0
status: module
family: publishing
modes: [readme, readme-rewrite, readme-audit, steam-player, steam-developer, steam-audit]
---

# Document Writing

Turn a repository into a publication-ready document for its target surface.
This module owns evidence-first information architecture, document-specific
formatting, bilingual delivery, and rendered QA. It has two branches:

1. **README** - GitHub Markdown with semantic heading icons, stable anchors,
   verified links, and theme-safe visual assets.
2. **Steam Workshop** - Steam-compatible BBCode with player-facing or
   developer-facing page models and independent bilingual deliverables.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../../SKILL-SYSTEM.md);
visual extensions are in [design-intelligence.md](../../design-intelligence.md).

## Contract

- Use when: a task creates, rewrites, or audits a GitHub README, a Steam
  Workshop description, or a Mod Store page.
- Do not use when: the task is a general web page (`ui-design`), a standalone
  translation batch (`localization`), or identity work (`logo-generator`).
- Owns: evidence collection, information architecture, branch-specific
  formatting, bilingual separation, images, links, and final syntax lint.
- Inputs: repository tree, release metadata, existing docs, screenshots,
  assets, license, support destinations, and target language(s).
- Outputs: publication-ready Markdown or BBCode, SVG assets when applicable,
  navigation, and verification evidence.
- Compose with: `ui-design` for rendered custom pages; `logo-generator` for
  identity marks.
- Gates: every fact is sourced; every link resolves; every anchor or BBCode tag
  is valid; branch-specific assets and syntax pass their final lint.

## Modes

| Branch | Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- | :--- |
| README | `readme` | New repository landing page | Evidence, IA, visual thesis, assets, QA | README and assets |
| README | `readme-rewrite` | Existing README needs restructuring | Audit, preserve evidence, rewrite, QA | Revised README |
| README | `readme-audit` | Read-only review | Evidence, structure, links, render | Ranked findings |
| Steam | `steam-player` | The Mod is consumed by players | Research, page model, copy, images, lint | Player-facing description |
| Steam | `steam-developer` | The Mod is a framework or dependency | Research, mechanism, install, compatibility, lint | Developer-facing description |
| Steam | `steam-audit` | Existing Workshop copy needs review | Parse, fact-check, syntax lint, rank | Findings and corrected copy |

### Branch selection

| Branch | Use when | Output format |
| :--- | :--- | :--- |
| README | GitHub repository landing page or major section | GitHub Markdown |
| Steam Workshop | Steam Workshop or Mod Store description | Steam BBCode |

### README branch

1. Build the evidence inventory from the repository before writing.
2. Lock the output language and use it consistently.
3. Design the information architecture: identity, quick start, proof,
   capabilities, installation, usage, compatibility, support.
4. Establish the visual thesis and build heading icons from an owned icon set.
5. Use explicit anchors and verified links.
6. Render and verify in light and dark themes at narrow width.

### Steam Workshop branch

1. Research repository, release notes, installation docs, and actual Mod behavior.
2. Choose the page model: player-facing or developer-facing.
3. Write the first screen with concrete outcomes and first action.
4. Use Steam-compatible BBCode only; never Markdown.
5. Structure the page with `[h1]`, `[h2]`, `[b]`, `[list]`, `[url]`, `[img]`.
6. Deliver bilingual output as two independent, complete descriptions.
7. Run final lint: balanced tags, no Markdown, no placeholders, sourced claims.

## Workflow

1. Select the branch from the target surface (GitHub README or Steam Workshop).
2. Run the branch workflow from the Modes table above.
3. Verify all links, anchors, images, and facts before delivery.
4. For bilingual delivery, produce two independent complete documents.
5. Run the branch-specific lint on the exact final text.

## Branch references

The detailed branch contracts remain subordinate references:

- README: [README workflow](./readme-craft.md), including heading icon policy, external-repository conventions, stable anchors, support destinations, and rendered QA.
- Steam Workshop: [Steam workflow](./steam-mod-page.md), including player and developer page models, conservative BBCode, bilingual delivery, changelog, support, and syntax lint.

Apply only the gates for the selected branch. README work does not require Steam
BBCode checks, and Steam work does not require README icon or theme checks.
Use the existing document language unless the user requests a new language;
bilingual output is required only when requested.

## Quality gates

- [ ] The first screen states what the project is, who it is for, and the first action.
- [ ] Every feature, version, benchmark, and compatibility claim is sourced.
- [ ] README output uses consistent language and owned semantic heading icons.
- [ ] Every anchor, external link, and image path resolves.
- [ ] SVG assets render in light and dark themes at intended sizes.
- [ ] Steam output contains no Markdown formatting; BBCode tags are balanced.
- [ ] Chinese and English deliverables are independent and complete.
- [ ] Support and contact sections use real destinations only.
- [ ] The final lint passed on the exact output text.

## Output contract

```text
Branch (README or Steam Workshop):
Information architecture:
Format-specific output (Markdown or BBCode):
Assets created or changed:
Evidence and source links:
Link and syntax verification:
Bilingual deliverables (when applicable):
Unverified items:
```

## References

- [README workflow](./readme-craft.md) - README architecture, icon policy, anchors, links, and QA.
- [Steam workflow](./steam-mod-page.md) - Steam Workshop page patterns, BBCode nesting, bilingual delivery, and lint.
