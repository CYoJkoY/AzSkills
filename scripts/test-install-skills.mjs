import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installer = path.join(root, 'scripts/install-skills.mjs');
const temp = await mkdtemp(path.join(os.tmpdir(), 'azskills-installer-'));
const project = path.join(temp, 'project');
const destination = path.join(project, '.cursor', 'skills');
const managedPath = path.join(destination, 'tool-integration');
const run = (...args) => {
  const result = spawnSync(process.execPath, [installer, ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Installer exited with ' + result.status);
  return result.stdout;
};

try {
  const preview = run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--dry-run');
  assert.match(preview, /Preview for Cursor/);
  await assert.rejects(stat(destination), { code: 'ENOENT' });

  run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--yes');
  const manifestFile = path.join(destination, '.azskills-manifest.json');
  const installedManifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  assert.deepEqual(installedManifest.skills, ['tool-integration']);
  const sourceSkill = await readFile(path.join(root, 'tool-integration', 'SKILL.md'), 'utf8');
  assert.equal(await readFile(path.join(managedPath, 'SKILL.md'), 'utf8'), sourceSkill);

  const unmanaged = path.join(destination, 'user-notes.txt');
  await writeFile(unmanaged, 'keep');
  const localEdit = 'locally customized snapshot';
  await writeFile(path.join(managedPath, 'SKILL.md'), localEdit);
  run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--yes');
  assert.equal(await readFile(path.join(managedPath, 'SKILL.md'), 'utf8'), sourceSkill);
  const updatedManifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  assert.ok(updatedManifest.lastRun.changes[0].backup);

  run('--rollback', '--target', destination, '--yes');
  assert.equal(await readFile(path.join(managedPath, 'SKILL.md'), 'utf8'), localEdit);
  run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--yes');
  run('--uninstall', '--target', destination, '--yes');
  assert.equal(await readFile(unmanaged, 'utf8'), 'keep');
  await assert.rejects(stat(managedPath), { code: 'ENOENT' });
  assert.ok((await readdir(path.join(destination, '.azskills-backups'))).length > 0);

  const recoveryProject = path.join(temp, 'recovery-project');
  const recoveryDestination = path.join(recoveryProject, '.cursor', 'skills');
  run('--tool', 'cursor', '--mode', 'project', '--project', recoveryProject, '--skills', 'tool-integration,architecture', '--yes');
  await rm(path.join(recoveryDestination, 'architecture'), { recursive: true, force: true });
  assert.throws(() => run('--uninstall', '--target', recoveryDestination, '--yes'), /Managed skill is missing/);
  assert.equal(await readFile(path.join(recoveryDestination, 'tool-integration', 'SKILL.md'), 'utf8'), sourceSkill);
  const recoveryManifest = JSON.parse(await readFile(path.join(recoveryDestination, '.azskills-manifest.json'), 'utf8'));
  assert.deepEqual(recoveryManifest.skills, ['tool-integration', 'architecture']);

  const unmanagedTarget = path.join(temp, 'unmanaged', 'cursor-skills');
  await mkdirRecursive(path.join(unmanagedTarget, 'tool-integration'));
  await assert.rejects(async () => run('--tool', 'cursor', '--target', unmanagedTarget, '--skills', 'tool-integration', '--yes'), /Refusing to overwrite unmanaged path/);
  console.log('Installer lifecycle tests passed (preview, install, update, rollback, uninstall recovery, unmanaged-path protection).');
} finally {
  await rm(temp, { recursive: true, force: true });
}

async function mkdirRecursive(target) {
  const fs = await import('node:fs/promises');
  await fs.mkdir(target, { recursive: true });
}

