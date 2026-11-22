# Plugin catalog migration

Issue: #85. This document supersedes the single-entry packaging described in
[single entry migration](single-entry-migration.md).

## Why the packaging changed

AzSkills 2.x shipped one `azskills` entry that described eighteen capabilities in
a single sentence and relied on an internal routing table. A shared dispatcher
only activates when a prompt names it or matches that broad description, so many
capabilities were never selected automatically.

3.0.0 turned the repository into a plugin catalog. 4.0.0 flattened overlapping
workflows into fewer canonical modules and made each module an independent
plugin with its own manifest, skill entry, trigger description, and reference
closure. 5.0.0 keeps that independence per task instead of per module.

## 5.0.0: task-level plugins

4.0.0 made every module its own installable plugin. That fixed hidden
capabilities, but split closely related work into many tiny entries, so a task
that spans one job (for example architecture plus code style, or design systems
plus interface motion) needed several installs and several description matches.

5.0.0 groups modules into eight task-level workflow plugins plus the two hook
plugins. Each group answers one kind of request, so it stays small enough that
grouping never hides a capability behind an unrelated name. Every workflow
plugin ships one router skill that lists its member contracts, so selecting the
plugin exposes each contract inside it.

| Plugin | Workflows |
| :--- | :--- |
| `engineering` | architecture, az-clean-code |
| `design` | design-system, ui-design, style-presets |
| `visual-assets` | logo-generator, photo-abstract-editorial, scientific-figures |
| `visual-production` | frontend-slides, remotion-production |
| `writing` | document-writing, localization |
| `resume-evidence-workflow` | resume-evidence-workflow |
| `operations` | tool-integration, taste |
| `delivery-loop` | delivery-loop |
| `godot-3-dev` | godot-3-dev |

Merge points live inside a contract as modes, not as extra plugins: code style
is a mode of `az-clean-code`, motion is a branch of `ui-design`, and README plus
Steam Workshop writing are modes of `document-writing`. Each plugin also carries
its own icon and brand color; `scripts/check-marketplace.ts` rejects a
marketplace whose plugins ship duplicate icons or miss `interface.composerIcon`.

The release is versioned 5.0.0 because plugin IDs changed again. Remove the old
marketplace, add the Git source again, and install the grouped plugins:

```sh
codex plugin marketplace remove azskills-local
codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git
codex plugin install engineering@azskills-local
codex plugin install design@azskills-local
```

The installer and MCP still accept a module id such as `ui-design`, and resolve
it to the owning plugin, so scripts that name an old module keep working.

## Upgrading from 4.0.0

4.0.0 installable IDs map to 5.0.0 owners as follows. Install the owner, then
uninstall the replaced entry:

| 4.0.0 plugin | 5.0.0 plugin |
| :--- | :--- |
| `architecture`, `az-clean-code` | `engineering` |
| `design-system`, `ui-design`, `style-presets` | `design` |
| `logo-generator`, `photo-abstract-editorial`, `scientific-figures` | `visual-assets` |
| `frontend-slides`, `remotion-production` | `visual-production` |
| `document-writing`, `localization` | `writing` |
| `resume-evidence-workflow` | `resume-evidence-workflow` |
| `tool-integration`, `taste` | `operations` |
| none (new in 5.0.0) | `delivery-loop` |
| `godot-3-dev` | `godot-3-dev` |
| `no-think-tags`, `empty-reply` | unchanged |

Removed module IDs such as `ui-motion`, `readme-craft`, and `steam-mod-page`
remain only as routing aliases in `skills.json`. They resolve for the installer
and MCP, but they are not marketplace entries.

To roll back, remove the marketplace and add the previous marketplace source.
Aliases continue to work for the installer and MCP routing, but they do not
recreate removed installable plugin IDs.

## Catalog registry

| File | Role |
| :--- | :--- |
| `catalog/plugins.json` | Distribution registry: plugin ids, kinds, sources, categories, capabilities, and hook manifests |
| `skills.json` | Canonical module and alias source; unchanged schema 2 |
| `SKILL.md` | Catalog index that lists every plugin and the install entry points |

Every plugin in `catalog/plugins.json` is one installable marketplace entry.
Workflow plugins list their member modules and share one reference closure; the
two standalone plugins live under `plugins/<id>/` and ship hook code rather than
a workflow contract.

## Package layout

`node scripts/package-plugin.ts --output <dir>` writes:

```text
<dir>/azskills-marketplace/.agents/plugins/marketplace.json
<dir>/azskills-marketplace/plugins/<id>/.codex-plugin/plugin.json
<dir>/azskills-marketplace/plugins/<id>/skills/<id>/SKILL.md
<dir>/azskills-marketplace/plugins/<id>/references/modules/<member>.md
<dir>/zips/<id>.zip
```

Bundles preserve repository-relative depth, so a contract that links
`../../SKILL-SYSTEM.md` still resolves inside the package. Archives are
deterministic.

The repository also publishes this built marketplace at
`dist/azskills-marketplace/` and tracks `.agents/plugins/marketplace.json` at
the root with plugin paths that point into that directory. This makes the Git
URL directly consumable by Codex without first cloning and building locally.
`scripts/check-marketplace.ts` verifies the published catalog against
`catalog/plugins.json`.

## Installer

The installer manifest moves to schema 4 and records `plugins: string[]`.
Schemas 1 (`paths`), 2, and 3 (`skills`) are read and migrated, including the
former single `azskills` directory and the old in-root backup directory.

```sh
node scripts/install-skills.ts --tool codex --plugin engineering,design --yes
node scripts/install-skills.ts --tool codex --all-plugins --yes
node scripts/install-skills.ts --verify --target /path/to/skills
node scripts/install-skills.ts --rollback --target /path/to/skills --yes
node scripts/install-skills.ts --uninstall --target /path/to/skills --yes
```

Skills roots receive one directory per selected workflow plugin. The hook
plugins install only through the Codex plugin marketplace, because their
behavior depends on hook trust, not skill discovery. `--skills` stays a legacy
alias for `--plugin`. Selecting a member module id such as `ui-design` installs
its owning plugin (`design`) exactly once.

## Hooks

The routing and session hooks are removed. Only two manifests remain for
workflow plugins: `operations` (GPT with Taste steering) and `godot-3-dev`
(Godot 3.x write guard). The standalone `no-think-tags` and `empty-reply`
plugins carry their own Stop hooks and can be reviewed and trusted
independently.

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
