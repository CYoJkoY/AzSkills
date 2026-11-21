# Tool integrations

AzSkills connects to AI tools through native skills, Codex plugins, MCP servers, and manual import.
AzSkills is a catalog of 10 independent plugins. Skill folders install the workflow plugins individually, the Codex marketplace installs any plugin including the hook plugins, and the MCP server exposes the catalog to clients without a skill folder.
Manual import is used only where the vendor workflow is UI-based or not publicly documented for local files.

| Tool | Mechanism | Default target |
| :--- | :--- | :--- |
| [Codex](guides/codex.md) | Codex plugin marketplace | Codex plugin marketplace |
| [Claude](guides/claude-code.md) | Native skill folders | .claude/skills |
| [Claude Desktop](guides/claude-desktop.md) | MCP server | MCP server configuration |
| [Grok Build](guides/grok-build.md) | Native skill folders | .grok/skills |
| [Cursor](guides/cursor.md) | Native skill folders | .cursor/skills |
| [Qoder](guides/qoder.md) | Native skill folders | .qoder/skills |
| [Qoder CN](guides/qoder-cn.md) | Native skill folders | .qoder/skills |
| [WorkBuddy (CN)](guides/workbuddy-cn.md) | Native skill folders | .workbuddy/skills |
| [WorkBuddy AI](guides/workbuddy-ai.md) | Native skill folders | .workbuddy/skills |
| [OpenCode](guides/opencode.md) | Native skill folders | .opencode/skills |
| [Pi](guides/pi.md) | Shared skill folders | .agents/skills |
| [OMP](guides/omp.md) | Shared skill folders | .agents/skills |
| [Hermes](guides/hermes.md) | Native skill folders | .hermes/skills |
| [OpenClaw](guides/openclaw.md) | Native skill folders | skills |
| [Kimi Code](guides/kimi-code.md) | Native skill folders | .kimi-code/skills |
| [gjc](guides/gjc.md) | Native skill folders | .gjc/skills |
| [DSH](guides/dsh.md) | Manual import | Import or attach SKILL.md in the client |
| [MiniMax Code](guides/minimax-code.md) | Native skill folders | .minimax/skills |
| [ZCode](guides/zcode.md) | Native skill folders | .zcode/skills |
| [Command Code](guides/command-code.md) | Native skill folders | .commandcode/skills |
| [Prime Agent](guides/prime-agent.md) | MCP server | MCP server configuration |
| [Aside](guides/aside.md) | MCP server | MCP server configuration |
| [Raycast](guides/raycast.md) | MCP server | MCP server configuration |
| [omo](guides/omo.md) | Shared skill folders | .agents/skills |
| [Cline CLI](guides/cline-cli.md) | Native skill folders | .cline/skills |
| [Kilo](guides/kilo.md) | Native skill folders | .kilo/skills |
| [Factory Droid](guides/factory-droid.md) | Native skill folders | .factory/skills |
| [Gentle Shell](guides/gentle-shell.md) | Shared skill folders | .agents/skills |
| [T3 Code](guides/t3-code.md) | MCP server | MCP server configuration |

## Installer

Start the interactive setup and maintenance wizard:

    node scripts/install-skills.ts

Or select a client, scope, and plugins explicitly:

    node scripts/install-skills.ts --list
    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin engineering,design --dry-run
    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin engineering,design --yes
    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --all-plugins --yes
    node scripts/package-plugin.ts --output /path/to/fresh/exports
    node scripts/install-skills.ts --rollback --target /path/to/project/.agents/skills --yes
    node scripts/install-skills.ts --uninstall --target /path/to/project/.agents/skills --yes

See [tool installers](../scripts/install-skills.ts), the [plugin packager](../scripts/package-plugin.ts), and the [MCP server](../scripts/azskills-mcp.ts).
