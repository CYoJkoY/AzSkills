import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  MAX_TRANSIENT_RETRIES,
  advanceGoal,
  createGoal,
  estimateBudget,
  isTransientFailure,
  progressMarker,
  readGoal,
  updateGoal,
} from "../scripts/goal.ts";
import { parseDoneWhen, verifyDoneWhen } from "../scripts/goal-verify.ts";
import { DEFAULT_CONFIG, makeTask, writeState, type FlowState, type Task } from "../scripts/state.ts";
import { isAllowedCommand, isSafeBuiltinCommand, readGoalAllowlist } from "../../codex-plugin/hooks/goal-allowlist.ts";

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, "git " + args.join(" ") + " failed: " + result.stderr);
  return result.stdout.trim();
}

async function freshRepo(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "azskills-goal-long-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  await writeFile(path.join(root, "seed.txt"), "one\n", "utf8");
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "seed"]);
  return root;
}

function flowWith(status: Task["status"], patch: Partial<Task> = {}): FlowState {
  const task: Task = { ...makeTask("T-0001", "Do the thing", ["src/**"]), status, ...patch };
  return { schemaVersion: 1, config: { ...DEFAULT_CONFIG }, sequence: 1, tasks: [task] };
}

const dirs: string[] = [];

/** A project whose single task sits in review at the given round and score. */
async function reviewProject(round: number, score: number, finding: string): Promise<string> {
  const root = await freshRepo();
  dirs.push(root);
  await createGoal(root, { objective: "Ship reviewed work", doneWhen: ["Ship it"] });
  const review = { headSha: "abcdef1", round, score, verdict: "FAIL" as const, at: new Date().toISOString() };
  await writeState(root, flowWith("review", { worktree: null, review }));
  await mkdir(path.join(root, ".azflow", "reviews"), { recursive: true });
  await writeFile(
    path.join(root, ".azflow", "reviews", "T-0001-r" + String(round) + ".md"),
    ["| Severity | Where | Finding |", "| --- | --- | --- |", "| P2 | scripts/a.ts:12 | " + finding + " |", ""].join("\n"),
    "utf8",
  );
  return root;
}

try {
  // Budget sizing: a heavy objective gets the full run, a small one gets a
  // small budget, and a wide criterion list gets the default.
  assert.equal(estimateBudget("Refactor the whole delivery loop", ["x"]), 2000);
  assert.equal(estimateBudget("Fix the typo", ["file README.md exists"]), 120);
  assert.equal(estimateBudget("Fix the typo", ["a", "b"]), 300);
  assert.equal(estimateBudget("Fix the typo", ["a", "b", "c"]), 1000);

  // Only failures a fresh attempt could clear are retried.
  assert.equal(isTransientFailure(""), false);
  assert.equal(isTransientFailure("All checks passed."), false);
  assert.equal(isTransientFailure("remote: Repository not found"), false);
  assert.equal(isTransientFailure("Error: read ECONNRESET"), true);
  assert.equal(isTransientFailure("fatal: unable to create '.git/index.lock': File exists"), true);
  assert.equal(isTransientFailure("checks are still running"), true);

  // Criteria compile to narrow checks; anything else stays manual.
  assert.deepEqual(parseDoneWhen("issue #123 merged"), { criterion: "issue #123 merged", kind: "issue", target: "123" });
  assert.deepEqual(parseDoneWhen("PR #45 is merged"), { criterion: "PR #45 is merged", kind: "pr", target: "45" });
  assert.deepEqual(parseDoneWhen("tag v1.2.3 published"), { criterion: "tag v1.2.3 published", kind: "tag", target: "v1.2.3" });
  assert.equal(parseDoneWhen("a1b2c3d merged").kind, "commit");
  assert.deepEqual(parseDoneWhen("file README.md exists"), { criterion: "file README.md exists", kind: "file", target: "README.md" });
  assert.equal(parseDoneWhen("Tests pass").kind, "manual");

  // Verification reads the real repository: a present file and a real tag pass,
  // a missing file fails, and a prose criterion keeps the goal manual.
  const verifyRoot = await freshRepo();
  dirs.push(verifyRoot);
  await writeFile(path.join(verifyRoot, "README.md"), "# readme\n", "utf8");
  git(verifyRoot, ["tag", "v1.2.3"]);
  const passing = await verifyDoneWhen(verifyRoot, ["file README.md exists", "tag v1.2.3 published"]);
  assert.equal(passing.allVerifiable, true);
  assert.equal(passing.allPassed, true);
  const partial = await verifyDoneWhen(verifyRoot, ["file missing.md exists"]);
  assert.equal(partial.results[0]?.verified, false);
  const mixed = await verifyDoneWhen(verifyRoot, ["file README.md exists", "Tests pass"]);
  assert.equal(mixed.allVerifiable, false);
  assert.equal(mixed.allPassed, false, "a manual criterion never auto-completes a goal");

  // A goal whose criteria can all be verified ends itself once they hold.
  const autoRoot = await freshRepo();
  dirs.push(autoRoot);
  await createGoal(autoRoot, { objective: "Add a readme", doneWhen: ["file README.md exists"] });
  await writeFile(path.join(autoRoot, "README.md"), "# done\n", "utf8");
  const autoComplete = await advanceGoal(autoRoot, Date.now());
  assert.equal(autoComplete.action, "complete");
  assert.match(autoComplete.reason ?? "", /AZFLOW GOAL COMPLETE/);
  assert.match(autoComplete.reason ?? "", /\[pass\] file README\.md exists/);
  assert.equal((await readGoal(autoRoot))?.status, "complete");
  assert.equal((await advanceGoal(autoRoot, Date.now())).action, "allow");

  // Every pass that changes the repository records where to resume.
  const checkpointRoot = await freshRepo();
  dirs.push(checkpointRoot);
  await createGoal(checkpointRoot, { objective: "Record the resume point", doneWhen: ["Ship it"] });
  await writeFile(path.join(checkpointRoot, "work.txt"), "progress\n", "utf8");
  git(checkpointRoot, ["add", "work.txt"]);
  git(checkpointRoot, ["commit", "-q", "-m", "advance work"]);
  const checkpointed = await advanceGoal(checkpointRoot, Date.now());
  assert.equal(checkpointed.action, "continue");
  assert.equal(checkpointed.goal?.checkpoint?.sha, git(checkpointRoot, ["rev-parse", "HEAD"]));
  assert.ok((checkpointed.goal?.checkpoint?.step ?? "") !== "", "the resume step is recorded with the commit");

  // A transient failure is retried a bounded number of times, then treated as a
  // normal silent pass instead of a retry storm.
  const retryRoot = await freshRepo();
  dirs.push(retryRoot);
  await createGoal(retryRoot, { objective: "Retry me", doneWhen: ["Ship it"] });
  for (let attempt = 1; attempt <= MAX_TRANSIENT_RETRIES; attempt += 1) {
    const retried = await advanceGoal(retryRoot, Date.now(), { reply: "Error: read ECONNRESET" });
    assert.equal(retried.action, "continue");
    assert.match(retried.reason ?? "", new RegExp("TRANSIENT FAILURE RETRY \\(" + attempt + " of " + MAX_TRANSIENT_RETRIES + "\\)"));
    assert.equal(retried.goal?.retry?.count, attempt);
    assert.equal(retried.goal?.noProgress, 0, "a retry does not spend the no-progress budget");
  }
  const exhausted = await advanceGoal(retryRoot, Date.now(), { reply: "Error: read ECONNRESET" });
  assert.doesNotMatch(exhausted.reason ?? "", /TRANSIENT FAILURE RETRY/);
  assert.equal(exhausted.goal?.retry, null);

  // A healthy run near its budget extends itself instead of pausing.
  const extendRoot = await freshRepo();
  dirs.push(extendRoot);
  await createGoal(extendRoot, { objective: "Extend me", doneWhen: ["Ship it"], maxIterations: 4 });
  for (let pass = 1; pass <= 3; pass += 1) {
    await writeFile(path.join(extendRoot, "step-" + pass + ".txt"), "progress\n", "utf8");
    const advanced = await advanceGoal(extendRoot, Date.now());
    assert.equal(advanced.action, "continue");
  }
  const extended = await readGoal(extendRoot);
  assert.equal(extended?.extensions, 1);
  assert.ok((extended?.maxIterations ?? 0) > 4, "the budget grew once the run came close to it");

  // A review just under the bar is repaired automatically, twice, and the
  // directive quotes the actual finding.
  const repairRoot = await reviewProject(1, 4.2, "Fix the null check");
  const repairOne = await advanceGoal(repairRoot, Date.now());
  assert.equal(repairOne.action, "continue");
  assert.match(repairOne.reason ?? "", /AUTO-REPAIR REVIEW/);
  assert.match(repairOne.reason ?? "", /Fix the null check/);
  assert.equal(repairOne.goal?.autoRepairs, 1);

  await writeState(repairRoot, flowWith("review", {
    worktree: null,
    review: { headSha: "abcdef2", round: 2, score: 4.3, verdict: "FAIL", at: new Date().toISOString() },
  }));
  await writeFile(
    path.join(repairRoot, ".azflow", "reviews", "T-0001-r2.md"),
    "| P2 | scripts/b.ts:3 | Tighten the guard |\n",
    "utf8",
  );
  const repairTwo = await advanceGoal(repairRoot, Date.now());
  assert.equal(repairTwo.action, "continue");
  assert.match(repairTwo.reason ?? "", /Tighten the guard/);
  assert.equal(repairTwo.goal?.autoRepairs, 2);

  await writeState(repairRoot, flowWith("review", {
    worktree: null,
    review: { headSha: "abcdef3", round: 3, score: 4.4, verdict: "FAIL", at: new Date().toISOString() },
  }));
  await writeFile(path.join(repairRoot, ".azflow", "reviews", "T-0001-r3.md"), "| P2 | scripts/c.ts:4 | Still failing |\n", "utf8");
  const repairSpent = await advanceGoal(repairRoot, Date.now());
  assert.equal(repairSpent.action, "pause");
  assert.match(repairSpent.reason ?? "", /automatic repairs/);
  assert.equal((await readGoal(repairRoot))?.status, "paused");

  // A score that low rejects the approach, so it goes to a human immediately.
  const lowRoot = await reviewProject(1, 3.4, "Rethink the design");
  const low = await advanceGoal(lowRoot, Date.now());
  assert.equal(low.action, "pause");
  assert.match(low.reason ?? "", /below 4\.00/);

  // The allowlist approves repeated investigations and tests, refuses anything
  // that writes destructively, and never approves a push.
  assert.equal(isSafeBuiltinCommand(["git", "log", "-5"]), true);
  assert.equal(isSafeBuiltinCommand(["git", "status"]), true);
  assert.equal(isSafeBuiltinCommand(["npm", "run", "typecheck"]), true);
  assert.equal(isSafeBuiltinCommand(["rg", "foo"]), true);
  assert.equal(isSafeBuiltinCommand(["git", "tag", "-d", "v1"]), false);
  assert.equal(isSafeBuiltinCommand(["git", "commit", "--amend"]), false);
  assert.equal(isSafeBuiltinCommand(["rg", "foo", ">", "out.txt"]), false);
  assert.equal(isSafeBuiltinCommand(["git", "push"]), false);
  assert.equal(isSafeBuiltinCommand(["rm", "-rf", "build"]), false);

  assert.equal(isAllowedCommand(["npm", "run", "custom"], ["npm run custom"]), true);
  assert.equal(isAllowedCommand(["npm", "run", "build"], ["npm run custom"]), false);
  assert.equal(isAllowedCommand(["git", "push", "origin", "main"], ["/^git push origin (main|master)$/"]), true);
  assert.equal(isAllowedCommand(["git", "push", "--force"], ["/^git push origin (main|master)$/"]), false);

  const allowRoot = await freshRepo();
  dirs.push(allowRoot);
  const allowGoal = await createGoal(allowRoot, {
    objective: "Allow a custom command",
    doneWhen: ["Ship it"],
    allowedCommands: ["npm run custom", "  "],
  });
  assert.deepEqual(allowGoal.allowedCommands, ["npm run custom"]);
  assert.deepEqual(await readGoalAllowlist(allowRoot), ["npm run custom"]);

  // A goal marked complete while the ledger still holds open work is reopened
  // once, so the run finishes what it started instead of reporting a delivery
  // that did not happen.
  const driftRoot = await freshRepo();
  dirs.push(driftRoot);
  await createGoal(driftRoot, { objective: "Finish the ledger", doneWhen: ["Ship it"] });
  await writeState(driftRoot, flowWith("review", { worktree: null, review: null }));
  await updateGoal(driftRoot, (goal) => ({ ...goal, status: "complete" }));
  const reopened = await advanceGoal(driftRoot, Date.now());
  assert.equal(reopened.action, "continue");
  assert.match(reopened.reason ?? "", /AZFLOW GOAL REOPENED/);
  const afterReopen = await readGoal(driftRoot);
  assert.equal(afterReopen?.status, "active");
  assert.equal(afterReopen?.driftReopens, 1);
  // Completing again with the same open work is not reopened a second time.
  await updateGoal(driftRoot, (goal) => ({ ...goal, status: "complete" }));
  const secondComplete = await advanceGoal(driftRoot, Date.now());
  assert.equal(secondComplete.action, "allow");
  assert.equal((await readGoal(driftRoot))?.status, "complete");

  // AZFLOW_FAST trades the content hash for a size-and-mtime marker, which
  // still moves when a pass edits a dirty file.
  process.env.AZFLOW_FAST = "1";
  try {
    const fastRoot = await freshRepo();
    dirs.push(fastRoot);
    await writeFile(path.join(fastRoot, "seed.txt"), "one\ntwo\n", "utf8");
    const fastA = await progressMarker(fastRoot);
    assert.equal(await progressMarker(fastRoot), fastA);
    await writeFile(path.join(fastRoot, "seed.txt"), "one\ntwo\nthree\n", "utf8");
    assert.notEqual(await progressMarker(fastRoot), fastA);
  } finally {
    delete process.env.AZFLOW_FAST;
  }

  console.log("goal-long-run.test.ts: budget, transient retry, done-when verify, auto-complete, checkpoint, auto-extend, review repair, allowlist, drift reopen, fast marker passed");
} finally {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
}
