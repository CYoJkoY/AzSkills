import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { writeSkillZip } from './package-skill.ts';
import { errorCode, readJson } from './runtime.ts';
import type { SkillCatalog } from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const excludedTopLevel = new Set(['.git', 'dist', 'node_modules']);
const requiredPluginFiles = [
  '.codex-plugin/plugin.json',
  'SKILL.md',
  'skills/azskills/SKILL.md',
  'skills/az-clean-code/SKILL.md',
  'az-clean-code/SKILL.md',
  'codex-plugin/hooks/hooks.json',
  'codex-plugin/hooks/session-start.ts',
  'codex-plugin/hooks/godot3-guard.ts',
  'godot-3-dev/scripts/check-godot-3x.ts',
  'godot-3-dev/scripts/godot3-lexical.ts',
  'godot-3-dev/references/api-3.6.json',
  'codex-plugin/taste/hooks/steer.ts',
];

interface PluginPackage {
  marketplace: string;
  plugin: string;
}

interface PluginManifest {
  name: string;
  version: string;
  hooks: string;
  interface: Record<string, string>;
}

export async function packageCodexPlugin(repositoryRoot: string, outputDirectory: string): Promise<PluginPackage> {
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

  const manifest = await readJson<PluginManifest>(path.join(plugin, '.codex-plugin/plugin.json'));
  const registry = await readJson<SkillCatalog>(path.join(plugin, 'skills.json'));
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
  const outputArgument = index >= 0 ? args[index + 1] : undefined;
  if (outputArgument !== undefined && outputArgument.startsWith('--')) throw new Error('--output requires a directory');
  if (index >= 0 && outputArgument === undefined) throw new Error('--output requires a directory');
  const outputRoot = path.resolve(outputArgument ?? path.join(root, 'dist'));
  await mkdir(outputRoot, { recursive: true });
  const destination = path.join(outputRoot, 'azskills-marketplace');
  const archivePath = path.join(outputRoot, 'azskills-plugin.zip');
  for (const target of [destination, archivePath]) {
    try {
      await stat(target);
      throw new Error('Output already exists; choose a fresh directory: ' + target);
    } catch (error) {
      if (errorCode(error) !== 'ENOENT') throw error;
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
