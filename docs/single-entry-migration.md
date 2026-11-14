# Single entry migration (2.0.0)

Issue: #55. Baseline: main at 2dd4fbf.

Baseline checks passed: validate-skills, validate-integrations, test-package-skill, test-install-skills, and test-azskills-mcp (all under scripts/, using node).

AzSkills 2.0.0 changes the public packaging contract from separate skills to one azskills entry. Registry schema 1 becomes 2; MCP 1.1.0 becomes 2.0.0. Existing module contracts retain their content and receive a major version for their changed location and internal-only role. Aliases become routing metadata.

The public entry routes through references/routing.md and reads only the selected module and necessary supporting references. Domain contracts remain separate from installer and MCP adapters.

Installation replaces only manifest-managed entries, preserves unrelated entries, and stores migration backups outside the client scan root. A rollback restores previous bytes and manifest ownership. Unmanaged conflicting entries must be resolved by the user. No live client installation is changed during development.

Verification must prove one discoverable manifest in source, archives, and managed installations; complete local links; idempotent installation; migration and rollback; MCP discovery and safe supporting-file access. Actual client panel rendering requires a connected client and is reported separately.

Rollback of repository changes uses the task commits; no history rewriting or release is part of this change.

Module versions:

- architecture/SKILL.md: 2.0.0 -> 3.0.0
- design-system/SKILL.md: 2.0.0 -> 3.0.0
- frontend-slides/SKILL.md: 2.1.0 -> 3.0.0
- localization/SKILL.md: 2.0.0 -> 3.0.0
- logo-generator/SKILL.md: 2.0.0 -> 3.0.0
- photo-abstract-editorial/SKILL.md: 2.0.0 -> 3.0.0
- readme-craft/SKILL.md: 2.0.0 -> 3.0.0
- remotion-production/SKILL.md: 2.0.0 -> 3.0.0
- resume-evidence-workflow/SKILL.md: 1.0.0 -> 2.0.0
- steam-mod-page/SKILL.md: 2.0.0 -> 3.0.0
- tool-integration/SKILL.md: 1.0.1 -> 2.0.0
- ui-design/SKILL.md: 2.0.1 -> 3.0.0
- ui-motion/SKILL.md: 2.0.0 -> 3.0.0

The old paths above identify the previous version carriers. Their current paths are references/modules/<id>.md. The public entry and registry now declare the unified product version 2.0.0; the previous catalog had no product version field. Installer ownership schema 1/2 is migrated to schema 3, with integrity-checked snapshots and original manifest bytes retained outside the client scan root.

## Verified delivery

Local verification on Windows with Node.js v26.13.1:

- Registry and routing: one public manifest, 13 internal modules, 10 metadata aliases, 7 families.
- Packaging: deterministic unified ZIP, exactly one extracted manifest, complete module/support bytes and valid local links; no Git or build directory included. Modules without supporting files may have no resource directory in a clean Git checkout; the exporter accepts that while retaining their required contracts under references/modules.
- Installer: legacy schemas 1/2, migration of in-root backups, byte-preserving rollback, idempotency, local content verification, unmanaged conflicts, unsafe ownership paths, incomplete snapshots, and recovery after an injected copy failure.
- MCP: exactly one tool and one listed resource; entry, routing, module modes, aliases, supporting bytes, invalid paths and modes.
- Design: 134 terminal frames and 78 contrast pairs; design contracts and editable resume regressions passed. The editorial checker normalizes Windows line endings before matching CSS selectors.
- Integration registry and all 29 generated guides validated. Motion and video workflow Bash assertions passed locally under Git Bash.

No live client was installed or reconfigured. Client panel discovery and invocation remain unverified until the complete bundle is imported or installed into that client's actual scan scope. Existing unrelated skills and unmanaged historical copies may still appear and are not automatically deleted. No performance improvement is claimed or benchmarked. No external dependencies were added; existing CI Node.js 22 and Actions major-version references are retained.
