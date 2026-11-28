#!/usr/bin/env node
/*
 * Installs the pinned REA runtime into a user-level directory.
 *
 * `npx` re-resolves the package on every start, so one slow registry response
 * or a cold cache turns into a host startup timeout. Installing once and
 * running the same files afterwards removes that failure mode. Bun is the
 * recommended manager; pnpm and npm are accepted so the setup still works on a
 * machine without bun.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  REA_PACKAGE,
  REA_VERSION,
  entryPoint,
  markerPath,
  runtimeDir,
  runtimeReady,
} from "./rea-runtime.ts";

const MANAGERS: readonly string[] = ["bun", "pnpm", "npm"];
const onWindows = process.platform === "win32";

export function usage(): string {
  return [
    "Install the REA runtime the plugin launches.",
    "",
    "Usage:",
    "  node rea-setup.ts [--force] [--manager bun|pnpm|npm] [--print-path]",
    "",
    "The runtime goes to " + runtimeDir() + " unless AZSKILLS_REA_RUNTIME names",
    "another directory. Bun is preferred; pnpm and npm are accepted fallbacks.",
  ].join("\n");
}

function flagValue(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(name + " needs a value.");
  return value;
}

/** A manager counts as available when it answers `--version`. */
function available(manager: string): boolean {
  const probe = spawnSync(manager, ["--version"], { stdio: "ignore", shell: onWindows });
  return probe.status === 0;
}

export function chooseManager(argv: readonly string[]): string {
  const requested = flagValue(argv, "--manager");
  if (requested !== undefined) {
    if (!MANAGERS.includes(requested)) {
      throw new Error("--manager must be one of: " + MANAGERS.join(", ") + ".");
    }
    if (!available(requested)) throw new Error(requested + " is not on PATH.");
    return requested;
  }
  for (const manager of MANAGERS) {
    if (available(manager)) return manager;
  }
  throw new Error("No package manager found. Install bun (recommended), pnpm, or npm, then retry.");
}

/** Writes the manifest that pins the version, so the install is reproducible. */
function writeRuntimeManifest(dir: string): void {
  const manifest = {
    name: "azskills-rea-runtime",
    private: true,
    description: "Local REA runtime installed by the AzSkills rea plugin.",
    dependencies: { [REA_PACKAGE]: REA_VERSION },
  };
  writeFileSync(path.join(dir, "package.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

function install(dir: string, manager: string): void {
  const args = manager === "npm" ? ["install", "--no-audit", "--no-fund"] : ["install"];
  const result = spawnSync(manager, args, { cwd: dir, stdio: "inherit", shell: onWindows });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(manager + " install failed with exit code " + String(result.status) + ".");
  }
}

function main(argv: readonly string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(usage() + "\n");
    return 0;
  }
  const dir = runtimeDir();
  if (argv.includes("--print-path")) {
    process.stdout.write(dir + "\n");
    return 0;
  }
  const force = argv.includes("--force");
  if (runtimeReady(dir) && !force) {
    process.stdout.write("REA runtime already installed: " + dir + "\n");
    process.stdout.write("Entry: " + entryPoint(dir) + "\n");
    process.stdout.write("Re-run with --force to reinstall.\n");
    return 0;
  }
  const manager = chooseManager(argv);
  mkdirSync(dir, { recursive: true });
  writeRuntimeManifest(dir);
  process.stdout.write("Installing " + REA_PACKAGE + "@" + REA_VERSION + " with " + manager + " into " + dir + "\n");
  install(dir, manager);
  if (!runtimeReady(dir)) {
    throw new Error("Install finished but " + entryPoint(dir) + " is missing.");
  }
  writeFileSync(
    markerPath(dir),
    JSON.stringify(
      {
        package: REA_PACKAGE,
        version: REA_VERSION,
        manager,
        entry: entryPoint(dir),
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  process.stdout.write("REA runtime ready: " + entryPoint(dir) + "\n");
  process.stdout.write("Restart the MCP client so it launches the installed runtime.\n");
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
