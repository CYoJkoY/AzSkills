#!/usr/bin/env node
/*
 * Regenerate godot-3-dev/references/api-3.6.json from the official Godot 3.6
 * class reference. Dependency-free; requires network access.
 *
 * Source: https://github.com/godotengine/godot/tree/3.6-stable/doc/classes
 *
 * Usage:
 *   node godot-3-dev/scripts/build-api-index.ts [--ref 3.6-stable] [--out <file>]
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const defaultOut = path.join(root, 'godot-3-dev', 'references', 'api-3.6.json');
const ref = valueOf('--ref') ?? '3.6-stable';
const out = path.resolve(valueOf('--out') ?? defaultOut);

interface ClassEntry {
  inherits: string | null;
  methods: string[];
  properties: string[];
  signals: string[];
  constants: string[];
  vararg?: string[];
  virtual?: string[];
  source?: string;
}

interface ParsedClass {
  name: string | undefined;
  version: string | null;
  entry: ClassEntry;
}

function valueOf(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(flag + ' requires a value');
  return value;
}

function decode(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([A-Za-z_][\w:-]*)\s*=\s*"([^"]*)"/g)) {
    const key = match[1];
    const value = match[2];
    if (key !== undefined && value !== undefined) result[key] = decode(value);
  }
  return result;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function parseClass(xml: string): ParsedClass {
  const classTag = /<class\b([^>]*)>/.exec(xml);
  if (!classTag) throw new Error('missing <class> element');
  const head = attributes(classTag[1] ?? '');
  const methods: string[] = [];
  const virtuals: string[] = [];
  const vararg: string[] = [];
  for (const match of xml.matchAll(/<method\b([^>]*)>([\s\S]*?)<\/method>/g)) {
    const meta = attributes(match[1] ?? '');
    if (!meta.name) continue;
    methods.push(meta.name);
    if (meta.qualifiers && meta.qualifiers.includes('virtual')) virtuals.push(meta.name);
    if ((meta.qualifiers ?? '').includes('vararg')) vararg.push(meta.name);
  }
  const properties: string[] = [];
  for (const match of xml.matchAll(/<member\b([^>]*)>/g)) {
    const meta = attributes(match[1] ?? '');
    if (meta.name) properties.push(meta.name);
  }
  const signals: string[] = [];
  for (const match of xml.matchAll(/<signal\b([^>]*)>/g)) {
    const meta = attributes(match[1] ?? '');
    if (meta.name) signals.push(meta.name);
  }
  const constants: string[] = [];
  for (const match of xml.matchAll(/<constant\b([^>]*)>/g)) {
    const meta = attributes(match[1] ?? '');
    if (meta.name) constants.push(meta.name);
  }
  const entry: ClassEntry = {
    inherits: head.inherits ?? null,
    methods: uniqueSorted(methods),
    properties: uniqueSorted(properties),
    signals: uniqueSorted(signals),
    constants: uniqueSorted(constants),
  };
  if (vararg.length) entry.vararg = uniqueSorted(vararg);
  if (virtuals.length) entry.virtual = uniqueSorted(virtuals);
  return { name: head.name, version: head.version ?? null, entry };
}

function tarEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const rawName = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '');
    const name = prefix ? prefix + '/' + rawName : rawName;
    const size = parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0', 8);
    const type = header[156];
    const dataStart = offset + 512;
    if (type === 0x30 || type === 0) entries.set(name, buffer.subarray(dataStart, dataStart + size));
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return entries;
}

interface DownloadedClasses {
  classes: [string, string][];
  builtins: string[];
  settings: string[];
}

async function downloadClasses(): Promise<DownloadedClasses> {
  const url = 'https://codeload.github.com/godotengine/godot/tar.gz/refs/tags/' + ref;
  const response = await fetch(url, { headers: { 'user-agent': 'AzSkills-godot-api-index' } });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' downloading ' + url);
  const archive = gunzipSync(Buffer.from(await response.arrayBuffer()));
  const entries = tarEntries(archive);
  const classes: [string, string][] = [];
  let gdscriptFunctions: string | null = null;
  const sourceFiles: string[] = [];
  for (const [name, data] of entries) {
    const match = /^[^/]+\/doc\/classes\/([^/]+)\.xml$/.exec(name);
    const className = match?.[1];
    if (className !== undefined) classes.push([className, data.toString('utf8')]);
    if (/^[^/]+\/modules\/gdscript\/gdscript_functions\.cpp$/.test(name)) {
      gdscriptFunctions = data.toString('utf8');
    }
    if (/^[^/]+\/(?:core|main|servers|scene|modules\/[^/]+)\/.*\.(?:cpp|h)$/.test(name)) {
      sourceFiles.push(data.toString('utf8'));
    }
  }
  if (!gdscriptFunctions) throw new Error('missing modules/gdscript/gdscript_functions.cpp');
  return {
    classes: classes.sort(([left], [right]) => left.localeCompare(right)),
    builtins: parseGdscriptFunctions(gdscriptFunctions),
    settings: parseProjectSettings(sourceFiles),
  };
}

// The class reference does not list every ProjectSettings key, so read the
// GLOBAL_DEF calls the engine uses to register them.
function parseProjectSettings(sources: string[]): string[] {
  const settings: string[] = [];
  const call = /GLOBAL_DEF(?:_RST|_NOVAL|_BASIC|_CUSTOM)?\s*\(/g;
  for (const source of sources) {
    for (const match of source.matchAll(call)) {
      let depth = 1;
      let index = (match.index ?? 0) + match[0].length;
      const start = index;
      while (index < source.length && depth > 0) {
        const char = source[index];
        if (char === '(') depth += 1;
        else if (char === ')') depth -= 1;
        else if (char === '"') {
          index += 1;
          while (index < source.length && source[index] !== '"') {
            if (source[index] === '\\') index += 1;
            index += 1;
          }
        } else if (char === "'") {
          index += 1;
          while (index < source.length && source[index] !== "'") {
            if (source[index] === '\\') index += 1;
            index += 1;
          }
        }
        index += 1;
      }
      const body = source.slice(start, index - 1);
      const literals = [...body.matchAll(/"([^"\\]*)"|'([^'\\]*)'/g)]
        .map((literal) => literal[1] ?? literal[2])
        .filter((value) => value && /^[A-Za-z0-9_]+\/[A-Za-z0-9_./-]+$/.test(value));
      const first = literals[0];
      if (first !== undefined) settings.push(first);
    }
  }
  return uniqueSorted(settings);
}

function parseGdscriptFunctions(source: string): string[] {
  const table = /static const char \*_names\[FUNC_MAX\]\s*=\s*\{([\s\S]*?)\};/.exec(source);
  if (!table) throw new Error('cannot locate the GDScript built-in function table');
  const names = [...(table[1] ?? '').matchAll(/"([a-z_][a-z0-9_]*)"/g)]
    .map((match) => match[1])
    .filter((name): name is string => name !== undefined);
  if (names.length < 50) throw new Error('Suspiciously few GDScript built-ins: ' + names.length);
  return uniqueSorted(names);
}

async function main(): Promise<void> {
  const { classes: files, builtins, settings } = await downloadClasses();
  if (files.length < 300) throw new Error('Suspiciously few class files: ' + files.length);
  if (settings.length < 200) throw new Error('Suspiciously few project settings: ' + settings.length);
  const parsed = files.map(([, xml]) => parseClass(xml));
  const classes: Record<string, ClassEntry> = {};
  let engineVersion = '3.6';
  for (const item of parsed) {
    if (!item.name) throw new Error('Class without a name');
    if (item.version) engineVersion = item.version;
    classes[item.name] = item.entry;
  }
  if (classes.ProjectSettings) {
    classes.ProjectSettings.properties = uniqueSorted([
      ...(classes.ProjectSettings.properties ?? []),
      ...settings,
    ]);
    classes.ProjectSettings.source = 'doc/classes/ProjectSettings.xml plus GLOBAL_DEF registrations in the 3.6 source tree';
  }
  const index = {
    schemaVersion: 1,
    engine: 'godot',
    engineVersion,
    ref,
    source: 'https://github.com/godotengine/godot/tree/' + ref + '/doc/classes',
    license: 'MIT (Godot Engine documentation is distributed with the engine source)',
    generatedAt: new Date().toISOString(),
    classCount: Object.keys(classes).length,
    builtinFunctions: builtins,
    builtinSource: 'https://github.com/godotengine/godot/blob/' + ref + '/modules/gdscript/gdscript_functions.cpp',
    classes,
  };
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(index) + '\n', 'utf8');
  const bytes = (await readFile(out)).byteLength;
  console.log('Wrote ' + out + ' (' + index.classCount + ' classes, ' + bytes + ' bytes) for Godot ' + engineVersion + ' at ' + ref);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
