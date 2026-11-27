# Mod script layout

Reference for the `godot-3-dev` module. Applies when a mod extends an existing
Godot 3.x script: the game's script is the base, and the mod ships a replacement
or an override of it.

## The four blocks

A mod script keeps every function in one of four blocks, in this order. No
function from a later block may appear above a function from an earlier block.

| # | Block | What it holds | Name rule |
| :--- | :--- | :--- | :--- |
| 1 | Native | Every function that already exists in the base script, in the base script's order, with its base name and base body | unchanged base name |
| 2 | Extension | The mod's code that the native functions call, one function per insertion point | `<ext>_*` |
| 3 | Method | Helpers the mod needs, called by extension functions or by each other | `<method>_*` |
| 4 | Signal | Handlers connected to signals | `<method>_on_*` |

The four blocks are a file layout, not a call graph. An extension function sits
in block 2 even though a native function in block 1 calls it; that call is what
puts the mod's behavior inside the base function.

## Naming

- Every function name you write is lowercase, with `_` between words. No
  camelCase, no capitals, no doubled or trailing `_`. This holds in every
  GDScript file, not only in a mod script.
- A native function keeps its base name exactly. Renaming it breaks every base
  call site, and a native name that already contains a capital stays as it is,
  because the base script calls that name and the override has to match it.
- An extension function is `<ext>_` plus lowercase words.
- A method function is `<method>_` plus lowercase words.
- A signal handler is `<method>_on_` plus lowercase words, and it is only used
  as a `connect()` target.
- A helper is never named `<method>_on_*`. That prefix belongs to block 4, so a
  helper with it would be misread as a signal handler.

Engine-dispatched callbacks (`_ready`, `_process`, `_physics_process`, `_input`,
`_notification`, `_draw`, ...) are native functions. They keep the engine name,
and the virtual-call rule still applies: never re-call the parent implementation.

## Deriving the prefixes

Split the mod name into words at each capital, then lowercase the words. For
`MoreStatsContainer` the words are `more`, `stats`, `container`:

- Extension prefix: the first word in full, then the first letter of each later
  word: `more` + `s` + `c` = `moresc`.
- Method prefix: the first letter of every word: `m` + `s` + `c` = `msc`.
- Signal prefix: the method prefix plus `_on_`: `msc_on_`.

| Mod | Extension | Method | Signal |
| :--- | :--- | :--- | :--- |
| `MoreStatsContainer` | `moresc_*` | `msc_*` | `msc_on_*` |
| `BetterBoons` | `betterb_*` | `bb_*` | `bb_on_*` |
| `QualityOfLife` | `qualityol_*` | `qol_*` | `qol_on_*` |

When the derived extension prefix reads badly, state both prefixes explicitly in
the marker line; the signal prefix always follows the method prefix.

## The machine marker

The layout is opt-in. Mark a mod script in a comment before its first function:

```gdscript
# azskills-mod: MoreStatsContainer
```

The marker is a comment, so Godot ignores it, and the bundled checker reads it.
An explicit pair overrides the derived prefixes:

```gdscript
# azskills-mod: MoreStatsContainer moresc msc
```

`--mod <name>` applies the same layout to every reported script of a project
that does not carry a marker. A marker always wins over the flag.

## Worked example

```gdscript
# azskills-mod: MoreStatsContainer
extends "res://mods-unpacked/Yoko-MoreStatsContainer/stats_container.gd"

# --- 1. Native functions: base names, base order, base bodies --------------

func _ready():
	moresc_ready()

func get_stat(stat_name):
	return moresc_stat_value(stat_name)

func on_item_added(item):
	moresc_item_added(item)

# --- 2. Extension functions: the mod's code inside the native functions ----

func moresc_ready():
	msc_prepare_state()
	msc_connect_signals()
	msc_refresh_container()

func moresc_stat_value(stat_name):
	return msc_compute_base(stat_name) + msc_bonus_for(stat_name)

func moresc_item_added(item):
	msc_recount(item)

# --- 3. Method functions: helpers this mod needs ---------------------------

func msc_prepare_state():
	pass

func msc_compute_base(stat_name):
	return 0

func msc_bonus_for(stat_name):
	return 0

func msc_recount(item):
	pass

func msc_refresh_container():
	pass

func msc_connect_signals():
	connect("stats_changed", self, "msc_on_stats_changed")

# --- 4. Signal functions: handlers connected to signals --------------------

func msc_on_stats_changed(stats):
	msc_refresh_container()
```

The native `_ready` keeps its base body and ends with the injection call. The
extension function holds the mod's own work, the helpers stay reusable, and the
only function wired to a signal is the last one.

## Editing rules

- Change a native function only where the mod must, and keep the rest of its
  body byte-identical to the base script so a diff against the base stays
  readable.
- Add one extension function per native insertion point. Do not grow a native
  body with mod logic; call the extension function instead.
- A function the mod invents is never native. If the base script has no such
  function, it belongs to block 2, 3, or 4 and carries a prefix.
- Declarations (`const`, `var`, `onready`) stay above the native block, base
  declarations first. This contract governs functions only.
- When two mods extend the same script, each keeps its own prefix and its own
  extension and method blocks; the native block appears once, at the top.

## Verification

The bundled checker reads the marker and reports:

| Code | Meaning |
| :--- | :--- |
| `MOD_FUNCTION_NAME` | A prefixed function is not lowercase snake_case under its prefix |
| `MOD_FUNCTION_ORDER` | A function of an earlier block appears after a function of a later block |
| `MOD_MARKER_INVALID` | The marker names a mod whose prefixes cannot be derived |

Every error blocks a write through the Godot guard. A marker-free script is not
checked for layout, because only a mod script has a base script to stay in step
with. The naming rule is not opt-in: every function you write is lowercase
snake_case, in a mod script and in a standalone script alike.
