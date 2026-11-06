import { readFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8'));
const fallbackProtocolVersion = '2025-06-18';

const resources = catalog.skills.map((skill) => ({
  uri: 'azskills://skills/' + skill.id,
  name: skill.id,
  title: skill.id,
  description: skill.role,
  mimeType: 'text/markdown',
}));

const send = (message) => process.stdout.write(JSON.stringify(message) + '\n');
const result = (id, value) => send({ jsonrpc: '2.0', id, result: value });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });
const text = (value) => ({ content: [{ type: 'text', text: value }] });

const findSkill = (id) => {
  const skill = catalog.skills.find((item) => item.id === id);
  if (!skill) throw new Error('Unknown skill: ' + id);
  return skill;
};
const readSkill = async (id) => readFile(path.join(root, findSkill(id).path), 'utf8');

const tools = [
  { name: 'list_skills', description: 'List AzSkills contracts with id, family, modes, and role.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'read_skill', description: 'Read one SKILL.md contract by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false } },
  { name: 'search_skills', description: 'Search skill ids, roles, and full contract text.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } },
];

const dispatch = async (request) => {
  const { id, method, params = {} } = request;
  if (method === 'initialize') {
    return result(id, {
      protocolVersion: typeof params.protocolVersion === 'string' ? params.protocolVersion : fallbackProtocolVersion,
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: 'azskills', version: '1.0.0' },
    });
  }
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools });
  if (method === 'resources/list') return result(id, { resources });
  if (method === 'resources/read') {
    const idValue = String(params.uri ?? '').replace('azskills://skills/', '');
    return result(id, { contents: [{ uri: params.uri, mimeType: 'text/markdown', text: await readSkill(idValue) }] });
  }
  if (method === 'tools/call') {
    const name = params.name;
    const input = params.arguments ?? {};
    if (name === 'list_skills') {
      return result(id, text(catalog.skills.map((skill) => [skill.id, skill.family, skill.modes.join(','), skill.role].join(' | ')).join('\n')));
    }
    if (name === 'read_skill') return result(id, text(await readSkill(String(input.id ?? ''))));
    if (name === 'search_skills') {
      const query = String(input.query ?? '').toLowerCase();
      const matches = [];
      for (const skill of catalog.skills) {
        const body = await readFile(path.join(root, skill.path), 'utf8');
        if ((skill.id + ' ' + skill.role + ' ' + body).toLowerCase().includes(query)) matches.push(skill.id + ' | ' + skill.role);
      }
      return result(id, text(matches.length ? matches.join('\n') : 'No matches'));
    }
    return fail(id, -32602, 'Unknown tool: ' + name);
  }
  return fail(id, -32601, 'Method not found: ' + method);
};

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', async (line) => {
  if (!line.trim()) return;
  let request;
  try { request = JSON.parse(line); } catch { return; }
  if (request.id === undefined) return;
  try { await dispatch(request); } catch (error) { fail(request.id, -32603, error.message); }
});
