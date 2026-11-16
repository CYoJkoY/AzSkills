import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { writeSkillZip } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const excludedTopLevel = new Set(['.git', 'dist', 'node_modules']);
const requiredPluginFiles = [
  '.codex-plugin/plugin.json',
  'SKILL.md',
  'skills/azskills/SKILL.md',
  'skills/az-clean-code/SKILL.md',
  'az-clean-code/SKILL.md',
  'codex-plugin/hooks/hooks.json',
  'codex-plugin/hooks/session-start.mjs',
  'codex-plugin/hooks/godot3-guard.mjs',
  'godot-3-dev/scripts/check-godot-3x.mjs',
  'godot-3-dev/scripts/godot3-lexical.mjs',
  'godot-3-dev/references/api-3.6.json',
  'codex-plugin/taste/hooks/steer.mjs',
];

export async function packageCodexPlugin(repositoryRoot, outputDirectory) {
  const base = path.resolve(repositoryRoot);
  const output = path.resolve(outputDirectory);
  const plugin = path.join(output, 'plugins', 'azskills');

  await mkdir(plugin, { recursive: true });
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (excludedTopLevel.has(entry.name) || entry.name.startsWith('.tmp_')) continue;
    await cp(path.join(base, entry.name), path.join(plugin, entry.name), { recursive: true, errorOnExist: true, force: false });
  }
  for (const required of requiredPluginFiles) {
    const present = await stat(path.join(plugin, required)).then(() => true).catch(() => false);
    if (!present) throw new Error('Plugin package is missing ' + required);
  }

  const manifest = JSON.parse(await readFile(path.join(plugin, '.codex-plugin/plugin.json'), 'utf8'));
  const registry = JSON.parse(await readFile(path.join(plugin, 'skills.json'), 'utf8'));
  if (manifest.name !== 'azskills' || manifest.version !== registry.version) throw new Error('Plugin and AzSkills versions must match');

  const marketplace = {
    name: 'azskills-local',
    interface: { displayName: 'AzSkills' },
    plugins: [{
      name: 'azskills',
      source: { source: 'local', path: './plugins/azskills' },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Productivity',
    }],
  };
  const marketplaceManifest = path.join(output, '.agents', 'plugins', 'marketplace.json');
  await mkdir(path.dirname(marketplaceManifest), { recursive: true });
  await writeFile(marketplaceManifest, JSON.stringify(marketplace, null, 2) + '\n', 'utf8');
  return { marketplace: output, plugin };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const index = args.indexOf('--output');
  const outputRoot = path.resolve(index >= 0 ? args[index + 1] : path.join(root, 'dist'));
  if (index >= 0 && (!args[index + 1] || args[index + 1].startsWith('--'))) throw new Error('--output requires a directory');
  await mkdir(outputRoot, { recursive: true });
  const destination = path.join(outputRoot, 'azskills-marketplace');
  const archivePath = path.join(outputRoot, 'azskills-plugin.zip');
  for (const target of [destination, archivePath]) {
    try {
      await stat(target);
      throw new Error('Output already exists; choose a fresh directory: ' + target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const staging = await mkdtemp(path.join(tmpdir(), 'azskills-plugin-'));
  try {
    const { marketplace, plugin } = await packageCodexPlugin(root, path.join(staging, 'marketplace'));
    await cp(marketplace, destination, { recursive: true });
    const result = await writeSkillZip(plugin, archivePath);
    console.log('Packaged AzSkills Codex plugin and local marketplace: ' + destination);
    console.log('Plugin archive: ' + result.archive + ' (' + result.files + ' files)');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
