import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, readdir, rm, stat, symlink, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'azskills-lifecycle-'));
const exists = file => stat(file).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; });
async function manifests(dir) {
  const output = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) output.push(...await manifests(full));
    else if (item.name.toLowerCase() === 'skill.md') output.push(full);
  }
  return output;
}
function cli(target, options = [], pass = true) {
  const result = spawnSync(process.execPath, ['scripts/install-skills.mjs', '--target', target, ...options], { cwd: root, encoding: 'utf8', timeout: 30000 });
  if (result.error) throw result.error;
  assert.equal(result.status === 0, pass, result.stdout + result.stderr);
  return result.stdout + result.stderr;
}
const manifestFile = target => path.join(target, '.azskills-manifest.json');
try {
  const target = path.join(temp, 'fresh', 'skills');
  cli(target, ['--dry-run']);
  assert.equal(await exists(target), false, 'Preview must not write target');
  cli(target, [], false);
  assert.equal(await exists(target), false, 'Missing confirmation must not write');
  cli(target, ['--skills', 'ui-aesthetics', '--yes']);
  assert.deepEqual((await manifests(target)).map(f => path.relative(target, f)), [path.join('azskills', 'SKILL.md')]);
  const installed = path.join(target, 'azskills');
  const unrelated = path.join(temp, 'unrelated-skill');
  await mkdir(unrelated);
  await writeFile(path.join(unrelated, 'SKILL.md'), 'unrelated linked skill');
  await symlink(unrelated, path.join(target, 'unrelated-linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.match(await readFile(path.join(installed, 'references/modules/architecture.md'), 'utf8'), /name: architecture/);
  assert.match(await readFile(path.join(installed, 'references/routing.md'), 'utf8'), /frontend-architecture/);
  cli(target, ['--verify']);
  assert.equal((await lstat(path.join(target, 'unrelated-linked'))).isSymbolicLink(), true, 'Unrelated linked skills must be preserved');
  const firstManifest = await readFile(manifestFile(target), 'utf8');
  assert.match(cli(target, ['--yes']), /already current/);
  assert.equal(await readFile(manifestFile(target), 'utf8'), firstManifest, 'No-op preserves rollback');
  await writeFile(path.join(installed, 'SKILL.md'), 'local edit');
  cli(target, ['--verify'], false);
  cli(target, ['--yes']);
  cli(target, ['--rollback', '--yes']);
  assert.equal(await readFile(path.join(installed, 'SKILL.md'), 'utf8'), 'local edit');
  await writeFile(path.join(target, 'user-notes.txt'), 'keep');
  cli(target, ['--uninstall', '--yes']);
  assert.equal(await exists(installed), false);
  assert.equal(await readFile(path.join(target, 'user-notes.txt'), 'utf8'), 'keep');
  cli(target, ['--rollback', '--yes']);
  assert.equal(await readFile(path.join(installed, 'SKILL.md'), 'utf8'), 'local edit');

  for (const schemaVersion of [1, 2]) {
    const legacy = path.join(temp, 'legacy-' + schemaVersion, 'skills');
    const ids = ['architecture', 'retired-module', 'ui-aesthetics'];
    for (const id of ids) {
      await mkdir(path.join(legacy, id), { recursive: true });
      await writeFile(path.join(legacy, id, 'SKILL.md'), 'original ' + id);
    }
    await mkdir(path.join(legacy, '.azskills-backups', 'old', 'architecture'), { recursive: true });
    await writeFile(path.join(legacy, '.azskills-backups', 'old', 'architecture', 'SKILL.md'), 'old backup');
    await writeFile(path.join(legacy, 'unrelated.txt'), 'preserve');
    const oldManifest = JSON.stringify(schemaVersion === 1 ? { schemaVersion, paths: ids } : { schemaVersion, skills: ids, lastRun: null });
    await writeFile(manifestFile(legacy), oldManifest);
    cli(legacy, ['--dry-run']);
    assert.equal((await manifests(legacy)).length, 4);
    cli(legacy, ['--yes']);
    assert.equal((await manifests(legacy)).length, 1, 'Migration must also move legacy backups out of scan root');
    const data = JSON.parse(await readFile(manifestFile(legacy), 'utf8'));
    assert.equal(path.relative(legacy, data.lastRun.directory).startsWith('..'), true);
    assert.deepEqual(data.skills, ['azskills']);
    cli(legacy, ['--verify']);
    cli(legacy, ['--rollback', '--yes']);
    assert.equal(await readFile(manifestFile(legacy), 'utf8'), oldManifest);
    assert.equal((await manifests(legacy)).length, 4);
    for (const id of ids) assert.equal(await readFile(path.join(legacy, id, 'SKILL.md'), 'utf8'), 'original ' + id);
    assert.equal(await readFile(path.join(legacy, 'unrelated.txt'), 'utf8'), 'preserve');
  }
  const conflict = path.join(temp, 'conflict');
  await mkdir(path.join(conflict, 'azskills'), { recursive: true });
  await writeFile(path.join(conflict, 'azskills', 'SKILL.md'), 'user-owned');
  cli(conflict, ['--yes'], false);
  assert.equal(await readFile(path.join(conflict, 'azskills', 'SKILL.md'), 'utf8'), 'user-owned');
  const invalid = path.join(temp, 'invalid');
  await mkdir(invalid);
  await writeFile(manifestFile(invalid), JSON.stringify({ schemaVersion: 2, skills: ['../outside'] }));
  cli(invalid, ['--uninstall', '--yes'], false);
  assert.equal(await exists(path.join(invalid, 'azskills')), false);
  const recovery = path.join(temp, 'recovery');
  cli(recovery, ['--yes']);
  await writeFile(path.join(recovery, 'azskills', 'SKILL.md'), 'changed');
  cli(recovery, ['--yes']);
  const state = JSON.parse(await readFile(manifestFile(recovery), 'utf8'));
  await rm(path.join(state.lastRun.directory, 'azskills', 'SKILL.md'));
  const before = await readFile(path.join(recovery, 'azskills', 'SKILL.md'), 'utf8');
  cli(recovery, ['--rollback', '--yes'], false);
  assert.equal(await readFile(path.join(recovery, 'azskills', 'SKILL.md'), 'utf8'), before, 'Missing snapshot must fail before mutation');
  cli(recovery, ['--skills', 'missing', '--yes'], false);
  const failedUpdate = path.join(temp, 'failed-update');
  cli(failedUpdate, ['--yes']);
  await writeFile(path.join(failedUpdate, 'azskills', 'SKILL.md'), 'preserve after copy failure');
  const priorManifest = await readFile(manifestFile(failedUpdate), 'utf8');
  const preload = path.join(temp, 'fail-copy.mjs');
  await writeFile(preload, [
    'import fs from "node:fs/promises";',
    'import { syncBuiltinESMExports } from "node:module";',
    'const cp = fs.cp; let failed = false;',
    'fs.cp = async (source, destination, options) => {',
    '  if (!failed && destination === process.env.AZSKILLS_FAIL_DESTINATION) { failed = true; throw new Error("Injected copy failure"); }',
    '  return cp(source, destination, options);',
    '}; syncBuiltinESMExports();',
  ].join('\n'));
  const failure = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, 'scripts/install-skills.mjs', '--target', failedUpdate, '--yes'], {
    cwd: root, encoding: 'utf8', timeout: 30000, env: { ...process.env, AZSKILLS_FAIL_DESTINATION: path.join(failedUpdate, 'azskills') },
  });
  if (failure.error) throw failure.error;
  assert.equal(failure.status, 1, failure.stdout + failure.stderr);
  assert.match(failure.stderr, /Injected copy failure/);
  assert.equal(await readFile(path.join(failedUpdate, 'azskills', 'SKILL.md'), 'utf8'), 'preserve after copy failure');
  assert.equal(await readFile(manifestFile(failedUpdate), 'utf8'), priorManifest, 'Failed mutation must restore prior manifest bytes');
  console.log('Installer tests passed: one entry, legacy schemas, backup migration, byte-preserving rollback, idempotency, content verification, conflicts, unsafe manifests, and missing snapshots.');
} finally { await rm(temp, { recursive: true, force: true }); }
