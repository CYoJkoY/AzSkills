# Automation and guard

The loop automates the issue-to-merge path by default. The user keeps authority
over irreversible and external actions, and the guard enforces the boundary.

## Tool priority

Use the most specific tool that already covers the action, and fall back only when
it fails:

1. Mounted plugins and MCP tools for the domain (repository, search, documents).
2. Dedicated file read and patch tools, routing large payloads through a context
   reducer when one is mounted.
3. The shell, for what no mounted tool can do.

Never reach for `curl`, `wget`, `Invoke-WebRequest`, `gh api`, or a scraping script
when a mounted tool covers the same call, and never state a live fact (release
version, repository state, API shape) from memory when a lookup tool exists. Which
concrete routers are mounted differs per machine and session, so the plugin states
the precedence and the repository names its own tools.

## Command surface

| Command | Effect |
| :--- | :--- |
| `azflow init` | Detect the base branch, write the local ledger, ignore it in git. |
| `azflow add` | Record a task, its touch scopes, dependencies, and issue id. |
| `azflow issue` | Create the issue from a deterministic body, or `--body`/`--body-file`. |
| `azflow pr` | Open the pull request as a draft, linked to the issue, once the branch is pushed. |
| `azflow ready` | Mark the pull request ready for review after local checks pass. |
| `azflow plan` | Print admission waves, blocked tasks, and scope overlaps. |
| `azflow claim` | Create the branch and worktree, then issue a lease. |
| `azflow status` | Show tasks, leases, reviews, and scores. |
| `azflow review` | Require a claimed worktree, scan its real diff, enforce sequential rounds, score the record, and write the report. |
| `azflow ship` | Verify every merge gate, squash-merge, close the issue, sync base. |
| `azflow recover` | Release expired leases and list orphan worktrees. |
| `azflow doctor` | Check node, git, gh auth, ledger, and the current branch. |

Every command accepts `--project <path>` and most accept `--json` for scripting.

`AZFLOW_GH` overrides the `gh` binary, either with another executable or with an
interpreter and a script path. The end-to-end test uses it to run the whole flow
against a local remote.

## Automatic issue and pull request

Inside a task worktree the agent:

1. Runs `azflow issue <task>` to create the issue. The body is generated from the
   task, so no prompt or hand-written template is needed. Pass `--body` or
   `--body-file` to override it.
2. Commits in small stages, one reviewable stage per commit.
3. Pushes the branch and runs `azflow pr <task>`. The pull request opens as a
   draft, linked with `Closes #<issue>`. `azflow pr` refuses a branch the remote
   has not seen, so the pull request always points at pushed code.
4. Runs `azflow ready <task>` once local checks pass, then `azflow review <task>
   --input <review.json> --scan --post` to publish the report. Review derives the
   changed files and head from the claimed worktree, runs the scanner unconditionally,
   and requires round 1 followed by one-step rounds carrying the prior score.
5. Runs `azflow ship <task>` once the review passes.

The pull request is opened by `gh` from the worktree, never from the base branch.

## Merge gates

`azflow ship` refuses unless all of these hold at the same head SHA:

- Review verdict is PASS.
- Review score meets the threshold.
- Reviewed head equals the pull request head.
- CI is green, with no failing or pending check.
- `mergeable` is `MERGEABLE` and the state is not dirty.
- The base branch equals the configured base.
- No blocking label is present.
- The pull request is not a draft.
- Autonomy is `full`.

`--dry-run` evaluates and prints the gates without merging. A failing gate exits
with code 2.

The merge uses `mergeStrategy` from the ledger: `squash` by default, or `merge`
or `rebase`. After merging, `ship` records the task as merged, closes the linked
issue, then fetches and fast-forwards the base branch, so the next task starts
from the merged head.

## Guard

The PreToolUse hook activates only where `.azflow/state.json` exists, so installing
the plugin cannot change an unrelated repository.

It denies:

- `gh pr merge`, which would bypass the gates.
- `git commit` and `git push` while on the base branch.
- `git push` whose refspec targets the base branch or `origin`.
- Any sub-agent spawn tool (`Task`, `Agent`, `spawn_agent`, and variants).

Shell detection matches the tool family, not one name: `Bash`, `shell`,
`exec_command`, `run_command`, `Terminal`, and `PowerShell` all count, and a
`functions.*` or `mcp__*__` prefix is stripped before matching. A harness that
renames its shell tool still gets the same protection.

Escape hatches exist for legitimate exceptions:

| Variable | Effect |
| :--- | :--- |
| `AZFLOW_ALLOW_BASE_WRITES=1` | Permit base-branch commit and push. |
| `AZFLOW_ALLOW_MANUAL_MERGE=1` | Permit `gh pr merge`. |
| `AZFLOW_ALLOW_SUBAGENTS=1` | Permit a sub-agent spawn. |

The guard fails open. A malformed event or a crashed check allows the tool, because
a guard bug must never block unrelated work. The gates in `ship` are the real
enforcement; the hook is a fast, early stop.

## Autonomy

`autonomy: "full"` is the default and enables auto-merge. `autonomy: "manual"`
makes `ship` fail its autonomy gate, which turns auto-merge into a human decision
without changing anything else. Set it in `azflow init --autonomy manual`.
