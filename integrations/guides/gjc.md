# gjc

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .gjc/skills |
| User target | ~/.gjc/agent/skills |
| Source | https://github.com/Yeachan-Heo/gajae-code |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool gjc --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool gjc --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Use

Start a session in gjc and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json.

## Verify

Run /skill:<name> or inspect the session skills catalog.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.gjc/skills
