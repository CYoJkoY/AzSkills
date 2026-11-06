# Kimi Code

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .kimi-code/skills |
| User target | ~/.kimi-code/skills |
| Source | https://moonshotai.github.io/kimi-code/en/customization/skills.md |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool kimi-code --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool kimi-code --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Restart Kimi Code and confirm skills are discoverable.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.kimi-code/skills
