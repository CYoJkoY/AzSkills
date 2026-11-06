import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(path.join(root, 'integrations/tools.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
const args = process.argv.slice(2);
const has = (key) => args.includes(key);
const value = (key, fallback) => { const index = args.indexOf(key); return index < 0 ? fallback : args[index + 1]; };
const mode = value('--mode', 'user');
if (mode !== 'user' && mode !== 'project') throw new Error('--mode must be user or project');

const resolveTarget = (tool) => {
  const explicit = value('--target', '');
  if (explicit) return path.resolve(explicit);
  if (mode === 'project') return path.resolve(value('--project', process.cwd()), tool.target);
  if (tool.userTarget.startsWith('~/')) return path.join(homedir(), tool.userTarget.slice(2));
  return path.resolve(tool.userTarget);
};

const readManifest = async (destination) => {
  try { return JSON.parse(await readFile(path.join(destination, '.azskills-manifest.json'), 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, paths: [] };
    throw error;
  }
};

const installInto = async (destination, dryRun) => {
  const manifest = await readManifest(destination);
  const additions = catalog.skills.map((skill) => skill.id).filter((id) => !manifest.paths.includes(id));
  for (const id of additions) console.log((dryRun ? 'Would install ' : 'Install ') + id + ' -> ' + path.join(destination, id));
  if (dryRun || additions.length === 0) return;
  await mkdir(destination, { recursive: true });
  const existing = await readdir(destination);
  for (const id of additions) {
    if (existing.includes(id)) throw new Error('Refusing to overwrite unmanaged path: ' + path.join(destination, id));
    await cp(path.join(root, id), path.join(destination, id), { recursive: true, errorOnExist: true });
  }
  manifest.paths.push(...additions);
  await writeFile(path.join(destination, '.azskills-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
};

if (has('--list')) {
  for (const tool of registry.tools) console.log([tool.id, tool.name, tool.mechanism, tool.target, tool.userTarget].join('\t'));
  process.exit(0);
}

if (has('--uninstall')) {
  const destination = path.resolve(value('--target', path.join(process.cwd(), '.agents/skills')));
  const manifest = await readManifest(destination);
  if (manifest.paths.length === 0) throw new Error('No AzSkills manifest found at ' + destination);
  for (const entry of manifest.paths) await rm(path.resolve(destination, entry), { recursive: true, force: true });
  await rm(path.join(destination, '.azskills-manifest.json'), { force: true });
  console.log('Removed ' + manifest.paths.length + ' managed skills from ' + destination);
  process.exit(0);
}

const request = value('--tool', '');
const selected = has('--all') ? registry.tools : registry.tools.filter((tool) => tool.id === request);
if (selected.length === 0) throw new Error('Select a known --tool <id> or use --all');

const installable = selected.filter((tool) => tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills');
for (const tool of selected.filter((item) => item.mechanism === 'manual' || item.mechanism === 'mcp')) {
  console.log(tool.name + ': ' + (tool.mechanism === 'mcp'
    ? 'Start scripts/azskills-mcp.mjs as an MCP stdio server.'
    : 'Import or attach the repository SKILL.md files through the client documented workflow.'));
}

const dryRun = has('--dry-run');
const explicitTarget = value('--target', '');
if (explicitTarget) {
  if (installable.length > 0) await installInto(path.resolve(explicitTarget), dryRun);
} else {
  const destinations = new Map();
  for (const tool of installable) destinations.set(resolveTarget(tool), true);
  for (const destination of destinations.keys()) await installInto(destination, dryRun);
}
