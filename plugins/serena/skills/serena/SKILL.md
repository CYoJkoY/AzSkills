---
name: serena
description: Use Serena's MCP tools for semantic code retrieval, symbol-aware edits, refactoring, and project navigation. Requires Serena installed with uv and an active project.
---

# Serena

Use Serena when a coding task benefits from language-server-backed symbols:
finding a definition, tracing references, renaming a symbol, or refactoring
across files. It complements ordinary file tools with semantic, project-aware
operations that plain text search cannot match.

This skill is the router. The installed Serena hook points here when a prompt
looks like semantic code-intelligence work. Open this file, then follow the
steps below instead of guessing at tool names.

## Preflight

1. Install the upstream CLI with `uv tool install -p 3.13 serena-agent`, then
   run `serena init` once.
2. Confirm the Codex MCP entry starts
   `serena start-mcp-server --project-from-cwd --context=codex` and that the
   `serena` executable is on the PATH seen by Codex. Reload MCP servers after
   installing.
3. Prefer project-from-cwd for the active workspace. If automatic activation
   is unavailable, call `activate_project` with the workspace path and read
   Serena's initial instructions before using other tools.
4. State the semantic question: which symbol, reference set, or cross-file
   flow must be resolved.

## Capability map

| Situation | Use | Evidence to report |
| --- | --- | --- |
| Find a definition or symbol | symbol lookup and definition tools | file path, symbol, line range |
| Trace usages | find-references | each reference site and its enclosing symbol |
| Rename a symbol | symbol-aware rename | changed files and the resulting diff |
| Refactor across files | coordinated symbol edits | each touched symbol and file |
| Understand a call flow | semantic search plus reference walk | ordered call path across files |
| Mass repeated pattern edit | symbol enumeration plus targeted patch | the symbol list and per-site diffs |
| Code review of one symbol family | reference sweep before edits | sites that the change may affect |
| Simple text or config match | ordinary grep/read, not Serena | why semantics were not needed |

## Workflows

### Symbol investigation
1. Activate the intended project.
2. Resolve the symbol to its definition and record the exact location.
3. Enumerate references and group them by enclosing function or module.
4. Report the definition, the reference sites, and any unresolved calls.

### Safe rename
1. Resolve the symbol and confirm it is the intended one.
2. List references first; check for dynamic or string-based uses Serena cannot
   see.
3. Apply the symbol-aware rename.
4. Inspect the resulting diff and confirm only intended sites changed.
5. Summarize changed files and any sites that need manual follow-up.

### Cross-file refactor
1. State the target shape before editing.
2. Map the affected symbols and their reference graph.
3. Make minimal coordinated edits, one logical change at a time.
4. Verify with the project's own build or tests when available.

### Pattern sweep
1. Enumerate every symbol that carries the pattern.
2. Order the sites so each edit stays independently reviewable.
3. Patch each site through the symbol-aware tools.
4. Diff the whole change and confirm no site was skipped.

### Navigation fallback
1. If Serena cannot resolve a symbol, fall back to bounded text search.
2. Label the result as textual, not semantic, so the weaker evidence is clear.
3. Return to Serena once the language backend can resolve the symbol.

## Evidence and editing rules

- Prefer Serena for symbol discovery, references, semantic search, and
  coordinated edits; use ordinary repository tools for trivial text matches.
- Keep edits within the requested scope and review the diff with the
  repository's normal review tools.
- Cite file path, symbol, and line range for semantic claims.
- Never claim a rename or refactor is complete without inspecting the diff.
- Do not run destructive or mass rewrites without explicit user approval.

## Degradation

- If Serena MCP tools are unavailable, do bounded text inspection only and
  say semantic analysis was not performed. Do not imply symbol-level
  correctness.
- If project activation fails, stop relying on project-specific tools and
  report the activation error.
- If the language backend does not support the language, limit work to
  read-only triage and say which operations were unavailable.

## Output contract

Close with:
- Project: the activated workspace.
- Question: the symbol, reference set, or flow investigated.
- Findings: semantic facts with file path, symbol, and line range.
- Changes: files and symbols edited, with diff review status.
- Unresolved: dynamic uses, unsupported languages, or activation gaps.
- Next step: the smallest action that would close what remains open.

## Troubleshooting

- Codex cannot start the server: verify `uv tool list`, confirm `serena` is on
  PATH, and run `serena init`.
- Project tools return little context: activate the current project and check
  the language-server backend for the language in use.
- Stale symbols after large edits: re-index or reopen the project.
- Current setup and client guidance: https://oraios.github.io/serena/.
