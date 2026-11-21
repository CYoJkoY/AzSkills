import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripAllThinking, stripLeadingThinking } from "../plugins/no-think-tags/lib/think-tags.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = path.join(root, "plugins/no-think-tags/hooks/stop-hook.ts");
const state = await mkdtemp(path.join(tmpdir(), "azskills-think-tags-"));

interface StopPayload {
  hook_event_name?: string;
  session_id?: string;
  turn_id?: string;
  stop_hook_active?: boolean;
  /** Untrusted payload fixture: any JSON value is allowed without a cast. */
  last_assistant_message?: unknown;
}

let turnCounter = 0;

function run(payload: StopPayload | string): string {
  const input = typeof payload === "string" ? payload : JSON.stringify({
    hook_event_name: "Stop",
    session_id: "session-a",
    turn_id: `turn-a-${turnCounter++}`,
    stop_hook_active: false,
    last_assistant_message: null,
    ...payload,
  });
  const result = spawnSync(process.execPath, [hook], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

const blocks = (output: string): boolean => {
  if (output === "") return false;
  const parsed = JSON.parse(output) as { decision?: string; reason?: string };
  assert.equal(parsed.decision, "block");
  assert.match(parsed.reason ?? "", /reasoning block/);
  return true;
};

try {
  assert.deepEqual(stripLeadingThinking("Plain answer."), { stripped: false, text: "Plain answer." });
  assert.deepEqual(stripLeadingThinking("  <thinking>plan</thinking>\n\nAnswer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("<thought>a</thought><thinking>b</thinking>Done."), { stripped: true, text: "Done." });
  assert.deepEqual(stripLeadingThinking("<thinking>unclosed\nAnswer."), { stripped: false, text: "<thinking>unclosed\nAnswer." });
  assert.deepEqual(stripLeadingThinking("Intro <thinking>x</thinking>"), { stripped: false, text: "Intro <thinking>x</thinking>" });
  assert.equal(stripLeadingThinking("<thinking>a\n```\n</thinking>\n```\nBody").stripped, false);
  assert.equal(stripLeadingThinking("<thinking>a `</thinking>` b</thinking>Body").text, "Body");
  assert.equal(stripAllThinking("a<thinking>hidden</thinking>b"), "ab");

  assert.equal(blocks(run({ last_assistant_message: "Plain answer." })), false);
  assert.equal(blocks(run({ last_assistant_message: "  <thinking>plan</thinking>\nAnswer." })), true);
  assert.equal(blocks(run({ last_assistant_message: "<thought>plan</thought>Done." })), true);
  assert.equal(blocks(run({ last_assistant_message: "Intro <thinking>x</thinking>" })), false);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>unclosed" })), false);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>a `</thinking>` b</thinking>Body" })), true);
  assert.equal(blocks(run({ last_assistant_message: null })), false);
  assert.equal(blocks(run({ last_assistant_message: 42 })), false);
  assert.equal(blocks(run({ hook_event_name: "UserPromptSubmit", last_assistant_message: "<thinking>x</thinking>Body" })), false);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>x</thinking>Body", stop_hook_active: true })), false);
  assert.equal(blocks(run("{not json")), false);
  assert.equal(blocks(run({ last_assistant_message: "" })), false);

  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: "<thinking>x</thinking>Body" })), true);
  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: "<thinking>x</thinking>Body" })), false, "Only one correction per turn");

  console.log("No-think-tags hook tests passed: leading blocks, code-aware closing tags, bounded correction, and fail-safe inputs.");
} finally {
  await rm(state, { recursive: true, force: true });
}
