# DSH

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Manual import |
| Project target | Import or attach SKILL.md in the client |
| User target | Import or attach SKILL.md in the client |
| Automation | manual-import |
| Detection | manual |
| Verification stages | manual-import → client-discovery → invocation |
| Source | https://github.com/UNLINEARITY/dsh-code |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.ts

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope.

This client has no verified filesystem skill folder in the repository registry. Export the plugin archives and import the ones you need:

    node scripts/package-plugin.ts --output /path/to/fresh/exports

1. Open the client project or workspace settings.
2. Import the archives from /path/to/fresh/exports/zips using Import or attach SKILL.md in the client as the client import destination; retain all supporting files.
3. Keep the imported copies read-only and re-import after updating AzSkills.

## Use

Start a session and make a request covered by an installed plugin, for example: review this architecture. Each installed plugin is its own entry; module aliases such as frontend-architecture remain prompt and issue vocabulary for the owning plugin.

## Verify

Start a task and check that the imported instruction is present.

Confirm each imported entry reads its own contract and that catalog/plugins.json lists every plugin you installed.

## Remove

Detach or delete the imported instruction copies in the client. No repository files are modified.
