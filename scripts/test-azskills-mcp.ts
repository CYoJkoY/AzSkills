import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { PluginCatalog, SkillCatalog } from "./types.ts";

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requests: [string, Record<string, unknown>][] = [
  ["initialize", { protocolVersion: "2025-06-18" }],
  ["tools/list", {}],
  ["resources/list", {}],
  ["tools/call", { name: "azskills", arguments: { action: "catalog" } }],
  ["tools/call", { name: "azskills", arguments: { action: "entry" } }],
  ["tools/call", { name: "azskills", arguments: { action: "route" } }],
  ["tools/call", { name: "azskills", arguments: { action: "plugin", id: "frontend-architecture" } }],
  ["tools/call", { name: "azskills", arguments: { action: "plugin", id: "ui-design", mode: "refine" } }],
  ["tools/call", { name: "azskills", arguments: { action: "file", id: "ui-design", path: "ui-design/references/ux/overview.md" } }],
  ["tools/call", { name: "azskills", arguments: { action: "file", id: "ui-design", path: "../skills.json" } }],
  ["tools/call", { name: "azskills", arguments: { action: "plugin", id: "unknown" } }],
  ["tools/call", { name: "azskills", arguments: { action: "module", id: "architecture", mode: "wrong" } }],
  ["resources/read", { uri: "azskills://plugins/ui-design/references/modules/ui-design.md" }],
  ["resources/read", { uri: "azskills://plugins/ui-design/../../skills.json" }],
  ["resources/read", { uri: "azskills://catalog" }],
  ["resources/read", { uri: "azskills://plugins/no-think-tags" }],
  ["tools/call", { name: "azskills", arguments: { action: "file", id: "az-clean-code", path: "az-clean-code/SKILL.md" } }],
  ["tools/call", { name: "azskills" }],
  ["tools/call", { name: "azskills", arguments: [] }],
  ["tools/call", { name: "azskills", arguments: { action: "module", id: "az-clean-code", mode: "write" } }],
];
const result = spawnSync(process.execPath, ["scripts/azskills-mcp.ts"], {
  cwd: root,
  encoding: "utf8",
  timeout: 30000,
  maxBuffer: 3000000,
  input: requests.map(([method, params], i) => JSON.stringify({ jsonrpc: "2.0", id: i + 1, method, params })).join("\n") + "\n",
});
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
const registry = JSON.parse(await readFile(path.join(root, "skills.json"), "utf8")) as SkillCatalog;
const pluginRegistry = JSON.parse(await readFile(path.join(root, "catalog/plugins.json"), "utf8")) as PluginCatalog;
assert.equal(response(1).result?.serverInfo?.version, registry.version);
assert.deepEqual(response(2).result?.tools?.map((t) => t.name), ["azskills"]);
const resourceUris = response(3).result?.resources?.map((r) => r.uri) ?? [];
assert.equal(resourceUris.length, pluginRegistry.plugins.length + 1);
assert.equal(resourceUris[0], "azskills://catalog");
assert.ok(resourceUris.includes("azskills://plugins/ui-design"));
assert.equal(text(4), await readFile(path.join(root, "catalog/plugins.json"), "utf8"));
assert.match(text(5), /name: azskills/);
assert.equal(text(5), await readFile(path.join(root, "SKILL.md"), "utf8"));
assert.match(text(6), /resume-evidence-workflow/);
assert.match(text(7), /Selected mode: frontend/);
assert.match(text(7), /name: architecture/);
assert.match(text(8), /Selected mode: refine/);
assert.match(text(8), /name: ui-design/);
assert.equal(text(9), await readFile(path.join(root, "ui-design/references/ux/overview.md"), "utf8"));
for (const i of [10, 11, 12]) assert.equal(response(i).result?.isError, true);
assert.match(resourceText(13), /name: ui-design/);
assert.equal(response(14).error?.code, -32602);
assert.match(resourceText(15), /"plugins"/);
assert.match(resourceText(16), /name: no-think-tags/);
assert.equal(text(17), await readFile(path.join(root, "az-clean-code/SKILL.md"), "utf8"));
assert.equal(text(18), await readFile(path.join(root, "SKILL.md"), "utf8"));
assert.equal(response(19).result?.isError, true);
assert.match(text(20), /Selected mode: write/);
console.log("MCP tests passed: catalog and per-plugin resources, plugin and module contracts, closure-validated files, alias and mode handling, and traversal rejection.");
