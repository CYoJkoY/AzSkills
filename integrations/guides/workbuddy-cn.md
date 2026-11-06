# WorkBuddy (CN)

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .workbuddy/skills |
| User target | ~/.workbuddy/skills |
| Source | https://workbuddy.tencent.com/ |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool workbuddy-cn --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool workbuddy-cn --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart WorkBuddy and confirm the skill appears in its skills list.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.workbuddy/skills
