---
name: frontend-architecture
description: Choose and enforce a maintainable frontend implementation architecture before writing substantial UI code. Apply automatically to new web applications, browser extensions, desktop webview applications, frontend-heavy tools, and projects without an established frontend stack. Select JavaScript, TypeScript, frameworks, native Web APIs, HTMX, Go, Rust, storage, and runtime boundaries from project constraints instead of defaulting to plain HTML/CSS/JS or fashionable frameworks.
---

# Frontend Architecture

A decision-first engineering Skill for frontend projects. Its purpose is to prevent a visual implementation from silently becoming an unstructured collection of HTML, CSS, and JavaScript files, while also preventing unnecessary framework or language complexity.

This Skill complements `ui-design`. `frontend-architecture` decides the implementation model; `ui-design` decides the interface, interaction, visual system, accessibility, responsive behavior, motion, and visual QA. For substantial UI work, compose both when both responsibilities are present.

## Core principle

Do not choose a frontend stack from habit.

Choose it from:

```text
runtime → product shape → interaction complexity → data boundary → lifecycle → maintenance horizon
```

The goal is not maximum technology. The goal is the smallest architecture that remains coherent as the project grows.

A project must not default to:

```text
index.html
style.css
script.js
```

merely because the task mentions a frontend.

Plain HTML/CSS/JS is a deliberate choice for appropriately small, static, disposable, or progressively enhanced surfaces—not the universal fallback for an application.

## 1. Inspect before choosing

Before writing substantial frontend code, inspect the repository and identify:

```text
Runtime:
  browser / web server / desktop webview / extension / hybrid

Project scale:
  throwaway / small / medium / large

Interaction:
  mostly static / local interaction / stateful / highly interactive

Data:
  none / local storage / local database / remote API / realtime

Lifecycle:
  short-lived / maintained / long-lived / multi-developer

Targets:
  Chromium / Firefox / Safari / mobile web / desktop

Existing stack:
  framework / bundler / package manager / component system / styling system

Performance constraints:
  DOM-heavy / large lists / CPU-heavy / startup-sensitive
```

Inspect existing `package.json`, lockfiles, build configuration, framework configuration, entrypoints, routes, existing components, and source-of-truth styling before proposing replacements.

Never introduce a second framework, styling architecture, package manager, or state system merely because it is familiar.

## 2. Runtime-first decision tree

Use this as the default architectural routing table.

```text
Browser extension
    → WebExtension architecture
    → WXT or equivalent extension build tooling
    → TypeScript by default for maintainable projects
    → native DOM / Web APIs for content-script work
    → browser storage / IndexedDB for local state
    → add Go/Rust only when a real native or backend boundary exists

Server-driven Web application
    → Go + HTMX when interactions are primarily request/response
    → SQLite for single-user/local/embedded workloads
    → PostgreSQL when concurrency, multi-user operation, or server-scale data requires it

Highly interactive Web application
    → TypeScript + React/Vue/Svelte/Solid as justified by interaction complexity
    → API boundary to Go or another appropriate backend
    → server database chosen independently from the UI framework

Local Web tool
    → Go + HTMX + SQLite is a strong default when the UI is server-driven
    → local WebView/Tauri is appropriate when a native desktop shell is required

Desktop WebView application
    → Tauri + TypeScript frontend by default
    → Rust only for native/system capabilities or performance-critical local logic

Hybrid browser + local capability
    → extension frontend first
    → Go/Rust local service or Native Messaging only when browser sandbox boundaries require it
```

This table is a starting point, not a command. Existing project constraints override it.

## 3. JavaScript versus TypeScript

Do not treat TypeScript as mandatory for every script.

### Prefer JavaScript when

```text
one-off script
prototype
bookmarklet
DevTools snippet
small userscript
very small extension
short-lived DOM experiment
```

JavaScript optimizes for minimum setup and direct execution.

### Prefer JavaScript + JSDoc when

The project should remain `.js`, but benefits from editor hints, structural documentation, and lightweight type checking.

Use JSDoc for meaningful public shapes instead of creating a pseudo-TypeScript type system through excessive comments.

### Prefer TypeScript when

```text
multiple modules
long-lived codebase
multiple runtime contexts
browser extension messaging
shared domain models
stateful UI
multiple contributors
public library/API
frequent refactoring
```

TypeScript should be the default for a new maintainable application or medium/large extension unless a concrete constraint argues otherwise.

The reason is not fashion. Types act as contracts between modules, browser contexts, storage schemas, messages, and domain logic.

Do not add gratuitous type annotations where inference is already sufficient.

## 4. Browser extension architecture

A browser extension is not a normal website.

Model it as coordinated execution contexts:

```text
Extension
├── Content Script
│   └── DOM / page integration
├── Background Service Worker
│   └── extension lifecycle / privileged APIs
├── Popup / Side Panel / Options
│   └── extension UI
├── Shared domain modules
│   └── types / protocols / pure logic
└── Persistence
    ├── browser storage
    └── IndexedDB when structured or larger local data is needed
```

For a new cross-browser extension, prefer WXT or an equivalent modern WebExtension build system. Keep framework choice subordinate to the extension runtime.

For content scripts, prefer native DOM and Web APIs when they are sufficient. Do not add React/Vue/Svelte merely because the project is written in TypeScript.

Use a UI framework when a particular extension surface genuinely contains complex reusable stateful UI.

Treat message passing as an explicit protocol:

```text
message type
payload
sender/context
request/response semantics
error semantics
versioning when needed
```

Do not scatter ad-hoc string messages and untyped payload objects throughout the project.

## 5. Web application architecture

### Small server-driven application

Prefer:

```text
Browser
  ↓
HTML + HTMX
  ↓
Go
  ↓
SQLite
```

when the product is dominated by forms, tables, CRUD, settings, navigation, and server-rendered state.

This is intentionally lightweight. Do not introduce a client framework solely to satisfy a generic "modern frontend" expectation.

### Highly interactive application

Prefer:

```text
Browser
  ↓
TypeScript + justified UI framework
  ↓
API / RPC
  ↓
Go or appropriate backend
```

Use this when the browser owns substantial interactive state and rendering logic: editors, collaborative tools, complex dashboards, canvases, drag-and-drop workspaces, rich client-side filtering, or similarly stateful applications.

Do not force HTMX into an application whose dominant complexity is client-side state.

## 6. Framework selection

A framework must solve a demonstrated problem.

Use no UI framework when:

```text
DOM size is modest
state is local and simple
native Web APIs are clear
component reuse is limited
```

Use a UI framework when:

```text
shared state crosses many components
UI is composed from many stateful reusable components
client-side routing is substantial
complex interactions dominate
```

When a framework is justified, preserve the repository's existing framework rather than replacing it.

Do not use a meta-framework for a small client-only surface simply because it is popular.

Do not create a framework abstraction layer over a framework abstraction layer.

## 7. Desktop architecture

For desktop applications that render Web UI, prefer a thin native shell and a web frontend.

A typical model is:

```text
Tauri
├── TypeScript frontend
└── Rust native layer
```

Keep the Rust layer focused on capabilities the WebView cannot or should not provide: filesystem access, OS integration, native windows, system services, or performance-sensitive local code.

Do not move ordinary UI state and presentation logic into Rust merely because Rust is available.

## 8. Data and persistence boundaries

Choose persistence independently from frontend framework choice.

```text
Ephemeral UI state
    → component/local state

Small extension settings
    → browser storage

Structured local browser data
    → IndexedDB

Single-user embedded application
    → SQLite

Multi-user server application
    → PostgreSQL or another server database
```

Do not introduce SQLite into a browser extension merely to make the architecture appear serious. A browser sandbox already provides storage primitives appropriate to many extension workloads.

Likewise, do not introduce PostgreSQL into a local single-user tool when an embedded database is sufficient.

## 9. Keep boundaries explicit

Separate at least these concerns when the project is large enough to justify them:

```text
UI
state / orchestration
domain logic
platform adapters
persistence
transport
```

A practical structure may look like:

```text
src/
├── ui/
├── state/
├── domain/
├── platform/
├── storage/
├── transport/
└── shared/
```

Do not impose this exact directory tree on tiny projects. The boundary matters more than the folder names.

Pure domain logic should not directly depend on DOM APIs, browser extension globals, database clients, or framework components unless that dependency is genuinely part of the domain.

## 10. Prevent frontend entropy

Before implementation, define:

```text
entrypoints
module boundaries
state ownership
message/API contracts
persistence model
styling model
component reuse rule
build/test commands
```

Avoid these failure modes:

```text
one giant script.js
shared mutable globals
DOM traversal mixed with business rules
API calls embedded in presentational components everywhere
untyped cross-context messages
copied CSS tokens
multiple competing state stores
multiple UI frameworks in one surface without a strong reason
```

When a file becomes a coordinator for unrelated responsibilities, split the responsibilities rather than merely increasing file length.

## 11. Dependency discipline

Every dependency should justify itself through one or more of:

```text
major capability
substantial correctness benefit
large maintenance reduction
platform compatibility
performance or reliability requirement
```

Do not add packages for trivial utilities that are clearer with platform APIs.

For extensions, remember that every dependency affects bundle size, supply-chain surface, and debugging complexity.

For browser-facing code, prefer platform APIs when they are sufficiently capable and match the supported browser baseline.

## 12. Performance architecture

Choose architecture with the runtime's bottleneck in mind.

For DOM-heavy applications:

```text
measure DOM work
batch mutations
avoid unnecessary layout reads/writes
schedule expensive work
virtualize genuinely large lists
```

For browser extensions:

```text
keep content scripts narrow
avoid global observers without filtering
minimize repeated DOM scans
keep background work event-driven
```

For rich client apps:

```text
avoid needless state propagation
split expensive rendering work
use memoization only where profiling supports it
```

For native shells:

```text
keep the WebView frontend responsive
move genuinely native or CPU-heavy work to the native layer
```

Do not use architectural complexity as a substitute for measurement.

## 13. Migration rules

When an existing small JavaScript project begins to grow, do not rewrite it automatically.

Use this progression:

```text
small JS
  ↓
modules
  ↓
JSDoc when useful
  ↓
TypeScript where contracts become important
  ↓
framework only when client-side state/interaction justifies it
```

When an existing HTML/CSS/JS application is already stable, preserve it unless there is a concrete maintenance or capability problem.

When an existing project has an established framework, extend it instead of replacing it for stylistic preference.

## 14. Output contract for implementation tasks

Before substantial implementation, state internally—or in the engineering plan when one is requested:

```text
Runtime:
Chosen language:
Chosen frontend architecture:
UI framework:
Styling model:
Persistence:
Backend/native boundary:
Why this is the smallest maintainable solution:
What was deliberately NOT added:
```

The implementation should make these decisions visible in project structure and configuration.

## 15. Architecture quality gate

Before delivery, verify:

- the runtime was identified correctly
- the chosen language matches the maintenance horizon
- a substantial application did not silently fall back to unstructured HTML/CSS/JS
- a framework was added only when it solves a real problem
- browser extensions use explicit extension-context boundaries
- DOM code is not unnecessarily coupled to business logic
- cross-context/API messages have stable contracts
- persistence matches the workload
- dependencies have concrete reasons to exist
- the architecture can be extended without turning one file into a god object
- the stack remains understandable to another developer six months later

## 16. Relationship with ui-design

For frontend implementation:

```text
frontend-architecture
    ↓
chooses runtime / language / framework / boundaries

ui-design
    ↓
chooses visual / interaction / accessibility / responsive behavior
```

Neither should override explicit project requirements.

If the user specifies an existing stack, preserve it unless there is a clear technical reason to recommend migration.

If the user does not specify a stack, do not silently choose plain HTML/CSS/JS for a project that is clearly application-sized. Apply the decision tree in this Skill first.

## Decision summary

Use the smallest architecture that remains maintainable:

```text
Tiny / disposable
    → JavaScript

Small maintainable browser surface
    → JavaScript or JavaScript + JSDoc

Medium / long-lived frontend
    → TypeScript

Browser extension
    → WXT + TypeScript + native Web APIs

Server-driven Web application
    → Go + HTMX + SQLite when workload fits

Highly interactive Web application
    → TypeScript + UI framework + API backend

Desktop WebView application
    → Tauri + TypeScript, Rust only where needed

Native / CPU-heavy capability
    → add Rust or Go at an explicit boundary
```

Architecture should be earned by constraints, not by trend.