import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, lstat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { packageSkill } from './package-skill.ts';
import { errorCode, errorMessage, readJson } from './runtime.ts';
import type { IntegrationRegistry, IntegrationTool, RollbackItem, RollbackState, SkillCatalog, SkillManifest } from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = (await readJson<IntegrationRegistry>(path.join(root, 'integrations/tools.json'))).tools;
const catalog = await readJson<SkillCatalog>(path.join(root, 'skills.json'));
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
  skills: string[];
  raw: string | null;
  data: SkillManifest | null;
}

async function manifestAt(destination: string): Promise<ManifestState> {
  const file = path.join(destination, manifestName);
  if (!await exists(file)) return { skills: [], raw: null, data: null };
  await regularTree(file);
  const raw = await readFile(file, 'utf8');
  // The narrow cast is safe because schema and ownership fields are validated below.
  const data = JSON.parse(raw) as SkillManifest;
  const skills = data.schemaVersion === 1 ? data.paths : data.skills;
  const validVersion = data.schemaVersion === 1 || data.schemaVersion === 2 || data.schemaVersion === 3;
  if (!validVersion || !Array.isArray(skills) || skills.some((id) => !safeId(id)) || new Set(skills).size !== skills.length) throw new Error('Invalid AzSkills manifest');
  return { skills, raw, data };
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

async function validateSnapshot(destination: string, state: RollbackState): Promise<void> {
  if (!state || typeof state.directory !== 'string' || !inside(backupBase(destination), path.resolve(state.directory)) || !Array.isArray(state.items)) throw new Error('Invalid rollback snapshot');
  await regularTree(backupBase(destination));
  await regularTree(state.directory);
  if (typeof state.hadManifest !== 'boolean') throw new Error('Invalid previous manifest');
  if (state.hadManifest) {
    const previousManifest = await readFile(path.join(state.directory, 'previous-manifest.json'), 'utf8');
    if (createHash('sha256').update(previousManifest).digest('hex') !== state.manifestHash) throw new Error('Previous manifest integrity check failed');
    // The narrow cast is safe because schema and ownership fields are validated below.
    const prior = JSON.parse(previousManifest) as SkillManifest;
    const ids = prior.schemaVersion === 1 ? prior.paths : prior.skills;
    if (!(prior.schemaVersion === 1 || prior.schemaVersion === 2 || prior.schemaVersion === 3) || !Array.isArray(ids) || ids.some((id) => !safeId(id))) throw new Error('Invalid previous ownership');
  }
  const seen = new Set<string>();
  for (const item of state.items) {
    if ((!safeId(item.id) && item.id !== backupName) || seen.has(item.id) || typeof item.existed !== 'boolean') throw new Error('Invalid rollback item');
    seen.add(item.id);
    if (item.existed && await treeHash(path.join(state.directory, item.id)) !== item.hash) throw new Error('Rollback backup integrity check failed: ' + item.id);
    if (await exists(path.join(destination, item.id))) await regularTree(path.join(destination, item.id));
  }
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

async function maintain(destination: string, action: string, packaged: string | null): Promise<void> {
  const bundle = (): string => {
    if (packaged === null) throw new Error('Missing packaged bundle for ' + action);
    return packaged;
  };
  destination = path.resolve(destination);
  await regularAncestors(destination);
  await regularAncestors(backupBase(destination));
  if (await exists(destination) && !(await lstat(destination)).isDirectory()) throw new Error('Skills root must be a directory');
  const manifest = await manifestAt(destination);
  for (const id of [...manifest.skills, backupName]) {
    const owned = path.join(destination, id);
    if (await exists(owned)) await regularTree(owned);
  }
  if (action === 'rollback') {
    const state = manifest.data?.schemaVersion === 3 ? manifest.data.lastRun : null;
    if (!state) throw new Error('No current rollback snapshot; use the previous installer for legacy rollback records');
    await validateSnapshot(destination, state);
    console.log('Preview: restore ' + state.items.map((item) => item.id).join(', ') + ' at ' + destination);
    if (!await confirm()) return;
    const rescue = await snapshot(destination, state.items.map((item) => item.id), manifest.raw);
    try { await restore(destination, state); } catch (error) { await restore(destination, rescue); throw error; }
    console.log('Rollback complete');
    return;
  }
  if (action === 'verify') {
    if (manifest.skills.join(',') !== 'azskills' || !await exists(path.join(destination, 'azskills')) || !await equalTree(bundle(), path.join(destination, 'azskills'))) throw new Error('Installed AzSkills differs from the complete bundle');
    if (await exists(path.join(destination, backupName))) throw new Error('Legacy backups remain inside the scan root; run install to migrate them');
    console.log('PASS: complete bundle contents and single managed entry. Client discovery: PENDING. Invocation: PENDING.');
    return;
  }
  const names = [...new Set([...manifest.skills, ...(action === 'install' ? ['azskills'] : [])])];
  if (await exists(path.join(destination, backupName))) names.push(backupName);
  if (action === 'install' && await exists(path.join(destination, 'azskills')) && !manifest.skills.includes('azskills')) throw new Error('Refusing to overwrite unmanaged azskills');
  if (action === 'install' && manifest.skills.join(',') === 'azskills' && !names.includes(backupName) && await exists(path.join(destination, 'azskills')) && await equalTree(bundle(), path.join(destination, 'azskills'))) { console.log('AzSkills is already current'); return; }
  if (!names.length) { console.log('No managed entries'); return; }
  console.log('Preview: ' + action + ' one azskills entry at ' + destination);
  console.log('Replace managed paths: ' + names.join(', ') + '; backups: ' + backupBase(destination));
  if (!await confirm()) return;
  await mkdir(destination, { recursive: true });
  const state = await snapshot(destination, names, manifest.raw);
  try {
    for (const id of names) await rm(path.join(destination, id), { recursive: true, force: true });
    if (action === 'install') await cp(bundle(), path.join(destination, 'azskills'), { recursive: true, errorOnExist: true, force: false });
    await save(destination, JSON.stringify({ schemaVersion: 3, version: catalog.version, skills: action === 'install' ? ['azskills'] : [], lastRun: state }, null, 2) + '\n');
  } catch (error) { await restore(destination, state); throw error; }
  console.log('Completed ' + action + '; rollback snapshot: ' + state.directory);
}

async function main(): Promise<void> {
  if (has('--help') || has('-h')) { console.log('AzSkills 2.7.1: one entry, all internal modules.\nnode scripts/install-skills.ts --tool <id> [--mode user|project] [--project <path>] [--target <skills-root>] [--dry-run|--yes]\nMaintenance: --verify | --uninstall | --rollback with --target.\n--list lists clients; --all selects all clients. Legacy --skills and --all-skills always install the full bundle.'); return; }
  if (has('--list')) { for (const tool of tools) console.log(tool.id + '\t' + tool.name + '\t' + tool.mechanism); return; }
  const known = new Set<string>(['azskills', ...catalog.modules.map((module) => module.id), ...catalog.aliases.map((alias) => alias.id)]);
  if (value('--skills').split(',').filter(Boolean).some((id) => !known.has(id.trim()))) throw new Error('Unknown module selection');
  if (has('--skills') || has('--all-skills')) console.log('Legacy selection maps to one complete azskills entry.');
  const mode = value('--mode', 'user');
  if (!['user', 'project'].includes(mode)) throw new Error('--mode must be user or project');
  const actions = ['--verify', '--uninstall', '--rollback'].filter((flag) => has(flag));
  if (actions.length > 1) throw new Error('Select one maintenance action');
  const firstAction = actions[0];
  const action = firstAction ? firstAction.slice(2) : 'install';
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
    const packaged = action === 'install' || action === 'verify' ? await packageSkill(root, 'azskills', staging) : null;
    for (const target of new Set(targets)) await maintain(target, action, packaged);
  } finally { await rm(staging, { recursive: true, force: true }); }
}

try { await main(); } catch (error) { console.error('AzSkills installer: ' + errorMessage(error)); process.exitCode = 1; }
