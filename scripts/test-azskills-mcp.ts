import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { SkillCatalog } from './types.ts';

interface McpContentItem {
  type: string;
  text: string;
  mimeType?: string;
}

interface McpResponse {
  id?: number;
  result?: {
    serverInfo?: { version?: string };
    tools?: { name: string }[];
    resources?: { uri: string }[];
    content?: McpContentItem[];
    contents?: McpContentItem[];
    isError?: boolean;
  };
  error?: { code: number; message?: string };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requests: [string, Record<string, unknown>][] = [
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
  ['tools/call', { name: 'azskills', arguments: { action: 'module', id: 'az-clean-code', mode: 'write' } }],
  ['tools/call', { name: 'azskills', arguments: { action: 'file', path: 'az-clean-code/SKILL.md' } }],
  ['tools/call', { name: 'azskills' }],
  ['tools/call', { name: 'azskills', arguments: [] }],
  ['resources/read', { uri: 'azskills://skills/azskills/design-system/wabi-press.css' }],
];
const result = spawnSync(process.execPath, ['scripts/azskills-mcp.ts'], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 3000000, input: requests.map(([method, params], i) => JSON.stringify({ jsonrpc: '2.0', id: i + 1, method, params })).join('\n') + '\n' });
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr);
const responses: McpResponse[] = result.stdout.trim().split(/\r?\n/).map((line: string) => JSON.parse(line) as McpResponse);
assert.equal(responses.length, requests.length);
const response = (id: number): McpResponse => {
  const found = responses.find((item) => item.id === id);
  assert.ok(found, `Missing MCP response for id ${id}.`);
  return found;
};
const text = (id: number): string => {
  const item = response(id).result?.content?.[0];
  assert.ok(item, `Missing MCP content for id ${id}.`);
  return item.text;
};
const resourceText = (id: number): string => {
  const item = response(id).result?.contents?.[0];
  assert.ok(item, `Missing MCP resource content for id ${id}.`);
  return item.text;
};
const registry = JSON.parse(await readFile(path.join(root, 'skills.json'), 'utf8')) as SkillCatalog;
assert.equal(response(1).result?.serverInfo?.version, registry.version);
assert.deepEqual(response(2).result?.tools?.map(t => t.name), ['azskills']);
assert.deepEqual(response(3).result?.resources?.map(r => r.uri), ['azskills://skills/azskills']);
assert.match(text(4), /name: azskills/);
assert.equal(text(4), await readFile(path.join(root, 'SKILL.md'), 'utf8'));
assert.match(text(5), /resume-evidence-workflow/);
assert.match(text(6), /Selected mode: frontend/);
assert.match(text(6), /name: architecture/);
assert.match(text(7), /Selected mode: refine/);
assert.equal(text(8), await readFile(path.join(root, 'ui-design/references/ux/overview.md'), 'utf8'));
for (const i of [9, 10, 11]) assert.equal(response(i).result?.isError, true);
assert.match(resourceText(12), /name: architecture/);
assert.equal(response(13).error?.code, -32602);
assert.match(resourceText(14), /name: azskills/);
assert.match(text(15), /<svg/);
assert.match(text(16), /name: az-clean-code/);
assert.match(text(16), /Selected mode: write/);
assert.equal(text(17), await readFile(path.join(root, 'az-clean-code/SKILL.md'), 'utf8'));
assert.equal(text(18), await readFile(path.join(root, 'SKILL.md'), 'utf8'));
assert.equal(response(19).result?.isError, true);
assert.equal(response(20).result?.contents?.[0]?.mimeType, 'text/plain');
console.log('MCP tests passed: single tool/resource, lazy routing and aliases, module modes, supporting file bytes, traversal rejection, omitted-argument defaulting, and unknown module/mode errors.');
