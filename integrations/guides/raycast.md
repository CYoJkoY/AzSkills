# Raycast

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | MCP server |
| Project target | MCP server configuration |
| User target | MCP server configuration |
| Automation | guided-mcp |
| Detection | manual |
| Verification stages | mcp-connection → skill-read → invocation |
| Source | https://manual.raycast.com/ai |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.ts

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope.

Run the dependency-free server from the AzSkills checkout:

    node scripts/azskills-mcp.ts

Register it as a stdio MCP server named azskills. Example configuration:

    {
      "mcpServers": {
        "azskills": {
          "command": "node",
          "args": ["<AzSkills>/scripts/azskills-mcp.ts"]
        }
      }
    }

Use the client MCP settings to add the entry, then refresh its tool list.

## Use

After the client connects, call the azskills tool with action catalog to list plugins, action plugin with id to read one plugin entry, or action module and action file to read a contract and its support files. Resources: azskills://catalog and azskills://plugins/<id>[/<path>].

## Verify

Add the MCP server in Raycast AI settings and call azskills with action entry.

Confirm each imported entry reads its own contract and that catalog/plugins.json lists every plugin you installed.

## Remove

Remove the azskills MCP server entry from the client settings and restart the client.
