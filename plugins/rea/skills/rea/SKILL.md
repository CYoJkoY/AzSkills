---
name: rea
description: Reverse engineer applications, JavaScript bundles, and native binaries with REA's CLI and MCP tools. Use when investigating implementation behavior, binary structure, or recovered source.
---

# REA

Use REA for reverse-engineering tasks that need structured analysis of an application, JavaScript bundle, or native binary. REA provides a CLI and MCP server and can connect analysis providers such as Hopper, Ghidra, IDA, or Kuna.

## Setup

Install Node.js compatible with `rea-agents` and run `npx rea-agents@latest setup` to register REA with supported agents and install its matching workflow instructions. The bundled Codex MCP configuration uses the official npm MCP entry point, pinned to `rea-agents@6.10.1`.

Native analysis may require an existing provider installation. Static JavaScript analysis does not require a native analysis engine. Do not assume a provider is installed or authorize optional software installation without user approval.

## Use

- Begin by identifying the target application, binary, bundle, and the behavior or question to investigate.
- Use REA's MCP tools to inspect the target and trace relevant implementation details; use the CLI for explicit workflows such as JavaScript application analysis.
- Ground conclusions in tool output and distinguish observed behavior from inferred behavior.
- Preserve target files; do not patch or execute analyzed artifacts unless the user explicitly requests it and the action is safe.
- Review REA's generated findings and verify consequential conclusions independently when possible.

## Troubleshooting

- If MCP does not start, verify Node.js and npm are available to Codex, then run `npx rea-agents@latest setup` and reload the client.
- If native analysis is unavailable, check the selected provider and its local installation; JS bundle analysis can run without one.
- Consult https://rea.tools/ and https://github.com/morluto/rea for current installation, supported targets, and provider requirements.
