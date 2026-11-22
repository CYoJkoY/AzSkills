---
name: serena
description: Use Serena's MCP tools for semantic code retrieval, symbol-aware edits, refactoring, and navigating a project. Requires Serena installed with uv and an active project.
---

# Serena

Use Serena when a coding task benefits from symbol-aware retrieval or edits across a codebase. It complements ordinary file tools with language-server-backed symbols and project context.

## Setup

Install the upstream CLI with `uv tool install -p 3.13 serena-agent`, then run `serena init` once. The Codex MCP entry starts `serena start-mcp-server --project-from-cwd --context=codex`; ensure the `serena` executable is on the environment PATH seen by Codex. Restart or reload MCP servers after installation.

The project-from-cwd option activates the current workspace as the Serena project. If automatic activation is unavailable, use Serena's `activate_project` tool with the workspace path and read its initial instructions before using other tools.

## Use

- Prefer Serena for symbol discovery, references, semantic search, and coordinated symbol-aware edits.
- Use ordinary repository tools for simple text searches, configuration inspection, or changes that do not need language semantics.
- Keep edits within the requested scope and inspect the resulting diff with the repository's normal review tools.
- Ask Serena to activate the intended project before relying on project-specific tools.

## Troubleshooting

- If Codex cannot start the server, verify `uv tool list`, confirm `serena` is on PATH, and run `serena init`.
- If project tools return no useful context, activate the current project and check that the language-server backend supports the language.
- Follow Serena's official installation and client setup guidance at https://oraios.github.io/serena/.
