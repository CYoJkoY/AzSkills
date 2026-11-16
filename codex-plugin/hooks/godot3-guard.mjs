#!/usr/bin/env node
import { access, copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
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
      if (char === '\n') { state = 'code'; output += char; }
      else output += ' ';
      continue;
    }
    if (char === '\\') { output += '  '; index += 1; continue; }
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

function patchFiles(patch, event) {
  const files = new Map();
  let current = null;
  for (const line of String(patch ?? '').split(/\r?\n/)) {
    const section = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/.exec(line);
    if (section) {
      current = resolveToolPath(section[1].trim(), event);
      if (!files.has(current)) files.set(current, []);
      continue;
    }
    if (current && line.startsWith('+')) files.get(current).push(line.slice(1));
  }
  return files;
}

function changedFiles(event) {
  const input = event.tool_input ?? {};
  if (event.tool_name === 'apply_patch') return patchFiles(input.patch, event);
  const file = input.file_path ?? input.path;
  if (!file) return new Map();
  const content = input.content ?? input.new_string;
  return new Map([[resolveToolPath(file, event), content == null ? [] : String(content).split(/\r?\n/)]])
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (true) {
    const found = text.indexOf(needle, offset);
    if (found < 0) return count;
    count += 1;
    offset = found + needle.length;
  }
}

function resolveToolPath(file, event) {
  const value = String(file);
  return path.resolve(event.cwd ? String(event.cwd) : process.cwd(), value);
}

async function readExisting(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function completeToolFiles(event) {
  const input = event.tool_input ?? {};
  const output = new Map();
  const file = input.file_path ?? input.path;
  if (event.tool_name === 'Write' && file && typeof input.content === 'string') {
    output.set(resolveToolPath(file, event), input.content);
    return output;
  }
  if (event.tool_name !== 'Edit' || !file) return output;
  const resolved = resolveToolPath(file, event);
  if (typeof input.content === 'string') {
    output.set(resolved, input.content);
    return output;
  }
  if (typeof input.new_string !== 'string' || typeof input.old_string !== 'string') return output;
  const current = await readExisting(resolved);
  if (current == null) return output;
  const occurrences = countOccurrences(current, input.old_string);
  if (occurrences === 0 || (!input.replace_all && occurrences !== 1)) return output;
  const next = input.replace_all
    ? current.split(input.old_string).join(input.new_string)
    : current.replace(input.old_string, input.new_string);
  output.set(resolved, next);
  return output;
}

function parsePatchSections(patch) {
  const sections = [];
  let current = null;
  for (const line of String(patch ?? '').split(/\r?\n/)) {
    const section = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line);
    if (section) {
      current = { action: section[1], file: section[2].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return sections;
}

function applyPatchHunks(source, lines) {
  const sourceLines = source.replace(/\r\n/g, '\n').split('\n');
  const hunks = [];
  let hunk = null;
  for (const line of lines) {
    if (line.startsWith('@@')) {
      hunk = { old: [], next: [] };
      hunks.push(hunk);
      continue;
    }
    if (!hunk || line === '\\ No newline at end of file') continue;
    if (line.startsWith(' ')) {
      hunk.old.push(line.slice(1));
      hunk.next.push(line.slice(1));
    } else if (line.startsWith('-')) {
      hunk.old.push(line.slice(1));
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      hunk.next.push(line.slice(1));
    }
  }
  if (!hunks.length) return null;
  let cursor = 0;
  for (const item of hunks) {
    if (!item.old.length) return null;
    let matchAt = -1;
    let matches = 0;
    for (let index = cursor; index <= sourceLines.length - item.old.length; index += 1) {
      if (item.old.every((line, offset) => sourceLines[index + offset] === line)) {
        if (matchAt < 0) matchAt = index;
        matches += 1;
      }
    }
    if (matches !== 1) return null;
    sourceLines.splice(matchAt, item.old.length, ...item.next);
    cursor = matchAt + item.next.length;
  }
  return sourceLines.join('\n');
}

async function completePatchFiles(event) {
  if (event.tool_name !== 'apply_patch') return new Map();
  const output = new Map();
  for (const section of parsePatchSections(event.tool_input?.patch)) {
    const resolved = resolveToolPath(section.file, event);
    if (section.action === 'Delete') continue;
    if (section.action === 'Add') {
      const added = section.lines
        .filter((line) => line.startsWith('+'))
        .map((line) => line.slice(1));
      if (added.length || section.lines.some((line) => line === '')) output.set(resolved, added.join('\n'));
      continue;
    }
    const current = await readExisting(resolved);
    if (current == null) continue;
    const next = applyPatchHunks(current, section.lines);
    if (next != null) output.set(resolved, next);
  }
  return output;
}

async function reconstructableFiles(event) {
  const complete = await completeToolFiles(event);
  const patchFiles = await completePatchFiles(event);
  for (const [file, content] of patchFiles) complete.set(file, content);
  return complete;
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

async function preCheck(event) {
  const proposed = await reconstructableFiles(event);
  const godotFiles = [...proposed.entries()].filter(([file]) => isGodotPath(file));
  if (!godotFiles.length) return [];
  const groups = new Map();
  for (const [file, content] of godotFiles) {
    const root = await projectRoot(file);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push({ file, content });
  }
  const findings = [];
  const checker = path.join(pluginRoot, 'godot-3-dev', 'scripts', 'check-godot-3x.mjs');
  const api = path.join(pluginRoot, 'godot-3-dev', 'references', 'api-3.6.json');
  for (const [root, entries] of groups) {
    let staging = null;
    try {
      staging = await mkdtemp(path.join(tmpdir(), 'azskills-godot-precheck-'));
      const targets = [];
      const projectFile = path.join(root, 'project.godot');
      if (await exists(projectFile) && !entries.some((entry) => path.resolve(entry.file) === path.resolve(projectFile))) {
        await copyFile(projectFile, path.join(staging, 'project.godot'));
        targets.push('project.godot');
      }
      for (const entry of entries) {
        const relative = path.relative(root, entry.file);
        if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) continue;
        const staged = path.join(staging, relative);
        await mkdir(path.dirname(staged), { recursive: true });
        await writeFile(staged, entry.content, 'utf8');
        targets.push(relative.split(path.sep).join('/'));
      }
      if (!targets.length) continue;
      const originalByStaged = new Map(
        entries.map((entry) => [path.resolve(staging, path.relative(root, entry.file)), entry.file]),
      );
      const result = spawnSync(process.execPath, [checker, '--root', staging, '--api', api, '--files', targets.join(','), '--json'], {
        encoding: 'utf8',
        timeout: 10000,
      });
      if (result.error || result.status === 2) {
        findings.push({ file: entries[0].file, code: 'GODOT_CHECK_UNAVAILABLE', message: 'Godot 3.x checker could not validate the complete proposed content' });
        continue;
      }
      let report;
      try {
        report = JSON.parse(result.stdout);
      } catch {
        findings.push({ file: entries[0].file, code: 'GODOT_CHECK_INVALID_OUTPUT', message: 'Godot 3.x checker returned invalid output' });
        continue;
      }
      for (const issue of report.errors ?? []) {
        findings.push({
          file: originalByStaged.get(path.resolve(issue.file)) ?? entries[0].file,
          code: issue.code,
          message: 'full checker at ' + issue.line + ':' + issue.column + ': ' + issue.message,
        });
      }
    } catch (error) {
      findings.push({
        file: entries[0].file,
        code: 'GODOT_CHECK_UNAVAILABLE',
        message: 'Godot 3.x checker could not validate the complete proposed content: ' + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {});
    }
  }
  return findings;
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
  const failures = [];
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
        for (const item of errors) failures.push(item.file + ':' + item.line + ':' + item.column + ' ' + item.code + ' - ' + item.message);
      } catch { messages.push('Godot 3.x checker returned non-JSON output: ' + result.stderr.trim()); }
    }
  }
  if (failures.length) {
    return {
      decision: 'block',
      reason: 'Godot 3.x static check found errors in the written content. Fix all of them before continuing:\n' + failures.slice(0, 10).join('\n') + '\nStatic checks do not prove runtime semantics; run the Godot 3.6 parser or headless project check.',
    };
  }
  return { continue: true, hookSpecificOutput: { hookEventName: event.hook_event_name, additionalContext: messages.join('\n') + '\nStatic checks do not prove runtime semantics; run the Godot 3.6 parser or headless project check.' } };
}

const event = await parseInput();
const files = changedFiles(event);
if (event.hook_event_name === 'PreToolUse') {
  const findings = [...violations(files), ...(await preCheck(event))];
  process.stdout.write(JSON.stringify(findings.length ? deny(findings) : { continue: true }));
} else if (event.hook_event_name === 'PostToolUse') {
  process.stdout.write(JSON.stringify(await postCheck(event, files)));
} else {
  process.stdout.write(JSON.stringify({ continue: true }));
}
