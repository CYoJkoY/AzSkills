# DESIGN.md Source Format Matrix

| Source family | Token layer | Typical shape | AzSkills treatment |
|---|---|---|---|
| Google DESIGN.md specification | Optional, normative when present | canonical ordered sections | canonical parser/model |
| HU-UH awesome-design-md | Extended nine-section analysis; examples can be prose-first | theme, colors, typography, components, layout, depth, do/don't, responsive, prompt guide | prose-first evidence adapter |
| VoltAgent awesome-design-md | Representative entries include YAML front matter | extended nine-section analysis plus tokens | mixed/token-rich adapter |
| Project-local custom DESIGN.md | Variable | variable | inspect and classify first |

## Key distinction

Same README taxonomy does not imply the same machine-readable format.

A file without front matter must not be treated as a complete typed token store. A token-bearing file must not be flattened into prose and lose exact values.

## Source authority

Target product or official brand evidence is stronger than a collection README or generic inspiration.

## Preview files

preview.html and preview-dark.html are visual QA aids. They do not override structured token values.

## Responsive information

Responsive guidance describes behavior under constraint. Translate it into per-component compress, wrap, reflow, collapse, scroll, move, or progressive-disclosure behavior.

## Agent Prompt Guide

Treat it as derived convenience material. It never overrides tokens, component rules, source rationale, product constraints, or accessibility requirements.
