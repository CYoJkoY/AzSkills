import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(path.join(root, 'integrations/tools.json'), 'utf8'));
const expectedNames = [
  'Codex', 'Claude', 'Claude Desktop', 'Grok Build', 'Cursor', 'Qoder', 'Qoder CN',
  'WorkBuddy (CN)', 'WorkBuddy AI', 'OpenCode', 'Pi', 'OMP', 'Hermes', 'OpenClaw',
  'Kimi Code', 'gjc', 'DSH', 'MiniMax Code', 'ZCode', 'Command Code', 'Prime Agent',
  'Aside', 'Raycast', 'omo', 'Cline CLI', 'Kilo', 'Factory Droid', 'Gentle Shell', 'T3 Code',
];
const mechanisms = new Set(['native-skills', 'shared-skills', 'manual', 'mcp']);
const errors = [];
const names = registry.tools.map((tool) => tool.name);
const ids = registry.tools.map((tool) => tool.id);

if (registry.tools.length !== expectedNames.length) errors.push('Expected ' + expectedNames.length + ' tools, found ' + registry.tools.length);
for (const name of expectedNames) if (!names.includes(name)) errors.push('Missing tool: ' + name);
for (const name of names) if (!expectedNames.includes(name)) errors.push('Unexpected tool: ' + name);
if (new Set(ids).size !== ids.length) errors.push('Tool ids are not unique');

for (const tool of registry.tools) {
  for (const key of ['id', 'name', 'mechanism', 'target', 'userTarget', 'source', 'verify', 'automation', 'detection']) {
    if (typeof tool[key] !== 'string' || tool[key].trim() === '') errors.push(tool.name + ': missing ' + key);
  }
  if (!mechanisms.has(tool.mechanism)) errors.push(tool.name + ': unknown mechanism ' + tool.mechanism);
  if (!['managed-copy', 'guided-mcp', 'manual-import'].includes(tool.automation)) errors.push(tool.name + ': unknown automation profile ' + tool.automation);
  if (!['target-directory', 'manual'].includes(tool.detection)) errors.push(tool.name + ': unknown detection profile ' + tool.detection);
  if (!Array.isArray(tool.verification) || tool.verification.length !== 3) errors.push(tool.name + ': verification must declare three stages');
  if (tool.configTarget !== null) errors.push(tool.name + ': automatic configuration target requires a dedicated adapter');
  if (['native-skills', 'shared-skills'].includes(tool.mechanism) && (tool.automation !== 'managed-copy' || tool.detection !== 'target-directory')) errors.push(tool.name + ': inconsistent filesystem capability profile');
  if (tool.mechanism === 'mcp' && tool.automation !== 'guided-mcp') errors.push(tool.name + ': MCP setup must be explicitly guided');
  if (tool.mechanism === 'manual' && tool.automation !== 'manual-import') errors.push(tool.name + ': manual setup must be explicit');
  if (!tool.source.startsWith('https://')) errors.push(tool.name + ': source must be an https URL');
  if (!existsSync(path.join(root, 'integrations/guides', tool.id + '.md'))) errors.push(tool.name + ': guide is missing');
}

const check = spawnSync(process.execPath, [path.join(root, 'scripts/generate-integrations.mjs'), '--check'], { encoding: 'utf8' });
if (check.status !== 0) errors.push((check.stderr || check.stdout).trim());

if (errors.length > 0) {
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}
console.log('Integration registry and ' + registry.tools.length + ' generated guides are valid.');
