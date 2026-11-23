# Migrating from AGENTS.md

The workflow rules move from a long `AGENTS.md` into this plugin. Keep the
repository file thin: it should state what is specific to the repository, not
restate a plugin that every task already loads.

## What moves to the plugin

- Tool priority and routing.
- Single-agent rule, the no-sub-agent guard, and the short-lived review window
  that admits independent Elephant-Goldfish reviewers.
- Issue, branch, commit, pull request, review, and merge flow.
- The commit and pull request standard: ASCII-only metadata, Conventional
  Commits, the fixed `Refs` footer, and the five-section pull request body.
- The scoring formula, caps, and review comment template.
- Auto-merge gates and the concurrency model.
- Tool priority and routing, as a precedence rule, not a list of mounted names.

These are the same for every repository, so they belong in a plugin that can be
updated once.

Tool priority moves as a precedence rule, not as a list of names: the plugin says
"mounted plugin, then dedicated tool, then shell". The concrete routers you mount
stay local, because they differ per machine and per session.

## What stays in AGENTS.md

- Language and framework choices specific to this repository.
- Build, test, and release commands.
- Directory ownership and any path that must never be touched.
- Project facts a new contributor cannot infer from the code.

## Thin replacement

```markdown
# AGENTS.md

This repository uses the AzSkills `delivery-loop` plugin. Load it before any
planning, coding, review, or merge work.

## Repository facts

- Stack: <language, runtime, package manager>
- Build: <command>
- Test: <command>
- Never touch: <paths>
- Base branch: <name>

## Local rules

- <rule that is true only here>

Follow the plugin for tools, the delivery flow, review scoring, and auto-merge.
State a local exception only when it contradicts the plugin, and say why.
```

## Rollout

1. Install the plugin.
2. Run `azflow init` in the repository.
3. Move the shared rules out of `AGENTS.md`.
4. Add the thin replacement above with the repository facts.
5. Run `azflow doctor` and one full task to confirm the guard and gates.

## Precedence

The project's own instruction files come first. The plugin supplies the default
flow; a repository may override a rule, and the user may override the flow for a
single task. An override should be explicit and written down, so the next task does
not silently inherit a different process.

Installing the plugin is the delegation for the whole flow. Issue creation, branch
push, pull request creation, review posting, merge, and cleanup run without a
per-action question. An override is a deliberate exception the user states, such as
`--autonomy manual`, not a routine approval step.
