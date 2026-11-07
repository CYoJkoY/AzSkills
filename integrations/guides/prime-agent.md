# Prime Agent

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Automation | guided-mcp |
| Detection | manual |
| Verification stages | mcp-connection → skill-read → invocation |
| Source | https://github.com/PrimeIntellect-ai/prime-agent |

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

After the client connects, ask it to call list_skills, then read_skill with an id such as ultrathink, or search_skills with a task description. The server returns the same SKILL.md text stored in this repository.

## Verify

Configure the MCP stdio server and call the list_skills tool.

Also confirm that a request can read a named skill such as ultrathink.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
