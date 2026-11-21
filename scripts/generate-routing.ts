import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readJson } from './runtime.ts';
import type { PluginCatalog, SkillCatalog } from './types.ts';

const root = new URL('../', import.meta.url);
const registry = await readJson<SkillCatalog>(fileURLToPath(new URL('skills.json', root)));
const catalog = await readJson<PluginCatalog>(fileURLToPath(new URL('catalog/plugins.json', root)));
const moduleOwners = new Map(catalog.plugins.flatMap(plugin => (plugin.modules ?? []).map(module => [module, plugin.id] as const)));
// Plugins are build output, so the source tree links nothing here; the id is
// enough to install and locate the matching marketplace entry.
const pluginColumn = (moduleId: string) => '`' + moduleOwners.get(moduleId) + '`';
const content = [
  '# AzSkills routing', '',
  'Choose the plugin by the requested job, then select the matching workflow contract inside it.', '',
  '| Plugin | Workflow | Outcome / trigger | Modes |', '| :--- | :--- | :--- | :--- |',
  ...registry.modules.map(m => '| ' + pluginColumn(m.id) + ' | [' + m.id + '](modules/' + m.id + '.md) | ' + m.role + ' | ' + m.modes.join(', ') + ' |'),
  '', '## Legacy names', '',
  'These names stay valid in prompts and issues. Resolve each one to the plugin that owns the canonical module.', '',
  '| Name | Plugin | Workflow | Mode |', '| :--- | :--- | :--- | :--- |',
  ...registry.aliases.map(a => '| ' + a.id + ' | ' + pluginColumn(a.canonical) + ' | [' + a.canonical + '](modules/' + a.canonical + '.md) | ' + a.mode + ' |'), '',
].join('\n');
const output = new URL('references/routing.md', root);
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')).replace(/\r\n/g, '\n') !== content) throw new Error('Routing is stale: run node scripts/generate-routing.ts');
} else await writeFile(output, content);
console.log('Routing is current: ' + fileURLToPath(output));
