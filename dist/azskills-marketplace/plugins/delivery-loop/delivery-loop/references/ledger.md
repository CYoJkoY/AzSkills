# Ledger format

The ledger is local and disposable. The durable record is the GitHub Issue and
pull request. Losing `.azflow/` costs a plan, never history.

## Layout

```
.azflow/
  .gitignore        # contains "*", so the whole directory is local-only
  state.json        # the ledger
  worktrees/<id>/   # one git worktree per claimed task
  reviews/
    T-0001-r1.json  # the scored input and result
    T-0001-r1.md    # the rendered report
```

The nested `.gitignore` with `*` ignores the directory and its own contents without
touching the repository's root `.gitignore`.

## state.json

```json
{
  "schemaVersion": 1,
  "config": {
    "base": "main",
    "remote": "origin",
    "maxParallel": 3,
    "autonomy": "full",
    "reviewThreshold": 4.8,
    "leaseTtlMinutes": 90,
    "mergeStrategy": "squash",
    "allowFrameworks": []
  },
  "sequence": 0,
  "tasks": []
}
```

A task:

```json
{
  "id": "T-0001",
  "title": "Harden the canvas resize path",
  "status": "planned",
  "touch": ["mods/aleph-canvas/src/**"],
  "dependsOn": [],
  "issue": 104,
  "branch": null,
  "worktree": null,
  "pr": null,
  "owner": null,
  "lease": null,
  "review": null,
  "stageReviews": {},
  "notes": "",
  "createdAt": "2026-11-22T00:00:00.000Z",
  "updatedAt": "2026-11-22T00:00:00.000Z"
}
```

`review` stores the latest `headSha`, `round`, `score`, `verdict`, `reviewer`, and
time. The full per-round record lives in `reviews/`.

`owner` records the implementer identity, set when the task is claimed. A review
refuses a `reviewer` that equals `owner`, and `ship` re-checks that the recorded
reviewer still differs from it.

`stageReviews` is keyed by full commit SHA, one entry per branch commit:

```json
"stageReviews": {
  "4f9c0a0e...": {
    "headSha": "4f9c0a0e...",
    "round": 1,
    "score": 4.8,
    "verdict": "FAIL",
    "reviewer": "review-fresh-1",
    "at": "2026-11-22T00:10:00.000Z"
  }
}
```

Each record is the score that stage received. A commit with no record is
unreviewed, so `azflow review` refuses to move on while an earlier commit is
missing one, `azflow pr` refuses to open, and `azflow ship` refuses to merge. The
head stage must be `PASS` with a score strictly above `reviewThreshold`.

An upgraded ledger keeps commits written before the task existed as
`verdict: "LEGACY"` stages with `round: 0`, so an older branch stays shippable
without pretending those commits were scored. Every commit written after the task
was claimed still needs its own scored stage.

A stored `reviewThreshold` of `4.9` is the pre-gate default; `readState` migrates
it to `4.8`. Preserving it would combine with the strict comparison to demand a
perfect `5.00` in silence.

## Writes are atomic and locked

`writeState` writes a temporary file and renames it over `state.json`, so a crash
leaves the old ledger intact. Every mutation runs inside `withLock`, a directory
lock with a 30 second stale threshold and a 15 second wait. Two `azflow` processes
therefore cannot interleave a read-modify-write.

## Status transitions

```
planned -> active -> review -> merged
   ^         |
   +---------+   (lease expiry via recover)

review -> merged-issue-open -> merged   (issue still open; --verify-issue closes it)
```

`abandoned` is terminal and frees its scopes. A task reaches `merged` only through
`azflow ship`. `merged-issue-open` is the one repair status: the pull request
merged but `gh issue view` still read the issue `OPEN`. `azflow ship <task>
--verify-issue` closes it, proves it reads `CLOSED`, and moves the task to
`merged`; no other status accepts that flag.

## Sharing

Do not commit the ledger. To share progress across machines, use the pull request,
the issue, and the review comment. If a team needs a shared plan, put it in the
issue body, not in `state.json`.
