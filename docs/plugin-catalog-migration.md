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

## 6.0.0: writing absorbs resume evidence

`resume-evidence-workflow` was a single-module plugin whose job is writing and
auditing a document against evidence, the same job `writing` already owns. It
now ships inside `writing` as a third member workflow, so one install covers
docs, storefront pages, localization, and resumes. The module keeps its
`career` family and its contract, references, editable HTML asset, and LICENSE;
only the plugin boundary moved.

This is a breaking change to installable IDs: `resume-evidence-workflow` is no
longer a marketplace entry. Install `writing` in its place. The module id and
its modes still route to the owning plugin through the installer and MCP.

Two related proposals were reviewed and decided in the same pass:

- `operations` was not folded into `engineering` in this release. It is the
  opposite of a code style module: `tool-integration` is the client install and
  configuration foundation, and `taste` is a global behavior hook injected at
  SessionStart, UserPromptSubmit, SubagentStart, and PostToolUse. Code taste and
  style already live in `engineering` as the `style` mode of `az-clean-code`.
  This decision was reversed in 7.0.0 at the maintainer's request; see the
  7.0.0 section below.
- `design`, `visual-assets`, and `visual-production` previously declared no
  hooks, so their skills only fired when a prompt matched the plugin
  description. Each now ships a `UserPromptSubmit` hook
  (`codex-plugin/hooks/visual-intent.ts` plus a per-plugin manifest) that matches
  the prompt against that plugin's keywords and injects `additionalContext`
  pointing at its router skill. Keywords stay specific (interface, design
  system, motion; logo, icon, scientific figure; slide, deck, video, HTML
  report) so an unrelated prompt stays untouched. The keyword sets cover
  English and Chinese, because the requests that miss description matching are
  often written in Chinese. The hook is a prompt-time pointer, not a
  dispatcher: it guarantees the router is surfaced, not that the model obeys
  it. Because hooks only run from a plugin install, these three now need the
  marketplace rather than a bare skill folder to get the pointer.

## 7.0.0: engineering absorbs operations

`operations` was a two-module plugin: `tool-integration` (verified client
install and configuration) and `taste` (GPT with Taste behavior). It now ships
inside `engineering` as two more member workflows, so one install covers the
code work, the client setup that connects it, and the judgment that runs it.

Merging the hook manifests is the substantive change. `engineering` previously
declared only the Godot 3.x write guard. Its manifest now also carries the
`taste` steer on `SessionStart`, `UserPromptSubmit`, and `SubagentStart`, and
the agent-result steer on `PostToolUse` after a completed supported local-agent
wait. The Godot guard and the taste steer share one manifest, one trust review,
and one install; every `command` target resolves through `PLUGIN_ROOT` and is
packaged with the plugin, which the packaging test now asserts.

This is a breaking change to installable IDs: `operations` is no longer a
marketplace entry, and `codex-plugin/hooks/taste-hooks.json` plus the
`operations` icon are removed. Install `engineering` in place of `operations`.
The `tool-integration` and `taste` module ids and their modes still resolve to
the owning plugin through the installer and MCP. The `operations` family label
in `skills.json` stays as the domain grouping for `tool-integration`, `taste`,
and `delivery-loop`; only the plugin boundary moved. The release is versioned
7.0.0 because an installable plugin id was retired.

## 7.1.0: third-party MCP plugins

Two upstream tools are now installable catalog entries: `serena`
(https://github.com/oraios/serena) and `rea` (https://github.com/morluto/rea).
Both use the `standalone` kind, which copies `plugins/<id>/` as authored and
only rewrites the manifest version. A source directory keeps their own icon and
MCP manifest intact, which the module kind cannot do: module plugins are
assembled from canonical module contracts and require a generated SVG icon.

Each plugin ships an upstream icon, an MCP server entry, one skill that states
when and how to use the tool, and a third-party notice. `plugins/serena/`
carries the upstream GPL-3.0-or-later and MIT license texts because the Serena
application is GPL-3.0-or-later; `plugins/rea/LICENSE` carries its MIT license.
The MCP entries are `serena start-mcp-server --project-from-cwd --context=codex`
and `npx -y rea-agents@6.10.1 mcp`; users still install the upstream runtime
(`uv tool install -p 3.13 serena-agent` or `npx rea-agents@latest setup`) and
keep it on PATH.

This is additive, so the version moves to 7.1.0. Both plugins install only from
the marketplace: `install-skills.ts` writes skill folders without an MCP
configuration, and `buildPlugin` rejects a skill view for standalone entries.
The packaging test previously asserted the `delivery-loop` hook layout for every
standalone plugin; it now asserts the generic standalone contract instead - a
skill entry, a resolvable `mcpServers` file when the manifest declares one, and
an existing `interface.composerIcon`.

## 7.2.0: delivery loop owns the commit and pull request standard

Installing `delivery-loop` now reads as a standing delegation: issue creation,
branch push, pull request creation, review posting, merge, and branch cleanup run
without a per-action approval question. The guard did not disappear, because it
never asked for permission in the first place; it denies bypasses (a direct
`gh pr merge`, a commit or push on base, a sub-agent spawn), and the documentation
now says so explicitly instead of framing those denials as a request for consent.

The two message standards were prose in `AGENTS.md` and are now enforced code.
`delivery-loop/scripts/message.ts` validates and builds commit messages and pull
request titles and bodies; `azflow commit` is a new command that refuses an empty
index, refuses a ledger that records no static check, runs the ledger's static
checks before writing anything, constructs the message from the staged diff,
rejects a violation, and commits through stdin so bodies keep LF endings. `azflow
init` records those checks from `--check` or detects the `typecheck` and `lint`
scripts, and `--skip-check` is the only way to commit a red tree, so the bypass is
explicit rather than silent. `azflow pr` derives its title from the branch's
earliest commit, validates an override body against the same rules, posts the
recorded review report as the first comment, and `azflow ship` refreshes the body
from the recorded review before merging.

Rules carried over unchanged: ASCII-only text with printable `0x20`-`0x7E` plus
LF, the Conventional Commits type whitelist, a 50-character header target with a
72 hard ceiling, a lowercase verb subject with no trailing period and no `#<id>`,
the `!` and `BREAKING CHANGE:` pair, one `Refs: #<id>` footer, one reviewable
stage per commit, and no vague subjects. Pull request bodies carry exactly five
H2 sections in fixed order, and a failing body states `Round <N> of 5`, which is
now the repair budget in the scoring policy as well, so the body and the review
loop cannot disagree. The `Permission Notice` text changed because the old
template said the merge was an exclusive human privilege and awaited manual merge;
under the new policy the loop merges once the gates pass, so the notice states the
install-time grant and the completed automated review instead.

Messages stay English even in Chinese conversations, which is why the validators
reject non-ASCII rather than transcribing a translated subject. The release is
minor rather than major: the command surface only grows, the ledger schema and the
nine merge gates are untouched, and `autonomy: "manual"` remains the user's
override for a human ship.

4.0.0 made every module its own installable plugin. That fixed hidden
capabilities, but split closely related work into many tiny entries, so a task
that spans one job (for example architecture plus code style, or design systems
plus interface motion) needed several installs and several description matches.

5.0.0 groups modules into eight task-level workflow plugins. Each group answers
one kind of request, so it stays small enough that grouping never hides a
capability behind an unrelated name. Every workflow plugin ships one router
skill that lists its member contracts, so selecting the plugin exposes each
contract inside it. The former `no-think-tags` answer-hygiene entry folded into
`delivery-loop`; 7.6.4 removed its reasoning-tag correction hook, leaving the
delivery guard, dead-loop restart, and goal continuation. 7.7.0 adds allowlist
auto-approval for repeated reads and tests plus bounded self-repair, budget
extension, and done-when verification for long goal runs.

| Plugin | Workflows |
| :--- | :--- |
| `engineering` | architecture, az-clean-code, godot-3-dev |
| `design` | design-system, ui-design, style-presets |
| `visual-assets` | logo-generator, photo-abstract-editorial, scientific-figures |
| `visual-production` | frontend-slides, remotion-production |
| `writing` | document-writing, localization |
| `resume-evidence-workflow` | resume-evidence-workflow |
| `operations` | tool-integration, taste |
| `delivery-loop` | delivery-loop |

Merge points live inside a contract as modes, not as extra plugins: code style
is a mode of `az-clean-code`, motion is a branch of `ui-design`, and README plus
Steam Workshop writing are modes of `document-writing`. Each plugin also carries
its own icon and brand color; `scripts/check-marketplace.ts` rejects a
marketplace whose plugins ship duplicate icons or miss `interface.composerIcon`.

The release is versioned 5.0.0 because plugin IDs changed again. Remove the old
marketplace, add the Git source again, and install the grouped plugins:

```sh
codex plugin marketplace remove azskills
codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git
codex plugin install engineering@azskills
codex plugin install design@azskills
```

The installer and MCP still accept a module id such as `ui-design`, and resolve
it to the owning plugin, so scripts that name an old module keep working.

## 7.8.0: mod script layout

`godot-3-dev` now mandates a four-block function layout for mod scripts, the
scripts that extend a base game script instead of standing alone. In order: the
native functions copied from the base script in base order, the extension
functions that the native functions call, the method helpers, and the signal
handlers wired to `connect()`. No function from a later block sits above an
earlier block, and every function the mod adds is lowercase snake_case.

Names follow the mod name. `MoreStatsContainer` yields `moresc_*` for extension
functions (the first word in full, then the first letter of each later word),
`msc_*` for methods (every word's first letter), and `msc_on_*` for signal
handlers. Native functions keep their base names and bodies, so a diff against
the base stays readable.

The layout is opt-in and machine-checked. A script marks itself with
`# azskills-mod: MoreStatsContainer` before its first function, or the checker
runs with `--mod <name>` across a project that has no markers; a marker always
wins over the flag. The bundled checker reports `MOD_FUNCTION_ORDER`,
`MOD_FUNCTION_NAME`, and `MOD_MARKER_INVALID`, and marker-free scripts keep
their own conventions. The release is minor: no plugin ID, module id, or mode
changed, so an upgrade only refreshes the checkout and the installed plugin.

## 5.0.0: task-level plugins
4.0.0 made every module its own installable plugin. That fixed hidden
capabilities, but split closely related work into many tiny entries, so a task
that spans one job (for example architecture plus code style, or design systems
plus interface motion) needed several installs and several description matches.

5.0.0 groups modules into eight task-level workflow plugins. Each group answers
one kind of request, so it stays small enough that grouping never hides a
capability again:

| Plugin | Workflows |
| :--- | :--- |
| `engineering` | architecture, az-clean-code, godot-3-dev |
| `design` | design-system, ui-design, style-presets |
| `visual-assets` | logo-generator, photo-abstract-editorial, scientific-figures |
| `visual-production` | frontend-slides, remotion-production |
| `writing` | document-writing, localization |
| `resume-evidence-workflow` | resume-evidence-workflow |
| `operations` | tool-integration, taste |
| `delivery-loop` | delivery-loop |

Merge points live inside a contract as modes, not as extra plugins: code style
is a mode of `az-clean-code`, motion is a branch of `ui-design`, and README plus
Steam Workshop writing are modes of `document-writing`. Each plugin also carries
its own icon and brand color; `scripts/check-marketplace.ts` rejects a
marketplace whose plugins ship duplicate icons or miss `interface.composerIcon`.

The release is versioned 5.0.0 because plugin IDs changed again. Remove the old
marketplace, add the Git source again, and install the grouped plugins:

```sh
codex plugin marketplace remove azskills
codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git
codex plugin install engineering@azskills
codex plugin install design@azskills
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
| `resume-evidence-workflow` | `writing` |
| `tool-integration`, `taste` | `engineering` |
| none (new in 5.0.0) | `delivery-loop` |
| `godot-3-dev` | `engineering` |
| `no-think-tags` | folded into `delivery-loop` |

`empty-reply` is retired in this release. Its Stop hook fired after any turn
without visible text, which is normal inside goal mode, so the injected
"continue" message interrupted goal runs instead of helping them. Answer
hygiene moved to `delivery-loop` at that time; 7.6.4 dropped the reasoning-tag
correction there too, because a blocked re-send could not recall text that had
already streamed and the retry cost more than the leak.

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
hook code ships inside the workflow plugin that owns it, so `delivery-loop`
carries its Stop hook as ordinary plugin files rather than as a second entry.

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

Skills roots receive one directory per selected workflow plugin. A skills root
carries no hooks, so install `delivery-loop` through the Codex plugin
marketplace when its guard, dead-loop restart, and goal continuation are wanted, because that
behavior depends on hook trust, not skill discovery. `--skills` stays a legacy
alias for `--plugin`. Selecting a member module id such as `ui-design` installs
its owning plugin (`design`) exactly once.

## Hooks

The shared routing and session hooks are gone; each plugin ships its own
manifest. `engineering` carries the Godot 3.x write guard and the GPT with Taste
steering (SessionStart, UserPromptSubmit, SubagentStart, and the agent-result
PostToolUse steer). `delivery-loop` carries the delivery-state guard, the
dead-loop restart, and the goal-run continuation; since 7.7.0 the guard also
auto-approves repeated reads, tests, a goal's own `--allow` patterns, and a
bounded push of the goal's own task branch, while base-branch writes, force or
tag pushes, and a manual merge still go through the deny rules; the Stop hook
repairs a stalled run within bounds. The reasoning-tag Stop hook is
retired as of 7.6.4; its reply classifier stays under
`delivery-loop/no-think-tags/` only to detect a blank final reply, which now
counts toward the dead-loop restart instead of triggering a re-send.
`design`, `visual-assets`, and `visual-production` carry the `UserPromptSubmit`
visual-intent pointer to their router skill.

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
the delivery-loop guard, the dead-loop restart, and the goal continuation, and
MCP catalog access.
Client discovery and invocation still require a connected client and are
reported separately.

## Rollback

Repository rollback uses the task commits; no history rewrite or release is part
of this change. Installed copies roll back with the installer snapshot recorded
in the schema 4 manifest.
