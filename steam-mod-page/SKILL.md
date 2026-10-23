---
name: steam-mod-page
description: Write and audit Steam Workshop Mod descriptions as clean BBCode with verified facts, player-first or developer-first structure, independent Chinese and English deliverables, and a final syntax lint.
version: 2.0.0
status: canonical
family: publishing
modes: [player, developer, audit]
---

# Steam Mod Page

Turn a Mod repository into a complete Steam Workshop description. This Skill
owns the page argument, BBCode surface, bilingual delivery, compatibility facts,
changelog, images, support, and final syntax lint. It does not invent features or
produce Markdown.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md); visual extensions are in [design-intelligence.md](../design-intelligence.md).

## Contract

- Use when: a task creates, rewrites, or audits a Steam Workshop or Mod Store description.
- Do not use when: the task is a GitHub README (`readme-craft`), a general web page, or a translation batch (`localization`).
- Owns: page architecture, BBCode-only output, bilingual separation, factuality, images, links, changelog, and final lint.
- Inputs: repository facts, Mod behavior, requirements, compatibility, installation, changelog, screenshots, support and contact destinations, and target languages.
- Outputs: one or two complete pasteable Workshop descriptions and a syntax report.
- Compose with: `localization` only when a CSV locale table is embedded in the page; `ui-design` only when a separate project page is requested.
- Gates: final copy contains no Markdown; every claim and link is verified; each language stands alone; BBCode nesting is balanced.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `player` | The Mod is consumed by players | Research, page model, copy, images, lint | Player-facing description |
| `developer` | The Mod is a framework, library, or dependency | Research, mechanism, install, compatibility, lint | Developer-facing description |
| `audit` | Existing Workshop copy needs review | Parse, fact-check, syntax lint, rank | Findings and corrected copy |

## Workflow

### 1. Research before writing

Read the repository, release notes, installation docs, and actual Mod behavior.
Record:

```text
what the Mod changes
who it is for
requirements and dependencies
supported game and loader versions
installation and first run
known limitations
changelog and current version
screenshots and permissions
support, contact, and source links
```

Never invent compatibility, performance gains, supported loaders, bug counts,
versions, screenshots, endorsements, user counts, roadmap promises, or support
destinations. Omit an unverified fact or mark it unresolved.

### 2. Choose the page model

**Player-facing:** what it does, why it improves play, a visual proof, quick
start, features, compatibility, known issues, support, changelog.

**Developer-facing:** what problem it solves, architecture or mechanism,
requirements, installation, configuration, API or extension points, compatibility,
known limitations, source and support, changelog.

Use only the sections the Mod can support. A short accurate page beats a long
generic one.

### 3. Write the first screen

The first two or three blocks answer: what is this, who is it for, what changes,
and what the reader should do first. Lead with the concrete outcome, not a slogan.
Do not stack badges, logos, and decorative images before the explanation.

### 4. Use BBCode only

The final Workshop copy must contain Steam-compatible BBCode, never Markdown.

Allowed conservative subset:

```text
[h1]...[/h1]
[h2]...[/h2]
[h3]...[/h3]
[b]...[/b]
[i]...[/i]
[u]...[/u]
[strike]...[/strike]
[list][*]...[/list]
[olist][*]...[/olist]
[hr][/hr]
[url=URL]Label[/url]
[img]URL[/img]
[code]...[/code]
[spoiler]...[/spoiler]
```

Use the smallest subset that structures the page. Do not use an undocumented tag
unless its behavior has been verified on the target Workshop surface. Do not use
Markdown headings, bold, italics, code fences, quotes, bullets, numbered lists,
links, images, or horizontal rules as formatting syntax.

### 5. Structure the page

- Use `[h1]` for the page or major topic, `[h2]` for important sections, `[h3]` sparingly.
- Use bold for short labels, not whole paragraphs.
- Use lists for scan-friendly requirements and features.
- Keep paragraphs short; use one blank line between blocks.
- Use `[hr][/hr]` rarely, only for a major transition.
- Use images to prove behavior, not to replace the explanation.
- Keep critical installation and support text selectable, not baked into images.

### 6. Handle images and links

Every image needs a real uploaded URL and must show actual Mod behavior. Do not
hotlink unstable sources or invent screenshots. Every link must resolve and point
to the destination its label promises. Do not hide the only support or contact
path inside an image.

### 7. Deliver languages independently

When bilingual output is requested, produce two complete documents:

```text
Steam Workshop Description - Chinese
Steam Workshop Description - English
```

Each language must be complete and pasteable by itself. Use the target language
for prose, headings, installation, compatibility, and support wording. Keep only
technical identifiers, file names, API names, and proper nouns unchanged. Do not
mix languages sentence by sentence. The documents should be structurally
equivalent, not literal line-by-line translations.

### 8. Keep the changelog factual

Use version headings and only changes that occurred. Prefer repository release
notes over stale Workshop history. Do not claim a fix, percentage, or compatibility
improvement without evidence.

### 9. Run the final lint

Before returning copy, scan the exact final text for:

- Markdown headings, emphasis, links, images, fences, quotes, and rules.
- Unbalanced or misnested BBCode tags.
- Empty list items, broken `[url]` attributes, or bare URLs where a label was required.
- Placeholder text, TODO, lorem ipsum, or unresolved variables.
- Missing image URLs or unsupported tags.
- Claims not present in the research record.
- Mixed-language sentences inside one deliverable.

If a syntax check fails, fix the copy and re-run the full scan.

## Quality gates

- [ ] The first screen states what the Mod is, who it is for, and the first action.
- [ ] Every feature, version, compatibility, and performance claim is sourced.
- [ ] The final copy contains no Markdown formatting.
- [ ] Every BBCode tag is documented, balanced, and correctly nested.
- [ ] Images are real, relevant, and correctly linked.
- [ ] Installation, requirements, and limitations are complete.
- [ ] Chinese and English deliverables are independent and complete.
- [ ] Support and contact sections use real destinations only.
- [ ] The changelog matches actual releases.
- [ ] The final lint passed on the exact output text.

## Output contract

For a single language:

```text
Page model:
BBCode description:
Images and links:
Fact sources:
Lint result:
Unverified items:
```

For bilingual delivery, return two separate complete descriptions and one shared
fact and lint report. Do not merge them into one mixed block.

For `audit`, return:

```text
Verdict:
Findings ranked by reader or import risk:
Exact location and correction:
Unverified items:
```

## References

- `references/steam-guide.md` - detailed page patterns, BBCode nesting, language tone, image discipline, and extended lint.
