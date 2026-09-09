---
name: application-architecture
description: Choose the smallest maintainable runtime and application architecture before implementation. Apply automatically to new applications, desktop tools, web applications, browser extensions, hybrid apps, and projects without an established architecture. Minimize runtime overhead, distinguish native, WebView, browser, extension, server, and hybrid execution models, and select languages, frameworks, storage, and process boundaries from actual product constraints.
---

# Application Architecture

A runtime-first engineering Skill for deciding what an application should run on before deciding how its interface should be implemented.

Its primary goal is to prevent unnecessary runtime weight. A project should not embed a full browser, server, database server, UI framework, or native subsystem merely because the technology is convenient. Choose the smallest runtime that satisfies the product's actual capabilities, interaction model, portability requirements, and maintenance horizon.

This Skill is upstream of `frontend-architecture` and `ui-design`:

```text
application-architecture
    ↓
runtime / process model / capability boundary
    ↓
frontend-architecture
    ↓
language / framework / frontend boundaries
    ↓
ui-design
    ↓
visual / interaction / accessibility / responsive quality
```

For application-sized frontend work, apply this Skill before substantial implementation planning.

## 1. First principle: minimize the runtime

Treat runtime cost as an architectural constraint, not a late optimization task.

Ask first:

```text
What runtime do we actually need?
What capabilities require that runtime?
What portion of a browser stack is truly required?
Can the platform WebView satisfy the UI?
Can the application be native-first instead?
Does the application need a server process?
Does the application need a persistent database process?
```

Prefer this order when capabilities permit:

```text
Native / process-local APIs
    <
System WebView
    <
Embedded browser runtime
    <
Full browser / Chromium runtime
```

Here `<` means lower additional runtime overhead, not lower capability.

Never interpret "use Web technologies" as "ship Chromium".

Never interpret "cross-platform desktop app" as "use Electron".

A heavier runtime is justified only when the product requires capabilities that materially depend on it.

## 2. Runtime cost budget

Before selecting an application architecture, classify the product's sensitivity to:

```text
memory footprint
startup latency
background CPU usage
GPU usage
process count
installation size
idle resource usage
multi-window overhead
long-running stability
battery impact on laptops
```

For small utilities, developer tools, tray applications, editors, and local data tools, treat unnecessary runtime overhead as a defect.

Do not postpone this decision until after the UI has already been built around a heavyweight shell.

## 3. Runtime classification

Identify the primary execution environment.

### Browser extension

The browser is already the target runtime. Do not add another browser runtime.

Use:

```text
WebExtension runtime
    → WXT or equivalent
    → TypeScript for maintainable projects
    → native DOM / Web APIs
    → browser extension APIs
    → browser storage / IndexedDB
```

Use Go/Rust only at an explicit boundary such as:

```text
native messaging
local service
CPU-heavy computation
system integration
large local data processing
```

### Web application

The browser is an intentional part of the product.

Choose the server/client boundary according to where the complexity lives:

```text
server-driven
    → HTML + HTMX + Go when appropriate

client-heavy
    → TypeScript + suitable UI framework + API
```

Do not add a desktop shell merely to turn a website into an application unless there is a concrete desktop capability requirement.

### Desktop application requiring HTML/CSS UI

Prefer a system WebView or thin native shell when it satisfies the product.

Typical direction:

```text
Tauri / equivalent thin shell
        ↓
System WebView
        ↓
TypeScript frontend
```

Keep native code limited to platform capabilities and genuinely expensive local work.

### Desktop application requiring browser-specific capabilities

An embedded browser runtime may be justified when the application materially depends on:

```text
Chromium-specific APIs
WebRTC/browser integration that the target WebView cannot satisfy
browser-grade developer tooling
Chromium-specific rendering behavior
web compatibility that cannot be reproduced by the system WebView
```

Document why the heavier runtime is necessary.

### Native-first application

When the product does not actually require HTML/CSS rendering, prefer a native or lightweight application architecture.

Examples:

```text
CLI / TUI
native GUI
Go / Rust application
platform UI toolkit
```

Do not introduce a WebView merely because the team is comfortable with frontend technologies.

## 4. Decision tree

Use this routing model:

```text
What are we building?
│
├── Browser extension
│     → WebExtension runtime
│
├── Website / Web app
│     → Browser + server/client architecture
│
├── Desktop application
│     │
│     ├── UI does not require HTML/CSS
│     │      → native-first
│     │
│     ├── UI needs HTML/CSS but normal WebView is enough
│     │      → thin WebView shell
│     │
│     └── UI requires browser/Chromium-specific capability
│            → embedded browser runtime
│
└── Hybrid application
      → use the lightest runtime for each boundary
```

Do not begin with a favorite framework. Begin with the execution model.

## 5. Electron / Chromium gate

Electron or another embedded Chromium runtime requires explicit justification for a new application.

Answer all of these before adopting it:

```text
1. What required capability cannot be supplied by a system WebView?
2. Is Chromium-specific behavior a product requirement or merely developer convenience?
3. Is the additional memory/process/startup cost acceptable for this product?
4. Is there a clear operational reason to bundle the browser runtime?
5. Have lighter alternatives been evaluated?
```

If the answers do not establish a concrete need, do not choose the heavyweight runtime by default.

The following are not sufficient reasons by themselves:

```text
"It is easy to build with React."
"The project is cross-platform."
"We already know Electron."
"We want to use HTML/CSS."
"It has lots of npm packages."
```

## 6. Tauri / WebView gate

A thin WebView shell is appropriate when:

```text
HTML/CSS is a productive UI medium
system WebView capabilities match the target platform
native integration is limited
small installation and process overhead matter
```

It is not automatically the best solution. If a native UI toolkit is simpler and lighter for the actual product, prefer native-first.

## 7. Server process and local service gate

Do not add a local HTTP server merely because the UI is HTML.

Ask:

```text
Does the application need a persistent service boundary?
Does another process need to consume the API?
Does the server isolate long-running work usefully?
Is there a meaningful backend/domain boundary?
```

For a simple local tool, an embedded architecture may be preferable:

```text
UI
 ↓
application process
 ↓
SQLite / files
```

A local Go service becomes useful when it provides real value:

```text
heavy background work
shared local API
system integration
large data processing
reusable service boundary
```

## 8. Database process gate

Choose the smallest persistence engine matching the workload.

```text
small UI state
    → in-memory / browser storage

structured browser data
    → IndexedDB

single-user embedded application
    → SQLite

multi-user server application
    → PostgreSQL / server database
```

Do not introduce a database server when an embedded database is sufficient.

Do not introduce SQLite merely because an application is "serious".

## 9. Frontend language selection after runtime selection

Only after the runtime is established should the frontend language be selected.

```text
small / disposable browser script
    → JavaScript

small maintainable JS project
    → JavaScript + JSDoc when useful

medium / long-lived application frontend
    → TypeScript

browser extension
    → TypeScript by default for maintainable projects
```

TypeScript is an engineering default, not a mandatory language law.

JavaScript remains appropriate when the code is genuinely small, temporary, or direct DOM scripting is the primary task.

Do not use Rust, Go, or another compiled language for ordinary browser DOM work merely to avoid TypeScript.

## 10. Backend language selection

Choose the backend according to system responsibilities rather than UI preference.

A practical default:

```text
HTTP server / local service / CLI / data processing
    → Go is a strong default

native desktop integration / memory-safe low-level capability
    → Rust when justified
```

Do not turn a simple frontend into a multi-process Go/Rust system without a concrete boundary.

## 11. Process topology matters

Model the actual process graph before implementation.

Examples:

### Lightweight local tool

```text
Application
└── UI + local logic
    └── SQLite
```

### Thin desktop Web UI

```text
Native shell
└── System WebView
    └── TypeScript UI
```

### Desktop app with native service boundary

```text
Native shell
├── WebView UI
└── Native service
      └── SQLite
```

### Browser extension with local backend

```text
Browser
└── Extension
      ├── Content Script
      ├── Background
      └── UI
             │
             ↓
        optional local service
             ↓
           SQLite
```

Every additional process has an operational cost. Add one only when it creates a meaningful architectural boundary.

## 12. Performance architecture by product type

### Browser extension

Optimize for:

```text
minimal DOM interference
minimal observers
minimal page scanning
small content scripts
event-driven background work
bounded storage usage
```

### Desktop application

Optimize for:

```text
startup
idle memory
process count
background CPU/GPU
large list rendering
long-running stability
```

### Web application

Optimize according to:

```text
server latency
payload size
client execution
rendering cost
cache strategy
database workload
```

Architecture is part of performance. Do not attempt to fix an oversized runtime solely with UI micro-optimizations.

## 13. Escalation rule

Start at the lowest runtime level that can satisfy the requirements.

Escalate only when a concrete requirement fails:

```text
native-first
    ↓ capability gap
system WebView
    ↓ capability gap
embedded browser
    ↓ product boundary
browser / extension / full web architecture
```

When escalating, record the reason.

The burden of proof belongs to the heavier architecture, not the lighter one.

## 14. What not to do

Avoid these defaults:

```text
new desktop app → Electron
new Web UI → React
new frontend → HTML/CSS/JS files with no architecture
new local tool → local HTTP server
new local data tool → PostgreSQL server
new extension → arbitrary UI framework
new performance problem → rewrite in Rust
```

Each may be correct in context, but none should be selected without evidence.

## 15. Output contract

Before substantial implementation, determine:

```text
Product type:
Primary runtime:
Process topology:
Runtime cost sensitivity:
Chosen UI technology:
Chosen language:
Persistence:
Native/backend boundary:
Why this is the smallest sufficient architecture:
What heavier alternatives were rejected and why:
```

The answer should be visible in the engineering plan when a plan is requested and reflected in project structure.

## 16. Architecture quality gate

Before delivery, verify:

- the primary runtime matches the product's actual requirements
- runtime overhead was considered before UI implementation
- a full browser runtime was not introduced without a concrete need
- WebView was considered for desktop Web UI
- native-first was considered when HTML/CSS was not actually required
- extra processes have meaningful boundaries
- persistence matches the workload
- frontend language matches maintenance horizon
- framework complexity is justified
- browser extension contexts remain separate from normal web pages
- the architecture can remain understandable six months later

## Decision summary

```text
Browser extension
    → WebExtension + WXT + TypeScript

Server-driven Web
    → Go + HTMX when appropriate

Interactive Web
    → TypeScript + justified UI framework + backend

Native-first desktop
    → native toolkit / Go / Rust as appropriate

Desktop Web UI
    → thin WebView shell + TypeScript

Chromium-specific desktop application
    → embedded Chromium only when explicitly justified

Single-user local data
    → SQLite

Server-side multi-user data
    → PostgreSQL or appropriate server DB

Runtime rule
    → choose the smallest sufficient runtime
```

The correct architecture is the lightest one that satisfies the product—not the one with the most familiar technology.