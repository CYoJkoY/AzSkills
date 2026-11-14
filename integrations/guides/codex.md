# Codex

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Shared skills folder |
| Project target | .agents/skills |
| User target | ~/.agents/skills |
| Automation | managed-copy |
| Detection | target-directory |
| Verification stages | filesystem → client-discovery → invocation |
| Source | https://developers.openai.com/codex/skills |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.mjs

The wizard detects candidate target directories, asks for user or project scope, lets you choose recommended skills or search the canonical catalog, and previews changes before confirmation.

From the AzSkills checkout, install into a project skill directory:

    node scripts/install-skills.mjs --tool codex --mode project --project /path/to/project

Install for the current user instead:

    node scripts/install-skills.mjs --tool codex --mode user

Use --target to place the skill folder somewhere other than the default target. Use --dry-run to inspect without writing, --all-skills to install every canonical Skill, --rollback to restore the previous run, and --uninstall to remove only manifest-managed skill directories. Non-interactive writes require --yes after reviewing the preview.

## Use

Start a session in Codex and describe the task. To force a specific contract, name it and its mode, for example: Use ultrathink in deep mode to challenge this design. The canonical ids and modes are listed in skills.json. If the client accepts Skill archives, import the generated <id>.zip; otherwise import or point the client at the installed <id>/SKILL.md folder.

## Verify

Ask Codex to list available skills after restarting the session.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.mjs --uninstall --target /path/to/project/.agents/skills
