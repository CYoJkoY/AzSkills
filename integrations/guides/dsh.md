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

The wizard detects candidate target directories, asks for user or project scope, lets you choose recommended skills or search the canonical catalog, and previews changes before confirmation.

This client has no verified filesystem skill folder in the repository registry. Import the canonical contract manually:

1. Open the client project or workspace settings.
2. Attach or import Import or attach SKILL.md in the client from this checkout.
3. Keep the imported copy read-only and re-import after updating AzSkills.

## Use

Start a session in DSH and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json. If the client accepts Skill archives, import the generated <id>.zip; otherwise import or point the client at the installed <id>/SKILL.md folder.

## Verify

Start a task and check that the imported instruction is present.

Also confirm that a request can read a named skill such as ultrathink.

## Remove

Detach or delete the imported instruction copy in the client. No repository files are modified.
