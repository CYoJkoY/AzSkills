# EGM review

The loop does not review its own work. A model that implements a change and then
scores it grades its own reasoning, which over-scores the change and hides the
defects it introduced. The loop therefore hands every review to the Elephant-
Goldfish Model (EGM), a review engine built to find what the author missed, and
keeps the scoring mechanical so neither side can type its own number.

EGM is an installed Codex plugin (`egm`), not a vendored copy. The loop calls it;
it does not reimplement or dilute it. The plugin supplies the reviewer personas,
the review protocol, and the convergence rules, and the loop supplies the diff,
the window that permits them to run, and the score.

## Why a window

The delivery guard blocks sub-agent spawns because a task must stay one agent:
each handoff loses context and mid-task overhead grows. Review is the one
exception, because review is the one step that must not share the author's
context. Instead of a permanent escape hatch, the loop opens a short-lived
window:

```text
azflow review-open <task> [--reviewer <id>] [--ttl 20] [--max-agents 3] [--json]
```

- The command requires a claimed worktree and records the task, the current head
  SHA, the reviewer id (default `egm-goldfish`), a TTL in minutes (1-120, default
  20), and a spawn budget (1-8, default 3).
- It writes `.azflow/review-window.json` atomically next to the ledger.
- While the file exists, targets this task and head, and has not expired, the
  guard permits a sub-agent spawn. Every other spawn stays denied.
- `azflow review` deletes the window after it scores, so a later round must open
  its own window at its own head. A stale window cannot authorise new work.

The window is a permission, not an attestation. A round still fails unless a
fresh-context reviewer attests that it ran (see below), so opening a window and
skipping the review gains nothing.

`azflow review-open` warns when it cannot find the `egm` plugin under
`CODEX_HOME`, and `azflow doctor` reports the `review-engine` gate with the same
detection. Detection is best-effort: the cache path differs per host, so a miss
warns and never blocks.

## Reviewer protocol

1. Run the project's own checks on the final head, then `azflow review-open`.
2. Spawn the EGM reviewers in fresh contexts. Every reviewer must start with no
   inherited conversation: `fork_context: false`, or `fork_turns: "none"`.
3. Each reviewer reads the diff, the changed files, and the repository state it
   needs; it never reads the author's reasoning or a prior round's verdict.
4. Choose personas for the stage under review. EGM ships `zoom_out`,
   `comprehension`, `design_critic`, `structural`, `style`,
   `implementation_readiness`, `codebase_details`, `inventive_catalyst`,
   `synthesizer`, and `bootstrap_orchestrator`; a code stage leans on
   `implementation_readiness`, `codebase_details`, and `style`.
5. Merge the reviewers' findings into one record. Keep every finding; do not
   drop one because another reviewer missed it.
6. Run `azflow review <task> --reviewer <fresh id> --input review.json --scan`
   with `engine: "egm"` and one attestation entry per reviewer.
7. Leave the post to the command. When the task has a pull request, `azflow review`
   publishes the reported round as the fixed-template pull-request comment by
   itself; `--no-post` is the only way to stay offline. A post that fails keeps
   the record and exits 1 with the retry command, and `azflow review-post <task>`
   re-publishes the recorded round. Never write the comment by hand: the guard
   denies `gh pr comment` and `gh pr review` inside a project, and the merge gate
   reads the templated comment back.

If the session has no sub-agent tool, stop and say so. Never simulate a
fresh-context review, never write the attestation yourself, and never fall back
to self-review to make the gate pass. A blocked review is a real state, and the
loop reports it as one.

## Attestation format

```json
{
  "engine": "egm",
  "reviewers": [
    {
      "id": "egm-goldfish",
      "persona": "codebase-details",
      "status": "completed",
      "freshContext": true,
      "filesRead": ["src/cart/total.ts", "src/cart/total.test.ts"]
    },
    {
      "id": "egm-structural",
      "persona": "structural",
      "status": "not run",
      "freshContext": false,
      "filesRead": []
    }
  ]
}
```

- `status` is `completed` or `not run`; a reviewer that did not finish is
  recorded honestly instead of omitted.
- `freshContext` must be `true` for a reviewer to count.
- `filesRead` must name the artifacts the reviewer actually read; an empty list
  does not attest a review.
- At least one reviewer must be `completed`, `freshContext: true`, with a
  non-empty `filesRead`, or the round is unattested.

## How scoring treats it

`azflow review` enforces independence before the scorer runs, so the scorer stays
deterministic:

- `engine: "self"`, or `--engine self`, injects a P2 finding: self-review is not
  a gate. The P2 caps the round at 4.50 and blocks the merge.
- `engine: "egm"` with no open window for this task and head, or with no
  attested reviewer, injects a P2 finding with the reason that failed.
- A clean round records `engine: "egm"` on the review record and the report, so
  the evidence of an independent review travels with the score.

The injected finding is a real P2: it is scored, carried into the next round, and
counted by `ship`. It is not a warning the loop can ignore.

The result reaches the pull request, not just the local file. After scoring, the
report is published as the fixed-template review comment (see
[review-comment.md](review-comment.md)), and `azflow ship` requires that comment
at the recorded round, head, verdict, and score before it merges. A transient post
failure is retried with `azflow review-post <task>`; a hand-written PR comment is
refused by the guard, so the only comment is the attested report.

## Stage coverage

Review depth follows the stage. A docs-only change needs one comprehension
reviewer; a code change needs implementation readiness, codebase details, and
style; a design change needs design, structural, and style. EGM's own loop caps
convergence at five rounds with two clean rounds required, which fits the loop's
`maxRounds` of five. Each commit is still its own stage, so a later commit opens
its own window and runs its own reviewers rather than inheriting an earlier pass.
