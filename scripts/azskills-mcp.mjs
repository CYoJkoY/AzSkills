import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { packageSkill } from './package-skill.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
const fallbackProtocolVersion = '2025-06-18';

const bundleRoot = await mkdtemp(path.join(tmpdir(), 'azskills-mcp-'));
const entries = [...catalog.skills, ...catalog.aliases];
try {
  for (const skill of entries) await packageSkill(root, skill.id, bundleRoot);
} catch (error) {
  await rm(bundleRoot, { recursive: true, force: true });
  throw error;
}

async function bundleFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await bundleFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const mimeTypes = new Map([
  ['.md', 'text/markdown'], ['.txt', 'text/plain'], ['.json', 'application/json'],
  ['.js', 'text/javascript'], ['.mjs', 'text/javascript'], ['.cjs', 'text/javascript'], ['.ts', 'text/typescript'],
  ['.css', 'text/css'], ['.html', 'text/html'], ['.svg', 'image/svg+xml'],
  ['.yml', 'text/yaml'], ['.yaml', 'text/yaml'], ['.py', 'text/x-python'],
  ['.sh', 'text/x-shellscript'], ['.toml', 'text/plain'], ['.xml', 'text/xml'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'], ['.pdf', 'application/pdf'],
]);
const contentType = async (file) => {
  const known = mimeTypes.get(path.extname(file).toLowerCase());
  if (known) return { mimeType: known, text: known.startsWith('text/') || known === 'application/json' || known === 'image/svg+xml' };
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(await readFile(file));
    return { mimeType: 'text/plain', text: true };
  } catch {
    return { mimeType: 'application/octet-stream', text: false };
  }
};
const descriptors = [];
const resourcePaths = new Map();
for (const skill of entries) {
  const directory = path.join(bundleRoot, skill.id);
  for (const file of await bundleFiles(directory)) {
    const relative = path.relative(directory, file).split(path.sep).join('/');
    const main = relative === 'SKILL.md';
    const uri = main
      ? 'azskills://skills/' + skill.id
      : 'azskills://skills/' + skill.id + '/' + relative.split('/').map(encodeURIComponent).join('/');
    const descriptor = {
      uri,
      name: main ? skill.id : skill.id + '/' + relative,
      title: main ? skill.id : relative,
      description: main ? skill.role : 'Supporting file for ' + skill.id,
      mimeType: (await contentType(file)).mimeType,
    };
    descriptors.push(descriptor);
    resourcePaths.set(uri, file);
  }
}
const resources = descriptors;

const send = (message) => process.stdout.write(JSON.stringify(message) + '\n');
const result = (id, value) => send({ jsonrpc: '2.0', id, result: value });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });
const text = (value) => ({ content: [{ type: 'text', text: value }] });

const findSkill = (id) => {
  const skill = entries.find((item) => item.id === id);
  if (!skill) throw new Error('Unknown skill: ' + id);
  return skill;
};
const readSkill = async (id) => readFile(path.join(bundleRoot, findSkill(id).id, 'SKILL.md'), 'utf8');
const readSkillFile = async (id, relative) => {
  findSkill(id);
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) throw new Error('Skill file path must be relative.');
  const base = path.resolve(bundleRoot, id);
  const target = path.resolve(base, relative);
  const rel = path.relative(base, target);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw new Error('Skill file path escapes its bundle.');
  if (!(await stat(target)).isFile()) throw new Error('Skill file is not a regular file: ' + relative);
  const type = await contentType(target);
  if (!type.text) {
    throw new Error('Supporting file is binary; read it through its MCP resource instead: ' + relative);
  }
  return readFile(target, 'utf8');
};

const tools = [
  { name: 'list_skills', description: 'List AzSkills contracts with id, family, modes, and role.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'read_skill', description: 'Read one SKILL.md contract by canonical id or compatibility alias.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false } },
  { name: 'read_skill_file', description: 'Read a supporting file from a packaged Skill bundle by id and bundle-relative path.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, path: { type: 'string' } }, required: ['id', 'path'], additionalProperties: false } },
  { name: 'search_skills', description: 'Search skill ids, roles, and full contract text.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } },
];

const dispatch = async (request) => {
  const { id, method, params = {} } = request;
  if (method === 'initialize') {
    return result(id, {
      protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : fallbackProtocolVersion,
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: 'azskills', version: '1.1.0' },
    });
  }
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools });
  if (method === 'resources/list') return result(id, { resources });
  if (method === 'resources/read') {
    const uri = String(params.uri ?? '');
    const file = resourcePaths.get(uri);
    if (!file) throw new Error('Unknown resource: ' + uri);
    const type = await contentType(file);
    const mimeType = resources.find((item) => item.uri === uri).mimeType;
    if (type.text) {
      return result(id, { contents: [{ uri, mimeType, text: await readFile(file, 'utf8') }] });
    }
    return result(id, { contents: [{ uri, mimeType, blob: (await readFile(file)).toString('base64') }] });
  }
  if (method === 'tools/call') {
    const name = params.name;
    const input = params.arguments ?? {};
    if (name === 'list_skills') {
      return result(id, text(entries.map((skill) => [skill.id, skill.family ?? 'alias', skill.modes?.join(',') ?? skill.mode, skill.role ?? 'Alias for ' + skill.canonical].join(' | ')).join('\n')));
    }
    if (name === 'read_skill') return result(id, text(await readSkill(String(input.id ?? ''))));
    if (name === 'read_skill_file') return result(id, text(await readSkillFile(String(input.id ?? ''), input.path)));
    if (name === 'search_skills') {
      const query = String(input.query ?? '').toLowerCase();
      const matches = [];
      for (const skill of entries) {
        const body = await readFile(path.join(bundleRoot, skill.id, 'SKILL.md'), 'utf8');
        if ((skill.id + ' ' + skill.role + ' ' + body).toLowerCase().includes(query)) matches.push(skill.id + ' | ' + skill.role);
      }
      return result(id, text(matches.length ? matches.join('\n') : 'No matches'));
    }
    return fail(id, -32602, 'Unknown tool: ' + name);
  }
  return fail(id, -32601, 'Method not found: ' + method);
};

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let requestQueue = Promise.resolve();
lines.on('line', (line) => {
  if (!line.trim()) return;
  requestQueue = requestQueue.then(async () => {
    let request;
    try { request = JSON.parse(line); } catch { return; }
    if (request.id === undefined) return;
    try { await dispatch(request); } catch (error) { fail(request.id, -32603, error.message); }
  });
});
lines.on('close', () => {
  requestQueue.finally(() => rm(bundleRoot, { recursive: true, force: true })).catch(() => {});
});
