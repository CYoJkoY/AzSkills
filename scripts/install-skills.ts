import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, lstat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildPlugin } from './package-plugin.ts';
import { errorCode, errorMessage, isRecord, readJson } from './runtime.ts';
import type {
  IntegrationRegistry,
  IntegrationTool,
  PluginCatalog,
  RollbackItem,
  RollbackState,
  SkillCatalog,
  SkillManifest,
} from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = (await readJson<IntegrationRegistry>(path.join(root, 'integrations/tools.json'))).tools;
const catalog = await readJson<SkillCatalog>(path.join(root, 'skills.json'));
const pluginCatalog = await readJson<PluginCatalog>(path.join(root, 'catalog/plugins.json'));
const moduleIds = pluginCatalog.plugins.filter((plugin) => plugin.kind === 'module').map((plugin) => plugin.id);
const standaloneIds = new Set(pluginCatalog.plugins.filter((plugin) => plugin.kind === 'standalone').map((plugin) => plugin.id));
const knownIds = new Set(pluginCatalog.plugins.map((plugin) => plugin.id));
const moduleOwners = new Map(pluginCatalog.plugins.flatMap((plugin) => (plugin.modules ?? []).map((module) => [module, plugin.id] as const)));
const aliasTargets = new Map(catalog.aliases.map((alias) => [alias.id, moduleOwners.get(alias.canonical) ?? alias.canonical]));
// A module id or a legacy alias both resolve to the single plugin that installs it.
const pluginTargets = new Map<string, string>([
  ...[...moduleOwners.keys()].map((module) => [module, moduleOwners.get(module) as string] as const),
  ...aliasTargets,
]);
const args = process.argv.slice(2);
const has = (key: string): boolean => args.includes(key);
const value = (key: string, fallback = ''): string => {
  const index = args.indexOf(key);
  if (index < 0) return fallback;
  const next = args[index + 1];
  if (!next || next.startsWith('--')) throw new Error(key + ' requires a value');
  return next;
};
const manifestName = '.azskills-manifest.json';
const backupName = '.azskills-backups';
const safeId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const inside = (base: string, target: string): boolean => {
  const relative = path.relative(base, target);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};
const exists = async (file: string): Promise<boolean> => {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false;
    throw error;
  }
};

async function regularAncestors(file: string): Promise<void> {
  for (let current = path.resolve(file); ; current = path.dirname(current)) {
    if (await exists(current) && (await lstat(current)).isSymbolicLink()) throw new Error('Refusing symbolic ancestor: ' + current);
    if (path.dirname(current) === current) break;
  }
}

async function regularTree(file: string): Promise<void> {
  const info = await lstat(file);
  if (info.isSymbolicLink()) throw new Error('Refusing symbolic path: ' + file);
  if (info.isDirectory()) for (const name of await readdir(file)) await regularTree(path.join(file, name));
  else if (!info.isFile()) throw new Error('Not a regular file: ' + file);
}

async function equalTree(a: string, b: string): Promise<boolean> {
  const [aa, bb] = await Promise.all([lstat(a), lstat(b)]);
  if (aa.isDirectory() !== bb.isDirectory()) return false;
  if (!aa.isDirectory()) return (await readFile(a)).equals(await readFile(b));
  const [an, bn] = await Promise.all([readdir(a), readdir(b)]);
  if (an.length !== bn.length || an.some((name) => !bn.includes(name))) return false;
  for (const name of an) if (!await equalTree(path.join(a, name), path.join(b, name))) return false;
  return true;
}

interface ManifestState {
  ids: string[];
  schemaVersion: SkillManifest['schemaVersion'];
  raw: string | null;
  data: { schemaVersion: SkillManifest['schemaVersion']; lastRun: unknown } | null;
}

function parseManifest(raw: string): { schemaVersion: SkillManifest['schemaVersion']; ids: string[]; lastRun: unknown } {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error('Invalid AzSkills manifest');
  const version = parsed.schemaVersion;
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4) throw new Error('Invalid AzSkills manifest');
  const owned = version === 1 ? parsed.paths : version === 4 ? parsed.plugins : parsed.skills;
  if (!Array.isArray(owned) || !owned.every((id): id is string => safeId(id)) || new Set(owned).size !== owned.length) throw new Error('Invalid AzSkills manifest');
  return { schemaVersion: version, ids: owned, lastRun: parsed.lastRun };
}

async function manifestAt(destination: string): Promise<ManifestState> {
  const file = path.join(destination, manifestName);
  if (!await exists(file)) return { ids: [], schemaVersion: 4, raw: null, data: null };
  await regularTree(file);
  const raw = await readFile(file, 'utf8');
  const data = parseManifest(raw);
  return { ids: data.ids, schemaVersion: data.schemaVersion, raw, data };
}

async function save(destination: string, raw: string | null): Promise<void> {
  const file = path.join(destination, manifestName);
  if (raw === null) { await rm(file, { force: true }); return; }
  const temporary = file + '.tmp-' + process.pid;
  await writeFile(temporary, raw);
  await rename(temporary, file);
}

async function confirm(): Promise<boolean> {
  if (has('--dry-run')) return false;
  if (has('--yes')) return true;
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Review preview and rerun with --yes');
  const rl = createInterface({ input: stdin, output: stdout });
  try { return (await rl.question('Apply these changes? [y/N] ')).trim().toLowerCase() === 'y'; } finally { rl.close(); }
}

const backupBase = (destination: string): string => path.join(path.dirname(destination), '.' + path.basename(destination) + '-azskills-backups');

async function treeHash(file: string): Promise<string> {
  const hash = createHash('sha256');
  const visit = async (current: string, relative: string): Promise<void> => {
    const info = await lstat(current);
    hash.update(JSON.stringify([relative, info.isDirectory() ? 'directory' : 'file', info.isDirectory() ? 0 : info.size]));
    if (info.isDirectory()) for (const name of (await readdir(current)).sort()) await visit(path.join(current, name), relative + '/' + name);
    else hash.update(await readFile(current));
  };
  await regularTree(file);
  await visit(file, '');
  return hash.digest('hex');
}

async function snapshot(destination: string, names: string[], previousManifest: string | null): Promise<RollbackState> {
  const base = backupBase(destination);
  if (await exists(base)) await regularTree(base);
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'run-'));
  const items: RollbackItem[] = [];
  for (const id of names) {
    const source = path.join(destination, id);
    const present = await exists(source);
    if (present) {
      await regularTree(source);
      await cp(source, path.join(directory, id), { recursive: true, errorOnExist: true, force: false });
    }
    items.push({ id, existed: present, hash: present ? await treeHash(path.join(directory, id)) : null });
  }
  if (previousManifest !== null) await writeFile(path.join(directory, 'previous-manifest.json'), previousManifest);
  return { directory, items, hadManifest: previousManifest !== null,
    manifestHash: previousManifest === null ? null : createHash('sha256').update(previousManifest).digest('hex') };
}

async function validateSnapshot(destination: string, state: unknown): Promise<RollbackState> {
  if (!isRecord(state) || typeof state.directory !== 'string' || !inside(backupBase(destination), path.resolve(state.directory)) || !Array.isArray(state.items)) throw new Error('Invalid rollback snapshot');
  await regularTree(backupBase(destination));
  await regularTree(state.directory);
  if (typeof state.hadManifest !== 'boolean') throw new Error('Invalid previous manifest');
  if (state.hadManifest) {
    if (typeof state.manifestHash !== 'string') throw new Error('Invalid previous manifest');
    const previousManifest = await readFile(path.join(state.directory, 'previous-manifest.json'), 'utf8');
    if (createHash('sha256').update(previousManifest).digest('hex') !== state.manifestHash) throw new Error('Previous manifest integrity check failed');
    parseManifest(previousManifest);
  }
  const seen = new Set<string>();
  const items: RollbackItem[] = [];
  for (const item of state.items) {
    if (!isRecord(item) || (!safeId(item.id) && item.id !== backupName) || seen.has(item.id) || typeof item.existed !== 'boolean') throw new Error('Invalid rollback item');
    if (item.hash !== null && typeof item.hash !== 'string') throw new Error('Invalid rollback item');
    seen.add(item.id);
    if (item.existed && await treeHash(path.join(state.directory, item.id)) !== item.hash) throw new Error('Rollback backup integrity check failed: ' + item.id);
    if (await exists(path.join(destination, item.id))) await regularTree(path.join(destination, item.id));
    items.push({ id: item.id, existed: item.existed, hash: item.hash });
  }
  return {
    directory: state.directory,
    items,
    hadManifest: state.hadManifest,
    manifestHash: typeof state.manifestHash === 'string' ? state.manifestHash : null,
  };
}

async function restore(destination: string, state: RollbackState): Promise<void> {
  await validateSnapshot(destination, state);
  for (const item of state.items) {
    const target = path.join(destination, item.id);
    await rm(target, { recursive: true, force: true });
    if (item.existed) await cp(path.join(state.directory, item.id), target, { recursive: true, errorOnExist: true, force: false });
  }
  await save(destination, state.hadManifest ? await readFile(path.join(state.directory, 'previous-manifest.json'), 'utf8') : null);
}

async function maintain(destination: string, action: string, selection: readonly string[], staging: string): Promise<void> {
  destination = path.resolve(destination);
  await regularAncestors(destination);
  await regularAncestors(backupBase(destination));
  if (await exists(destination) && !(await lstat(destination)).isDirectory()) throw new Error('Skills root must be a directory');
  const manifest = await manifestAt(destination);
  const legacy = manifest.schemaVersion < 4;
  for (const name of [...manifest.ids, backupName]) {
    const full = path.join(destination, name);
    if (await exists(full)) await regularTree(full);
  }

  const staged = new Map<string, string>();
  const build = async (id: string): Promise<string> => {
    const cached = staged.get(id);
    if (cached !== undefined) return cached;
    const target = path.join(staging, id);
    if (!await exists(target)) await buildPlugin(root, id, target, 'skill');
    staged.set(id, target);
    return target;
  };

  if (action === 'rollback') {
    const candidate = manifest.data?.lastRun ?? null;
    if (!candidate) throw new Error('No current rollback snapshot; reinstall to create one');
    const state = await validateSnapshot(destination, candidate);
    console.log('Preview: restore ' + state.items.map((item) => item.id).join(', ') + ' at ' + destination);
    if (!await confirm()) return;
    const rescue = await snapshot(destination, state.items.map((item) => item.id), manifest.raw);
    try { await restore(destination, state); } catch (error) { await restore(destination, rescue); throw error; }
    console.log('Rollback complete');
    return;
  }

  if (action === 'verify') {
    if (manifest.schemaVersion !== 4) throw new Error('Installed manifest is not schema 4; run install to migrate');
    if (await exists(path.join(destination, backupName))) throw new Error('Legacy backups remain inside the scan root; run install to migrate them');
    for (const id of manifest.ids) {
      const installed = path.join(destination, id);
      if (!await exists(installed)) throw new Error('Missing managed plugin: ' + id);
      if (!await equalTree(await build(id), installed)) throw new Error('Installed plugin differs from the catalog build: ' + id);
    }
    console.log('PASS: ' + manifest.ids.length + ' managed plugin(s) match the catalog build. Client discovery: PENDING. Invocation: PENDING.');
    return;
  }

  if (action === 'uninstall') {
    const names = [...new Set<string>([...manifest.ids, ...(await exists(path.join(destination, backupName)) ? [backupName] : [])])];
    if (!names.length) { console.log('No managed entries'); return; }
    console.log('Preview: remove managed plugins at ' + destination + ': ' + names.join(', '));
    console.log('Backups: ' + backupBase(destination));
    if (!await confirm()) return;
    await mkdir(destination, { recursive: true });
    const state = await snapshot(destination, names, manifest.raw);
    try {
      for (const id of names) await rm(path.join(destination, id), { recursive: true, force: true });
      await save(destination, JSON.stringify({ schemaVersion: 4, version: catalog.version, plugins: [], lastRun: state }, null, 2) + '\n');
    } catch (error) { await restore(destination, state); throw error; }
    console.log('Completed uninstall; rollback snapshot: ' + state.directory);
    return;
  }

  const selected = [...new Set(selection)];
  const owned = new Set(manifest.ids);
  for (const id of selected) {
    if (!owned.has(id) && await exists(path.join(destination, id))) throw new Error('Refusing to overwrite unmanaged ' + id);
  }
  for (const id of selected) await build(id);

  const backupPresent = await exists(path.join(destination, backupName));
  const sameSelection = !legacy && [...selected].sort().join(',') === [...manifest.ids].sort().join(',');
  if (sameSelection && !backupPresent) {
    let identical = true;
    for (const id of selected) {
      const stagedDir = staged.get(id);
      if (stagedDir === undefined || !await equalTree(stagedDir, path.join(destination, id))) { identical = false; break; }
    }
    if (identical) { console.log('AzSkills plugins are already current'); return; }
  }

  const names = new Set<string>([...manifest.ids, ...selected]);
  if (legacy && await exists(path.join(destination, 'azskills'))) names.add('azskills');
  if (backupPresent) names.add(backupName);

  console.log('Preview: install ' + selected.length + ' plugin(s) at ' + destination + ': ' + selected.join(', '));
  console.log('Replace managed paths: ' + [...names].join(', ') + '; backups: ' + backupBase(destination));
  if (!await confirm()) return;
  await mkdir(destination, { recursive: true });
  const state = await snapshot(destination, [...names], manifest.raw);
  try {
    for (const id of names) await rm(path.join(destination, id), { recursive: true, force: true });
    for (const id of selected) await cp(await build(id), path.join(destination, id), { recursive: true, errorOnExist: true, force: false });
    await save(destination, JSON.stringify({ schemaVersion: 4, version: catalog.version, plugins: selected, lastRun: state }, null, 2) + '\n');
  } catch (error) { await restore(destination, state); throw error; }
  console.log('Completed install; rollback snapshot: ' + state.directory);
}

function selection(): string[] {
  const everything = has('--all-plugins') || has('--all-skills');
  const explicit = everything ? pluginCatalog.plugins.map((plugin) => plugin.id).join(',') : value('--plugin') || value('--skills');
  if (has('--skills') || has('--all-skills')) console.log('Note: --skills and --all-skills are legacy aliases for --plugin and --all-plugins.');
  const requested = explicit ? explicit.split(',').map((id) => id.trim()).filter(Boolean) : moduleIds;
  const expanded = [...new Set(requested.flatMap((id) => {
    if (id === catalog.entry.id) return moduleIds;
    const canonical = pluginTargets.get(id);
    return canonical === undefined ? [id] : [canonical];
  }))];
  const unknown = expanded.filter((id) => !knownIds.has(id));
  if (unknown.length) throw new Error('Unknown plugin: ' + unknown.join(', '));
  for (const id of expanded.filter((id) => standaloneIds.has(id))) {
    console.log(id + ': standalone hook plugin; install it through the Codex plugin marketplace, not a skills root.');
  }
  return expanded.filter((id) => !standaloneIds.has(id));
}

async function main(): Promise<void> {
  if (has('--help') || has('-h')) {
    console.log([
      'AzSkills ' + catalog.version + ': a catalog of independent Codex plugins.',
      'node scripts/install-skills.ts --tool <id> [--mode user|project] [--project <path>] [--target <skills-root>] [--plugin <id,...>|--all-plugins] [--dry-run|--yes]',
      'Bare install (or --all-plugins) installs every module plugin; --plugin selects a subset.',
      'Legacy --skills/--all-skills stay accepted; alias ids resolve to their canonical module.',
      'Maintenance: --verify | --uninstall | --rollback with --target.',
      '--list lists clients; --all selects all clients. Standalone hook plugins install only through the Codex plugin marketplace.',
    ].join('\n'));
    return;
  }
  if (has('--list')) { for (const tool of tools) console.log(tool.id + '\t' + tool.name + '\t' + tool.mechanism); return; }
  const mode = value('--mode', 'user');
  if (!['user', 'project'].includes(mode)) throw new Error('--mode must be user or project');
  const actions = ['--verify', '--uninstall', '--rollback'].filter((flag) => has(flag));
  if (actions.length > 1) throw new Error('Select one maintenance action');
  const firstAction = actions[0];
  const action = firstAction ? firstAction.slice(2) : 'install';
  const selected = action === 'install' ? selection() : [];
  if (action === 'install' && selected.length === 0) {
    console.log('No module plugins selected; nothing to install in a skills root.');
    return;
  }
  let chosen: IntegrationTool[] = has('--all') ? tools : tools.filter((tool) => tool.id === value('--tool'));
  if (has('--tool') && !chosen.length) throw new Error('Unknown client: ' + value('--tool'));
  if (!chosen.length && !has('--target')) {
    if (!stdin.isTTY || !stdout.isTTY) throw new Error('Choose --tool or --target; run --list for clients');
    for (const tool of tools) console.log(tool.id + '\t' + tool.name);
    const rl = createInterface({ input: stdin, output: stdout });
    try { const id = (await rl.question('Client ID: ')).trim(); chosen = tools.filter((tool) => tool.id === id); } finally { rl.close(); }
    if (!chosen.length) throw new Error('Unknown client');
  }
  const managed = (tool: IntegrationTool): boolean => tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills';
  const targets = has('--target') ? [path.resolve(value('--target'))] : chosen.filter(managed).map((tool) => mode === 'project' ? path.resolve(value('--project', process.cwd()), tool.target) : tool.userTarget.startsWith('~/') ? path.join(homedir(), tool.userTarget.slice(2)) : path.resolve(tool.userTarget));
  for (const tool of chosen.filter((candidate) => !managed(candidate))) console.log(tool.name + ': follow integrations/guides/' + tool.id + '.md');
  if (!targets.length) return;
  const staging = await mkdtemp(path.join(tmpdir(), 'azskills-install-'));
  try {
    for (const target of new Set(targets)) await maintain(target, action, selected, staging);
  } finally { await rm(staging, { recursive: true, force: true }); }
}

try { await main(); } catch (error) { console.error('AzSkills installer: ' + errorMessage(error)); process.exitCode = 1; }
