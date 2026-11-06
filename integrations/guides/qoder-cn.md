# Qoder CN

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .qoder/skills |
| User target | ~/.qoder/skills |
| Source | https://docs.qoder.com/qoder/skills.md |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool qoder-cn --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool qoder-cn --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart Qoder and confirm the installed skill is discoverable.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.qoder/skills
