# GDScript 3.x syntax and idioms

Reference for the `godot-3-dev` module. Target engine: Godot 3.6. Everything
here is GDScript 1.0, the language shipped with Godot 3.x. Godot 4.x renamed or
replaced most of this surface; see [3.x and 4.x map](api-3x-vs-4x.md) for the
mapping and [virtual callbacks](virtual-callbacks.md) for the dispatch rules.

## Script header

```gdscript
extends KinematicBody2D
class_name Player                # optional global type (exists in 3.x)
tool                             # optional: run in the editor

signal died(by)
enum State { IDLE, RUN, JUMP }
```

`tool` and `class_name` are bare keywords on their own lines. There are no
annotations in 3.x, so `@tool`, `@export`, and `@onready` are 4.x defects.

## Variables

```gdscript
var health = 100                     # inferred
var speed: float = 8.0               # static type (3.x supports this)
var label := "hp"                    # type inference with :=
onready var sprite = $Sprite         # resolved after the node enters the tree
export(int) var max_health = 100     # exported to the inspector
export(float, 0.0, 1.0) var alpha = 2.0
export(bool) var debug = false
export(NodePath) var target_path
const GRAVITY = 980.0
var items = []                       # untyped Array only
```

- `export(type)` replaces `@export`. Range hints stay inside the parentheses:
  `export(int, 0, 100)`, `export(float, 0.0, 1.0, 0.1)`.
- There is no `@export_range`, no typed `Array[int]`, and no dictionary typing.
- `onready` is a prefix on `var`, not `@onready`.

## Functions

```gdscript
func take_damage(amount: int) -> void:
    health -= amount
    if health <= 0:
        emit_signal("died", self)

func heal(amount := 10) -> int:      # default argument
    health += amount
    return health
```

Return-type annotations (`-> void`) and static parameter types exist in 3.x.
Default arguments and multiple return values via arrays are fine. There are no
lambda or anonymous functions in 3.x; use a named method or a `FuncRef`.

## Control flow

```gdscript
if hp > 0 and not dead:
    move()
elif hp == 0:
    stop()
else:
    die()

match state:
    State.IDLE:
        idle()
    State.RUN, State.JUMP:
        animate()
    _:
        pass

for i in range(10):
    spawn(i)

for child in get_children():
    child.queue_free()

while not finished:
    step()
```

`match` with `_` as the default branch exists in 3.x. `and`, `or`, `not` are the
boolean operators; `&&`, `||`, `!` also parse but prefer the words.

## Signals

```gdscript
signal health_changed(current, maximum)

func _ready():
    connect("health_changed", self, "_on_health_changed")
    connect("health_changed", some_node, "_on_health_changed", [self], CONNECT_DEFERRED)

func _on_health_changed(current, maximum):
    bar.max_value = maximum
    bar.value = current

func notify():
    emit_signal("health_changed", health, max_health)
```

- `connect(signal_name, target, method, binds=[], flags=0)` takes strings and an
  object. The method is a string name, not a Callable.
- `disconnect(signal_name, target, method)` and
  `is_connected(signal_name, target, method)` follow the same string form.
- Emit with `emit_signal("name", args)`. There is no `signal.emit()`.
- Useful flags: `CONNECT_DEFERRED`, `CONNECT_ONESHOT`, `CONNECT_PERSIST`,
  `CONNECT_REFERENCE_COUNTED`.

## Node access and lifetime

```gdscript
onready var sprite = $Sprite              # shorthand for get_node("Sprite")
var node = get_node("Path/To/Node")
var maybe = get_node_or_null("Optional")  # null instead of an error
if maybe != null and is_instance_valid(maybe):
    maybe.show()

func _ready():
    $Button.connect("pressed", self, "_on_pressed")

func _on_pressed():
    var scene = preload("res://enemy.tscn")
    var enemy = scene.instance()
    add_child(enemy)
    enemy.queue_free()                    # freed at the end of the frame
    call_deferred("add_child", enemy)      # safe after tree changes
```

- `queue_free()` is the safe delete during a frame; `free()` is immediate and
  can crash callers still holding the reference.
- `is_instance_valid(obj)` guards a reference that may have been freed.
- `call_deferred("method", args...)` and `set_deferred("property", value)`
  postpone work until the current frame finishes.
- `get_parent()`, `find_node("Name")`, and groups (`add_to_group("enemies")`,
  `get_tree().get_nodes_in_group("enemies")`) all exist in 3.x.

## Scene instantiation and switching

```gdscript
const Enemy = preload("res://enemy.tscn")     # compile-time load
var Scene = load("res://level.tscn")          # runtime load

func spawn():
    var enemy = Enemy.instance()               # NOT instantiate()
    add_child(enemy)

func next_level():
    get_tree().change_scene("res://level2.tscn")          # path form
    get_tree().change_scene_to(preload("res://level2.tscn"))  # PackedScene form
```

`PackedScene.instance(edit_state=0)` is the 3.x constructor. There is no
`instantiate()` and no `change_scene_to_file()`.

## yield and timers

```gdscript
func fade():
    yield(get_tree().create_timer(0.5), "timeout")
    sprite.modulate.a = 0.0

func wait_for_animation():
    yield($AnimationPlayer, "animation_finished")
    advance()
```

`yield(object, "signal")` suspends the function until the signal fires. Use
`get_tree().create_timer(seconds)` for delays. There is no `await` in 3.x.

## Tween

```gdscript
onready var tween = $Tween

func slide_in():
    tween.interpolate_property(self, "rect_position",
        Vector2(-200, rect_position.y), Vector2.ZERO, 0.4,
        Tween.TRANS_CUBIC, Tween.EASE_OUT)
    tween.start()
```

`Tween` is a node in 3.x. Call `interpolate_property` then `start()`. There is
Godot 3.6 also provides `get_tree().create_tween()` and `tween_property()`
through `SceneTreeTween`; projects targeting older 3.x minors should use a
`Tween` node with `interpolate_property()` and `start()` instead.

## Pools and built-in types

```gdscript
var bytes = PoolByteArray()
var floats = PoolRealArray([1.0, 2.0])
var ints = PoolIntArray()
var strings = PoolStringArray(["a", "b"])
var vectors = PoolVector2Array()
```

These are `Pool*` types, not the 4.x `Packed*` types. `Vector2`, `Vector3`,
`Rect2`, `Transform`, `Transform2D`, `Color`, and `Quat` keep their 3.x names.
Use `Vector2.linear_interpolate(to, weight)` and `Vector3.linear_interpolate`;
`move_toward` is the same in both versions.

## Files and directories

```gdscript
func save(path: String, text: String) -> void:
    var file = File.new()
    if file.open(path, File.WRITE) == OK:
        file.store_string(text)
        file.close()

func load_text(path: String) -> String:
    var file = File.new()
    if file.open(path, File.READ) != OK:
        return ""
    var text = file.get_as_text()
    file.close()
    return text

func list_files(dir_path: String) -> Array:
    var out = []
    var dir = Directory.new()
    if dir.open(dir_path) == OK:
        dir.list_dir_begin()
        var name = dir.get_next()
        while name != "":
            if not dir.current_is_dir():
                out.append(name)
            name = dir.get_next()
        dir.list_dir_end()
    return out
```

`File` and `Directory` are the 3.x classes; `FileAccess` and `DirAccess` are 4.x.

## Process and input toggles

```gdscript
func _ready():
    set_process(false)               # stop _process frames
    set_physics_process(true)        # ensure _physics_process frames
    set_process_input(false)         # stop _input
    set_process_unhandled_input(true)

func _physics_process(delta):
    move(delta)                      # do not call ._physics_process(delta)
```

The engine enables a callback when the script defines it. Toggle with the
`set_*` methods; never re-call the virtual. `pause_mode` controls whether a
node ticks while the tree is paused: `PAUSE_MODE_INHERIT` (default),
`PAUSE_MODE_STOP`, `PAUSE_MODE_PROCESS`.

## Physics in 3.x

```gdscript
extends KinematicBody            # NOT CharacterBody3D
var velocity = Vector3.ZERO

func _physics_process(delta):
    velocity.y -= 9.8 * delta
    velocity = move_and_slide(velocity, Vector3.UP)   # velocity in, resolved out
    if is_on_floor():
        velocity.y = 0.0
```

- `move_and_slide(linear_velocity, up_direction=Vector3.UP, ...)` returns the
  resolved velocity; assign it back.
- `move_and_slide_with_snap(linear_velocity, snap, up_direction, ...)`,
  `is_on_floor()`, `is_on_wall()`, `is_on_ceiling()`, and `get_slide_count()`
  are the 3.x inspection surface.
- `RigidBody._integrate_forces(state)` receives a `PhysicsDirectBodyState`.
- 2D bodies use the same names with `Vector2`: `KinematicBody2D`,
  `move_and_slide(velocity)`, `_input_event(viewport, event, shape_idx)`.

## Common 3.x pitfalls

- Calling `._ready()` or `._physics_process(delta)` inside the same override:
  the engine already dispatches all levels. See
  [virtual callbacks](virtual-callbacks.md).
- Using 4.x annotations (`@onready`, `@export`, `@tool`) or `await`: replace
  with `onready`, `export(type)`, `tool`, and `yield`.
- Emitting with `some_signal.emit()` or connecting a Callable: emit with
  `emit_signal("some_signal")` and connect with the string form.
- Reaching for `Node3D`, `CharacterBody3D`, `FileAccess`, or `PackedStringArray`:
  these are 4.x names. Use `Spatial`, `KinematicBody`, `File`, and
  `PoolStringArray`.
- `queue_free()` then reading the node the same frame: it is freed at frame end;
  prefer `is_instance_valid()` and `call_deferred` for tree mutations.
- `get_node("Child")` before `_ready`: the child may not be in the tree yet.
  Use `onready` for cached nodes.
- Forgetting that `move_and_slide` returns the velocity: ignoring the return
  value leaves the body with stale velocity and broken collisions.

## Verification

After writing, confirm each symbol exists in the 3.6 class reference
(`https://docs.godotengine.org/en/3.6/classes/`) or the 3.6 source, then let the
editor parser or a headless run report the real result. A script that "looks
like 3.x" is not evidence that it parses.
