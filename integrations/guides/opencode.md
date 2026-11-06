# OpenCode

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .opencode/skills |
| User target | ~/.config/opencode/skills |
| Source | https://opencode.ai/docs/skills/ |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool opencode --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool opencode --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Run /skills in OpenCode and confirm entries are listed.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.opencode/skills
