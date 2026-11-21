import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorCode, readJson } from './runtime.ts';
import type { IntegrationMechanism, IntegrationRegistry, IntegrationTool, PluginCatalog } from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'integrations/tools.json');
const registry = await readJson<IntegrationRegistry>(registryPath);
const catalog = await readJson<PluginCatalog>(path.join(root, 'catalog/plugins.json'));
const check = process.argv.includes('--check');
const workflowIds = catalog.plugins.filter((entry) => entry.kind === 'module').map((entry) => entry.id);
const pluginCount = catalog.plugins.length;

const labels: Record<IntegrationMechanism, string> = {
  'native-skills': 'Native skill folders',
  'shared-skills': 'Shared skill folders',
  'codex-plugin': 'Codex plugin marketplace',
  manual: 'Manual import',
  mcp: 'MCP server',
};

const wizard = (scope: string): string[] => [
  'For an interactive setup, run the guided wizard from the AzSkills checkout:',
  '',
  '    node scripts/install-skills.ts',
  '',
  'The wizard asks for a client ID and defaults to ' + scope + '. Pass --mode project for project scope.',
];

const guide = (tool: IntegrationTool): string => {
  const lines: string[] = [];
  lines.push('# ' + tool.name);
  lines.push('');
  lines.push('[Back to integrations](../README.md) | [Repository README](../../README.md)');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| :--- | :--- |');
  lines.push('| Connection | ' + labels[tool.mechanism] + ' |');
  lines.push('| Project target | ' + tool.target + ' |');
  lines.push('| User target | ' + tool.userTarget + ' |');
  lines.push('| Automation | ' + tool.automation + ' |');
  lines.push('| Detection | ' + tool.detection + ' |');
  lines.push('| Verification stages | ' + tool.verification.join(' → ') + ' |');
  lines.push('| Source | ' + tool.source + ' |');
  lines.push('');
  lines.push('## Install');
  lines.push('');
  if (tool.mechanism === 'codex-plugin') {
    lines.push('Build the catalog marketplace from the AzSkills checkout, then add it to Codex:');
    lines.push('');
    lines.push('    node scripts/package-plugin.ts --output /path/to/fresh/exports');
    lines.push('    codex plugin marketplace add /path/to/fresh/exports/azskills-marketplace');
    lines.push('');
    lines.push('The repository root publishes the built catalog, so the Git source can be added directly without building first:');
    lines.push('');
    lines.push('    codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git');
    lines.push('');
    lines.push('AzSkills is a catalog, not one plugin. The marketplace lists ' + pluginCount + ' independent plugins, each with its own `.codex-plugin/plugin.json`, skill entry, and reference closure:');
    lines.push('');
    lines.push('- Workflow plugins: ' + workflowIds.join(', ') + '.');
    lines.push('- Hook plugins: no-think-tags and empty-reply, each a Stop-hook backstop for answer hygiene.');
    lines.push('');
    lines.push('Install the plugins the project needs. Each plugin is matched on its own description, so a capability no longer depends on one shared dispatcher entry. Hooks ship only with `operations` (taste steering) and `godot-3-dev` (Godot 3.x write guard), plus the two hook plugins; review and trust them when prompted. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces.');
    lines.push('');
    lines.push('When upgrading from an earlier release, remove the old marketplace, add the Git source again, and reinstall the selected plugins. Confirm each installed plugin reports 5.0.0 or later; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes a hook manifest or a bundled script marks those hooks for review again. Open the hook list (or `/hooks` in the CLI) to review and trust the handlers, then start a new session.');
  } else if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push(...wizard('user scope'));
    lines.push('');
    lines.push('Install a subset of the catalog into a project skill directory:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --tool ' + tool.id + ' --mode project --project /path/to/project --plugin engineering,design');
    lines.push('');
    lines.push('Install every workflow plugin instead:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --tool ' + tool.id + ' --mode project --project /path/to/project --all-plugins');
    lines.push('');
    lines.push('Install for the current user instead:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --tool ' + tool.id + ' --mode user --plugin engineering');
    lines.push('');
    lines.push('Each selected plugin becomes its own `<skills-root>/<id>/SKILL.md` with its own reference closure, so clients discover them independently. Use --target to choose another skills root, --dry-run to inspect without writing, --rollback to restore the previous run, and --uninstall to remove only manifest-managed plugin directories. Non-interactive writes require --yes after reviewing the preview. The hook plugins no-think-tags and empty-reply are skipped here; install them through the Codex plugin marketplace.');
  } else if (tool.mechanism === 'mcp') {
    lines.push(...wizard('user scope'));
    lines.push('');
    lines.push('Run the dependency-free server from the AzSkills checkout:');
    lines.push('');
    lines.push('    node scripts/azskills-mcp.ts');
    lines.push('');
    lines.push('Register it as a stdio MCP server named azskills. Example configuration:');
    lines.push('');
    lines.push('    {');
    lines.push('      "mcpServers": {');
    lines.push('        "azskills": {');
    lines.push('          "command": "node",');
    lines.push('          "args": ["<AzSkills>/scripts/azskills-mcp.ts"]');
    lines.push('        }');
    lines.push('      }');
    lines.push('    }');
    lines.push('');
    lines.push(tool.id === 'claude-desktop' ? 'Open the Claude Desktop configuration for MCP servers, paste the entry, and restart the app.' : 'Use the client MCP settings to add the entry, then refresh its tool list.');
  } else {
    lines.push(...wizard('user scope'));
    lines.push('');
    lines.push('This client has no verified filesystem skill folder in the repository registry. Export the plugin archives and import the ones you need:');
    lines.push('');
    lines.push('    node scripts/package-plugin.ts --output /path/to/fresh/exports');
    lines.push('');
    lines.push('1. Open the client project or workspace settings.');
    lines.push('2. Import the archives from /path/to/fresh/exports/zips using ' + tool.target + ' as the client import destination; retain all supporting files.');
    lines.push('3. Keep the imported copies read-only and re-import after updating AzSkills.');
  }
  lines.push('');
  lines.push('## Use');
  lines.push('');
  if (tool.mechanism === 'codex-plugin') {
    lines.push('Start a new Codex session and make a request covered by an installed plugin without naming it. The matching plugin is selected by its own description; no shared routing hook is involved.');
  } else if (tool.mechanism === 'mcp') {
    lines.push('After the client connects, call the azskills tool with action catalog to list plugins, action plugin with id to read one plugin entry, or action module and action file to read a contract and its support files. Resources: azskills://catalog and azskills://plugins/<id>[/<path>].');
  } else {
    lines.push('Start a session and make a request covered by an installed plugin, for example: review this architecture. Each installed plugin is its own entry; member contracts and aliases such as frontend-architecture remain prompt and issue vocabulary for the owning plugin.');
  }
  lines.push('');
  lines.push('## Verify');
  lines.push('');
  lines.push(tool.verify);
  lines.push('');
  if (tool.mechanism === 'manual' || tool.mechanism === 'mcp') {
    lines.push('Confirm each imported entry reads its own contract and that catalog/plugins.json lists every plugin you installed.');
  }
  lines.push('');
  lines.push('## Remove');
  lines.push('');
  if (tool.mechanism === 'codex-plugin') {
    lines.push('Uninstall the plugins you no longer need in Codex, then remove the marketplace with `codex plugin marketplace remove azskills-local` when it is no longer used.');
  } else if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push('Use the manifest-based uninstaller so files not owned by AzSkills are preserved:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --uninstall --target /path/to/project/' + tool.target);
  } else if (tool.mechanism === 'mcp') {
    lines.push('Remove the azskills MCP server entry from the client settings and restart the client.');
  } else {
    lines.push('Detach or delete the imported instruction copies in the client. No repository files are modified.');
  }
  lines.push('');
  return lines.join('\n');
};

const index = () => {
  const rows = registry.tools.map((tool) => '| [' + tool.name + '](guides/' + tool.id + '.md) | ' + labels[tool.mechanism] + ' | ' + tool.target + ' |');
  return [
    '# Tool integrations',
    '',
    'AzSkills connects to AI tools through native skills, Codex plugins, MCP servers, and manual import.',
    'AzSkills is a catalog of ' + pluginCount + ' independent plugins. Skill folders install the workflow plugins individually, the Codex marketplace installs any plugin including the hook plugins, and the MCP server exposes the catalog to clients without a skill folder.',
    'Manual import is used only where the vendor workflow is UI-based or not publicly documented for local files.',
    '',
    '| Tool | Mechanism | Default target |',
    '| :--- | :--- | :--- |',
    ...rows,
    '',
    '## Installer',
    '',
    'Start the interactive setup and maintenance wizard:',
    '',
    '    node scripts/install-skills.ts',
    '',
    'Or select a client, scope, and plugins explicitly:',
    '',
    '    node scripts/install-skills.ts --list',
    '    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin engineering,design --dry-run',
    '    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --plugin engineering,design --yes',
    '    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --all-plugins --yes',
    '    node scripts/package-plugin.ts --output /path/to/fresh/exports',
    '    node scripts/install-skills.ts --rollback --target /path/to/project/.agents/skills --yes',
    '    node scripts/install-skills.ts --uninstall --target /path/to/project/.agents/skills --yes',
    '',
    'See [tool installers](../scripts/install-skills.ts), the [plugin packager](../scripts/package-plugin.ts), and the [MCP server](../scripts/azskills-mcp.ts).',
    '',
  ].join('\n');
};

const files = new Map<string, string>();
files.set(path.join(root, 'integrations/README.md'), index());
for (const tool of registry.tools) files.set(path.join(root, 'integrations/guides', tool.id + '.md'), guide(tool));

await mkdir(path.join(root, 'integrations/guides'), { recursive: true });
let stale = false;
for (const [file, content] of files) {
  let current = null;
  try { current = await readFile(file, 'utf8'); } catch (error) { if (errorCode(error) !== 'ENOENT') throw error; }
  if (current === null || current.replace(/\r\n/g, '\n') !== content) {
    stale = true;
    if (!check) await writeFile(file, content, 'utf8');
  }
}
if (check && stale) throw new Error('Generated integration guides are stale. Run node scripts/generate-integrations.ts');
console.log(check ? 'Integration guides are current.' : 'Generated ' + files.size + ' integration files.');
