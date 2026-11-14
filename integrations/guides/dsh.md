# DSH

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Manual import |
| Project target | Import or attach SKILL.md in the client |
| User target | Import or attach SKILL.md in the client |
| Automation | manual-import |
| Detection | manual |
| Verification stages | manual-import → client-discovery → invocation |
| Source | https://github.com/UNLINEARITY/dsh-code |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.mjs

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.

This client has no verified filesystem skill folder in the repository registry. Import the complete AzSkills bundle manually:

1. Open the client project or workspace settings.
2. Export azskills.zip and import it using Import or attach SKILL.md in the client as the client import destination; retain all supporting files.
3. Keep the imported copy read-only and re-import after updating AzSkills.

## Use

Start a session and ask AzSkills for the desired outcome, for example: Use AzSkills to review this architecture. Import the complete azskills.zip or install the azskills folder. Internal modules and legacy names route within this single entry.

## Verify

Start a task and check that the imported instruction is present.

Confirm the single azskills entry can read references/routing.md and one selected module.

## Remove

Detach or delete the imported instruction copy in the client. No repository files are modified.
