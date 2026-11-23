import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const guardHook = path.join(root, "codex-plugin/hooks/delivery-guard.ts");
const promptHook = path.join(root, "codex-plugin/hooks/delivery-prompt.ts");
const state = mkdtempSync(path.join(tmpdir(), "azskills-loop-breaker-"));
const project = mkdtempSync(path.join(tmpdir(), "azskills-azflow-"));
mkdirSync(path.join(project, ".azflow"), { recursive: true });
writeFileSync(path.join(project, ".azflow", "state.json"), JSON.stringify({ config: { base: "main" } }));
spawnSync("git", ["init", "-q", "-b", "main"], { cwd: project, encoding: "utf8" });

const prompt = "Ship the migration and keep the user's wording.";

interface Verdict {
  readonly continue?: boolean;
  readonly hookSpecificOutput?: {
    readonly permissionDecision?: string;
    readonly permissionDecisionReason?: string;
  };
}

function run(hook: string, event: unknown, cwd: string): Verdict {
  const result = spawnSync(process.execPath, [hook], {
    cwd,
    encoding: "utf8",
    input: JSON.stringify(event),
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  assert.equal(result.status, 0, result.stderr);
  const text = result.stdout.trim();
  return text === "" ? {} : (JSON.parse(text) as Verdict);
}

function call(command: string, turnId = "turn-a"): Verdict {
  return run(
    guardHook,
    {
      hook_event_name: "PreToolUse",
      session_id: "session-a",
      turn_id: turnId,
      tool_name: "Bash",
      tool_input: { command },
    },
    project,
  );
}

const denied = (verdict: Verdict): string | null => {
  const output = verdict.hookSpecificOutput;
  if (output === undefined || output.permissionDecision !== "deny") return null;
  return output.permissionDecisionReason ?? "";
};

try {
  run(
    promptHook,
    { hook_event_name: "UserPromptSubmit", session_id: "session-a", turn_id: "turn-a", prompt },
    project,
  );

  // A different command breaks the run: the counter starts over.
  assert.equal(denied(call("git status")), null);
  assert.equal(denied(call("git log --oneline -1")), null);
  assert.equal(denied(call("git status")), null);

  // Four identical calls in a row: the fourth is blocked before it runs.
  assert.equal(denied(call("git status --short")), null);
  assert.equal(denied(call("git status --short")), null);
  assert.equal(denied(call("git status --short")), null);
  const blocked = denied(call("git status --short"));
  assert.ok(blocked !== null, "the fourth identical call is denied");
  assert.match(blocked, /DEAD LOOP INTERRUPTED/);
  assert.match(blocked, /4 times in a row/);
  assert.match(blocked, /BEGIN RESENT PROMPT/);
  assert.match(blocked, /Ship the migration/);

  // The counter resets after the interruption, so a deliberate re-run is allowed.
  assert.equal(denied(call("git status --short")), null, "the counter resets after a break");

  // A second break is still allowed, and the per-turn budget then stops the guard
  // from firing again instead of chasing its own correction forever.
  const second = (() => {
    let verdict: Verdict = {};
    for (let index = 0; index < 4; index += 1) verdict = call("git diff --stat");
    return denied(verdict);
  })();
  assert.ok(second !== null, "the second break in one turn is allowed");
  const third = (() => {
    let verdict: Verdict = {};
    for (let index = 0; index < 4; index += 1) verdict = call("git rev-parse --show-toplevel");
    return denied(verdict);
  })();
  assert.equal(third, null, "the breaker budget stops further interruptions");

  // Outside an azflow project the breaker never acts.
  const outside = run(
    guardHook,
    {
      hook_event_name: "PreToolUse",
      session_id: "session-b",
      turn_id: "turn-b",
      tool_name: "Bash",
      tool_input: { command: "git status --short" },
    },
    state,
  );
  assert.equal(denied(outside), null);

  console.log("loop-breaker.test.ts: in-turn interrupt, prompt replay, reset, and budget passed");
} finally {
  rmSync(state, { recursive: true, force: true });
  rmSync(project, { recursive: true, force: true });
}
