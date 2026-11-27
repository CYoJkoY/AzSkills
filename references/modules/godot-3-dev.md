---
name: godot-3-dev
description: Write, review, and down-port Godot 3.x (3.6) GDScript and scenes without re-calling engine-dispatched virtuals, without Godot 4.x symbols, and with the Extensions, Custom, Methods, and Signals layout.
version: 2.9.0
status: module
family: architecture
modes: [script, review, port]
---

# Godot 3 Dev

Turn a Godot 3.x request into 3.6-valid GDScript, a scene or node change, or a
ranked review of existing 3.x code. This module owns Godot 3.x virtual-callback
dispatch, the Godot 3.6 class-reference surface, GDScript 3.x syntax, and node
lifetime idioms. It also owns the four-section function layout, divider lines,
and naming of every GDScript file, including a mod script that extends a base
game script. It does not port a project up to Godot 4.x, produce art, or write
store pages.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../../SKILL-SYSTEM.md).

## Contract

- Use when: a task writes, fixes, reviews, or down-ports GDScript, scenes, or nodes for a Godot 3.x project, or the request names Godot 3, Godot 3.6, or GDScript in a 3.x context.
- Do not use when: the project is Godot 4.x, or the task is engine-agnostic architecture, game art, or store copy.
- Owns: engine-dispatched virtual discipline, the 3.6 API surface, GDScript 3.x syntax, node or scene lifetime idioms, and the four-section script layout, divider lines, and prefixes.
- Inputs: target engine version, script and base-script paths, scene files, parser or console errors, and the official 3.6 class reference.
- Outputs: pasteable GDScript plus a verification table naming every virtual override, every engine symbol touched, and every section boundary.
- Compose with: `az-clean-code` when the deliverable is application logic that must also meet C1-C7; `architecture` when node ownership or autoload boundaries are in scope.
- Gates: no `._virtual()` call inside an engine-dispatched override; every engine symbol exists in the 3.6 class reference; no Godot 4.x class name, annotation, or keyword; every function name you write is lowercase snake_case; a marked mod script keeps Extensions, Custom, Methods, and Signals sections under their divider lines in that order, with lowercase prefixed names.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `script` | New or changed GDScript inside a Godot 3.x project | Pin version, classify virtuals, lay out four sections, implement, verify symbols | Script and verification table |
| `review` | Existing 3.x scripts need a defect pass | Parse overrides, hunt re-called virtuals and 4.x symbols, check section dividers, order, and names, rank by runtime risk | Findings with exact locations and patches |
| `port` | 4.x code or 4.x-style guidance must become 3.6 | Map each symbol to its 3.6 form, rewrite, verify | Ported script and mapping table |

## Workflow

### 1. Pin the engine version first

Establish Godot 3.x before writing a line:

```text
project.godot        config_version=4 is a Godot 3.x project; 5 is Godot 4.x
res://*.tscn         Godot 3.x scenes keep the 3.x node type names
godot --version      must report 3.x, ideally 3.6
```

If the project is 4.x, stop and say so. Never mix 3.x and 4.x guidance in one
answer. When the user gives no version and the code shows no marker, ask once.

### 2. Treat the official 3.6 documentation as the only API authority

Check symbols against `https://docs.godotengine.org/en/3.6/classes/` and the
editor's built-in class reference. A Godot 4.x manual page, a 4.x tutorial, or a
4.x snippet is not evidence that a symbol exists in 3.6. Every engine symbol you
use must be traceable to a 3.6 page or the 3.6 source tree.

### 3. Classify every virtual before writing the body

List the callbacks the script overrides and mark each as engine-dispatched or as
an ordinary method. Engine-dispatched virtuals are already called by the engine
for every script level in the inheritance chain, so an override must never call
the parent implementation again. Read
[virtual callbacks](../../godot-3-dev/references/virtual-callbacks.md) before
writing any `_ready`, `_process`, `_physics_process`, `_input`, `_unhandled_input`,
`_enter_tree`, `_exit_tree`, `_notification`, `_draw`, `_gui_input`, or
`_integrate_forces` override.

### 4. Delete the double call and keep the shape

Remove `._ready()`, `._physics_process(delta)`, and their siblings. Put shared
initialization in a named method that the base and derived scripts call
deliberately, or let the base `_ready` run through the engine. Keep `._name()`
only for ordinary methods, where it correctly calls one base implementation.

### 5. Write GDScript 3.x, not GDScript 2.0

Use `onready`, `export(type) var`, `tool`, `yield`, `connect("signal", self, "method")`,
`Pool*Array`, `File` or `Directory`, and `Spatial`-`KinematicBody` style class
names. Never emit `@onready`, `@export`, `@tool`, `await`, Callable connections,
`Packed*Array`, `FileAccess`, or `Node3D`. Read
[GDScript 3.x](../../godot-3-dev/references/gdscript-3x.md) for the working
syntax set.

### 6. Port 4.x symbols with the mapping table

In `port` mode, walk the input line by line and replace each symbol with its 3.6
form from [the 3.x and 4.x map](../../godot-3-dev/references/api-3x-vs-4x.md).
Do not translate silently: keep a mapping row per change, including call-signature
changes such as `move_and_slide(velocity, up_direction)` returning the resolved
velocity in 3.x.

### 7. Lay out the script in four sections

Every GDScript file keeps its functions in four sections in this order:
Extensions (engine-dispatched virtuals and the base script's functions this
file overrides), Custom (the `<ext>_*` functions those entries call), Methods
(reusable helpers and the public API), and Signals (handlers whose only caller
is a `connect()` target). Each section opens with its divider line. Read
[script layout](../../godot-3-dev/references/script-layout.md) before writing
the first function.

- The divider is `#`, one space, 42 U+2550 bars, one space, the label, one
  space, 42 bars, one space, `#`. The label is exactly `Extensions`, `Custom`,
  `Methods`, or `Signals`; copy the four lines from the reference. A 41-bar
  bar, a singular label, or a missing ` #` is a defect.
- Classify a function by its caller: a `connect()` target is Signals; an engine
  or base-script entry is Extensions; a helper that Custom, Methods, or another
  script calls is Methods; the code an Extensions entry runs is Custom. Section
  is not topic, so two functions about one subject split when different callers
  reach them.
- Declarations stay above the first divider: `tool`, `class_name`, `extends`,
  `signal`, `const`, `export(...)`, `onready`, and `var`. `Variables` and
  `Setters` dividers are allowed there; a setter body goes under `Setters` and
  its `setget` name stays with the variable. No other banner may sit above
  Extensions, and a setter body is a declaration rather than a layer member, so
  it is not order-checked.
- Every function you write is lowercase with `_` between words, in any
  GDScript file. Inside a mod script the prefix follows the section: `<ext>_*`
  for Custom, `<method>_*` for Methods, `<method>_on_*` for Signals. For
  `MoreStatsContainer` that is `moresc_*`, `msc_*`, and `msc_on_*`.
- A function the base script declares keeps its base name and body. Renaming it
  breaks base call sites, and a base name that already carries a capital stays
  untouched.
- Add one Custom function per base insertion point and call it from the
  Extensions function instead of growing the base body.
- Omit the divider of a section with no function, and never open a section out
  of order.
- Mark the script with `# azskills-mod: <ModName>` in a comment before the first
  function, or run the checker with `--mod <Name>`, so the mod gate applies. A
  standalone script takes `# azskills-layout`, or the check runs with
  `--layout`; there the checker decides only the two ends, Extensions for an
  engine or ancestor entry and Signals for a `connect()` target or `_on_*`
  name, and accepts a helper in Custom or Methods.

### 8. Verify mechanically

Before returning code, run the bundled deterministic checker against the project:

```text
node "<skill-root>/godot-3-dev/scripts/check-godot-3x.ts" --root "<project>" --api "<skill-root>/godot-3-dev/references/api-3.6.json" --json
```

The checker uses an official Godot 3.6 API snapshot and catches re-called
virtuals, Godot 4.x syntax and symbols, scene format drift, unknown scene node
types, project-setting drift, missing `extends`/`preload`/scene-script/`load()`
resource paths, missing autoload targets, inherited method and signal names,
high-risk 3.x physics mistakes, and mod section dividers. Every project script
and scene
participates in the symbol index; `--files` only selects which files report
findings, and `--overlay` substitutes proposed contents so a write can be
checked against the real project. `--mod` and `--layout` gate scripts that carry
no marker, and a marker always wins over a flag. Treat a nonzero exit code as
blocking.

In Codex, the canonical edit tool is `apply_patch`, which carries the patch
text in `tool_input.command`; `Write` and `Edit` are matcher aliases, and
synthetic `MultiEdit` events are still understood. The `PreToolUse` guard runs
this checker on reconstructable patch content before the write and denies
checker errors; `project.godot` also joins the checked targets, so a
`config_version=5` project rejects even a clean-looking 3.x script. Partial or
ambiguous patches fall back to the high-confidence lexical guard instead of
guessing the final file, and an unavailable checker degrades to the lexical
guard with a manual-check note rather than blocking every write. After write,
the hook reruns the checker and blocks further progress while errors remain.

`Bash` is guarded separately because shell tools expose no proposed content: a
command that both names a Godot file and carries a high-confidence write form
is denied and redirected to `apply_patch`; a command that both names Godot
files and shows a write form, or rewrites them through a patch or VCS command,
triggers a post-execution check. Read-only commands that merely mention Godot
files do not. Shell content produced inside a generated program, a build tool,
or a runtime-assembled path remains invisible to static command inspection;
run the checker directly after such writes.

The checker is static evidence, not a runtime proof: call signatures, dynamic
members, `tres`/shader resources, and runtime behavior still need the project
or the editor script parser, and the real result must be reported.

### 9. Report the evidence

Return the script plus the verification table from the output contract below.
Name each virtual override and why it is safe, and each engine symbol with the
3.6 page or source that proves it exists. List anything you could not verify.

## Godot 3.6 API discipline

- The target is Godot 3.6, the last 3.x release. 3.0 to 3.5 projects accept the
  same core API; note version-specific additions instead of using them blindly.
- Process callbacks are enabled automatically in 3.x: `_ready` turns on
  `_process` when the script defines it, and `_physics_process` and the input
  callbacks likewise. Use `set_process` or `set_physics_process` to switch them
  off, never to re-arm a callback that the engine already enabled.
- Godot 3.x has no Callable, no annotations, no typed collections, and no
  `DisplayServer`. Signals use `connect` with a target object and method name.
- 3.x physics bodies carry their own API: `KinematicBody` and `KinematicBody2D`
  move with `move_and_slide(linear_velocity, up_direction, ...)` and report state
  through `is_on_floor()`, `is_on_wall()`, and `get_slide_count()`.
- 3.x animation uses the `Tween` node with `interpolate_property(object,
  "property", from, to, duration, trans, ease, delay)` and `start()`, or
  `yield(get_tree().create_timer(seconds), "timeout")` for delays.
- Scenes are created with `PackedScene.instance()` and loaded with `load` or
  `preload`; scene changes use `get_tree().change_scene(path)` or
  `change_scene_to(packed_scene)`.

## Quality gates

- [ ] The engine version is established as Godot 3.x before any code is written.
- [ ] No engine-dispatched virtual is re-called from its own override, or from any other override.
- [ ] The bundled Godot 3.6 mechanical checker was run; its command, exit code, errors, warnings, and unverified items are reported.
- [ ] Every engine symbol used resolves in the official Godot 3.6 class reference or the 3.6 source tree.
- [ ] No Godot 4.x class name, annotation, keyword, or Callable connection appears in the output.
- [ ] Signal connections use the 3.x `connect(signal, target, method, binds, flags)` form.
- [ ] Node access, `queue_free`, `is_instance_valid`, and deferred calls respect 3.x lifetimes.
- [ ] A script keeps its functions in Extensions, Custom, Methods, then Signals, and each non-empty section starts with its divider line.
- [ ] Every divider carries exactly 42 U+2550 bars on each side and the plural label `Extensions`, `Custom`, `Methods`, or `Signals`.
- [ ] A mod script keeps `<ext>_*` functions in Custom, `<method>_*` in Methods, and `<method>_on_*` in Signals, with no section out of order.
- [ ] Every function you write is lowercase snake_case, mod prefixes included, and every native function keeps its base name.
- [ ] A mod script carries `# azskills-mod: <ModName>` or the check ran with `--mod <Name>`, and its `MOD_*` findings, including `MOD_SECTION_*`, are reported.
- [ ] A standalone script that carries `# azskills-layout` or was checked with `--layout` reports no `SCRIPT_*` finding, and its Extensions and Signals members sit under the right dividers.
- [ ] The script was actually parsed or the project actually run, and the result is reported; static checks alone are not presented as runtime proof.
- [ ] Every unverified symbol or assumption is listed instead of being presented as fact.

## Output contract

```text
Engine version and evidence:
Scripts or diffs:
Virtual audit:
  callback | engine-dispatched | parent re-called? | why it is safe
Symbol audit:
  symbol | 3.6 source | why it is the 3.x form
Script layout audit (gated scripts only):
  section | divider ok? | function | prefix | order ok?
Port mapping (port mode only):
  original 4.x form | replacement 3.x form | call-signature change
Verification run:
Mechanical check: command | exit code | errors | warnings
Unverified items:
```

For `review`, lead with the verdict and rank findings by runtime risk, each with
the exact file, line, and corrected code. Never hand back a rewrite without the
virtual and symbol audit.

## References

- [Virtual callbacks](../../godot-3-dev/references/virtual-callbacks.md) - engine dispatch evidence, the forbidden re-call list, and compliant patterns.
- [3.x and 4.x map](../../godot-3-dev/references/api-3x-vs-4x.md) - symbol, signature, and type differences with verified 3.6 forms.
- [GDScript 3.x](../../godot-3-dev/references/gdscript-3x.md) - syntax, signals, node access, lifetimes, and common 3.x pitfalls.
- [Script layout](../../godot-3-dev/references/script-layout.md) - the four sections, the exact divider format, classification by caller, the `moresc_`/`msc_`/`msc_on_` naming rules, prefix derivation, and the `# azskills-mod` and `# azskills-layout` marker lines.
- [Mechanical check](../../godot-3-dev/references/mechanical-check.md) - bundled static checker, API snapshot, hook behavior, and limitations.
- [Godot 3.6 API snapshot](../../godot-3-dev/references/api-3.6.json) - generated from the official 3.6-stable source tree.
