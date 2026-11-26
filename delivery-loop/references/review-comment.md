# Review comment

The review result must be visible on the pull request itself, not only in a local
file. A recorded score that never reaches the pull request leaves the shared
record showing no review, and a reader cannot tell a passing round from one that
was never published. The loop therefore publishes every round as a pull-request
comment, in one fixed template, and the merge gate reads that comment back.

## The template is the report, not prose

The comment body is the exact text `renderReport()` produces from the counted
ScoreResult. The model never types a comment, and a hand-written comment is
refused even when it is well meant.

- The first line is
  `### \u{1F50D} Autonomous Code Review Report (Round <n>)`.
- The metadata block carries `Reviewed Commit (`head SHA`)`, `Baseline`,
  `Verdict`, `Final Score`, `Task: `T-xxxx`` with the optional ` / Issue #n`,
  `Reviewed at`, and, when present, `Reviewer` and `Review engine`.
- Five fixed sections follow in this order:
  `#### 1. Previous Round Issue Resolution`,
  `#### 2. Quantitative Deduction Formula`,
  `#### 3. Current Round Findings & Exact Line Numbers (P0-P4)`,
  `#### 4. Dimension Summary`, and `#### Evidence Gates`.
- Section 1 always carries the closure table
  `| Original Severity | File & Line | Issue Summary | Resolution Status | Fix Commit / Rationale |`.
- Section 3 always carries the findings table
  `| Severity | File & Line | Review Dimension | Issue Description | Recommended Fix |`
  with one row per P0-P4 severity, `None` when a severity is empty.
- The evidence gates table header is `| Gate | Status | Detail |`.

`validateReviewComment()` re-parses a body and rejects it unless every one of
those anchors is present, in order, and, when an expectation is supplied, unless
the parsed round, head SHA, task id, verdict, and score match the recorded round.
That last check is what makes a copied or edited comment useless: a body that
looks like the template but describes a different head, round, or score cannot
stand in for the report that the gate expects.

## Publishing

- `azflow review` posts the report by default. When the task has a pull request,
  the scored round is published immediately after the report is written; a post
  failure keeps the record and exits 1 with the retry command instead of hiding
  the miss. `--no-post` suppresses the post for a run that must stay offline.
- `azflow pr` publishes the current recorded report as the pull request's first
  comment. A pull request opened without the review visible would be incomplete,
  so the post is part of opening it; a post failure keeps the pull request and
  exits 1 rather than silently dropping the review.
- `azflow review-post <task> [--round N] [--pr N]` re-publishes a recorded round
  from disk. It re-reads the report file and the scored record, refuses when
  either is missing or the round does not match, and validates the body against
  the template again before posting. It is the idempotent retry after a transient
  post failure.

## Merge gate

`azflow ship` re-reads the real comment list with `gh pr view <pr> --json
comments` and requires at least one comment that validates as the fixed template
for the recorded round, head, task, verdict, and score (`review-comment`). A local
report on disk is not proof the verdict was published, so the gate reads the pull
request, not the file.

- On a live run the gate repairs a missing comment: it re-reads the recorded
  report and posts it, then re-validates. A repair that still fails keeps the gate
  red and the merge off.
- On `--dry-run` the gate reports the gap and exits 2 without posting, because a
  dry run predicts the merge and never mutates the pull request.

## Manual comments are blocked

Free-form `gh pr comment` and `gh pr review` would let a comment look like a
review without the recorded round, head, verdict, and score, which is exactly the
bypass the template closes. The guard denies both inside an azflow project.
`gh issue comment` and `gh pr view` stay available. `AZFLOW_ALLOW_MANUAL_PR_COMMENT=1`
is the visible escape for a genuinely separate note; it does not relax the
`review-comment` gate, which still needs a templated report for the recorded
round.
