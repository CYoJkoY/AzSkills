# Pi

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Shared skills folder |
| Project target | .agents/skills |
| User target | ~/.agents/skills |
| Source | https://github.com/vercel-labs/skills/blob/main/src/agents.ts |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool pi --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool pi --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart Pi and ask it to enumerate available skills.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.agents/skills
