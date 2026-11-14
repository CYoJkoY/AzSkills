# Pi

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Shared skills folder |
| Project target | .agents/skills |
| User target | ~/.agents/skills |
| Automation | managed-copy |
| Detection | target-directory |
| Verification stages | filesystem → client-discovery → invocation |
| Source | https://github.com/vercel-labs/skills/blob/main/src/agents.ts |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.mjs

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool pi --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool pi --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run to inspect without writing, --all-skills as a legacy shorthand for the complete AzSkills bundle, --rollback to restore the previous run, and --uninstall to remove only manifest-managed skill directories. Non-interactive writes require --yes after reviewing the preview.

## Use

Start a session and ask AzSkills for the desired outcome, for example: Use AzSkills to review this architecture. Import the complete azskills.zip or install the azskills folder. Internal modules and legacy names route within this single entry.

## Verify

Restart Pi and ask it to enumerate available skills.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.agents/skills
