import assert from "node:assert/strict";
import {
  bashCommand,
  denyReasonForBash,
  denyReasonForTool,
  isShellTool,
  normalizeTool,
  reviewWindowOpen,
} from "../../codex-plugin/hooks/guard.ts";

const ctx = { branch: "issue/x", base: "main" };

assert.ok(denyReasonForBash("gh pr merge 1", ctx) !== null);
assert.equal(denyReasonForBash("gh pr merge 1", ctx, { allowManualMerge: true }), null);

assert.ok(denyReasonForBash("git commit -m 'x'", { ...ctx, branch: "main" }) !== null);
assert.equal(denyReasonForBash("git commit -m 'x'", ctx), null);

assert.ok(denyReasonForBash("git push origin main", ctx) !== null);
assert.ok(denyReasonForBash("git push origin HEAD:main", ctx) !== null);
assert.ok(denyReasonForBash("git push origin feature/x", ctx) === null);

// A redirect into a worktree must not be judged by the caller's own branch.
const branches = new Map([
  ["E:/repo", "main"],
  ["E:/repo/.azflow/worktrees/T-0001", "issue/t-0001"],
]);
const redirected = {
  branch: "main",
  base: "main",
  branchFor: (dir: string | null): string | null => (dir === null ? "main" : branches.get(dir.replace(/\\/g, "/")) ?? null),
};
assert.equal(denyReasonForBash("cd E:/repo && git push -u origin issue/t-0001", redirected), null);
assert.equal(denyReasonForBash("git -C E:/repo/.azflow/worktrees/T-0001 push -u origin issue/t-0001", redirected), null);
assert.ok(denyReasonForBash("git -C E:/repo/.azflow/worktrees/T-0001 push origin main", redirected) !== null);
assert.ok(denyReasonForBash('git -C "E:/repo" push origin feature/x', { ...redirected, branchFor: () => "main" }) === null);

// Raw create calls bypass the linked-issue body the ship gates verify.
assert.ok(denyReasonForBash("gh pr create --title x", ctx) !== null);
assert.ok(denyReasonForBash("gh issue create --title x", ctx) !== null);
assert.equal(denyReasonForBash("gh pr create --title x", ctx, { allowGhCreate: true }), null);
assert.equal(denyReasonForBash("gh pr view 1", ctx), null);
assert.equal(denyReasonForBash("gh issue comment 1 --body x", ctx), null);

// Review text on a pull request must come from the deterministic report
// template, not from a hand-written comment.
assert.ok(denyReasonForBash("gh pr comment 1 --body x", ctx) !== null);
assert.ok(denyReasonForBash("gh pr review 1 --approve", ctx) !== null);
assert.equal(denyReasonForBash("gh pr comment 1 --body x", ctx, { allowManualPrComment: true }), null);

assert.ok(denyReasonForTool("Task") !== null);
assert.ok(denyReasonForTool("spawn_agent") !== null);
assert.equal(denyReasonForTool("Bash"), null);
assert.equal(denyReasonForTool("Read"), null);

// A sub-agent spawn is allowed only while an EGM review window is open.
const now = Date.parse("2026-01-01T00:00:00.000Z");
const openWindow = { engine: "egm", expiresAt: "2026-01-01T00:20:00.000Z" };
const expiredWindow = { engine: "egm", expiresAt: "2025-12-31T23:59:00.000Z" };
const selfWindow = { engine: "self", expiresAt: "2026-01-01T00:20:00.000Z" };
assert.equal(denyReasonForTool("spawn_agent", openWindow, now), null);
assert.ok(denyReasonForTool("spawn_agent", expiredWindow, now) !== null);
assert.ok(denyReasonForTool("spawn_agent", selfWindow, now) !== null);
assert.ok(denyReasonForTool("spawn_agent", null, now) !== null);
assert.equal(reviewWindowOpen(openWindow, now), true);
assert.equal(reviewWindowOpen(expiredWindow, now), false);

// A window bound to a head authorises only that head; a moved head closes it.
const headA = "a".repeat(40);
const headB = "b".repeat(40);
const boundWindow = { engine: "egm", expiresAt: "2026-01-01T00:20:00.000Z", headSha: headA };
assert.equal(denyReasonForTool("spawn_agent", boundWindow, now, headA), null);
assert.ok(denyReasonForTool("spawn_agent", boundWindow, now, headB) !== null);
assert.equal(reviewWindowOpen(boundWindow, now, headA), true);
assert.equal(reviewWindowOpen(boundWindow, now, headB), false);
// Unknown head on either side fails open rather than locking the reviewer out.
assert.equal(reviewWindowOpen(boundWindow, now, null), true);
assert.equal(reviewWindowOpen(openWindow, now, headB), true);

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
