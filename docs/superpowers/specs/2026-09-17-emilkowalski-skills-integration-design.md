# emilkowalski/skills → AzSkills Integration Design

**Issue:** #6  
**Source snapshot:** `emilkowalski/skills@85e8e2363b713506e1d5b6e07a0eb2da66be1bc3`  
**Target:** `CYoJkoY/AzSkills`  
**Date:** 2026-09-17

## 1. Purpose

Integrate the transferable engineering and design methodology from `emilkowalski/skills` into AzSkills as native capabilities.

The integration is **not** a vendor directory import. AzSkills remains the architectural owner: upstream material is analyzed, decomposed by responsibility, rewritten where necessary, connected to existing AzSkills layers, and excluded when its value is too provider-specific or redundant.

The resulting system must feel as though the motion, mobile, prototyping, component-selection, and Swift disciplines were designed as part of AzSkills from the beginning.

## 2. Current-state findings

AzSkills already contains a shared visual-reasoning layer in `design-intelligence.md`, production UI execution in `ui-design`, visual judgment in `ui-aesthetics`, frontend architecture in `frontend-architecture`, and documentation/provenance mechanisms. The repository therefore has the right substrate for deep integration.

The upstream repository currently exposes these skill areas:

- `emil-design-eng`
- `animate`
- `animate-expo`
- `review-animations`
- `improve-animations`
- `find-animation-opportunities`
- `animation-vocabulary`
- `apple-design`
- `write-swift`
- `pick-ui-library`
- `prototype`
- `mobile-native`
- `ask-sonner`

The key architectural distinction in the upstream project is that construction, review, auditing, opportunity discovery, platform-specific motion, prototyping, and dependency lookup are intentionally separated. AzSkills will preserve those meaningful boundaries while removing avoidable duplication.

## 3. Integration principles

### 3.1 AzSkills owns the final behavior contract

No upstream Skill will be copied wholesale merely because it already uses `SKILL.md`.

Every integrated capability must follow AzSkills conventions for:

- scope and trigger boundaries;
- precedence and composition;
- repository-native inspection;
- explicit quality gates;
- verification before completion;
- references and progressive disclosure;
- provenance.

### 3.2 Shared rules become shared rules

A rule that applies across visual Skills belongs in `design-intelligence.md` or a focused shared reference, not duplicated in `ui-design`, `ui-aesthetics`, `ui-motion`, and other Skills.

### 3.3 Preserve distinct workflows

Different responsibilities remain independently invocable when their output or risk profile differs materially:

```text
build motion        → ui-motion
review motion       → ui-motion-review
audit motion        → ui-motion-audit
find motion         → ui-motion-audit / opportunity mode
explore variants    → ui-prototyping
mobile web hardening → mobile-web
Swift engineering   → swift-engineering
```

### 3.4 Provider-specific material stays at the edge

Sonner-specific API knowledge, Expo-specific implementation details, curated library preferences, and Apple-specific guidance should not become universal AzSkills doctrine.

Transferable principles become AzSkills capabilities; provider-specific knowledge remains optional reference material with explicit scope.

### 3.5 Existing project identity wins

The integrated methodology must never cause an existing project's framework, component library, styling system, icon system, or motion tokens to be replaced merely to match an upstream preference.

## 4. Capability mapping

| Upstream | AzSkills destination | Integration policy |
|---|---|---|
| `emil-design-eng` | `design-intelligence.md`, `ui-design`, `ui-aesthetics` | Absorb the transferable judgment: purposeful motion, frequency-aware animation, component tactility, origin/physicality, interruptibility, restraint, perceived performance, and invisible edge-case correctness. Do not create an Emil-specific parallel UI doctrine. |
| `animate` | `ui-motion/SKILL.md` | Create a focused motion-construction Skill. Keep the upstream decision sequence, but make it use AzSkills tokens, project conventions, accessibility rules, and architecture boundaries. |
| `animate-expo` | `mobile-motion/SKILL.md` or a platform section under the mobile design system | Keep React Native / Expo thread, gesture, worklet, haptic, and release-build rules separate from Web motion. Do not leak RN-specific APIs into general `ui-motion`. |
| `review-animations` | `ui-motion-review/SKILL.md` | Dedicated motion-only review contract. Review is read-only; implementation fixes are a separate task. Output follows AzSkills review conventions while retaining the upstream motion-specific finding structure. |
| `improve-animations` | `ui-motion-audit/SKILL.md` | Dedicated codebase-wide audit capability. Produces prioritized, executable plans and does not directly edit production motion. |
| `find-animation-opportunities` | `ui-motion-audit/SKILL.md` | Fold into an explicit opportunity-discovery mode because it is the discovery half of the same audit boundary and should share its scanning vocabulary. |
| `animation-vocabulary` | `ui-motion/references/animation-vocabulary.md` | Progressive-disclosure terminology reference. It does not need its own top-level Skill. |
| `apple-design` | `design-intelligence.md` plus `ui-design/references/apple-interface-principles.md` | Internalize general principles such as physicality, restraint, feedback, continuity, typography, and reduced motion. Preserve Apple-specific guidance only as optional reference material. |
| `write-swift` | `swift-engineering/SKILL.md` | Create a standalone language/platform Skill. Swift has an independent execution model and should not be buried inside UI Skills. |
| `pick-ui-library` | `frontend-architecture/SKILL.md` plus optional `frontend-architecture/references/component-selection.md` | Internalize dependency-selection discipline: identify the task, inspect installed dependencies, preserve existing libraries, justify every new dependency, and use platform APIs when sufficient. Do not copy the upstream vendor list as a permanent recommendation database. |
| `prototype` | `ui-prototyping/SKILL.md` | Create a dedicated exploration Skill. Prototype surfaces are isolated from production code; variants must be meaningfully divergent, functional, and evaluated at realistic size. |
| `mobile-native` | `mobile-web/SKILL.md` plus `ui-design` integration | Create a focused mobile-Web platform Skill for viewport, touch, hover capability, safe areas, keyboard behavior, overscroll, input sizing, and real-device verification. Do not mix it with React Native. |
| `ask-sonner` | `ui-design` feedback guidance plus optional `ui-design/references/sonner.md` | Do not add a Sonner-specific core Skill. Toast architecture, feedback semantics, interruption, and accessibility become general guidance; Sonner API details remain optional and explicitly vendor-bound. |

## 5. Shared visual reasoning changes

`design-intelligence.md` becomes the integration point for the cross-artifact principles that currently exist partly inside individual upstream Skills.

Add or strengthen these concepts:

### 5.1 Motion decision gate

Before implementing motion, determine:

```text
Should it move?
↓
Why does it move?
↓
How frequently is it seen?
↓
What state or spatial relationship does it communicate?
↓
What is the cheapest implementation that preserves that intent?
```

A request can legitimately result in **no animation**. This is a successful outcome when motion would add friction without communication value.

### 5.2 Motion system consistency

Motion joins the same design-system hierarchy already used elsewhere:

```text
Primitive → Semantic → Component → State
```

Motion tokens cover:

```text
purpose
frequency tier
duration
easing
spring behavior
transform origin
reduced-motion variant
```

A Skill must extend the existing motion vocabulary instead of introducing a parallel set of unrelated curves or duration scales.

### 5.3 Physical and interruptible interaction

Shared principles include:

- trigger-anchored overlays should preserve a meaningful origin;
- entry motion should not visually emerge from mathematical nothingness;
- frequent interactions should remain crisp;
- rapidly retriggerable state should use interruptible transitions;
- gesture motion should preserve velocity and handoff where the platform supports it;
- static state semantics remain correct without motion.

### 5.4 Performance as design

The visual layer explicitly considers layout, paint, style recalculation, main-thread pressure, large-area effects, continuous motion, and device constraints.

Optimization remains evidence-driven: no `will-change`, virtualization, animation library, or background runtime is added merely because a methodology mentions it.

### 5.5 Platform capability over device guessing

For responsive and mobile interaction, reason from capabilities such as:

```text
hover capability
pointer precision
touch capability
safe-area support
viewport behavior
reduced-motion preference
```

Avoid user-agent and screen-width heuristics when platform APIs and media queries express the real constraint.

## 6. `ui-design` integration

`ui-design` remains the executable frontend authority. It receives the shared motion rules and the mobile-Web rules without becoming a giant combination of unrelated upstream Skills.

Add explicit composition rules:

```text
New / substantial UI
    ↓
frontend-architecture
    ↓
ui-design
    ├── ui-aesthetics      (visual judgment when needed)
    ├── ui-motion           (motion implementation when needed)
    └── mobile-web          (mobile Web platform behavior when needed)
```

For React Native / Expo projects:

```text
mobile application architecture
    ↓
mobile-motion
```

Do not apply Web `ui-motion` implementation recipes to React Native code.

## 7. `ui-motion` contract

`ui-motion` is a construction Skill and owns one capability: turning a motion request into an implementation that fits the project's established system.

Its internal sequence is:

```text
1. Decide whether motion earns a place.
2. Name the purpose.
3. Inspect existing motion tokens and component patterns.
4. Choose the cheapest suitable implementation mechanism.
5. Choose properties and geometry.
6. Choose easing / duration / spring from project tokens or approved references.
7. Design interruption and exit behavior.
8. Add reduced-motion and pointer capability handling.
9. Implement.
10. Verify the rendered behavior.
```

The Skill must explicitly reject common defects such as broad `transition: all`, trigger-anchored overlays scaling from an unrelated origin, keyboard/high-frequency animation, missing reduced-motion behavior, and unnecessary layout animation.

When a project already has an equivalent motion system, that system wins.

## 8. `ui-motion-review` contract

The review Skill is read-only and motion-specific.

Required review structure:

```text
Findings table
    ↓
impact-ranked commentary
    ↓
approval/block decision
```

The findings table uses:

| Before | After | Why |
|---|---|---|

with source locations wherever practical.

The review checks purpose, frequency, easing, timing, physicality, interruptibility, performance, accessibility, and cohesion. It does not fix unrelated code and does not perform implementation itself.

## 9. `ui-motion-audit` contract

The audit Skill operates at codebase scope rather than a single diff.

It supports two explicit modes:

```text
Audit
  → inventory existing motion
  → classify defects
  → prioritize changes
  → produce self-contained remediation plans

Opportunities
  → inspect the interface for missing purposeful motion
  → identify useful candidates
  → explicitly reject interactions that should remain instant
```

It must distinguish missing motion from motion that should not exist. It must not turn the audit into a decorative-animation backlog.

## 10. `ui-prototyping` contract

Prototype work is deliberately divergent and isolated.

Rules:

- never modify production code during exploration;
- inspect the existing product tokens and stack first;
- define 3 genuinely different directions by default;
- use realistic product-shaped content rather than placeholder text;
- render one variant at a time at realistic size;
- keep the picker/harness implementation independent from production components;
- make switching instant because exploration switching is high-frequency;
- verify every variant before presenting them;
- promotion happens only after user selection;
- delete the temporary prototype surface after promotion unless retention is explicitly requested.

AzSkills may adapt the upstream picker structure, but the picker itself is implementation infrastructure, not a permanent design component.

## 11. `mobile-web` contract

The Skill owns Web-on-mobile platform hardening.

It covers:

```text
hover capability gating
tap feedback
viewport units
safe areas
keyboard resizing
input zoom behavior
touch-action
overscroll behavior
selection behavior
status-bar / theme-color alignment
real-device verification
```

The guiding rule is to use capability queries and platform primitives instead of device sniffing.

A mobile-Web completion claim requires hardware verification when the affected behavior cannot be faithfully reproduced by static/source inspection.

Never solve mobile input zoom by disabling user zoom. Never disable text selection globally merely to make controls feel native.

## 12. `mobile-motion` contract

This capability is limited to React Native / Expo.

It preserves the useful upstream distinctions around:

```text
React runtime vs UI/worklet runtime
gesture-driven values
interruptibility
native navigation and sheets
press feedback
haptics
reduced motion
release-build verification
```

Architecture must prefer platform-native navigation and controls when they already supply the required behavior rather than rebuilding them in JavaScript.

Animation work triggered per frame must not unnecessarily cross back into the React runtime.

The Skill must remain explicit about SDK/toolchain-version-sensitive guidance so stale platform claims do not become timeless AzSkills rules.

## 13. `swift-engineering` contract

Create a standalone Swift Skill derived from the transferable engineering discipline in `write-swift`.

Core hierarchy:

```text
value types → reference types only with identity/shared-state reason
concrete types → protocols / generics when abstraction is justified
some P → any P only for heterogeneous existential storage
synchronous / main actor → async → @concurrent → actor when justified
safe APIs → unsafe facilities only at a measured boundary
structured concurrency → unstructured tasks only when lifetime requires it
```

The Skill should teach Swift-specific failure modes rather than simply restating generic engineering advice:

- invalid state modeling;
- unnecessary reference semantics;
- actor reentrancy;
- incorrect assumptions about `async` execution;
- `Sendable` boundaries;
- unbounded task fan-out;
- continuation misuse;
- cancellation that is never observed;
- unsafe synchronization used as a warning suppressor.

Toolchain-sensitive statements must be isolated in a dedicated reference so the Skill can evolve without rewriting its architectural principles.

## 14. Dependency-selection integration

Instead of shipping a permanent copy of the upstream library list, `frontend-architecture` gains a dependency-selection protocol:

```text
Identify capability
↓
Inspect package manifest / lockfile
↓
Check whether the project already has an equivalent
↓
Prefer platform APIs when sufficient
↓
Evaluate maintenance, accessibility, performance, bundle/supply-chain cost
↓
Choose one justified dependency only when needed
↓
Record why it exists
```

A pre-existing competitor library is not replaced just to conform to an external preference.

Optional curated references may contain examples, but recommendation data is not treated as a timeless fact.

## 15. Vendor-bound material

`ask-sonner` does not become a first-class AzSkills Skill.

Generalizable knowledge is moved to UI feedback guidance:

- notification semantics;
- loading/success/error transitions;
- interruption and dismissal;
- stacking and positioning;
- accessibility;
- persistence and lifecycle considerations.

A Sonner reference can exist only as an explicitly vendor-specific implementation note. It must never imply that Sonner is universally required.

Likewise, Expo, Reanimated, Gesture Handler, and Apple-specific APIs remain inside platform-specific boundaries.

## 16. Provenance and licensing

`THIRD_PARTY_NOTICES.md` must gain a dedicated section for `emilkowalski/skills`.

The notice must state:

- upstream repository and canonical URL;
- reviewed snapshot / commit;
- which ideas were integrated;
- which material was rewritten or abstracted;
- which provider-specific content was intentionally not integrated;
- that AzSkills does not vendor the upstream repository wholesale.

The integration should preserve the upstream repository's MIT provenance where applicable while ensuring that copied source, examples, or assets are not silently represented as original AzSkills work.

## 17. README and catalog changes

README updates must present AzSkills as one coherent system, not as "AzSkills + Emil Skills".

The catalog should expose capabilities by task:

```text
Architecture
UI / visual design
Motion
Mobile
Native / language engineering
Documentation
Localization
Visual production
```

The routing section should make composition explicit. Representative routes:

```text
Build UI                    → ui-design
Refine visual quality       → ui-aesthetics + ui-design
Build animation             → ui-motion + ui-design
Review animation            → ui-motion-review
Audit animation             → ui-motion-audit
Explore UI variants         → ui-prototyping
Harden mobile Web           → mobile-web + ui-design
Build Expo / RN animation  → mobile-motion
Write / review Swift        → swift-engineering
Choose a frontend library   → frontend-architecture
```

README counts must be generated from the actual `SKILL.md` inventory rather than hand-maintained numbers.

## 18. Validation

The final integration must add or strengthen repository validation for:

### Structural validation

- every Skill directory contains a valid `SKILL.md`;
- frontmatter `name` matches the directory name;
- required descriptions are present;
- internal relative references resolve;
- referenced support files exist;
- no accidental nested external-repository copy is present.

### Composition validation

- routing targets real Skill names;
- shared-layer references do not point to deleted or renamed Skills;
- no circular documentation references are introduced;
- manual-only / explicit-invocation behavior remains clear from the Skill description and contract.

### Provenance validation

- every integrated third-party methodology is represented in `THIRD_PARTY_NOTICES.md`;
- no vendor-specific reference is presented as a universal AzSkills requirement.

### Content validation

- existing AzSkills behavior contracts remain intact unless deliberately superseded;
- upstream-specific names do not leak into generic AzSkills rules without a reason;
- motion rules are consistent across `design-intelligence.md`, `ui-design`, `ui-aesthetics`, and motion Skills.

## 19. Non-goals

This integration will **not**:

- vendor the complete upstream `skills/` tree;
- preserve upstream directory names merely for visual similarity;
- add a third parallel UI design methodology;
- make Sonner a mandatory dependency;
- make Motion / Framer Motion mandatory for Web UI;
- make React Native assumptions part of Web Skills;
- copy a static upstream library recommendation database as timeless truth;
- automatically rewrite existing AzSkills Skills simply to mention the upstream project;
- introduce unrelated new visual design systems.

## 20. Migration order

Implementation is staged so each commit is independently reviewable:

### Stage 1 — Architecture and contracts

Create this specification, define the new Skill boundaries, routing model, integration points, and provenance requirements.

### Stage 2 — Shared visual and motion foundation

Update `design-intelligence.md`, `ui-design`, `ui-aesthetics`, and `frontend-architecture` to absorb the cross-cutting methodology. Add `ui-motion` and the shared motion references.

### Stage 3 — Focused capabilities

Add:

- `ui-motion-review`;
- `ui-motion-audit`;
- `ui-prototyping`;
- `mobile-web`;
- `mobile-motion`;
- `swift-engineering`.

### Stage 4 — Documentation and provenance

Update README catalog/routing, `THIRD_PARTY_NOTICES.md`, and any repository support documentation.

### Stage 5 — Validation and final review

Add/update structural and composition validators, run all checks, review the complete branch diff against `main`, and open a PR.

## 21. Acceptance criteria

The integration is ready for review only when all of the following are true:

1. A reader can use AzSkills without knowing that the design/motion layer originated from an external repository.
2. Every meaningful upstream capability has a documented home or an explicit reason for exclusion.
3. Existing AzSkills Skills do not contain duplicated motion rules that conflict with the new system.
4. Motion construction, review, audit, and prototyping remain distinct workflows.
5. Mobile Web and React Native are clearly separated.
6. Swift engineering is independently usable.
7. Dependency selection is project-aware rather than vendor-prescriptive.
8. Sonner remains optional/vendor-bound.
9. Provenance is explicit and no upstream repository is mechanically vendored.
10. Automated validation passes.
11. The full diff from `main` has been reviewed.
12. CI for each commit passes before the next implementation stage begins.

## 22. Decision record

The architectural decision is to treat `emilkowalski/skills` as a **methodology source**, not a directory dependency.

AzSkills gains the methodology's useful primitives while maintaining its own vocabulary, precedence model, composition rules, verification standards, and documentation structure.

This creates a single growing skill system rather than two skill catalogs placed side by side.
