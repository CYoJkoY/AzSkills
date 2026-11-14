import { readFile } from 'node:fs/promises';
import path from 'node:path';

const pluginRoot = process.env.PLUGIN_ROOT;
if (!pluginRoot) throw new Error('PLUGIN_ROOT is required');
const event = process.argv[2] ?? 'SessionStart';
if (!['SessionStart', 'UserPromptSubmit'].includes(event)) throw new Error('Unsupported routing hook event: ' + event);

let skillRoot = path.join(pluginRoot, 'skills', 'azskills');
let entry;
try {
  entry = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  skillRoot = path.resolve(pluginRoot, '..');
  entry = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
}
const additionalContext = event === 'UserPromptSubmit'
  ? 'For this request, proactively apply AzSkills when its capabilities match the requested outcome. Read ' + path.join(skillRoot, 'SKILL.md') + ' if the entry is not already in context, select one owning module, and load only its required references. Follow user and repository instructions.'
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
