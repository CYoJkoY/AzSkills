# T3 Code

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Source | https://github.com/pingdotgg/t3code |

## Install

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

## Verify

Configure the MCP server in a supported underlying agent and call list_skills.

Also confirm that a request can read a named skill such as ultrathink.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
