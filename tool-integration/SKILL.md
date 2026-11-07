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

1. Resolve the client name against integrations/tools.json. Match aliases case-insensitively only when unambiguous. If the client is not registered, say so and offer the closest documented mechanism without claiming compatibility.
2. Ask only for a missing value that changes the destination: project path versus user-wide install. Default to project scope when the current project is evident; otherwise show both choices briefly.
3. Read integrations/guides/<id>.md and check the current repository root. Do not assume the user already has an AzSkills checkout; if absent, give the repository clone command and continue from that path.
4. For native-skills or shared-skills, first run the installer with --dry-run for the requested tool and scope. Show the resolved destination. After the user asks to install, run the corresponding installer command. Do not copy skills manually or overwrite unmanaged paths.
5. For mcp, provide the exact registered server command and the client's documented configuration location from its guide. Never edit client configuration unless the user explicitly asked for that change.
6. For manual, give the guide's import steps and identify which canonical SKILL.md files to attach. Do not describe it as automatic installation.
7. Verify discovery using the guide's client-specific step. Report observed output only; a successful file copy alone does not prove the client loaded the Skill.
8. For troubleshooting, follow the failing stage from path resolution to file presence, client discovery, and invocation. Fix the earliest failed stage and repeat its verification.
9. For removal, native installs use scripts/install-skills.mjs --uninstall --target <resolved-skill-directory>. MCP setups remove only the AzSkills entry from client settings; manual setups detach the imported files. Preserve unrelated configuration and unmanaged files.

## Quality gates

- [ ] The client ID and mechanism match the current integration registry.
- [ ] The chosen project or user target is explicit before installation.
- [ ] A dry-run precedes filesystem installation and unmanaged paths are preserved.
- [ ] Verification confirms client discovery or an MCP read operation, not only file presence.
- [ ] Removal names the exact owned directory or MCP entry and preserves unrelated data.

## Output contract

For guidance, return the selected client and mechanism, a short ordered setup sequence, one verification action, and the matching removal path. For performed work, include the exact destination and observed verification result. State any vendor behavior that could not be confirmed from the guide as unverified.

## References

- ../integrations/README.md - overview and installer entry point.
- ../integrations/tools.json - source of truth for client IDs, mechanisms, and targets.
- ../integrations/guides/ - per-client setup details; load only the selected client guide.
- ../scripts/install-skills.mjs - safe native and shared skill folder installer.
- ../scripts/azskills-mcp.mjs - local MCP server interface.
