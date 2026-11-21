import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readJson } from './runtime.ts';
import type { SkillCatalog } from './types.ts';

const root = new URL('../', import.meta.url);
const registry = await readJson<SkillCatalog>(fileURLToPath(new URL('skills.json', root)));
const content = [
  '# AzSkills routing', '',
  'Choose by the requested output. Each row is an independent plugin in the catalog, and the linked contract is the workflow that plugin ships.', '',
  '| Plugin | Outcome / trigger | Modes |', '| :--- | :--- | :--- |',
  ...registry.modules.map(m => '| [' + m.id + '](modules/' + m.id + '.md) | ' + m.role + ' | ' + m.modes.join(', ') + ' |'),
  '', '## Legacy names', '',
  'These names stay valid in prompts and issues. Resolve each one to the plugin that owns the canonical module.', '',
  '| Name | Plugin | Mode |', '| :--- | :--- | :--- |',
  ...registry.aliases.map(a => '| ' + a.id + ' | [' + a.canonical + '](modules/' + a.canonical + '.md) | ' + a.mode + ' |'), '',
].join('\n');
const output = new URL('references/routing.md', root);
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')).replace(/\r\n/g, '\n') !== content) throw new Error('Routing is stale: run node scripts/generate-routing.ts');
} else await writeFile(output, content);
console.log('Routing is current: ' + fileURLToPath(output));
