import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rmdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { packageSkill, packageSkillArchive, validatePackagedSkill } from './package-skill.mjs';

const temp = await mkdtemp(path.join(os.tmpdir(), 'azskills-package-'));
const root = path.join(temp, 'repository');
const output = path.join(temp, 'output');
const source = path.join(root, 'fixture');
try {
  await mkdir(path.join(source, 'references'), { recursive: true });
  await mkdir(path.join(root, 'integrations'), { recursive: true });
  await mkdir(path.join(root, 'assets'), { recursive: true });
  const fence = String.fromCharCode(96).repeat(3);
  await writeFile(path.join(source, 'SKILL.md'), [
    '# Fixture', '', '[Guide](../integrations/guide.md)', '', fence + 'md',
    '[not a dependency](../../outside.md)', fence, '',
  ].join('\n'));
  await writeFile(path.join(root, 'integrations/guide.md'), [
    '# Guide',
    '<img src="../assets/picture.svg" alt="example">',
    '<source srcset="../assets/small.svg 1x, ../assets/large.svg 2x">',
    '<a href="../assets/details.txt">details</a>',
  ].join('\n'));
  for (const file of ['picture.svg', 'small.svg', 'large.svg']) await writeFile(path.join(root, 'assets', file), '<svg/>');
  await writeFile(path.join(root, 'assets/details.txt'), 'Fixture details');
  const packaged = await packageSkill(root, 'fixture', output);
  await validatePackagedSkill(packaged);
  const guide = await readFile(path.join(packaged, '_azskills-support/integrations/guide.md'), 'utf8');
  assert.match(guide, /\.\.\/assets\/picture\.svg/);
  assert.match(guide, /\.\.\/assets\/small\.svg 1x, .*\.\.\/assets\/large\.svg 2x/);
  assert.match(guide, /\.\.\/assets\/details\.txt/);
  const archive = path.join(temp, 'fixture.zip');
  await packageSkillArchive(root, 'fixture', path.join(temp, 'archive-source'), archive);
  await packageSkillArchive(root, 'fixture', path.join(temp, 'archive-source'), path.join(output, 'fixture.zip'));
  assert.deepEqual(await readFile(archive), await readFile(path.join(output, 'fixture.zip')), 'Archives should be deterministic');
  const expanded = path.join(temp, 'expanded');
  const unzip = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED -Force'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: archive, AZSKILLS_EXPANDED: expanded } })
    : spawnSync('unzip', ['-q', archive, '-d', expanded], { encoding: 'utf8' });
  if (unzip.error) throw unzip.error;
  assert.equal(unzip.status, 0, unzip.stderr || 'Expand-Archive failed');
  await validatePackagedSkill(expanded);
  assert.match(await readFile(path.join(expanded, 'SKILL.md'), 'utf8'), /Fixture/);
  assert.match(await readFile(path.join(expanded, '_azskills-support/integrations/guide.md'), 'utf8'), /\.\.\/assets\/picture\.svg/);

  await writeFile(path.join(root, 'integrations/missing.md'), '[Missing](../assets/absent.svg)');
  await writeFile(path.join(source, 'broken.md'), '[Broken](../integrations/missing.md)');
  await assert.rejects(packageSkill(root, 'fixture', path.join(temp, 'broken-output')), /missing linked file/);
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const unified = path.join(temp, 'azskills.zip');
  await packageSkillArchive(repository, 'azskills', path.join(temp, 'unified-stage'), unified);
  const stagedSource = path.join(temp, 'unified-stage', 'azskills');
  const stagedRegistry = JSON.parse(await readFile(path.join(stagedSource, 'skills.json'), 'utf8'));
  for (const module of stagedRegistry.modules) {
    const directory = path.join(stagedSource, module.id);
    const entries = await readdir(directory).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (entries?.length === 0) await rmdir(directory);
  }
  const second = path.join(temp, 'azskills-second.zip');
  await packageSkillArchive(stagedSource, 'azskills', path.join(temp, 'unified-stage-two'), second);
  assert.deepEqual(await readFile(unified), await readFile(second), 'Unified archives must be deterministic');
  const extracted = path.join(temp, 'unified-extracted');
  const extraction = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: unified, AZSKILLS_EXPANDED: extracted } })
    : spawnSync('unzip', ['-q', unified, '-d', extracted], { encoding: 'utf8' });
  if (extraction.error) throw extraction.error;
  assert.equal(extraction.status, 0, extraction.stderr);
  const paths = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      if (item.isDirectory()) await collect(full);
      else paths.push(path.relative(extracted, full).split(path.sep).join('/'));
    }
  }
  await collect(extracted);
  assert.deepEqual(paths.filter(p => /(^|\/)skill\.md$/i.test(p)), ['SKILL.md']);
  assert.ok(paths.every(p => !/^(\.git|dist|node_modules)\//.test(p)));
  const registry = JSON.parse(await readFile(path.join(repository, 'skills.json'), 'utf8'));
  for (const module of registry.modules) assert.ok(paths.includes(module.path), module.path);
  assert.deepEqual(JSON.parse(await readFile(path.join(extracted, 'skills.json'), 'utf8')).aliases, registry.aliases);
  assert.deepEqual(await readFile(path.join(extracted, 'ui-design/references/ux/overview.md')), await readFile(path.join(repository, 'ui-design/references/ux/overview.md')));
  await validatePackagedSkill(extracted);
  console.log('Unified archive passed: exactly one manifest, all modules and aliases, extracted supporting bytes and links, deterministic output, and excluded build metadata.');
  console.log('Skill package tests passed (Markdown, HTML assets, srcset, fenced examples, missing dependencies, deterministic zip, and extracted links).');
} finally {
  await rm(temp, { recursive: true, force: true });
}
