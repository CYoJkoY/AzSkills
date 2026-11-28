/*
 * Resolves the REA runtime this plugin launches.
 *
 * The upstream package is installed once into a user-level directory and then
 * run from disk. Resolving the paths here keeps the setup script and the MCP
 * entry in agreement, and gives an uninstalled runtime one place to explain
 * itself instead of failing inside a host startup.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";

/** The upstream package and the version this plugin pins. */
export const REA_PACKAGE = "rea-agents";
export const REA_VERSION = "6.10.1";
export const RUNTIME_MARKER = ".azskills-rea.json";

const ENTRY: readonly string[] = ["scripts", "rea.mjs"];

/**
 * The directory that holds the runtime, unless `AZSKILLS_REA_RUNTIME` points
 * elsewhere. A user-level location keeps the install out of the plugin
 * directory, which a host may replace on update.
 */
export function runtimeDir(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.AZSKILLS_REA_RUNTIME;
  if (typeof override === "string" && override.trim() !== "") return path.resolve(override.trim());
  if (process.platform === "win32") {
    const base = env.LOCALAPPDATA ?? path.join(homedir(), "AppData", "Local");
    return path.join(base, "AzSkills", "rea-runtime");
  }
  const base = env.XDG_DATA_HOME ?? path.join(homedir(), ".local", "share");
  return path.join(base, "azskills", "rea-runtime");
}

/** The package's own CLI entry, which also serves the `mcp` subcommand. */
export const entryPoint = (dir: string): string => path.join(dir, "node_modules", REA_PACKAGE, ...ENTRY);

export const markerPath = (dir: string): string => path.join(dir, RUNTIME_MARKER);

/** True when the pinned package is installed and its entry script exists. */
export const runtimeReady = (dir: string): boolean => existsSync(entryPoint(dir));

/** The install record, so a stale runtime is detectable without reading npm state. */
export function readMarker(dir: string): Record<string, unknown> | null {
  try {
    const raw: unknown = JSON.parse(readFileSync(markerPath(dir), "utf8"));
    return typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** The command a user runs to install the runtime. */
export function setupCommand(setupScript: string): string {
  return 'node "' + setupScript + '"';
}
