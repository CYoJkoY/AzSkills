# Godot 3.x Mechanical Check

Use the checker before returning or accepting any Godot 3.x code change:

```text
node "<skill-root>/godot-3-dev/scripts/check-godot-3x.ts" --root "<project>" --api "<skill-root>/godot-3-dev/references/api-3.6.json" --json
```

## Options

- `--root <directory>` selects the project root. It defaults to the current directory.
- `--api <file>` selects the API index. It defaults to the bundled 3.6 snapshot.
- `--overlay <directory>` supplies proposed contents at paths relative to
  `--root`, replacing the on-disk file. The directory must sit outside the
  project.
- `--files a.gd,b.tscn` limits which files may report findings. Every Godot
  file under `--root` and `--overlay` still participates in the symbol index,
  so inheritance and path checks keep the whole project as context.
- `--json` emits machine-readable errors, warnings, checked files, and limitations.
- `--strict` promotes warnings to errors for review or release gates.
- `--mod <name>` applies the mod script layout to every reported script that
  does not carry an `# azskills-mod:` marker. The name must be a single
  identifier such as `MoreStatsContainer`; a marker always wins over the flag.
- `--self-test` runs the embedded clean and regression fixtures.

Exit code `0` means no errors, `1` means findings blocked the check, and `2`
means invalid arguments, missing files, or an unusable API index.

Files under `addons/` participate in the symbol index but are not reported
unless named explicitly with `--files`.

## Coverage

The checker validates `project.godot`, GDScript, and `tscn`/`escn` scenes. It
uses the official Godot 3.6 class and method snapshot to check class names,
methods, built-in functions, project settings, scene node types, and scene
format. It also catches common 4.x syntax and symbols, re-called engine
virtuals, and dropped `move_and_slide()` results.

Structural checks cover mixed or space-indented blocks in a tab-indented file,
`export`/`onready` inside a function body, an `extends` line that appears after
another statement, duplicate function definitions, `connect()` targets that do
not exist on `self`, and `emit_signal()` names that this script never declares.
Project settings are matched against the 3.6 reference, with project-defined
namespaces such as `autoload` and `input` exempted.

Symbol context covers `class_name`, top-level methods, signals, `extends`,
`preload` aliases, autoloads, and the resolved inheritance chain, including
engine base classes. Inherited methods and signals resolve through that chain,
and a missing `extends` or `preload` path reports `MISSING_EXTENDS_PATH` or
`MISSING_PRELOAD_PATH`. Scene `ext_resource` script paths report
`MISSING_SCENE_SCRIPT_PATH`, and literal resource paths passed to the global
`load()` or `ResourceLoader.load()` report `MISSING_LOAD_PATH` for `.gd`,
`.tscn`, and `.escn` targets. `object.load()` is not a resource lookup and is
left alone. An `[autoload]` entry whose literal `res://` path names a missing
`.gd`, `.tscn`, or `.escn` reports `MISSING_AUTOLOAD_PATH`.

Symbol checks cover the Godot 4.x renames that have no 3.6 equivalent, including
annotations, `await`, `Callable`, `StringName`, `Packed*Array`, typed
collections, `super`, `.emit()`, `instantiate()`, `queue_redraw()`, value
`.lerp()`, renamed 2D and 3D node classes, and the 4.x singletons
(`RenderingServer`, `PhysicsServer2D`/`3D`, `TextServer`, `WorkerThreadPool`).
Names that a project could legitimately reuse, such as `get_window()` or
`is_editor_hint()`, are reported as warnings instead of errors.

Mod layout is opt-in. A script that starts with `# azskills-mod: <ModName>`, or
every reported script when `--mod <ModName>` is set, must keep its functions in
the four blocks from
[mod script layout](mod-script-layout.md): native, extension, method, then
signal. The checker derives `<ext>_`, `<method>_`, and `<method>_on_` from the
name unless the marker states both prefixes, and reports `MOD_FUNCTION_ORDER`
when a block appears out of order, `MOD_FUNCTION_NAME` when a prefixed function
is not lowercase snake_case, and `MOD_MARKER_INVALID` when the marker cannot
yield prefixes. Marker-free scripts are not checked for layout.

The checker ships with 47 fixtures that assert clean 3.x code passes and known
regressions fail:

```text
node godot-3-dev/scripts/check-godot-3x.ts --self-test
```

The API snapshot is generated from the official `3.6-stable` Godot source:

```text
https://github.com/godotengine/godot/tree/3.6-stable/doc/classes
https://github.com/godotengine/godot/blob/3.6-stable/modules/gdscript/gdscript_functions.cpp
```

The bundled index is a generated data file, not a replacement for the engine.
Regenerate it with `node godot-3-dev/scripts/build-api-index.ts` when the
source snapshot is intentionally refreshed.

## Limits

Static checking cannot prove runtime semantics, overloaded call signatures,
dynamic member access through `get()`/`call()`/dictionaries, signal connection
targets reached at runtime, exported value ranges, autoload availability,
project loading, physics behavior, `tres`/`res`/shader/audio resources, or
whether the project actually loads. `.gd` paths are only checked for
existence, not for the classes they define or the runtime state they produce.
An unknown class may also be a project-defined class or an add-on class.
Review warnings and use `--strict` when those warnings must block delivery.

For Codex, file edits arrive as the canonical `apply_patch` tool with the patch
text in `tool_input.command`; `Write` and `Edit` are matcher aliases, and
synthetic `MultiEdit` events are accepted for portability. When the proposed
content can be reconstructed unambiguously, the `PreToolUse` hook passes the
real project as `--root` and the proposed files as `--overlay`, then runs this
full checker before the write; `project.godot` joins the reported targets so a
Godot 4.x manifest rejects even a clean-looking 3.x script. Any checker error
denies the edit. For partial or ambiguous patches, the hook does not guess the
final file; it falls back to the high-confidence lexical deny list and still
reads `project.godot` from disk to reject 4.x projects.

`Bash` commands are inspected before execution. A command that combines a
high-confidence write form (`>`, `>>`, `Set-Content`, `Add-Content`,
`Out-File`, `Tee-Object`, `Copy-Item`, `Move-Item`, `cp`, `mv`, in-place
`sed`/`perl`, Node or Python write APIs, `git apply`/`checkout`/`restore`, or
`patch`) with a literal `.gd`, `.tscn`, `.escn`, or `project.godot` target is
denied and asked to use `apply_patch`, because shell content cannot be
reconstructed before execution. After a shell command that names a Godot
target and shows a write form, or applies a patch, VCS rewrite, or Godot-file
glob, the `PostToolUse` hook runs the checker and blocks while errors remain.
Writes to unrelated files are skipped, so pre-existing Godot errors do not
block them. Read-only commands that only mention Godot files do not trigger a
check. Quoted interpreter payloads such as `powershell -Command "..."`,
`cmd /c "..."`, or `node -e "..."` are treated as executable code; quoted prose
such as a commit message is not. A shell command can still write Godot content
from inside a generated program, a build tool, or a path assembled at runtime;
static command inspection cannot see that content.

The `PostToolUse` hook reruns the checker on written files, reports warnings,
and returns a blocking reason when errors remain, so the agent must fix them
before continuing; it cannot undo the write. Removing a Godot file reruns the
whole project and blocks on missing-path findings that the removal can cause
(`*_PATH`, such as `MISSING_EXTENDS_PATH`) and findings whose message names the
removed file. Unrelated pre-existing findings stay as notes. If the checker is
missing, times out, or exits with status `2`, the pre-write hook does not deny
on that basis alone: it keeps the lexical deny list and tells the agent to run
the checker manually. `PostToolUse` falls back to the lexical rules on the
written files in the same situation. Hooks are prevention and feedback, not
proof that the project runs; the final gate below remains mandatory.

## Final gate

After the static check passes, run the actual Godot 3.6 parser or a headless
project check when the executable and project are available. Report the exact
command, exit code, parser or runtime output, and any remaining unverified
items. If Godot is unavailable, say so rather than claiming the code parses.
