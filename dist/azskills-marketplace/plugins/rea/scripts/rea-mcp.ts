#!/usr/bin/env node
/*
 * The MCP entry for the REA plugin.
 *
 * It launches the installed runtime with inherited stdio, so the client speaks
 * the protocol directly to REA. When the runtime is absent it fails with the
 * exact install command instead of downloading during a host startup that will
 * time out.
 */

import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { entryPoint, runtimeDir, runtimeReady, setupCommand } from "./rea-runtime.ts";

const setupScript = fileURLToPath(new URL("./rea-setup.ts", import.meta.url));
const dir = runtimeDir();

if (!runtimeReady(dir)) {
  process.stderr.write(
    "REA runtime is not installed at " + dir + ".\n" +
      "Install it once with: " + setupCommand(setupScript) + "\n" +
      "Bun is preferred; npm and pnpm work too. Then restart the MCP client.\n",
  );
  process.exit(1);
}

const child = spawn(process.execPath, [entryPoint(dir), "mcp"], { stdio: "inherit" });

child.on("error", (error: Error) => {
  process.stderr.write("Failed to start REA: " + error.message + "\n");
  process.exit(1);
});

child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
