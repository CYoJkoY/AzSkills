# Plugin catalog migration (3.0.0)

Issue: #85. This document supersedes the single-entry packaging described in
[single entry migration](single-entry-migration.md).

## Why the packaging changed

AzSkills 2.x shipped one `azskills` entry that described eighteen capabilities in
a single sentence and relied on an internal routing table. A shared dispatcher
only activates when a prompt names it or matches that broad description, so many
capabilities were never selected automatically.

3.0.0 turns the repository into a plugin catalog. Each capability is an
independent Codex plugin with its own manifest, skill entry, trigger
description, and reference closure, and each one is matched on its own.

## Catalog registry

| File | Role |
| :--- | :--- |
| `catalog/plugins.json` | Distribution registry: plugin ids, kinds, sources, categories, capabilities, and hook manifests |
| `skills.json` | Canonical module and alias source; unchanged schema 2 |
| `SKILL.md` | Catalog index that lists every plugin and the install entry points |

Module plugin ids equal module ids, so a contract keeps one owner. The two
standalone plugins live under `plugins/<id>/` and ship hook code rather than a
workflow contract.

## Package layout

`node scripts/package-plugin.ts --output <dir>` writes:

```text
<dir>/azskills-marketplace/.agents/plugins/marketplace.json
<dir>/azskills-marketplace/plugins/<id>/.codex-plugin/plugin.json
<dir>/azskills-marketplace/plugins/<id>/skills/<id>/SKILL.md
<dir>/azskills-marketplace/plugins/<id>/references/modules/<id>.md
<dir>/zips/<id>.zip
```

Bundles preserve repository-relative depth, so a contract that links
`../../SKILL-SYSTEM.md` still resolves inside the package. Archives are
deterministic.

## Installer

The installer manifest moves to schema 4 and records `plugins: string[]`.
Schemas 1 (`paths`), 2, and 3 (`skills`) are read and migrated, including the
former single `azskills` directory and the old in-root backup directory.

```sh
node scripts/install-skills.ts --tool codex --plugin architecture,ui-design --yes
node scripts/install-skills.ts --tool codex --all-plugins --yes
node scripts/install-skills.ts --verify --target /path/to/skills
node scripts/install-skills.ts --rollback --target /path/to/skills --yes
node scripts/install-skills.ts --uninstall --target /path/to/skills --yes
```

Skills roots receive one directory per selected workflow plugin. The hook
plugins install only through the Codex plugin marketplace, because their
behavior depends on hook trust, not skill discovery. `--skills` stays a legacy
alias for `--plugin`.

## Hooks

The routing and session hooks are removed. Only two manifests remain for
workflow plugins: `taste` (steering) and `godot-3-dev` (Godot 3.x write guard).
The standalone `no-think-tags` and `empty-reply` plugins carry their own Stop
hooks and can be reviewed and trusted independently.

## MCP

`scripts/azskills-mcp.ts` exposes `azskills://catalog` and
`azskills://plugins/<id>[/<path>]`. Actions are `catalog`, `entry`, `plugin`,
`route`, `module`, and `file`.

## Verification

```sh
npm run typecheck
npm run validate
npm run test
```

The suite proves plugin parity with the module registry, self-contained bundles,
deterministic archives, per-plugin installation with rollback, hook behavior for
both standalone plugins, and MCP catalog access. Client discovery and invocation
still require a connected client and are reported separately.

## Rollback

Repository rollback uses the task commits; no history rewrite or release is part
of this change. Installed copies roll back with the installer snapshot recorded
in the schema 4 manifest.
