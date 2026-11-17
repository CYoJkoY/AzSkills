import { readFile } from 'node:fs/promises';
import path from 'node:path';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const pluginRoot = process.env.PLUGIN_ROOT;
if (!pluginRoot) throw new Error('PLUGIN_ROOT is required');
const event = process.argv[2] ?? 'SessionStart';
if (!['SessionStart', 'UserPromptSubmit'].includes(event)) throw new Error('Unsupported routing hook event: ' + event);
let input = '';
for await (const chunk of process.stdin) input += chunk;
let prompt = '';
if (input.trim()) {
  try {
    const payload: unknown = JSON.parse(input);
    if (isRecord(payload) && typeof payload.prompt === 'string') prompt = payload.prompt;
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
    if (!isRecord(error) || error.code !== 'ENOENT') throw error;
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
  ? ' This request matches Godot 3.x work. Read ' + godot3Entry + ' and follow its virtual-call and 3.6 API rules before writing any GDScript; never re-call ._ready() or ._physics_process(), and use only Godot 3.6 symbols. After writing or editing any .gd, .tscn, .escn, or project.godot, run: node "' + path.join(skillRoot, 'godot-3-dev', 'scripts', 'check-godot-3x.ts') + '" --root "<project>" --api "' + path.join(skillRoot, 'godot-3-dev', 'references', 'api-3.6.json') + '" --json. Treat any error as blocking and report the actual command, exit code, findings, and unverified items.'
  : '';
const styleRoot = path.join(skillRoot, 'style-presets');
const stylePresetMatch = event === 'UserPromptSubmit'
  && (/biorender|bio[ -]render|cobalt kit|cobalt-kit|wabi press|style preset|侘寂刊本/i.test(prompt));
const styleLoaderMatch = event === 'UserPromptSubmit'
  && (/css[ -]loaders?|spinner|loading indicator|loading state|progress indicator|骨架屏|加载动画|加载状态/i.test(prompt));
const stylePresetContext = stylePresetMatch
  ? ' This request names a maintained AzSkills style. Read ' + path.join(skillRoot, 'references', 'modules', 'style-presets.md') + ' and resolve the keyword through ' + path.join(styleRoot, 'references', 'catalog.md') + ' before choosing any colour, type, or geometry value. Apply the preset tokens from ' + styleRoot + ' scoped with data-style; never copy a brand palette, logo, illustration, or upstream stylesheet, and never replace an authoritative project identity.'
  : '';
const styleLoaderContext = styleLoaderMatch
  ? ' This request needs a loading primitive. Read ' + path.join(skillRoot, 'references', 'modules', 'style-presets.md') + ' and use the loader variants in ' + path.join(styleRoot, 'references', 'loaders.md') + ' with ' + path.join(styleRoot, 'assets', 'loaders.css') + '. Keep role="status" with a text label, size and colour through --sp-* tokens, and a reduced-motion pose; a loader never communicates state by motion alone.'
  : '';
const additionalContext = event === 'UserPromptSubmit'
  ? 'For this request, proactively apply AzSkills when its capabilities match the requested outcome. Read ' + path.join(skillRoot, 'SKILL.md') + ' if the entry is not already in context, select one owning module, and load only its required references. Follow user and repository instructions.' + cleanCodeContext + godot3Context + stylePresetContext + styleLoaderContext
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
