#!/usr/bin/env node
/*
 * PreToolUse dispatcher for the delivery-loop guard.
 *
 * Scope is opt-in per repository: the guard only acts when `.azflow/state.json`
 * exists in the working directory. Outside an azflow project it always allows,
 * so installing the plugin never surprises an unrelated repository.
 */
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { bashCommand, denyReasonForBash, denyReasonForTool, isShellTool } from "./guard.ts";

interface StateConfig {
  readonly base: string;
}

function out(value: unknown): void {
  process.stdout.write(JSON.stringify(value));
}

function allow(): void {
  out({ continue: true });
}

function deny(reason: string): void {
  out({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

async function parseEvent(): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of process.stdin) raw += String(chunk);
  if (!raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function currentBranch(cwd: string): string | null {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd, encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || typeof result.stdout !== "string") return null;
  const trimmed = result.stdout.trim();
  return trimmed === "" ? null : trimmed;
}

async function readBase(cwd: string): Promise<string | null> {
  try {
    const text = await readFile(path.join(cwd, ".azflow", "state.json"), "utf8");
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const config = (parsed as { config?: unknown }).config;
    if (typeof config !== "object" || config === null) return null;
    const base = (config as StateConfig).base;
    return typeof base === "string" && base !== "" ? base : null;
  } catch {
    return null;
  }
}

const env = (name: string): boolean => process.env[name] === "1" || process.env[name] === "true";

async function main(): Promise<void> {
  const event = await parseEvent();
  if (event.hook_event_name !== "PreToolUse") {
    allow();
    return;
  }
  const base = await readBase(process.cwd());
  if (base === null) {
    allow();
    return;
  }
  const toolName = typeof event.tool_name === "string" ? event.tool_name : "";

  if (!env("AZFLOW_ALLOW_SUBAGENTS")) {
    const reason = denyReasonForTool(toolName);
    if (reason !== null) {
      deny(reason);
      return;
    }
  }

  if (isShellTool(toolName)) {
    const command = bashCommand(event.tool_input);
    const reason = denyReasonForBash(
      command,
      { branch: currentBranch(process.cwd()), base },
      {
        allowManualMerge: env("AZFLOW_ALLOW_MANUAL_MERGE"),
        allowBaseWrites: env("AZFLOW_ALLOW_BASE_WRITES"),
      },
    );
    if (reason !== null) {
      deny(reason);
      return;
    }
  }

  allow();
}

main().catch((error: unknown) => {
  // A guard failure must never block unrelated edits.
  allow();
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
});
