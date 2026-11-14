import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('skills.json', root), 'utf8'));
const content = [
  '# AzSkills routing', '',
  'Choose by the requested output. These are internal modules, not installable skills.', '',
  '| Module | Outcome / trigger | Modes |', '| :--- | :--- | :--- |',
  ...registry.modules.map(m => '| [' + m.id + '](modules/' + m.id + '.md) | ' + m.role + ' | ' + m.modes.join(', ') + ' |'),
  '', '## Legacy names', '',
  'Resolve these names inside AzSkills. Do not install additional entrypoints.', '',
  '| Name | Module | Mode |', '| :--- | :--- | :--- |',
  ...registry.aliases.map(a => '| ' + a.id + ' | [' + a.canonical + '](modules/' + a.canonical + '.md) | ' + a.mode + ' |'), '',
].join('\n');
const output = new URL('references/routing.md', root);
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')).replace(/\r\n/g, '\n') !== content) throw new Error('Routing is stale: run node scripts/generate-routing.mjs');
} else await writeFile(output, content);
console.log('Routing is current: ' + fileURLToPath(output));
