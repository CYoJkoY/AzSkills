import assert from "node:assert/strict";
import {
  bashCommand,
  denyReasonForBash,
  denyReasonForTool,
  isShellTool,
  normalizeTool,
} from "../../codex-plugin/hooks/guard.ts";

const ctx = { branch: "issue/x", base: "main" };

assert.ok(denyReasonForBash("gh pr merge 1", ctx) !== null);
assert.equal(denyReasonForBash("gh pr merge 1", ctx, { allowManualMerge: true }), null);

assert.ok(denyReasonForBash("git commit -m 'x'", { ...ctx, branch: "main" }) !== null);
assert.equal(denyReasonForBash("git commit -m 'x'", ctx), null);

assert.ok(denyReasonForBash("git push origin main", ctx) !== null);
assert.ok(denyReasonForBash("git push origin HEAD:main", ctx) !== null);
assert.ok(denyReasonForBash("git push origin feature/x", ctx) === null);

assert.ok(denyReasonForTool("Task") !== null);
assert.ok(denyReasonForTool("spawn_agent") !== null);
assert.equal(denyReasonForTool("Bash"), null);
assert.equal(denyReasonForTool("Read"), null);

for (const name of ["Bash", "shell", "exec_command", "functions.exec_command", "PowerShell"]) {
  assert.ok(isShellTool(name), name);
}
assert.equal(normalizeTool("functions.exec_command"), "exec_command");
assert.equal(normalizeTool("mcp__codex_app__shell"), "shell");
assert.equal(isShellTool("Read"), false);
assert.equal(isShellTool("Task"), false);

assert.equal(bashCommand({ command: "git status" }), "git status");
assert.equal(bashCommand({ input: "git status" }), "git status");
assert.equal(bashCommand({ cmd: "git status" }), "git status");
assert.equal(bashCommand(null), "");

console.log("guard.test.ts: all assertions passed");
