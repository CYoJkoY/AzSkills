# ZCode

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .zcode/skills |
| User target | ~/.zcode/skills |
| Source | https://github.com/vercel-labs/skills/blob/main/src/agents.ts |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool zcode --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool zcode --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart ZCode and confirm the skill is discoverable.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.zcode/skills
