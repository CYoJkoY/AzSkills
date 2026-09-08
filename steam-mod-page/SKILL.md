---
name: steam-mod-page
description: Design, rewrite, audit, and produce production-ready Steam Workshop / Steam Mod descriptions with strict BBCode-only final output, separated Chinese and English deliverables, documentation-first information architecture for developer mods, verified links and compatibility claims, controlled visual rhythm, image/embed discipline, changelog accuracy, and an explicit final syntax lint that rejects Markdown leakage.
---

# Steam Mod Page

Use this Skill for Steam Community Workshop item descriptions, Steam Mod pages, and closely related Steam Community guide-style promotional/documentation copy.

The target is not a GitHub README and not generic marketing copy. The target is a Steam-native page that is immediately understandable, easy to scan, safe to paste into the Steam editor, and faithful to the actual Mod.

The current Steam text-formatting reference documents headings (`h1`/`h2`/`h3`), bold, underline, italic, strikethrough, lists, ordered lists, quotes, links, images, code, and other markup; availability can vary by Steam surface. Therefore the Skill deliberately prefers a conservative subset and requires final-output validation rather than assuming every tag works everywhere. citeturn709904search4turn709904search1

## 1. Automatic scope

Apply this Skill when the task involves:

- Steam Workshop descriptions
- Steam Mod introductions
- Mod installation / compatibility instructions intended for Steam
- Steam Workshop update logs
- Workshop feature lists
- Workshop documentation links
- Chinese/English Steam Mod copy
- auditing existing Workshop BBCode

Modes:

| Mode | Responsibility |
| :--- | :--- |
| `write` | Produce a complete new Workshop description |
| `rewrite` | Rebuild an existing description while preserving verified facts and useful destinations |
| `audit` | Diagnose content, structure, BBCode, link, localization, and visual-rhythm problems without editing |
| `changelog` | Produce only a factual change log section |
| `bilingual` | Produce two independent final language documents |

Use the narrowest mode that fully solves the task.

## 2. Core priority order

Resolve decisions in this order:

1. Explicit user requirements.
2. First-party Mod information and actual repository files.
3. Steam formatting constraints and platform behavior.
4. This Skill.
5. Shared AzSkills design intelligence for visual hierarchy and interaction reasoning.
6. Optional stylistic references.

When facts conflict, use the newest verifiable first-party source and remove unsupported claims.

## 3. Research before writing

Before producing final copy, inspect the strongest available sources in this order:

```text
Steam Workshop item
↓
official repository
↓
official documentation / wiki
↓
release notes / changelog
↓
project metadata / manifest
↓
maintainer-provided links
```

Collect:

```text
Mod name
one-sentence value
actual features
supported game version(s)
required DLC(s)
required Mod Loader / framework
hard dependencies
installation steps
configuration steps
documentation URL
source URL
release/download URL
support/sponsorship URL
known incompatibilities
known limitations
current version
actual recent changes
contact channels
```

Never invent:

- compatibility;
- performance improvements;
- supported loaders;
- bug counts;
- version numbers;
- links;
- screenshots;
- endorsements;
- user counts;
- roadmap promises;
- sponsorship destinations.

If a fact cannot be verified, omit it or use a clearly marked placeholder only when the user explicitly requested a template.

## 4. Final-output language separation

When bilingual output is requested, Chinese and English are two independent deliverables.

Required model:

```text
Steam Workshop Description — 中文
Steam Workshop Description — English
```

Each language file must be complete and directly pasteable by itself.

Chinese deliverable:

- Chinese prose;
- Chinese headings;
- Chinese support/contact wording;
- Chinese installation explanations;
- English only where a technical identifier, file name, API name, official product name, proper noun, or code token must remain unchanged.

English deliverable:

- English prose;
- English headings;
- English support/contact wording;
- English installation explanations;
- Chinese only where a technical identifier, file name, API name, official product name, proper noun, or code token must remain unchanged.

Do not produce a mixed sentence such as `中文说明 / English explanation` merely to demonstrate parity.

The two files should be structurally equivalent, not line-by-line literal translations.

## 5. BBCode-only final-output contract

This is the most important implementation rule.

The final Steam description must contain Steam-compatible markup, not Markdown.

### Forbidden in final Workshop copy

Reject all of the following as formatting syntax:

```text
# Heading
## Heading
### Heading
**bold**
*italic*
__underline__
`inline code`
```text
code fence
```
> quote
- bullet
1. ordered item
[link](https://example.com)
![image](https://example.com/image.png)
---
***
___
```

Markdown may appear inside this Skill's documentation and examples only. It must never leak into the final Steam deliverable.

### Conservative supported subset

Prefer only the tags that are documented or well-established on the target Steam surface:

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

Steam's own formatting help documents these families, while community documentation notes that availability and parsing can vary across Steam surfaces. Prefer the smallest safe subset needed for the target page. citeturn709904search4turn709904search1

Do not use obscure, undocumented, or surface-specific tags unless their behavior has been verified for the exact target page.

### Plain text is the fallback

When uncertain whether a tag is safe, use plain text rather than experimental markup.

A readable plain-text sentence is preferable to a visually ambitious but broken BBCode block.

## 6. BBCode nesting and syntax hygiene

Keep nesting shallow.

Preferred:

```text
[h2]核心功能[/h2]
[list]
[*][b]内容注册：[/b] 将内容接入游戏已有系统。
[*][b]配置：[/b] 提供可选配置项。
[/list]
```

Avoid deeply nested markup such as:

```text
[h1][b][u][i]...[/i][/u][/b][/h1]
```

Rules:

- every opened tag must be closed;
- opening and closing tags must match;
- do not place Markdown inside BBCode;
- do not escape or stylize brackets unnecessarily;
- do not put raw BBCode examples into final copy unless they are intended to render as text;
- do not rely on unsupported HTML;
- do not put Markdown URLs beside BBCode URLs for the same destination.

For source-code text or literal BBCode examples that must remain visible, use a documented code or no-parse mechanism when verified; otherwise link to the authoritative documentation instead.

## 7. Information architecture

Steam readers scan quickly. Put the highest-value information first.

### Player-facing Mod

Recommended order:

```text
Title / one-line promise
Quick summary
Key features
Installation / requirements
Compatibility
How to use
Known limitations
Links
Credits / contact
Support
Changelog
```

### Developer / framework / infrastructure Mod

Recommended order:

```text
Documentation
What it is
What problem it solves
Core capabilities
Quick start
Dependencies / compatibility
How it integrates
Configuration / API entry point
Limitations / non-goals
Source / issue reporting
Support
Changelog
```

For a developer Mod, documentation is an action surface, not an afterthought. Place it near the top.

Steam's Workshop documentation also emphasizes having useful external documentation available for tools used to create Workshop content. citeturn709904search5

## 8. First-screen rule

The first visible block should answer at least three of these four questions:

```text
What is this Mod?
Who is it for?
What does it add or solve?
Where do I go next?
```

Do not spend the first screen on:

- a giant decorative separator;
- a long author story;
- a generic thank-you paragraph;
- a full changelog;
- repeated feature names without explanations.

For developer Mods, the documentation link can be the primary first action.

## 9. Documentation-first treatment

If official usage, installation, API, or developer documentation exists, expose it clearly near the top.

Preferred structure:

```text
[h1]Documentation[/h1]

[b]Start here before installing or integrating the Mod.[/b]

[url=DOCUMENTATION_URL][b]Open the Usage & Developer Documentation[/b][/url]
```

Chinese version:

```text
[h1]使用文档[/h1]

[b]开始安装或开发前，请先阅读完整文档。[/b]

[url=DOCUMENTATION_URL][b]打开使用与开发文档[/b][/url]
```

The visible link label must explain the destination. Avoid naked URLs when a descriptive label is practical.

Do not copy an entire developer manual into the Workshop description simply because the manual exists. The Workshop page should route users to the authoritative document.

## 10. Value proposition and feature writing

A feature title alone is not a feature explanation.

Use:

```text
capability → user consequence
```

Example:

```text
[h3]内容注册[/h3]
[list]
[*]将角色、武器与其他内容接入游戏现有系统，减少重复的手动注册工作。
[/list]
```

Avoid vague promotional claims such as:

```text
强大
革命性
终极
无缝
全新体验
顶级性能
```

unless the wording is supported by concrete evidence.

## 11. Installation and quick start

Installation should answer the minimum operational questions:

```text
What is required?
Where does it go?
What must be enabled?
What version is required?
How do I start it?
How do I know it worked?
```

Prefer a short ordered flow:

```text
[h1]快速开始[/h1]

[olist]
[*]订阅并启用 Mod。
[*]确认所需依赖已安装。
[*]启动游戏并加载对应内容。
[*]按文档中的步骤完成配置。
[/olist]
```

If Steam's target description surface renders ordered lists reliably, use `[olist]`; otherwise use a plain numbered sequence.

Do not paste shell commands, long directory trees, or full source files unless they are genuinely required for the Workshop user journey. Link to the full documentation when detail becomes large.

## 12. Compatibility and dependencies

Treat compatibility as its own information block.

Recommended:

```text
[h1]Compatibility & Dependencies[/h1]

[list]
[*][b]Game:[/b] verified version
[*][b]Loader:[/b] verified version
[*][b]Dependencies:[/b] verified dependencies
[*][b]DLC:[/b] verified requirement
[/list]
```

State only what has been verified.

If the Mod is not compatible with another framework, say so explicitly and near the installation section.

Do not turn an assumption into a compatibility promise.

## 13. Architecture / mechanism sections

Developer-oriented Mods benefit from a compact conceptual model.

Example:

```text
Game Resource
    ↓
Content Data
    ↓
Loader / Registration Layer
    ↓
Game Runtime
```

Use ordinary text, not Markdown code fences.

If the diagram is long, replace it with a link to the official architecture documentation.

The purpose is to explain the mental model, not to reproduce implementation details.

## 14. Images, galleries, and visual rhythm

Visuals should explain or prove something.

Prefer:

```text
real feature screenshot
real UI state
before / after
workflow image
architecture diagram
configuration example
```

Avoid:

- unrelated stock art;
- decorative images repeated between every section;
- screenshots that contain no relevant state;
- image-only explanations for important installation facts.

For external images, use only verified URLs and the exact tag supported by the target Steam surface. Steam's formatting reference includes `[img]URL[/img]`, while practical guides document image embedding in Workshop descriptions. citeturn709904search4turn709904search7

Critical information must remain in selectable text even when an image is present.

## 15. Links and destination semantics

Every link should have one clear purpose.

Classify destinations:

```text
Documentation → learn / configure / integrate
Repository → inspect source / report issues
Release → download / version information
Workshop dependency → subscribe to prerequisite
Support → sponsor / fund development
Discord / contact → community or support channel
```

Never replace a canonical destination with a guessed mirror.

Preserve valid existing URLs unless the user asks to change them or the destination is demonstrably obsolete.

Prefer descriptive link labels:

```text
[url=https://example.com/docs]Documentation[/url]
```

over:

```text
[url=https://example.com/docs]https://example.com/docs[/url]
```

## 16. Support / sponsorship

When the project has a real support destination, preserve it during a rewrite.

Do not silently remove sponsorship, donation, GitHub Sponsors, Ko-fi, Patreon, or another maintainer-owned support channel that is already verified.

If a support destination is explicitly provided by the project, use a dedicated block where appropriate:

```text
[h1]Support[/h1]

Your support helps maintain the Mod, documentation, compatibility work, and future updates.

[url=SUPPORT_URL][b]Support the project[/b][/url]
```

Chinese:

```text
[h1]赞助与支持[/h1]

你的支持可以用于维护 Mod、文档、兼容性工作以及后续更新。

[url=SUPPORT_URL][b]支持项目[/b][/url]
```

Do not invent a support URL.

Do not claim that donations are required.

Do not put the only support destination inside an image.

Keep payment identifiers and critical instructions as selectable text.

## 17. Contact and feedback

Only include channels that are actually provided by the project.

Possible categories:

```text
GitHub issues
Email
Discord
Steam discussion
Community page
```

Do not manufacture a contact channel merely because it is conventional.

For bug reports, tell the user what information is useful:

```text
Mod version
Game version
Loader version
reproduction steps
relevant log / error
```

## 18. Changelog

A changelog is factual history, not a second marketing block.

Recommended structure:

```text
[h1]Changelog[/h1]

[h2]vX.Y.Z[/h2]
[list]
[*]Added ...
[*]Changed ...
[*]Fixed ...
[/list]
```

Only describe changes that actually occurred.

Do not fabricate percentages, counts, compatibility improvements, or bug fixes.

For recent versions, prefer the authoritative repository release notes when available rather than copying stale Workshop history.

## 19. Credits, dependencies, and licensing

Credit third-party libraries, authors, assets, and upstream projects when the project actually requires or provides such attribution.

Do not add generic credits for tools merely used to write the page.

For dependencies, link to the actual Workshop item or official project when the user needs to subscribe, install, or learn more.

For licensing, do not claim rights broader than the repository or asset license supports.

## 20. Steam visual hierarchy

Steam Workshop pages have less layout freedom than a normal website. Compensate with rhythm, not with markup overload.

Recommended hierarchy:

```text
[h1] major topic
[h2] important subsection
[h3] local subsection
[b] inline emphasis
[list] grouped facts
[hr][/hr] rare major transition
```

Rules:

- use headings for semantic grouping;
- use bold for short labels, not entire paragraphs;
- use lists for scan-friendly facts;
- keep paragraphs short;
- use horizontal rules sparingly;
- do not make every sentence bold;
- do not decorate headings with a random emoji inventory.

A few symbols may be acceptable as content when they serve the project's identity, but they are not a substitute for information hierarchy.

## 21. Language-specific tone

### Chinese

Prefer natural Simplified Chinese suitable for a game community:

- direct;
- practical;
- concise;
- technically precise;
- not overly corporate.

Avoid literal English syntax and unnecessary formalism.

### English

Prefer natural Steam community English:

- concise;
- concrete;
- technically accurate;
- readable by international players;
- not machine-translated word-for-word.

Avoid exaggerated startup-style marketing language.

## 22. Steam-specific output hygiene

The final output should not contain internal authoring notes such as:

```text
[Insert link here]
TODO
TODO: translate
same as Chinese version
placeholder screenshot
AI-generated summary
```

unless the user explicitly requested a template.

Do not put the Skill's own Markdown formatting around the final Steam description.

Do not wrap the final BBCode in a Markdown code fence when the user asked for directly pasteable output; the contents themselves must be the pasteable document.

When providing two final language files, show them as two clearly separated files in the chat or save them as separate `.txt` artifacts. Each file must contain only its own language's final Steam content.

## 23. Final BBCode lint

Before declaring the result complete, run a mental or programmatic syntax pass.

### Syntax checks

```text
[ ] no Markdown heading syntax
[ ] no Markdown bold / italic syntax
[ ] no Markdown code fences
[ ] no Markdown links
[ ] no Markdown image syntax
[ ] no Markdown tables
[ ] no fake HTML formatting
[ ] every BBCode tag is paired
[ ] list tags are correctly nested
[ ] URL tags contain the intended destination
[ ] image tags contain verified URLs
[ ] no unsupported experimental tags
```

### Content checks

```text
[ ] Mod identity is clear
[ ] first-screen value is clear
[ ] documentation is visible when applicable
[ ] installation is actionable
[ ] compatibility is explicit
[ ] dependencies are accurate
[ ] claims are evidence-based
[ ] limitations are not hidden
[ ] valid support destination is preserved
[ ] changelog matches real releases
[ ] no fabricated contact channel
```

### Bilingual checks

```text
[ ] Chinese file is independently pasteable
[ ] English file is independently pasteable
[ ] structure is equivalent
[ ] no accidental language mixing
[ ] technical identifiers are preserved
[ ] URLs match the intended destination
```

## 24. Review severity

Classify problems:

```text
BLOCKER  → Markdown leakage, broken BBCode, wrong URL, fabricated fact, missing critical dependency
HIGH     → documentation buried, broken installation flow, misleading compatibility, major language mismatch
MEDIUM   → weak hierarchy, repetitive copy, excessive decoration, unclear link labels
LOW      → isolated wording or spacing polish
```

Fix blockers and factual errors before styling.

## 25. Anti-pattern filter

Reject:

- a GitHub README pasted directly into Steam;
- Markdown headings inside a BBCode page;
- a bilingual line-by-line hybrid document;
- generic feature-adjective piles;
- undocumented claims;
- huge code dumps;
- support information removed during rewriting;
- generic donation language with invented payment links;
- emoji used as a substitute for semantic hierarchy;
- excessive `[b]` nesting;
- every section separated by a decorative rule;
- unrelated screenshots inserted only to make the page longer;
- stale version numbers copied from an old template.

## 26. Recommended authoring workflow

```text
1. Inspect first-party sources
2. Inventory facts and destinations
3. Identify audience: player / developer / mixed
4. Choose information architecture
5. Write the first-screen value proposition
6. Write documentation / install path
7. Add features with user consequences
8. Add compatibility and dependencies
9. Add links / contact / support
10. Add changelog only when useful
11. Convert every formatting decision to Steam BBCode
12. Run BBCode lint
13. Run factual and bilingual review
14. Deliver only pasteable final language files
```

Do not skip the verification step because the page is short.

## 27. Provenance

This Skill is informed by public Steam documentation and public community formatting references:

- Steam Text Formatting: https://steamcommunity.com/comment/ForumTopic/formattinghelp
- Steam Workshop Implementation Guide: https://partner.steamgames.com/doc/features/workshop/implementation
- Steam Workshop documentation overview: https://partner.steamgames.com/doc/features/workshop
- Community formatting reference: https://steamcommunity.com/sharedfiles/filedetails/?id=2807121939
- Community image embedding guide: https://steamcommunity.com/sharedfiles/filedetails/?id=812684948

Steam's own formatting page documents the core markup vocabulary, while community references highlight surface-specific differences and parsing caveats. Therefore this Skill intentionally uses conservative formatting and a strict final lint rather than assuming every BBCode tag behaves identically everywhere. citeturn709904search4turn709904search1

AzSkills does not copy upstream text or community page content verbatim. It synthesizes the transferable writing, formatting, documentation-first, and verification practices into an independent Skill.
