import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { packageSkill } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
const legacy = process.argv.indexOf('--skills');
if (legacy >= 0) {
  const selected = process.argv[legacy + 1]?.split(',');
  const known = new Set(['azskills', ...catalog.modules.map(m => m.id), ...catalog.aliases.map(a => a.id)]);
  if (!selected?.length || selected.some(id => !known.has(id))) throw new Error('Unknown module selection');
  console.error('--skills is deprecated; AzSkills exposes one complete entry.');
}
const staging = await mkdtemp(path.join(tmpdir(), 'azskills-mcp-'));
let bundle;
try { bundle = await packageSkill(root, 'azskills', staging); }
catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
const files = new Map();
async function index(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await index(full);
    else files.set(path.relative(bundle, full).split(path.sep).join('/'), full);
  }
}
await index(bundle);
const mainUri = 'azskills://skills/azskills';
const uriFor = relative => relative === 'SKILL.md' ? mainUri : mainUri + '/' + relative.split('/').map(encodeURIComponent).join('/');
const resourcePaths = new Map([...files].map(([name, file]) => [uriFor(name), file]));
const resources = [{ uri: mainUri, name: 'azskills', title: 'AzSkills', description: 'One entry; internal modules load on demand.', mimeType: 'text/markdown' }];
const tool = {
  name: 'azskills', description: 'Read the AzSkills entry, route a task, or load one internal module or supporting file on demand. Start with action entry.',
  inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['entry', 'route', 'module', 'file'] }, id: { type: 'string' }, mode: { type: 'string' }, path: { type: 'string' } }, additionalProperties: false },
};
const textResult = text => ({ content: [{ type: 'text', text }] });
async function resource(uri) {
  const file = resourcePaths.get(uri);
  if (!file) throw new Error('Unknown resource: ' + uri);
  const bytes = await readFile(file);
  const ext = path.extname(file).toLowerCase();
  const mime = { '.md': 'text/markdown', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' }[ext];
  if (['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.zip'].includes(ext)) return { uri, mimeType: mime || 'application/octet-stream', blob: bytes.toString('base64') };
  try { return { uri, mimeType: mime || 'text/plain', text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }; }
  catch { return { uri, mimeType: 'application/octet-stream', blob: bytes.toString('base64') }; }
}
async function call(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Arguments must be an object');
  if (Object.keys(input).some(key => !['action', 'id', 'mode', 'path'].includes(key))) throw new Error('Unknown argument');
  const action = input.action ?? 'entry';
  if (action === 'entry') return textResult(await readFile(files.get('SKILL.md'), 'utf8'));
  if (action === 'route') return textResult(await readFile(files.get('references/routing.md'), 'utf8'));
  if (action === 'module') {
    const alias = catalog.aliases.find(a => a.id === input.id);
    const module = catalog.modules.find(m => m.id === (alias?.canonical ?? input.id));
    if (!module) throw new Error('Unknown module: ' + input.id);
    const mode = input.mode ?? alias?.mode;
    if (mode !== undefined && !module.modes.includes(mode)) throw new Error('Unknown mode for ' + module.id);
    return textResult((mode ? 'Selected mode: ' + mode + '\n\n' : '') + await readFile(files.get(module.path), 'utf8'));
  }
  if (action === 'file') {
    if (typeof input.path !== 'string' || !files.has(input.path)) throw new Error('Unknown bundle-relative file path');
    const data = await resource(uriFor(input.path));
    if (!('text' in data)) return { content: [{ type: 'resource', resource: data }] };
    return textResult(data.text);
  }
  throw new Error('Unknown action: ' + action);
}
async function dispatch(request) {
  const { method, params = {} } = request;
  if (method === 'initialize') return { protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : '2025-06-18', capabilities: { resources: {}, tools: {} }, serverInfo: { name: 'azskills', version: catalog.version } };
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: [tool] };
  if (method === 'resources/list') return { resources };
  if (method === 'resources/read') return { contents: [await resource(params.uri)] };
  if (method === 'tools/call') {
    if (params.name !== 'azskills') throw new Error('Unknown tool: ' + params.name);
    try { return await call(params.arguments ?? {}); }
    catch (error) { return { ...textResult(error.message), isError: true }; }
  }
  throw new Error('Method not found: ' + method);
}
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
const send = message => process.stdout.write(JSON.stringify(message) + '\n');
lines.on('line', line => {
  if (!line.trim()) return;
  queue = queue.then(async () => {
    let request;
    try { request = JSON.parse(line); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
    if (request?.id === undefined) return;
    try { send({ jsonrpc: '2.0', id: request.id, result: await dispatch(request) }); }
    catch (error) { send({ jsonrpc: '2.0', id: request.id, error: { code: request.method?.startsWith('resources/') ? -32602 : -32601, message: error.message } }); }
  });
});
lines.on('close', () => { queue.finally(() => rm(staging, { recursive: true, force: true })).catch(error => { console.error(error.message); process.exitCode = 1; }); });
