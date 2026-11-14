import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packageSkill, validatePackagedSkill } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installer = path.join(root, 'scripts/install-skills.mjs');
const temp = await mkdtemp(path.join(os.tmpdir(), 'azskills-installer-'));
const project = path.join(temp, 'project');
const destination = path.join(project, '.cursor', 'skills');
const managedPath = path.join(destination, 'tool-integration');
const expectedPackageRoot = path.join(temp, 'expected-packages');
const run = (...args) => {
  const result = spawnSync(process.execPath, [installer, ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Installer exited with ' + result.status);
  return result.stdout;
};

try {
  await packageSkill(root, 'tool-integration', expectedPackageRoot);
  const sourceSkill = await readFile(path.join(expectedPackageRoot, 'tool-integration', 'SKILL.md'), 'utf8');
  const preview = run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--dry-run');
  assert.match(preview, /Preview for Cursor/);
  await assert.rejects(stat(destination), { code: 'ENOENT' });

  run('--tool', 'cursor', '--mode', 'project', '--project', project, '--skills', 'tool-integration', '--yes');
  const manifestFile = path.join(destination, '.azskills-manifest.json');
  const installedManifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  assert.deepEqual(installedManifest.skills, ['tool-integration']);
  assert.equal(await readFile(path.join(managedPath, 'SKILL.md'), 'utf8'), sourceSkill);
  assert.ok((await readdir(path.join(managedPath, '_azskills-support', 'integrations', 'guides'))).includes('codex.md'));
  await validatePackagedSkill(managedPath);

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
  await writeFile(path.join(unmanagedTarget, 'tool-integration', 'SKILL.md'), 'user-owned');
  await assert.rejects(async () => run('--tool', 'cursor', '--target', unmanagedTarget, '--skills', 'tool-integration', '--dry-run'), /Refusing to overwrite unmanaged path/);
  await assert.rejects(async () => run('--tool', 'cursor', '--target', unmanagedTarget, '--skills', 'tool-integration', '--yes'), /Refusing to overwrite unmanaged path/);
  assert.equal(await readFile(path.join(unmanagedTarget, 'tool-integration', 'SKILL.md'), 'utf8'), 'user-owned');

  const aliasProject = path.join(temp, 'alias-project');
  const aliasDestination = path.join(aliasProject, '.cursor', 'skills');
  run('--tool', 'cursor', '--mode', 'project', '--project', aliasProject, '--skills', 'ui-aesthetics', '--yes');
  const aliasSkill = path.join(aliasDestination, 'ui-aesthetics');
  assert.ok((await readFile(path.join(aliasSkill, 'SKILL.md'), 'utf8')).includes('_azskills-support/ui-design/SKILL.md'));
  assert.ok((await stat(path.join(aliasSkill, '_azskills-support/ui-design/references/ux/overview.md'))).isFile());
  await validatePackagedSkill(aliasSkill);

  const codexProject = path.join(temp, 'codex-project');
  const codexDestination = path.join(codexProject, '.agents', 'skills');
  const codexPreview = run('--tool', 'codex', '--mode', 'project', '--project', codexProject, '--skills', 'architecture', '--dry-run');
  assert.match(codexPreview, /Preview for Codex/);
  assert.match(codexPreview, /_azskills-support/);
  await assert.rejects(stat(codexDestination), { code: 'ENOENT' });
  run('--tool', 'codex', '--mode', 'project', '--project', codexProject, '--skills', 'architecture', '--yes');
  await validatePackagedSkill(path.join(codexDestination, 'architecture'));

  const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
  const bundleAudit = path.join(temp, 'bundle-audit');
  for (const skill of [...catalog.skills, ...catalog.aliases]) await packageSkill(root, skill.id, bundleAudit);
  console.log('Installer lifecycle and installed-bundle tests passed (preview, install, update, rollback, uninstall recovery, unmanaged-path protection, aliases, and local links).');
} finally {
  await rm(temp, { recursive: true, force: true });
}

async function mkdirRecursive(target) {
  const fs = await import('node:fs/promises');
  await fs.mkdir(target, { recursive: true });
}

