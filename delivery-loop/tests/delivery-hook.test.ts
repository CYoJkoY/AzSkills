import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isReasoningLeak } from "../../codex-plugin/hooks/output-hygiene.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const promptHook = path.join(root, "codex-plugin/hooks/delivery-prompt.ts");
const sessionHook = path.join(root, "codex-plugin/hooks/delivery-session.ts");
const stopHook = path.join(root, "codex-plugin/hooks/delivery-stop.ts");
const hygieneHook = path.join(root, "codex-plugin/hooks/delivery-hygiene.ts");
const azflowCli = path.join(root, "delivery-loop/scripts/azflow.ts");
const state = await mkdtemp(path.join(tmpdir(), "azskills-delivery-hook-"));
const transcript = path.join(state, "session.jsonl");
// The dead-loop restart is scoped to a delivery project, so the guarded runs
// need a directory that carries the azflow ledger; plain directories must not
// be restarted at all.
const project = path.join(state, "project");
await mkdir(path.join(project, ".azflow"), { recursive: true });
await writeFile(path.join(project, ".azflow", "state.json"), "{}\n", "utf8");
const prompt = "Repair the delivery loop without losing the user's original request.";

interface EventInput {
  readonly hook_event_name: string;
  readonly session_id: string;
  readonly turn_id: string;
  readonly stop_hook_active?: boolean;
  readonly prompt?: string;
  readonly last_assistant_message?: unknown;
  readonly transcript_path?: string;
  readonly tool_name?: string;
}

function run(hook: string, event: EventInput): string {
  return runIn(root, hook, event);
}

function runIn(cwd: string, hook: string, event: EventInput): string {
  const result = spawnSync(process.execPath, [hook], {
    cwd,
    encoding: "utf8",
    input: JSON.stringify(event),
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function stop(event: Omit<EventInput, "hook_event_name" | "session_id"> & { session_id?: string }): { decision?: string; reason?: string } {
  const output = runIn(project, stopHook, {
    hook_event_name: "Stop",
    session_id: event.session_id ?? "session-a",
    ...event,
  });
  return output === "" ? {} : (JSON.parse(output) as { decision?: string; reason?: string });
}

try {
  // The prompt hook states the output-hygiene rule up front, because a leak in
  // a progress note is on screen before the Stop hook ever runs.
  const promptOut = run(promptHook, {
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-a",
    prompt,
  });
  assert.match(promptOut, /OUTPUT HYGIENE/, "the prompt hook states the rule");
  const promptPayload = JSON.parse(promptOut) as {
    continue?: boolean;
    hookSpecificOutput?: { hookEventName?: string; additionalContext?: string };
  };
  assert.equal(promptPayload.continue, true);
  assert.equal(promptPayload.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  assert.match(promptPayload.hookSpecificOutput?.additionalContext ?? "", /reasoning tag/);
  assert.doesNotMatch(promptPayload.hookSpecificOutput?.additionalContext ?? "", /<thinking>/);

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

  // A wrapped reasoning block and an opener that never closes are leaks; a
  // plain note, or a tag quoted inside backticks, is not.
  assert.equal(isReasoningLeak("<thinking>x</thinking>\nRetry."), true);
  assert.equal(isReasoningLeak("<thinking>never closes"), true);
  // Models also truncate the opener: the tag name runs straight into the text,
  // or stops at a space, with no closing bracket. The name is still on screen.
  assert.equal(isReasoningLeak("<thinkingThere is a value</thinking>\nRetry."), true);
  assert.equal(isReasoningLeak("<think beyond? note"), true);
  assert.equal(isReasoningLeak("Plain progress note."), false);
  assert.equal(isReasoningLeak("`<thinking>` mentioned in code"), false);
  assert.equal(isReasoningLeak("the model wrote <thinking without a closing bracket"), false);
  assert.equal(isReasoningLeak("`<thinking` and `</thinking>` in docs"), false);

  const assistantLine = (id: string, turnId: string, text: string): string =>
    JSON.stringify({
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        phase: "commentary",
        id,
        content: [{ type: "output_text", text }],
        internal_chat_message_metadata_passthrough: { turn_id: turnId },
      },
    });
  const eventAgentLine = (id: string, turnId: string, text: string): string =>
    JSON.stringify({
      type: "event_msg",
      payload: {
        type: "item_completed",
        turn_id: turnId,
        item: { type: "AgentMessage", id, phase: "commentary", content: [{ type: "Text", text }] },
      },
    });
  const turnUserLine = (turnId: string, text: string): string =>
    JSON.stringify({
      type: "event_msg",
      payload: {
        type: "item_completed",
        turn_id: turnId,
        item: { type: "UserMessage", content: [{ type: "text", text }] },
      },
    });
  const hygieneEvent = (turnId: string, file: string, session: string): EventInput => ({
    hook_event_name: "PreToolUse",
    session_id: session,
    turn_id: turnId,
    transcript_path: file,
    tool_name: "exec_command",
  });

  // The same message is recorded twice under one id; the pair must count once.
  const leakText =
    "<thinking>Shell issue: I passed shell bash with PowerShell commands, and PowerShell commands in bash. Use shell powershell for PS, and bash for rg. Retry correctly.</thinking>\n" +
    "\u521a\u624d\u547d\u4ee4\u6df7\u7528\u4e86 Bash/PowerShell\uff0c\u6539\u7528\u5bf9\u5e94 shell \u91cd\u67e5\u5de5\u4f5c\u533a\u72b6\u6001\u548c\u6d4b\u8bd5\u5165\u53e3\u3002";
  const hygieneFile = path.join(state, "hygiene.jsonl");
  const hygieneLines = [
    turnUserLine("turn-h1", "Repair the flaky installer."),
    eventAgentLine("msg-h1", "turn-h1", leakText),
    assistantLine("msg-h1", "turn-h1", leakText),
    JSON.stringify({
      type: "response_item",
      payload: {
        type: "function_call",
        name: "exec_command",
        arguments: JSON.stringify({ command: "Get-ChildItem" }),
        internal_chat_message_metadata_passthrough: { turn_id: "turn-h1" },
      },
    }),
  ];
  await writeFile(hygieneFile, hygieneLines.join("\n") + "\n", "utf8");

  const firstLeak = run(hygieneHook, hygieneEvent("turn-h1", hygieneFile, "session-h1"));
  assert.match(firstLeak, /OUTPUT HYGIENE/, "a leaked progress note is corrected");
  const leakPayload = JSON.parse(firstLeak) as {
    continue?: boolean;
    hookSpecificOutput?: { hookEventName?: string; additionalContext?: string };
  };
  assert.equal(leakPayload.continue, true);
  assert.equal(leakPayload.hookSpecificOutput?.hookEventName, "PreToolUse");
  const leakCorrection = leakPayload.hookSpecificOutput?.additionalContext ?? "";
  assert.match(leakCorrection, /a raw reasoning block/, "the duplicated record counts once");
  assert.doesNotMatch(leakCorrection, /2 raw reasoning blocks/);
  assert.doesNotMatch(leakCorrection, /Shell issue/, "the correction never quotes the leaked text");

  assert.equal(
    run(hygieneHook, hygieneEvent("turn-h1", hygieneFile, "session-h1")),
    "",
    "the same leak is corrected only once",
  );

  await writeFile(
    hygieneFile,
    [...hygieneLines, assistantLine("msg-h2", "turn-h1", "<analysis>second</analysis>\nRetrying.")].join("\n") + "\n",
    "utf8",
  );
  assert.match(
    run(hygieneHook, hygieneEvent("turn-h1", hygieneFile, "session-h1")),
    /OUTPUT HYGIENE/,
    "a new leaked message earns a new correction",
  );

  // A real turn leaked sixteen notes. The signature budget must hold every leak
  // the transcript still shows, or the oldest ones fall out and the second check
  // reports them as new again.
  const wideFile = path.join(state, "hygiene-wide.jsonl");
  const wideLines = [turnUserLine("turn-hw", "Long turn.")];
  for (let index = 1; index <= 16; index += 1) {
    wideLines.push(
      assistantLine("msg-hw-" + index, "turn-hw", "<thinking>pass " + index + "</thinking>\nNote " + index + "."),
    );
  }
  await writeFile(wideFile, wideLines.join("\n") + "\n", "utf8");
  assert.match(
    run(hygieneHook, hygieneEvent("turn-hw", wideFile, "session-hw")),
    /16 of your recent visible messages/,
    "every leaked note in a wide turn counts",
  );
  assert.equal(
    run(hygieneHook, hygieneEvent("turn-hw", wideFile, "session-hw")),
    "",
    "a wide turn is not re-reported once all its leaks are recorded",
  );

  const cleanFile = path.join(state, "hygiene-clean.jsonl");
  await writeFile(
    cleanFile,
    [turnUserLine("turn-h2", "Continue."), assistantLine("msg-h3", "turn-h2", "Checking the test entry point.")].join("\n") + "\n",
    "utf8",
  );
  assert.equal(run(hygieneHook, hygieneEvent("turn-h2", cleanFile, "session-h2")), "", "clean notes stay silent");

  assert.equal(
    run(hygieneHook, {
      hook_event_name: "PreToolUse",
      session_id: "session-h2",
      turn_id: "turn-h2",
      tool_name: "exec_command",
    }),
    "",
    "no transcript means no correction",
  );

  // A leak from an earlier turn is not this turn's evidence.
  const oldLeakFile = path.join(state, "hygiene-old.jsonl");
  await writeFile(
    oldLeakFile,
    [
      turnUserLine("turn-old", "Earlier request."),
      assistantLine("msg-old", "turn-old", "<thinking>old</thinking>\nOld note."),
      turnUserLine("turn-h3", "New request."),
      assistantLine("msg-new", "turn-h3", "New clean note."),
    ].join("\n") + "\n",
    "utf8",
  );
  assert.equal(
    run(hygieneHook, hygieneEvent("turn-h3", oldLeakFile, "session-h3")),
    "",
    "an earlier turn's leak does not trigger a correction here",
  );

  // Three nudges per turn; a model that ignores all three gets no fourth.
  const budgetFile = path.join(state, "hygiene-budget.jsonl");
  const budgetLines = [turnUserLine("turn-hb", "Keep going.")];
  for (let round = 1; round <= 5; round += 1) {
    budgetLines.push(assistantLine("msg-hb-" + round, "turn-hb", "<thinking>step " + round + "</thinking>\nNote " + round + "."));
    await writeFile(budgetFile, budgetLines.join("\n") + "\n", "utf8");
    const nudged = run(hygieneHook, hygieneEvent("turn-hb", budgetFile, "session-hb"));
    if (round <= 3) {
      assert.match(nudged, /OUTPUT HYGIENE/, "nudge " + round + " is delivered");
      if (round === 3) assert.match(nudged, /last reminder/, "the final nudge says it is the last");
    } else {
      assert.equal(nudged, "", "nudge " + round + " is over budget");
    }
  }
  // A genuinely new leak does not reopen a spent budget either.
  budgetLines.push(assistantLine("msg-hb-6", "turn-hb", "<thinking>step 6</thinking>\nNote 6."));
  await writeFile(budgetFile, budgetLines.join("\n") + "\n", "utf8");
  assert.equal(
    run(hygieneHook, hygieneEvent("turn-hb", budgetFile, "session-hb")),
    "",
    "the budget stays closed after it is spent",
  );

  // No goal file is present in the repository, so a clean stop still ends the turn.
  const noGoal = stop({ turn_id: "turn-g", session_id: "session-g", last_assistant_message: "A clean, finished reply." });
  assert.equal(noGoal.decision, undefined, "without an active goal the turn is allowed to end");

  // Outside a delivery project there is nothing for a restart to repair: three
  // identical replies are ordinary work, not a dead loop, and voiding the turn
  // there would cut a long task short.
  const plainRepeated = "The same paragraph, read three times on purpose. ";
  for (let round = 0; round < 3; round += 1) {
    const plain = runIn(root, stopHook, {
      hook_event_name: "Stop",
      session_id: "session-plain",
      turn_id: "turn-plain",
      last_assistant_message: plainRepeated,
    });
    assert.equal(plain, "", "plain directories never restart the turn");
  }

  // An active goal keeps the turn alive: the Stop hook re-injects the compass
  // from disk so a compacted context is re-grounded, which is the stamina the
  // loop needs even when Goal mode is off.
  const goalProject = await mkdtemp(path.join(tmpdir(), "azskills-goal-hook-"));
  try {
    const started = spawnSync(process.execPath, [azflowCli, "goal", "start", "Drive the migration", "--done-when", "Ledger migrates", "--project", goalProject], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(started.status, 0, started.stderr);

    const sessionStart = { hook_event_name: "SessionStart", session_id: "fresh-session", turn_id: "" };
    const restored = JSON.parse(runIn(goalProject, sessionHook, sessionStart));
    assert.equal(restored.hookSpecificOutput.hookEventName, "SessionStart");
    assert.match(restored.hookSpecificOutput.additionalContext, /Drive the migration/);
    assert.match(restored.hookSpecificOutput.additionalContext, /Ledger migrates/);

    const driven = runIn(goalProject, stopHook, {
      hook_event_name: "Stop",
      session_id: "goal-session",
      turn_id: "goal-turn-1",
      last_assistant_message: "I think that is everything.",
    });
    const parsed = JSON.parse(driven) as { decision?: string; reason?: string };
    assert.equal(parsed.decision, "block", "an active goal holds the turn open");
    assert.match(parsed.reason ?? "", /AZFLOW GOAL RUN - CONTINUE/);
    assert.match(parsed.reason ?? "", /Drive the migration/);
    assert.match(parsed.reason ?? "", /Next step:/);

    const cli = (...args: string[]) => spawnSync(process.execPath, [azflowCli, "goal", ...args], { cwd: goalProject, encoding: "utf8" });
    assert.equal(cli("note", "Narration alone").status, 0);
    assert.match(cli("status").stdout, /no-progress 1 of 4/);
    assert.equal(cli("pause", "Awaiting approval").status, 0);
    assert.equal(cli("note", "Recording the reason while paused").status, 0);
    assert.match(cli("status").stdout, /Status: paused/);
    assert.equal(runIn(goalProject, sessionHook, sessionStart), "", "paused goals are not re-injected");
    assert.equal(cli("resume").status, 0);
    assert.match(cli("status").stdout, /Status: active.*no-progress 0 of 4/);

    const completed = spawnSync(process.execPath, [azflowCli, "goal", "complete", "--summary", "done", "--project", goalProject], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(completed.status, 0, completed.stderr);

    const afterComplete = runIn(goalProject, stopHook, {
      hook_event_name: "Stop",
      session_id: "goal-session",
      turn_id: "goal-turn-2",
      last_assistant_message: "The goal is complete.",
    });
    assert.equal(afterComplete, "", "a completed goal lets the turn end");
  } finally {
    await rm(goalProject, { recursive: true, force: true });
  }

  console.log("delivery-hook.test.ts: prompt replay, loop restart, blank correction, turn scoping, transcript detection, mid-turn hygiene, and goal continuation passed");
} finally {
  await rm(state, { recursive: true, force: true });
}
