# Godot 3.6 and Godot 4.x symbol map

Reference for the `godot-3-dev` module. The left column is what a Godot 4.x
answer often emits and must never appear in a 3.x project. The right column is
the Godot 3.6 form, checked against the official 3.6 class reference
(`https://docs.godotengine.org/en/3.6/classes/`) or the 3.6 source tree.

## Classes renamed in 4.x

| 4.x name (not in 3.x) | 3.6 name | Notes |
| :--- | :--- | :--- |
| `Node3D` | `Spatial` | 3D transform base class; `global_transform` and `look_at(target, up)` live here |
| `MeshInstance3D` | `MeshInstance` | |
| `Camera3D` | `Camera` | |
| `RigidBody3D` | `RigidBody` | `_integrate_forces(state)` takes a `PhysicsDirectBodyState` |
| `CharacterBody3D` | `KinematicBody` | Different movement API; see signatures below |
| `Area3D` | `Area` | |
| `RayCast3D` | `RayCast` | |
| `CollisionShape3D` | `CollisionShape` | |
| `CollisionPolygon3D` | `CollisionPolygon` | |
| `Marker3D` | `Position3D` | |
| `Light3D` | `Light` | `OmniLight`, `SpotLight`, `DirectionalLight` |
| `StandardMaterial3D` | `SpatialMaterial` | |
| `FileAccess` | `File` | `open`, `store_string`, `get_as_text(skip_cr=true)`, `close` |
| `DirAccess` | `Directory` | `open`, `list_dir_begin`, `get_next`, `close` |

2D classes keep their 3.x names in 4.x, but the 4.x body and input APIs still
differ; never copy a 4.x 2D snippet into a 3.x project without checking every
call.

## Methods and syntax renamed in 4.x

| 4.x form (not in 3.x) | 3.6 form | Notes |
| :--- | :--- | :--- |
| `packed_scene.instantiate()` | `packed_scene.instance()` | 3.6 signature: `instance(edit_state=0)` |
| `await signal` | `yield(object, "signal_name")` | Also `yield(get_tree().create_timer(seconds), "timeout")` for delays |
| `create_tween()` | `Tween` node | `interpolate_property(object, "property", from, to, duration, trans, ease, delay)` then `start()` |
| `sig.connect(callable)` | `connect("sig", self, "method", [binds], flags)` | No Callable in 3.x |
| `sig.disconnect(callable)` | `disconnect("sig", self, "method")` | |
| `sig.is_connected(callable)` | `is_connected("sig", self, "method")` | |
| `sig.emit(args)` | `emit_signal("sig", args)` | |
| `get_tree().change_scene_to_file(path)` | `get_tree().change_scene(path)` | Or `change_scene_to(PackedScene)` |
| `@onready` | `onready` | |
| `@export` | `export(type)` | For example `export(int) var speed = 10` |
| `@tool` | `tool` | First line of the script |
| `@export_range` | `export(int, 0, 100) var x` | Range hint inside `export` |
| `Vector2.lerp(to, weight)` | `Vector2.linear_interpolate(to, weight)` | `move_toward(to, delta)` is unchanged |
| `randf_range(a, b)` | `rand_range(a, b)` | `randf()` and `randi()` are unchanged |
| `Array[int]`, typed dictionaries | untyped `Array` | No typed collections in 3.x |
| `PackedStringArray`, `PackedByteArray`, `PackedVector2Array` | `PoolStringArray`, `PoolByteArray`, `PoolVector2Array` | |
| `DisplayServer.window_set_size(v)` | `OS.window_size = v` | 3.x has no `DisplayServer` |
| `DisplayServer.screen_get_size()` | `OS.get_screen_size(screen=-1)` | |
| `Control.size`, `Control.custom_minimum_size`, `Control.position` | `rect_size`, `rect_min_size`, `rect_position` | Layout offsets are `margin_left`, `margin_top`, `margin_right`, `margin_bottom` |
| `Time.get_ticks_msec()` preferred over `OS.get_ticks_msec()` | `OS.get_ticks_msec()` works, `Time.get_ticks_msec()` also exists in 3.6 | Prefer `Time` when targeting 3.6 only |

## Call signatures that changed

The name alone is not enough; the argument list changed as well.

```gdscript
# Godot 3.x: velocity is an argument and the resolved velocity comes back.
extends KinematicBody
var velocity = Vector3.ZERO
func _physics_process(delta):
    velocity.y -= 9.8 * delta
    velocity = move_and_slide(velocity, Vector3.UP)
    if is_on_floor():
        velocity.y = 0.0
```

```gdscript
# Godot 4.x equivalent, which must not be used in a 3.x project.
extends CharacterBody3D
func _physics_process(delta):
    velocity.y -= 9.8 * delta
    move_and_slide()
```

The same split applies to `KinematicBody2D`, `move_and_collide`, and
`move_and_slide_with_snap`: in 3.x the velocity is passed in, and the 2D and 3D
variants use `Vector2` and `Vector3` respectively.

```gdscript
# Godot 3.x tween node
onready var tween = $Tween
func fade_out():
    tween.interpolate_property(self, "modulate:a", 1.0, 0.0, 0.4,
        Tween.TRANS_LINEAR, Tween.EASE_IN_OUT)
    tween.start()
```

```gdscript
# Godot 3.x signal and connection
signal died(by)
func _ready():
    connect("died", self, "_on_died")
func die(by):
    emit_signal("died", by)
func _on_died(by):
    queue_free()
```

## Not actually 4.x-only

Do not reject these; they exist in 3.6 and are often mistaken for 4.x additions:

- `Input.get_axis(negative, positive)`, `Input.get_vector(...)`,
  `Input.get_action_strength(action)`, `Input.is_action_pressed(action, exact)`.
- `Time.get_ticks_msec()` and `Time.get_ticks_usec()`.
- Static typing in function signatures: `func apply(amount: int) -> void:` and
  `var speed := 10.0` type inference.
- `class_name`, `enum`, `match`, `const`, default arguments, and inner classes.
- `Vector2.move_toward`, `Vector2.direction_to`, `Array.shuffle`,
  `is_instance_valid`, `call_deferred`, `set_deferred`.
- `Node.rset`, `Node.rget`, and `set_network_master`, which are 3.x-era
  multiplayer APIs removed in 4.x.

## Verification procedure

For every symbol the script touches:

1. Open the class page under `https://docs.godotengine.org/en/3.6/classes/` and
   confirm the method, property, or signal exists with that argument list.
2. When the page is ambiguous, read the 3.6 source for the class and check the
   `bind_method` or `add_property` entry.
3. In the editor, confirm the symbol resolves in the built-in class reference or
   through autocompletion on a typed variable.
4. Record the result in the module's symbol-audit table. An unverified symbol is
   reported as unverified, not silently shipped.

Anything that only resolves against Godot 4.x documentation is a defect in a 3.x
deliverable, even when the code would run in 4.x.
