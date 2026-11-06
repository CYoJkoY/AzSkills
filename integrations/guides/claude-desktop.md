# Claude Desktop

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Source | https://modelcontextprotocol.io/docs/develop/build-server |

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

Open the Claude Desktop configuration for MCP servers, paste the entry, and restart the app.

## Verify

Add the stdio server in Claude Desktop MCP settings and list AzSkills resources.

Also confirm that a request can read a named skill such as ultrathink.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
