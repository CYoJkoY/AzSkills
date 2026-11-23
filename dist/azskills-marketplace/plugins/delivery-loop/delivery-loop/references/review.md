# Review scoring

The score is a computed value. A reviewing model supplies structured evidence and
the script produces the number, the caps, and the verdict. The model never types a
score into the report.

Every commit is scored as its own stage. A branch merges only when each stage has a
record and the head stage passes the strict bar, so a later commit cannot inherit an
earlier pass without being reviewed itself.

## Input shape

```json
{
  "headSha": "0123456789abcdef0123456789abcdef01234567",
  "round": 1,
  "diffFiles": ["src/a.ts", "src/b.ts"],
  "reviewedFiles": ["src/a.ts", "src/b.ts"],
  "findings": [],
  "carryOver": [],
  "probes": [
    { "id": "boundary", "status": "passed", "note": "empty input rejected at src/a.ts:40" },
    { "id": "error-path", "status": "passed", "note": "missing file returns exit 2" },
    { "id": "resource", "status": "passed", "note": "handles closed in finally" },
    { "id": "concurrency", "status": "passed", "note": "state writes are locked" },
    { "id": "regression", "status": "passed", "note": "existing tests still pass" },
    { "id": "security", "status": "passed", "note": "no secret literal in diff" }
  ],
  "dimensions": [
    { "id": "correctness", "status": "pass", "note": "covers the new branch" },
    { "id": "performance", "status": "pass", "note": "single pass over the diff" },
    { "id": "discipline", "status": "pass", "note": "no any, no empty catch" },
    { "id": "readability", "status": "pass", "note": "names match the domain" }
  ],
  "verification": { "command": "npm run check", "exitCode": 0, "output": "check passed" },
  "previous": null,
  "engine": "egm",
  "reviewers": [
    {
      "id": "egm-goldfish",
      "persona": "codebase-details",
      "status": "completed",
      "freshContext": true,
      "filesRead": ["src/a.ts", "src/b.ts"]
    }
  ]
}
```

Each finding needs `severity`, `file`, `line`, `dimension`, `summary`, `evidence`,
and `fix`. A finding without an observation or a repair still counts against the
score and also marks the review unreliable.

`engine` and `reviewers` carry the independent-review attestation. See
[egm-review.md](egm-review.md) for the window, the reviewer protocol, and the
attestation rules.

## Formula

```
deduction = 2.50*P0 + 1.50*P1 + 0.50*P2 + 0.20*P3 + 0.10*P4
raw       = max(0.00, 5.00 - deduction)
score     = floor2(min(cap, raw))
```

The score is floored, never rounded up. `4.899` becomes `4.89`, which fails a 4.80
bar, and an exact `4.80` also fails because the bar is strict. Rounding is how a
weak review becomes a pass.

## Hard caps

| Condition | Cap |
| :--- | :--- |
| Any P0 | 2.00 |
| Any P1 | 3.50 |
| Any P2 | 4.50 |
| An unreviewed diff file | 3.50 |
| Verification missing or failed | 3.50 |
| Verification absent with a reason and all probes N/A | 4.30 |
| Incomplete probe set | 4.50 |
| A dimension marked failing | 4.50 |
| An unevidenced finding, empty probe note, or empty dimension note | 4.50 |

P3 and P4 have no dedicated cap; their weight does the work. One P4 costs `0.10`,
landing at `4.90`; that is the only single-finding round that clears the strict
`> 4.80` bar. Two P4 land exactly on `4.80` and one P3 lands on `4.80`; both sit on
the bar, not above it, so they still need repair. Two P3 land at `4.60`. A stack of
small findings fails arithmetic instead of sliding under a permissive cap.

## Acceptance

A round passes only when all three hold:

1. `P0 + P1 + P2 == 0`.
2. `score > threshold` (default 4.80). The comparison is strict: an exact `4.80`
   is a repair, not a pass.
3. `round <= maxRounds` (default 5).

A pull request merges only when the branch clears the whole loop, not just one
round:

- Every commit on the branch carries a stage record.
- The stage at the pull request head is `PASS` and its score is strictly above the
  threshold.
- The reviewer named on the review is not the implementer. The script rejects a
  `--reviewer` equal to the task owner, and `azflow ship` re-checks the recorded
  identity, so independence of identity is enforced by code.
- The review is an EGM review: `engine` is `egm`, an open review window covers
  this task and head, and at least one reviewer attests `status: "completed"` with
  `freshContext: true` and a non-empty `filesRead`. A self review, or an EGM round
  with no valid attestation, injects a P2 that caps the report and blocks the
  merge, so independence is enforced by code rather than trust.
- The reviewers ran in fresh contexts: new sessions that saw only the diff, the
  repository files, and the verification output, never the author's reasoning or a
  prior round's verdict. The attestation is observable because it is recorded per
  reviewer; a reviewer that did not finish is listed as `not run`, never omitted.

## Anti-lenience rules

- A review must belong to a claimed task worktree. The command derives the changed
  files and runs the mechanical scanner from that worktree; `diffFiles`, `--scan`,
  and the claimed head cannot be supplied as substitutes for real repository state.
- Review rounds are a strict sequence. The first record is round 1; each later
  record is exactly one round higher and must carry the previous recorded score.
- The model cannot hide a diff file: any changed file absent from `reviewedFiles`
  becomes a blocking finding.
- The model cannot skip a probe or leave a probe note empty.
- The model cannot mark a dimension failing and still pass.
- The model cannot claim a fix without evidence; an empty `evidence` or `fix`
  caps the report and adds a finding.
- The model cannot jump the score: the rise over the previous round is limited to
  the weight of the findings recorded as resolved.
- The scanner injects mechanical findings before scoring: conflict markers, secret
  literals, `any`, `@ts-ignore`, empty catch, `debugger`, framework imports, tab
  indentation, `console.log`, loose equality, unreasoned lint disables, and TODO
  markers.
- Each commit is scored on its own stage. `azflow review` refuses to run when an
  earlier branch commit has no stage record, and `azflow commit` refuses to record
  the next stage until the current head has been scored.
- A review must name a `--reviewer` that differs from the implementer and must be
  an attested EGM round. The script rejects `--engine self`, rejects an unattested
  or windowless EGM round, and the reviewers read the artifact from fresh contexts
  instead of inheriting the author's reasoning.
- `azflow pr` refuses any unscored branch commit, and `azflow ship` re-counts the
  branch commits before merging, so a stale or partial review cannot ship.

## Why this is stricter than the original AGENTS.md

The original rules passed at `4.80`, weighted a P3 at `0.10` and a P4 at `0.05`,
and had no cap for P4 at all. That let a review stack small findings and still
clear the bar. This plugin raises each of those:

| Rule | AGENTS.md | Here |
| :--- | :--- | :--- |
| Acceptance threshold | 4.80 | Strictly above 4.80 |
| P3 weight | 0.10 | 0.20 |
| P4 weight | 0.05 | 0.10 |
| Two P4 | (no cap) | 4.80 (below the strict bar) |
| One P3 | (no cap) | 4.80 (below the strict bar) |

The heavier weights make small findings cost real score: a single P4 lands at
`4.90` and clears the bar, but a second P4 or a single P3 lands exactly on `4.80`,
which the strict comparison rejects. Nothing averages out, and the deduction table
shows every point lost.

The score is also floored, never rounded, and the model never types it. A review
formatted by hand can claim any number; this one cannot.

## Round tracking

Each round carries the previous round's resolved findings. An unresolved P0-P4 item
is copied into `carryOver`, where it keeps its full weight. Carrying a finding
forward is honest accounting; dropping it is the most common way a self-review
inflates a score.
