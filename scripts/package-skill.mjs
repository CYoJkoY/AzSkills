import { deflateRawSync } from 'node:zlib';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const inside = (base, candidate) => {
  const relative = path.relative(base, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};

async function filesUnder(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Skill package does not follow symbolic links: ' + file);
    if (entry.isDirectory()) files.push(...await filesUnder(file, base));
    else if (entry.isFile()) files.push(file);
    else throw new Error('Skill package contains an unsupported filesystem entry: ' + file);
  }
  return files;
}

function parts(target) {
  const index = target.search(/[?#]/);
  return { pathname: index < 0 ? target : target.slice(0, index), suffix: index < 0 ? '' : target.slice(index) };
}

function isExternal(target) {
  return !target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target);
}

function markdownTargets(content) {
  let fence = '';
  const targets = [];
  for (const line of content.split(/\r?\n/)) {
    const marker = new RegExp('^\\s{0,3}([' + String.fromCharCode(96) + '~]{3,})').exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker[0];
      else if (marker[0] === fence) fence = '';
      continue;
    }
    if (fence) continue;
    for (const match of line.matchAll(/\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g)) targets.push(match[1]);
  }
  return targets;
}

function htmlTargets(content) {
  let fence = '';
  const targets = [];
  for (const line of content.split(/\r?\n/)) {
    const marker = new RegExp('^\\s{0,3}([' + String.fromCharCode(96) + '~]{3,})').exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker[0];
      else if (marker[0] === fence) fence = '';
      continue;
    }
    if (fence) continue;
    for (const match of line.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) targets.push(match[2]);
    for (const match of line.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gi)) {
      for (const candidate of match[2].split(',')) {
        const target = candidate.trim().split(/\s+/)[0];
        if (target) targets.push(target);
      }
    }
  }
  return targets;
}

function localOutputTarget(target, sourceFile, outputFile, root, skillRoot, supportRoot, outputSkill) {
  if (isExternal(target)) return null;
  const { pathname, suffix } = parts(target);
  if (!pathname) return null;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
  const resolved = path.resolve(path.dirname(sourceFile), decoded);
  if (!inside(root, resolved)) return null;
  const targetIsSkillLocal = inside(skillRoot, resolved);
  if (targetIsSkillLocal && inside(skillRoot, sourceFile)) return null;
  const mappedTarget = targetIsSkillLocal
    ? path.join(outputSkill, path.relative(skillRoot, resolved))
    : path.join(supportRoot, path.relative(root, resolved));
  let relative = path.relative(path.dirname(outputFile), mappedTarget).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = './' + relative;
  return relative.split('/').map(encodeURIComponent).join('/') + suffix;
}

function processMarkdown(content, sourceFile, outputFile, root, skillRoot, supportRoot, outputSkill, rewrite) {
  let fence = '';
  const lines = content.split(/(?<=\n)/);
  return lines.map((line) => {
    const marker = new RegExp('^\\s{0,3}([' + String.fromCharCode(96) + '~]{3,})').exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker[0];
      else if (marker[0] === fence) fence = '';
      return line;
    }
    if (fence) return line;
    let rewritten = line.replace(/(\]\()(<[^>]+>|[^\s)]+)(\s+[^)]*)?(\))/g, (whole, start, raw, title = '', end) => {
      const angled = raw.startsWith('<') && raw.endsWith('>');
      const target = angled ? raw.slice(1, -1) : raw;
      if (!rewrite) return whole;
      const encoded = localOutputTarget(target, sourceFile, outputFile, root, skillRoot, supportRoot, outputSkill);
      if (!encoded) return whole;
      return start + (angled ? '<' + encoded + '>' : encoded) + title + end;
    });
    if (rewrite) {
      rewritten = rewritten.replace(/(\b(?:src|href)\s*=\s*)(["'])(.*?)\2/gi, (whole, prefix, quote, target) => {
        const encoded = localOutputTarget(target, sourceFile, outputFile, root, skillRoot, supportRoot, outputSkill);
        return encoded ? prefix + quote + encoded + quote : whole;
      });
      rewritten = rewritten.replace(/(\bsrcset\s*=\s*)(["'])(.*?)\2/gi, (whole, prefix, quote, value) => {
        const updated = value.split(',').map((candidate) => {
          const match = /^(\s*)(\S+)(.*)$/.exec(candidate);
          if (!match) return candidate;
          const encoded = localOutputTarget(match[2], sourceFile, outputFile, root, skillRoot, supportRoot, outputSkill);
          return encoded ? match[1] + encoded + match[3] : candidate;
        }).join(',');
        return prefix + quote + updated + quote;
      });
    }
    return rewritten;
  }).join('');
}

export async function validatePackagedSkill(skillDirectory) {
  const base = path.resolve(skillDirectory);
  const errors = [];
  for (const file of await filesUnder(base)) {
    if (!file.toLowerCase().endsWith('.md')) continue;
    const content = await readFile(file, 'utf8');
    for (const raw of [...markdownTargets(content), ...htmlTargets(content)]) {
      const target = raw.startsWith('<') && raw.endsWith('>') ? raw.slice(1, -1) : raw;
      if (isExternal(target)) continue;
      const { pathname } = parts(target);
      if (!pathname) continue;
      let decoded;
      try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
      const resolved = path.resolve(path.dirname(file), decoded);
      if (!inside(base, resolved)) errors.push(path.relative(base, file) + ': link escapes package: ' + target);
      else { try { await stat(resolved); } catch { errors.push(path.relative(base, file) + ': missing link target: ' + target); } }
    }
  }
  if (errors.length) throw new Error('Incomplete skill package: ' + errors.join('; '));
}

export async function packageSkill(root, id, outputDirectory) {
  const base = path.resolve(root);
  const sourceSkill = path.resolve(base, id);
  const outputSkill = path.resolve(outputDirectory, id);
  const supportRoot = path.join(outputSkill, '_azskills-support');
  if (!inside(base, sourceSkill) || !inside(path.resolve(outputDirectory), outputSkill)) throw new Error('Skill package path escapes root: ' + id);
  if (!(await stat(sourceSkill)).isDirectory()) throw new Error('Skill source is missing: ' + id);
  await mkdir(path.dirname(outputSkill), { recursive: true });
  await cp(sourceSkill, outputSkill, { recursive: true, errorOnExist: true });

  const queue = await filesUnder(sourceSkill);
  const processed = new Set();
  while (queue.length) {
    const sourceFile = queue.shift();
    if (processed.has(sourceFile) || !sourceFile.toLowerCase().endsWith('.md')) continue;
    processed.add(sourceFile);
    const outputFile = inside(sourceSkill, sourceFile)
      ? path.join(outputSkill, path.relative(sourceSkill, sourceFile))
      : path.join(supportRoot, path.relative(base, sourceFile));
    const content = await readFile(sourceFile, 'utf8');
    const rewritten = processMarkdown(content, sourceFile, outputFile, base, sourceSkill, supportRoot, outputSkill, true);
    if (rewritten !== content) await writeFile(outputFile, rewritten, 'utf8');

    for (const raw of [...markdownTargets(content), ...htmlTargets(content)]) {
      const target = raw.startsWith('<') && raw.endsWith('>') ? raw.slice(1, -1) : raw;
      if (isExternal(target)) continue;
      const { pathname } = parts(target);
      if (!pathname) continue;
      let decoded;
      try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
      const sourceTarget = path.resolve(path.dirname(sourceFile), decoded);
      if (!inside(base, sourceTarget) || inside(sourceSkill, sourceTarget)) continue;
      let info;
      try { info = await stat(sourceTarget); }
      catch (error) { if (error.code === 'ENOENT') throw new Error(id + ': missing linked file: ' + path.relative(base, sourceTarget)); throw error; }
      const outputTarget = path.join(supportRoot, path.relative(base, sourceTarget));
      await mkdir(path.dirname(outputTarget), { recursive: true });
      if (info.isDirectory()) {
        await cp(sourceTarget, outputTarget, { recursive: true, force: false });
        queue.push(...(await filesUnder(sourceTarget)).filter((file) => file.toLowerCase().endsWith('.md')));
      } else {
        await cp(sourceTarget, outputTarget, { force: false });
        if (sourceTarget.toLowerCase().endsWith('.md')) queue.push(sourceTarget);
      }
    }
  }
  await validatePackagedSkill(outputSkill);
  return outputSkill;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}

// Sorted entries with fixed timestamps make repeated archives byte-identical.
export async function writeSkillZip(directory, archive) {
  const normalized = path.resolve(archive);
  const parent = path.dirname(normalized);
  const packaged = path.resolve(directory);
  const files = (await filesUnder(packaged)).map((file) => ({
    name: path.relative(packaged, file).split(path.sep).join('/'),
    source: file,
  })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  if (files.length > 0xffff) throw new Error('Skill bundle has too many files for a zip archive: ' + files.length);
  const local = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const text = await readFile(file.source);
    const name = Buffer.from(file.name, 'utf8');
    const data = deflateRawSync(text, { level: 6 });
    const crc = crc32(text);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0x21, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(text.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(text.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += header.length + name.length + data.length;
    if (text.length > 0xffffffff || data.length > 0xffffffff || offset > 0xffffffff) throw new Error('Skill bundle is too large for a zip archive: ' + file.name);
  }
  const centralSize = central.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  await mkdir(parent, { recursive: true });
  await writeFile(normalized, Buffer.concat([...local, ...central, end]));
  return { archive: normalized, files: files.length };
}

export async function packageSkillArchive(root, id, stagingDirectory, archive) {
  const packaged = await packageSkill(root, id, stagingDirectory);
  return writeSkillZip(packaged, archive);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const option = (key) => { const index = args.indexOf(key); const result = index < 0 ? '' : args[index + 1]; if (index >= 0 && (!result || result.startsWith('--'))) throw new Error(key + ' requires a value'); return result; };
  if (args.includes('--help') || args.includes('-h')) {
    console.log(['AzSkills Skill bundle exporter', '', 'Usage: node scripts/package-skill.mjs [--skill <id>] [--output <directory>]', '', 'Without --skill, exports every canonical Skill and compatibility alias as <id>.zip. Archives are standalone, deterministic, and include linked support files under _azskills-support.'].join(String.fromCharCode(10)));
    process.exit(0);
  }
  try {
    const root = path.resolve(option('--root') || path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    const id = option('--skill');
    const output = path.resolve(option('--output') || path.join(root, 'dist', 'skills'));
    const registry = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
    const entries = [...registry.skills, ...registry.aliases];
    const ids = entries.map((entry) => entry.id);
    const selected = id ? [id] : ids;
    const unknown = selected.filter((item) => !ids.includes(item));
    if (unknown.length) throw new Error('Unknown skill id(s): ' + unknown.join(', '));
    await mkdir(output, { recursive: true });
    const staging = await mkdtemp(path.join(tmpdir(), 'azskills-export-'));
    const archives = [];
    try {
      for (const item of selected) archives.push(await packageSkillArchive(root, item, staging, path.join(output, item + '.zip')));
    } finally { await rm(staging, { recursive: true, force: true }); }
    console.log('Exported ' + archives.length + ' Skill bundle(s) to ' + output);
  } catch (error) { console.error('AzSkills packaging failed: ' + error.message); process.exitCode = 1; }
}
