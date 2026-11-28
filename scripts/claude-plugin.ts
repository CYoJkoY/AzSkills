/*
 * The Claude Code projection of a packaged plugin.
 *
 * Claude Code discovers a plugin through its default layout: `skills/` for
 * skills, `hooks/hooks.json` for hooks, `.mcp.json` for MCP servers, and
 * `.claude-plugin/plugin.json` for metadata. A packaged AzSkills plugin already
 * carries `skills/` and the hook and MCP files the Codex manifest points at, so
 * the projection only adds metadata and translates the two component files to
 * the default locations and the `${CLAUDE_PLUGIN_ROOT}` variable.
 *
 * The Codex manifest is never rewritten, so one directory installs in either
 * host and neither host reads the other's component file.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isRecord } from "./runtime.ts";
import type { PluginCatalog } from "./types.ts";

/** The variable each host substitutes with the installed plugin directory. */
export const CODEX_ROOT_VARIABLE = "${PLUGIN_ROOT}";
export const CLAUDE_ROOT_VARIABLE = "${CLAUDE_PLUGIN_ROOT}";

export const CLAUDE_MANIFEST_DIRECTORY = ".claude-plugin";
export const CLAUDE_MANIFEST_FILE = "plugin.json";
export const CLAUDE_HOOKS_FILE = "hooks/hooks.json";
export const CLAUDE_MCP_FILE = ".mcp.json";
export const CLAUDE_MARKETPLACE_FILE = ".claude-plugin/marketplace.json";

const REPOSITORY_URL = "https://github.com/CYoJkoY/AzSkills";

/** Points every bundled path at the Claude Code plugin root. */
export function retargetRoot(text: string): string {
  return text.split(CODEX_ROOT_VARIABLE).join(CLAUDE_ROOT_VARIABLE);
}

/**
 * Rewrites the strings inside a parsed manifest and keeps every other field as
 * written. `statusMessage` survives on purpose: the hook reference lists it
 * as a common handler field, so a projected hook keeps the progress text its
 * author wrote instead of silently losing it.
 */
function retargetValue(value: unknown): unknown {
  if (typeof value === "string") return retargetRoot(value);
  if (Array.isArray(value)) return value.map(retargetValue);
  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      result[key] = retargetValue(inner);
    }
    return result;
  }
  return value;
}

export interface ClaudeHookEntry {
  readonly type?: string;
  readonly command?: string;
  readonly args?: readonly string[];
  readonly matcher?: string;
  readonly hooks?: readonly ClaudeHookEntry[];
}

export interface ClaudeHooksManifest {
  readonly hooks: Record<string, ClaudeHookEntry[]>;
}

/** Translates a Codex hook manifest into the Claude Code hook manifest. */
export function claudeHooksManifest(codexHooks: unknown): ClaudeHooksManifest {
  if (!isRecord(codexHooks) || !isRecord(codexHooks.hooks)) {
    throw new Error("Hook manifest must be an object with a hooks map");
  }
  const retargeted = retargetValue(codexHooks.hooks) as Record<string, ClaudeHookEntry[]>;
  const hooks: Record<string, ClaudeHookEntry[]> = {};
  for (const [event, groups] of Object.entries(retargeted)) {
    hooks[event] = groups.map(toClaudeHookEntry);
  }
  return { hooks };
}

/**
 * Splits `node "<path>"` into the exec form the hook reference documents for
 * handlers that reference a path placeholder. Exec form spawns `node` directly,
 * so no shell tokenizes the path and a host without Git Bash still runs the
 * handler.
 */
export function execFormCommand(command: string): { command: string; args: string[] } | null {
  const match = /^node\s+"([^"]+)"((?:\s+[^\s"]+)*)$/.exec(command.trim());
  if (match === null) return null;
  const extra = (match[2] ?? "").trim();
  return {
    command: "node",
    args: extra === "" ? [match[1] as string] : [match[1] as string, ...extra.split(/\s+/)],
  };
}

function toClaudeHookEntry(entry: ClaudeHookEntry): ClaudeHookEntry {
  const converted = entry.args === undefined && typeof entry.command === "string"
    ? execFormCommand(entry.command)
    : null;
  const result: ClaudeHookEntry = converted === null
    ? { ...entry }
    : { ...entry, command: converted.command, args: converted.args };
  if (entry.hooks !== undefined) {
    return { ...result, hooks: entry.hooks.map(toClaudeHookEntry) };
  }
  return result;
}

export interface ClaudeMcpManifest {
  readonly mcpServers: Record<string, Record<string, unknown>>;
}

/** Keys a Claude Code stdio server understands; the rest are Codex-only. */
const CLAUDE_MCP_KEYS = ["command", "args", "env", "type", "url", "headers"] as const;

/** Translates a Codex MCP manifest into the Claude Code `.mcp.json` shape. */
export function claudeMcpManifest(codexServers: unknown): ClaudeMcpManifest {
  if (!isRecord(codexServers) || !isRecord(codexServers.mcpServers)) {
    throw new Error("MCP manifest must be an object with an mcpServers map");
  }
  const servers: Record<string, Record<string, unknown>> = {};
  for (const [id, raw] of Object.entries(codexServers.mcpServers)) {
    if (!isRecord(raw)) throw new Error("MCP server must be an object: " + id);
    const server: Record<string, unknown> = {};
    for (const key of CLAUDE_MCP_KEYS) {
      if (raw[key] !== undefined) server[key] = retargetValue(raw[key]);
    }
    servers[id] = server;
  }
  return { mcpServers: servers };
}

export interface ClaudePluginMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

/**
 * The metadata manifest. Component paths are left out on purpose: the files sit
 * at the default locations Claude Code already reads, so the layout stays the
 * contract and no path form can drift from it.
 */
export function claudePluginManifest(metadata: ClaudePluginMetadata): Record<string, unknown> {
  return {
    name: metadata.id,
    displayName: metadata.displayName,
    version: metadata.version,
    description: metadata.description,
    author: { name: "AzSkills", url: REPOSITORY_URL },
    homepage: REPOSITORY_URL,
    repository: REPOSITORY_URL,
    license: "MIT",
    keywords: [...metadata.keywords],
  };
}

export interface ClaudeProjection {
  readonly manifest: string;
  readonly hooks: string | null;
  readonly mcp: string | null;
}

async function readJsonIfPresent(file: string): Promise<unknown> {
  const text = await readFile(file, "utf8").catch(() => null);
  return text === null ? null : JSON.parse(text);
}

/**
 * Writes the Claude Code projection into a packaged plugin directory.
 * `hooks` and `mcpServers` are repository-relative paths recorded by the
 * catalog; a plugin without them gets no component file, so the projection
 * never declares an empty component.
 */
export async function writeClaudeProjection(
  directory: string,
  metadata: ClaudePluginMetadata,
  hooks: string | null,
  mcpServers: string | null,
): Promise<ClaudeProjection> {
  const root = path.resolve(directory);
  const manifestFile = path.join(root, CLAUDE_MANIFEST_DIRECTORY, CLAUDE_MANIFEST_FILE);
  await mkdir(path.dirname(manifestFile), { recursive: true });
  await writeFile(manifestFile, JSON.stringify(claudePluginManifest(metadata), null, 2) + "\n", "utf8");

  let hooksFile: string | null = null;
  if (hooks !== null) {
    const source = await readJsonIfPresent(path.join(root, hooks));
    if (source === null) throw new Error(metadata.id + ": hook manifest is missing: " + hooks);
    hooksFile = path.join(root, CLAUDE_HOOKS_FILE);
    await mkdir(path.dirname(hooksFile), { recursive: true });
    await writeFile(hooksFile, JSON.stringify(claudeHooksManifest(source), null, 2) + "\n", "utf8");
  }

  let mcpFile: string | null = null;
  if (mcpServers !== null) {
    const source = await readJsonIfPresent(path.join(root, mcpServers));
    if (source === null) throw new Error(metadata.id + ": MCP manifest is missing: " + mcpServers);
    mcpFile = path.join(root, CLAUDE_MCP_FILE);
    await writeFile(mcpFile, JSON.stringify(claudeMcpManifest(source), null, 2) + "\n", "utf8");
  }

  return { manifest: manifestFile, hooks: hooksFile, mcp: mcpFile };
}

/**
 * The marketplace file. Sources stay relative to the marketplace root, which is
 * the repository root, so `claude plugin marketplace add <git source>` resolves
 * the committed build without an extra step.
 */
export function claudeMarketplaceManifest(catalog: PluginCatalog, pluginPathPrefix: string): Record<string, unknown> {
  const prefix = pluginPathPrefix.replace(/^\.?\//, "").replace(/\/$/, "");
  const base = prefix === "" ? "plugins" : prefix + "/plugins";
  return {
    name: catalog.marketplace.name,
    owner: { name: "AzSkills", url: REPOSITORY_URL },
    description: catalog.marketplace.description,
    plugins: catalog.plugins.map((entry) => ({
      name: entry.id,
      source: "./" + base + "/" + entry.id,
      description: entry.description,
      category: entry.category,
    })),
  };
}
