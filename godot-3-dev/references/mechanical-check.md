# Godot 3.x Mechanical Check

Use the checker before returning or accepting any Godot 3.x code change:

```text
node "<skill-root>/godot-3-dev/scripts/check-godot-3x.mjs" --root "<project>" --api "<skill-root>/godot-3-dev/references/api-3.6.json" --json
```

## Options

- `--root <directory>` selects the project root. It defaults to the current directory.
- `--api <file>` selects the API index. It defaults to the bundled 3.6 snapshot.
- `--files a.gd,b.tscn` limits the check to paths relative to `--root`.
- `--json` emits machine-readable errors, warnings, checked files, and limitations.
- `--strict` promotes warnings to errors for review or release gates.
- `--self-test` runs the embedded clean and regression fixtures.

Exit code `0` means no errors, `1` means findings blocked the check, and `2`
means invalid arguments, missing files, or an unusable API index.

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

Symbol checks cover the Godot 4.x renames that have no 3.6 equivalent, including
annotations, `await`, `Callable`, `StringName`, `Packed*Array`, typed
collections, `super`, `.emit()`, `instantiate()`, `queue_redraw()`, value
`.lerp()`, renamed 2D and 3D node classes, and the 4.x singletons
(`RenderingServer`, `PhysicsServer2D`/`3D`, `TextServer`, `WorkerThreadPool`).
Names that a project could legitimately reuse, such as `get_window()` or
`is_editor_hint()`, are reported as warnings instead of errors.

The checker ships with 16 fixtures that assert clean 3.x code passes and known
regressions fail:

```text
node godot-3-dev/scripts/check-godot-3x.mjs --self-test
```

The API snapshot is generated from the official `3.6-stable` Godot source:

```text
https://github.com/godotengine/godot/tree/3.6-stable/doc/classes
https://github.com/godotengine/godot/blob/3.6-stable/modules/gdscript/gdscript_functions.cpp
```

The bundled index is a generated data file, not a replacement for the engine.
Regenerate it with `node godot-3-dev/scripts/build-api-index.mjs` when the
source snapshot is intentionally refreshed.

## Limits

Static checking cannot prove runtime semantics, overloaded call signatures,
dynamic member access, signal target methods, resource paths, exported values,
autoload availability, project loading, or physics behavior. An unknown class
may also be a project-defined class or an add-on class. Review warnings and
use `--strict` when those warnings must block delivery.

For Codex `Write`, `Edit`, and `apply_patch` events whose proposed content can
be reconstructed unambiguously, the `PreToolUse` hook stages a temporary
project and runs this full checker before the write. Any checker error denies
the edit. For partial or ambiguous patches, the hook does not guess the final
file; it falls back to the high-confidence lexical deny list. The
`PostToolUse` hook reruns the checker on the written file, reports warnings,
and returns a blocking reason when errors remain, so the agent must fix them
before continuing; it cannot undo the write. Hooks are prevention and
feedback, not proof that the project runs. The guard covers Codex `Write`,
`Edit`, and `apply_patch` calls; Godot files written by shell commands bypass
it, so run the checker command directly after those writes.

## Final gate

After the static check passes, run the actual Godot 3.6 parser or a headless
project check when the executable and project are available. Report the exact
command, exit code, parser or runtime output, and any remaining unverified
items. If Godot is unavailable, say so rather than claiming the code parses.
