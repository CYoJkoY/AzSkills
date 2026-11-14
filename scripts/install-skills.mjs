import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { packageSkill } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(path.join(root, 'integrations/tools.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
const args = process.argv.slice(2);
const has = (key) => args.includes(key);
const value = (key, fallback = '') => { const index = args.indexOf(key); if (index < 0) return fallback; if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(key + ' requires a value'); return args[index + 1]; };
const canonical = catalog.skills.filter((skill) => skill.status === 'canonical');
const aliases = catalog.aliases;
const ids = new Set([...canonical, ...aliases].map((skill) => skill.id));
const recommended = ['tool-integration', 'ultrathink', 'architecture', 'ui-design', 'frontend-slides'].filter((id) => ids.has(id));
const action = has('--uninstall') ? 'uninstall' : has('--rollback') ? 'rollback' : has('--verify') ? 'verify' : 'install';
let installMode = value('--mode', 'user');
if (!['user', 'project'].includes(installMode)) throw new Error('--mode must be user or project');

function targetFor(tool) {
  const explicit = value('--target');
  if (explicit) return path.resolve(explicit);
  if (installMode === 'project') return path.resolve(value('--project', process.cwd()), tool.target);
  return tool.userTarget.startsWith('~/') ? path.join(homedir(), tool.userTarget.slice(2)) : path.resolve(tool.userTarget);
}
async function exists(target) { try { await stat(target); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function manifestAt(destination) {
  try {
    const data = JSON.parse(await readFile(path.join(destination, '.azskills-manifest.json'), 'utf8'));
    if (data.schemaVersion === 1 && Array.isArray(data.paths)) return { schemaVersion: 2, skills: data.paths, lastRun: null };
    if (data.schemaVersion !== 2 || !Array.isArray(data.skills)) throw new Error('Unsupported AzSkills manifest at ' + destination);
    return data;
  } catch (error) { if (error.code === 'ENOENT') return { schemaVersion: 2, skills: [], lastRun: null }; throw error; }
}
async function saveManifest(destination, data) {
  const file = path.join(destination, '.azskills-manifest.json');
  const temporary = file + '.tmp-' + process.pid;
  await writeFile(temporary, JSON.stringify(data, null, 2) + String.fromCharCode(10), 'utf8');
  await rename(temporary, file);
}
async function confirm(message) {
  if (has('--yes')) return true;
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Confirmation required. Review the preview, then rerun with --yes.');
  const rl = createInterface({ input: stdin, output: stdout });
  try { return (await rl.question(message + ' [y/N] ')).trim().toLowerCase() === 'y'; } finally { rl.close(); }
}
async function equalTree(a, b) {
  const [sa, sb] = await Promise.all([stat(a), stat(b)]);
  if (sa.isDirectory() !== sb.isDirectory()) return false;
  if (!sa.isDirectory()) return (await readFile(a)).equals(await readFile(b));
  const [aa, bb] = await Promise.all([readdir(a), readdir(b)]);
  if (aa.length !== bb.length || aa.some((name) => !bb.includes(name))) return false;
  for (const name of aa) if (!await equalTree(path.join(a, name), path.join(b, name))) return false;
  return true;
}
async function skillSelection() {
  const requested = value('--skills');
  let selected = has('--all-skills') ? canonical.map((skill) => skill.id) : requested ? requested.split(',').map((id) => id.trim()).filter(Boolean) : recommended;
  if (!requested && !has('--all-skills') && stdin.isTTY && stdout.isTTY) {
    console.log('Recommended skills: ' + recommended.join(', '));
    console.log('All canonical skills: ' + canonical.map((skill) => skill.id).join(', '));
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const answer = (await rl.question('Skills [Enter=recommended, all, search <term>, or comma-separated IDs]: ')).trim();
      if (answer.toLowerCase() === 'all') selected = canonical.map((skill) => skill.id);
      else if (answer.toLowerCase().startsWith('search ')) {
        const term = answer.slice(7).toLowerCase();
        const matches = canonical.filter((skill) => (skill.id + ' ' + skill.role + ' ' + skill.family).toLowerCase().includes(term));
        for (const skill of matches) console.log(skill.id + ' ' + skill.role);
        selected = (await rl.question('Select skill IDs (comma-separated): ')).split(',').map((id) => id.trim()).filter(Boolean);
      } else if (answer) selected = answer.split(',').map((id) => id.trim()).filter(Boolean);
    } finally { rl.close(); }
  }
  const unknown = selected.filter((id) => !ids.has(id));
  if (unknown.length) throw new Error('Unknown or non-canonical skill id(s): ' + unknown.join(', '));
  if (!selected.length) throw new Error('Select skills with --skills <id,...> or --all-skills');
  return [...new Set(selected)];
}
async function clients() {
  const toolId = value('--tool');
  if (toolId) { const tool = registry.tools.find((item) => item.id === toolId); if (!tool) throw new Error('Unknown client "' + toolId + '". Run --list.'); return [tool]; }
  if (has('--all')) return registry.tools;
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Choose --tool <id> or --all. Run in a terminal without arguments to open the wizard.');
  for (const tool of registry.tools) {
    const target = ['native-skills', 'shared-skills'].includes(tool.mechanism) ? targetFor(tool) : null;
    console.log([tool.id, tool.name, tool.mechanism, target && await exists(target) ? 'candidate path exists' : 'not detected', target ?? tool.target].join('	'));
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question('Client ID (or all): ')).trim();
    if (answer.toLowerCase() === 'all') return registry.tools;
    const matches = registry.tools.filter((tool) => tool.id === answer || tool.name.toLowerCase() === answer.toLowerCase());
    if (matches.length !== 1) throw new Error('Unknown or ambiguous client. Use an ID from --list.');
    return matches;
  } finally { rl.close(); }
}
async function install(destination, selected, packageRoot) {
  const manifest = await manifestAt(destination);
  const changes = [];
  const backupRoot = path.join(destination, '.azskills-backups', new Date().toISOString().replaceAll(':', '-'));
  for (const id of selected) {
    const dest = path.join(destination, id);
    const present = await exists(dest);
    if (present && !manifest.skills.includes(id)) throw new Error('Refusing to overwrite unmanaged path: ' + dest);
    if (present && await equalTree(path.join(packageRoot, id), dest)) continue;
    changes.push({ id, dest, existed: present, backup: present ? path.join(backupRoot, id) : null });
  }
  if (!changes.length) { console.log('Selected skills are already current at ' + destination); return; }
  console.log('Preview:');
  for (const change of changes) console.log((change.existed ? 'Update ' : 'Install ') + change.id + ' -> ' + change.dest);
  console.log('Backup existing managed skills; update .azskills-manifest.json.');
  if (!await confirm('Apply these changes?')) { console.log('Cancelled; no files changed.'); return; }
  await mkdir(destination, { recursive: true });
  const previousSkills = [...manifest.skills];
  const completed = [];
  try {
    for (const change of changes) {
      if (change.existed) { await mkdir(path.dirname(change.backup), { recursive: true }); await cp(change.dest, change.backup, { recursive: true, errorOnExist: true }); }
      completed.push(change);
      if (change.existed) await rm(change.dest, { recursive: true, force: true });
      await cp(path.join(packageRoot, change.id), change.dest, { recursive: true, errorOnExist: true });
    }
    manifest.skills = [...new Set([...manifest.skills, ...changes.map((change) => change.id)])];
    manifest.lastRun = { previousSkills, changes: changes.map(({ id, existed, backup }) => ({ id, existed, backup })) };
    await saveManifest(destination, manifest);
  } catch (error) {
    for (const change of completed.reverse()) { await rm(change.dest, { recursive: true, force: true }); if (change.existed) await cp(change.backup, change.dest, { recursive: true, errorOnExist: true }); }
    throw error;
  }
  console.log('Installed/updated ' + changes.length + ' skill(s). Backups: ' + backupRoot);
}
async function previewInstall(toolName, destination, selected, packageRoot) {
  const manifest = await manifestAt(destination);
  const changes = [];
  for (const id of selected) {
    const dest = path.join(destination, id);
    const present = await exists(dest);
    if (present && !manifest.skills.includes(id)) throw new Error('Refusing to overwrite unmanaged path: ' + dest);
    const unchanged = present && await equalTree(path.join(packageRoot, id), dest);
    if (!unchanged) changes.push({ id, action: present ? 'Update' : 'Install', dest });
  }
  console.log('Preview for ' + toolName + ' -> ' + destination);
  if (!changes.length) console.log('Selected skills are already current.');
  for (const change of changes) console.log(change.action + ' ' + change.id + ' -> ' + change.dest);
  if (changes.length) console.log('Each bundle includes linked support files under _azskills-support.');
  console.log('No files changed (--dry-run).');
}
async function uninstall(destination) {
  const manifest = await manifestAt(destination);
  if (!manifest.skills.length) throw new Error('No AzSkills manifest found at ' + destination);
  console.log('Preview: remove only managed skill directories: ' + manifest.skills.join(', '));
  if (!await confirm('Uninstall these copies?')) { console.log('Cancelled; no files changed.'); return; }
  const previousSkills = [...manifest.skills];
  const backupRoot = path.join(destination, '.azskills-backups', new Date().toISOString().replaceAll(':', '-'));
  const changes = previousSkills.map((id) => ({ id, existed: true, backup: path.join(backupRoot, id) }));
  const completed = [];
  try {
    for (const change of changes) {
      if (!ids.has(change.id)) throw new Error('Unknown skill in manifest; refusing removal: ' + change.id);
      const source = path.join(destination, change.id);
      if (!await exists(source)) throw new Error('Managed skill is missing; refusing uninstall: ' + source);
      await mkdir(path.dirname(change.backup), { recursive: true });
      await cp(source, change.backup, { recursive: true, errorOnExist: true });
      completed.push(change);
      await rm(source, { recursive: true });
    }
    manifest.skills = [];
    manifest.lastRun = { previousSkills, changes };
    await saveManifest(destination, manifest);
  } catch (error) {
    for (const change of completed.reverse()) {
      const source = path.join(destination, change.id);
      await rm(source, { recursive: true, force: true });
      await cp(change.backup, source, { recursive: true, errorOnExist: true });
    }
    throw error;
  }
  console.log('Removed managed skills. Roll back with --rollback --target <directory>; backups: ' + backupRoot);
}
async function rollback(destination) {
  const manifest = await manifestAt(destination);
  if (!manifest.lastRun?.changes?.length) throw new Error('No rollback record found at ' + destination);
  console.log('Preview: restore ' + manifest.lastRun.changes.map((change) => change.id).join(', '));
  if (!await confirm('Rollback the last AzSkills operation?')) { console.log('Cancelled; no files changed.'); return; }
  const original = structuredClone(manifest);
  const restorePoints = [];
  try {
    for (const change of [...manifest.lastRun.changes].reverse()) {
      const dest = path.join(destination, change.id);
      const existed = await exists(dest);
      const restore = path.join(destination, '.azskills-backups', 'rollback-' + process.pid, change.id);
      if (existed) { await mkdir(path.dirname(restore), { recursive: true }); await cp(dest, restore, { recursive: true, errorOnExist: true }); }
      restorePoints.push({ id: change.id, existed, restore });
      await rm(dest, { recursive: true, force: true });
      if (change.existed) await cp(change.backup, dest, { recursive: true, errorOnExist: true });
    }
    manifest.skills = manifest.lastRun.previousSkills;
    manifest.lastRun = null;
    await saveManifest(destination, manifest);
  } catch (error) {
    for (const point of restorePoints.reverse()) {
      const dest = path.join(destination, point.id);
      await rm(dest, { recursive: true, force: true });
      if (point.existed) await cp(point.restore, dest, { recursive: true, errorOnExist: true });
    }
    await saveManifest(destination, original);
    throw error;
  }
  console.log('Rollback complete.');
}
async function verify(tool, destination, selected) {
  console.log('Verification for ' + tool.name + ':');
  if (['native-skills', 'shared-skills'].includes(tool.mechanism)) {
    const manifest = await manifestAt(destination);
    const missing = [];
    for (const id of selected) if (!manifest.skills.includes(id) || !await exists(path.join(destination, id))) missing.push(id);
    console.log((missing.length ? 'FAIL' : 'PASS') + ' filesystem: ' + (missing.length ? 'missing ' + missing.join(', ') : selected.length + ' skill(s) present and managed'));
    if (!missing.length) console.log('PASS bundle contents: linked support files are packaged under _azskills-support.');
    console.log('PENDING client discovery: ' + tool.verify);
    console.log('PENDING minimal invocation: ask the client to use one selected skill.');
    if (missing.length) process.exitCode = 1;
  } else {
    console.log('PENDING ' + (tool.mechanism === 'mcp' ? 'MCP connection' : 'manual import') + ': follow integrations/guides/' + tool.id + '.md');
    console.log('PENDING client discovery and minimal invocation: ' + tool.verify);
  }
}

async function main() {
  if (has('--help') || has('-h')) {
    console.log(['AzSkills setup wizard', '', 'Usage: node scripts/install-skills.mjs [--tool <id>|--all] [--mode user|project] [--project <path>] [--skills <id,...>|--all-skills] [--dry-run] [--yes]', '       node scripts/install-skills.mjs --list', '       node scripts/install-skills.mjs --verify --tool <id> [--target <directory>] [--skills <id,...>]', '       node scripts/install-skills.mjs --rollback --target <directory> [--yes]', '       node scripts/install-skills.mjs --uninstall --target <directory> [--yes]', '', 'Default selection: recommended skills. --all-skills selects every canonical Skill. Writes preview and require confirmation; --yes confirms non-interactive runs.'].join(String.fromCharCode(10)));
    return;
  }
  if (has('--list')) {
    for (const tool of registry.tools) { const dest = ['native-skills', 'shared-skills'].includes(tool.mechanism) ? targetFor(tool) : null; console.log([tool.id, tool.name, tool.mechanism, dest && await exists(dest) ? 'candidate path exists' : 'not detected', dest ?? tool.target].join('	')); }
    return;
  }
  if (!args.includes('--mode') && stdin.isTTY && stdout.isTTY && action === 'install') {
    const rl = createInterface({ input: stdin, output: stdout });
    try { installMode = (await rl.question('Install scope [user/project, default user]: ')).trim().toLowerCase() || 'user'; }
    finally { rl.close(); }
    if (!['user', 'project'].includes(installMode)) throw new Error('Scope must be user or project');
  }
  if (action === 'rollback' || action === 'uninstall') {
    const explicitTarget = value('--target');
    if (!explicitTarget) throw new Error(action + ' requires --target <directory>.');
    const destination = path.resolve(explicitTarget);
    if (action === 'rollback') await rollback(destination);
    else await uninstall(destination);
    return;
  }
  const selectedTools = await clients();
  const filesystemTools = selectedTools.filter((tool) => ['native-skills', 'shared-skills'].includes(tool.mechanism));
  if (action !== 'install') {
    if (filesystemTools.length !== 1) throw new Error('Choose exactly one filesystem client for verification, rollback, or uninstall.');
    const tool = filesystemTools[0]; const destination = targetFor(tool);
    if (action === 'verify') await verify(tool, destination, await skillSelection());
    if (action === 'rollback') await rollback(destination);
    if (action === 'uninstall') await uninstall(destination);
    return;
  }
  const selectedSkills = await skillSelection();
  for (const tool of selectedTools.filter((item) => !filesystemTools.includes(item))) {
    console.log(tool.name + ' (' + tool.mechanism + '): automatic local install is not registered.');
    console.log('Follow integrations/guides/' + tool.id + '.md');
    if (tool.mechanism === 'mcp') console.log('Server command: node ' + path.join(root, 'scripts/azskills-mcp.mjs'));
  }
  const packageRoot = await mkdtemp(path.join(tmpdir(), 'azskills-packages-'));
  try {
    for (const id of selectedSkills) await packageSkill(root, id, packageRoot);
    for (const tool of filesystemTools) {
      const destination = targetFor(tool);
      if (has('--dry-run')) await previewInstall(tool.name, destination, selectedSkills, packageRoot);
      else { await install(destination, selectedSkills, packageRoot); await verify(tool, destination, selectedSkills); }
    }
  } finally { await rm(packageRoot, { recursive: true, force: true }); }
  console.log('Selected skills: ' + selectedSkills.join(', '));
}
try { await main(); } catch (error) { console.error('AzSkills setup failed: ' + error.message); process.exitCode = 1; }
