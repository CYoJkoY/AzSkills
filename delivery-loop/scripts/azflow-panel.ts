#!/usr/bin/env node
/*
 * MCP server for the delivery-loop panel.
 *
 * The panel is the readable face of a run: the goal, the ledger, the next
 * waves, the drift findings, and the configuration the loop uses. This server
 * exposes that snapshot as a tool and as a UI resource, so the Codex side panel
 * can render it, and it accepts the configuration patch the panel form sends.
 *
 * Every mutation goes through the ledger lock, so the panel and the CLI cannot
 * write the same state file at once.
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { readGoal } from "./goal.ts";
import type { GoalState } from "./goal.ts";
import {
  PANEL_CONFIG_KEYS,
  PANEL_CONFIG_TOOL,
  PANEL_APP_TITLE,
  PANEL_ICON,
  PANEL_SNAPSHOT_URI,
  PANEL_TOOL,
  PANEL_UI_MIME,
  PANEL_UI_URI,
  applyPanelPatch,
  panelBrief,
  panelHtml,
  panelSnapshot,
  panelToolMeta,
} from "./panel.ts";
import type { PanelSnapshot } from "./panel.ts";
import { isRecord, pathExists, readState, statePath, withLock, worktreesRoot } from "./state.ts";
import type { FlowState } from "./state.ts";

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const version = "1.0.0";

/** Deepest ancestor walk, so a panel started in a subdirectory finds the project. */
const MAX_PROJECT_WALK = 12;

async function resolveProject(requested: unknown): Promise<string> {
  const explicit = typeof requested === "string" && requested !== "" ? requested : process.env.AZFLOW_PROJECT;
  if (explicit !== undefined && explicit !== "") return path.resolve(explicit);
  let directory = process.cwd();
  for (let depth = 0; depth < MAX_PROJECT_WALK; depth += 1) {
    if (await pathExists(statePath(directory))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return process.cwd();
}

async function worktreeNames(project: string): Promise<string[]> {
  return readdir(worktreesRoot(project), { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
    .catch(() => [] as string[]);
}

async function snapshotFor(project: string): Promise<PanelSnapshot> {
  const state = await readState(project).catch(() => null);
  const goal: GoalState | null = await readGoal(project).catch(() => null);
  return panelSnapshot({
    project,
    now: Date.now(),
    goal,
    state,
    worktreeDirectories: await worktreeNames(project),
  });
}

const textResult = (text: string): { content: Array<{ type: "text"; text: string }> } => ({
  content: [{ type: "text", text }],
});

const panelTool = {
  name: PANEL_TOOL,
  title: PANEL_APP_TITLE,
  description:
    "Read the delivery-loop panel for a project: goal, ledger tasks, next waves, drift findings, and configuration. The Codex side panel renders this snapshot as a GUI.",
  icons: [PANEL_ICON],
  annotations: {
    title: PANEL_APP_TITLE,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["snapshot", "brief", "html"] },
      project: { type: "string" },
    },
    additionalProperties: false,
  },
  _meta: panelToolMeta(),
};

const configTool = {
  name: PANEL_CONFIG_TOOL,
  title: "AzFlow configuration",
  description:
    "Read or change the delivery-loop configuration the panel edits. Editable keys: " +
    PANEL_CONFIG_KEYS.join(", ") +
    ". The base branch and remote are detected, not editable, and stay on the command line.",
  annotations: {
    title: "AzFlow configuration",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["get", "set", "keys"] },
      project: { type: "string" },
      patch: { type: "object" },
    },
    additionalProperties: false,
  },
};

async function setConfig(project: string, patch: unknown): Promise<FlowState["config"]> {
  return withLock(project, async (state) => {
    state.config = applyPanelPatch(state.config, patch);
    return state.config;
  });
}

async function callPanel(input: Record<string, unknown>): Promise<unknown> {
  const project = await resolveProject(input.project);
  const action = input.action ?? "snapshot";
  if (action === "brief") return textResult(panelBrief(await snapshotFor(project)));
  if (action === "html") return textResult(panelHtml(await snapshotFor(project)));
  if (action !== "snapshot") throw new Error("Unknown panel action: " + String(action));
  const snapshot = await snapshotFor(project);
  return {
    ...textResult(JSON.stringify(snapshot)),
    structuredContent: snapshot,
  };
}

async function callConfig(input: Record<string, unknown>): Promise<unknown> {
  const project = await resolveProject(input.project);
  const action = input.action ?? "get";
  if (action === "keys") return textResult(JSON.stringify({ keys: [...PANEL_CONFIG_KEYS] }));
  if (action === "get") {
    const state = await readState(project);
    if (state === null) throw new Error("No ledger at " + project + ". Run: azflow init");
    return textResult(JSON.stringify(state.config));
  }
  if (action === "set") {
    const config = await setConfig(project, input.patch);
    return textResult(JSON.stringify(config));
  }
  throw new Error("Unknown config action: " + String(action));
}

const resources = [
  {
    uri: PANEL_UI_URI,
    name: "panel",
    title: "AzFlow delivery panel",
    description: "Goal, ledger tasks, next waves, drift findings, and editable configuration.",
    mimeType: PANEL_UI_MIME,
  },
  {
    uri: PANEL_SNAPSHOT_URI,
    name: "snapshot",
    title: "AzFlow delivery snapshot",
    description: "The same panel state as JSON, for a client that renders text only.",
    mimeType: "application/json",
  },
];

async function readResource(uri: string): Promise<{ uri: string; mimeType: string; text: string }> {
  if (uri === PANEL_UI_URI) {
    return { uri, mimeType: PANEL_UI_MIME, text: panelHtml(await snapshotFor(await resolveProject(undefined))) };
  }
  if (uri === PANEL_SNAPSHOT_URI) {
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(await snapshotFor(await resolveProject(undefined))),
    };
  }
  throw new Error("Unknown resource: " + uri);
}

async function dispatch(request: JsonRpcRequest): Promise<unknown> {
  const { method, params = {} } = request;
  if (method === "initialize") {
    return {
      protocolVersion: typeof params.protocolVersion === "string" ? params.protocolVersion : "2025-06-18",
      capabilities: { resources: {}, tools: {} },
      serverInfo: { name: "azflow-panel", version },
    };
  }
  if (method === "ping") return {};
  if (method === "tools/list") return { tools: [panelTool, configTool] };
  if (method === "resources/list") return { resources };
  if (method === "resources/read") {
    if (typeof params.uri !== "string") throw new Error("Resource URI must be a string");
    return { contents: [await readResource(params.uri)] };
  }
  if (method === "tools/call") {
    const args = params.arguments ?? {};
    if (!isRecord(args)) return { ...textResult("Arguments must be an object"), isError: true };
    try {
      if (params.name === PANEL_TOOL) return await callPanel(args);
      if (params.name === PANEL_CONFIG_TOOL) return await callConfig(args);
      throw new Error("Unknown tool: " + String(params.name));
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
