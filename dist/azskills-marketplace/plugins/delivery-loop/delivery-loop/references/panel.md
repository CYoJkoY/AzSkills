# Panel

A run's state is spread across the ledger, the goal file, the wave plan, and the
drift findings. Reading four files to answer "where is this run?" is slow, and a
run that hides its state is hard to trust. The panel joins that state into one
snapshot and renders it in the Codex side panel, so the same data the loop acts on
is visible at a glance, and the configuration can be edited from a form instead of
a command line.

The panel carries no policy of its own. It reads what the CLI reads and writes
through the same ledger lock, so a panel edit and a CLI edit cannot clobber each
other.

## Snapshot

`scripts/panel.ts` is pure. Callers hand in the goal, the ledger, the worktree
directory names, and a timestamp, and get back a `PanelSnapshot`:

- `goal`: objective, status, iteration and no-progress counters against their
  limits, the done-when criteria, the next step, and the last summary.
- `config`: a copy of the flow configuration, so the form edits a value and not a
  shared reference.
- `tasks`: each task's id, title, status, issue, pull request, and whether it holds
  a live lease.
- `waves`: the dependency waves the current plan would admit, computed with the
  same `planWaves` the planner uses.
- `blocked` and `conflicts`: tasks that cannot enter a wave, and the touch scopes
  that overlap a live lease.
- `drift`: the continuity findings for the same state, so an interrupted task or
  an orphan worktree shows up next to the task it concerns.
- `counts`: total, open, and delivered task counts.

`panelBrief` renders the same snapshot as short text for a terminal, and
`panelHtml` renders it as one self-contained HTML document: the snapshot is
embedded as JSON, the markup escapes `<` so a task title cannot close the script
tag, and the configuration form posts back through the MCP `ui/callTool` channel.

## MCP server

`scripts/azflow-panel.ts` is a stdio MCP server that serves the panel:

- `azflow_panel` with `{"action":"snapshot|brief|html"}` returns the snapshot, the
  brief, or the HTML, and advertises the UI resource in `_meta.ui.resourceUri`.
- `azflow_config` with `{"action":"get"}` or `{"action":"set","patch":{...}}` reads
  or applies configuration, and `{"action":"keys"}` lists the editable keys.
- Resources `ui://azflow/panel.html` and `azflow://snapshot` let a client render
  the panel or read the state as JSON.

The server resolves the project from an explicit `project` argument, then
`AZFLOW_PROJECT`, then an upward search for `.azflow/state.json`, then the current
directory. The bundled `mcp.json` starts it from `${PLUGIN_ROOT}`.

Configuration patches are strict. `applyPanelPatch` refuses an unknown key, an
empty patch, and an out-of-range value, and it never writes `base` or `remote`,
because those are detected, not chosen. Editable keys are `autonomy`,
`mergeStrategy`, `maxParallel`, `reviewThreshold`, `reviewEngine`,
`leaseTtlMinutes`, `checks`, and `allowFrameworks`.

## Command line

The panel also runs without a host:

- `azflow panel` writes `.azflow/panel.html`, prints the brief, and reports the
  path; `--out <path>` writes elsewhere and `--json` prints the snapshot instead.
- `azflow config show` prints the configuration, `azflow config keys` lists the
  editable keys, and `azflow config set <key> <value>` writes one change through
  the ledger lock.

Both commands honor `--project` and the upward project search the other commands
use.

## Sidebar presence

Serving a `ui://` resource is not enough to appear in the Codex App sidebar. The
App reads the tool's `_meta["openai/ui"]` and lists the plugin as a sidebar
destination only when that entry contains `{"type":"global"}`; a tool that
advertises a resource but no entrypoint stays a tool you have to call.

`panelToolMeta()` returns the five keys the App and its MCP host look for, so the
declaration does not depend on one of them surviving a client upgrade:

- `ui`: `{resourceUri, visibility:["app"]}`.
- `ui/resourceUri` and `ui/visibility`: the flat aliases older hosts read.
- `openai/outputTemplate`: the URI a template-aware host resolves first.
- `openai/ui`: `{entrypoints:[{type:"global"}]}`, which is what makes the plugin
  a sidebar destination rather than a plain tool.

The tool also carries `title: "AzFlow"` and an inline SVG icon, so the sidebar
entry has a name and a face instead of a bare id.

Local plugins are installed with `visibleByDefault: false`, so the first install
does not move the user's sidebar. The panel footer says so: pin AzFlow once and
the panel stays open beside the thread. A pin slot is a scarce resource (eight
per user), so the plugin does not claim one on its own.

## What is not verified

The snapshot, the patch validation, and the HTML are unit tested without a
repository or a host, and a stdio handshake test asserts that `tools/list`
returns the app-surface metadata above. Live rendering inside the Codex sidebar
still depends on the installed client resolving the `ui://` resource and pinning
the entry; that end-to-end path is documented here but cannot be exercised from
the test suite.
