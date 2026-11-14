import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = path.join(root, 'scripts/azskills-mcp.mjs');
const requests = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
  { jsonrpc: '2.0', id: 2, method: 'resources/list' },
  { jsonrpc: '2.0', id: 3, method: 'resources/read', params: { uri: 'azskills://skills/tool-integration/_azskills-support/integrations/guides/codex.md' } },
  { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'read_skill_file', arguments: { id: 'ui-aesthetics', path: '_azskills-support/ui-design/references/ux/overview.md' } } },
  { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'read_skill_file', arguments: { id: 'tool-integration', path: '../../README.md' } } },
  { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'read_skill', arguments: { id: 'ui-aesthetics' } } },
];
const processResult = spawnSync(process.execPath, [server], {
  cwd: root,
  encoding: 'utf8',
  input: requests.map((request) => JSON.stringify(request)).join('\n') + '\n',
  timeout: 30000,
});
if (processResult.error) throw processResult.error;
assert.equal(processResult.status, 0, processResult.stderr || 'MCP server exited unsuccessfully');
const responses = new Map(processResult.stdout.trim().split(/\r?\n/).map((line) => {
  const response = JSON.parse(line);
  return [response.id, response];
}));
assert.equal(responses.get(1)?.result?.serverInfo?.version, '1.1.0');
const resources = responses.get(2)?.result?.resources ?? [];
assert.ok(resources.some((resource) => resource.uri === 'azskills://skills/tool-integration'));
assert.ok(resources.some((resource) => resource.uri.endsWith('/integrations/guides/codex.md')));
assert.ok(resources.some((resource) => resource.uri.endsWith('/scripts/install-skills.mjs')));
assert.ok(resources.some((resource) => resource.mimeType === 'text/x-python' && resource.uri.endsWith('/scripts/extract-pptx.py')));
assert.match(responses.get(3)?.result?.contents?.[0]?.text ?? '', /Codex/);
assert.match(responses.get(4)?.result?.content?.[0]?.text ?? '', /UX Review Reference/);
assert.match(responses.get(5)?.error?.message ?? '', /escapes its bundle/);
assert.match(responses.get(6)?.result?.content?.[0]?.text ?? '', /ui-design/);
console.log('MCP integration tests passed (complete resources, aliases, supporting-file reads, and path traversal protection).');
