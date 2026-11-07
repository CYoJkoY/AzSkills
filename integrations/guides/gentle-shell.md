# Gentle Shell

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Shared skills folder |
| Project target | .agents/skills |
| User target | ~/.agents/skills |
| Source | https://github.com/Gentleman-Programming/gentle-shell |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool gentle-shell --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool gentle-shell --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Use

Start a session in Gentle Shell and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json.

## Verify

Restart the shell agent and confirm the skill is available.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.agents/skills
