import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * End-to-end checks for the three-layer reasoning guard: the standing rule on
 * UserPromptSubmit, the mid-turn nudge on PreToolUse, and the Stop-time
 * correction. Each layer is a real hook process reading a real payload, because
 * the failure being fixed is a message the user sees, not a library return
 * value.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = await mkdtemp(path.join(tmpdir(), "azskills-reasoning-guard-"));
const work = await mkdtemp(path.join(tmpdir(), "azskills-reasoning-transcripts-"));

const promptHook = path.join(root, "codex-plugin/hooks/delivery-prompt.ts");
const toolHook = path.join(root, "no-think-tags/hooks/tool-hook.ts");
const stopHook = path.join(root, "no-think-tags/hooks/stop-hook.ts");

function run(hook: string, payload: unknown): string {
  const result = spawnSync(process.execPath, [hook], {
    cwd: root,
    encoding: "utf8",
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

interface HookOutput {
  readonly continue?: boolean;
  readonly decision?: string;
  readonly reason?: string;
  readonly hookSpecificOutput?: {
    readonly hookEventName?: string;
    readonly additionalContext?: string;
    readonly permissionDecision?: string;
  };
}

function parse(output: string): HookOutput | null {
  if (output === "") return null;
  return JSON.parse(output) as HookOutput;
}

function context(output: string): string {
  const parsed = parse(output);
  assert.ok(parsed?.hookSpecificOutput?.additionalContext, "expected additionalContext in " + output);
  return parsed.hookSpecificOutput.additionalContext;
}

/** One transcript line: a user prompt or an assistant message in a turn. */
function line(turnId: string, item: Record<string, unknown>): string {
  return JSON.stringify({ type: "event_msg", payload: { type: "item_completed", turn_id: turnId, item } });
}

async function transcript(name: string, lines: readonly string[]): Promise<string> {
  const file = path.join(work, name + ".jsonl");
  await writeFile(file, lines.join("\n") + "\n", "utf8");
  return file;
}

const user = (turnId: string, text: string): string =>
  line(turnId, { type: "UserMessage", content: [{ text }] });
const assistant = (turnId: string, id: string, text: string): string =>
  line(turnId, { type: "AgentMessage", id, content: [{ text }], phase: "commentary" });

try {
  // Layer one: the standing rule is injected on every real prompt, and never on
  // the plugin's own echoes, which would otherwise stack copies of itself.
  const rule = context(
    run(promptHook, { hook_event_name: "UserPromptSubmit", session_id: "s1", turn_id: "t1", prompt: "Fix the bug." }),
  );
  assert.match(rule, /^OUTPUT HYGIENE:/);
  assert.match(rule, /every assistant message is user-facing/);
  assert.match(rule, /think, thinking, thought/);
  // The rule text must never contain a literal tag, or it invites a copy-back.
  assert.doesNotMatch(rule, /</);
  assert.equal(
    run(promptHook, { hook_event_name: "UserPromptSubmit", session_id: "s1", turn_id: "t1", prompt: "OUTPUT HYGIENE: old rule" }),
    "",
  );
  assert.equal(
    run(promptHook, { hook_event_name: "UserPromptSubmit", session_id: "s1", turn_id: "t1", prompt: "DEAD LOOP 1: restart the turn" }),
    "",
  );
  assert.equal(run(promptHook, "{not json"), "");
  assert.equal(run(promptHook, { hook_event_name: "Stop", session_id: "s1", prompt: "x" }), "");

  // Layer two: a leaked progress note is caught before the next tool call.
  const leakA = await transcript("leak-a", [
    user("t1", "Fix the bug."),
    assistant("t1", "m1", "<thinking>compare the paths</thinking>Reading the file."),
  ]);
  const toolPayload = (file: string, turnId = "t1"): Record<string, unknown> => ({
    hook_event_name: "PreToolUse",
    session_id: "s1",
    turn_id: turnId,
    tool_name: "exec_command",
    tool_input: { command: "ls" },
    transcript_path: file,
  });

  const nudge = context(run(toolHook, toolPayload(leakA)));
  assert.match(nudge, /^OUTPUT HYGIENE:/);
  assert.match(nudge, /leaked a raw reasoning block/);
  assert.match(nudge, /Continue the task without commenting on this reminder\./);
  assert.doesNotMatch(nudge, /thinking/, "the nudge must not repeat the tag name");
  // The same leak is nudged once, not on every later tool call in the turn.
  assert.equal(run(toolHook, toolPayload(leakA)), "");

  // A second, distinct leak earns a second nudge; the third is over budget and
  // stays silent, so a model that keeps leaking is not nagged forever.
  const leakB = await transcript("leak-b", [
    user("t1", "Fix the bug."),
    assistant("t1", "m1", "<thinking>compare the paths</thinking>Reading the file."),
    assistant("t1", "m2", "Checking. <analysis>hidden</analysis>"),
  ]);
  assert.match(context(run(toolHook, toolPayload(leakB))), /leaked a raw reasoning block/);
  const leakC = await transcript("leak-c", [
    user("t1", "Fix the bug."),
    assistant("t1", "m1", "<thinking>compare the paths</thinking>Reading the file."),
    assistant("t1", "m2", "Checking. <analysis>hidden</analysis>"),
    assistant("t1", "m3", "<reflection>more</reflection>Still working."),
  ]);
  assert.equal(run(toolHook, toolPayload(leakC)), "");

  // A clean turn says nothing, and an unreadable transcript never blocks.
  const clean = await transcript("clean", [user("t2", "Fix it."), assistant("t2", "c1", "Done, the tests pass.")]);
  assert.equal(run(toolHook, toolPayload(clean, "t2")), "");
  assert.equal(run(toolHook, toolPayload(path.join(work, "missing.jsonl"), "t3")), "");
  assert.equal(run(toolHook, { hook_event_name: "PreToolUse", session_id: "" }), "");

  // The mid-turn budget is separate from the Stop budget: two nudges already
  // spent must not silence the Stop guard's own correction for the turn.
  const stopVerdict = parse(
    run(stopHook, {
      hook_event_name: "Stop",
      session_id: "s1",
      turn_id: "t1",
      stop_hook_active: false,
      last_assistant_message: "<thinking>final reasoning</thinking>",
    }),
  );
  assert.equal(stopVerdict?.decision, "block");
  assert.match(stopVerdict?.reason ?? "", /reasoning block/);

  console.log(
    "Reasoning guard tests passed: standing rule, mid-turn nudge, signature dedupe, per-turn budget, code-aware detection, and budget isolation.",
  );
} finally {
  await rm(state, { recursive: true, force: true });
  await rm(work, { recursive: true, force: true });
}
