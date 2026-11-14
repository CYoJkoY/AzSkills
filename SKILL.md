---
name: azskills
description: Build and review software architecture, interfaces, design systems, motion, logos, editorial images, HTML slides, video, README pages, Steam pages, game localization, resumes, and AI client setup. Routes each task to one internal module and loads its references on demand.
version: 2.0.0
---

# AzSkills

AzSkills is one skill with specialized internal modules. Start from the user's
requested outcome. Module names and old aliases select workflows inside this
entry; they are not separate skills to install.

## Route the task

1. Read [routing](references/routing.md) and [shared rules](references/shared-rules.md).
2. Select the single module that owns the requested artifact, then its mode.
   An explicitly requested module or legacy alias takes priority over inference.
3. Read that module's contract. Load only the references needed by the mode.
   Supporting paths in a module are relative to that module file unless marked
   as repository-root paths. Never preload the complete module library.
4. If a second capability is necessary, finish or define the first owner's
   boundary, then load the next module. Keep one owner per decision.
5. Follow its workflow, quality gates, and output contract. Report actual
   verification and unresolved items with the requested artifact.

When the outcome is ambiguous, inspect available project context first and ask
only for information that changes routing or delivery. User and repository
instructions take precedence. Installing AzSkills does not grant permission to
publish, deploy, merge, send messages, or change client settings.

## Examples

- "Use AzSkills to review this app's architecture" selects architecture/review.
- "Use AzSkills to refine this interface" selects ui-design/refine.
- "Use frontend-architecture" resolves to architecture/frontend inside AzSkills.
- "Use AzSkills to install it in Codex" selects tool-integration/install.

For installation and migration, see [the README](README.md).
