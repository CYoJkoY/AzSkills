---
name: tool-integration
description: Connect AzSkills to a supported AI client and produce verified install, MCP, or manual setup steps without inventing client capabilities.
version: 2.0.0
status: module
family: operations
modes: [install, configure, troubleshoot, remove]
---

# Tool Integration

Turn a user's target AI client and desired scope into the shortest verified AzSkills setup path. This module owns client selection, setup instructions, and connection verification; it does not own the client's general configuration or change vendor settings without an explicit request.

## Contract

- Use when: a user wants to install, connect, verify, troubleshoot, or remove AzSkills in an AI client.
- Do not use when: the request is to author or improve a capability inside an existing AzSkills Skill.
- Owns: mapping a named client to its registered connection method and safe setup workflow.
- Inputs: client name, project or user scope when known, repository checkout when available, and observed error for troubleshooting.
- Outputs: executable steps or completed local installation, verification result, and recovery/removal instructions.
- Compose with: none; this Skill consults the integration registry and the target client's guide.
- Gates: use only registered mechanisms; preview filesystem writes; verify the connection using the client's actual discovery surface.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| install | A local skill folder is supported | Identify target and scope, preview, install, verify discovery | Installed path and verification result |
| configure | The client uses MCP or manual import | Load its guide, provide client-specific configuration, verify a round trip | Copyable configuration and verification steps |
| troubleshoot | A setup or discovery step failed | Capture exact client, scope, path, command, and error; compare with registry and guide | Root cause and smallest corrective steps |
| remove | The user wants to disconnect AzSkills | Identify the registered target and ownership boundary; use manifest uninstall or remove only the client's MCP entry | Removal result and remaining user-owned configuration |

## Workflow

1. When the AzSkills checkout is available, use the CLI wizard as the executable source of truth: run [0mnode scripts/install-skills.mjs[0m for interactive client selection (user scope by default; pass --mode project for project scope), or pass explicit options in automation. Use [0mnode scripts/install-skills.mjs --list[0m to inspect registered clients and candidate directories. A matching directory is only a detection hint, not proof the client is installed.
2. Resolve the client name against integrations/tools.json. Match aliases case-insensitively only when unambiguous. If the client is not registered, say so and offer the closest documented mechanism without claiming compatibility.
3. Ask only for a missing value that changes the destination: project path versus user-wide install. Default to project scope when the current project is evident; otherwise show both choices briefly.
4. Read the selected guide from the [client guide directory](../../integrations/guides) and check the current repository root. Do not assume the user already has an AzSkills checkout; if absent, give the repository clone command and continue from that path.
5. For native-skills or shared-skills, preview with --dry-run before installation. The installer copies one complete azskills directory, replaces only manifest-owned legacy entries, refuses unmanaged conflicts, and stores rollback snapshots beside the client skills root. Legacy --skills selections all map to the complete bundle.
6. For archive imports, run node scripts/package-skill.mjs --output <directory> to create azskills.zip. Keep the complete archive layout: one public SKILL.md and supporting internal modules. Treat client import as a separate action.
7. For mcp, use the registered server command and documented client configuration location. The server lists one azskills tool and one public resource. Tool actions entry, route, module, and file load content on demand. Edit client settings only when setup is explicitly requested.
8. For manual, follow the guide to import the complete azskills.zip or its extracted azskills folder. Do not describe manual import as automatic installation.
9. Verify in stages: local files/manifest, client discovery, then a minimal skill read or invocation. CLI output must clearly label client-side actions as pending until the actual client confirms them; do not treat copied files as proof of client loading.
10. For troubleshooting, follow the failing stage from path resolution to file presence, client discovery, and invocation. Fix the earliest failed stage and repeat its verification.
11. For removal, use --uninstall to preview and remove manifest-owned skill directories; backups remain available and --rollback restores the preceding operation. MCP setups remove only the AzSkills entry from client settings; manual setups detach the imported files. Preserve unrelated configuration and unmanaged files.

## Quality gates

- [ ] The client ID and mechanism match the current integration registry.
- [ ] The chosen project or user target is explicit before installation.
- [ ] A dry-run precedes filesystem installation and unmanaged paths are preserved.
- [ ] Every write has a preview and explicit confirmation; backups and rollback are available.
- [ ] Verification confirms client discovery or an MCP read operation, not only file presence.
- [ ] Removal names the exact owned directory or MCP entry and preserves unrelated data.

## Output contract

For guidance, return the selected client and mechanism, a short ordered setup sequence, one verification action, and the matching removal path. For performed work, include the exact destination and observed verification result. State any vendor behavior that could not be confirmed from the guide as unverified.

## References

- [Integration overview](../../integrations/README.md) - overview and installer entry point.
- [Integration registry](../../integrations/tools.json) - source of truth for client IDs, mechanisms, and targets.
- [Client guides](../../integrations/guides) - per-client setup details; load only the selected client guide.
- [Installer CLI](../../scripts/install-skills.mjs) - guided native/shared installer, updater, verifier, and rollback manager.
- [Packaging CLI](../../scripts/package-skill.mjs) - deterministic single-entry bundle export.
- [MCP server](../../scripts/azskills-mcp.mjs) - local MCP server interface.
