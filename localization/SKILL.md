---
name: localization
description: Translate game CSV rows into 13 fixed locales with consistent terminology, intact BBCode, correct CSV escaping, and a clean importable output. Use for game localization batches and locale audits.
version: 2.0.0
status: canonical
family: publishing
modes: [translate, audit]
---

# Localization

Translate game copy into a fixed locale set without changing its structure,
markup, or meaning. This Skill owns terminology, locale completeness, BBCode
preservation, CSV escaping, and output purity. It does not own copywriting,
store-page design, or general translation of non-CSV artifacts.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md) before changing this contract.

## Contract

- Use when: a task supplies game CSV rows, a glossary, or a locale batch for the fixed 13-language schema.
- Do not use when: the task is prose translation without a CSV schema, marketing copy, or interface copy design.
- Owns: locale completeness, terminology consistency, tone, BBCode integrity, CSV escaping, and importable output.
- Inputs: CSV rows, header, source English and Simplified Chinese, optional glossary, project context, and game genre.
- Outputs: complete CSV rows with every locale filled, or a locale audit report.
- Compose with: `readme-craft` or `steam-mod-page` only when a CSV locale table is embedded in that publishing artifact.
- Gates: all 13 locales are non-empty, BBCode is balanced and unchanged, CSV parses, and the output contains no commentary.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `translate` | Rows need all 13 locales | Parse, analyze, translate, protect markup, escape, validate | CSV only |
| `audit` | Existing rows need consistency or completeness checks | Parse, compare, flag, summarize | Findings and corrected rows |

## Default schema profile

The default AzSkills game-localization profile uses this fixed header and order:

```text
keys,en,fr,zh,ja,ko,zh_TW,ru,pl,es,pt,de,tr,it
```

The 13 locales are `en`, `fr`, `zh`, `ja`, `ko`, `zh_TW`, `ru`, `pl`, `es`,
`pt`, `de`, `tr`, and `it`. If the project supplies a different header, that
header becomes the active schema; preserve its order and locale set exactly.

## Workflow

### 1. Parse the input

Read the header and every row. Extract the `key`, existing `en`, existing `zh`,
and any other populated locale. Preserve row order. If a row is malformed, stop
and report the row number and the malformed field; do not guess a new structure.

### 2. Establish meaning and term base

- Use English and Simplified Chinese together. If they conflict, Simplified Chinese decides the meaning.
- Identify the game domain: skill, item, UI, quest, dialogue, system message, or tutorial.
- Identify tone: formal, neutral, humorous, combat callout, or narrative.
- Apply a user glossary before general terminology.
- Keep one translation per concept across the batch unless grammar requires a variant.

### 3. Translate every locale

Translate all empty target locales. Never leave a locale blank. A short locale may
repeat meaning or use a concise equivalent; it may not be omitted.

Use natural target-language phrasing. Do not transliterate English syntax. Keep
the functional meaning, tone, and domain terms aligned across locales. Keep
length appropriate for the UI surface when the source implies a constrained slot.

### 4. Protect markup and placeholders

Preserve every BBCode tag and attribute exactly: `[b]`, `[i]`, `[u]`, `[color=...]`,
`[size=...]`, closing tags, and nesting order. Translate only the text between
tags. Preserve placeholders such as `{name}`, `%s`, `{0}`, `<color=...>`, escape
sequences, and line-break tags. Do not translate identifiers or keys.

If markup cannot be preserved without changing meaning, stop and report the row.

### 5. Escape CSV correctly

- Quote every locale field, including the source locales.
- Leave `keys` unquoted unless the key itself requires quoting.
- Double every internal double quote.
- Keep commas inside quotes.
- Preserve real line breaks inside quoted fields; never write a literal `\n`.
- Encode as UTF-8 and do not add a BOM.
- Keep one record per line after quoting; embedded newlines are allowed only when the source field has them.

### 6. Validate before output

Parse the produced CSV again. Check column count, quote balance, duplicate keys,
empty locales, BBCode balance, placeholder parity, and row count. If any check
fails, fix the row and re-run the full check.

### 7. Return only the artifact

For `translate`, output the header and complete CSV rows in one code block. Do
not add commentary, counts, notes, or a summary. For `audit`, output findings
ranked by import risk, then corrected rows or a patch.

## Style rules

- Prefer concise, natural game copy over literal translation.
- Keep terminology consistent across rows and locales.
- Adapt idioms and cultural references without changing function or facts.
- Keep UI strings short enough for their control; flag likely overflow instead of truncating meaning.
- Use formal or informal address consistently per locale and game tone.
- Do not add lore, features, numbers, or claims absent from the source.

## Quality gates

- [ ] Header order matches the active schema exactly.
- [ ] Every row has 14 fields and every locale is non-empty.
- [ ] No key is translated, dropped, duplicated, or reordered.
- [ ] BBCode tags and attributes are unchanged and balanced.
- [ ] Placeholders and escape sequences match the source.
- [ ] CSV quotes and commas parse after re-reading the output.
- [ ] Terminology is consistent within the batch and glossary.
- [ ] Output contains no explanation, log, or statistics.

## Output contract

`translate` returns one CSV code block with the fixed header and all rows.

`audit` returns:

```text
Verdict:
Findings ranked by import risk:
Row and field:
Problem:
Correction:
Unverified items:
```

## Failure handling

Stop and report the exact row when the input has a broken header, an unparseable
quote, a missing key, conflicting source meaning that cannot be resolved, or
markup that cannot be preserved. Do not invent a repaired file silently.
