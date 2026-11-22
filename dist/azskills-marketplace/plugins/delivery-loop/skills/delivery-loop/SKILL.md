---
name: delivery-loop
description: Run concurrent issue-to-merge delivery with touch-scope leases, per-task worktrees, computed review scoring, and gated auto-merge, without sub-agents.
---

# Delivery Loop

This plugin groups related workflows under one installation. Open the matching
contract before acting; do not answer from this index alone.

- [Delivery Loop](../../references/modules/delivery-loop.md)
  Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically, and merges automatically on green evidence without sub-agents.

Load only the supporting references the task needs. The plugin is self-contained;
do not look for a shared AzSkills entry or for other plugins in the catalog.
