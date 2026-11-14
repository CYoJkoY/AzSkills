import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requests = [
  ['initialize', { protocolVersion: '2025-06-18' }],
  ['tools/list', {}], ['resources/list', {}],
  ['tools/call', { name: 'azskills', arguments: { action: 'entry' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'route' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'module', id: 'frontend-architecture' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'module', id: 'ui-design', mode: 'refine' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'file', path: 'ui-design/references/ux/overview.md' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'file', path: '../skills.json' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'module', id: 'unknown' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'module', id: 'architecture', mode: 'wrong' } }],
  ['resources/read', { uri: 'azskills://skills/azskills/references/modules/architecture.md' }],
  ['resources/read', { uri: 'azskills://skills/azskills/../../skills.json' }],
  ['resources/read', { uri: 'azskills://skills/azskills' }],
  ['tools/call', { name: 'azskills', arguments: { action: 'file', path: 'assets/azskills-hero.svg' } }],
];
const result = spawnSync(process.execPath, ['scripts/azskills-mcp.mjs'], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 3000000, input: requests.map(([method, params], i) => JSON.stringify({ jsonrpc: '2.0', id: i + 1, method, params })).join('\n') + '\n' });
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr);
const responses = result.stdout.trim().split(/\r?\n/).map(JSON.parse);
assert.equal(responses.length, requests.length);
const response = i => responses.find(r => r.id === i);
const text = i => response(i).result.content[0].text;
assert.equal(response(1).result.serverInfo.version, '2.0.0');
assert.deepEqual(response(2).result.tools.map(t => t.name), ['azskills']);
assert.deepEqual(response(3).result.resources.map(r => r.uri), ['azskills://skills/azskills']);
assert.match(text(4), /name: azskills/);
assert.equal(text(4), await readFile(path.join(root, 'SKILL.md'), 'utf8'));
assert.match(text(5), /resume-evidence-workflow/);
assert.match(text(6), /Selected mode: frontend/);
assert.match(text(6), /name: architecture/);
assert.match(text(7), /Selected mode: refine/);
assert.equal(text(8), await readFile(path.join(root, 'ui-design/references/ux/overview.md'), 'utf8'));
for (const i of [9, 10, 11]) assert.equal(response(i).result.isError, true);
assert.match(response(12).result.contents[0].text, /name: architecture/);
assert.equal(response(13).error.code, -32602);
assert.match(response(14).result.contents[0].text, /name: azskills/);
assert.match(text(15), /<svg/);
console.log('MCP tests passed: single tool/resource, lazy routing and aliases, module modes, supporting file bytes, traversal rejection, and unknown module/mode errors.');
