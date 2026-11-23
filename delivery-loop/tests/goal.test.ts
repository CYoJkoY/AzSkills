import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DEFAULT_MAX_ITERATIONS,
  advanceGoal,
  createGoal,
  findGoalProject,
  goalCompass,
  nextStepFor,
  readGoal,
  updateGoal,
  type GoalState,
} from "../scripts/goal.ts";
import { DEFAULT_CONFIG, makeTask, type FlowState, type Task, type TaskStatus } from "../scripts/state.ts";

function git(cwd: string, args: readonly string[]): void {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, "git " + args.join(" ") + " failed: " + result.stderr);
}

async function freshRepo(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "azskills-goal-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  await writeFile(path.join(root, "seed.txt"), "one\n", "utf8");
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "seed"]);
  return root;
}

async function advanceCommit(root: string, file: string, contents: string): Promise<void> {
  await writeFile(path.join(root, file), contents, "utf8");
  git(root, ["add", file]);
  git(root, ["commit", "-q", "-m", "advance " + file]);
}

function flowWith(status: TaskStatus, patch: Partial<Task> = {}): FlowState {
  const task: Task = { ...makeTask("T-0001", "Do the thing", ["src/**"]), status, ...patch };
  return { schemaVersion: 1, config: { ...DEFAULT_CONFIG }, sequence: 0, tasks: [task] };
}

const dirs: string[] = [];
try {
  const root = await freshRepo();
  dirs.push(root);
  const goal = await createGoal(root, { objective: "Ship the feature", doneWhen: ["Tests pass", "Docs updated"] });
  assert.equal(goal.status, "active");
  assert.equal(goal.iteration, 0);
  assert.equal(goal.maxIterations, DEFAULT_MAX_ITERATIONS);
  assert.deepEqual(goal.doneWhen, ["Tests pass", "Docs updated"]);
  const reread = await readGoal(root);
  assert.ok(reread !== null);
  assert.equal(reread?.objective, "Ship the feature");
  assert.equal(await findGoalProject(root), root, "findGoalProject resolves the repo that holds the goal");

  await assert.rejects(() => createGoal(root, { objective: "  ", doneWhen: ["x"] }), /non-empty objective/);
  await assert.rejects(() => createGoal(root, { objective: "x", doneWhen: [] }), /done-when/);
  await assert.rejects(
    () => createGoal(root, { objective: "second", doneWhen: ["y"] }),
    /active goal already exists/,
    "an active goal is not clobbered without --replace",
  );

  const empty: FlowState = { schemaVersion: 1, config: { ...DEFAULT_CONFIG }, sequence: 0, tasks: [] };
  assert.match(nextStepFor({ ...goal, nextStep: "manual step" }, empty), /manual step/, "an empty ledger falls back to the recorded next step");
  assert.match(nextStepFor(goal, empty), /Take the next concrete, verifiable step/, "no next step and no ledger yields the generic directive");
  assert.match(nextStepFor(goal, flowWith("active", { worktree: ".azflow/worktrees/T-0001" })), /Continue task T-0001/);
  assert.match(nextStepFor(goal, flowWith("merged-issue-open")), /ship T-0001 --verify-issue/);
  assert.match(nextStepFor(goal, flowWith("review")), /Finish task T-0001/);
  assert.match(nextStepFor(goal, flowWith("planned")), /claim T-0001/);
  assert.match(nextStepFor(goal, flowWith("merged")), /Every recorded task is delivered/);

  const compass = goalCompass(goal, flowWith("active"));
  assert.match(compass, /ACTIVE GOAL: Ship the feature/);
  assert.match(compass, /1\. Tests pass/);
  assert.match(compass, /Next step: Continue task T-0001/);

  const first = await advanceGoal(root, Date.now());
  assert.equal(first.action, "continue");
  assert.ok(first.reason !== null && first.reason.includes("AZFLOW GOAL RUN - CONTINUE"));
  const afterFirst = await readGoal(root);
  assert.equal(afterFirst?.iteration, 1);

  await advanceCommit(root, "work.txt", "progress\n");
  const second = await advanceGoal(root, Date.now());
  assert.equal(second.action, "continue");
  assert.equal(second.goal?.noProgress, 0, "a real repository change resets the no-progress counter");

  for (const contents of ["first dirty edit\n", "second dirty edit\n"]) {
    await writeFile(path.join(root, "seed.txt"), contents);
    const edited = await advanceGoal(root, Date.now());
    assert.equal(edited.goal?.noProgress, 0, "changing the same unstaged file counts again");
  }
  for (const contents of ["first staged edit\n", "second staged edit\n"]) {
    await writeFile(path.join(root, "seed.txt"), contents);
    git(root, ["add", "seed.txt"]);
    const staged = await advanceGoal(root, Date.now());
    assert.equal(staged.goal?.noProgress, 0, "changing the same staged file counts again");
  }

  for (let pass = 0; pass < 100; pass += 1) {
    await writeFile(path.join(root, "untracked file.txt"), "checkpoint " + pass);
    const advanced = await advanceGoal(root, Date.now());
    assert.equal(advanced.action, "continue");
    assert.equal(advanced.goal?.noProgress, 0);
  }
  const longRun = await readGoal(root);
  assert.equal(longRun?.iteration, 106);
  assert.equal(longRun?.progress.length, 60, "long runs keep a bounded checkpoint history");

  const stallRoot = await freshRepo();
  dirs.push(stallRoot);
  await createGoal(stallRoot, { objective: "Stall me", doneWhen: ["done"], maxNoProgress: 1 });
  const stalled = await advanceGoal(stallRoot, Date.now());
  assert.equal(stalled.action, "stall");
  assert.match(stalled.reason ?? "", /AZFLOW GOAL STALLED/);
  assert.equal((await readGoal(stallRoot))?.status, "stalled");
  assert.equal((await advanceGoal(stallRoot, Date.now())).action, "allow", "a stalled goal lets the turn end");

  const budgetRoot = await freshRepo();
  dirs.push(budgetRoot);
  await createGoal(budgetRoot, { objective: "Budget me", doneWhen: ["done"], maxIterations: 1 });
  assert.equal((await advanceGoal(budgetRoot, Date.now())).action, "continue");
  const paused = await advanceGoal(budgetRoot, Date.now());
  assert.equal(paused.action, "pause");
  assert.ok(paused.reason !== null && paused.reason.includes("AZFLOW GOAL PAUSED"));
  assert.match(paused.reason ?? "", /Status: paused/);
  assert.equal((await readGoal(budgetRoot))?.status, "paused");

  const transitionRoot = await freshRepo();
  dirs.push(transitionRoot);
  await createGoal(transitionRoot, { objective: "Transition", doneWhen: ["done"] });
  await updateGoal(transitionRoot, (current: GoalState) => ({ ...current, status: "stalled", noProgress: 3 }));
  const resumed = await updateGoal(transitionRoot, (current: GoalState) => ({ ...current, status: "active", noProgress: 0 }));
  assert.equal(resumed?.status, "active");
  assert.equal(resumed?.noProgress, 0);
  const completed = await updateGoal(transitionRoot, (current: GoalState) => ({ ...current, status: "complete", summary: "shipped" }));
  assert.equal(completed?.status, "complete");
  assert.equal((await advanceGoal(transitionRoot, Date.now())).action, "allow", "a complete goal allows the turn to end");

  console.log("goal.test.ts: roundtrip, next step, compass, continue, progress reset, stall, pause, transitions passed");
} finally {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
}
