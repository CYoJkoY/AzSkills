# Virtual callbacks in Godot 3.x

Reference for the `godot-3-dev` module. Target engine: Godot 3.6.

## The rule

An override of an engine-dispatched virtual must not call the parent
implementation. This is wrong in Godot 3.x GDScript:

```gdscript
extends "res://enemy.gd"

func _ready():
    ._ready()               # WRONG: the base _ready runs a second time
    print("boss ready")

func _physics_process(delta):
    ._physics_process(delta)  # WRONG: base physics step runs twice per frame
    apply_boss_aura(delta)
```

The engine already calls the base implementation, so the explicit call duplicates
it: double side effects, double movement or timer updates, double signal
connections, and a wrong execution order.

The correct override contains only the work that belongs to this script:

```gdscript
extends "res://enemy.gd"

func _ready():
    print("boss ready")

func _physics_process(delta):
    apply_boss_aura(delta)
```

## Why it duplicates

Godot 3.x dispatches these virtuals with multilevel calls, which walk the whole
script inheritance chain instead of stopping at the most derived script.

| Dispatch site (Godot 3.6 source) | Engine call | Order |
| :--- | :--- | :--- |
| `scene/main/node.cpp`, `NOTIFICATION_READY` | `call_multilevel_reversed("_ready")` | base first, then derived |
| `scene/main/node.cpp`, `NOTIFICATION_ENTER_TREE` | `call_multilevel_reversed("_enter_tree")` | base first, then derived |
| `scene/main/node.cpp`, `NOTIFICATION_EXIT_TREE` | `call_multilevel("_exit_tree")` | derived first, then base |
| `scene/main/node.cpp`, `NOTIFICATION_PROCESS` | `call_multilevel("_process", delta)` | derived first, then base |
| `scene/main/node.cpp`, `NOTIFICATION_PHYSICS_PROCESS` | `call_multilevel("_physics_process", delta)` | derived first, then base |
| `scene/main/scene_tree.cpp`, `_call_input_pause` | `n->call_multilevel(method)` for `_input`, `_unhandled_input`, `_unhandled_key_input` | derived first, then base |

The script layer does the walking:

- `modules/gdscript/gdscript.cpp`, `GDScriptInstance::call_multilevel` starts at the
  most derived script and follows `_base` to the root, calling the method at
  every level that defines it.
- `GDScriptInstance::call_multilevel_reversed` recurses into `_base` first, then
  calls the current level.
- `GDScriptInstance::notification` calls `_notification` at every level.
- `GDScriptInstance::set`, `get`, and `get_property_list` loop over levels for
  `_set`, `_get`, and `_get_property_list`.

The official Godot 3.6 page "Overridable functions" shows the same contract for
GDScript: its `_ready`, `_enter_tree`, `_exit_tree`, `_process`,
`_physics_process`, `_input`, and `_unhandled_input` samples contain no parent
call. Only the C# samples write `base._Ready()`, because C# dispatch differs.

## Forbidden calls and their replacement

| Virtual | Never write | Do instead |
| :--- | :--- | :--- |
| `_ready` | `._ready()` | Add only derived setup; the base `_ready` already ran first |
| `_enter_tree` | `._enter_tree()` | Add only derived setup; the base already ran first |
| `_exit_tree` | `._exit_tree()` | Add only derived cleanup; the base runs after yours |
| `_process` | `._process(delta)` | Add only derived per-frame work; toggle with `set_process()` |
| `_physics_process` | `._physics_process(delta)` | Add only derived physics work; toggle with `set_physics_process()` |
| `_input` | `._input(event)` | Add only derived input; toggle with `set_process_input()` |
| `_unhandled_input` | `._unhandled_input(event)` | Add only derived input; toggle with `set_process_unhandled_input()` |
| `_unhandled_key_input` | `._unhandled_key_input(event)` | Same rule as `_unhandled_input` |
| `_notification` | `._notification(what)` | Handle only the notifications this script needs, then return |
| `_set`, `_get`, `_get_property_list` | `._set()`, `._get()`, `._get_property_list()` | Handle only this script's properties; the chain already runs all levels |
| `_draw` | `._draw()` | Draw only this script's content; request a redraw with `update()` |
| `_gui_input` | `._gui_input(event)` | Handle only this control's input; call `accept_event()` when consumed |
| `_input_event` on a collision object | `._input_event(...)` | Handle only this body's picking; do not chain it |
| `_integrate_forces` | `._integrate_forces(state)` | Modify only this body's state; the engine runs one integration per level-set |

## When `._method()` is correct

`._name()` is legitimate for ordinary methods, because it resolves one base
implementation and the engine never calls those methods for you:

```gdscript
extends "res://base_actor.gd"

func take_damage(amount):
    .take_damage(amount)   # OK: take_damage is a plain method, not a virtual
    flash()
```

Shared initialization that both scripts need belongs in a named method, called
deliberately from each `_ready` and never named like a virtual:

```gdscript
# actor.gd
extends KinematicBody2D

func _ready():
    _configure_actor()

func _configure_actor():
    add_to_group("actors")
    set_physics_process(true)
```

```gdscript
# player.gd
extends "res://actor.gd"

func _ready():
    _configure_actor()     # base _ready already ran; this is a plain method
    connect("died", self, "_on_died")
```

Calling `._ready()` from another node (for example from a spawner) has the same
defect: it runs that node's `_ready` a second time on top of the engine call.
Initialize through a public method with a real name instead.

## Detection recipe

Search the whole script set, including inherited scenes and `tool` scripts:

```text
^\s*\._(ready|enter_tree|exit_tree|process|physics_process|fixed_process|input|unhandled_input|unhandled_key_input|notification|draw|gui_input|input_event|integrate_forces|set|get|get_property_list)\s*\(
\b(ready|physics_process|process)\s*\(\s*\)\s*\n.*\._(ready|physics_process|process)
```

`_fixed_process` is the pre-2.0 name; flag it as stale Godot 2 code to rename.

For each hit, decide:

1. Is the called function an engine-dispatched virtual? Delete the call.
2. Is it an ordinary method? Keep the call only when the intent is one base
   implementation.
3. Does the base actually need to run? If yes, the engine already does it when
   both scripts are in the same inheritance chain. If the base script is a
   different chain, the call is still wrong; expose a named method.

## Review checklist

- [ ] No `._ready()`, `._physics_process()`, `._process()`, `._input()`, `._unhandled_input()`, `._enter_tree()`, `._exit_tree()`, or `._notification()` call remains.
- [ ] No `._draw()`, `._gui_input()`, `._input_event()`, or `._integrate_forces()` call remains.
- [ ] No `._set()`, `._get()`, or `._get_property_list()` call remains.
- [ ] Every surviving `._method()` targets an ordinary method that the engine does not dispatch.
- [ ] Parent initialization happens through a named method or through the engine, never through a virtual re-call.
- [ ] Process and input toggles use `set_process`/`set_physics_process`/`set_process_input`/`set_process_unhandled_input`, not a manual re-call.
