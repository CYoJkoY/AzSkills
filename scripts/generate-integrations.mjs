import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'integrations/tools.json');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));
const check = process.argv.includes('--check');

const labels = {
  'native-skills': 'Native skill folder',
  'shared-skills': 'Shared skills folder',
  manual: 'Manual import',
  mcp: 'MCP server',
};

const guide = (tool) => {
  const lines = [];
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
  lines.push('For an interactive setup, run the guided wizard from the AzSkills checkout:');
  lines.push('');
  lines.push('    node scripts/install-skills.mjs');
  lines.push('');
  lines.push('The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.');
  lines.push('');
  if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push('From the AzSkills checkout, install into a project skill directory:');
    lines.push('');
    lines.push('    node scripts/install-skills.mjs --tool ' + tool.id + ' --mode project --project /path/to/project');
    lines.push('');
    lines.push('Install for the current user instead:');
    lines.push('');
    lines.push('    node scripts/install-skills.mjs --tool ' + tool.id + ' --mode user');
    lines.push('');
    lines.push('Use --target to place the skill folder somewhere other than the default target. Use --dry-run to inspect without writing, --all-skills as a legacy shorthand for the complete AzSkills bundle, --rollback to restore the previous run, and --uninstall to remove only manifest-managed skill directories. Non-interactive writes require --yes after reviewing the preview.');
  } else if (tool.mechanism === 'mcp') {
    lines.push('Run the dependency-free server from the AzSkills checkout:');
    lines.push('');
    lines.push('    node scripts/azskills-mcp.mjs');
    lines.push('');
    lines.push('Register it as a stdio MCP server named azskills. Example configuration:');
    lines.push('');
    lines.push('    {');
    lines.push('      "mcpServers": {');
    lines.push('        "azskills": {');
    lines.push('          "command": "node",');
    lines.push('          "args": ["<AzSkills>/scripts/azskills-mcp.mjs"]');
    lines.push('        }');
    lines.push('      }');
    lines.push('    }');
    lines.push('');
    lines.push(tool.id === 'claude-desktop' ? 'Open the Claude Desktop configuration for MCP servers, paste the entry, and restart the app.' : 'Use the client MCP settings to add the entry, then refresh its tool list.');
  } else {
    lines.push('This client has no verified filesystem skill folder in the repository registry. Import the complete AzSkills bundle manually:');
    lines.push('');
    lines.push('1. Open the client project or workspace settings.');
    lines.push('2. Export azskills.zip and import it using ' + tool.target + ' as the client import destination; retain all supporting files.');
    lines.push('3. Keep the imported copy read-only and re-import after updating AzSkills.');
  }
  lines.push('');
  lines.push('## Use');
  lines.push('');
  if (tool.mechanism === 'mcp') {
    lines.push('After the client connects, call the azskills tool with action entry. Use action route for module selection, action module with id and optional mode to read one contract, or action file with a bundle-relative path to load support files. Discovery lists one tool and one public resource.');
  } else {
    lines.push('Start a session and ask AzSkills for the desired outcome, for example: Use AzSkills to review this architecture. Import the complete azskills.zip or install the azskills folder. Internal modules and legacy names route within this single entry.');
  }
  lines.push('');
  lines.push('## Verify');
  lines.push('');
  lines.push(tool.verify);
  lines.push('');
  if (tool.mechanism === 'manual' || tool.mechanism === 'mcp') {
    lines.push('Confirm the single azskills entry can read references/routing.md and one selected module.');
  }
  lines.push('');
  lines.push('## Remove');
  lines.push('');
  if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push('Use the manifest-based uninstaller so files not owned by AzSkills are preserved:');
    lines.push('');
    lines.push('    node scripts/install-skills.mjs --uninstall --target /path/to/project/' + tool.target);
  } else if (tool.mechanism === 'mcp') {
    lines.push('Remove the azskills MCP server entry from the client settings and restart the client.');
  } else {
    lines.push('Detach or delete the imported instruction copy in the client. No repository files are modified.');
  }
  lines.push('');
  return lines.join('\n');
};

const index = () => {
  const rows = registry.tools.map((tool) => '| [' + tool.name + '](guides/' + tool.id + '.md) | ' + labels[tool.mechanism] + ' | ' + tool.target + ' |');
  return [
    '# Tool integrations',
    '',
    'AzSkills connects to AI tools through four honest mechanisms. A native or shared',
    'skills folder is one copied azskills bundle. An MCP server exposes the same single entry and internal modules',
    'to clients without a skill folder. Manual import is used only where the vendor',
    'workflow is UI-based or not publicly documented for local files.',
    '',
    '| Tool | Mechanism | Default target |',
    '| :--- | :--- | :--- |',
    ...rows,
    '',
    '## Installer',
    '',
    'Start the interactive setup and maintenance wizard:',
    '',
    '    node scripts/install-skills.mjs',
    '',
    'Or select a client and scope explicitly:',
    '',
    '    node scripts/install-skills.mjs --list',
    '    node scripts/install-skills.mjs --tool codex --mode project --project /path/to/project --skills azskills --dry-run',
    '    node scripts/install-skills.mjs --tool codex --mode project --project /path/to/project --skills azskills --yes',
    '    node scripts/package-skill.mjs --skill azskills --output /path/to/exports',
    '    node scripts/install-skills.mjs --rollback --target /path/to/project/.agents/skills --yes',
    '    node scripts/install-skills.mjs --uninstall --target /path/to/project/.agents/skills --yes',
    '',
    'See [tool installers](../scripts/install-skills.mjs) and the [MCP server](../scripts/azskills-mcp.mjs).',
    '',
  ].join('\n');
};

const files = new Map();
files.set(path.join(root, 'integrations/README.md'), index());
for (const tool of registry.tools) files.set(path.join(root, 'integrations/guides', tool.id + '.md'), guide(tool));

await mkdir(path.join(root, 'integrations/guides'), { recursive: true });
let stale = false;
for (const [file, content] of files) {
  let current = null;
  try { current = await readFile(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current === null || current.replace(/\r\n/g, '\n') !== content) {
    stale = true;
    if (!check) await writeFile(file, content, 'utf8');
  }
}
if (check && stale) throw new Error('Generated integration guides are stale. Run node scripts/generate-integrations.mjs');
console.log(check ? 'Integration guides are current.' : 'Generated ' + files.size + ' integration files.');
