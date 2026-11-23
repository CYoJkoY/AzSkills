import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const promptHook = path.join(root, "codex-plugin/hooks/delivery-prompt.ts");
const stopHook = path.join(root, "codex-plugin/hooks/delivery-stop.ts");
const state = await mkdtemp(path.join(tmpdir(), "azskills-delivery-hook-"));
const transcript = path.join(state, "session.jsonl");
const prompt = "Repair the delivery loop without losing the user's original request.";

interface EventInput {
  readonly hook_event_name: string;
  readonly session_id: string;
  readonly turn_id: string;
  readonly stop_hook_active?: boolean;
  readonly prompt?: string;
  readonly last_assistant_message?: unknown;
  readonly transcript_path?: string;
}

function run(hook: string, event: EventInput): string {
  const result = spawnSync(process.execPath, [hook], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify(event),
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function stop(event: Omit<EventInput, "hook_event_name" | "session_id"> & { session_id?: string }): { decision?: string; reason?: string } {
  const output = run(stopHook, {
    hook_event_name: "Stop",
    session_id: event.session_id ?? "session-a",
    ...event,
  });
  return output === "" ? {} : (JSON.parse(output) as { decision?: string; reason?: string });
}

try {
  run(promptHook, {
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-a",
    prompt,
  });

  const repeated = "A long answer that is clearly not making progress. ".repeat(8);
  const first = stop({ turn_id: "turn-a", last_assistant_message: repeated });
  assert.equal(first.decision, undefined);
  const second = stop({ turn_id: "turn-a", last_assistant_message: repeated });
  assert.equal(second.decision, undefined);
  const third = stop({ turn_id: "turn-a", last_assistant_message: repeated });
  assert.equal(third.decision, "block");
  assert.match(third.reason ?? "", /DEAD LOOP DETECTED/);
  assert.match(third.reason ?? "", /BEGIN RESENT PROMPT/);
  assert.match(third.reason ?? "", /Repair the delivery loop/);

  const capped = stop({ turn_id: "turn-a", last_assistant_message: repeated });
  assert.equal(capped.decision, "block", "the second restart is allowed");
  const cappedAgain = stop({ turn_id: "turn-a", last_assistant_message: repeated });
  assert.equal(cappedAgain.decision, undefined, "restart cap prevents an endless guard loop");

  // A prompt recorded for another turn must not be quoted as this turn's
  // prompt, so turn-b submits its own request before it is guarded.
  run(promptHook, {
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-b",
    prompt: "Second turn: explain the blank reply correction.",
  });

  const blank = stop({ turn_id: "turn-b", last_assistant_message: "\u200B\n\t" });
  assert.equal(blank.decision, "block");
  assert.match(blank.reason ?? "", /no visible text/);
  assert.match(blank.reason ?? "", /Second turn: explain the blank reply correction\./);
  assert.doesNotMatch(blank.reason ?? "", /Repair the delivery loop/, "another turn's prompt is not quoted");
  assert.match(blank.reason ?? "", /BEGIN RESENT PROMPT[\s\S]*END RESENT PROMPT/, "the prompt block is complete");

  const blankAgain = stop({ turn_id: "turn-b", last_assistant_message: "" });
  assert.equal(blankAgain.decision, "block", "a repeated blank reply escalates to a restart");
  assert.match(blankAgain.reason ?? "", /DEAD LOOP DETECTED/);
  assert.match(blankAgain.reason ?? "", /blank final reply/);
  assert.match(blankAgain.reason ?? "", /Second turn: explain the blank reply correction\./);

  const loopLines = Array.from({ length: 4 }, () => JSON.stringify({
    type: "response_item",
    payload: {
      type: "function_call",
      name: "bash",
      arguments: JSON.stringify({ command: "git status" }),
      internal_chat_message_metadata_passthrough: { turn_id: "turn-c" },
    },
  })).join("\n") + "\n";
  await writeFile(transcript, loopLines, "utf8");
  const tool = stop({ turn_id: "turn-c", transcript_path: transcript, last_assistant_message: "Working" });
  assert.equal(tool.decision, "block");
  assert.match(tool.reason ?? "", /DEAD LOOP DETECTED/);

  // With no recorded prompt (the plugin was installed mid-session), the Stop hook
  // still recovers the request from the transcript instead of quoting nothing.
  const fallbackFile = path.join(state, "fallback.jsonl");
  await writeFile(
    fallbackFile,
    JSON.stringify({
      type: "event_msg",
      payload: {
        type: "item_completed",
        item: { type: "UserMessage", content: [{ type: "text", text: "Recover the failing build from the transcript." }] },
      },
    }) + "\n",
    "utf8",
  );
  const fallback = stop({ turn_id: "turn-d", session_id: "session-d", transcript_path: fallbackFile, last_assistant_message: "<thinking>plan</thinking>" });
  assert.equal(fallback.decision, "block");
  assert.match(fallback.reason ?? "", /Recover the failing build from the transcript\./);
  assert.match(fallback.reason ?? "", /BEGIN RESENT PROMPT[\s\S]*END RESENT PROMPT/);

  // Records from an earlier turn must not be folded into the current one: the
  // first three calls sit before the newest prompt, and the fourth after it is
  // only one current-turn call.
  const callLine = (command: string): string => JSON.stringify({
    type: "response_item",
    payload: { type: "function_call", name: "bash", arguments: JSON.stringify({ command }) },
  });
  const userLine = (text: string): string =>
    JSON.stringify({
      type: "event_msg",
      payload: { type: "item_completed", item: { type: "UserMessage", content: [{ type: "text", text }] } },
    });
  const scopedFile = path.join(state, "scoped.jsonl");
  await writeFile(
    scopedFile,
    [
      userLine("First request"),
      callLine("git log --oneline -1"),
      callLine("git diff --stat"),
      callLine("git log --oneline -1"),
      userLine("Second request"),
      callLine("git status --short"),
    ].join("\n") + "\n",
    "utf8",
  );
  const scoped = stop({ turn_id: "", session_id: "session-e", transcript_path: scopedFile, last_assistant_message: "Working" });
  assert.equal(scoped.decision, undefined, "calls from an earlier turn do not count toward the current turn");

  const scopedLoopFile = path.join(state, "scoped-loop.jsonl");
  await writeFile(
    scopedLoopFile,
    [
      userLine("First request"),
      callLine("git log --oneline -1"),
      callLine("git diff --stat"),
      userLine("Second request"),
      callLine("git status --short"),
      callLine("git status --short"),
      callLine("git status --short"),
      callLine("git status --short"),
    ].join("\n") + "\n",
    "utf8",
  );
  const scopedLoop = stop({ turn_id: "", session_id: "session-f", transcript_path: scopedLoopFile, last_assistant_message: "Working" });
  assert.equal(scopedLoop.decision, "block", "four calls after the newest prompt are still a loop");

  console.log("delivery-hook.test.ts: prompt replay, loop restart, blank correction, turn scoping, and transcript detection passed");
} finally {
  await rm(state, { recursive: true, force: true });
}
