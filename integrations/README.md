# Tool integrations

AzSkills connects to AI tools through four honest mechanisms. A native or shared
skills folder is a copied skill contract. An MCP server exposes the same contracts
to clients without a skill folder. Manual import is used only where the vendor
workflow is UI-based or not publicly documented for local files.

| Tool | Mechanism | Default target |
| :--- | :--- | :--- |
| [Codex](guides/codex.md) | Shared skills folder | .agents/skills |
| [Claude](guides/claude-code.md) | Native skill folder | .claude/skills |
| [Claude Desktop](guides/claude-desktop.md) | MCP server | MCP server configuration |
| [Grok Build](guides/grok-build.md) | Native skill folder | .grok/skills |
| [Cursor](guides/cursor.md) | Native skill folder | .cursor/skills |
| [Qoder](guides/qoder.md) | Native skill folder | .qoder/skills |
| [Qoder CN](guides/qoder-cn.md) | Native skill folder | .qoder/skills |
| [WorkBuddy (CN)](guides/workbuddy-cn.md) | Native skill folder | .workbuddy/skills |
| [WorkBuddy AI](guides/workbuddy-ai.md) | Native skill folder | .workbuddy/skills |
| [OpenCode](guides/opencode.md) | Native skill folder | .opencode/skills |
| [Pi](guides/pi.md) | Shared skills folder | .agents/skills |
| [OMP](guides/omp.md) | Shared skills folder | .agents/skills |
| [Hermes](guides/hermes.md) | Native skill folder | .hermes/skills |
| [OpenClaw](guides/openclaw.md) | Native skill folder | skills |
| [Kimi Code](guides/kimi-code.md) | Native skill folder | .kimi-code/skills |
| [gjc](guides/gjc.md) | Native skill folder | .gjc/skills |
| [DSH](guides/dsh.md) | Manual import | Import or attach SKILL.md in the client |
| [MiniMax Code](guides/minimax-code.md) | Native skill folder | .minimax/skills |
| [ZCode](guides/zcode.md) | Native skill folder | .zcode/skills |
| [Command Code](guides/command-code.md) | Native skill folder | .commandcode/skills |
| [Prime Agent](guides/prime-agent.md) | MCP server | MCP server configuration |
| [Aside](guides/aside.md) | MCP server | MCP server configuration |
| [Raycast](guides/raycast.md) | MCP server | MCP server configuration |
| [omo](guides/omo.md) | Shared skills folder | .agents/skills |
| [Cline CLI](guides/cline-cli.md) | Native skill folder | .cline/skills |
| [Kilo](guides/kilo.md) | Native skill folder | .kilo/skills |
| [Factory Droid](guides/factory-droid.md) | Native skill folder | .factory/skills |
| [Gentle Shell](guides/gentle-shell.md) | Shared skills folder | .agents/skills |
| [T3 Code](guides/t3-code.md) | MCP server | MCP server configuration |

## Installer

Start the interactive setup and maintenance wizard:

    node scripts/install-skills.mjs

Or select a client and scope explicitly:

    node scripts/install-skills.mjs --list
    node scripts/install-skills.mjs --tool cursor --mode project --project /path/to/project --skills ui-design,architecture --dry-run
    node scripts/install-skills.mjs --tool cursor --mode project --project /path/to/project --skills ui-design,architecture --yes
    node scripts/install-skills.mjs --rollback --target /path/to/project/.cursor/skills --yes
    node scripts/install-skills.mjs --uninstall --target /path/to/project/.cursor/skills --yes

See [tool installers](../scripts/install-skills.mjs) and the [MCP server](../scripts/azskills-mcp.mjs).
