# Kilo

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .kilo/skills |
| User target | ~/.kilo/skills |
| Source | https://kilocode.ai/docs/features/skills |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool kilo --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool kilo --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart Kilo and confirm the skill is available to the agent.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.kilo/skills
