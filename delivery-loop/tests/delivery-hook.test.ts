import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const promptHook = path.join(root, "codex-plugin/hooks/delivery-prompt.ts");
const sessionHook = path.join(root, "codex-plugin/hooks/delivery-session.ts");
const stopHook = path.join(root, "codex-plugin/hooks/delivery-stop.ts");
const guardHook = path.join(root, "codex-plugin/hooks/delivery-guard.ts");
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
  readonly tool_input?: unknown;
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
  // The prompt hook only records the request for a later restart; it injects no
  // rule into the turn and therefore prints nothing.
  const promptOut = run(promptHook, {
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-a",
    prompt,
  });
  assert.equal(promptOut, "", "the prompt hook records without injecting context");

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

  // One blank reply is recorded but allowed; the second proves the turn is stuck
  // and restarts it with the stored prompt.
  const blank = stop({ turn_id: "turn-b", last_assistant_message: "\u200B\n\t" });
  assert.equal(blank.decision, undefined, "a single blank reply is not a loop");
  const blankAgain = stop({ turn_id: "turn-b", last_assistant_message: "" });
  assert.equal(blankAgain.decision, "block", "a repeated blank reply is a dead loop");
  assert.match(blankAgain.reason ?? "", /DEAD LOOP DETECTED/);
  assert.match(blankAgain.reason ?? "", /blank final reply/);
  assert.match(blankAgain.reason ?? "", /Second turn: explain the blank reply correction\./);
  assert.doesNotMatch(blankAgain.reason ?? "", /Repair the delivery loop/, "another turn's prompt is not quoted");
  assert.match(blankAgain.reason ?? "", /BEGIN RESENT PROMPT[\s\S]*END RESENT PROMPT/, "the prompt block is complete");

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

  // With no recorded prompt (the plugin was installed mid-session), a restart
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
  const fallbackText = "Fallback reply that only the transcript can explain. ".repeat(4);
  const fallbackStop = () =>
    stop({ turn_id: "turn-d", session_id: "session-d", transcript_path: fallbackFile, last_assistant_message: fallbackText });
  assert.equal(fallbackStop().decision, undefined);
  assert.equal(fallbackStop().decision, undefined);
  const fallback = fallbackStop();
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

  // The guard auto-approves the repeated reads and tests a long run performs, so
  // those stop asking the user, while a push or a merge still goes through the
  // deny rules and is never let through by the allowlist.
  const allowProject = await mkdtemp(path.join(tmpdir(), "azskills-goal-allow-"));
  try {
    await mkdir(path.join(allowProject, ".azflow"), { recursive: true });
    await writeFile(path.join(allowProject, ".azflow", "state.json"), JSON.stringify({ config: { base: "main" } }), "utf8");
    await writeFile(
      path.join(allowProject, ".azflow", "goal.json"),
      JSON.stringify({ allowedCommands: ["npm run custom"] }),
      "utf8",
    );
    const guard = (command: string): { permissionDecision?: string } => {
      const output = runIn(allowProject, guardHook, {
        hook_event_name: "PreToolUse",
        session_id: "allow-session",
        turn_id: "allow-turn",
        tool_name: "bash",
        tool_input: { command },
      });
      if (output === "") return {};
      const parsed = JSON.parse(output) as { hookSpecificOutput?: { permissionDecision?: string } };
      return parsed.hookSpecificOutput ?? {};
    };
    for (const approved of ["git log --oneline -5", "npm run typecheck", "npm run custom"]) {
      assert.equal(guard(approved).permissionDecision, "allow", approved + " is auto-approved");
    }
    for (const refused of [
      "git push origin main",
      "git tag -d v1.2.3",
      "rg foo > out.txt",
      "find . -delete",
      "rg --pre \"rm -rf build\" foo",
    ]) {
      assert.notEqual(guard(refused).permissionDecision, "allow", refused + " is never auto-approved");
    }
    // `git commit` is an allowlisted bounded write, but the deny rule still wins
    // on the protected base branch, so auto-approval can never bypass the guard.
    const baseProject = path.join(allowProject, "base-repo");
    await mkdir(baseProject, { recursive: true });
    spawnSync("git", ["init", "-b", "main"], { cwd: baseProject, encoding: "utf8", windowsHide: true });
    spawnSync(
      "git",
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "--allow-empty", "-m", "init"],
      { cwd: baseProject, encoding: "utf8", windowsHide: true },
    );
    await mkdir(path.join(baseProject, ".azflow"), { recursive: true });
    await writeFile(path.join(baseProject, ".azflow", "state.json"), JSON.stringify({ config: { base: "main" } }), "utf8");
    const onBase = runIn(baseProject, guardHook, {
      hook_event_name: "PreToolUse",
      session_id: "allow-session",
      turn_id: "allow-turn",
      tool_name: "bash",
      tool_input: { command: "git commit -m test" },
    });
    const baseDecision = onBase === ""
      ? undefined
      : (JSON.parse(onBase) as { hookSpecificOutput?: { permissionDecision?: string } }).hookSpecificOutput?.permissionDecision;
    assert.notEqual(baseDecision, "allow", "a base-branch commit is denied before the allowlist");
  } finally {
    await rm(allowProject, { recursive: true, force: true });
  }

  console.log("delivery-hook.test.ts: prompt replay, dead-loop restart, blank loop restart, turn scoping, transcript detection, goal continuation, and allowlist auto-approval passed");
} finally {
  await rm(state, { recursive: true, force: true });
}
