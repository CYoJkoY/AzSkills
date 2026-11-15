---
name: godot-3-dev
description: Write, review, and down-port Godot 3.x (3.6) GDScript and scenes without re-calling engine-dispatched virtuals and without Godot 4.x symbols.
version: 2.6.0
status: module
family: architecture
modes: [script, review, port]
---

# Godot 3 Dev

Turn a Godot 3.x request into 3.6-valid GDScript, a scene or node change, or a
ranked review of existing 3.x code. This module owns Godot 3.x virtual-callback
dispatch, the Godot 3.6 class-reference surface, GDScript 3.x syntax, and node
lifetime idioms. It does not port a project up to Godot 4.x, produce art, or write
store pages.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../../SKILL-SYSTEM.md).

## Contract

- Use when: a task writes, fixes, reviews, or down-ports GDScript, scenes, or nodes for a Godot 3.x project, or the request names Godot 3, Godot 3.6, or GDScript in a 3.x context.
- Do not use when: the project is Godot 4.x, or the task is engine-agnostic architecture, game art, or store copy.
- Owns: engine-dispatched virtual discipline, the 3.6 API surface, GDScript 3.x syntax, and node or scene lifetime idioms.
- Inputs: target engine version, script and base-script paths, scene files, parser or console errors, and the official 3.6 class reference.
- Outputs: pasteable GDScript plus a verification table naming every virtual override and every engine symbol touched.
- Compose with: `az-clean-code` when the deliverable is application logic that must also meet C1-C7; `architecture` when node ownership or autoload boundaries are in scope.
- Gates: no `._virtual()` call inside an engine-dispatched override; every engine symbol exists in the 3.6 class reference; no Godot 4.x class name, annotation, or keyword.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `script` | New or changed GDScript inside a Godot 3.x project | Pin version, classify virtuals, implement, verify symbols | Script and verification table |
| `review` | Existing 3.x scripts need a defect pass | Parse overrides, hunt re-called virtuals and 4.x symbols, rank by runtime risk | Findings with exact locations and patches |
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

### 7. Verify mechanically

Before returning code, run the checks that catch these defects:

```text
re-called virtuals   search "^\s*\._(ready|process|physics_process|input|unhandled_input|enter_tree|exit_tree|notification|draw|gui_input|integrate_forces)\s*\("
4.x symbols          search Node3D|CharacterBody|instantiate\(|await |create_tween|@export|@onready|@tool|PackedStringArray|FileAccess|randf_range|change_scene_to_file|linear_interpolate-free code
version drift        project.godot config_version and every scene node type
```

Then run the project or the editor script parser and report the real result. A
claim that the script parses is only acceptable when it was actually parsed.

### 8. Report the evidence

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
- [ ] Every engine symbol used resolves in the official Godot 3.6 class reference or the 3.6 source tree.
- [ ] No Godot 4.x class name, annotation, keyword, or Callable connection appears in the output.
- [ ] Signal connections use the 3.x `connect(signal, target, method, binds, flags)` form.
- [ ] Node access, `queue_free`, `is_instance_valid`, and deferred calls respect 3.x lifetimes.
- [ ] The script was actually parsed or the project actually run, and the result is reported.
- [ ] Every unverified symbol or assumption is listed instead of being presented as fact.

## Output contract

```text
Engine version and evidence:
Scripts or diffs:
Virtual audit:
  callback | engine-dispatched | parent re-called? | why it is safe
Symbol audit:
  symbol | 3.6 source | why it is the 3.x form
Port mapping (port mode only):
  original 4.x form | replacement 3.x form | call-signature change
Verification run:
Unverified items:
```

For `review`, lead with the verdict and rank findings by runtime risk, each with
the exact file, line, and corrected code. Never hand back a rewrite without the
virtual and symbol audit.

## References

- [Virtual callbacks](../../godot-3-dev/references/virtual-callbacks.md) - engine dispatch evidence, the forbidden re-call list, and compliant patterns.
- [3.x and 4.x map](../../godot-3-dev/references/api-3x-vs-4x.md) - symbol, signature, and type differences with verified 3.6 forms.
- [GDScript 3.x](../../godot-3-dev/references/gdscript-3x.md) - syntax, signals, node access, lifetimes, and common 3.x pitfalls.
