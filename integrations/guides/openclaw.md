# OpenClaw

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | skills |
| User target | ~/.openclaw/skills |
| Source | https://docs.openclaw.ai/tools/skills.md |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool openclaw --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool openclaw --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Verify

Run openclaw skills list and confirm the skill appears.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/skills
