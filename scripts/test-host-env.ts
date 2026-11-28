/*
 * Host-variable parity for the hooks.
 *
 * The same handler file ships to both installable hosts, and each host exports
 * its own variable for "where the plugin is" and "where the plugin may write
 * state": PLUGIN_ROOT and PLUGIN_DATA in Codex, CLAUDE_PLUGIN_ROOT and
 * CLAUDE_PLUGIN_DATA in the other. A hook that reads only the first pair either
 * throws or quietly falls back to the system temp directory there.
 *
 * Each case below unsets the Codex pair and runs the handler with only the
 * CLAUDE_* pair set, which is the state a hook actually sees under that host.
 */

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stateDirectory } from "../codex-plugin/hooks/session-state.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Run {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The environment a handler sees when only the second host's variables exist. */
function hostOnly(vars: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.PLUGIN_ROOT;
  delete env.PLUGIN_DATA;
  delete env.CLAUDE_PLUGIN_ROOT;
  delete env.CLAUDE_PLUGIN_DATA;
  return { ...env, ...vars };
}

function run(script: string, args: readonly string[], payload: unknown, env: NodeJS.ProcessEnv): Run {
  const input = typeof payload === "string" ? payload : JSON.stringify(payload);
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 30000,
    env,
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function context(result: Run): string {
  assert.equal(result.status, 0, result.stderr);
  assert.notEqual(result.stdout, "", "expected an injected pointer");
  const parsed = JSON.parse(result.stdout) as {
    continue?: boolean;
    hookSpecificOutput?: { additionalContext?: string };
  };
  assert.equal(parsed.continue, true);
  const text = parsed.hookSpecificOutput?.additionalContext ?? "";
  assert.notEqual(text, "", "expected injected context");
  return text;
}

const scratch: string[] = [];

async function directory(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  scratch.push(dir);
  return dir;
}

// The shared state helper reads the data variable at call time.
{
  const first = await directory("azskills-host-env-codex-");
  const second = await directory("azskills-host-env-other-");
  const save = {
    root: process.env.PLUGIN_ROOT,
    data: process.env.PLUGIN_DATA,
    otherRoot: process.env.CLAUDE_PLUGIN_ROOT,
    otherData: process.env.CLAUDE_PLUGIN_DATA,
  };
  const restore = (key: string, value: string | undefined): void => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  try {
    process.env.PLUGIN_DATA = first;
    process.env.CLAUDE_PLUGIN_DATA = second;
    assert.equal(stateDirectory(), first, "PLUGIN_DATA stays authoritative when both are set");
    delete process.env.PLUGIN_DATA;
    assert.equal(stateDirectory(), second, "the other host's data variable is the fallback");
    delete process.env.CLAUDE_PLUGIN_DATA;
    assert.equal(stateDirectory(), tmpdir(), "no variable still degrades to the temp directory");
  } finally {
    restore("PLUGIN_DATA", save.data);
    restore("CLAUDE_PLUGIN_DATA", save.otherData);
    restore("PLUGIN_ROOT", save.root);
    restore("CLAUDE_PLUGIN_ROOT", save.otherRoot);
  }
}

try {
  // Intent pointers must name the skill inside the installed plugin directory.
  const pluginRoot = await directory("azskills-host-env-plugin-");
  const visual: Array<[string, string, string]> = [
    ["design", "skills/design/SKILL.md", "Refine this UI and add its motion states."],
    ["visual-assets", "skills/visual-assets/SKILL.md", "Create a logo and favicon for my app."],
  ];
  for (const [plugin, skill, prompt] of visual) {
    const text = context(run("codex-plugin/hooks/visual-intent.ts", [plugin], {
      hook_event_name: "UserPromptSubmit",
      prompt,
    }, hostOnly({ CLAUDE_PLUGIN_ROOT: pluginRoot })));
    assert.ok(text.includes(path.join(pluginRoot, skill)), plugin + " must resolve its skill through the host root");
  }

  const members: Array<[string, string, string]> = [
    ["serena", "plugins/serena/codex-plugin/hooks/serena-intent.ts", "Find all references to this symbol and rename it safely."],
    ["rea", "plugins/rea/codex-plugin/hooks/rea-intent.ts", "Decompile this native binary with Ghidra and trace its imports."],
  ];
  for (const [plugin, script, prompt] of members) {
    const text = context(run(script, [], {
      hook_event_name: "UserPromptSubmit",
      prompt,
    }, hostOnly({ CLAUDE_PLUGIN_ROOT: pluginRoot })));
    assert.ok(text.includes(path.join(pluginRoot, "skills", plugin, "SKILL.md")), plugin + " must resolve its skill through the host root");
  }

  // The Godot guard used to throw when only the second host's root existed.
  const guard = run("codex-plugin/hooks/godot3-guard.ts", [], {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: { file_path: "notes.txt", content: "plain text" },
  }, hostOnly({ CLAUDE_PLUGIN_ROOT: root }));
  assert.equal(guard.status, 0, guard.stderr);
  assert.equal(guard.stderr.includes("is required"), false, "the guard must not refuse to start without the Codex root");
  assert.equal((JSON.parse(guard.stdout === "" ? "{}" : guard.stdout) as { continue?: boolean }).continue, true, "an unrelated write is allowed");

  // Session state must land in the host data directory, not the temp directory.
  const stateRoot = await directory("azskills-host-env-state-");
  const stop = run("no-think-tags/hooks/stop-hook.ts", [], {
    hook_event_name: "Stop",
    session_id: "session-a",
    turn_id: "turn-a",
    stop_hook_active: false,
    last_assistant_message: "<thinking>leaked</thinking>\n\nAnswer.",
  }, hostOnly({ CLAUDE_PLUGIN_DATA: stateRoot }));
  assert.equal(stop.status, 0, stop.stderr);
  assert.equal((JSON.parse(stop.stdout === "" ? "{}" : stop.stdout) as { decision?: string }).decision, "block", "a leaked reasoning block is still corrected");
  const written = await readdir(path.join(stateRoot, "azskills-no-think-tags")).catch(() => [] as string[]);
  assert.ok(written.length > 0, "correction state is written under the host data directory");

  // Child-turn dedup needs a data directory; the Codex variable alone is not it.
  const steerRoot = await directory("azskills-host-env-steer-");
  await mkdir(steerRoot, { recursive: true });
  const steer = run("codex-plugin/taste/hooks/steer.ts", [], {
    hook_event_name: "SubagentStart",
    session_id: "session-a",
    turn_id: "turn-a",
    agent_id: "agent-a",
  }, hostOnly({ CLAUDE_PLUGIN_DATA: steerRoot }));
  assert.equal(steer.status, 0, steer.stderr);
  const steered = JSON.parse(steer.stdout === "" ? "{}" : steer.stdout) as {
    continue?: boolean;
    hookSpecificOutput?: { additionalContext?: string };
  };
  assert.equal(steered.continue, true, "a subagent start is steered, not rejected for missing metadata");
  assert.ok((steered.hookSpecificOutput?.additionalContext ?? "").length > 0);

  console.log("Host environment tests passed: hooks resolve the second host's root and data variables.");
} finally {
  await Promise.all(scratch.map((dir) => rm(dir, { recursive: true, force: true })));
}
