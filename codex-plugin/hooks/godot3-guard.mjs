#!/usr/bin/env node
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {
  findLexicalViolations,
  findVirtualRecalls,
  fourXSceneTypes,
  maskCommentsAndStrings,
} from '../../godot-3-dev/scripts/godot3-lexical.mjs';

const pluginRoot = process.env.PLUGIN_ROOT;
if (!pluginRoot) throw new Error('PLUGIN_ROOT is required');

const godotExtensions = new Set(['.gd', '.tscn', '.escn']);
const checkerTimeoutMs = 15000;
const postCheckTimeoutMs = 30000;
const checkerMaxBuffer = 16 * 1024 * 1024;

function isGodotPath(file) {
  const base = path.basename(file).toLowerCase();
  return base === 'project.godot' || godotExtensions.has(path.extname(file).toLowerCase());
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
  const file = input.file_path ?? input.path ?? input.filePath;
  if (!file) return new Map();
  if (event.tool_name === 'MultiEdit') {
    const lines = [];
    for (const edit of Array.isArray(input.edits) ? input.edits : []) {
      if (edit && typeof edit.new_string === 'string') lines.push(...edit.new_string.split(/\r?\n/));
    }
    return new Map([[resolveToolPath(file, event), lines]]);
  }
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

function toolPath(event) {
  const input = event.tool_input ?? {};
  const file = input.file_path ?? input.path ?? input.filePath;
  return typeof file === 'string' && file.trim() ? resolveToolPath(file, event) : null;
}

async function readExisting(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

// Apply one Edit-style replacement list in order. Returns null when any step is
// ambiguous, because a guessed reconstruction would deny a legal write.
function applyEdits(current, edits) {
  let text = current;
  for (const edit of edits) {
    if (!edit || typeof edit.old_string !== 'string' || typeof edit.new_string !== 'string') return null;
    const occurrences = countOccurrences(text, edit.old_string);
    if (occurrences === 0) return null;
    if (!edit.replace_all && occurrences !== 1) return null;
    text = edit.replace_all
      ? text.split(edit.old_string).join(edit.new_string)
      : text.replace(edit.old_string, edit.new_string);
  }
  return text;
}

async function completeToolFiles(event) {
  const input = event.tool_input ?? {};
  const output = new Map();
  const resolved = toolPath(event);
  if (!resolved) return output;
  if ((event.tool_name === 'Write' || event.tool_name === 'Edit') && typeof input.content === 'string') {
    output.set(resolved, input.content);
    return output;
  }
  if (event.tool_name !== 'Edit' && event.tool_name !== 'MultiEdit') return output;
  const current = await readExisting(resolved);
  if (current == null) return output;
  const edits = event.tool_name === 'MultiEdit'
    ? (Array.isArray(input.edits) ? input.edits : [])
    : [input];
  if (!edits.length) return output;
  const next = applyEdits(current, edits);
  if (next != null) output.set(resolved, next);
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
      hunk = { header: parseHunkHeader(line), old: [], next: [] };
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
  let delta = 0;
  for (const item of hunks) {
    if (!item.old.length) {
      // A pure insertion has no context to search for. Trust recorded old line
      // numbers only; a bare `@@` or section-only header is ambiguous, so the
      // hook falls back to the lexical guard instead of guessing a position.
      const header = item.header;
      if (!header || header.oldStart == null) return null;
      const at = (header.oldCount === 0 ? header.oldStart : header.oldStart - 1) + delta;
      if (at < 0 || at > sourceLines.length) return null;
      sourceLines.splice(at, 0, ...item.next);
      delta += item.next.length;
      continue;
    }
    let matchAt = -1;
    let matches = 0;
    for (let index = 0; index <= sourceLines.length - item.old.length; index += 1) {
      if (item.old.every((line, offset) => sourceLines[index + offset] === line)) {
        if (matchAt < 0) matchAt = index;
        matches += 1;
      }
    }
    if (matches === 0) return null;
    if (matches > 1) {
      // Repeated context is only safe when the hunk header records old line
      // numbers. Section-only headers (`@@ func _ready():`) stay ambiguous and
      // fall back to the lexical guard.
      const header = item.header;
      if (!header || header.oldStart == null) return null;
      const anchored = header.oldStart - 1 + delta;
      if (anchored < 0 || anchored > sourceLines.length - item.old.length) return null;
      if (!item.old.every((line, offset) => sourceLines[anchored + offset] === line)) return null;
      matchAt = anchored;
    }
    sourceLines.splice(matchAt, item.old.length, ...item.next);
    delta += item.next.length - item.old.length;
  }
  return sourceLines.join('\n');
}

function parseHunkHeader(line) {
  const match = /^@@(?:\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?)?\s*@@/.exec(line);
  if (!match || !match[1]) return null;
  return {
    oldStart: Number(match[1]),
    oldCount: match[2] === undefined ? 1 : Number(match[2]),
    newStart: Number(match[3]),
    newCount: match[4] === undefined ? 1 : Number(match[4]),
  };
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
    const extension = path.extname(file).toLowerCase();
    if (path.basename(file).toLowerCase() === 'project.godot') {
      found.push(...projectManifestViolations(file, text));
      continue;
    }
    if (!godotExtensions.has(extension)) continue;
    // Scene files and scripts are parsed differently: a GDScript string that
    // contains "[gd_scene" must not turn a script into a scene.
    if (extension === '.tscn' || extension === '.escn') {
      if (/\[gd_scene\b[^\]]*\bformat\s*=\s*3\b/.test(text)) {
        found.push({ file, code: 'WRONG_SCENE_FORMAT', message: 'scene format=3 is not Godot 3.x' });
      }
      for (const match of text.matchAll(/\[node\b[^\]]*\btype\s*=\s*"([^"]+)"[^\]]*\]/g)) {
        if (fourXSceneTypes.has(match[1])) {
          found.push({ file, code: 'GODOT4_SCENE_TYPE', message: 'scene node type ' + match[1] + ' is Godot 4.x' });
        }
      }
      continue;
    }
    const mask = maskCommentsAndStrings(text);
    for (const match of findVirtualRecalls(mask)) {
      found.push({ file, code: 'VIRTUAL_RECALL', message: 'engine-dispatched virtual ._' + match.name + '() is re-called' });
    }
    for (const issue of findLexicalViolations(mask)) {
      found.push({ file, code: issue.code, message: issue.message + ': ' + issue.text });
    }
  }
  return found;
}

function projectManifestViolations(file, text) {
  if (!/(^|\n)\s*config_version\s*=\s*5\b/.test(maskCommentsAndStrings(text))) return [];
  return [{ file, code: 'GODOT4_PROJECT', message: 'config_version=5 is a Godot 4.x project' }];
}

// The manifest check must survive an ambiguous patch or a broken checker: in a
// Godot 4.x project even a clean-looking 3.x script write is wrong. The write
// itself is excluded so fixing project.godot from 5 to 4 stays possible.
async function manifestViolations(files) {
  const found = [];
  const seen = new Set();
  for (const file of files.keys()) {
    if (!isGodotPath(file) || path.basename(file).toLowerCase() === 'project.godot') continue;
    const root = await projectRoot(file);
    if (seen.has(root)) continue;
    seen.add(root);
    const text = await readExisting(path.join(root, 'project.godot'));
    if (text != null) found.push(...projectManifestViolations(path.join(root, 'project.godot'), text));
  }
  return found;
}

function deny(findings) {
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: findings.map((item) => item.file + ': ' + item.code + ' - ' + item.message).join('; ') } };
}

const checkerScript = () => path.join(pluginRoot, 'godot-3-dev', 'scripts', 'check-godot-3x.mjs');
const apiScript = () => path.join(pluginRoot, 'godot-3-dev', 'references', 'api-3.6.json');

// Run the full checker with the project on disk as `--root` and the proposed
// contents as `--overlay`, so inheritance, signals, and res:// targets resolve
// project-wide without copying the project into a temporary directory.
function runChecker({ root, overlay, files, timeout }) {
  const args = [checkerScript(), '--root', root, '--api', apiScript(), '--json'];
  if (overlay) args.push('--overlay', overlay);
  if (files.length) args.push('--files', files.join(','));
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: checkerMaxBuffer,
  });
  if (result.error || result.status === 2) {
    return { unavailable: result.error?.message ?? (result.stderr || 'exit code 2').trim() };
  }
  try {
    return { report: JSON.parse(result.stdout) };
  } catch {
    return { unavailable: 'checker returned non-JSON output: ' + String(result.stdout ?? '').slice(0, 200) };
  }
}

async function preCheck(proposed) {
  const godotFiles = [...proposed.entries()].filter(([file]) => isGodotPath(file));
  if (!godotFiles.length) return { findings: [], notes: [] };
  const groups = new Map();
  for (const [file, content] of godotFiles) {
    const root = await projectRoot(file);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push({ file, content });
  }
  const findings = [];
  const notes = [];
  for (const [root, entries] of groups) {
    let staging = null;
    try {
      staging = await mkdtemp(path.join(tmpdir(), 'azskills-godot-precheck-'));
      const targets = [];
      for (const entry of entries) {
        const relative = relativeToRoot(root, entry.file);
        if (!relative) continue;
        const staged = path.join(staging, ...relative.split('/'));
        await mkdir(path.dirname(staged), { recursive: true });
        await writeFile(staged, entry.content, 'utf8');
        if (!targets.includes(relative)) targets.push(relative);
      }
      await includeProjectManifest(root, targets);
      if (!targets.length) continue;
      const { report, unavailable } = runChecker({ root, overlay: staging, files: targets, timeout: checkerTimeoutMs });
      if (unavailable) {
        // Never deny solely because the checker is unavailable: a broken
        // checker must not block every Godot write. The lexical guard already
        // ran and the note asks the agent to verify manually.
        notes.push('Full Godot 3.x checker unavailable for ' + targets.join(', ') + ': ' + unavailable + '. Only lexical checks ran; run the checker manually.');
        continue;
      }
      for (const issue of report.errors ?? []) {
        findings.push({
          file: path.resolve(root, ...issue.file.split('/')),
          code: issue.code,
          message: 'full checker at ' + issue.line + ':' + issue.column + ': ' + issue.message,
        });
      }
    } catch (error) {
      notes.push('Full Godot 3.x checker could not stage ' + entries[0].file + ': ' + (error instanceof Error ? error.message : String(error)) + '. Only lexical checks ran.');
    } finally {
      if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {});
    }
  }
  return { findings, notes };
}

// Project-relative POSIX path, or null when the file is outside the project.
function relativeToRoot(root, file) {
  const relative = path.relative(root, path.resolve(file));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return relative.split(path.sep).join('/');
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

// A Godot 4.x project must not receive "clean" 3.x scripts, and a project
// without `config_version` cannot be proven to be 3.x. Both facts live in
// project.godot, so it always joins the reported targets when it exists.
async function includeProjectManifest(root, relativeFiles) {
  if (relativeFiles.includes('project.godot')) return;
  if (await exists(path.join(root, 'project.godot'))) relativeFiles.push('project.godot');
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
    const relative = relativeToRoot(root, file);
    if (!relative) continue;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(relative);
  }
  for (const [root, relativeFiles] of groups) await includeProjectManifest(root, relativeFiles);
  const messages = [];
  const failures = [];
  for (const [root, relativeFiles] of groups) {
    const { report, unavailable } = runChecker({ root, files: relativeFiles, timeout: postCheckTimeoutMs });
    if (unavailable) {
      // The write already happened, so blocking on a broken checker only hides
      // the real content. Re-run the lexical rules on the written files instead.
      messages.push('Godot 3.x checker unavailable for ' + relativeFiles.join(', ') + ': ' + unavailable + '. Run it manually.');
      const fallback = new Map();
      for (const relative of relativeFiles) {
        const text = await readExisting(path.resolve(root, ...relative.split('/')));
        if (text != null) fallback.set(relative, text.split(/\r?\n/));
      }
      for (const finding of violations(fallback)) {
        failures.push(path.basename(finding.file) + ' ' + finding.code + ' - ' + finding.message);
      }
      continue;
    }
    const errors = report.errors ?? [];
    const warnings = report.warnings ?? [];
    messages.push(
      'Godot 3.x static check: ' + relativeFiles.join(', ') +
      '; errors=' + errors.length + ', warnings=' + warnings.length +
      (errors.length ? '; ' + errors.slice(0, 3).map((item) => item.code + ' at ' + item.file + ':' + item.line).join(', ') : ''),
    );
    for (const item of errors) failures.push(item.file + ':' + item.line + ':' + item.column + ' ' + item.code + ' - ' + item.message);
  }
  const limit = '\nStatic checks do not prove runtime semantics; run the Godot 3.6 parser or headless project check.';
  if (failures.length) {
    return {
      decision: 'block',
      reason: 'Godot 3.x static check found errors in the written content. Fix all of them before continuing:\n' + failures.slice(0, 10).join('\n') + limit,
    };
  }
  return { continue: true, hookSpecificOutput: { hookEventName: event.hook_event_name, additionalContext: messages.join('\n') + limit } };
}

const event = await parseInput();
const files = changedFiles(event);
if (event.hook_event_name === 'PreToolUse') {
  const lexical = violations(files);
  const findings = lexical.length ? lexical : await manifestViolations(files);
  if (findings.length) {
    process.stdout.write(JSON.stringify(deny(findings)));
  } else {
    const proposed = await reconstructableFiles(event);
    const checked = await preCheck(proposed);
    const notes = checked.notes;
    const skipped = [...files.keys()].filter((file) => isGodotPath(file) && !proposed.has(file));
    if (skipped.length) {
      notes.push('Could not reconstruct the final content of ' + skipped.map((file) => path.basename(file)).join(', ') + '; only lexical checks ran. Re-run the checker after the write.');
    }
    if (checked.findings.length) process.stdout.write(JSON.stringify(deny(checked.findings)));
    else if (notes.length) {
      process.stdout.write(JSON.stringify({
        continue: true,
        hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: notes.join('\n') },
      }));
    } else process.stdout.write(JSON.stringify({ continue: true }));
  }
} else if (event.hook_event_name === 'PostToolUse') {
  process.stdout.write(JSON.stringify(await postCheck(event, files)));
} else {
  process.stdout.write(JSON.stringify({ continue: true }));
}
