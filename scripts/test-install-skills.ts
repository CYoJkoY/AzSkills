import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, readdir, rm, stat, symlink, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { errorCode, readJson } from './runtime.ts';
import type { PluginCatalog, RollbackState, SkillManifest } from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'azskills-lifecycle-'));
const catalog = await readJson<PluginCatalog>(path.join(root, 'catalog/plugins.json'));
const moduleIds = catalog.plugins.filter((plugin) => plugin.kind === 'module').map((plugin) => plugin.id);
const exists = async (file: string): Promise<boolean> => {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false;
    throw error;
  }
};

async function skillEntries(directory: string, base = directory): Promise<string[]> {
  const output: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) output.push(...await skillEntries(full, base));
    else if (item.name.toLowerCase() === 'skill.md') output.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return output.sort();
}

function cli(target: string, options: string[] = [], pass = true): string {
  const result = spawnSync(process.execPath, ['scripts/install-skills.ts', '--target', target, ...options], { cwd: root, encoding: 'utf8', timeout: 120000 });
  if (result.error) throw result.error;
  assert.equal(result.status === 0, pass, result.stdout + result.stderr);
  return result.stdout + result.stderr;
}

const manifestFile = (target: string): string => path.join(target, '.azskills-manifest.json');
const readManifest = async (target: string): Promise<SkillManifest> => readJson<SkillManifest>(manifestFile(target));
const requireRollback = (manifest: SkillManifest): RollbackState => {
  assert.ok(manifest.lastRun, 'Run must record a rollback snapshot.');
  return manifest.lastRun;
};

try {
  const target = path.join(temp, 'fresh', 'skills');
  cli(target, ['--dry-run', '--plugin', 'ui-design']);
  assert.equal(await exists(target), false, 'Preview must not write target');
  cli(target, ['--plugin', 'ui-design'], false);
  assert.equal(await exists(target), false, 'Missing confirmation must not write');
  assert.match(cli(target, ['--plugin', 'no-think-tags', '--yes']), /standalone hook plugin/);
  assert.equal(await exists(target), false, 'Standalone-only selection must not create a skills root');

  const legacySelection = path.join(temp, 'legacy-selection');
  assert.match(cli(legacySelection, ['--skills', 'ui-aesthetics', '--yes']), /legacy aliases/);
  assert.deepEqual(await skillEntries(legacySelection), ['ui-design/SKILL.md'], 'Legacy flags and alias ids resolve to the canonical module');

  cli(target, ['--plugin', 'architecture,ui-design', '--yes']);
  assert.deepEqual(await skillEntries(target), ['architecture/SKILL.md', 'ui-design/SKILL.md']);
  const installed = path.join(target, 'ui-design');
  const manifest = await readManifest(target);
  assert.equal(manifest.schemaVersion, 4);
  assert.deepEqual(manifest.plugins, ['architecture', 'ui-design']);
  assert.match(await readFile(path.join(installed, 'references/modules/ui-design.md'), 'utf8'), /name: ui-design/);
  assert.equal(await exists(path.join(installed, '.codex-plugin/plugin.json')), false, 'Skill view must not ship a plugin manifest');
  assert.match(await readFile(path.join(installed, 'SKILL.md'), 'utf8'), /references\/modules\/ui-design\.md/);

  const unrelated = path.join(temp, 'unrelated-skill');
  await mkdir(unrelated);
  await writeFile(path.join(unrelated, 'SKILL.md'), 'unrelated linked skill');
  await symlink(unrelated, path.join(target, 'unrelated-linked'), process.platform === 'win32' ? 'junction' : 'dir');
  cli(target, ['--verify']);
  assert.equal((await lstat(path.join(target, 'unrelated-linked'))).isSymbolicLink(), true, 'Unrelated linked skills must be preserved');

  const firstManifest = await readFile(manifestFile(target), 'utf8');
  assert.match(cli(target, ['--plugin', 'architecture,ui-design', '--yes']), /already current/);
  assert.equal(await readFile(manifestFile(target), 'utf8'), firstManifest, 'No-op preserves rollback');

  await writeFile(path.join(installed, 'SKILL.md'), 'local edit');
  cli(target, ['--verify'], false);
  cli(target, ['--plugin', 'architecture,ui-design', '--yes']);
  cli(target, ['--rollback', '--yes']);
  assert.equal(await readFile(path.join(installed, 'SKILL.md'), 'utf8'), 'local edit');

  cli(target, ['--plugin', 'architecture', '--yes']);
  assert.deepEqual(await skillEntries(target), ['architecture/SKILL.md'], 'Selection controls the managed set');
  await writeFile(path.join(target, 'user-notes.txt'), 'keep');
  cli(target, ['--uninstall', '--yes']);
  assert.equal(await exists(path.join(target, 'architecture')), false);
  assert.equal(await readFile(path.join(target, 'user-notes.txt'), 'utf8'), 'keep');
  cli(target, ['--rollback', '--yes']);
  assert.match(await readFile(path.join(target, 'architecture', 'SKILL.md'), 'utf8'), /references\/modules\/architecture\.md/);

  for (const schemaVersion of [1, 2, 3] as const) {
    const legacy = path.join(temp, 'legacy-' + schemaVersion, 'skills');
    const ids = ['architecture', 'retired-module', 'ui-aesthetics', 'azskills'];
    for (const id of ids) {
      await mkdir(path.join(legacy, id), { recursive: true });
      await writeFile(path.join(legacy, id, 'SKILL.md'), 'original ' + id);
    }
    await mkdir(path.join(legacy, '.azskills-backups', 'old', 'architecture'), { recursive: true });
    await writeFile(path.join(legacy, '.azskills-backups', 'old', 'architecture', 'SKILL.md'), 'old backup');
    await writeFile(path.join(legacy, 'unrelated.txt'), 'preserve');
    const owned = schemaVersion === 1 ? { paths: ids } : { skills: ids, lastRun: null };
    const oldManifest = JSON.stringify({ schemaVersion, ...owned });
    await writeFile(manifestFile(legacy), oldManifest);
    cli(legacy, ['--dry-run', '--plugin', 'ui-design']);
    assert.equal((await skillEntries(legacy)).length, 5);
    cli(legacy, ['--plugin', 'ui-design', '--yes']);
    assert.deepEqual(await skillEntries(legacy), ['ui-design/SKILL.md'], 'Migration must also move legacy backups out of the scan root');
    const data = await readManifest(legacy);
    const lastRun = requireRollback(data);
    assert.equal(path.relative(legacy, lastRun.directory).startsWith('..'), true);
    assert.deepEqual(data.plugins, ['ui-design']);
    cli(legacy, ['--verify']);
    cli(legacy, ['--rollback', '--yes']);
    assert.equal(await readFile(manifestFile(legacy), 'utf8'), oldManifest);
    assert.equal((await skillEntries(legacy)).length, 5);
    for (const id of ids) assert.equal(await readFile(path.join(legacy, id, 'SKILL.md'), 'utf8'), 'original ' + id);
    assert.equal(await readFile(path.join(legacy, 'unrelated.txt'), 'utf8'), 'preserve');
  }

  const conflict = path.join(temp, 'conflict');
  await mkdir(path.join(conflict, 'ui-design'), { recursive: true });
  await writeFile(path.join(conflict, 'ui-design', 'SKILL.md'), 'user-owned');
  cli(conflict, ['--plugin', 'ui-design', '--yes'], false);
  assert.equal(await readFile(path.join(conflict, 'ui-design', 'SKILL.md'), 'utf8'), 'user-owned');

  const invalid = path.join(temp, 'invalid');
  await mkdir(invalid);
  await writeFile(manifestFile(invalid), JSON.stringify({ schemaVersion: 2, skills: ['../outside'] }));
  cli(invalid, ['--uninstall', '--yes'], false);
  assert.equal(await exists(path.join(invalid, 'architecture')), false);

  const recovery = path.join(temp, 'recovery');
  cli(recovery, ['--plugin', 'ui-design', '--yes']);
  await writeFile(path.join(recovery, 'ui-design', 'SKILL.md'), 'changed');
  cli(recovery, ['--plugin', 'ui-design', '--yes']);
  const state = requireRollback(await readManifest(recovery));
  await rm(path.join(state.directory, 'ui-design', 'SKILL.md'));
  const before = await readFile(path.join(recovery, 'ui-design', 'SKILL.md'), 'utf8');
  cli(recovery, ['--rollback', '--yes'], false);
  assert.equal(await readFile(path.join(recovery, 'ui-design', 'SKILL.md'), 'utf8'), before, 'Missing snapshot must fail before mutation');
  cli(recovery, ['--plugin', 'missing', '--yes'], false);

  const failedUpdate = path.join(temp, 'failed-update');
  cli(failedUpdate, ['--plugin', 'ui-design', '--yes']);
  await writeFile(path.join(failedUpdate, 'ui-design', 'SKILL.md'), 'preserve after copy failure');
  const priorManifest = await readFile(manifestFile(failedUpdate), 'utf8');
  const preload = path.join(temp, 'fail-copy.mts');
  await writeFile(preload, [
    'import fs from "node:fs/promises";',
    'import { syncBuiltinESMExports } from "node:module";',
    'const cp = fs.cp; let failed = false;',
    'fs.cp = async (source, destination, options) => {',
    '  if (!failed && destination === process.env.AZSKILLS_FAIL_DESTINATION) { failed = true; throw new Error("Injected copy failure"); }',
    '  return cp(source, destination, options);',
    '}; syncBuiltinESMExports();',
  ].join('\n'));
  const failure = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, 'scripts/install-skills.ts', '--target', failedUpdate, '--plugin', 'ui-design', '--yes'], {
    cwd: root, encoding: 'utf8', timeout: 120000, env: { ...process.env, AZSKILLS_FAIL_DESTINATION: path.join(failedUpdate, 'ui-design') },
  });
  if (failure.error) throw failure.error;
  assert.equal(failure.status, 1, failure.stdout + failure.stderr);
  assert.match(failure.stderr, /Injected copy failure/);
  assert.equal(await readFile(path.join(failedUpdate, 'ui-design', 'SKILL.md'), 'utf8'), 'preserve after copy failure');
  assert.equal(await readFile(manifestFile(failedUpdate), 'utf8'), priorManifest, 'Failed mutation must restore prior manifest bytes');

  assert.equal(moduleIds.length, 18);
  assert.equal(moduleIds.includes('no-think-tags'), false);
  console.log('Installer tests passed: per-plugin selection, standalone skipping, legacy schemas, backup migration, byte-preserving rollback, idempotency, content verification, conflicts, unsafe manifests, and missing snapshots.');
} finally { await rm(temp, { recursive: true, force: true }); }
