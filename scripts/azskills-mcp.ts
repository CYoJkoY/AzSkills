/*
 * Local MCP server over the AzSkills plugin catalog.
 *
 * It exposes the catalog, one resource per plugin, and a single tool that
 * reads a plugin contract or a closure-validated supporting file on demand.
 * Files are read from the repository; nothing is packaged or copied.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { collectClosure, filesUnder, toPosix } from "./link-bundle.ts";
import { errorMessage, isRecord, readJson } from "./runtime.ts";
import type { PluginCatalog, SkillCatalog } from "./types.ts";

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = await readJson<SkillCatalog>(path.join(root, "skills.json"));
const plugins = await readJson<PluginCatalog>(path.join(root, "catalog/plugins.json"));
const pluginIndex = new Map(plugins.plugins.map((entry) => [entry.id, entry]));
const moduleIndex = new Map(catalog.modules.map((module) => [module.id, module]));
const aliasIndex = new Map(catalog.aliases.map((alias) => [alias.id, alias]));

const closures = new Map<string, Promise<Map<string, string>>>();

async function closureFor(id: string): Promise<Map<string, string>> {
  const entry = pluginIndex.get(id);
  if (entry === undefined) throw new Error("Unknown plugin: " + id);
  const cached = closures.get(id);
  if (cached !== undefined) return cached;
  const pending = (async (): Promise<Map<string, string>> => {
    if (entry.kind === "module") {
      const module = entry.module === undefined ? undefined : moduleIndex.get(entry.module);
      if (module === undefined) throw new Error(id + ": no matching canonical module");
      return collectClosure(root, [module.path, ...entry.extra]);
    }
    if (entry.source === undefined) throw new Error(id + ": standalone plugin requires a source directory");
    const seeds = (await filesUnder(path.join(root, entry.source))).map((file) => toPosix(path.relative(root, file)));
    return collectClosure(root, seeds);
  })();
  closures.set(id, pending);
  return pending;
}

async function pluginSkillFile(id: string): Promise<{ file: string; mode: string | undefined }> {
  const entry = pluginIndex.get(id);
  if (entry === undefined) throw new Error("Unknown plugin: " + id);
  if (entry.kind === "module") {
    const module = entry.module === undefined ? undefined : moduleIndex.get(entry.module);
    if (module === undefined) throw new Error(id + ": no matching canonical module");
    return { file: path.join(root, module.path), mode: undefined };
  }
  return { file: path.join(root, entry.source ?? "", "skills", id, "SKILL.md"), mode: undefined };
}

const catalogUri = "azskills://catalog";
const pluginUri = (id: string): string => "azskills://plugins/" + encodeURIComponent(id);
const fileUri = (id: string, relative: string): string =>
  pluginUri(id) + "/" + relative.split("/").map(encodeURIComponent).join("/");

const resources = [
  { uri: catalogUri, name: "catalog", title: "AzSkills plugin catalog", description: "Independent Codex plugins with category, capabilities, and hooks.", mimeType: "application/json" },
  ...plugins.plugins.map((entry) => ({
    uri: pluginUri(entry.id),
    name: entry.id,
    title: entry.id,
    description: entry.capabilities.join("; "),
    mimeType: "text/markdown",
  })),
];

const tool = {
  name: "azskills",
  description: "Browse the AzSkills plugin catalog, route a task to a plugin, or load a plugin contract or supporting file on demand. Start with action catalog or entry.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["catalog", "entry", "route", "plugin", "module", "file"] },
      id: { type: "string" },
      mode: { type: "string" },
      path: { type: "string" },
    },
    additionalProperties: false,
  },
};

const textResult = (text: string): { content: Array<{ type: "text"; text: string }> } => ({ content: [{ type: "text", text }] });

const MIME_BY_EXTENSION: Record<string, string> = {
  ".md": "text/markdown",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
};
const BINARY_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf", ".zip"]);

async function fileData(uri: string, file: string): Promise<ResourceData> {
  const bytes = await readFile(file);
  const ext = path.extname(file).toLowerCase();
  const mime = MIME_BY_EXTENSION[ext] ?? "text/plain";
  if (BINARY_EXTENSIONS.has(ext)) return { uri, mimeType: mime ?? "application/octet-stream", blob: bytes.toString("base64") };
  try {
    return { uri, mimeType: mime, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { uri, mimeType: "application/octet-stream", blob: bytes.toString("base64") };
  }
}

function resolveId(id: unknown): string {
  const alias = typeof id === "string" ? aliasIndex.get(id) : undefined;
  return alias?.canonical ?? (typeof id === "string" ? id : "");
}

async function call(input: Record<string, unknown>): Promise<unknown> {
  if (Object.keys(input).some((key) => !["action", "id", "mode", "path"].includes(key))) throw new Error("Unknown argument");
  const action = input.action ?? "entry";
  if (action === "catalog") return textResult(await readFile(path.join(root, "catalog/plugins.json"), "utf8"));
  if (action === "entry") return textResult(await readFile(path.join(root, "SKILL.md"), "utf8"));
  if (action === "route") return textResult(await readFile(path.join(root, "references/routing.md"), "utf8"));
  if (action === "plugin" || action === "module") {
    const rawId = typeof input.id === "string" ? input.id : "";
    const alias = aliasIndex.get(rawId);
    const id = alias?.canonical ?? rawId;
    const entry = pluginIndex.get(id);
    if (entry === undefined) throw new Error("Unknown plugin: " + String(input.id));
    const module = entry.kind === "module" && entry.module !== undefined ? moduleIndex.get(entry.module) : undefined;
    const requestedMode = input.mode;
    if (requestedMode !== undefined && typeof requestedMode !== "string") throw new Error("Unknown mode for " + id);
    const mode = typeof requestedMode === "string" ? requestedMode : alias?.mode;
    if (mode !== undefined) {
      if (module === undefined) throw new Error("Unknown mode for " + id);
      if (!module.modes.includes(mode)) throw new Error("Unknown mode for " + id);
    }
    const selected = await pluginSkillFile(id);
    const body = await readFile(selected.file, "utf8");
    return textResult((mode !== undefined ? "Selected mode: " + mode + "\n\n" : "") + body);
  }
  if (action === "file") {
    const id = resolveId(input.id);
    if (typeof input.path !== "string") throw new Error("A bundle-relative path is required");
    const bundle = await closureFor(id);
    const file = bundle.get(input.path);
    if (file === undefined) throw new Error("Unknown plugin-relative file path");
    const data = await fileData(fileUri(id, input.path), file);
    if (data.text === undefined) return { content: [{ type: "resource", resource: data }] };
    return textResult(data.text);
  }
  throw new Error("Unknown action: " + String(action));
}

async function readUri(uri: string): Promise<ResourceData> {
  if (uri === catalogUri) return fileData(uri, path.join(root, "catalog/plugins.json"));
  if (!uri.startsWith("azskills://plugins/")) throw new Error("Unknown resource: " + uri);
  const rest = uri.slice("azskills://plugins/".length);
  const slash = rest.indexOf("/");
  const id = decodeURIComponent(slash === -1 ? rest : rest.slice(0, slash));
  const relative = slash === -1 ? "" : rest.slice(slash + 1).split("/").map(decodeURIComponent).join("/");
  if (!pluginIndex.has(id)) throw new Error("Unknown plugin: " + id);
  if (relative === "") {
    const selected = await pluginSkillFile(id);
    return fileData(uri, selected.file);
  }
  const bundle = await closureFor(id);
  const file = bundle.get(relative);
  if (file === undefined) throw new Error("Unknown plugin-relative file path");
  return fileData(uri, file);
}

async function dispatch(request: JsonRpcRequest): Promise<unknown> {
  const { method, params = {} } = request;
  if (method === "initialize") {
    return {
      protocolVersion: typeof params.protocolVersion === "string" ? params.protocolVersion : "2025-06-18",
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: "azskills", version: catalog.version },
    };
  }
  if (method === "ping") return {};
  if (method === "tools/list") return { tools: [tool] };
  if (method === "resources/list") return { resources };
  if (method === "resources/read") {
    if (typeof params.uri !== "string") throw new Error("Resource URI must be a string");
    return { contents: [await readUri(params.uri)] };
  }
  if (method === "tools/call") {
    if (params.name !== "azskills") throw new Error("Unknown tool: " + String(params.name));
    const args = params.arguments ?? {};
    try {
      if (!isRecord(args)) throw new Error("Arguments must be an object");
      return await call(args);
    } catch (error) {
      return { ...textResult(errorMessage(error)), isError: true };
    }
  }
  throw new Error("Method not found: " + String(method));
}

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
const send = (message: unknown): void => {
  process.stdout.write(JSON.stringify(message) + "\n");
};
lines.on("line", (line) => {
  if (!line.trim()) return;
  queue = queue.then(async () => {
    let request: JsonRpcRequest;
    try {
      const parsed: unknown = JSON.parse(line);
      if (!isRecord(parsed)) throw new Error("Request must be an object");
      request = {
        jsonrpc: typeof parsed.jsonrpc === "string" ? parsed.jsonrpc : undefined,
        id: typeof parsed.id === "string" || typeof parsed.id === "number" || parsed.id === null ? parsed.id : undefined,
        method: typeof parsed.method === "string" ? parsed.method : undefined,
        params: isRecord(parsed.params) ? parsed.params : undefined,
      };
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }
    if (request.id === undefined) return;
    try {
      send({ jsonrpc: "2.0", id: request.id, result: await dispatch(request) });
    } catch (error) {
      send({
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: request.method?.startsWith("resources/") ? -32602 : -32601,
          message: errorMessage(error),
        },
      });
    }
  });
});
lines.on("close", () => {
  queue.catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
});
