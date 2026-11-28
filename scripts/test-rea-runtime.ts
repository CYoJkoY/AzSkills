/*
 * Tests the REA launcher surface.
 *
 * The plugin no longer runs `npx`. These assert the property that matters:
 * the manifest launches a local Node script, the resolver honors its override,
 * a missing runtime fails loudly with the install command, and the setup script
 * reports the directory without touching the network.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REA_PACKAGE,
  REA_VERSION,
  entryPoint,
  markerPath,
  readMarker,
  runtimeDir,
  runtimeReady,
  setupCommand,
} from "../plugins/rea/scripts/rea-runtime.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plugin = path.join(root, "plugins", "rea");
const setupScript = path.join(plugin, "scripts", "rea-setup.ts");
const mcpScript = path.join(plugin, "scripts", "rea-mcp.ts");
const manifestPath = path.join(plugin, ".codex-plugin", "mcp.json");

// The pinned package is stated once and both scripts read it.
assert.equal(REA_PACKAGE, "rea-agents");
assert.match(REA_VERSION, /^\d+\.\d+\.\d+$/);

// The manifest launches a local script, never a package resolver.
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  mcpServers: Record<string, { command?: string; args?: string[]; startup_timeout_sec?: number }>;
};
const server = manifest.mcpServers.rea;
assert.ok(server !== undefined, "the plugin declares a rea server");
assert.equal(server.command, "node", "the server runs node from disk");
assert.deepEqual(server.args, ["${PLUGIN_ROOT}/scripts/rea-mcp.ts"]);
assert.equal(JSON.stringify(manifest).includes("npx"), false, "the manifest never runs npx");
assert.equal(JSON.stringify(manifest).includes("rea-agents@"), false, "no package specifier is resolved at startup");
assert.equal(server.startup_timeout_sec, 30);

// An override moves the runtime; the default stays user-level and outside the plugin.
const override = path.join(tmpdir(), "rea-override-probe");
assert.equal(runtimeDir({ AZSKILLS_REA_RUNTIME: override }), path.resolve(override));
assert.equal(runtimeDir({ AZSKILLS_REA_RUNTIME: "  " }).includes(plugin), false, "the default runtime is outside the plugin");
assert.ok(runtimeDir({}).length > 0);

const dir = runtimeDir({ AZSKILLS_REA_RUNTIME: override });
mkdirSync(dir, { recursive: true });
try {
  // An empty directory is not an installed runtime.
  assert.equal(runtimeReady(dir), false);
  assert.equal(readMarker(dir), null, "no marker means no recorded install");
  assert.ok(entryPoint(dir).endsWith(path.join("node_modules", REA_PACKAGE, "scripts", "rea.mjs")));

  // The MCP entry refuses to start and names the install command.
  const missing = spawnSync(process.execPath, [mcpScript], {
    env: { ...process.env, AZSKILLS_REA_RUNTIME: dir },
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(missing.status, 1, "a missing runtime exits non-zero");
  assert.match(missing.stderr, /REA runtime is not installed/);
  assert.ok(
    missing.stderr.includes(setupCommand(setupScript)),
    "the failure prints the exact install command",
  );
  assert.match(missing.stderr, /Bun is preferred/);

  // A present entry script is enough to be ready; the marker stays advisory.
  const installedEntry = entryPoint(dir);
  mkdirSync(path.dirname(installedEntry), { recursive: true });
  writeFileSync(installedEntry, "process.exit(7);\n", "utf8");
  assert.equal(runtimeReady(dir), true);

  writeFileSync(markerPath(dir), JSON.stringify({ package: REA_PACKAGE, version: REA_VERSION }) + "\n", "utf8");
  assert.equal(readMarker(dir)?.version, REA_VERSION);

  // Setup resolves the directory without a network call.
  const printed = spawnSync(process.execPath, [setupScript, "--print-path"], {
    env: { ...process.env, AZSKILLS_REA_RUNTIME: dir },
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(printed.status, 0);
  assert.equal(printed.stdout.trim(), dir);

  // The launcher forwards the child's exit code instead of inventing one.
  const child = spawnSync(process.execPath, [mcpScript], {
    env: { ...process.env, AZSKILLS_REA_RUNTIME: dir },
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(child.status, 7, "the child exit code is forwarded");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("test-rea-runtime.ts: all assertions passed");
