/*
 * Shared Godot 3.x lexical rules.
 *
 * The write-time hook and the full checker must agree on what a Godot 4.x
 * token looks like; keeping two copies already drifted once. Everything here
 * is intentionally token-level: it must be decidable without an engine run
 * and without project context, so the hook can use it as a last-resort gate
 * when a patch cannot be reconstructed.
 */

// The engine dispatches these callbacks itself on every script level, so an
// explicit `._ready()`-style call is always a mistake.
export const virtualRecallNames = [
  'init',
  'ready',
  'enter_tree',
  'exit_tree',
  'process',
  'physics_process',
  'fixed_process',
  'input',
  'unhandled_input',
  'unhandled_key_input',
  'notification',
  'draw',
  'gui_input',
  'input_event',
  'integrate_forces',
  'set',
  'get',
  'get_property_list',
];

// Godot 4.x node types that never exist as nodes in 3.6. Godot 3.x scenes use
// `Spatial`, `KinematicBody`, `MeshInstance`, and the other pre-4.0 names.
export const fourXSceneTypes = new Set([
  'Node3D',
  'CharacterBody2D',
  'CharacterBody3D',
  'MeshInstance3D',
  'Camera3D',
  'RigidBody3D',
  'StaticBody3D',
  'Area3D',
  'RayCast3D',
  'CollisionShape3D',
  'CollisionPolygon3D',
  'Marker3D',
  'Light3D',
  'OmniLight3D',
  'SpotLight3D',
  'DirectionalLight3D',
  'StandardMaterial3D',
  // Additional 4.x-only node and resource types. The write-time hook cannot
  // rebuild an untouched scene, so this list must stand on its own there.
  'Sprite2D',
  'AnimatedSprite2D',
  'TileMapLayer',
  'PointLight2D',
  'GPUParticles2D',
  'GPUParticles3D',
  'CPUParticles3D',
  'ShapeCast3D',
  'Skeleton3D',
  'BoneAttachment3D',
  'SoftBody3D',
  'VehicleBody3D',
  'VehicleWheel3D',
  'AnimatableBody2D',
  'AnimatableBody3D',
  'NavigationRegion3D',
  'NavigationAgent3D',
  'NavigationObstacle3D',
  'World3D',
  'WorldBoundaryShape3D',
  'SeparationRayShape3D',
  'CSGCombiner3D',
  'CSGBox3D',
  'CSGCylinder3D',
  'CSGMesh3D',
  'CSGPolygon3D',
  'CSGSphere3D',
  'CSGTorus3D',
  'AudioListener3D',
  'SpringArm3D',
  'PathFollow3D',
  'MultiMeshInstance3D',
  'GeometryInstance3D',
  'VisualInstance3D',
  'Decal',
  'FogVolume',
  'LightmapGI',
  'VoxelGI',
]);

// Every pattern keeps the `g` flag because `String.prototype.matchAll` needs
// it. `findTokenIssues` never mutates the shared rules, so callers can reuse
// them across several files in one hook invocation.
export const fourXTokenRules = [
  {
    // GDScript 3.x has no annotation syntax at all, so any `@name` token is 4.x.
    pattern: /(^|[^\w.@])@[A-Za-z_]\w*/g,
    code: 'GODOT4_ANNOTATION',
    message: 'Godot 4.x annotation',
    hint: '3.x uses bare `tool` and `onready`/`export(type)` without `@`; there is no `@warning_ignore`.',
  },
  {
    pattern: /(^|[^\w.])await\b/g,
    code: 'GODOT4_AWAIT',
    message: 'Godot 4.x `await`',
    hint: '3.x uses `yield(object, "signal")`.',
  },
  {
    pattern: /(^|[^\w.])Callable\b/g,
    code: 'GODOT4_CALLABLE',
    message: 'Godot 4.x Callable type',
    hint: '3.x connects with `connect("sig", self, "method")`.',
  },
  {
    pattern: /(^|[^\w.])StringName\b/g,
    code: 'GODOT4_STRINGNAME',
    message: 'Godot 4.x StringName type',
    hint: '3.x uses plain String values.',
  },
  {
    pattern:
      /\b(?:Packed(?:String|Byte|Int32|Int64|Float32|Float64|Vector2|Vector3|Vector4|Color|Basis|Quaternion|Transform2D|Transform3D)Array)\b/g,
    code: 'GODOT4_PACKED_ARRAY',
    message: 'Godot 4.x packed array type',
    hint: '3.x uses `Pool*Array` such as PoolStringArray or PoolByteArray.',
  },
  {
    pattern: /\bArray\s*\[\s*[A-Za-z_][\w.]*\s*\]/g,
    code: 'GODOT4_TYPED_ARRAY',
    message: 'Godot 4.x typed collection',
    hint: '3.x collections are untyped: `var items = []`.',
  },
  {
    pattern: /\bDictionary\s*\[/g,
    code: 'GODOT4_TYPED_DICTIONARY',
    message: 'Godot 4.x typed dictionary',
    hint: '3.x has untyped `Dictionary`.',
  },
  {
    pattern: /(^|[^\w.@])super\s*[.(]/g,
    code: 'GODOT4_SUPER',
    message: 'Godot 4.x `super` call',
    hint: '3.x uses `._method()` for ordinary base methods only.',
  },
  {
    pattern: /(^|[^\w.])func\s*\(/g,
    code: 'GODOT4_LAMBDA',
    message: 'Godot 4.x lambda',
    hint: '3.x has no lambdas; use a named method or FuncRef.',
  },
  {
    pattern: /\.\s*emit\s*\(/g,
    code: 'GODOT4_SIGNAL_EMIT',
    message: 'Godot 4.x signal emit',
    hint: '3.x emits with `emit_signal("name", args)`.',
  },
  {
    pattern: /\bconnect\s*\(\s*self\s*\./g,
    code: 'GODOT4_CONNECT_SELF',
    message: 'Godot 4.x Callable connection',
    hint: '3.x uses `connect("signal", self, "method")`.',
  },
  {
    // 3.x signal parameters are untyped: `signal died`.
    pattern: /\bsignal\s+[A-Za-z_]\w*\s*\(\s*[A-Za-z_]\w*\s*:/g,
    code: 'GODOT4_SIGNAL_SIGNATURE',
    message: 'Godot 4.x typed signal parameter',
    hint: '3.x signals declare untyped parameters, for example `signal died(who)`.',
  },
];

// Godot 4.x names that read like ordinary identifiers. The full checker
// resolves project classes and autoloads before flagging them, but the
// write-time hook has no project context on that path, so it only carries the
// symbols that 3.6 categorically does not define.
const fourXClassSymbols = ['Callable', 'StringName', 'FileAccess', 'DirAccess', 'DisplayServer', 'Node3D', 'CharacterBody2D', 'CharacterBody3D'];

// Extra token rules used only when a patch cannot be reconstructed. They are
// deliberately kept out of `fourXTokenRules` so the checker reports each
// problem once, through its receiver-aware call analysis.
export const fourXFallbackRules = [
  {
    pattern: new RegExp('(^|[^\\w])(?:' + fourXClassSymbols.join('|') + ')\\b', 'g'),
    code: 'GODOT4_SYMBOL',
    message: 'Godot 4.x symbol',
    hint: 'Use the Godot 3.6 class: Spatial, KinematicBody*, File, Directory, OS.',
  },
  {
    pattern: /\b(?:instantiate|change_scene_to_file|change_scene_to_packed|queue_redraw)\s*\(/g,
    code: 'GODOT4_METHOD',
    message: 'Godot 4.x method',
    hint: '3.x uses `instance()`, `change_scene()`/`change_scene_to()`, and `update()`.',
  },
  {
    pattern: /(^|[^\w.])(?:randf_range|randi_range|snappedf|snappedi|print_rich|type_convert)\s*\(/g,
    code: 'GODOT4_GLOBAL',
    message: 'Godot 4.x global function',
    hint: '3.x uses `rand_range()`, `stepify()`, `print()`, and `convert()`.',
  },
];

export interface TokenRule {
  pattern: RegExp;
  code: string;
  message: string;
  hint?: string;
}

export interface TokenIssue {
  index: number;
  code: string;
  message: string;
  hint: string | null;
  text: string;
}

export interface VirtualRecallIssue {
  index: number;
  name: string;
}

// Blank out comments and string bodies so token checks only see real code.
// GDScript 3.x strings may be single-quoted, double-quoted, or triple-quoted,
// and triple-quoted strings may span lines, so all three forms are tracked.
export function maskCommentsAndStrings(text: string): string {
  let output = '';
  let state = 'code';
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const triple = text.slice(index, index + 3);
    if (state === 'code') {
      if (char === '#') {
        state = 'comment';
        continue;
      }
      if (triple === '"""' || triple === "'''") {
        quote = triple;
        state = 'string';
        output += triple;
        index += 2;
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        state = 'string';
        output += char;
        continue;
      }
      output += char;
      continue;
    }
    if (state === 'comment') {
      if (char === '\n') {
        state = 'code';
        output += char;
      } else output += ' ';
      continue;
    }
    if (char === '\\') {
      output += '  ';
      index += 1;
      continue;
    }
    if (quote.length === 3 ? triple === quote : char === quote) {
      state = 'code';
      output += quote;
      if (quote.length === 3) index += 2;
      quote = '';
      continue;
    }
    output += char === '\n' ? '\n' : ' ';
  }
  return output;
}

export function findTokenIssues(mask: string, rules: readonly TokenRule[] = fourXTokenRules): TokenIssue[] {
  const found: TokenIssue[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    for (const match of mask.matchAll(rule.pattern)) {
      const key = rule.code + ':' + match.index;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({
        index: match.index ?? 0,
        code: rule.code,
        message: rule.message,
        hint: rule.hint ?? null,
        text: match[0].trim(),
      });
    }
  }
  return found.sort((left, right) => left.index - right.index);
}

export function findLexicalViolations(mask: string): TokenIssue[] {
  return findTokenIssues(mask, [...fourXTokenRules, ...fourXFallbackRules]);
}

export function findVirtualRecalls(mask: string): VirtualRecallIssue[] {
  const pattern = new RegExp('\\.\\s*_(' + virtualRecallNames.join('|') + ')\\s*\\(', 'g');
  return [...mask.matchAll(pattern)].map((match) => ({
    index: match.index ?? 0,
    name: match[1] ?? '',
  }));
}
