#!/usr/bin/env node
/*
 * Deterministic Godot 3.x guard for AzSkills.
 *
 * Checks project files, GDScript, and scenes against the bundled official
 * Godot 3.6 API index. Static analysis cannot prove runtime semantics, so this
 * tool reports what it verified and what still needs a real engine run.
 *
 * Usage:
 *   node check-godot-3x.ts --root <project> [--api <api-3.6.json>]
 *     [--overlay <dir>] [--files a.gd,b.tscn] [--mod <name>] [--json]
 *     [--strict] [--self-test]
 *
 * Every Godot file under --root is read so inheritance chains, signals, and
 * `res://` targets resolve project-wide; --files only selects which files may
 * produce findings. --overlay points at a directory that holds proposed
 * contents at paths relative to --root, so a write can be checked before it
 * lands without copying the project.
 *
 * Exit codes: 0 clean, 1 errors found, 2 usage or index failure.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  findTokenIssues,
  findVirtualRecalls,
  maskCommentsAndStrings,
  virtualRecallNames,
} from './godot3-lexical.ts';
import { errorMessage } from '../../scripts/runtime.ts';

interface ApiClassEntry {
  inherits?: string | null;
  methods?: string[];
  properties?: string[];
  signals?: string[];
  constants?: string[];
}

interface ApiIndexData {
  engineVersion?: string;
  builtinFunctions?: string[];
  classes?: Record<string, ApiClassEntry>;
}

interface Issue {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  hint: string | null;
}

interface Report {
  errors: Issue[];
  warnings: Issue[];
  checked: string[];
  verified: string[];
}

interface ProjectScriptRecord {
  file: string;
  classNames: Set<string>;
  methods: Set<string>;
  signals: Set<string>;
  extendsTarget: string | null;
  aliases: Map<string, string>;
}

interface UnresolvedBase {
  file: string;
  target: string;
}

interface Ancestry {
  methods: Set<string>;
  signals: Set<string>;
  classNames: Set<string>;
  engineBases: string[];
  unresolved: UnresolvedBase[];
}

interface CheckContext {
  projectClasses: Set<string>;
  index: ProjectIndex;
}

interface GodotFileEntry {
  rootFile: string | null;
  overlayFile: string | null;
}

interface RunCheckOptions {
  root: string;
  overlay: string | null;
  apiPath: string;
  files: string[];
  mod: ModLayout | null;
  layout: boolean;
  strict: boolean;
}

interface RunCheckResult {
  report: Report;
  targets: string[];
}

interface MemberCallRule {
  pattern: RegExp;
  code: string;
  message: string;
  hint: string;
  skipWhenProjectMethod?: string;
}

interface ModLayout {
  name: string;
  extensionPrefix: string;
  methodPrefix: string;
  signalPrefix: string;
}

interface MaskedMatch {
  index: number;
  groups: RegExpExecArray;
}

interface Fixture {
  name: string;
  files: Record<string, string>;
  overlay?: Record<string, string>;
  files_filter?: string[];
  mod?: string;
  layout?: boolean;
  expect: 'pass' | 'fail';
  expectCodes?: string[];
  absentFromReport?: string[];
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultApi = path.join(scriptDirectory, '..', 'references', 'api-3.6.json');
// Directories that never contain project scripts.
const ignoredDirectories = new Set(['.git', '.godot', '.import', 'node_modules']);
// Third-party add-ons are indexed for context but are not reported by default.
const unreportedDirectories = new Set(['addons']);
const gdExtensions = new Set(['.gd']);
const sceneExtensions = new Set(['.tscn', '.escn']);

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
  'GPUParticles3D',
  'CPUParticles3D',
  'World3D',
  'MultiMeshInstance3D',
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
  'Sprite2D',
  'AnimatedSprite2D',
  'TileMapLayer',
  'PointLight2D',
  'GPUParticles2D',
  'NavigationObstacle3D',
  'Skeleton3D',
  'BoneAttachment3D',
  'SoftBody3D',
  'VehicleBody3D',
  'VehicleWheel3D',
  'AnimatableBody2D',
  'AnimatableBody3D',
];

const renamedClasses: Record<string, string> = {
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
const fourXMethods: Record<string, string> = {
  instantiate: 'instance',
  change_scene_to_file: 'change_scene',
  change_scene_to_packed: 'change_scene_to',
  queue_redraw: 'update',
};

// 4.x names that a project could plausibly reuse for its own method, so they
// are advisory instead of blocking.
const fourXMethodHints: Record<string, string> = {
  get_window: 'the viewport via `get_viewport()`, or the OS singleton for the OS window',
  is_editor_hint: 'the property `Engine.editor_hint`',
  find_children: '`get_children()` plus a name or group filter, or `find_node(name, true, false)`',
  rotate_toward: '`lerp_angle()` or your own clamped rotation step',
  get_window_size: 'the property `OS.window_size`',
  set_window_size: 'the property `OS.window_size`',
};

const fourXGlobals: Record<string, string> = {
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
const fourXMemberCalls: readonly MemberCallRule[] = [
  {
    pattern: /\.\s*lerp\s*\(/g,
    code: 'GODOT4_METHOD',
    message: 'Godot 4.x value `.lerp()`',
    hint: '3.x uses `Vector2.linear_interpolate()`, `Color.linear_interpolate()`, or the global `lerp()`.',
    skipWhenProjectMethod: 'lerp',
  },
];

// Setting names or defaults that only exist in Godot 4.x.
const fourXSettings: Record<string, string> = {
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

const gdscriptKeywords: ReadonlySet<string> = new Set([
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

function valueOf(args: readonly string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new UsageError(flag + ' requires a value');
  return value;
}

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function locate(starts: readonly number[], offset: number): { line: number; column: number } {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const start = starts[middle];
    if (start !== undefined && start <= offset) low = middle;
    else high = middle - 1;
  }
  return { line: low + 1, column: offset - (starts[low] ?? 0) + 1 };
}

class ApiIndex {
  readonly data: ApiIndexData;
  readonly classes: Record<string, ApiClassEntry>;
  readonly builtins: Set<string>;
  readonly ownersByMethod: Map<string, string[]>;
  readonly projectSettings: Set<string>;
  readonly settingNamespaces: Set<string>;

  constructor(data: ApiIndexData) {
    this.data = data;
    this.classes = data.classes ?? {};
    this.builtins = new Set(data.builtinFunctions ?? []);
    this.ownersByMethod = new Map<string, string[]>();
    for (const [name, entry] of Object.entries(this.classes)) {
      for (const method of entry.methods ?? []) {
        const owners = this.ownersByMethod.get(method);
        if (!owners) this.ownersByMethod.set(method, [name]);
        else owners.push(name);
      }
    }
    this.projectSettings = new Set(this.classes.ProjectSettings?.properties ?? []);
    this.settingNamespaces = new Set(
      [...this.projectSettings].map((key) => key.split('/')[0] ?? ''),
    );
  }

  hasClass(name: string): boolean {
    return Boolean(this.classes[name]);
  }

  hasMethod(name: string): boolean {
    return this.ownersByMethod.has(name);
  }

  chain(className: string): string[] {
    const names: string[] = [];
    let current = className;
    const seen = new Set<string>();
    while (current && this.classes[current] && !seen.has(current)) {
      names.push(current);
      seen.add(current);
      current = this.classes[current]?.inherits ?? '';
    }
    return names;
  }

  hasMember(className: string, member: string): boolean {
    for (const name of this.chain(className)) {
      const entry = this.classes[name];
      if (!entry) continue;
      const lists: (string[] | undefined)[] = [
        entry.methods,
        entry.properties,
        entry.signals,
        entry.constants,
      ];
      if (lists.some((list) => (list ?? []).includes(member))) return true;
    }
    return false;
  }
}

// Project-wide symbol index. `extends "res://Base.gd"` and methods or signals
// declared by a base script only exist in another file, so a single-file check
// reports valid 3.x code as broken. The index resolves script paths,
// `class_name` owners, `preload` aliases, and inheritance chains without
// copying the project.
class ProjectIndex {
  readonly root: string;
  readonly api: ApiIndex;
  // Keyed by project-relative POSIX path so overlay and real files agree.
  readonly scripts: Map<string, ProjectScriptRecord>;
  readonly scenes: Set<string>;
  readonly classOwners: Map<string, string>;
  readonly classNames: Set<string>;
  readonly autoloads: Set<string>;
  readonly autoloadPaths: Map<string, string>;

  constructor(root: string, api: ApiIndex) {
    this.root = root;
    this.api = api;
    this.scripts = new Map<string, ProjectScriptRecord>();
    this.scenes = new Set<string>();
    this.classOwners = new Map<string, string>();
    this.classNames = new Set<string>();
    this.autoloads = new Set<string>();
    this.autoloadPaths = new Map<string, string>();
  }

  addScript(relativePath: string, text: string): void {
    const rel = normalizeRelative(relativePath);
    const record: ProjectScriptRecord = {
      file: rel,
      classNames: new Set<string>(),
      methods: new Set<string>(),
      signals: new Set<string>(),
      extendsTarget: null,
      aliases: new Map<string, string>(),
    };
    // The mask keeps every offset identical while blanking comments and string
    // bodies, so keywords are located in the mask and parsed from the text.
    // Parsing the raw text directly would also match `# extends "..."` notes.
    const body = maskCommentsAndStrings(text);
    // Only top-level declarations join the inheritance chain; inner classes
    // may legally reuse a name and must not leak into the parent's surface.
    for (const match of body.matchAll(/^class_name[ \t]+([A-Za-z_]\w*)/gm)) {
      const name = match[1];
      if (name) record.classNames.add(name);
    }
    for (const match of body.matchAll(/^(?:static[ \t]+)?func[ \t]+([A-Za-z_]\w*)/gm)) {
      const name = match[1];
      if (name) record.methods.add(name);
    }
    for (const match of body.matchAll(/^signal[ \t]+([A-Za-z_]\w*)/gm)) {
      const name = match[1];
      if (name) record.signals.add(name);
    }
    const extendsAt = /^extends\b/m.exec(body);
    if (extendsAt) {
      const extendsMatch = /^extends[ \t]+(?:"([^"]+)"|([A-Za-z_][\w.]*))/.exec(text.slice(extendsAt.index));
      if (extendsMatch) record.extendsTarget = extendsMatch[1] ?? extendsMatch[2] ?? null;
    }
    for (const match of body.matchAll(/^(?:const|var)[ \t]+([A-Za-z_]\w*)[ \t]*=[ \t]*preload[ \t]*\(/gm)) {
      const target = /^(?:const|var)[ \t]+[A-Za-z_]\w*[ \t]*=[ \t]*preload[ \t]*\([ \t]*"([^"]+)"/.exec(text.slice(match.index));
      const aliasName = match[1];
      const aliasTarget = target?.[1];
      if (aliasName && aliasTarget) record.aliases.set(aliasName, aliasTarget);
    }
    this.scripts.set(rel, record);
    for (const name of record.classNames) {
      this.classNames.add(name);
      if (!this.classOwners.has(name)) this.classOwners.set(name, rel);
    }
  }

  addProjectGodot(text: string): void {
    let section = '';
    for (const line of text.split(/\r?\n/)) {
      const header = /^\s*\[([^\]]+)\]\s*$/.exec(line);
      if (header) {
        section = (header[1] ?? '').trim();
        continue;
      }
      if (section !== 'autoload') continue;
      const match = /^\s*([A-Za-z_]\w*)\s*=\s*"?(?:\*)?(res:\/\/[^"]+)"?/.exec(line);
      if (!match) {
        const nameOnly = /^\s*([A-Za-z_]\w*)\s*=/.exec(line);
        const name = nameOnly?.[1];
        if (name) this.autoloads.add(name);
        continue;
      }
      const name = match[1];
      const target = match[2];
      if (!name || !target) continue;
      this.autoloads.add(name);
      this.autoloadPaths.set(name, target);
    }
  }

  addScene(relativePath: string): void {
    this.scenes.add(normalizeRelative(relativePath));
  }

  scriptRelative(fromRelative: string, target: string | null): string | null {
    if (!target) return null;
    const alias = this.scripts.get(normalizeRelative(fromRelative))?.aliases.get(target);
    const value = alias ?? target;
    if (value.startsWith('res://')) return normalizeRelative(value.slice('res://'.length));
    if (/\.gd$/i.test(value)) return normalizeRelative(path.posix.join(path.posix.dirname(normalizeRelative(fromRelative)), value));
    return null;
  }

  resolveScript(fromRelative: string, target: string | null): string | null {
    if (!target) return null;
    const direct = this.scriptRelative(fromRelative, target);
    if (direct && this.scripts.has(direct)) return direct;
    return this.classOwners.get(target) ?? null;
  }

  resolveScene(fromRelative: string, target: string | null): string | null {
    if (!target) return null;
    const value = target.startsWith('res://')
      ? target.slice('res://'.length)
      : /\.(?:tscn|escn)$/i.test(target)
        ? path.posix.join(path.posix.dirname(normalizeRelative(fromRelative)), target)
        : null;
    if (!value) return null;
    const relative = normalizeRelative(value);
    return this.scenes.has(relative) ? relative : null;
  }

  ancestry(relativePath: string): Ancestry {
    const methods = new Set<string>();
    const signals = new Set<string>();
    const classNames = new Set<string>();
    const engineBases: string[] = [];
    const unresolved: UnresolvedBase[] = [];
    const seen = new Set<string>();
    let record = this.scripts.get(normalizeRelative(relativePath));
    while (record && !seen.has(record.file)) {
      seen.add(record.file);
      for (const name of record.methods) methods.add(name);
      for (const name of record.signals) signals.add(name);
      for (const name of record.classNames) classNames.add(name);
      if (!record.extendsTarget) break;
      const parent = this.resolveScript(record.file, record.extendsTarget);
      if (!parent) {
        if (this.api.hasClass(record.extendsTarget)) engineBases.push(record.extendsTarget);
        else unresolved.push({ file: record.file, target: record.extendsTarget });
        break;
      }
      record = this.scripts.get(parent);
    }
    return { methods, signals, classNames, engineBases, unresolved };
  }
}

function normalizeRelative(value: string): string {
  const normalized = path.posix.normalize(String(value).split(path.sep).join('/'));
  return normalized.replace(/^\.\//, '');
}

function createReport(): Report {
  return { errors: [], warnings: [], checked: [], verified: [] };
}

function addIssue(
  report: Report,
  file: string,
  starts: readonly number[],
  offset: number,
  code: string,
  message: string,
  hint?: string | null,
): void {
  const { line, column } = locate(starts, offset);
  report.errors.push({ file, line, column, code, message, hint: hint ?? null });
}

function addWarning(
  report: Report,
  file: string,
  starts: readonly number[],
  offset: number,
  code: string,
  message: string,
  hint?: string | null,
): void {
  const { line, column } = locate(starts, offset);
  report.warnings.push({ file, line, column, code, message, hint: hint ?? null });
}

function checkGodotVersion(report: Report, file: string, text: string): void {
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
  const version = match[1];
  if (version === '5') {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'GODOT4_PROJECT',
      'config_version=5 is a Godot 4.x project',
      'Godot 3.x projects use `config_version=4`.',
    );
  } else if (version !== '4') {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_CONFIG_VERSION',
      'unsupported config_version=' + version,
      'Godot 3.x expects `config_version=4`.',
    );
  } else {
    report.verified.push(file + ': config_version=4');
  }
}

function checkProjectSettings(
  report: Report,
  file: string,
  text: string,
  api: ApiIndex,
): void {
  const lines = text.split('\n');
  const starts = lineStarts(text);
  let section = '';
  lines.forEach((line, index) => {
    const sectionMatch = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (sectionMatch) {
      section = (sectionMatch[1] ?? '').trim();
      return;
    }
    const match = /^\s*([A-Za-z0-9_][A-Za-z0-9_.\-/]*)\s*=/.exec(line);
    if (!match) return;
    // Keys before the first [section] are file metadata such as config_version.
    if (!section) return;
    const name = match[1];
    if (!name) return;
    const key = section + '/' + name;
    const offset = (starts[index] ?? 0) + match.index;
    if (projectDefinedSettings.has(key.split('/')[0] ?? '')) return;
    if (Object.hasOwn(fourXSettings, key)) {
      addIssue(
        report,
        file,
        starts,
        offset,
        'GODOT4_PROJECT_SETTING',
        'Godot 4.x project setting ' + key,
        'Use ' + (fourXSettings[key] ?? '') + '.',
      );
      return;
    }
    if (api.projectSettings.has(key)) {
      report.verified.push(file + ': setting ' + key);
      return;
    }
    // The 3.6 documentation omits some keys, so only warn when the whole
    // namespace is unknown.
    if (api.settingNamespaces.has(key.split('/')[0] ?? '')) return;
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

function checkAutoloadPaths(
  report: Report,
  file: string,
  text: string,
  index: ProjectIndex,
): void {
  if (!index.autoloadPaths.size) return;
  const lines = text.split('\n');
  const starts = lineStarts(text);
  let section = '';
  lines.forEach((line, lineIndex) => {
    const sectionMatch = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (sectionMatch) {
      section = (sectionMatch[1] ?? '').trim();
      return;
    }
    if (section !== 'autoload') return;
    const match = /^\s*([A-Za-z_]\w*)\s*=/.exec(line);
    if (!match) return;
    const name = match[1];
    if (!name) return;
    const target = index.autoloadPaths.get(name);
    if (!target) return;
    const scripted = /\.gd$/i.test(target) ? index.resolveScript(file, target) : null;
    const scene = /\.(?:tscn|escn)$/i.test(target) ? index.resolveScene(file, target) : null;
    const resolvable = /\.(?:gd|tscn|escn)$/i.test(target);
    if (!resolvable || scripted || scene) return;
    addIssue(
      report,
      file,
      starts,
      (starts[lineIndex] ?? 0) + match.index,
      'MISSING_AUTOLOAD_PATH',
      'autoload ' + name + ' targets missing resource ' + target,
      'Godot 3.x reports an autoload load error and the singleton is unavailable when the path is missing.',
    );
  });
}

function checkScene(
  report: Report,
  file: string,
  text: string,
  api: ApiIndex,
  projectClasses: ReadonlySet<string>,
  index: ProjectIndex,
): void {
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
  const format = /format\s*=\s*(\d+)/.exec(header[1] ?? '');
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
  for (const match of text.matchAll(/\[ext_resource\b[^\]]*\]/g)) {
    const attributes = match[0];
    const type = /\btype\s*=\s*"([^"]+)"/.exec(attributes)?.[1];
    const target = /\bpath\s*=\s*"([^"]+)"/.exec(attributes)?.[1];
    if (!type) continue;
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
    // A scene cannot load when its ext_resource script is gone. The path is
    // literal in the file, so this is a hard error rather than a guess.
    if (target && /\.gd$/i.test(target) && !index.resolveScript(file, target)) {
      addIssue(
        report,
        file,
        starts,
        match.index,
        'MISSING_SCENE_SCRIPT_PATH',
        'scene ext_resource targets missing script ' + target,
        'Godot 3.x fails to load the scene when an ext_resource path does not exist.',
      );
    }
  }
  for (const match of text.matchAll(/\[node\b[^\]]*\btype\s*=\s*"([^"]+)"[^\]]*\]/g)) {
    const type = match[1];
    if (type === undefined) continue;
    if (api.hasClass(type)) {
      report.verified.push(file + ': node type ' + type);
    } else if (projectClasses.has(type)) {
      report.verified.push(file + ': project class ' + type);
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

function checkTokens(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
): void {
  for (const issue of findTokenIssues(mask)) {
    addIssue(report, file, starts, issue.index, issue.code, issue.message + ': ' + issue.text, issue.hint);
  }
}

function checkVirtualRecalls(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
): void {
  for (const match of findVirtualRecalls(mask)) {
    addIssue(
      report,
      file,
      starts,
      match.index,
      'VIRTUAL_RECALL',
      'engine-dispatched virtual is re-called: ._' + match.name + '()',
      'The engine already calls every script level of _' + match.name + '. Remove the call; share work through a named method.',
    );
  }
}

function checkMemberCalls(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
  api: ApiIndex,
  customMethods: ReadonlySet<string>,
): void {
  for (const rule of fourXMemberCalls) {
    for (const match of mask.matchAll(rule.pattern)) {
      // No 3.6 value type defines `.lerp()`, but a project may declare its own.
      if (rule.skipWhenProjectMethod) {
        const callee = rule.skipWhenProjectMethod;
        if (customMethods.has(callee) || api.hasMethod(callee)) continue;
      }
      addIssue(report, file, starts, match.index, rule.code, rule.message, rule.hint);
    }
  }
}

function checkClasses(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
  api: ApiIndex,
  declaredClasses: ReadonlySet<string>,
): void {
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
        match.index + (match[1] ?? '').length,
        'GODOT4_CLASS',
        'Godot 4.x class name ' + name,
        'Use ' + (renamedClasses[name] ?? 'the Godot 3.6 class') + '.',
      );
    }
  }
}

const statementKeywords: ReadonlySet<string> = new Set([
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

function checkCalls(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
  api: ApiIndex,
  declaredClasses: ReadonlySet<string>,
  customMethods: ReadonlySet<string>,
): void {
  for (const match of mask.matchAll(/([A-Za-z_][\w.]*)\s*\(/g)) {
    const raw = match[1];
    if (!raw) continue;
    const parts = raw.split('.');
    const callee = parts.at(-1);
    if (!callee) continue;
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
        'Use ' + (fourXMethods[callee] ?? '') + ' in 3.6.',
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
        'In 3.6 use ' +
          (fourXMethodHints[callee] ?? '') +
          '; ignore this if the project defines its own ' +
          callee +
          '().',
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
        'It belongs to ' +
          (api.ownersByMethod.get(callee) ?? []).slice(0, 3).join(', ') +
          '; check the receiver.',
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
        'Use ' + (fourXGlobals[callee] ?? '') + '.',
      );
    }
  }
}

function collectDeclarations(mask: string): { classes: Set<string>; methods: Set<string> } {
  const classes = new Set<string>();
  const methods = new Set<string>();
  for (const match of mask.matchAll(/^\s*class\s+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (name) classes.add(name);
  }
  for (const match of mask.matchAll(/^\s*(?:static\s+)?func\s+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (name) methods.add(name);
  }
  for (const match of mask.matchAll(/^\s*class_name\s+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (name) classes.add(name);
  }
  return { classes, methods };
}

type ModSection = 'extensions' | 'custom' | 'methods' | 'signals';

const modSectionRank: Record<ModSection, number> = {
  extensions: 0,
  custom: 1,
  methods: 2,
  signals: 3,
};

const modSectionLabels: Record<ModSection, string> = {
  extensions: 'Extensions',
  custom: 'Custom',
  methods: 'Methods',
  signals: 'Signals',
};

const modSectionByLabel: Record<string, ModSection> = {
  Extensions: 'extensions',
  Custom: 'custom',
  Methods: 'methods',
  Signals: 'signals',
};

// A divider is `#`, 42 U+2550 bars, the label, 42 bars, `#`, so both bars carry
// the same width and the line length changes only with the label.
const sectionBar = '\u2550'.repeat(42);

function sectionDivider(label: string): string {
  return '# ' + sectionBar + ' ' + label + ' ' + sectionBar + ' #';
}

const canonicalDividerPattern = new RegExp(
  '^([ \\t]*)# ' +
    sectionBar +
    ' (Extensions|Custom|Methods|Signals) ' +
    sectionBar +
    ' #[ \\t]*\\r?$',
);
const dividerLikePattern = new RegExp('^[ \\t]*#[ \\t]*' + '\u2550'.repeat(2));
// A divider-like line whose label is a section name must be the canonical line;
// a 41-bar bar, a lowercase label, or an old singular label is a format defect.
// A topical label such as `Signal wiring` is not in this set.
const sectionDividerLabels = new Set([
  'extensions',
  'custom',
  'methods',
  'signals',
  'extension',
  'method',
  'signal',
  'callback',
]);

// The only banners allowed above Extensions. Both group declarations, and
// `Setters` holds the setter bodies a `setget` declaration names, so functions
// there are declarations-adjacent rather than members of a section.
const declarationDividerLabels = new Set(['variables', 'setters']);

function dividerLabelText(line: string): string {
  const parts = line.split(/\u2550+/);
  if (parts.length < 3) return '';
  return (parts[1] ?? '').replace(/#/g, '').trim().toLowerCase();
}

// `MoreStatsContainer` -> [`more`, `stats`, `container`]; `HD_Mod` -> [`hd`, `mod`].
function modNameWords(name: string): string[] {
  return name
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

// The default prefixes keep the first word whole and reduce the rest to their
// initials, so `MoreStatsContainer` becomes `moresc_*` and `msc_*`.
function deriveModLayout(name: string, extension?: string, method?: string): ModLayout | null {
  const words = modNameWords(name);
  const first = words[0];
  if (first == null) return null;
  const derivedMethod = words.map((word) => word.charAt(0)).join('');
  const derivedExtension = first + words.slice(1).map((word) => word.charAt(0)).join('');
  const methodPrefix = (method ?? derivedMethod).toLowerCase();
  const extensionPrefix = (extension ?? derivedExtension).toLowerCase();
  if (!/^[a-z][a-z0-9]*$/.test(methodPrefix)) return null;
  if (!/^[a-z][a-z0-9]*$/.test(extensionPrefix)) return null;
  return { name, extensionPrefix, methodPrefix, signalPrefix: methodPrefix + '_on_' };
}

// The marker is a comment, so the mask must be blank on that line; the same
// text inside a string is data, not a directive.
function findModMarker(text: string, mask: string): { offset: number; tokens: string[] } | null {
  for (const match of text.matchAll(/^[ \t]*#[ \t]*azskills-mod[ \t]*:[ \t]*([^\n]*)$/gm)) {
    const end = match.index + match[0].length;
    if (mask.slice(match.index, end).trim() !== '') continue;
    return {
      offset: match.index,
      tokens: (match[1] ?? '').trim().split(/[ \t]+/).filter(Boolean),
    };
  }
  return null;
}

function classifyModFunction(name: string, layout: ModLayout): ModSection {
  // `msc_on_*` also starts with `msc_`, so the signal section is tested first.
  if (name.startsWith(layout.signalPrefix)) return 'signals';
  if (name.startsWith(layout.extensionPrefix + '_')) return 'custom';
  if (name.startsWith(layout.methodPrefix + '_')) return 'methods';
  return 'extensions';
}

interface LayoutCodes {
  missing: string;
  placement: string;
  order: string;
  format: string;
  extra: string;
  unsectioned: string;
}

const modLayoutCodes: LayoutCodes = {
  missing: 'MOD_SECTION_MISSING',
  placement: 'MOD_SECTION_PLACEMENT',
  order: 'MOD_SECTION_ORDER',
  format: 'MOD_SECTION_FORMAT',
  extra: 'MOD_SECTION_EXTRA',
  unsectioned: 'MOD_SECTION_PLACEMENT',
};

const scriptLayoutCodes: LayoutCodes = {
  missing: 'SCRIPT_SECTION_MISSING',
  placement: 'SCRIPT_SECTION_PLACEMENT',
  order: 'SCRIPT_SECTION_ORDER',
  format: 'SCRIPT_SECTION_FORMAT',
  extra: 'SCRIPT_SECTION_EXTRA',
  unsectioned: 'SCRIPT_FUNCTION_UNSECTIONED',
};

interface SectionFunctionHit {
  name: string;
  offset: number;
  // The section whose divider is open above the function, or null before the
  // first divider. `declarations` marks a function below a Variables, Setters,
  // or topical divider that sits above Extensions; that scope is not a layer.
  scope: ModSection | null;
  declarations: boolean;
}

interface SectionScan {
  sawDivider: boolean;
  functions: SectionFunctionHit[];
}

// Read the column-0 dividers and the top-level functions of one script. The
// mod gate and the standalone gate share this pass, so both see one structure
// and one set of order, format, and stray-divider findings.
function scanSections(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  codes: LayoutCodes,
): SectionScan {
  const lines = text.split('\n');
  const lineStarts: number[] = [];
  let cursor = 0;
  for (const line of lines) {
    lineStarts.push(cursor);
    cursor += line.length + 1;
  }

  let currentSection: ModSection | null = null;
  let lastDividerRank = -1;
  let sawDivider = false;
  let declarationsScope = false;
  const functions: SectionFunctionHit[] = [];

  lines.forEach((line, index) => {
    const start = lineStarts[index] ?? 0;
    const maskedLine = mask.slice(start, start + line.length);
    // The mask blanks comments, so a blank masked line is a real comment; the
    // same bar text inside a string stays code and is not a divider.
    if (maskedLine.trim() === '') {
      // Only a column-0 comment is a section boundary. An indented banner sits
      // inside a class or a function body, where it labels code, not a layer.
      if (/^[ \t]/.test(line)) return;
      const canonical = canonicalDividerPattern.exec(line);
      if (canonical) {
        const label = canonical[2] ?? '';
        const section = modSectionByLabel[label];
        if (!section) return;
        sawDivider = true;
        declarationsScope = false;
        const rank = modSectionRank[section];
        if (rank <= lastDividerRank) {
          addIssue(
            report,
            file,
            starts,
            start,
            codes.order,
            'the ' + label + ' divider is out of order or repeated',
            'Order the dividers as Extensions, Custom, Methods, then Signals.',
          );
        } else {
          lastDividerRank = rank;
        }
        currentSection = section;
        return;
      }
      if (dividerLikePattern.test(line)) {
        const label = dividerLabelText(line);
        if (sectionDividerLabels.has(label)) {
          addIssue(
            report,
            file,
            starts,
            start,
            codes.format,
            'divider-like comment is not a canonical section divider',
            'Use "# ", 42 U+2550 bars, one of Extensions, Custom, Methods, Signals, 42 bars, then " #".',
          );
        } else if (!sawDivider && declarationDividerLabels.has(label)) {
          // Variables or Setters above Extensions. Declarations, not a layer.
          declarationsScope = true;
          currentSection = null;
        } else if (sawDivider) {
          addWarning(
            report,
            file,
            starts,
            start,
            codes.extra,
            'non-canonical divider appears after a section divider',
            'Only Extensions, Custom, Methods, and Signals are section dividers; keep a topical divider above Extensions.',
          );
        } else {
          // A topical banner above Extensions is not a declaration scope, so a
          // function under it has no section. Only Variables and Setters may
          // sit there.
          addWarning(
            report,
            file,
            starts,
            start,
            codes.extra,
            'a banner other than Variables or Setters sits above Extensions',
            'Keep only Variables and Setters above Extensions; move a topical grouping into Custom or Methods.',
          );
        }
        return;
      }
      return;
    }
    const match = /^(?:static[ \t]+)?func[ \t]+([A-Za-z_]\w*)/.exec(maskedLine);
    const name = match?.[1];
    if (!name) return;
    functions.push({ name, offset: start, scope: currentSection, declarations: declarationsScope });
  });

  return { sawDivider, functions };
}

function checkModLayout(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  fallback: ModLayout | null,
): void {
  const marker = findModMarker(text, mask);
  const layout = marker
    ? marker.tokens.length <= 3
      ? deriveModLayout(marker.tokens[0] ?? '', marker.tokens[1], marker.tokens[2])
      : null
    : fallback;
  if (marker && !layout) {
    addIssue(
      report,
      file,
      starts,
      marker.offset,
      'MOD_MARKER_INVALID',
      '`# azskills-mod:` needs a mod name and at most an extension and a method prefix',
      'Write `# azskills-mod: MoreStatsContainer` or `# azskills-mod: MoreStatsContainer moresc msc`.',
    );
    return;
  }
  if (!layout) return;

  const scan = scanSections(report, file, text, mask, starts, modLayoutCodes);
  const functions = scan.functions.map((hit) => ({
    ...hit,
    section: classifyModFunction(hit.name, layout),
  }));
  if (functions.length === 0) return;

  const firstOffset = functions[0]?.offset ?? 0;
  if (!scan.sawDivider) {
    addIssue(
      report,
      file,
      starts,
      firstOffset,
      modLayoutCodes.missing,
      'mod script has functions but no canonical section divider',
      'Add the Extensions, Custom, Methods, and Signals dividers: "# ", 42 U+2550 bars, the label, 42 bars, " #".',
    );
  } else {
    for (const hit of functions) {
      if (hit.declarations || hit.scope === hit.section) continue;
      const where = hit.scope
        ? modSectionLabels[hit.scope]
        : hit.declarations
          ? 'the declarations'
          : 'a banner above Extensions';
      addIssue(
        report,
        file,
        starts,
        hit.offset,
        modLayoutCodes.placement,
        hit.name + '() sits under ' + where + ' but belongs to ' + modSectionLabels[hit.section],
        'Move it under the ' + modSectionLabels[hit.section] + ' divider, or rename it to match its section.',
      );
    }
  }

  let highest = -1;
  let highestLabel = '';
  for (const hit of functions) {
    // A setter body under `Setters` is a declaration, not a layer member, so
    // it neither breaks nor advances the section order.
    if (!hit.declarations) {
      const rank = modSectionRank[hit.section];
      if (rank < highest) {
        addIssue(
          report,
          file,
          starts,
          hit.offset,
          'MOD_FUNCTION_ORDER',
          modSectionLabels[hit.section] +
            ' function ' +
            hit.name +
            '() appears after ' +
            highestLabel +
            ' functions',
          'Order mod functions as Extensions, then ' +
            layout.extensionPrefix +
            '_*, then ' +
            layout.methodPrefix +
            '_*, then ' +
            layout.signalPrefix +
            '*.',
        );
      } else if (rank > highest) {
        highest = rank;
        highestLabel = modSectionLabels[hit.section];
      }
    }
    if (hit.section === 'extensions') continue;
    const prefix =
      hit.section === 'custom'
        ? layout.extensionPrefix + '_'
        : hit.section === 'methods'
          ? layout.methodPrefix + '_'
          : layout.signalPrefix;
    const suffix = hit.name.slice(prefix.length);
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(suffix)) {
      addIssue(
        report,
        file,
        starts,
        hit.offset,
        'MOD_FUNCTION_NAME',
        hit.name + '() does not follow ' + prefix + '<lowercase_words>',
        'Mod functions are lowercase with `_` between words; rename it, for example, to ' +
          prefix +
          'handle_event.',
      );
    }
  }
}

// `_ready`, `_process`, and the other callbacks the engine dispatches itself.
const virtualCallbackNames = new Set(virtualRecallNames.map((name) => '_' + name));

interface ScriptLayoutContext {
  connectTargets: ReadonlySet<string>;
  baseMethods: ReadonlySet<string>;
}

function findLayoutMarker(text: string, mask: string): boolean {
  for (const match of text.matchAll(/^[ \t]*#[ \t]*azskills-layout[ \t]*\r?$/gm)) {
    const end = match.index + match[0].length;
    if (mask.slice(match.index, end).trim() === '') return true;
  }
  return false;
}

// A mod script classifies by prefix. A standalone script has no prefix, so only
// the two ends are decidable: an engine-dispatched or base-script entry is
// Extensions, and a connect() target is Signals. Everything else may sit in
// Custom or Methods, because only the author knows who calls it.
function classifyScriptFunction(name: string, context: ScriptLayoutContext): ModSection | null {
  if (context.connectTargets.has(name)) return 'signals';
  if (virtualCallbackNames.has(name)) return 'extensions';
  if (context.baseMethods.has(name)) return 'extensions';
  if (/_on_[a-z0-9_]+$/.test(name)) return 'signals';
  return null;
}

function checkScriptLayout(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  enabled: boolean,
  context: ScriptLayoutContext,
): void {
  if (!enabled && !findLayoutMarker(text, mask)) return;
  // A mod script has the stricter gate, and its marker always wins.
  if (findModMarker(text, mask)) return;
  const scan = scanSections(report, file, text, mask, starts, scriptLayoutCodes);
  if (scan.functions.length === 0) return;
  if (!scan.sawDivider) {
    addIssue(
      report,
      file,
      starts,
      scan.functions[0]?.offset ?? 0,
      scriptLayoutCodes.missing,
      'script has functions but no canonical section divider',
      'Add the Extensions, Custom, Methods, and Signals dividers: "# ", 42 U+2550 bars, the label, 42 bars, " #".',
    );
    return;
  }
  for (const hit of scan.functions) {
    // A setter body under `Setters` belongs to the declarations, not a layer.
    if (hit.declarations) continue;
    if (hit.scope === null) {
      addIssue(
        report,
        file,
        starts,
        hit.offset,
        scriptLayoutCodes.unsectioned,
        hit.name + '() sits above the first section divider',
        'Move it under Extensions, Custom, Methods, or Signals; only declarations and setter bodies stay above Extensions.',
      );
      continue;
    }
    const section = classifyScriptFunction(hit.name, context);
    if (!section || section === hit.scope) continue;
    addIssue(
      report,
      file,
      starts,
      hit.offset,
      scriptLayoutCodes.placement,
      hit.name +
        '() sits under ' +
        modSectionLabels[hit.scope] +
        ' but belongs to ' +
        modSectionLabels[section] +
        (section === 'extensions'
          ? ': the engine or a base script calls it'
          : ': only a connect() target reaches it'),
      'Move it under the ' + modSectionLabels[section] + ' divider.',
    );
  }
}

function checkIndentation(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
): void {
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
          (starts[index] ?? 0) + mixed.index,
          'MIXED_INDENTATION',
          'line mixes spaces and tabs for indentation',
          'GDScript rejects mixed indentation; use tabs consistently.',
        );
      } else if (/^ +[^\s]/.test(line)) {
        addIssue(
          report,
          file,
          starts,
          starts[index] ?? 0,
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

function checkDeclarationPlacement(
  report: Report,
  file: string,
  mask: string,
  starts: readonly number[],
): void {
  for (const match of mask.matchAll(/^([ \t]*)(export|onready)\b/gm)) {
    const indent = match[1] ?? '';
    const keyword = match[2] ?? '';
    if (indent.length === 0) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'MISPLACED_DECLARATION',
      '`' + keyword + '` is only valid at class scope',
      '`' + keyword + '` inside a function body is a parse error in Godot 3.x.',
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
      'statement `' + (firstStatement[1] ?? '') + '` appears before `extends`',
      'Godot 3.x requires `tool`, `class_name`, then `extends` before any other statement.',
    );
  }
  const seen = new Map<string, number>();
  // Inner classes are separate scopes, so only top-level definitions collide.
  for (const match of mask.matchAll(/^(?:static[ \t]+)?func[ \t]+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (!name) continue;
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

// Comments and string bodies must never create a finding, so every match is
// located in the mask and then parsed from the original text at that offset.
function maskedMatches(
  text: string,
  mask: string,
  opener: RegExp,
  parser: (slice: string) => RegExpExecArray | null,
): MaskedMatch[] {
  const found: MaskedMatch[] = [];
  for (const match of mask.matchAll(opener)) {
    const parsed = parser(text.slice(match.index));
    if (parsed) found.push({ index: match.index, groups: parsed });
  }
  return found;
}

function checkSignalTargets(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  api: ApiIndex,
  baseClasses: readonly string[],
  customMethods: ReadonlySet<string>,
  declaredSignals: ReadonlySet<string>,
): void {
  const connectPattern = /\bconnect\s*\(/g;
  for (const match of maskedMatches(text, mask, connectPattern, (slice) =>
    /^connect\s*\(\s*"([A-Za-z_]\w*)"\s*,\s*(self|"[^"]*"|[A-Za-z_][\w.]*)\s*,\s*"([A-Za-z_]\w*)"/.exec(slice),
  )) {
    const method = match.groups[3];
    if (!method) continue;
    if (match.groups[2] !== 'self') continue;
    if (customMethods.has(method)) continue;
    if (baseClasses.some((name) => api.hasMember(name, method))) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNKNOWN_SIGNAL_TARGET',
      'connect() targets missing method ' + method + '() on self',
      'Declare ' + method + '() in this script or a base script; Godot 3.x reports a failed connection at runtime.',
    );
  }
  const emitPattern = /\bemit_signal\s*\(/g;
  for (const match of maskedMatches(text, mask, emitPattern, (slice) =>
    /^emit_signal\s*\(\s*"([A-Za-z_]\w*)"/.exec(slice),
  )) {
    const signal = match.groups[1];
    if (!signal) continue;
    if (declaredSignals.has(signal)) continue;
    if (baseClasses.some((name) => api.classes[name]?.signals?.includes(signal))) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'UNDECLARED_SIGNAL',
      'emit_signal() names undeclared signal ' + signal,
      'Declare `signal ' + signal + '` in this script or a base script; Godot 3.x cannot emit an undeclared signal.',
    );
  }
}

function godotResourceExists(index: ProjectIndex, file: string, target: string): boolean {
  if (/\.gd$/i.test(target)) return Boolean(index.resolveScript(file, target));
  if (/\.(?:tscn|escn)$/i.test(target)) return Boolean(index.resolveScene(file, target));
  return true;
}

function checkRuntimePath(
  report: Report,
  file: string,
  starts: readonly number[],
  index: ProjectIndex,
  offset: number,
  target: string,
  fnName: string,
  code: string,
): void {
  if (!/\.(?:gd|tscn|escn)$/i.test(target)) return;
  if (godotResourceExists(index, file, target)) return;
  addIssue(
    report,
    file,
    starts,
    offset,
    code,
    fnName + '() targets missing resource ' + target,
    fnName === 'preload'
      ? '3.x resolves preload at parse time, so a missing path is a hard parse error.'
      : 'Godot 3.x load() returns null at runtime when the path is missing; fix the res:// path or load user:// data.',
  );
}

function checkScriptPaths(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  index: ProjectIndex,
): void {
  const extendsPattern = /^[ \t]*extends\b/gm;
  for (const match of maskedMatches(text, mask, extendsPattern, (slice) =>
    /^[ \t]*extends[ \t]+"([^"]+)"/.exec(slice),
  )) {
    const target = match.groups[1];
    if (!target) continue;
    if (!/\.gd$/i.test(target)) continue;
    if (index.resolveScript(file, target)) continue;
    addIssue(
      report,
      file,
      starts,
      match.index,
      'MISSING_EXTENDS_PATH',
      'extends targets missing script ' + target,
      'Godot 3.x fails to load the script when the base path does not exist.',
    );
  }
  const preloadPattern = /\bpreload\s*\(/g;
  for (const match of maskedMatches(text, mask, preloadPattern, (slice) =>
    /^preload\s*\(\s*"([^"]+)"/.exec(slice),
  )) {
    const target = match.groups[1];
    if (!target) continue;
    checkRuntimePath(report, file, starts, index, match.index, target, 'preload', 'MISSING_PRELOAD_PATH');
  }
  // Only the global load() is a resource lookup; `object.load(path)` belongs to
  // whatever type owns it (ConfigFile, custom loader) and has other semantics.
  const loadPattern = /(?<![\w.])load\s*\(/g;
  for (const match of maskedMatches(text, mask, loadPattern, (slice) =>
    /^load\s*\(\s*"([^"]+)"/.exec(slice),
  )) {
    const target = match.groups[1];
    if (!target) continue;
    checkRuntimePath(report, file, starts, index, match.index, target, 'load', 'MISSING_LOAD_PATH');
  }
  const resourceLoaderPattern = /\bResourceLoader\s*\.\s*load\s*\(/g;
  for (const match of maskedMatches(text, mask, resourceLoaderPattern, (slice) =>
    /^ResourceLoader\s*\.\s*load\s*\(\s*"([^"]+)"/.exec(slice),
  )) {
    const target = match.groups[1];
    if (!target) continue;
    checkRuntimePath(report, file, starts, index, match.index, target, 'ResourceLoader.load', 'MISSING_LOAD_PATH');
  }
}

function checkMoveAndSlide(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
): void {
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

function checkGdScript(
  report: Report,
  file: string,
  text: string,
  mask: string,
  starts: readonly number[],
  api: ApiIndex,
  context: CheckContext,
  mod: ModLayout | null,
  layout: boolean,
): void {
  const declared = collectDeclarations(mask);
  const ancestry = context.index.ancestry(file);
  // Methods and signals resolve through the whole script inheritance chain, so
  // a callback declared by a base script is not a missing target here.
  const customMethods = new Set<string>([...declared.methods, ...ancestry.methods]);
  // `ancestry` starts at this file, so subtract its own declarations to leave
  // the functions a base script declares.
  const baseMethods = new Set<string>(ancestry.methods);
  for (const name of declared.methods) baseMethods.delete(name);
  // A `connect()` target on self is the only decidable Signals member of a
  // script without prefixes.
  const connectTargets = new Set<string>();
  for (const match of maskedMatches(text, mask, /\bconnect\s*\(/g, (slice) =>
    /^connect\s*\(\s*"[A-Za-z_]\w*"\s*,\s*self\s*,\s*"([A-Za-z_]\w*)"/.exec(slice),
  )) {
    const method = match.groups[1];
    if (method) connectTargets.add(method);
  }
  const declaredSignals = new Set<string>(ancestry.signals);
  for (const match of mask.matchAll(/^signal[ \t]+([A-Za-z_]\w*)/gm)) {
    const name = match[1];
    if (name) declaredSignals.add(name);
  }
  const declaredClasses = new Set<string>([
    ...declared.classes,
    ...context.projectClasses,
    ...ancestry.classNames,
  ]);
  checkTokens(report, file, mask, starts);
  checkMemberCalls(report, file, mask, starts, api, customMethods);
  checkVirtualRecalls(report, file, mask, starts);
  checkClasses(report, file, mask, starts, api, declaredClasses);
  checkCalls(report, file, mask, starts, api, declaredClasses, customMethods);
  checkIndentation(report, file, mask, starts);
  checkDeclarationPlacement(report, file, mask, starts);
  checkModLayout(report, file, text, mask, starts, mod);
  checkScriptLayout(report, file, text, mask, starts, layout, {
    connectTargets,
    baseMethods,
  });
  checkScriptPaths(report, file, text, mask, starts, context.index);
  const baseClasses = [...ancestry.engineBases];
  for (const match of maskedMatches(text, mask, /^[ \t]*extends\b/gm, (slice) =>
    /^[ \t]*extends[ \t]+([A-Za-z_][\w.]*)/.exec(slice),
  )) {
    const name = match.groups[1];
    if (!name) continue;
    if (api.hasClass(name)) {
      if (!baseClasses.includes(name)) baseClasses.push(name);
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
  checkSignalTargets(report, file, text, mask, starts, api, baseClasses, customMethods, declaredSignals);
  for (const match of mask.matchAll(/\bvar\s+[A-Za-z_]\w*\s*:\s*([A-Za-z_][\w.]*)/g)) {
    const name = match[1];
    if (!name) continue;
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

function checkProjectGodotText(
  report: Report,
  file: string,
  text: string,
  api: ApiIndex,
  index: ProjectIndex,
): void {
  checkGodotVersion(report, file, text);
  checkProjectSettings(report, file, text, api);
  checkAutoloadPaths(report, file, text, index);
}

async function* walk(directory: string): AsyncGenerator<string> {
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

async function loadIndex(file: string): Promise<ApiIndex> {
  let data: ApiIndexData;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new UsageError('cannot read API index ' + file + ': ' + errorMessage(error));
  }
  if (!data.classes || Object.keys(data.classes).length < 300) {
    throw new UsageError('API index looks incomplete: ' + file);
  }
  if (data.engineVersion !== '3.6') {
    throw new UsageError('API index must describe Godot 3.6, found ' + data.engineVersion);
  }
  return new ApiIndex(data);
}

function isGodotFileName(file: string): boolean {
  const base = path.basename(file).toLowerCase();
  const extension = path.extname(file).toLowerCase();
  return base === 'project.godot' || gdExtensions.has(extension) || sceneExtensions.has(extension);
}

// Every Godot file participates in the symbol index, including files that the
// caller does not want reported. `overlay` supplies proposed contents at paths
// relative to `root` and always wins over the on-disk file.
async function collectProjectFiles(
  root: string,
  overlay: string | null,
): Promise<Map<string, GodotFileEntry>> {
  if (overlay) {
    const relativeToRoot = path.relative(root, overlay);
    const relativeOverlay = path.relative(overlay, root);
    const nested = (value: string): boolean =>
      value === '' || (!value.startsWith('..') && !path.isAbsolute(value));
    if (nested(relativeToRoot) || nested(relativeOverlay)) {
      throw new UsageError('--overlay must be a separate directory, not inside --root or around it');
    }
  }
  const found = new Map<string, GodotFileEntry>();
  const record = (relative: string, absolute: string, isOverlay: boolean): void => {
    const entry: GodotFileEntry = found.get(relative) ?? { rootFile: null, overlayFile: null };
    if (isOverlay) entry.overlayFile = absolute;
    else entry.rootFile = absolute;
    found.set(relative, entry);
  };
  for await (const file of walk(root)) {
    if (!isGodotFileName(file)) continue;
    record(normalizeRelative(path.relative(root, file).split(path.sep).join('/')), file, false);
  }
  if (overlay) {
    for await (const file of walk(overlay)) {
      if (!isGodotFileName(file)) continue;
      record(normalizeRelative(path.relative(overlay, file).split(path.sep).join('/')), file, true);
    }
  }
  return found;
}

async function runCheck({
  root,
  overlay,
  apiPath,
  files,
  mod,
  layout,
  strict,
}: RunCheckOptions): Promise<RunCheckResult> {
  const api = await loadIndex(apiPath);
  const report = createReport();
  const projectFiles = await collectProjectFiles(root, overlay);
  if (projectFiles.size === 0) throw new UsageError('no Godot 3.x files found under ' + root);
  const index = new ProjectIndex(root, api);
  const texts = new Map<string, string>();
  for (const [relative, entry] of projectFiles) {
    const source = entry.overlayFile ?? entry.rootFile;
    if (!source) continue;
    texts.set(relative, (await readFile(source, 'utf8')).replace(/\r\n/g, '\n'));
  }
  for (const [relative, text] of texts) {
    if (path.posix.basename(relative) === 'project.godot') {
      index.addProjectGodot(text);
      continue;
    }
    const extension = path.posix.extname(relative).toLowerCase();
    if (gdExtensions.has(extension)) index.addScript(relative, text);
    else if (sceneExtensions.has(extension)) index.addScene(relative);
  }
  let targets: string[];
  if (files.length) {
    targets = [];
    for (const entry of files) {
      const relative = normalizeRelative(entry);
      if (!projectFiles.has(relative)) {
        throw new UsageError('--files entry is not a Godot file under --root: ' + relative);
      }
      if (!targets.includes(relative)) targets.push(relative);
    }
  } else {
    targets = [...projectFiles.keys()]
      .filter((relative) => !unreportedDirectories.has(relative.split('/')[0] ?? relative))
      .sort();
  }
  if (targets.length === 0) throw new UsageError('no Godot 3.x files found under ' + root);
  const context: CheckContext = {
    projectClasses: new Set<string>([...index.classNames, ...index.autoloads]),
    index,
  };
  for (const file of targets) {
    const text = texts.get(file);
    if (text == null) continue;
    const extension = path.posix.extname(file).toLowerCase();
    if (path.posix.basename(file) === 'project.godot') {
      checkProjectGodotText(report, file, text, api, context.index);
    } else if (gdExtensions.has(extension)) {
      const starts = lineStarts(text);
      const mask = maskCommentsAndStrings(text);
      checkGdScript(report, file, text, mask, starts, api, context, mod, layout);
      checkMoveAndSlide(report, file, text, mask, starts);
    } else if (sceneExtensions.has(extension)) {
      checkScene(report, file, text, api, context.projectClasses, context.index);
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

function formatReport(report: Report, targets: readonly string[]): string {
  const lines: string[] = [];
  const describe = (issue: Issue, level: string): string =>
    issue.file +
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
      ? 'Static checks passed. Runtime semantics, call signatures, and non-script resources still require the Godot 3.6 parser or a headless run.'
      : 'Static checks failed. Fix every error before running the Godot 3.6 parser.',
  );
  return lines.join('\n');
}

const fixtures: readonly Fixture[] = [
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
      'Enemy.gd': 'extends Node\n',
      'Boss.gd':
        'extends "res://Enemy.gd"\n\nfunc _ready():\n\t._ready()\n\nfunc _physics_process(delta):\n\t._physics_process(delta)\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['VIRTUAL_RECALL'],
  },
  {
    name: 'object-property-access-ok',
    files: { 'Holder.gd': 'extends Node\n\nfunc _ready():\n\tset("meta", 1)\n\tprint(get("meta"))\n\tprint(get_property_list())\n' },
    expect: 'pass',
  },
  {
    name: 'virtual-property-recall',
    files: {
      'Enemy.gd': 'extends Node\n\nfunc _set(property, value):\n\tpass\n',
      'Boss.gd':
        'extends "res://Enemy.gd"\n\nfunc _set(property, value):\n\t._set(property, value)\n',
    },
    expect: 'fail',
    expectCodes: ['VIRTUAL_RECALL'],
  },
  {
    name: 'inherited-signal-target-ok',
    files: {
      'Base.gd': 'extends Node\n\nfunc _on_timer_timeout():\n\tpass\n',
      'Child.gd':
        'extends "res://Base.gd"\n\nfunc _ready():\n\tconnect("timeout", self, "_on_timer_timeout")\n',
    },
    expect: 'pass',
  },
  {
    name: 'inherited-signal-emit-ok',
    files: {
      'Base.gd': 'extends Node\n\nsignal done\n',
      'Child.gd': 'extends "res://Base.gd"\n\nfunc finish():\n\temit_signal("done")\n',
    },
    expect: 'pass',
  },
  {
    name: 'missing-extends-path',
    files: { 'Orphan.gd': 'extends "res://Missing.gd"\n\nfunc run():\n\tpass\n' },
    expect: 'fail',
    expectCodes: ['MISSING_EXTENDS_PATH'],
  },
  {
    name: 'missing-preload-path',
    files: { 'Loader.gd': 'extends Node\n\nconst Missing = preload("res://Missing.gd")\n' },
    expect: 'fail',
    expectCodes: ['MISSING_PRELOAD_PATH'],
  },
  {
    name: 'commented-paths-ok',
    files: {
      'Note.gd':
        'extends Node\n\n# extends "res://Gone.gd" and preload("res://Gone.gd")\nvar note = \'preload("res://Gone.gd")\'\n\nfunc _ready():\n\tprint(note)\n',
    },
    expect: 'pass',
  },
  {
    // A leading comment must not shift the mask, or every later pattern that
    // slices the original text at a mask index resolves one character early.
    name: 'comment-shift-keeps-connect-check',
    files: {
      'Shifty.gd':
        '# leading comment\nextends Node\n\nfunc _ready():\n\tconnect("timeout", self, "missing_handler")\n',
    },
    expect: 'fail',
    expectCodes: ['UNKNOWN_SIGNAL_TARGET'],
  },
  {
    name: 'inner-class-duplicate-ok',
    files: {
      'Outer.gd':
        'extends Node\n\nclass Left:\n\tfunc run():\n\t\tpass\n\nclass Right:\n\tfunc run():\n\t\tpass\n\nfunc run():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'overlay-base-script',
    files: { 'Child.gd': 'extends "res://Base.gd"\n\nfunc _ready():\n\tconnect("timeout", self, "_on_timeout")\n' },
    overlay: { 'Base.gd': 'extends Node\n\nfunc _on_timeout():\n\tpass\n' },
    expect: 'pass',
  },
  {
    name: 'overlay-overrides-disk',
    files: {
      'Child.gd': 'extends "res://Base.gd"\n\nfunc _ready():\n\tconnect("timeout", self, "_on_timeout")\n',
      'Base.gd': 'extends Node\n',
    },
    overlay: { 'Base.gd': 'extends Node\n\nfunc _on_timeout():\n\tpass\n' },
    expect: 'pass',
  },
  {
    name: 'files-filter-reports-targets-only',
    files: {
      'Clean.gd': 'extends Node\n\nfunc _ready():\n\tprint("ok")\n',
      'Bad.gd': 'extends Node3D\n\nfunc _ready():\n\tvar scene = preload("res://E.tscn").instantiate()\n\tprint(scene)\n',
    },
    files_filter: ['Clean.gd'],
    expect: 'pass',
    absentFromReport: ['Bad.gd'],
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
    name: 'scene-custom-class-ok',
    files: {
      'Turret3D.gd': 'extends Spatial\n\nclass_name Turret3D\n',
      'Level.tscn':
        '[gd_scene load_steps=2 format=2]\n\n[ext_resource path="res://Turret3D.gd" type="Script" id=1]\n\n[node name="Turret" type="Turret3D"]\nscript = ExtResource( 1 )\n',
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
      'Game.gd': 'extends Node\n',
    },
    expect: 'pass',
  },
  {
    name: 'missing-autoload-path',
    files: {
      'project.godot': [
        'config_version=4',
        '',
        '[autoload]',
        '',
        'Game="*res://Gone.gd"',
        '',
      ].join('\n'),
    },
    expect: 'fail',
    expectCodes: ['MISSING_AUTOLOAD_PATH'],
  },
  {
    name: 'missing-autoload-scene',
    files: {
      'project.godot': [
        'config_version=4',
        '',
        '[autoload]',
        '',
        'Hud="*res://Gone.tscn"',
        '',
      ].join('\n'),
    },
    expect: 'fail',
    expectCodes: ['MISSING_AUTOLOAD_PATH'],
  },
  {
    name: 'autoload-scene-ok',
    files: {
      'project.godot': [
        'config_version=4',
        '',
        '[autoload]',
        '',
        'Hud="*res://Hud.tscn"',
        '',
      ].join('\n'),
      'Hud.tscn': '[gd_scene format=2]\n\n[node name="Hud" type="CanvasLayer"]\n',
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
  {
    name: 'triple-quoted-ok',
    files: {
      // Shader code and documentation strings often mention 4.x identifiers.
      'Shader.gd':
        'extends Node\n\nvar shader = """\nshader_type canvas_item;\nvoid fragment() {\n\tawait something;\n}\n"""\n\nvar note = \'\'\'\nNode3D and CharacterBody2D and instantiate() are 4.x\n\'\'\'\n\nfunc _ready():\n\tprint(shader + note)\n',
    },
    expect: 'pass',
  },
  {
    name: 'project-lerp-ok',
    files: {
      // A project-defined lerp() must not be reported as the 4.x value method.
      'Blend.gd':
        'extends Node\n\nvar mixer = null\n\nfunc lerp(a, b, t):\n\treturn a + (b - a) * t\n\nfunc run():\n\tvar v = mixer.lerp(1, 2, 0.5)\n\tprint(str(v))\n',
    },
    expect: 'pass',
  },
  {
    name: 'missing-scene-script',
    files: {
      'Main.tscn':
        '[gd_scene load_steps=2 format=2]\n\n[ext_resource path="res://Gone.gd" type="Script" id=1]\n\n[node name="Main" type="Node2D"]\n',
    },
    expect: 'fail',
    expectCodes: ['MISSING_SCENE_SCRIPT_PATH'],
  },
  {
    name: 'missing-load-path',
    files: {
      'Loader.gd': 'extends Node\n\nfunc _ready():\n\tvar scene = load("res://Gone.tscn")\n\tprint(scene)\n',
    },
    expect: 'fail',
    expectCodes: ['MISSING_LOAD_PATH'],
  },
  {
    name: 'missing-preload-scene',
    files: {
      'Loader.gd': 'extends Node\n\nconst Missing = preload("res://Gone.tscn")\n',
    },
    expect: 'fail',
    expectCodes: ['MISSING_PRELOAD_PATH'],
  },
  {
    name: 'existing-scene-load-ok',
    files: {
      'Level.tscn': '[gd_scene format=2]\n\n[node name="Level" type="Node2D"]\n',
      'Loader.gd':
        'extends Node\n\nconst Level = preload("res://Level.tscn")\n\nfunc _ready():\n\tvar other = load("res://Level.tscn")\n\tprint(Level)\n\tprint(other)\n',
    },
    expect: 'pass',
  },
  {
    name: 'commented-load-paths-ok',
    files: {
      'Note.gd':
        'extends Node\n\n# load("res://Gone.gd") and preload("res://Gone.tscn")\nvar text = \'load("res://Gone.gd")\'\n\nfunc _ready():\n\tprint(text)\n',
    },
    expect: 'pass',
  },
  {
    name: 'member-load-ok',
    files: {
      // Only the global load() is a resource lookup; object.load() is not.
      'MemberLoader.gd': 'extends Node\n\nvar loader = null\n\nfunc _ready():\n\tloader.load("res://Gone.gd")\n',
    },
    expect: 'pass',
  },
  {
    name: 'missing-resource-loader-load',
    files: {
      'ResourceLoaderLoad.gd':
        'extends Node\n\nfunc _ready():\n\tvar script = ResourceLoader.load("res://Gone.gd")\n\tprint(script)\n',
    },
    expect: 'fail',
    expectCodes: ['MISSING_LOAD_PATH'],
  },
  {
    name: 'mod-layout-clean',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\nsignal stats_changed\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_ready()\n\nfunc get_stat(stat_name):\n\treturn moresc_stat_value(stat_name)\n\nfunc on_item_added(item):\n\tmoresc_item_added(item)\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tmsc_prepare_state()\n\tmsc_connect_signals()\n\nfunc moresc_stat_value(stat_name):\n\treturn msc_compute_base(stat_name) + msc_bonus_for(stat_name)\n\nfunc moresc_item_added(item):\n\tmsc_recount(item)\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc msc_prepare_state():\n\tpass\n\nfunc msc_compute_base(stat_name):\n\treturn 0\n\nfunc msc_bonus_for(stat_name):\n\treturn 0\n\nfunc msc_recount(item):\n\tpass\n\nfunc msc_connect_signals():\n\tconnect("stats_changed", self, "msc_on_stats_changed")\n\n' +
        sectionDivider('Signals') +
        '\n\nfunc msc_on_stats_changed(stats):\n\tmsc_recount(null)\n',
    },
    expect: 'pass',
  },
  {
    name: 'mod-layout-native-base-name',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends "res://Base.gd"\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc UpdateHud():\n\tmoresc_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n',
      'Base.gd': 'extends Node\n\nfunc UpdateHud():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'mod-layout-order',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\nfunc moresc_ready():\n\tpass\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_FUNCTION_ORDER', 'MOD_SECTION_MISSING'],
  },
  {
    name: 'mod-layout-name',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_CalcStat()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_CalcStat():\n\tpass\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc msc__hidden():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_FUNCTION_NAME'],
  },
  {
    name: 'mod-layout-marker-invalid',
    files: {
      'Stats.gd': '# azskills-mod:\nextends Node\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_MARKER_INVALID'],
  },
  {
    name: 'mod-layout-flag',
    files: {
      'Stats.gd':
        'extends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc msc_helper():\n\tpass\n',
    },
    mod: 'MoreStatsContainer',
    expect: 'pass',
  },
  {
    name: 'mod-layout-explicit-prefixes',
    files: {
      'Quality.gd':
        '# azskills-mod: QualityOfLife qolx ql\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tqolx_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc qolx_ready():\n\tql_apply()\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc ql_apply():\n\tpass\n\n' +
        sectionDivider('Signals') +
        '\n\nfunc ql_on_ready():\n\tql_apply()\n',
    },
    expect: 'pass',
  },
  {
    name: 'unmarked-layout-skipped',
    files: {
      'Hud.gd':
        'extends Node\n\nfunc moresc_ready():\n\tpass\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'mod-layout-section-missing',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\nfunc _ready():\n\tmoresc_ready()\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_SECTION_MISSING'],
  },
  {
    name: 'mod-layout-section-placement',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tpass\n\nfunc msc_helper():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_SECTION_PLACEMENT'],
  },
  {
    name: 'mod-layout-section-order',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc msc_helper():\n\tpass\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_SECTION_ORDER'],
  },
  {
    name: 'mod-layout-section-format',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_ready()\n\n# ' +
        '\u2550'.repeat(41) +
        ' Custom ' +
        '\u2550'.repeat(42) +
        ' #\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_SECTION_FORMAT'],
  },
  {
    name: 'mod-layout-declarations-above',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\nvar cache = {}\n\n' +
        '# ' +
        '\u2550'.repeat(42) +
        ' Variables ' +
        '\u2550'.repeat(42) +
        ' #\n\nvar bonus = 0\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'mod-layout-indented-banner-ignored',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\t# ' +
        '\u2550'.repeat(2) +
        ' local note ' +
        '\u2550'.repeat(2) +
        ' #\n\tmoresc_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'script-layout-pass',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\nsignal refreshed\n\nvar cache = {}\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tconnect("refreshed", self, "_on_refreshed")\n\trefresh()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc refresh():\n\tcache.clear()\n\temit_signal("refreshed")\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc set_cache(key, value):\n\tcache[key] = value\n\n' +
        sectionDivider('Signals') +
        '\n\nfunc _on_refreshed():\n\trefresh()\n',
    },
    expect: 'pass',
  },
  {
    name: 'script-layout-flag-pass',
    files: {
      'Hud.gd':
        'extends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\trefresh()\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc refresh():\n\tpass\n',
    },
    layout: true,
    expect: 'pass',
  },
  {
    name: 'script-layout-marker-free-skipped',
    files: {
      'Hud.gd': 'extends Node\n\nfunc _ready():\n\tpass\n\nfunc refresh():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'script-layout-missing',
    files: {
      'Hud.gd': '# azskills-layout\nextends Node\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_SECTION_MISSING'],
  },
  {
    name: 'script-layout-unsectioned',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\nfunc _ready():\n\tpass\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc refresh():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_FUNCTION_UNSECTIONED'],
  },
  {
    name: 'script-layout-virtual-misplaced',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_SECTION_PLACEMENT'],
  },
  {
    name: 'script-layout-signal-misplaced',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\nsignal done\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tconnect("done", self, "_on_done")\n\n' +
        sectionDivider('Methods') +
        '\n\nfunc _on_done():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_SECTION_PLACEMENT'],
  },
  {
    name: 'script-layout-format',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tpass\n\n# ' +
        '\u2550'.repeat(41) +
        ' Methods ' +
        '\u2550'.repeat(42) +
        ' #\n\nfunc refresh():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_SECTION_FORMAT'],
  },
  {
    name: 'mod-layout-setter-under-setters',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\nvar bonus setget msc_set_bonus\n\n' +
        sectionDivider('Setters') +
        '\n\nfunc msc_set_bonus(value):\n\tbonus = value\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tmoresc_ready()\n\n' +
        sectionDivider('Custom') +
        '\n\nfunc moresc_ready():\n\tpass\n',
    },
    expect: 'pass',
  },
  {
    name: 'script-layout-setter-under-setters',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\nvar bonus setget set_bonus\n\n' +
        sectionDivider('Variables') +
        '\n\nvar cache = {}\n\n' +
        sectionDivider('Setters') +
        '\n\nfunc set_bonus(value):\n\tbonus = value\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tpass\n',
    },
    layout: true,
    expect: 'pass',
  },
  {
    name: 'script-layout-topical-banner-above',
    files: {
      'Hud.gd':
        '# azskills-layout\nextends Node\n\n' +
        sectionDivider('Setup') +
        '\n\nfunc refresh():\n\tpass\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['SCRIPT_FUNCTION_UNSECTIONED'],
  },
  {
    name: 'mod-layout-topical-banner-above',
    files: {
      'Stats.gd':
        '# azskills-mod: MoreStatsContainer\nextends Node\n\n' +
        sectionDivider('Setup') +
        '\n\nfunc moresc_ready():\n\tpass\n\n' +
        sectionDivider('Extensions') +
        '\n\nfunc _ready():\n\tpass\n',
    },
    expect: 'fail',
    expectCodes: ['MOD_SECTION_PLACEMENT'],
  },
];

async function selfTest(): Promise<void> {
  const { mkdtemp, rm, writeFile, mkdir } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const staging = await mkdtemp(path.join(tmpdir(), 'azskills-godot-selftest-'));
  const failures: string[] = [];
  try {
    for (const fixture of fixtures) {
      const root = path.join(staging, fixture.name);
      for (const [name, body] of Object.entries(fixture.files)) {
        const target = path.join(root, name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, body, 'utf8');
      }
      const overlay = fixture.overlay ? path.join(staging, fixture.name + '-overlay') : null;
      if (overlay) {
        for (const [name, body] of Object.entries(fixture.overlay ?? {})) {
          const target = path.join(overlay, name);
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(target, body, 'utf8');
        }
      }
      const { report } = await runCheck({
        root,
        overlay,
        apiPath: defaultApi,
        files: fixture.files_filter ?? [],
        mod: fixture.mod ? deriveModLayout(fixture.mod) : null,
        layout: fixture.layout === true,
        strict: false,
      });
      const passed = report.errors.length === 0;
      const expected = fixture.expect === 'pass';
      if (passed === expected) {
        for (const code of fixture.expectCodes ?? []) {
          if (!report.errors.some((error) => error.code === code)) {
            failures.push(fixture.name + ': expected error code ' + code + ' but got [' + report.errors.map((error) => error.code).join(', ') + ']');
          }
        }
        for (const file of fixture.absentFromReport ?? []) {
          if ([...report.errors, ...report.warnings].some((issue) => issue.file === file)) {
            failures.push(fixture.name + ': reported ' + file + ' even though --files excluded it');
          }
        }
        continue;
      }
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: node check-godot-3x.ts --root <project> [--api <api-3.6.json>] [--overlay <dir>] [--files a.gd,b.tscn] [--mod <name>] [--layout] [--json] [--strict] [--self-test]',
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
  const overlayValue = valueOf(args, '--overlay');
  const overlay = overlayValue ? path.resolve(overlayValue) : null;
  if (overlay) {
    const overlayInfo = await stat(overlay).catch(() => null);
    if (!overlayInfo || !overlayInfo.isDirectory()) throw new UsageError('--overlay is not a directory: ' + overlay);
  }
  const fileList = valueOf(args, '--files');
  const files = fileList
    ? fileList
        .split(/[,;]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const modValue = valueOf(args, '--mod');
  const mod = modValue ? deriveModLayout(modValue) : null;
  if (modValue && !mod) {
    throw new UsageError('--mod must be a mod name such as MoreStatsContainer: ' + modValue);
  }
  const { report, targets } = await runCheck({
    root,
    overlay,
    apiPath,
    files,
    mod,
    layout: args.includes('--layout'),
    strict: args.includes('--strict'),
  });
  if (args.includes('--json')) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: report.errors.length === 0,
          checked: targets,
          errors: report.errors,
          warnings: report.warnings,
          verified: report.verified,
          limitations:
            'Static API and syntax checks with project-wide script context. Runtime semantics, call signatures, dynamic access, and non-script resource validity require the Godot 3.6 parser or a headless run.',
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    process.stdout.write(formatReport(report, targets) + '\n');
  }
  process.exitCode = report.errors.length === 0 ? 0 : 1;
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(message);
  process.exitCode = 2;
});
