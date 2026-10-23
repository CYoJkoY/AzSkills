---
name: architecture
description: Choose and review the smallest maintainable runtime, frontend stack, persistence model, and process boundary before implementation. Use for new applications, browser extensions, desktop shells, web apps, migrations, and stack decisions.
version: 2.0.0
status: canonical
family: architecture
modes: [runtime, frontend, migration, review]
---

# Architecture

Turn product constraints into one explicit architecture decision. This Skill owns
runtime, language, framework, storage, and process boundaries. It does not own
visual direction, interaction design, or rendered quality; those belong to
`ui-design` and `design-system`.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md) before changing this contract.

## Contract

- Use when: a project needs a runtime, client stack, storage model, process boundary, migration plan, or architecture review.
- Do not use when: the stack is already fixed and the task only changes visual, interaction, or content behavior.
- Owns: the smallest sufficient architecture and the evidence for rejecting heavier alternatives.
- Inputs: product type, targets, interaction model, data shape, lifecycle, team constraints, existing stack, and performance limits.
- Outputs: an architecture decision record with chosen runtime, stack, persistence, boundaries, rejected alternatives, and risks.
- Compose with: `ui-design` after the boundary is fixed; `design-system` when the product has a visual contract; `ultrathink` for high-risk tradeoffs.
- Gates: no heavier runtime without a capability gap; no second stack beside an existing one; every boundary has an owner and a failure mode.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `runtime` | New product or unresolved execution model | Runtime ladder and capability proof | Runtime decision record |
| `frontend` | Runtime fixed, client stack unresolved | Interaction and lifecycle classification | Language, framework, styling, and data boundaries |
| `migration` | Existing stack must change | Baseline, target, staged transition, rollback | Migration plan with compatibility gates |
| `review` | Audit an existing architecture | Evidence pass, boundary map, risk ranking | Findings and smallest corrective actions |

## Workflow

### 1. Inspect before choosing

Read the repository before proposing anything:

```text
existing runtime and entrypoints
package manager and lockfile
framework and build configuration
state, styling, and component systems
data layer and external services
deployment and update path
performance-sensitive paths
```

An existing working choice is the default. Replace it only for a named
capability gap, maintenance risk, or measured performance defect.

### 2. Classify the product

Record:

```text
Product type:
Primary user and task:
Targets:
Interaction model:
Data shape and lifetime:
Offline / sync needs:
Install and update path:
Runtime sensitivity:
Maintenance horizon:
Team constraints:
```

Runtime sensitivity covers memory, startup, idle CPU, GPU, process count,
installation size, battery, and long-running stability.

### 3. Start from the smallest runtime

```text
native process-local APIs
  < system WebView
    < embedded browser runtime
      < full browser or Chromium runtime
```

`<` means less added runtime, not less capability. Escalate only when a concrete
requirement fails at the lower level. Record the failed requirement.

| Product shape | Default starting point |
| :--- | :--- |
| Static or mostly static site | Semantic HTML, CSS, minimal JavaScript |
| Server-driven application | Server rendering plus HTMX or equivalent |
| Highly interactive web application | TypeScript plus a justified UI framework |
| Browser extension | WebExtension APIs, explicit context boundaries |
| Desktop tool without HTML needs | Native toolkit or a small native runtime |
| Desktop app with web UI | Thin system-WebView shell |
| Chromium-specific desktop app | Embedded Chromium only with a capability proof |
| Local data tool | In-process storage or SQLite |
| Multi-user server data | Server database matched to workload |

Electron, Chromium, a local HTTP server, or a database server is an escalation,
not a default.

### 4. Choose the frontend model

```text
runtime
  -> product shape
    -> interaction complexity
      -> data boundary
        -> lifecycle
          -> maintenance horizon
```

- Use plain JavaScript for tiny, disposable, or progressively enhanced surfaces.
- Use JavaScript with JSDoc for small maintainable modules that need types at the boundary.
- Use TypeScript for medium or long-lived frontends, shared contracts, and multi-developer work.
- Add a UI framework when client state, routing, or component coordination justifies it.
- Preserve an existing framework unless a measured problem justifies migration.
- Prefer native browser APIs before a dependency.

### 5. Set storage and process boundaries

- Keep single-user local state local; use SQLite when queries, transactions, or durability matter.
- Use a server database for shared, concurrent, or remotely accessed data.
- Keep UI, domain logic, and platform access in separate modules with explicit interfaces.
- Keep extension contexts, WebView bridges, workers, and native services behind typed messages.
- Do not add a background process without a lifecycle owner, health signal, and shutdown path.
- Do not expose a local server beyond the loopback boundary without an explicit trust model.

### 6. Make the decision visible

Write the decision before implementation. Use the fields in the output contract.
For migrations, add the compatibility window, data transition, rollback trigger,
and verification for each stage.

### 7. Review the result

Re-read the implementation against the decision. Check that configuration,
entrypoints, dependency boundaries, and deployment match the record. Record any
deviation as a defect or update the decision explicitly.

## Quality gates

- [ ] The runtime is the lightest one that satisfies observed requirements.
- [ ] Every heavier alternative has a named rejected capability or constraint.
- [ ] The existing stack is preserved unless a measured problem justifies change.
- [ ] Language and framework choices match interaction and maintenance horizon.
- [ ] Persistence matches data lifetime, concurrency, and query shape.
- [ ] Processes, workers, and native bridges have explicit contracts and failure modes.
- [ ] Browser-extension contexts and permissions remain separated.
- [ ] The build, update, and rollback paths are defined.
- [ ] No new dependency exists without a concrete job.
- [ ] Another developer can explain the architecture from the record alone.

## Output contract

```text
Decision:
Product type:
Primary runtime:
Process topology:
Frontend language and stack:
Styling and component model:
Persistence:
Native / backend boundary:
Why this is the smallest sufficient architecture:
Rejected alternatives and reasons:
Risks and rollback:
Verification:
```

For a review, replace `Decision` with `Verdict`, rank findings by user or
maintenance impact, and give one smallest corrective action per finding.

## References

- `references/runtime-selection.md` - detailed runtime, desktop, extension, server, and database gates.
- `references/frontend-selection.md` - detailed language, framework, styling, persistence, and frontend boundary rules.
