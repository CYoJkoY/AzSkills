import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { packageSkill, writeSkillZip } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function packageCodexPlugin(repositoryRoot, outputDirectory) {
  const base = path.resolve(repositoryRoot);
  const output = path.resolve(outputDirectory);
  const plugin = path.join(output, 'plugins', 'azskills');
  const skillRoot = path.join(plugin, 'skills', 'azskills');

  await mkdir(path.join(plugin, 'hooks'), { recursive: true });
  await cp(path.join(base, 'codex-plugin/plugin.json'), path.join(plugin, 'plugin.json'));
  await cp(path.join(base, 'codex-plugin/hooks'), path.join(plugin, 'hooks'), { recursive: true });
  await packageSkill(base, 'azskills', path.join(plugin, 'skills'));

  const manifest = JSON.parse(await readFile(path.join(plugin, 'plugin.json'), 'utf8'));
  const registry = JSON.parse(await readFile(path.join(skillRoot, 'skills.json'), 'utf8'));
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
  await writeFile(path.join(output, 'marketplace.json'), JSON.stringify(marketplace, null, 2) + '\n', 'utf8');
  return { marketplace: output, plugin, skillRoot };
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
  const staging = await mkdtemp(path.join(outputRoot, '.azskills-plugin-'));
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
