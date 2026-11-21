import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasVisibleAnswer, visibleText } from "../plugins/empty-reply/lib/empty-reply.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = path.join(root, "plugins/empty-reply/hooks/stop-hook.ts");
const state = await mkdtemp(path.join(tmpdir(), "azskills-empty-reply-"));

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
  assert.match(parsed.reason ?? "", /visible assistant text/);
  return true;
};

try {
  assert.equal(visibleText("Answer."), "Answer.");
  assert.equal(visibleText("  \n\t "), "");
  assert.equal(visibleText("<thinking>hidden</thinking>"), "");
  assert.equal(visibleText("\u200B\uFEFF"), "");
  assert.equal(hasVisibleAnswer(null), false);
  assert.equal(hasVisibleAnswer(""), false);
  assert.equal(hasVisibleAnswer("ok"), true);

  assert.equal(blocks(run({ last_assistant_message: "Here is the answer." })), false);
  assert.equal(blocks(run({ last_assistant_message: null })), true);
  assert.equal(blocks(run({ last_assistant_message: "   \n\t  " })), true);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>only reasoning</thinking>" })), true);
  assert.equal(blocks(run({ last_assistant_message: "\u200B\uFEFF\u00AD" })), true);
  assert.equal(blocks(run({ last_assistant_message: "", stop_hook_active: true })), false);
  assert.equal(blocks(run({ hook_event_name: "UserPromptSubmit", last_assistant_message: null })), false);
  assert.equal(blocks(run("{not json")), false);
  assert.equal(blocks(run({ last_assistant_message: 42 })), false);

  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: null })), true);
  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: null })), true);
  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: null })), false, "At most two continuations per turn");

  console.log("Empty-reply hook tests passed: null, whitespace, thinking-only, invisible text, bounded continuations, and fail-safe inputs.");
} finally {
  await rm(state, { recursive: true, force: true });
}
