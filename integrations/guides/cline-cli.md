# Cline CLI

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .cline/skills |
| User target | ~/.cline/skills |
| Source | https://docs.cline.bot/features/skills |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool cline-cli --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool cline-cli --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Use

Start a session in Cline CLI and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json.

## Verify

Restart Cline and confirm the skill is available to the agent.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.cline/skills
