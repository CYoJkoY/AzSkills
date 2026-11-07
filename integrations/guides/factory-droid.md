# Factory Droid

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Native skill folder |
| Project target | .factory/skills |
| User target | ~/.factory/skills |
| Source | https://docs.factory.com/harness/skills.md |

## Install

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool factory-droid --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool factory-droid --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run first to inspect the destination.

## Use

Start a session in Factory Droid and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json.

## Verify

Restart Droid and confirm the installed skill is discoverable.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.factory/skills
