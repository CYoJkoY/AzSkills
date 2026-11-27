# Script layout

Reference for `godot-3-dev`. Every GDScript file you write for a Godot 3.x
project uses this layout. A mod script that extends a base game script must use
it exactly, and the bundled checker enforces that case. A standalone script
uses the same layout, and the checker enforces it once the script carries
`# azskills-layout`.

## Why the layout is fixed

GDScript has no visibility modifiers and no file-level structure, so a reader
finds a function by the shape of the file, not by a package path. A fixed
section order with a visible divider turns the file into a table of contents:
the entry points sit at the top, the new behavior follows, the reusable helpers
come next, and the signal handlers end the file. A reader knows where a
function lives before searching for it, and a diff shows which layer changed.

## The four sections

A script's functions sit in four sections, in this order. Each section is
introduced by its divider line.

| # | Section | Holds | Called by | Mod name rule |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Extensions | The functions that enter from outside: engine-dispatched virtuals (`_ready`, `_process`, `_physics_process`, `_input`, `_unhandled_input`, `_enter_tree`, `_exit_tree`, `_notification`, `_draw`, `_gui_input`, `_integrate_forces`) and every function the base script declares and this file overrides. They keep the base name, the base order, and the base body; a mod body only adds the call into Custom. | the engine or the base script | base name, unchanged |
| 2 | Custom | The code that makes those entries do the new work: one `<ext>_*` function per insertion point, plus the script's own feature logic. | Extensions | `<ext>_*` |
| 3 | Methods | Reusable helpers and the public API: functions called by Custom, by other Methods, or by another script. | Custom, Methods, or another script | `<method>_*` |
| 4 | Signals | Handlers whose only caller is a `connect()` target. | a signal | `<method>_on_*` |

Classify a function by its caller, in this order:

1. It is a `connect()` target: Signals.
2. The engine dispatches it, or the base script declares it: Extensions.
3. It exists to be reused by Custom, Methods, or another script: Methods.
4. It implements what an Extensions entry does: Custom.

Section is not topic. Two functions about the same subject belong to different
sections when different callers reach them. Do not group by feature name and do
not reorder the four sections.

A section with no function is omitted. Never leave a divider with nothing under
it, and never open a section before an earlier one.

## The divider lines

Copy these lines exactly:

```gdscript
# ══════════════════════════════════════════ Extensions ══════════════════════════════════════════ #
# ══════════════════════════════════════════ Custom ══════════════════════════════════════════ #
# ══════════════════════════════════════════ Methods ══════════════════════════════════════════ #
# ══════════════════════════════════════════ Signals ══════════════════════════════════════════ #
```

The format is `#`, one space, 42 × `═` (U+2550 BOX DRAWINGS DOUBLE
HORIZONTAL), one space, the label, one space, 42 × `═`, one space, `#`. Both
bars carry 42 characters, so the line length differs only by the label. The
label is exactly one of `Extensions`, `Custom`, `Methods`, `Signals`: plural
where shown, first letter capital, no other word.

Placement rules:

- Put the divider directly above the first function of its section, at column 0
  for a top-level script or at the inner-class indent for a nested class.
- Put one blank line between the divider and the first function, and one blank
  line between functions as usual.
- A section with no function is omitted, so its divider is omitted too.
- The labels `Extension`, `Method`, `Callback`, and `Signal` are not canonical.
  Rename an old divider to the matching section name.

## Declarations above the first divider

Everything that is not a function stays above the first section divider:
`tool`, `class_name`, `extends`, `signal` declarations, `const`, `export(...)`,
`onready`, and `var`. Declarations may carry their own dividers in the same bar
format:

```gdscript
# ══════════════════════════════════════════ Variables ══════════════════════════════════════════ #
# ══════════════════════════════════════════ Setters ══════════════════════════════════════════ #
```

`Variables` and `Setters` are declaration scopes, not function layers, so they
always sit above Extensions. A property setter body goes under `Setters`; the
`setget` name stays with the variable declaration. A `signal` declaration stays
with the declarations, while the handler it reaches lives in Signals.

Those two labels are the only banners allowed above Extensions. Any other
banner there is reported, and a function under it has no section, so it must
move into Extensions, Custom, Methods, or Signals. A setter body under
`Setters` is not order-checked against the four layers, because it is part of
the declaration block rather than a member of a layer.

## File skeleton

Start every new script from this skeleton and delete what you do not use. The
marker is optional; the declarations are one block above the first divider.

```gdscript
# azskills-mod: MoreStatsContainer
extends "res://mods-unpacked/Yoko-MoreStatsContainer/stats_container.gd"

signal stats_changed

const MAX_STATS := 12

export(int) var bonus_slot = 0

onready var label = $Label
var cache := {}

# ══════════════════════════════════════════ Extensions ══════════════════════════════════════════ #

func _ready():
	moresc_ready()

# ══════════════════════════════════════════ Custom ══════════════════════════════════════════ #

func moresc_ready():
	pass

# ══════════════════════════════════════════ Methods ══════════════════════════════════════════ #

func msc_refresh_label():
	pass

# ══════════════════════════════════════════ Signals ══════════════════════════════════════════ #

func msc_on_stats_changed():
	msc_refresh_label()
```

The skeleton shows all four dividers at once. A real script deletes the divider
of every section it leaves empty, and it never reorders the rest.

## Worked example: a mod script

```gdscript
# azskills-mod: MoreStatsContainer
extends "res://mods-unpacked/Yoko-MoreStatsContainer/stats_container.gd"

signal stats_changed

var bonus_cache := {}

# ══════════════════════════════════════════ Extensions ══════════════════════════════════════════ #

func _ready():
	moresc_ready()

func get_stat(stat_name):
	return moresc_stat_value(stat_name)

func on_item_added(item):
	moresc_item_added(item)

# ══════════════════════════════════════════ Custom ══════════════════════════════════════════ #

func moresc_ready():
	msc_prepare_state()
	msc_connect_signals()
	msc_refresh_container()

func moresc_stat_value(stat_name):
	return msc_compute_base(stat_name) + msc_bonus_for(stat_name)

func moresc_item_added(item):
	msc_recount(item)

# ══════════════════════════════════════════ Methods ══════════════════════════════════════════ #

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

# ══════════════════════════════════════════ Signals ══════════════════════════════════════════ #

func msc_on_stats_changed(stats):
	msc_refresh_container()
```

The native `_ready` keeps its base body and ends with the injection call. Each
extension function holds the mod's own work, the helpers stay reusable, and the
only function wired to a signal is the last one.

## Worked example: a standalone script

A script that does not extend a base game script uses the same four sections
with the same dividers:

```gdscript
class_name StatsCarousel
extends Container

signal page_changed(tab, page_index)

var index := 0

# ══════════════════════════════════════════ Extensions ══════════════════════════════════════════ #

func _ready():
	_refresh_arrows()

func _input(event):
	if event.is_action_pressed("ui_right"):
		_request_step(1)

# ══════════════════════════════════════════ Custom ══════════════════════════════════════════ #

func _refresh_arrows():
	pass

func _request_step(direction):
	index += direction
	_refresh_arrows()
	emit_signal("page_changed", 0, index)

# ══════════════════════════════════════════ Methods ══════════════════════════════════════════ #

func set_page(page_index):
	index = page_index
	_refresh_arrows()

# ══════════════════════════════════════════ Signals ══════════════════════════════════════════ #

func _on_arrow_left_pressed():
	_request_step(-1)
```

Extensions holds the engine callbacks, Custom the private `_` helpers that
implement them, Methods the API another script calls, and Signals the handlers
that only `connect()` reaches.

## Utility scripts

A script with no engine entry point and no base script, such as a static helper
library, has no Extensions section. Give it `Methods` for the public functions
and `Custom` for the internal steps they share; splitting into those two layers
is how a long helper file stays readable, so a topical banner is never needed.
The four-layer order applies as soon as the script has an entry surface. An
ungated script may use topical banners, but a script that carries
`# azskills-layout` may not: the gate reads only the four labels, and a topical
banner above Extensions is reported.

## Inner classes

An inner class repeats the layout at its own indent. It gets the sections its
calls need, in the same order, with dividers indented to the class body:

```gdscript
class Row:
	var text = ""

	# ══════════════════════════════════════════ Methods ══════════════════════════════════════════ #

	func set_value(value):
		text = str(value)
```

A data-only inner class uses `Methods` alone. One that handles a signal adds
`Signals` below it. The indent is convention rather than a gate: the checker
reads top-level functions and column-0 dividers, so an inner class body is not
checked, but its dividers still tell the reader where the nesting starts.

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
- A helper is never named `<method>_on_*`. That prefix belongs to Signals, so a
  helper with it would be misread as a signal handler.

Engine-dispatched callbacks (`_ready`, `_process`, `_physics_process`, `_input`,
`_notification`, `_draw`, ...) are Extensions. They keep the engine name, and
the virtual-call rule still applies: never re-call the parent implementation.

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

## Markers and the layout gate

The layout is opt-in, and two comment markers turn the bundled checker on:

| Marker | Use it in | Line |
| :--- | :--- | :--- |
| `# azskills-mod: <ModName>` | a mod script that extends a base game script | `# azskills-mod: MoreStatsContainer` |
| `# azskills-layout` | a standalone script | `# azskills-layout` |

Both are comments, so Godot ignores them. Put a marker above the first
declaration of the file, on its own line, and never inside a string. An explicit
prefix pair may follow the mod name and overrides the derived one:

```gdscript
# azskills-mod: MoreStatsContainer
# azskills-mod: MoreStatsContainer moresc msc
```

The flags apply a gate to scripts that carry no marker: `--mod <name>` for the
mod gate, `--layout` for the standalone gate. A marker always wins over a flag,
and the mod marker wins over `# azskills-layout`, because the mod gate is
stricter.

A standalone script has no prefixes, so only its two ends are decidable. With
the standalone gate on:

- Every top-level function sits under a canonical divider, and no function sits
  above the first one.
- An engine-dispatched callback, or a function a base script declares, belongs
  to Extensions.
- A `connect("sig", self, "method")` target, or a name that ends in
  `_on_<words>`, belongs to Signals.
- Custom and Methods are yours to assign: no prefix tells the checker which one
  holds a helper, so it accepts either, in either position. Put the code an
  Extensions entry runs in Custom, reusable helpers below it in Methods, and
  keep the two dividers in the canonical order.

## Editing rules

- Change a native function only where the mod must, and keep the rest of its
  body byte-identical to the base script so a diff against the base stays
  readable.
- Add one extension function per native insertion point. Do not grow a native
  body with mod logic; call the extension function instead.
- A function the mod invents is never native. If the base script has no such
  function, it belongs to Custom, Methods, or Signals and carries a prefix.
- Declarations stay above the first divider, base declarations first.
- When two mods extend the same script, each keeps its own prefix and its own
  Custom and Methods sections; Extensions appears once, at the top.
- Keep a divider and its functions together. Inserting a function in the wrong
  section is the failure this layout exists to prevent.

## Verification

The bundled checker reads the marker, the dividers, and the function names:

| Code | Meaning |
| :--- | :--- |
| `MOD_FUNCTION_NAME` | A prefixed function is not lowercase snake_case under its prefix |
| `MOD_FUNCTION_ORDER` | A function of an earlier section appears after a function of a later section |
| `MOD_SECTION_MISSING` | A marked mod script has functions but no canonical divider |
| `MOD_SECTION_PLACEMENT` | A function sits under the wrong divider or before the first one |
| `MOD_SECTION_ORDER` | The canonical dividers are out of order or repeated |
| `MOD_SECTION_FORMAT` | A divider-like comment is not the canonical line |
| `MOD_SECTION_EXTRA` | A banner other than `Variables`/`Setters` sits above Extensions, or any non-canonical divider follows a canonical section |
| `MOD_MARKER_INVALID` | The marker names a mod whose prefixes cannot be derived |
| `SCRIPT_SECTION_MISSING` | A gated standalone script has functions but no canonical divider |
| `SCRIPT_FUNCTION_UNSECTIONED` | A function sits above the first section divider |
| `SCRIPT_SECTION_PLACEMENT` | An Extensions or Signals function sits under the wrong divider |
| `SCRIPT_SECTION_ORDER` | The canonical dividers are out of order or repeated |
| `SCRIPT_SECTION_FORMAT` | A divider-like comment is not the canonical line |
| `SCRIPT_SECTION_EXTRA` | A banner other than `Variables`/`Setters` sits above Extensions, or any non-canonical divider follows a canonical section |

Every error blocks a write through the Godot guard. A script with neither marker
is checked for layout only when `--layout` or `--mod` is passed, because only a
mod script has a base script to stay in step with and only a gated standalone
script has claimed the four layers. The naming rule is not opt-in: every
function you write is lowercase snake_case, in a mod script and in a standalone
script alike.
