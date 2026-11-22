# Review scoring

The score is a computed value. A reviewing model supplies structured evidence and
the script produces the number, the caps, and the verdict. The model never types a
score into the report.

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
  "previous": null
}
```

Each finding needs `severity`, `file`, `line`, `dimension`, `summary`, `evidence`,
and `fix`. A finding without an observation or a repair still counts against the
score and also marks the review unreliable.

## Formula

```
deduction = 2.50*P0 + 1.50*P1 + 0.50*P2 + 0.20*P3 + 0.10*P4
raw       = max(0.00, 5.00 - deduction)
score     = floor2(min(cap, raw))
```

The score is floored, never rounded up. `4.899` becomes `4.89`, which fails a 4.90
threshold. Rounding is how a weak review becomes a pass.

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
landing at `4.90` and passing only because a single trivial defect is tolerable.
Two P4 land at `4.80`, one P3 lands at `4.80`, and two P3 land at `4.60`, so a
stack of small findings fails arithmetic instead of sliding under a permissive cap.

## Acceptance

A round passes only when all three hold:

1. `P0 + P1 + P2 == 0`.
2. `score >= threshold` (default 4.90).
3. `round <= maxRounds` (default 6).

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

## Why this is stricter than the original AGENTS.md

The original rules passed at `4.80`, weighted a P3 at `0.10` and a P4 at `0.05`,
and had no cap for P4 at all. That let a review stack small findings and still
clear the bar. This plugin raises each of those:

| Rule | AGENTS.md | Here |
| :--- | :--- | :--- |
| Acceptance threshold | 4.80 | 4.90 |
| P3 weight | 0.10 | 0.20 |
| P4 weight | 0.05 | 0.10 |
| Two P4 | (no cap) | 4.80 (arithmetic) |
| One P3 | (no cap) | 4.80 (arithmetic) |

The heavier weights make small findings cost real score: a single P4 lands exactly
on `4.90`, so a second P4 or a single P3 drops the round below the bar. Nothing
averages out, and the deduction table shows every point lost.

The score is also floored, never rounded, and the model never types it. A review
formatted by hand can claim any number; this one cannot.

## Round tracking

Each round carries the previous round's resolved findings. An unresolved P0-P4 item
is copied into `carryOver`, where it keeps its full weight. Carrying a finding
forward is honest accounting; dropping it is the most common way a self-review
inflates a score.
