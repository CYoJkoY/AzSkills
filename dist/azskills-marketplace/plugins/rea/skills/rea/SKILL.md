---
name: rea
description: Reverse engineer applications, JavaScript bundles, and native binaries with REA's CLI and MCP tools. Use for implementation behavior, binary structure, or recovered source.
---

# REA

Use REA when a task needs structured reverse engineering of an application,
a JavaScript bundle, or a native binary: recovering behavior, symbols, or
source-level intent. REA ships a CLI plus an MCP server and can drive native
analysis providers such as Hopper, Ghidra, IDA, or Kuna.

This skill is the router. The installed REA hook points here when a prompt
looks like reverse-engineering work. Open this file, then follow the steps
below instead of guessing at tool names.

## Preflight

1. Identify the target: the app, bundle, APK, or binary path, and its format
   (JavaScript bundle, native executable, shared library, or unknown).
2. State the question in one sentence: which behavior, symbol, control flow,
   or data structure must be recovered.
3. Confirm prerequisites. Node.js and npm must be available. Run
   `npx rea-agents@latest setup` once to register REA and install its matching
   workflow instructions.
4. Note whether a native provider is installed. Static JavaScript analysis
   does not need one; disassembly and decompilation do.
5. Preserve the artifact. Analyze a copy when the target is precious, and do
   not modify or execute it unless the user explicitly asks.

## Capability map

| Situation | Use | Evidence to report |
| --- | --- | --- |
| JavaScript bundle or Electron app | REA JS analysis and beautify/map tools | file path, module, function, byte or line offset |
| Native binary behavior | provider disassembly and decompile | symbol, address range, call graph edge |
| APK or mobile package | unpack, then static inspection | package, class, method, string reference |
| Obfuscated or packed app | unpack or deobfuscate first, then re-map | the deobfuscation step used and its output path |
| Dynamic behavior question | instrumentation only when approved | the exact hook or trace and its output |
| Unknown detail, no provider | static strings and imports only | what was observed vs. what remains unresolved |
| Confirmation of a finding | re-run the smallest query that produced it | exact command and reproduced output |

## Workflows

### Behavior trace
1. Restate the behavior under investigation and the entry point.
2. Locate the entry symbol with REA or the provider.
3. Walk outward one call edge at a time, recording file and symbol per hop.
4. Stop at a boundary you cannot resolve and label it explicitly.
5. Summarize the traced path as observed facts, not narrative guesses.

### Bundle recovery
1. Confirm the bundle is JavaScript and note its build form.
2. Use REA's JS tooling to beautify and index modules.
3. Map the requested behavior to the owning module and function.
4. Extract only the code needed to answer the question.
5. Report recovered symbol names and where they came from.

### Native triage
1. Identify architecture, format, and entry point.
2. List imports and exports to orient the analysis.
3. Use the installed provider for disassembly or decompilation.
4. Follow a bounded call path toward the target behavior.
5. Record addresses and symbol names for every claim.

### APK inspection
1. Unpack the package and note the manifest and entry activity.
2. Locate the classes and native libraries involved.
3. Trace the requested behavior through the relevant classes.
4. Record package, class, and method names as evidence.

## Evidence and safety

- Ground every conclusion in tool output. Separate observed, inferred, and
  unresolved findings, and say which is which.
- Cite concrete anchors: paths, symbols, offsets, addresses, or call edges.
- Never patch, rebuild, or run the analyzed artifact unless the user asks and
  the action is clearly safe.
- Do not expose secrets, keys, or credentials found during analysis; redact
  them and note where they were located.
- Do not install optional native providers without user approval.

## Degradation

- If REA MCP tools are unavailable, stop claiming REA analysis. Verify
  `npx rea-agents@latest setup`, then reload the client. Do not fabricate
  decompiled output from memory.
- If no native provider is installed, limit work to static JavaScript and
  string/import triage, and say that disassembly was not performed.
- If the target format is unsupported, report the blocked step and the reason
  instead of substituting a weaker claim.

## Output contract

Close with:
- Target: what was analyzed and its format.
- Question: the behavior or symbol investigated.
- Findings: observed facts with anchors.
- Inferred: conclusions that depend on interpretation.
- Unresolved: boundaries, gaps, or missing providers.
- Next step: the smallest action that would resolve what remains open.

## Troubleshooting

- MCP does not start: confirm Node.js and npm are on the PATH seen by Codex,
  re-run `npx rea-agents@latest setup`, then reload the client.
- Native analysis unavailable: check the selected provider and its local
  installation; JS bundle analysis still works without one.
- Stale results: re-run the smallest query to confirm the current artifact.
- Current setup and provider details: https://rea.tools/ and
  https://github.com/morluto/rea.
