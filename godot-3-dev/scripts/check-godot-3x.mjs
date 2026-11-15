#!/usr/bin/env node
/*
 * Deterministic Godot 3.x guard for AzSkills.
 *
 * Checks project files, GDScript, and scenes against the bundled official
 * Godot 3.6 API index. Static analysis cannot prove runtime semantics, so this
 * tool reports what it verified and what still needs a real engine run.
 *
 * Usage:
 *   node check-godot-3x.mjs --root <project> [--api <api-3.6.json>]
 *     [--files a.gd,b.tscn] [--json] [--strict] [--self-test]
 *
 * Exit codes: 0 clean, 1 errors found, 2 usage or index failure.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultApi = path.join(scriptDirectory, '..', 'references', 'api-3.6.json');
const ignoredDirectories = new Set(['.git', '.godot', '.import', 'addons', 'node_modules']);
const gdExtensions = new Set(['.gd']);
const sceneExtensions = new Set(['.tscn', '.escn']);

const virtualRecalls = [
  '_ready',
  '_enter_tree',
  '_exit_tree',
  '_process',
  '_physics_process',
  '_fixed_process',
  '_input',
  '_unhandled_input',
  '_unhandled_key_input',
  '_notification',
  '_draw',
  '_gui_input',
  '_input_event',
  '_integrate_forces',
  '_set',
  '_get',
  '_get_property_list',
];

const fourXTokens = [
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
    pattern: /(^|[^\w])Callable\b/g,
    code: 'GODOT4_CALLABLE',
    message: 'Godot 4.x Callable type',
    hint: '3.x connects with `connect("sig", self, "method")`.',
  },
  {
    pattern: /(^|[^\w])StringName\b/g,
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

const fourXClasses = [
  'Node3D',
  'CharacterBody2D',
  'CharacterBody3D',
  'MeshInstance3D',
  'Camera3D',
  'RigidBody3D',
  'StaticBody3D',
  'Area3D',
  'RayCast3D',
  'ShapeCast3D',
  'CollisionShape3D',
  'CollisionPolygon3D',
  'Marker3D',
  'Light3D',
  'OmniLight3D',
  'SpotLight3D',
  'DirectionalLight3D',
  'StandardMaterial3D',
  'FileAccess',
  'DirAccess',
  'DisplayServer',
  'AnimationPlayer3D',
  'GPUParticles3D',
  'CPUParticles3D',
  'World3D',
  'WorldEnvironment3D',
  'Sprite3D',
  'MultiMesh3D',
  'AudioStreamPlayer3D',
  'NavigationRegion3D',
  'NavigationAgent3D',
  // 4.x-only singletons and value types whose 3.x names differ.
  'RenderingServer',
  'PhysicsServer2D',
  'PhysicsServer3D',
  'NavigationServer2D',
  'NavigationServer3D',
  'TextServer',
  'WorkerThreadPool',
  'ResourceUID',
  'Geometry2D',
  'Vector2i',
  'Vector3i',
  'Vector4i',
  'Rect2i',
  'Projection',
  'PackedDataContainerRef',
  'Sprite2D',
  'AnimatedSprite2D',
  'TileMapLayer',
  'PointLight2D',
  'GPUParticles2D',
  'ShapeCast2D',
  'NavigationObstacle2D',
  'NavigationObstacle3D',
  'Skeleton3D',
  'BoneAttachment3D',
  'SoftBody3D',
  'VehicleBody3D',
  'VehicleWheel3D',
  'AnimatableBody2D',
  'AnimatableBody3D',
];

const renamedClasses = {
  Node3D: 'Spatial',
  CharacterBody2D: 'KinematicBody2D',
  CharacterBody3D: 'KinematicBody',
  MeshInstance3D: 'MeshInstance',
  Camera3D: 'Camera',
  RigidBody3D: 'RigidBody',
  StaticBody3D: 'StaticBody',
  Area3D: 'Area',
  RayCast3D: 'RayCast',
  CollisionShape3D: 'CollisionShape',
  CollisionPolygon3D: 'CollisionPolygon',
  Marker3D: 'Position3D',
  Light3D: 'Light',
  OmniLight3D: 'OmniLight',
  SpotLight3D: 'SpotLight',
  DirectionalLight3D: 'DirectionalLight',
  StandardMaterial3D: 'SpatialMaterial',
  FileAccess: 'File',
  DirAccess: 'Directory',
  DisplayServer: 'OS',
  RenderingServer: 'VisualServer',
  PhysicsServer2D: 'Physics2DServer',
  PhysicsServer3D: 'PhysicsServer',
  NavigationServer2D: 'Navigation2DServer',
  NavigationServer3D: 'NavigationServer',
  TextServer: 'no 3.x equivalent, the server is internal',
  WorkerThreadPool: 'Thread or a project-side pool',
  ResourceUID: 'no 3.x equivalent, use resource paths',
  Geometry2D: 'Geometry',
  Vector2i: 'Vector2 (integer values)',
  Vector3i: 'Vector3 (integer values)',
  Vector4i: 'no 3.x equivalent',
  Rect2i: 'Rect2 (integer values)',
  Projection: 'Transform (3x4 basis) or Basis',
  PackedDataContainerRef: 'no 3.x equivalent, use Pool*Array or an Array',
  Sprite2D: 'Sprite',
  AnimatedSprite2D: 'AnimatedSprite',
  TileMapLayer: 'TileMap',
  PointLight2D: 'Light2D',
  GPUParticles2D: 'Particles2D',
  ShapeCast2D: 'no 3.x equivalent, use a RayCast2D or a physics query',
  NavigationObstacle2D: 'Navigation2DServer.agent_set_callback or a NavigationPolygon setup',
  NavigationObstacle3D: 'NavigationServer equivalents',
  Skeleton3D: 'Skeleton',
  BoneAttachment3D: 'BoneAttachment',
  SoftBody3D: 'SoftBody',
  VehicleBody3D: 'VehicleBody',
  VehicleWheel3D: 'VehicleWheel',
  AnimatableBody2D: 'KinematicBody2D with move_and_slide, or a StaticBody2D',
  AnimatableBody3D: 'KinematicBody with move_and_slide, or a StaticBody',
};

// Unambiguous 4.x renames: no 3.6 class defines these, so an error is safe.
const fourXMethods = {
  instantiate: 'instance',
  change_scene_to_file: 'change_scene',
  change_scene_to_packed: 'change_scene_to',
  queue_redraw: 'update',
};

// 4.x names that a project could plausibly reuse for its own method, so they
// are advisory instead of blocking.
const fourXMethodHints = {
  get_window: 'the viewport via `get_viewport()`, or the OS singleton for the OS window',
  is_editor_hint: 'the property `Engine.editor_hint`',
  find_children: '`get_children()` plus a name or group filter, or `find_node(name, true, false)`',
  rotate_toward: '`lerp_angle()` or your own clamped rotation step',
  get_window_size: 'the property `OS.window_size`',
  set_window_size: 'the property `OS.window_size`',
};

const fourXGlobals = {
  randf_range: 'rand_range',
  randi_range: 'rand_range (cast to int)',
  snappedf: 'stepify',
  snappedi: 'stepify (cast to int)',
  print_rich: 'print',
  type_convert: 'convert',
  deg_to_rad: 'deg2rad',
  rad_to_deg: 'rad2deg',
  clampf: 'clamp',
  clampi: 'clamp (cast to int)',
  pingpong: 'fposmod-based ping-pong, there is no 3.x global',
};

// Members that exist in Godot 4.x on a value or node type and never exist in
// 3.6, so a dotted call is unambiguous.
const fourXMemberCalls = [
  {
    pattern: /\.\s*lerp\s*\(/g,
    code: 'GODOT4_METHOD',
    message: 'Godot 4.x value `.lerp()`',
    hint: '3.x uses `Vector2.linear_interpolate()`, `Color.linear_interpolate()`, or the global `lerp()`.',
  },
];

// Setting names or defaults that only exist in Godot 4.x.
const fourXSettings = {
  'display/window/size/viewport_width': 'display/window/size/width',
  'display/window/size/viewport_height': 'display/window/size/height',
  'rendering/renderer/rendering_method': '3.x selects the renderer at build time or through the driver setting',
  'rendering/renderer/rendering_method.mobile': '3.x has no per-platform renderer setting',
  'rendering/textures/canvas_textures/default_texture_filter': 'per-texture flags or the 3.x 2D snapping settings',
  'gui/theme/default_font_multichannel_signed_distance_field': '3.x dynamic fonts configure their own options',
  'application/config/features': 'a PackedStringArray marker that only Godot 4.x writes',
  'dotnet/project/assembly_name': 'mono/project/assembly_name in 3.x',
};

// Top-level namespaces whose child keys are defined by the project itself.
const projectDefinedSettings = new Set(['autoload', 'input', 'editor_plugins', 'shader_globals', 'remap']);

const gdscriptKeywords = new Set([
  'and',
  'as',
  'assert',
  'break',
  'breakpoint',
  'class',
  'class_name',
  'const',
  'continue',
  'elif',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'for',
  'func',
  'if',
  'in',
  'is',
  'master',
  'masterfunc',
  'match',
  'not',
  'null',
  'onready',
  'or',
  'pass',
  'preload',
  'puppet',
  'puppetfunc',
  'remote',
  'remotefunc',
  'return',
  'self',
  'setget',
  'signal',
  'static',
  'sync',
  'tool',
  'true',
  'var',
  'while',
  'yield',
]);

class UsageError extends Error {}

function valueOf(args, flag) {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new UsageError(flag + ' requires a value');
  return value;
}

function lineStarts(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function locate(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (starts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return { line: low + 1, column: offset - starts[low] + 1 };
}

// Blank out comments and string bodies so token checks only see real code.
function stripCommentsAndStrings(text) {
  let output = '';
  let state = 'code';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (state === 'code') {
      if (char === '#') state = 'comment';
      else if (char === '"' || char === "'") {
        state = char === '"' ? 'double' : 'single';
        output += char;
        continue;
      } else output += char;
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
    if ((state === 'double' && char === '"') || (state === 'single' && char === "'")) {
      state = 'code';
      output += char;
      continue;
    }
    output += char === '\n' ? '\n' : ' ';
  }
  return output;
}

class ApiIndex {
  constructor(data) {
    this.data = data;
    this.classes = data.classes ?? {};
    this.builtins = new Set(data.builtinFunctions ?? []);
    this.ownersByMethod = new Map();
    for (const [name, entry] of Object.entries(this.classes)) {
      for (const method of entry.methods ?? []) {
        if (!this.ownersByMethod.has(method)) this.ownersByMethod.set(method, []);
        this.ownersByMethod.get(method).push(name);
      }
    }
    this.projectSettings = new Set(this.classes.ProjectSettings?.properties ?? []);
    this.settingNamespaces = new Set([...this.projectSettings].map((key) => key.split('/')[0]));
  }

  hasClass(name) {
    return Boolean(this.classes[name]);
  }

  hasMethod(name) {
    return this.ownersByMethod.has(name);
  }

  chain(className) {
    const names = [];
    let current = className;
    const seen = new Set();
    while (current && this.classes[current] && !seen.has(current)) {
      names.push(current);
      seen.add(current);
      current = this.classes[current].inherits;
    }
    return names;
  }

  hasMember(className, member) {
    for (const name of this.chain(className)) {
      const entry = this.classes[name];
      if (!entry) continue;
      const lists = [entry.methods, entry.properties, entry.signals, entry.constants];
      if (lists.some((list) => (list ?? []).includes(member))) return true;
    }
    return false;
  }
}

function createReport() {
  return { errors: [], warnings: [], checked: [], verified: [] };
}

function addIssue(report, file, starts, offset, code, message, hint) {
  const { line, column } = locate(starts, offset);
  report.errors.push({ file, line, column, code, message, hint: hint ?? null });
}

function addWarning(report, file, starts, offset, code, message, hint) {
  const { line, column } = locate(starts, offset);
  report.warnings.push({ file, line, column, code, message, hint: hint ?? null });
}

function checkGodotVersion(report, file, text) {
  const match = /config_version\s*=\s*(\d+)/.exec(text);
  if (!match) {
    report.warnings.push({
      file,
      line: 1,
      column: 1,
      code: 'MISSING_CONFIG_VERSION',
      message: 'project.godot has no config_version; cannot prove this is a Godot 3.x project',
      hint: 'A Godot 3.x project declares `config_version=4`.',
    });
    return;
  }
  const starts = lineStarts(text);
  if (match[1] === '5') {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'GODOT4_PROJECT',
      'config_version=5 is a Godot 4.x project',
      'Godot 3.x projects use `config_version=4`.',
    );
  } else if (match[1] !== '4') {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_CONFIG_VERSION',
      'unsupported config_version=' + match[1],
      'Godot 3.x expects `config_version=4`.',
    );
  } else {
    report.verified.push(file + ': config_version=4');
  }
}

function checkProjectSettings(report, file, text, api) {
  const lines = text.split('\n');
  const starts = lineStarts(text);
  let section = '';
  lines.forEach((line, index) => {
    const sectionMatch = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      return;
    }
    const match = /^\s*([A-Za-z0-9_][A-Za-z0-9_.\-/]*)\s*=/.exec(line);
    if (!match) return;
    // Keys before the first [section] are file metadata such as config_version.
    if (!section) return;
    const key = section + '/' + match[1];
    const offset = starts[index] + match.index;
    if (projectDefinedSettings.has(key.split('/')[0])) return;
    if (Object.hasOwn(fourXSettings, key)) {
      addIssue(
        report,
        file,
        starts,
        offset,
        'GODOT4_PROJECT_SETTING',
        'Godot 4.x project setting ' + key,
        'Use ' + fourXSettings[key] + '.',
      );
      return;
    }
    if (api.projectSettings.has(key)) {
      report.verified.push(file + ': setting ' + key);
      return;
    }
    // The 3.6 documentation omits some keys, so only warn when the whole
    // namespace is unknown.
    if (api.settingNamespaces.has(key.split('/')[0])) return;
    addWarning(
      report,
      file,
      starts,
      offset,
      'UNKNOWN_PROJECT_SETTING',
      'unknown Godot 3.6 project setting: ' + key,
      'Confirm the key in the 3.6 ProjectSettings reference; Godot 4.x setting names are not interchangeable.',
    );
  });
}

function checkScene(report, file, text, api) {
  const starts = lineStarts(text);
  const header = /\[gd_scene\b([^\]]*)\]/.exec(text);
  if (!header) {
    addIssue(
      report,
      file,
      starts,
      0,
      'MISSING_SCENE_HEADER',
      'scene has no [gd_scene] header',
      'Godot 3.x scenes start with `[gd_scene format=2]`.',
    );
    return;
  }
  const format = /format\s*=\s*(\d+)/.exec(header[1]);
  if (!format) {
    addIssue(
      report,
      file,
      starts,
      header.index,
      'MISSING_SCENE_FORMAT',
      'scene header has no format',
      'Godot 3.x scenes use `format=2`.',
    );
  } else if (format[1] !== '2') {
    addIssue(
      report,
      file,
      starts,
      header.index,
      'WRONG_SCENE_FORMAT',
      'scene format=' + format[1] + ' is not Godot 3.x',
      'Godot 3.x scenes use `format=2`; format=3 is Godot 4.x.',
    );
  } else {
    report.verified.push(file + ': gd_scene format=2');
  }
  for (const match of text.matchAll(/\[ext_resource\b[^\]]*\btype\s*=\s*"([^"]+)"[^\]]*\]/g)) {
    const type = match[1];
    if (fourXClasses.includes(type) && !api.hasClass(type)) {
      addIssue(
        report,
        file,
        starts,
        match.index,
        'GODOT4_SCENE_TYPE',
        'scene uses Godot 4.x resource type ' + type,
        'Use ' + (renamedClasses[type] ?? 'the Godot 3.6 equivalent') + ' in 3.x.',
      );
    }
  }
  for (const match of text.matchAll(/\[node\b[^\]]*\btype\s*=\s*"([^"]+)"[^\]]*\]/g)) {
    const type = match[1];
    if (api.hasClass(type)) {
      report.verified.push(file + ': node type ' + type);
    } else if (fourXClasses.includes(type) || /3D$/.test(type)) {
      addIssue(
        report,
        file,
        starts,
        match.index,
        'UNKNOWN_SCENE_NODE',
        'scene node type ' + type + ' does not exist in Godot 3.6',
        'Use ' + (renamedClasses[type] ?? 'a Godot 3.6 class') + '.',
      );
    } else {
      addWarning(
        report,
        file,
        starts,
        match.index,
        'UNKNOWN_SCENE_NODE',
        'scene node type ' + type + ' is not in the 3.6 index',
        'It may be a script class or an add-on; verify it exists in the project.',
      );
    }
  }
  for (const match of text.matchAll(/\b(?:Packed(?:String|Byte|Int32|Float32|Vector2|Vector3|Color)Array)\b/g)) {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'GODOT4_PACKED_ARRAY',
      'scene uses Godot 4.x packed array type ' + match[0],
      'Godot 3.x uses `Pool*Array` types.',
    );
  }
}

function checkTokens(report, file, mask, starts) {
  for (const rule of fourXTokens) {
    for (const match of mask.matchAll(rule.pattern)) {
      addIssue(report, file, starts, match.index, rule.code, rule.message + ': ' + match[0].trim(), rule.hint);
    }
  }
}

function checkVirtualRecalls(report, file, mask, starts) {
  const pattern = new RegExp('\\.\\s*(' + virtualRecalls.join('|') + ')\\s*\\(', 'g');
  for (const match of mask.matchAll(pattern)) {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'VIRTUAL_RECALL',
      'engine-dispatched virtual is re-called: .' + match[1] + '()',
      'The engine already calls every script level of ' + match[1] + '. Remove the call; share work through a named method.',
    );
  }
}

function checkMemberCalls(report, file, mask, starts) {
  for (const rule of fourXMemberCalls) {
    for (const match of mask.matchAll(rule.pattern)) {
      addIssue(report, file, starts, match.index, rule.code, rule.message, rule.hint);
    }
  }
}

function checkClasses(report, file, mask, starts, api, declaredClasses) {
  for (const name of fourXClasses) {
    if (api.hasClass(name)) continue;
    // A project may legitimately own a class with the same short name.
    if (declaredClasses.has(name)) continue;
    const pattern = new RegExp('(^|[^\\w.])' + name + '\\b', 'g');
    for (const match of mask.matchAll(pattern)) {
      addIssue(
        report,
        file,
        starts,
        match.index + match[1].length,
        'GODOT4_CLASS',
        'Godot 4.x class name ' + name,
        'Use ' + (renamedClasses[name] ?? 'the Godot 3.6 class') + '.',
      );
    }
  }
}

const statementKeywords = new Set([
  'func',
  'if',
  'elif',
  'while',
  'for',
  'match',
  'return',
  'yield',
  'preload',
  'load',
  'export',
  'var',
  'const',
  'signal',
  'setget',
  'class',
  'assert',
]);

function checkCalls(report, file, mask, starts, api, declaredClasses, customMethods) {
  for (const match of mask.matchAll(/([A-Za-z_][\w.]*)\s*\(/g)) {
    const raw = match[1];
    const parts = raw.split('.');
    const callee = parts.at(-1);
    const qualifier = parts.length > 1 ? parts.at(-2) : null;
    const calleeOffset = match.index + raw.length - callee.length;
    if (gdscriptKeywords.has(callee)) continue;
    // Every 3.x class and script is instantiated through new().
    if (callee === 'new') continue;
    if (statementKeywords.has(callee)) continue;
    if (Object.hasOwn(fourXMethods, callee) && !api.hasMethod(callee)) {
      addIssue(
        report,
        file,
        starts,
        calleeOffset,
        'GODOT4_METHOD',
        'Godot 4.x method ' + callee + '()',
        'Use ' + fourXMethods[callee] + ' in 3.6.',
      );
      continue;
    }
    if (Object.hasOwn(fourXMethodHints, callee) && !api.hasMethod(callee) && !customMethods.has(callee)) {
      addWarning(
        report,
        file,
        starts,
        calleeOffset,
        'GODOT4_METHOD_HINT',
        callee + '() is a Godot 4.x method name and is not in the 3.6 index',
        'In 3.6 use ' + fourXMethodHints[callee] + '; ignore this if the project defines its own ' + callee + '().',
      );
      continue;
    }
    if (qualifier && api.hasClass(qualifier)) {
      if (api.hasMember(qualifier, callee)) {
        report.verified.push(file + ': ' + qualifier + '.' + callee);
      } else if (api.hasMethod(callee)) {
        addIssue(
          report,
          file,
          starts,
          calleeOffset,
          'UNKNOWN_STATIC_METHOD',
          callee + '() does not exist on ' + qualifier + ' in Godot 3.6',
          'It belongs to ' + api.ownersByMethod.get(callee).slice(0, 3).join(', ') + '; check the receiver.',
        );
      } else if (!customMethods.has(callee)) {
        addWarning(
          report,
          file,
          starts,
          match.index,
          'UNKNOWN_METHOD',
          'method ' + callee + '() is not in the 3.6 index',
          'It may be defined in this project; otherwise it is a Godot 4.x or mistyped symbol.',
        );
      }
      continue;
    }
    if (qualifier) continue;
    if (api.builtins.has(callee) || customMethods.has(callee) || declaredClasses.has(callee)) continue;
    if (Object.hasOwn(fourXGlobals, callee) && !api.builtins.has(callee)) {
      addIssue(
        report,
        file,
        starts,
        match.index,
        'GODOT4_GLOBAL',
        'Godot 4.x global function ' + callee + '()',
        'Use ' + fourXGlobals[callee] + '.',
      );
    }
  }
}

function collectDeclarations(mask) {
  const classes = new Set();
  const methods = new Set();
  for (const match of mask.matchAll(/^\s*class\s+([A-Za-z_]\w*)/gm)) classes.add(match[1]);
  for (const match of mask.matchAll(/^\s*(?:static\s+)?func\s+([A-Za-z_]\w*)/gm)) methods.add(match[1]);
  for (const match of mask.matchAll(/^\s*class_name\s+([A-Za-z_]\w*)/gm)) classes.add(match[1]);
  return { classes, methods };
}

function checkIndentation(report, file, mask, starts) {
  const lines = mask.split('\n');
  const tabs = lines.filter((line) => /^\t/.test(line)).length;
  const spaces = lines.filter((line) => /^ +[^\s]/.test(line)).length;
  if (tabs === 0 || spaces === 0) return;
  let depth = 0;
  lines.forEach((line, index) => {
    // Continuation lines inside brackets may be space-aligned by convention.
    if (depth === 0 && line.trim() !== '') {
      const mixed = /^ +\t|^\t+ /.exec(line);
      if (mixed) {
        addIssue(
          report,
          file,
          starts,
          starts[index] + mixed.index,
          'MIXED_INDENTATION',
          'line mixes spaces and tabs for indentation',
          'GDScript rejects mixed indentation; use tabs consistently.',
        );
      } else if (/^ +[^\s]/.test(line)) {
        addIssue(
          report,
          file,
          starts,
          starts[index],
          'MIXED_INDENTATION',
          'line is indented with spaces in a tab-indented file',
          'The Godot 3.x parser stops with an inconsistent-indentation error; use tabs.',
        );
      }
    }
    for (const character of line) {
      if (character === '(' || character === '[' || character === '{') depth += 1;
      else if (character === ')' || character === ']' || character === '}') depth = Math.max(0, depth - 1);
    }
  });
}

function checkDeclarationPlacement(report, file, mask, starts) {
  for (const match of mask.matchAll(/^([ \t]*)(export|onready)\b/gm)) {
    if (match[1].length === 0) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'MISPLACED_DECLARATION',
      '`' + match[2] + '` is only valid at class scope',
      '`' + match[2] + '` inside a function body is a parse error in Godot 3.x.',
    );
  }
  const firstStatement = /^(?![ \t]*(?:#|tool\b|class_name\b|extends\b|$))[ \t]*(\w+)/m.exec(mask);
  const extendsMatch = /^[ \t]*extends\b/m.exec(mask);
  if (firstStatement && extendsMatch && extendsMatch.index > firstStatement.index) {
    addIssue(
      report,
      file,
      starts,
      firstStatement.index,
      'EXTENDS_NOT_FIRST',
      'statement `' + firstStatement[1] + '` appears before `extends`',
      'Godot 3.x requires `tool`, `class_name`, then `extends` before any other statement.',
    );
  }
  const seen = new Map();
  for (const match of mask.matchAll(/^[ \t]*(?:static[ \t]+)?func[ \t]+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (seen.has(name)) {
      addIssue(
        report,
        file,
        starts,
        match.index,
        'DUPLICATE_FUNCTION',
        'function ' + name + '() is defined twice',
        'Regenerate or rename one definition; the parser rejects duplicate function names.',
      );
    } else {
      seen.set(name, match.index);
    }
  }
}

function checkSignalTargets(report, file, text, mask, starts, api, baseClasses, customMethods) {
  const declaredSignals = new Set([...mask.matchAll(/^[ \t]*signal[ \t]+([A-Za-z_]\w*)/gm)].map((match) => match[1]));
  const connectPattern = /\bconnect\s*\(\s*"([A-Za-z_]\w*)"\s*,\s*(self|"[^"]*"|[A-Za-z_][\w.]*)\s*,\s*"([A-Za-z_]\w*)"/g;
  for (const match of text.matchAll(connectPattern)) {
    const method = match[3];
    const target = match[2];
    if (target !== 'self') continue;
    if (customMethods.has(method)) continue;
    if (baseClasses.some((name) => api.hasMember(name, method))) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_SIGNAL_TARGET',
      'connect() targets missing method ' + method + '() on self',
      'Declare ' + method + '() in this script; Godot 3.x reports a failed connection at runtime.',
    );
  }
  for (const match of text.matchAll(/\bemit_signal\s*\(\s*"([A-Za-z_]\w*)"/g)) {
    const signal = match[1];
    if (declaredSignals.has(signal)) continue;
    if (baseClasses.some((name) => api.classes[name]?.signals?.includes(signal))) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNDECLARED_SIGNAL',
      'emit_signal() names undeclared signal ' + signal,
      'Declare `signal ' + signal + '` in this script; Godot 3.x cannot emit an undeclared signal.',
    );
  }
}

function checkMoveAndSlide(report, file, text, mask, starts) {
  for (const match of mask.matchAll(/\bmove_and_slide\s*\(/g)) {
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    const lineEnd = text.indexOf('\n', match.index);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim();
    if (/=\s*(?:self\.)?move_and_slide\s*\(/.test(line)) continue;
    addWarning(
      report,
      file,
      starts,
      match.index,
      'MOVE_AND_SLIDE_RESULT_DROPPED',
      'move_and_slide() result is not assigned',
      'Godot 3.x returns the resolved velocity: `velocity = move_and_slide(velocity, Vector3.UP)`. Dropping it loses collision response.',
    );
  }
}

function checkGdScript(report, file, text, mask, starts, api, projectClasses) {
  const declared = collectDeclarations(mask);
  const customMethods = new Set(declared.methods);
  const declaredClasses = new Set([...declared.classes, ...projectClasses]);
  checkTokens(report, file, mask, starts);
  checkMemberCalls(report, file, mask, starts);
  checkVirtualRecalls(report, file, mask, starts);
  checkClasses(report, file, mask, starts, api, declaredClasses);
  checkCalls(report, file, mask, starts, api, declaredClasses, customMethods);
  checkIndentation(report, file, mask, starts);
  checkDeclarationPlacement(report, file, mask, starts);
  const baseClasses = [];
  for (const match of mask.matchAll(/^\s*extends\s+([A-Za-z_][\w.]*)/gm)) {
    const name = match[1];
    if (api.hasClass(name)) {
      baseClasses.push(name);
      report.verified.push(file + ': extends ' + name);
      continue;
    }
    if (declaredClasses.has(name)) continue;
    addWarning(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_BASE_CLASS',
      'base class ' + name + ' is not in the 3.6 index',
      'It may be a project class or script path; confirm it exists.',
    );
  }
  checkSignalTargets(report, file, text, mask, starts, api, baseClasses, customMethods);
  for (const match of mask.matchAll(/\bvar\s+[A-Za-z_]\w*\s*:\s*([A-Za-z_][\w.]*)/g)) {
    const name = match[1];
    if (api.hasClass(name) || declaredClasses.has(name)) continue;
    addWarning(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_TYPE',
      'type annotation ' + name + ' is not a known 3.6 class',
      'Verify the type name; Godot 4.x type names differ.',
    );
  }
}

function checkProjectGodotText(report, file, text, api) {
  checkGodotVersion(report, file, text);
  checkProjectSettings(report, file, text, api);
}

async function* walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name) || entry.name.startsWith('.')) continue;
      yield* walk(path.join(directory, entry.name));
    } else if (entry.isFile()) {
      yield path.join(directory, entry.name);
    }
  }
}

async function loadIndex(file) {
  let data;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new UsageError('cannot read API index ' + file + ': ' + error.message);
  }
  if (!data.classes || Object.keys(data.classes).length < 300) {
    throw new UsageError('API index looks incomplete: ' + file);
  }
  if (data.engineVersion !== '3.6') {
    throw new UsageError('API index must describe Godot 3.6, found ' + data.engineVersion);
  }
  return new ApiIndex(data);
}

async function collectFiles(root, explicit) {
  const files = [];
  if (explicit && explicit.length) {
    for (const entry of explicit) {
      const resolved = path.resolve(root, entry);
      const info = await stat(resolved).catch(() => null);
      if (!info) throw new UsageError('file not found: ' + resolved);
      if (info.isFile()) files.push(resolved);
    }
    return files;
  }
  for await (const file of walk(root)) {
    const base = path.basename(file);
    const extension = path.extname(file).toLowerCase();
    if (base === 'project.godot') files.push(file);
    else if (gdExtensions.has(extension) || sceneExtensions.has(extension)) files.push(file);
  }
  return files;
}

async function runCheck({ root, apiPath, files, strict }) {
  const api = await loadIndex(apiPath);
  const report = createReport();
  const targets = await collectFiles(root, files);
  if (targets.length === 0) throw new UsageError('no Godot 3.x files found under ' + root);
  const contents = [];
  const projectClasses = new Set();
  for (const file of targets) {
    const text = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');
    contents.push({ file, text });
    for (const match of text.matchAll(/^\s*class_name\s+([A-Za-z_]\w*)/gm)) projectClasses.add(match[1]);
  }
  for (const { file, text } of contents) {
    const extension = path.extname(file).toLowerCase();
    if (path.basename(file) === 'project.godot') {
      checkProjectGodotText(report, file, text, api);
    } else if (gdExtensions.has(extension)) {
      const starts = lineStarts(text);
      const mask = stripCommentsAndStrings(text);
      checkGdScript(report, file, text, mask, starts, api, projectClasses);
      checkMoveAndSlide(report, file, text, mask, starts);
    } else if (sceneExtensions.has(extension)) {
      checkScene(report, file, text, api);
    }
    report.checked.push(file);
  }
  if (strict) {
    for (const warning of report.warnings.splice(0)) {
      report.errors.push({ ...warning, code: 'STRICT_' + warning.code });
    }
  }
  return { report, targets };
}

function formatReport(report, targets, root) {
  const relative = (file) => path.relative(root, file).split(path.sep).join('/') || file;
  const lines = [];
  const describe = (issue, level) =>
    relative(issue.file) +
    ':' +
    issue.line +
    ':' +
    issue.column +
    ' ' +
    level +
    ' ' +
    issue.code +
    ' ' +
    issue.message +
    (issue.hint ? ' | ' + issue.hint : '');
  for (const issue of report.errors) lines.push(describe(issue, 'error'));
  for (const issue of report.warnings) lines.push(describe(issue, 'warning'));
  lines.push('');
  lines.push(
    'checked ' +
      targets.length +
      ' file(s); errors ' +
      report.errors.length +
      '; warnings ' +
      report.warnings.length +
      '; verified symbols ' +
      report.verified.length,
  );
  lines.push(
    report.errors.length === 0
      ? 'Static checks passed. Runtime semantics, typed-member resolution, and resource paths still require the Godot 3.6 parser or a headless run.'
      : 'Static checks failed. Fix every error before running the Godot 3.6 parser.',
  );
  return lines.join('\n');
}

const fixtures = [
  {
    name: 'clean-3x',
    files: {
      'project.godot':
        'config_version=4\n\n[application]\n\nconfig/name="Demo"\nrun/main_scene="res://Main.tscn"\n\n[display]\n\nwindow/size/width=1280\n',
      'Player.gd':
        'extends KinematicBody2D\n\nconst SPEED = 120.0\nvar velocity = Vector2.ZERO\nonready var sprite = $Sprite\n\nfunc _physics_process(delta):\n\tvelocity = move_and_slide(velocity)\n\tif Input.is_action_just_pressed("jump"):\n\t\tvelocity.y = -300.0\n\nfunc _ready():\n\tconnect("died", self, "_on_died")\n\nfunc _on_died():\n\tqueue_free()\n',
      'Main.tscn':
        '[gd_scene load_steps=2 format=2]\n\n[ext_resource path="res://Player.gd" type="Script" id=1]\n\n[node name="Main" type="Node2D"]\n\n[node name="Player" type="KinematicBody2D" parent="."]\nscript = ExtResource( 1 )\n',
    },
    expect: 'pass',
  },
  {
    name: 'godot4-project',
    files: { 'project.godot': 'config_version=5\n\n[application]\n\nconfig/name="Demo"\n' },
    expect: 'fail',
  },
  {
    name: 'godot4-script',
    files: {
      'Player.gd':
        '@tool\nextends CharacterBody2D\n\n@onready var sprite = $Sprite\n\nfunc _physics_process(delta):\n\tawait get_tree().create_timer(1.0).timeout\n\tvar scene = preload("res://E.tscn").instantiate()\n\tvar packed = PackedStringArray()\n\tvar items: Array[int] = []\n\tvar x = randf_range(0.0, 1.0)\n\tget_tree().change_scene_to_file("res://Main.tscn")\n',
      'Main.tscn': '[gd_scene format=3]\n\n[node name="Main" type="Node3D"]\n',
    },
    expect: 'fail',
  },
  {
    name: 'virtual-recall',
    files: {
      'Boss.gd':
        'extends "res://Enemy.gd"\n\nfunc _ready():\n\t._ready()\n\nfunc _physics_process(delta):\n\t._physics_process(delta)\n\tpass\n',
    },
    expect: 'fail',
  },
  {
    name: 'clean-3x-tween',
    files: {
      'Fade.gd':
        'extends Node2D\n\nfunc fade():\n\tvar tween = get_tree().create_tween()\n\ttween.tween_property(self, "modulate:a", 0.0, 0.4)\n\tvar v = Vector2(1, 2).linear_interpolate(Vector2(3, 4), 0.5)\n\tprint(str(v))\n',
    },
    expect: 'pass',
  },
  {
    name: 'clean-3x-project-settings',
    files: {
      'project.godot': [
        'config_version=4',
        '',
        '[application]',
        '',
        'config/name="Demo"',
        'run/main_scene="res://Main.tscn"',
        '',
        '[autoload]',
        '',
        'Game="*res://Game.gd"',
        '',
        '[display]',
        '',
        'window/size/width=1280',
        'window/stretch/mode="2d"',
        'window/stretch/aspect="keep"',
        '',
        '[input]',
        '',
        'jump={',
        '"deadzone": 0.5,',
        '"events": [ ]',
        '}',
        '',
        '[layer_names]',
        '',
        '2d_physics/layer_1="world"',
        '',
        '[physics]',
        '',
        'common/physics_fps=60',
        '',
      ].join('\n'),
    },
    expect: 'pass',
  },
  {
    name: 'godot4-project-settings',
    files: {
      'project.godot': [
        'config_version=4',
        '',
        '[display]',
        '',
        'window/size/viewport_width=1280',
        '',
        '[rendering]',
        '',
        'renderer/rendering_method="mobile"',
        '',
        '[application]',
        '',
        'config/features=PackedStringArray("4.2", "GL Compatibility")',
        '',
      ].join('\n'),
    },
    expect: 'fail',
  },
  {
    name: 'mixed-indentation',
    files: {
      'Mixed.gd': 'extends Node\n\nfunc _ready():\n\tvar x = 1\n    var y = 2\n',
    },
    expect: 'fail',
  },
  {
    name: 'signal-mismatch',
    files: {
      'Signals.gd':
        'extends Node\n\nsignal died\n\nfunc _ready():\n\tconnect("died", self, "_on_missing")\n\nfunc die():\n\temit_signal("not_declared")\n',
    },
    expect: 'fail',
  },
  {
    name: 'parse-scope',
    files: {
      'Scope.gd':
        'const X = 1\nextends Node\n\nfunc _ready():\n\texport(int) var z = 1\n\nfunc a():\n\tpass\n\nfunc a():\n\tpass\n',
    },
    expect: 'fail',
  },
  {
    name: 'no-extends-ok',
    files: {
      'Constants.gd': 'const MAX_HEALTH = 100\n\nstatic func clamp_health(value):\n\treturn min(value, MAX_HEALTH)\n',
      'Utility.gd':
        'class_name Utility\nconst EPSILON = 0.001\n\nstatic func nearly_equal(a, b):\n\treturn abs(a - b) < EPSILON\n',
    },
    expect: 'pass',
  },
  {
    name: 'aligned-continuation-ok',
    files: {
      'Query.gd':
        'extends Node\n\nfunc _ready():\n\tvar found = get_tree().get_nodes_in_group(\n\t    "enemies"\n\t)\n\tvar data = {\n\t    "hp": 10,\n\t    "mp": 5,\n\t}\n\tprint(str(found.size()) + str(data))\n',
    },
    expect: 'pass',
  },
  {
    name: 'godot4-symbols-extra',
    files: {
      'Extra.gd':
        'extends Node2D\n\nfunc _ready():\n\tvar v = Vector2(1, 2).lerp(Vector2(3, 4), 0.5)\n\tvar rounded = clampf(1.5, 0.0, 1.0)\n\tvar angle = deg_to_rad(90.0)\n\tRenderingServer.canvas_item_clear(get_canvas_item())\n\tprint(str(v) + str(rounded) + str(angle))\n',
    },
    expect: 'fail',
  },
  {
    name: 'godot4-signal-params',
    files: {
      'Signaller.gd': 'extends Node\n\nsignal died(who: Node)\n\nfunc kill():\n\temit_signal("died", null)\n',
      'Note.gd': 'extends Node\n\n# 3.x signals stay untyped\nsignal scored(points)\n\nfunc ok():\n\temit_signal("scored", 1)\n',
    },
    expect: 'fail',
  },
];

async function selfTest() {
  const { mkdtemp, rm, writeFile, mkdir } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const staging = await mkdtemp(path.join(tmpdir(), 'azskills-godot-selftest-'));
  const failures = [];
  try {
    for (const fixture of fixtures) {
      const root = path.join(staging, fixture.name);
      for (const [name, body] of Object.entries(fixture.files)) {
        const target = path.join(root, name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, body, 'utf8');
      }
      const { report } = await runCheck({ root, apiPath: defaultApi, files: [], strict: false });
      const passed = report.errors.length === 0;
      const expected = fixture.expect === 'pass';
      if (passed === expected) continue;
      failures.push(
        fixture.name +
          ': expected ' +
          fixture.expect +
          ' but got ' +
          (passed ? 'pass' : 'fail') +
          ' [' +
          report.errors.map((error) => error.code).join(', ') +
          ']',
      );
      for (const error of report.errors) failures.push('  detail ' + fixture.name + ': ' + error.code + ' ' + error.message);
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  if (failures.length) {
    console.error('Self-test failed:\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log('Self-test passed: ' + fixtures.length + ' fixtures (clean 3.x vs 4.x/regression cases).');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: node check-godot-3x.mjs --root <project> [--api <api-3.6.json>] [--files a.gd,b.tscn] [--json] [--strict] [--self-test]',
    );
    return;
  }
  if (args.includes('--self-test')) {
    await selfTest();
    return;
  }
  const root = path.resolve(valueOf(args, '--root') ?? process.cwd());
  const info = await stat(root).catch(() => null);
  if (!info || !info.isDirectory()) throw new UsageError('--root is not a directory: ' + root);
  const apiPath = path.resolve(valueOf(args, '--api') ?? defaultApi);
  const fileList = valueOf(args, '--files');
  const files = fileList
    ? fileList
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const { report, targets } = await runCheck({ root, apiPath, files, strict: args.includes('--strict') });
  if (args.includes('--json')) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: report.errors.length === 0,
          checked: targets.map((file) => path.relative(root, file).split(path.sep).join('/')),
          errors: report.errors,
          warnings: report.warnings,
          verified: report.verified,
          limitations:
            'Static API and syntax checks only. Runtime semantics, dynamic member access, and resource validity require the Godot 3.6 parser or a headless run.',
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    process.stdout.write(formatReport(report, targets, root) + '\n');
  }
  process.exitCode = report.errors.length === 0 ? 0 : 1;
}

main().catch((error) => {
  if (error instanceof UsageError) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  console.error(error.stack || error.message);
  process.exitCode = 2;
});
