import { readFile } from 'node:fs/promises';
import path from 'node:path';

const pluginRoot = process.env.PLUGIN_ROOT;
if (!pluginRoot) throw new Error('PLUGIN_ROOT is required');
const event = process.argv[2] ?? 'SessionStart';
if (!['SessionStart', 'UserPromptSubmit'].includes(event)) throw new Error('Unsupported routing hook event: ' + event);
let input = '';
for await (const chunk of process.stdin) input += chunk;
let prompt = '';
if (input.trim()) {
  try {
    const payload = JSON.parse(input);
    if (typeof payload.prompt === 'string') prompt = payload.prompt;
  } catch {
    // Hook input is optional for startup and malformed input must not block routing.
  }
}

const entryDirectories = [pluginRoot, path.join(pluginRoot, 'skills', 'azskills'), path.resolve(pluginRoot, '..')];
let skillRoot = '';
let entry = '';
for (const directory of entryDirectories) {
  try {
    entry = await readFile(path.join(directory, 'SKILL.md'), 'utf8');
    skillRoot = directory;
    break;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (!entry) throw new Error('AzSkills SKILL.md is missing from ' + pluginRoot);
const cleanCodeMatch = event === 'UserPromptSubmit' && (/(^|[^a-z])(write|writing|implement|code|coding|review|reviewing|refactor|refactoring)([^a-z]|$)/i.test(prompt) || /重构|编写|实现|评审|审查/.test(prompt));
const cleanCodeRoot = path.join(skillRoot, 'az-clean-code');
const cleanCodeEntry = path.join(cleanCodeRoot, 'SKILL.md');
const cleanCodeContext = cleanCodeMatch
  ? ' This request matches Az Clean Code. Read ' + cleanCodeEntry + ' and follow its C1-C7 constraints and required self-check; establish business-data configuration before coding.'
  : '';
const godot3Match = event === 'UserPromptSubmit' && (/(^|[^a-z])(godot|gdscript)([^a-z]|$)/i.test(prompt) || /\.(gd|tscn)\b/i.test(prompt));
const godot3Entry = path.join(skillRoot, 'references', 'modules', 'godot-3-dev.md');
const godot3Context = godot3Match
  ? ' This request matches Godot 3.x work. Read ' + godot3Entry + ' and follow its virtual-call and 3.6 API rules before writing any GDScript; never re-call ._ready() or ._physics_process(), and use only Godot 3.6 symbols. After writing or editing any .gd, .tscn, .escn, or project.godot, run: node "' + path.join(skillRoot, 'godot-3-dev', 'scripts', 'check-godot-3x.mjs') + '" --root "<project>" --api "' + path.join(skillRoot, 'godot-3-dev', 'references', 'api-3.6.json') + '" --json. Treat any error as blocking and report the actual command, exit code, findings, and unverified items.'
  : '';
const additionalContext = event === 'UserPromptSubmit'
  ? 'For this request, proactively apply AzSkills when its capabilities match the requested outcome. Read ' + path.join(skillRoot, 'SKILL.md') + ' if the entry is not already in context, select one owning module, and load only its required references. Follow user and repository instructions.' + cleanCodeContext + godot3Context
  : [
  'AzSkills is active for this session. Apply it proactively when the user asks for work covered by its architecture, interface/design, visual production, publishing, career, or AI-client integration workflows; do not wait for an explicit AzSkills invocation.',
  'Follow the entry below and load its supporting files from ' + skillRoot + '. Use one owning module and only the references needed for the request.',
  entry,
].join('\n\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: event,
    additionalContext,
  },
}));
