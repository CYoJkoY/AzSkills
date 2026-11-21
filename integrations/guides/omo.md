# omo

[Back to integrations](../README.md) | [Repository README](../../README.md)

| Field | Value |
| :--- | :--- |
| Connection | Shared skill folders |
| Project target | .agents/skills |
| User target | ~/.agents/skills |
| Automation | managed-copy |
| Detection | target-directory |
| Verification stages | filesystem → client-discovery → invocation |
| Source | https://github.com/code-yeongyu/oh-my-openagent |

## Install

For an interactive setup, run the guided wizard from the AzSkills checkout:

    node scripts/install-skills.ts

The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope.

Install a subset of the catalog into a project skill directory:

    node scripts/install-skills.ts --tool omo --mode project --project /path/to/project --plugin architecture,ui-design

Install every workflow plugin instead:

    node scripts/install-skills.ts --tool omo --mode project --project /path/to/project --all-plugins

Install for the current user instead:

    node scripts/install-skills.ts --tool omo --mode user --plugin architecture

Each selected plugin becomes its own `<skills-root>/<id>/SKILL.md` with its own reference closure, so clients discover them independently. Use --target to choose another skills root, --dry-run to inspect without writing, --rollback to restore the previous run, and --uninstall to remove only manifest-managed plugin directories. Non-interactive writes require --yes after reviewing the preview. The hook plugins no-think-tags and empty-reply are skipped here; install them through the Codex plugin marketplace.

## Use

Start a session and make a request covered by an installed plugin, for example: review this architecture. Each installed plugin is its own entry; module aliases such as frontend-architecture remain prompt and issue vocabulary for the owning plugin.

## Verify

Restart omo and confirm the installed skill is discoverable.


## Remove

Use the manifest-based uninstaller so files not owned by AzSkills are preserved:

    node scripts/install-skills.ts --uninstall --target /path/to/project/.agents/skills
