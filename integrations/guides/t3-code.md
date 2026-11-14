# T3 Code

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Automation | guided-mcp |
| Detection | manual |
| Verification stages | mcp-connection → skill-read → invocation |
| Source | https://github.com/pingdotgg/t3code |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.mjs

The wizard detects candidate target directories, asks for user or project scope, lets you choose recommended skills or search the canonical catalog, and previews changes before confirmation.

Run the dependency-free server from the AzSkills checkout:

    node scripts/azskills-mcp.mjs

Register it as a stdio MCP server named azskills. Example configuration:

    {
      "mcpServers": {
        "azskills": {
          "command": "node",
          "args": ["<AzSkills>/scripts/azskills-mcp.mjs"]
        }
      }
    }

Use the client MCP settings to add the entry, then refresh its tool list.

## Use

After the client connects, call list_skills, then read_skill with a canonical id or compatibility alias. Use read_skill_file or the listed resources to load a Skill reference or supporting file by bundle-relative path. search_skills accepts a task description. Bundles include the local files linked by the Skill, and their Markdown links are rewritten to resolve inside the bundle.

## Verify

Configure the MCP server in a supported underlying agent and call list_skills.

Also confirm that a request can read a named skill such as ultrathink.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
