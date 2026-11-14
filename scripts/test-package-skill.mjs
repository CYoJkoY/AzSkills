import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
  const unzip = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED -Force'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: archive, AZSKILLS_EXPANDED: expanded } });
  if (unzip.error) throw unzip.error;
  assert.equal(unzip.status, 0, unzip.stderr || 'Expand-Archive failed');
  await validatePackagedSkill(expanded);
  assert.match(await readFile(path.join(expanded, 'SKILL.md'), 'utf8'), /Fixture/);
  assert.match(await readFile(path.join(expanded, '_azskills-support/integrations/guide.md'), 'utf8'), /\.\.\/assets\/picture\.svg/);

  await writeFile(path.join(root, 'integrations/missing.md'), '[Missing](../assets/absent.svg)');
  await writeFile(path.join(source, 'broken.md'), '[Broken](../integrations/missing.md)');
  await assert.rejects(packageSkill(root, 'fixture', path.join(temp, 'broken-output')), /missing linked file/);
  console.log('Skill package tests passed (Markdown, HTML assets, srcset, fenced examples, missing dependencies, deterministic zip, and extracted links).');
} finally {
  await rm(temp, { recursive: true, force: true });
}
