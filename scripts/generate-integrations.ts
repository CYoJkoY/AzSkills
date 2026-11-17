import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorCode, readJson } from './runtime.ts';
import type { IntegrationMechanism, IntegrationRegistry, IntegrationTool } from './types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'integrations/tools.json');
const registry = await readJson<IntegrationRegistry>(registryPath);
const check = process.argv.includes('--check');

const labels: Record<IntegrationMechanism, string> = {
  'native-skills': 'Native skill folder',
  'shared-skills': 'Shared skills folder',
  'codex-plugin': 'Codex plugin with session hook',
  manual: 'Manual import',
  mcp: 'MCP server',
};

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
    lines.push('Add the repository as a Git marketplace, or build a local marketplace from the AzSkills checkout:');
    lines.push('');
    lines.push('    codex plugin marketplace add https://github.com/CYoJkoY/AzSkills.git');
    lines.push('');
    lines.push('    node scripts/package-plugin.ts');
    lines.push('    codex plugin marketplace add ./dist/azskills-marketplace');
    lines.push('');
    lines.push('The repository root is the plugin root. Its .agents/plugins/marketplace.json points to ./, so a Git clone already contains .codex-plugin/plugin.json, codex-plugin/hooks, the canonical SKILL.md, and the skills entries Codex discovers. The default build mirrors that layout under dist/azskills-marketplace/plugins/azskills; with a custom --output directory, import the generated azskills-marketplace directory instead.');
    lines.push('');
    lines.push('Install AzSkills from the marketplace in Codex. Review and trust the bundled hooks when prompted. The package uses the supported `.codex-plugin/plugin.json` manifest with a direct `hooks` path. Codex 0.167.0-alpha.4.1 discovers all eight handlers in this format but silently omits them from the Agent Plugins root manifest ([upstream issue](https://github.com/openai/codex/issues/59516)). Keep a root `plugin.json` out of the plugin root; adding a compatibility manifest alongside `.codex-plugin` does not select the compatibility loader. Once trusted, matching requests need no explicit invocation. SessionStart restores routing context; UserPromptSubmit applies routing and code-task guidance; the Godot 3.x guard checks the canonical `apply_patch` command (`Write`/`Edit` are matcher aliases; synthetic `MultiEdit` events still work) against the real project and `project.godot` when it can reconstruct the proposed content, denies checker errors in PreToolUse, falls back to high-confidence lexical blocking for partial or ambiguous patches or an unavailable checker, denies shell commands that appear to write Godot files, reruns the checker after shell commands that show write evidence, and blocks further progress in PostToolUse while static errors remain; SubagentStart and the wait-agent PostToolUse handler apply Taste steering. Hooks require Node.js 22.18 or newer on PATH (23.6+ on Node 23) and support installation paths containing spaces.');
    lines.push('');
    lines.push('When upgrading from an earlier release, refresh the marketplace source and update or reinstall AzSkills in Codex. Confirm the installed plugin reports 2.8.0 or later; changing the checkout alone does not replace a cached installation. Hook trust is keyed to the handler hash, so an upgrade that changes `hooks.json` or a bundled script marks the hooks for review again; re-trust them before expecting them to run. Open the hook list (or `/hooks` in the CLI): expect eight handlers across SessionStart, UserPromptSubmit, SubagentStart, PreToolUse, and PostToolUse, visible even before trust. Review and trust the commands, then start a new session. An empty list indicates discovery or installation trouble; visible untrusted hooks require trust before execution.');
  } else if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push('For an interactive setup, run the guided wizard from the AzSkills checkout:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts');
    lines.push('');
    lines.push('The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.');
    lines.push('');
    lines.push('From the AzSkills checkout, install into a project skill directory:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --tool ' + tool.id + ' --mode project --project /path/to/project');
    lines.push('');
    lines.push('Install for the current user instead:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --tool ' + tool.id + ' --mode user');
    lines.push('');
    lines.push('Use --target to place the skill folder somewhere other than the default target. Use --dry-run to inspect without writing, --all-skills as a legacy shorthand for the complete AzSkills bundle, --rollback to restore the previous run, and --uninstall to remove only manifest-managed skill directories. Non-interactive writes require --yes after reviewing the preview.');
  } else if (tool.mechanism === 'mcp') {
    lines.push('For an interactive setup, run the guided wizard from the AzSkills checkout:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts');
    lines.push('');
    lines.push('The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.');
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
    lines.push('For an interactive setup, run the guided wizard from the AzSkills checkout:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts');
    lines.push('');
    lines.push('The wizard asks for a client ID and defaults to user scope. Pass --mode project for project scope. It installs one complete azskills entry and previews changes before confirmation.');
    lines.push('');
    lines.push('This client has no verified filesystem skill folder in the repository registry. Import the complete AzSkills bundle manually:');
    lines.push('');
    lines.push('1. Open the client project or workspace settings.');
    lines.push('2. Export azskills.zip and import it using ' + tool.target + ' as the client import destination; retain all supporting files.');
    lines.push('3. Keep the imported copy read-only and re-import after updating AzSkills.');
  }
  lines.push('');
  lines.push('## Use');
  lines.push('');
  if (tool.mechanism === 'codex-plugin') {
    lines.push('Start a new Codex session and make a request covered by AzSkills without naming the plugin. The SessionStart hook should supply the AzSkills entry and routing instructions.');
  } else if (tool.mechanism === 'mcp') {
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
  if (tool.mechanism === 'codex-plugin') {
    lines.push('Disable or uninstall AzSkills in Codex, then remove the azskills-local marketplace with codex plugin marketplace remove azskills-local.');
  } else if (tool.mechanism === 'native-skills' || tool.mechanism === 'shared-skills') {
    lines.push('Use the manifest-based uninstaller so files not owned by AzSkills are preserved:');
    lines.push('');
    lines.push('    node scripts/install-skills.ts --uninstall --target /path/to/project/' + tool.target);
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
    'AzSkills connects to AI tools through native skills, Codex plugins, MCP servers, and manual import.',
    'Native and shared skill folders install one AzSkills bundle. The Codex plugin supplies routing guidance with a session hook; MCP serves the same entry to clients without a skill folder.',
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
    'Or select a client and scope explicitly:',
    '',
    '    node scripts/install-skills.ts --list',
    '    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --skills azskills --dry-run',
    '    node scripts/install-skills.ts --tool codex --mode project --project /path/to/project --skills azskills --yes',
    '    node scripts/package-skill.ts --skill azskills --output /path/to/exports',
    '    node scripts/install-skills.ts --rollback --target /path/to/project/.agents/skills --yes',
    '    node scripts/install-skills.ts --uninstall --target /path/to/project/.agents/skills --yes',
    '',
    'See [tool installers](../scripts/install-skills.ts) and the [MCP server](../scripts/azskills-mcp.ts).',
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
