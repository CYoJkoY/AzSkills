import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DEFAULT_CONFIG,
  STATE_SCHEMA_VERSION,
  flowRoot,
  globsIntersect,
  makeTask,
  newTaskId,
  planWaves,
  statePath,
  touchConflict,
  withLock,
  type FlowState,
} from "../scripts/state.ts";

function freshState(): FlowState {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    config: { ...DEFAULT_CONFIG },
    sequence: 0,
    tasks: [],
  };
}

assert.equal(globsIntersect("src/**", "src/a.ts"), true);
assert.equal(globsIntersect("a/b.ts", "a/c.ts"), false);
assert.equal(globsIntersect("*.ts", "a.ts"), true);
assert.equal(globsIntersect("*.ts", "src/a.ts"), true);
assert.equal(globsIntersect("**/*.ts", "src/a.ts"), true);
assert.equal(globsIntersect("lib/**", "src/a.ts"), false);

assert.equal(touchConflict(["src/**"], ["src/b.ts"]), "src/** vs src/b.ts");
assert.equal(touchConflict(["src/a.ts"], ["lib/b.ts"]), null);

const seqState = freshState();
assert.equal(newTaskId(seqState), "T-0001");
assert.equal(newTaskId(seqState), "T-0002");
assert.equal(seqState.sequence, 2);

const depState = freshState();
const parent = makeTask("T-0001", "parent", ["src/shared/**"]);
const child = makeTask("T-0002", "child", ["src/child.ts"]);
child.dependsOn = ["T-0001"];
const independent = makeTask("T-0003", "independent", ["lib/util.ts"]);
depState.tasks = [parent, child, independent];

const depPlan = planWaves(depState, Date.now());
assert.equal(depPlan.waves.length, 1);
assert.deepEqual(depPlan.waves[0]?.tasks, ["T-0001", "T-0003"]);
assert.deepEqual(depPlan.blocked.map((entry) => entry.id), ["T-0002"]);

const conflictState = freshState();
const held = makeTask("T-0001", "held", ["src/**"]);
held.status = "active";
held.lease = {
  owner: "agent-a",
  token: "tok",
  heartbeatAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};
const waiting = makeTask("T-0002", "waiting", ["src/a.ts"]);
const disjoint = makeTask("T-0003", "disjoint", ["lib/c.ts"]);
conflictState.tasks = [held, waiting, disjoint];

const conflictPlan = planWaves(conflictState, Date.now());
assert.deepEqual(conflictPlan.active, ["T-0001"]);
assert.equal(conflictPlan.waves.length, 1);
assert.deepEqual(conflictPlan.waves[0]?.tasks, ["T-0003"]);
assert.ok(conflictPlan.blocked.some((entry) => entry.id === "T-0002"));

const capacityState = freshState();
capacityState.config.maxParallel = 2;
for (let index = 1; index <= 3; index += 1) {
  const task = makeTask("T-" + String(index).padStart(4, "0"), "task " + index, ["lib/f" + index + ".ts"]);
  capacityState.tasks.push(task);
}
const capacityPlan = planWaves(capacityState, Date.now());
assert.equal(capacityPlan.waves[0]?.tasks.length, 2);
assert.equal(capacityPlan.waves[1]?.tasks.length, 1);

const project = await mkdtemp(path.join(tmpdir(), "azflow-state-"));
try {
  await mkdir(flowRoot(project), { recursive: true });
  await writeFile(
    statePath(project),
    JSON.stringify(freshState()),
    "utf8",
  );

  await withLock(project, async (state) => {
    state.tasks.push(makeTask(newTaskId(state), "first", ["a.ts"]));
  });
  await withLock(project, async (state) => {
    state.tasks.push(makeTask(newTaskId(state), "second", ["b.ts"]));
  });

  const persisted = JSON.parse(await readFile(statePath(project), "utf8")) as FlowState;
  assert.equal(persisted.tasks.length, 2);
assert.equal(persisted.tasks[0]?.title, "first");
assert.equal(persisted.tasks[1]?.title, "second");
  assert.equal(persisted.sequence, 2);
} finally {
  await rm(project, { recursive: true, force: true });
}

console.log("state.test.ts: all assertions passed");
