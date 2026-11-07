---
name: tool-integration
description: Connect AzSkills to a supported AI client and produce verified install, MCP, or manual setup steps without inventing client capabilities.
version: 1.0.0
status: canonical
family: operations
modes: [install, configure, troubleshoot, remove]
---

# Tool Integration

Turn a user's target AI client and desired scope into the shortest verified AzSkills setup path. This Skill owns client selection, setup instructions, and connection verification; it does not own the client's general configuration or change vendor settings without an explicit request.

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

1. When the AzSkills checkout is available, use the CLI wizard as the executable source of truth: run [0mnode scripts/install-skills.mjs[0m for interactive client, scope, and skill selection, or pass explicit options in automation. Use [0mnode scripts/install-skills.mjs --list[0m to inspect registered clients and candidate directories. A matching directory is only a detection hint, not proof the client is installed.
2. Resolve the client name against integrations/tools.json. Match aliases case-insensitively only when unambiguous. If the client is not registered, say so and offer the closest documented mechanism without claiming compatibility.
3. Ask only for a missing value that changes the destination: project path versus user-wide install. Default to project scope when the current project is evident; otherwise show both choices briefly.
4. Read integrations/guides/<id>.md and check the current repository root. Do not assume the user already has an AzSkills checkout; if absent, give the repository clone command and continue from that path.
5. For native-skills or shared-skills, run --dry-run first to inspect the destination. The installer previews every write and requires confirmation; unattended runs must pass --yes only after the preview has been reviewed. It refuses unmanaged skill paths, updates only manifest-owned skills, and saves a backup for rollback. The default set is recommended; use --skills <id,...>, --all-skills, or the interactive search prompt to customize.
6. For mcp, provide the exact registered server command and the client's documented configuration location from its guide. Do not infer configuration paths or edit client settings unless a client-specific config adapter is registered and the user explicitly requested setup.
7. For manual, give the guide's import steps and identify which canonical SKILL.md files to attach. Do not describe it as automatic installation.
8. Verify in stages: local files/manifest, client discovery, then a minimal skill read or invocation. CLI output must clearly label client-side actions as pending until the actual client confirms them; do not treat copied files as proof of client loading.
9. For troubleshooting, follow the failing stage from path resolution to file presence, client discovery, and invocation. Fix the earliest failed stage and repeat its verification.
10. For removal, use --uninstall to preview and remove manifest-owned skill directories; backups remain available and --rollback restores the preceding operation. MCP setups remove only the AzSkills entry from client settings; manual setups detach the imported files. Preserve unrelated configuration and unmanaged files.

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

- ../integrations/README.md - overview and installer entry point.
- ../integrations/tools.json - source of truth for client IDs, mechanisms, and targets.
- ../integrations/guides/ - per-client setup details; load only the selected client guide.
- ../scripts/install-skills.mjs - guided native/shared installer, updater, verifier, and rollback manager.
- ../scripts/azskills-mcp.mjs - local MCP server interface.
