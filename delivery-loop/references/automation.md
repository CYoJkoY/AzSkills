# Automation and guard

The loop automates the issue-to-merge path end to end. Installing the plugin is the
delegation: the user hands over issue creation, branch push, pull request
creation, review posting, merge, and branch cleanup as one standing grant. The
agent runs that path without asking for per-action permission, and the guard
enforces the boundary that keeps the loop honest rather than the boundary that
returns decisions to the user.

The grant covers actions inside the loop. It does not cover deleting unrelated
work, rewriting history, or changing a repository that has no ledger: those are
outside the loop, and the plugin never touches them.

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
| `azflow init` | Detect the base branch, record the static check commands, write the local ledger, ignore it in git. |
| `azflow add` | Record a task, its touch scopes, dependencies, and issue id. |
| `azflow issue` | Create the issue from a deterministic body, or `--body`/`--body-file`. |
| `azflow commit` | Run the recorded static checks, validate a Conventional Commit message against the staged stage, then commit it. Refuses to add a stage until the current head has a stage record. |
| `azflow pr` | Open the pull request as a draft with a derived title and a five-section body, linked to the issue, once the branch is pushed. Refuses any unscored branch commit. |
| `azflow ready` | Mark the pull request ready for review after local checks pass. |
| `azflow plan` | Print admission waves, blocked tasks, and scope overlaps. |
| `azflow claim` | Create the branch and worktree, then issue a lease. |
| `azflow status` | Show tasks, leases, reviews, and scores. |
| `azflow review-open` | Open a short-lived review window that lets EGM reviewers spawn for one task at one head. See [egm-review.md](egm-review.md). |
| `azflow review` | Require a claimed worktree, an open review window, and an EGM attestation from a fresh `--reviewer` that is not the implementer; scan the real diff, enforce sequential rounds, score the stage, write the report, and delete the window. |
| `azflow ship` | Restore `Closes #<issue>` in the body when it drifted, verify every merge gate, merge, close the issue, verify it reads `CLOSED`, sync base. A dry run predicts the repair without writing it. `--verify-issue` finishes a merge whose issue stayed open. |
| `azflow recover` | Release expired leases and list orphan worktrees. |
| `azflow doctor` | Check node, git, gh auth, ledger, current branch, review engine, the `egm` plugin, and that every active branch has a linked issue. |
| `azflow goal` | Drive one long-horizon objective across turns without Goal mode. See [goal-run.md](goal-run.md). |

Every command accepts `--project <path>` and most accept `--json` for scripting.

`AZFLOW_GH` overrides the `gh` binary, either with another executable or with an
interpreter and a script path. The end-to-end test uses it to run the whole flow
against a local remote.

## Automatic issue and pull request

The agent runs this path without asking for permission at any step:

1. Runs `azflow claim <task>`, which creates the branch and worktree and also
   opens the task's issue when the ledger has none. The issue body is generated
   from the task, so no prompt or hand-written template is needed; `--issue <n>`
   attaches an existing tracker issue and `--no-issue` leaves the task unlinked on
   purpose. The issue exists before the first commit because every commit footer
   cites it, and `azflow pr` and `azflow ship` open one too if a repair run
   reached them with no issue, so a pull request is never left closing nothing.
2. Commits in small stages through `azflow commit <task>
   --type <type> --scope <scope> --subject "<subject>"`, one reviewable stage per
   commit. The command refuses an empty index, refuses a ledger that records no
   static check, runs the recorded checks on the worktree, refuses a message that
   breaks the standard below, and commits through stdin so the body keeps LF
   endings. It also refuses to record a new stage while the current head has no
   stage record, so every commit is scored before the next one lands.
3. Runs the project's own verification before anything leaves the worktree, so the
   recorded result is green rather than hopeful. Commit the last stage first: a
   review scores the head that exists at review time, so a stage committed after it
   makes its own green run stale.
4. Pushes the branch, runs `azflow review-open <task>` so the guard permits the
   reviewers to spawn, and launches the Elephant-Goldfish reviewers in fresh
   contexts (`fork_context: false`) against the diff. It then runs
   `azflow review <task> --input <review.json> --reviewer <fresh id> --scan` with
   `engine: "egm"` and one attestation per reviewer. The review derives the changed
   files and head from the claimed worktree, runs the scanner unconditionally,
   requires round 1 followed by one-step rounds that carry the prior score, and
   rejects a self review or a round with no attested fresh-context reviewer.
5. Runs `azflow pr <task>`. The pull request opens as a draft, linked with
   `Closes #<issue>`, with a title and body derived from the branch commits and the
   recorded review, and the report is published as the first comment. `azflow pr`
   refuses a branch the remote has not seen, refuses a branch with no commit ahead
   of base, refuses any branch commit without a stage record, and refuses to open
   until a passing review round with a green verification is on record.

Opening the pull request means "this stage is ready to be read", so the checks run
first and the review is on record before it exists. The draft flag is not a reason
to skip them; it only keeps merge off until `ready`. `--allow-unverified` is the
escape for a pull request wanted earlier, and the draft then carries the review's
own gaps as blocking issues.
6. Runs `azflow ready <task>` to take the pull request out of draft.
7. Repairs if needed until the head scores strictly above 4.80: run the checks,
   commit the fix, then `azflow review-open <task>` again for the new head, run the
   reviewers in fresh contexts, and score the next round with a new
   `--reviewer <fresh id>` plus `--input <review.json> --scan --post`, then
   `azflow ready <task>`. Each repair is scored on its own stage, and `ship` still
   compares the reviewed head with the pull request head, so a fix without a new
   round does not merge.
8. Runs `azflow ship <task>` once the head passes. After the merge it closes the
   linked issue, re-reads it, and exits 1 if it is not `CLOSED`.

The pull request is opened by `gh` from the worktree, never from the base branch.

## Commit standard

`azflow commit` owns the message format, so a commit cannot drift from the
repository contract. The same rules apply when a message is passed explicitly.

- ASCII only: printable `0x20`-`0x7E` plus real LF. No CJK, full-width
  punctuation, emoji, zero-width characters, and no literal `\n` or `\r\n`.
- Header shape: `<type>(<scope>)[!]: <imperative subject>`. Allowed types are
  `feat`, `fix`, `refactor`, `perf`, `test`, `build`, `ci`, `docs`, `chore`.
  The subject starts with a lowercase verb, carries no trailing period, and never
  contains `#<id>`; the issue lives in the footer, not the header.
- Header length: 50 characters is the target, 72 is the hard ceiling. Body lines
  stay at or under 72 characters.
- Breaking changes pair the marker with the footer: a `!` before the colon
  requires a `BREAKING CHANGE:` line, and a `BREAKING CHANGE:` line requires the
  `!`. One without the other is rejected.
- Footer: exactly one `Refs: #<issue-id>` matching the task issue. Using `Refs`
  instead of `Closes` keeps multi-stage commits from closing the issue before the
  pull request merges.
- Atomicity: one reviewable stage per commit, no mixed types, and no vague
  wording such as `update files`, `misc fixes`, or `wip`.
- Precondition: an empty index, a failing static check, or an undeclared contract
  break means no message is produced and no commit is created.
- Static checks: `azflow init` records the commands to run before every commit.
  `--check "<cmd>"` (repeatable) sets them explicitly; otherwise a repository that
  names `typecheck` or `lint` in `package.json` gets `npm run typecheck` and
  `npm run lint` automatically. Add syntax or build commands to the same list when
  the project needs them. A ledger that records no check at all refuses every
  commit, because an empty list is not evidence of a green tree. `--skip-check` is
  the explicit, visible escape for a stage that cannot run them, such as a
  docs-only change in a repository whose checks need a native toolchain.

## Pull request standard

`azflow pr` derives the title from the earliest commit on the branch, because that
commit already passed the commit standard. An explicit `--title` is validated
against the same rules, and a `--body` or `--body-file` override must keep the
required structure.

- ASCII only, with real multi-line newlines.
- Title: `<type>(<scope>)[!]: <concise imperative summary> (#<id>)`, under 72
  characters, lowercase type and summary, no trailing period.
- Body: exactly these five H2 sections, in this order, with no extra headings:
  `Linked Issue`, `Change summary`, `Verification & Dependencies`,
  `Review conclusion`, `Permission Notice`.
- `Change summary` lists the real commits with short hashes and states the
  behavioral guarantees; `Verification & Dependencies` records the exact commands
  run, the runtime assertions, and any unverified external fact;
  `Review conclusion` carries the four dimensions and the verdict.
- `Blocking issues:` and `Active iteration: Round <N> of <maxRounds>` appear only
  while the verdict is FAIL, and are removed from a passing body. The budget is
  read from the scoring policy, so it cannot drift from the number of rounds the
  loop actually allows.
- `Permission Notice` states that the agent completed development and automated
  review under the install-time grant, and that the merge itself is performed by
  the loop after every gate passes. It does not hand the merge back to the user.
- `azflow ship` refreshes the body from the recorded review before merging, so the
  merged pull request describes the review that actually passed.

## Merge gates

`azflow ship` refuses unless all of these hold at the same head SHA:

- Review verdict is PASS.
- The pull request body carries `Closes #<issue>` for the task issue (`issue-linked`).
- Every branch commit has a stage record, and the head stage is PASS with a score
  strictly above 4.80 (`stage-reviews`).
- The review is EGM-attested and names a reviewer that differs from the
  implementer (`reviewer-independent`).
- Review score is strictly above the threshold; an exact 4.80 fails
  (`review-score`).
- Reviewed head equals the pull request head (`review-head`).
- CI is green, with no failing or pending check.
- `mergeable` is `MERGEABLE` and the state is not dirty.
- The base branch equals the configured base.
- No blocking label is present.
- The pull request is not a draft.
- Autonomy is `full`.

A failing gate exits with code 2, and it does so under `--dry-run` too: a preflight
reports the same non-zero status, so CI cannot read a clean dry-run exit as a
mergeable pull request.

The merge uses `mergeStrategy` from the ledger: `squash` by default, or `merge`
or `rebase`. The merge cannot be undone, so `ship` closes the linked issue and
re-reads it with `gh issue view --json state` before it records the delivery. When
the issue is not `CLOSED` after one retry, the task lands in the distinct status
`merged-issue-open` and `ship` exits 1. Rerun `azflow ship <task> --verify-issue`
once the issue can close; that command repairs only that one status, proving the
issue reads `CLOSED` before it moves the task to `merged`. Any other status has to
pass the full gate list again, so a merge can never be replayed from that path.
After a clean merge `ship` fetches and fast-forwards the base branch, so the next
task starts from the merged head.

## Push and cleanup

The loop owns the branch lifecycle end to end, so it never asks the user whether
to push or whether to tidy up.

- Push the task branch without asking. `azflow pr` already refuses a branch the
  remote has not seen, so pushing is part of opening the pull request, not a
  separate decision to confirm.
- After `azflow ship` merges, delete the local task branch and return to the base
  branch without asking. Most repositories enable delete-on-merge for the remote
  branch, so the local branch is stale the moment the merge lands. Check out the
  base branch, delete the task branch, then fetch and fast-forward.
- Run the cleanup from outside the task worktree. Git refuses to delete a branch
  that is still checked out in a worktree, so remove the worktree first
  (`recover --force`) or run the cleanup from the main checkout.
- The guard still applies. The cleanup runs on the base branch, but it is a
  checkout, a branch delete, a fetch, and a fast-forward, never a commit or push
  on base, and those stay denied.
- Recovery is a different path: `azflow recover` never deletes a branch, because
  an interrupted task may still be resumed. Only a successful merge authorizes
  deleting the task branch, and only after `ship` recorded the merge.

## Guard

The PreToolUse hook activates only where `.azflow/state.json` exists, so installing
the plugin cannot change an unrelated repository.

The guard exists to stop a bypass of the gates, not to collect approval. A denial
means "this action would skip review or contaminate the base branch", never "ask
the user whether to continue".

It denies:

- `gh pr merge`, which would bypass the gates.
- `gh pr create` and `gh issue create` inside a delivery project, so the linked
  issue and pull request are only made by `azflow`. `AZFLOW_ALLOW_GH_CREATE=1` is
  the visible escape when a hand-made pull request is genuinely wanted.
- `git commit` and `git push` while on the base branch.
- `git push` whose refspec targets the base branch or `origin`.
- Any sub-agent spawn tool (`Task`, `Agent`, `spawn_agent`, and variants), except
  while a review window opened by `azflow review-open` is live for the current
  head. The window is the only sanctioned path; every other spawn is denied.

The branch a call is judged against is the branch it really targets: the guard
resolves `git -C <dir>` and a leading `cd <dir> && git`, and it caches the branch
per directory. A push with an explicit `src:dst` refspec is checked on `dst`, so a
worktree push is allowed even while the session sits on the base branch, and a
`git -C <worktree> push origin main` is caught instead of slipping past.

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

The review window is the normal path for an EGM review and does not need the
override. The override stays for a deliberate, non-review spawn; it is not a
shortcut around the attestation, which `azflow review` still checks.

The guard fails open. A malformed event or a crashed check allows the tool, because
a guard bug must never block unrelated work. The gates in `ship` are the real
enforcement; the hook is a fast, early stop.

## Autonomy

`autonomy: "full"` is the default and enables auto-merge. `autonomy: "manual"`
makes `ship` fail its autonomy gate, which turns auto-merge into a human decision
without changing anything else. Set it in `azflow init --autonomy manual`.

## Long-horizon goal run

One objective can outlast a single turn or a single context window. zflow goal
drives that run without Codex Goal mode: it keeps the objective, the done-when
criteria, and the next step in .azflow/goal.json, and the Stop hook blocks a
clean stop while the goal is active and work remains. The block reason is the
whole compass re-injected from disk, so a compacted session is re-grounded in the
goal rather than a faded memory of it, and a SessionStart hook injects the same
compass when a session opens or resumes.

Progress is measured from real state - the base HEAD and working tree, the
ledger, and every live worktree - never from the model saying it advanced. A run
that keeps talking but never changes the repository stalls itself, and a pass
budget pauses the run before it can spin. These guards run after the loop guard,
so a dead or repeated reply is corrected first. A goal needs no ledger and a
ledger needs no goal; when both exist the next step is read from the ledger.
Nothing activates unless an active .azflow/goal.json resolves from the working
directory, so the plugin never changes a repository that never started a goal.
See [goal-run.md](goal-run.md) for the state file, the continuation rules, and
the full command set.
