# Cursor

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .cursor/skills |
| User target | ~/.cursor/skills |
| Source | https://cursor.com/docs/context/skills |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool cursor --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool cursor --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Open Agent chat and inspect available skills or invoke one by name.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.cursor/skills
