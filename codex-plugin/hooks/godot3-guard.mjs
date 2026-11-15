#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const pluginRoot = process.env.PLUGIN_ROOT;
if (!pluginRoot) throw new Error('PLUGIN_ROOT is required');

const godotExtensions = new Set(['.gd', '.tscn', '.escn']);
const virtualRecalls = 'ready|enter_tree|exit_tree|process|physics_process|fixed_process|input|unhandled_input|unhandled_key_input|notification|draw|gui_input|input_event|integrate_forces|set|get|get_property_list';
const fourXPatterns = [
  { pattern: /(^|[^\w.])@(?:onready|export[a-z_]*|tool|icon|rpc)\b/, code: 'GODOT4_ANNOTATION', message: 'Godot 4.x annotation' },
  { pattern: /(^|[^\w.])await\b/, code: 'GODOT4_AWAIT', message: 'Godot 4.x await' },
  { pattern: /(^|[^\w])(?:Callable|StringName|FileAccess|DirAccess|DisplayServer|Node3D|CharacterBody2D|CharacterBody3D)\b/, code: 'GODOT4_SYMBOL', message: 'Godot 4.x symbol' },
  { pattern: /\b(?:Packed(?:String|Byte|Int32|Int64|Float32|Float64|Vector2|Vector3|Vector4|Color|Basis|Quaternion|Transform2D|Transform3D)Array)\b/, code: 'GODOT4_PACKED_ARRAY', message: 'Godot 4.x packed array type' },
  { pattern: /\b(?:instantiate|change_scene_to_file|change_scene_to_packed|queue_redraw)\s*\(/, code: 'GODOT4_METHOD', message: 'Godot 4.x method' },
  { pattern: /(^|[^\w.])(?:randf_range|randi_range|snappedf|snappedi|print_rich|type_convert)\s*\(/, code: 'GODOT4_GLOBAL', message: 'Godot 4.x global function' },
  { pattern: /\bArray\s*\[[^\]]+\]|\bDictionary\s*\[/, code: 'GODOT4_TYPED_COLLECTION', message: 'Godot 4.x typed collection' },
  { pattern: /(^|[^\w.@])super\s*[.(]/, code: 'GODOT4_SUPER', message: 'Godot 4.x super call' },
  { pattern: /\.\s*emit\s*\(/, code: 'GODOT4_SIGNAL_EMIT', message: 'Godot 4.x signal emit' },
  { pattern: /\bconnect\s*\(\s*self\./, code: 'GODOT4_CONNECT', message: 'Godot 4.x Callable connection' },
];

const fourXSceneTypes = new Set([
  'Node3D', 'CharacterBody2D', 'CharacterBody3D', 'MeshInstance3D', 'Camera3D',
  'RigidBody3D', 'StaticBody3D', 'Area3D', 'RayCast3D', 'CollisionShape3D',
  'CollisionPolygon3D', 'Marker3D', 'Light3D', 'OmniLight3D', 'SpotLight3D',
  'DirectionalLight3D', 'StandardMaterial3D', 'AnimationPlayer3D',
]);

// The engine calls every script level of these callbacks already.
const virtualRecallPattern = new RegExp('\\.\\s*_(' + virtualRecalls + ')\\s*\\(');

function isGodotPath(file) {
  const base = path.basename(file).toLowerCase();
  return base === 'project.godot' || godotExtensions.has(path.extname(file).toLowerCase());
}

// Comments and string literals must not trip a hard deny.
function maskCommentsAndStrings(text) {
  let output = '';
  let state = 'code';
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (state === 'code') {
      if (char === '#') state = 'comment';
      else if (char === '"' || char === "'") state = char === '"' ? 'double' : 'single';
      output += state === 'code' || char === '\n' ? char : ' ';
      continue;
    }
    if (state === 'comment') {
      if (char === '\n') { state = 'code'; output += char; }
      else output += ' ';
      continue;
    }
    if (char === '\\') { output += '  '; index += 1; continue; }
    if ((state === 'double' && char === '"') || (state === 'single' && char === "'")) { state = 'code'; output += char; continue; }
    output += char === '\n' ? '\n' : ' ';
  }
  return output;
}

function parseInput() {
  let raw = '';
  return (async () => {
    for await (const chunk of process.stdin) raw += chunk;
    if (!raw.trim()) return {};
    // Malformed input must never block unrelated edits; only parsed Godot
    // content is allowed to deny a write.
    try { return JSON.parse(raw); } catch { return {}; }
  })();
}

function patchFiles(patch) {
  const files = new Map();
  let current = null;
  for (const line of String(patch ?? '').split(/\r?\n/)) {
    const section = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/.exec(line);
    if (section) {
      current = section[1].trim();
      if (!files.has(current)) files.set(current, []);
      continue;
    }
    if (current && line.startsWith('+') && !line.startsWith('+++')) files.get(current).push(line.slice(1));
  }
  return files;
}

function changedFiles(event) {
  const input = event.tool_input ?? {};
  if (event.tool_name === 'apply_patch') return patchFiles(input.patch);
  const file = input.file_path ?? input.path;
  if (!file) return new Map();
  const content = input.content ?? input.new_string;
  return new Map([[String(file), content == null ? [] : String(content).split(/\r?\n/)]])
}

function violations(files) {
  const found = [];
  for (const [file, lines] of files) {
    if (!isGodotPath(file)) continue;
    const text = lines.join('\n');
    if (path.basename(file).toLowerCase() === 'project.godot' && /(^|\n)\s*config_version\s*=\s*5\b/.test(text)) {
      found.push({ file, code: 'GODOT4_PROJECT', message: 'config_version=5 is a Godot 4.x project' });
    }
    if (godotExtensions.has(path.extname(file).toLowerCase())) {
      if (/\[gd_scene\b[^\]]*\bformat\s*=\s*3\b/.test(text)) found.push({ file, code: 'WRONG_SCENE_FORMAT', message: 'scene format=3 is not Godot 3.x' });
      for (const match of text.matchAll(/\[node\b[^\]]*\btype\s*=\s*"([^"]+)"[^\]]*\]/g)) {
        if (fourXSceneTypes.has(match[1])) found.push({ file, code: 'GODOT4_SCENE_TYPE', message: 'scene node type ' + match[1] + ' is Godot 4.x' });
      }
      const code = maskCommentsAndStrings(text);
      if (virtualRecallPattern.test(code)) found.push({ file, code: 'VIRTUAL_RECALL', message: 'engine-dispatched virtual is re-called' });
      for (const rule of fourXPatterns) if (rule.pattern.test(code)) found.push({ file, code: rule.code, message: rule.message });
    }
  }
  return found;
}

function deny(findings) {
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: findings.map((item) => item.file + ': ' + item.code + ' - ' + item.message).join('; ') } };
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function projectRoot(file) {
  let current = path.resolve(path.dirname(file));
  while (true) {
    if (await exists(path.join(current, 'project.godot'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(path.dirname(file));
    current = parent;
  }
}

async function postCheck(event, files) {
  const existing = [];
  for (const file of files.keys()) {
    const resolved = path.resolve(file);
    if (isGodotPath(resolved) && await exists(resolved)) existing.push(resolved);
  }
  if (!existing.length) return { continue: true };
  const groups = new Map();
  for (const file of existing) {
    const root = await projectRoot(file);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(path.relative(root, file));
  }
  const messages = [];
  const checker = path.join(pluginRoot, 'godot-3-dev', 'scripts', 'check-godot-3x.mjs');
  const api = path.join(pluginRoot, 'godot-3-dev', 'references', 'api-3.6.json');
  for (const [root, relativeFiles] of groups) {
    const result = spawnSync(process.execPath, [checker, '--root', root, '--api', api, '--files', relativeFiles.join(','), '--json'], { encoding: 'utf8' });
    if (result.error) messages.push('Godot 3.x checker could not run: ' + result.error.message);
    else {
      try {
        const report = JSON.parse(result.stdout);
        const errors = report.errors ?? [];
        const warnings = report.warnings ?? [];
        messages.push('Godot 3.x static check (' + (result.status ?? 2) + '): ' + relativeFiles.join(', ') + '; errors=' + errors.length + ', warnings=' + warnings.length + (errors.length ? '; ' + errors.slice(0, 3).map((item) => item.code + ' at ' + item.file + ':' + item.line).join(', ') : ''));
      } catch { messages.push('Godot 3.x checker returned non-JSON output: ' + result.stderr.trim()); }
    }
  }
  return { continue: true, hookSpecificOutput: { hookEventName: event.hook_event_name, additionalContext: messages.join('\n') + '\nStatic checks do not prove runtime semantics; run the Godot 3.6 parser or headless project check.' } };
}

const event = await parseInput();
const files = changedFiles(event);
if (event.hook_event_name === 'PreToolUse') {
  const findings = violations(files);
  process.stdout.write(JSON.stringify(findings.length ? deny(findings) : { continue: true }));
} else if (event.hook_event_name === 'PostToolUse') {
  process.stdout.write(JSON.stringify(await postCheck(event, files)));
} else {
  process.stdout.write(JSON.stringify({ continue: true }));
}
