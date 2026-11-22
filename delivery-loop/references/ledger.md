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
    "reviewThreshold": 4.9,
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
  "lease": null,
  "review": null,
  "notes": "",
  "createdAt": "2026-11-22T00:00:00.000Z",
  "updatedAt": "2026-11-22T00:00:00.000Z"
}
```

`review` stores the latest `headSha`, `round`, `score`, `verdict`, and time. The
full per-round record lives in `reviews/`.

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
```

`abandoned` is terminal and frees its scopes. A task reaches `merged` only through
`azflow ship`.

## Sharing

Do not commit the ledger. To share progress across machines, use the pull request,
the issue, and the review comment. If a team needs a shared plan, put it in the
issue body, not in `state.json`.
