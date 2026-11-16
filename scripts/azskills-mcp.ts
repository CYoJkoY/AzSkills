import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { packageSkill } from './package-skill.ts';
import { errorMessage, isRecord, readJson } from './runtime.ts';
import type { SkillCatalog } from './types.ts';

interface ResourceData {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = await readJson<SkillCatalog>(path.join(root, 'skills.json'));
const legacy = process.argv.indexOf('--skills');
if (legacy >= 0) {
  const selected = process.argv[legacy + 1]?.split(',');
  const known = new Set(['azskills', ...catalog.modules.map(m => m.id), ...catalog.aliases.map(a => a.id)]);
  if (!selected?.length || selected.some(id => !known.has(id))) throw new Error('Unknown module selection');
  console.error('--skills is deprecated; AzSkills exposes one complete entry.');
}
const staging = await mkdtemp(path.join(tmpdir(), 'azskills-mcp-'));
let bundle: string;
try {
  bundle = await packageSkill(root, 'azskills', staging);
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}
const files = new Map<string, string>();
async function index(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await index(full);
    else files.set(path.relative(bundle, full).split(path.sep).join('/'), full);
  }
}
await index(bundle);
const mainUri = 'azskills://skills/azskills';
const uriFor = (relative: string): string => relative === 'SKILL.md'
  ? mainUri
  : mainUri + '/' + relative.split('/').map(encodeURIComponent).join('/');
const resourcePaths = new Map([...files].map(([name, file]) => [uriFor(name), file]));
const resources = [{ uri: mainUri, name: 'azskills', title: 'AzSkills', description: 'One entry; internal modules load on demand.', mimeType: 'text/markdown' }];
const tool = {
  name: 'azskills',
  description: 'Read the AzSkills entry, route a task, or load one internal module or supporting file on demand. Start with action entry.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['entry', 'route', 'module', 'file'] },
      id: { type: 'string' },
      mode: { type: 'string' },
      path: { type: 'string' },
    },
    additionalProperties: false,
  },
};
const textResult = (text: string): { content: Array<{ type: 'text'; text: string }> } => ({ content: [{ type: 'text', text }] });
function requiredFile(name: string): string {
  const file = files.get(name);
  if (!file) throw new Error('Missing bundled file: ' + name);
  return file;
}
async function resource(uri: string): Promise<ResourceData> {
  const file = resourcePaths.get(uri);
  if (!file) throw new Error('Unknown resource: ' + uri);
  const bytes = await readFile(file);
  const ext = path.extname(file).toLowerCase();
  const mimeByExtension: Record<string, string> = {
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf',
  };
  const mime = mimeByExtension[ext] ?? 'application/octet-stream';
  if (['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.zip'].includes(ext)) {
    return { uri, mimeType: mime, blob: bytes.toString('base64') };
  }
  try {
    return { uri, mimeType: mime, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { uri, mimeType: 'application/octet-stream', blob: bytes.toString('base64') };
  }
}
async function call(input: Record<string, unknown>): Promise<unknown> {
  if (Object.keys(input).some(key => !['action', 'id', 'mode', 'path'].includes(key))) throw new Error('Unknown argument');
  const action = input.action ?? 'entry';
  if (action === 'entry') return textResult(await readFile(requiredFile('SKILL.md'), 'utf8'));
  if (action === 'route') return textResult(await readFile(requiredFile('references/routing.md'), 'utf8'));
  if (action === 'module') {
    const id = input.id;
    const alias = typeof id === 'string' ? catalog.aliases.find(a => a.id === id) : undefined;
    const module = catalog.modules.find(m => m.id === (alias?.canonical ?? id));
    if (!module) throw new Error('Unknown module: ' + String(id));
    const requestedMode = input.mode;
    if (requestedMode !== undefined && typeof requestedMode !== 'string') throw new Error('Unknown mode for ' + module.id);
    const mode = requestedMode ?? alias?.mode;
    if (mode !== undefined && !module.modes.includes(mode)) throw new Error('Unknown mode for ' + module.id);
    return textResult((mode ? 'Selected mode: ' + mode + '\n\n' : '') + await readFile(requiredFile(module.path), 'utf8'));
  }
  if (action === 'file') {
    if (typeof input.path !== 'string' || !files.has(input.path)) throw new Error('Unknown bundle-relative file path');
    const data = await resource(uriFor(input.path));
    if (data.text === undefined) return { content: [{ type: 'resource', resource: data }] };
    return textResult(data.text);
  }
  throw new Error('Unknown action: ' + String(action));
}
async function dispatch(request: JsonRpcRequest): Promise<unknown> {
  const { method, params = {} } = request;
  if (method === 'initialize') {
    return {
      protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : '2025-06-18',
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: 'azskills', version: catalog.version },
    };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: [tool] };
  if (method === 'resources/list') return { resources };
  if (method === 'resources/read') {
    if (typeof params.uri !== 'string') throw new Error('Resource URI must be a string');
    return { contents: [await resource(params.uri)] };
  }
  if (method === 'tools/call') {
    if (params.name !== 'azskills') throw new Error('Unknown tool: ' + String(params.name));
    const args = params.arguments;
    if (!isRecord(args)) throw new Error('Arguments must be an object');
    try {
      return await call(args);
    } catch (error) {
      return { ...textResult(errorMessage(error)), isError: true };
    }
  }
  throw new Error('Method not found: ' + String(method));
}
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
const send = (message: unknown): void => {
  process.stdout.write(JSON.stringify(message) + '\n');
};
lines.on('line', line => {
  if (!line.trim()) return;
  queue = queue.then(async () => {
    let request: JsonRpcRequest;
    try {
      const parsed: unknown = JSON.parse(line);
      if (!isRecord(parsed)) throw new Error('Request must be an object');
      request = {
        jsonrpc: typeof parsed.jsonrpc === 'string' ? parsed.jsonrpc : undefined,
        id: typeof parsed.id === 'string' || typeof parsed.id === 'number' || parsed.id === null ? parsed.id : undefined,
        method: typeof parsed.method === 'string' ? parsed.method : undefined,
        params: isRecord(parsed.params) ? parsed.params : undefined,
      };
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    if (request.id === undefined) return;
    try {
      send({ jsonrpc: '2.0', id: request.id, result: await dispatch(request) });
    } catch (error) {
      send({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: request.method?.startsWith('resources/') ? -32602 : -32601,
          message: errorMessage(error),
        },
      });
    }
  });
});
lines.on('close', () => {
  queue.finally(() => rm(staging, { recursive: true, force: true })).catch(error => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
});
