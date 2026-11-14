# Claude Desktop

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Automation | guided-mcp |
| Detection | manual |
| Verification stages | mcp-connection → skill-read → invocation |
| Source | https://modelcontextprotocol.io/docs/develop/build-server |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.mjs

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.

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

## Use

After the client connects, call the azskills tool with action entry. Use action route for module selection, action module with id and optional mode to read one contract, or action file with a bundle-relative path to load support files. Discovery lists one tool and one public resource.

## Verify

Add the stdio server in Claude Desktop MCP settings and list AzSkills resources.

Confirm the single azskills entry can read references/routing.md and one selected module.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
