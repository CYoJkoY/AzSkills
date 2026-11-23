---
name: delivery-loop
description: Run concurrent issue-to-merge delivery unattended: install-time delegation, touch-scope leases, per-task worktrees, enforced commit and pull request standards, computed review scoring, gated auto-merge, dead-loop recovery, and prompt-aware output guards, without sub-agents.
---

# Delivery Loop

This plugin groups related workflows under one installation. Open the matching
contract before acting; do not answer from this index alone.

- [Delivery Loop](../../references/modules/delivery-loop.md)
  Run a repository delivery loop that plans concurrent tasks as a dependency DAG with touch-scope leases, isolates each task in its own git worktree, scores reviews mechanically, merges automatically on green evidence without sub-agents, and breaks out of dead loops.

Load only the supporting references the task needs. The plugin is self-contained;
do not look for a shared AzSkills entry or for other plugins in the catalog.
