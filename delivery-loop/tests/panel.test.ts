/*
 * Unit tests for the delivery panel.
 *
 * The panel is the readable face of a run, so these assert that one snapshot
 * carries the goal, the ledger, the next waves, and the drift findings, that a
 * configuration patch only touches the keys it names, and that a ledger title
 * cannot break out of the embedded document.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  PANEL_CONFIG_KEYS,
  PANEL_ICON,
  PANEL_TOOL,
  PANEL_UI_URI,
  applyPanelPatch,
  panelBrief,
  panelHtml,
  panelSnapshot,
  panelToolMeta,
} from "../scripts/panel.ts";
import { DEFAULT_CONFIG, makeTask } from "../scripts/state.ts";
import type { FlowState, Task } from "../scripts/state.ts";
import type { GoalState } from "../scripts/goal.ts";

const now = Date.parse("2026-01-01T00:00:00.000Z");
const liveLease = {
  owner: "primary",
  token: "t",
  heartbeatAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-01-01T01:00:00.000Z",
};

const task = (id: string, patch: Partial<Task> = {}): Task => ({
  ...makeTask(id, "Task " + id, ["src/" + id + "/**"]),
  ...patch,
});

const goal: GoalState = {
  schemaVersion: 1,
  objective: "Ship the panel",
  doneWhen: ["file README.md exists"],
  status: "active",
  iteration: 2,
  maxIterations: 40,
  maxNoProgress: 4,
  noProgress: 1,
  nextStep: "open the pull request",
  progress: [],
  blockers: [],
  lastMarker: "",
  lastProgressAt: "2026-01-01T00:00:00.000Z",
  lastProgressIteration: 2,
  summary: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  checkpoint: null,
  retry: null,
  extensions: 0,
  autoRepairs: 0,
  lastRepairRound: 0,
  diagnosed: false,
  driftReopens: 0,
  allowedCommands: [],
};

// A project with no ledger and no goal still produces a snapshot that says so.
const empty = panelSnapshot({ project: "demo", now, goal: null, state: null });
assert.equal(empty.project, "demo");
assert.equal(empty.goal, null);
assert.equal(empty.config, null);
assert.deepEqual(empty.tasks, []);
assert.deepEqual(empty.waves, []);
assert.deepEqual(empty.drift, []);
assert.deepEqual(empty.counts, { total: 0, open: 0, delivered: 0 });
assert.equal(empty.generatedAt, new Date(now).toISOString());

const state: FlowState = {
  schemaVersion: 1,
  config: { ...DEFAULT_CONFIG },
  sequence: 3,
  tasks: [
    task("T-0001", { status: "merged" }),
    task("T-0002", { status: "planned" }),
    task("T-0003", { status: "active", lease: liveLease, worktree: ".azflow/worktrees/T-0003" }),
  ],
};

const snapshot = panelSnapshot({
  project: "demo",
  now,
  goal,
  state,
  worktreeDirectories: ["T-0003"],
});
assert.equal(snapshot.goal?.objective, "Ship the panel");
assert.equal(snapshot.goal?.iteration, 2);
assert.deepEqual(snapshot.goal?.doneWhen, ["file README.md exists"]);
assert.deepEqual(snapshot.counts, { total: 3, open: 2, delivered: 1 });
assert.deepEqual(snapshot.waves, [{ index: 1, tasks: ["T-0002"] }]);
assert.deepEqual(snapshot.drift, []);
assert.equal(snapshot.tasks.find((entry) => entry.id === "T-0003")?.leaseActive, true);
assert.equal(snapshot.tasks.find((entry) => entry.id === "T-0001")?.leaseActive, false);
assert.deepEqual(snapshot.config, DEFAULT_CONFIG);

// A snapshot is a copy: changing the ledger afterwards must not mutate it.
state.config.maxParallel = 9;
assert.equal(snapshot.config?.maxParallel, DEFAULT_CONFIG.maxParallel);

// An interrupted pass shows up in the panel the same way `azflow doctor` sees it.
const interrupted = panelSnapshot({
  project: "demo",
  now,
  goal,
  state: {
    ...state,
    config: { ...DEFAULT_CONFIG },
    tasks: [task("T-0004", { status: "active", lease: null })],
  },
});
assert.deepEqual(interrupted.drift.map((finding) => finding.kind), ["interrupted-task"]);
assert.match(panelBrief(interrupted), /azflow recover/);

// The brief names the goal, the counts, and the next wave.
const brief = panelBrief(snapshot);
assert.match(brief, /Ship the panel/);
assert.match(brief, /3 total, 2 open, 1 merged/);
assert.match(brief, /Next wave: T-0002/);
assert.match(brief, /goal, ledger, and worktrees agree/);

// Patches change exactly the keys they name.
const patched = applyPanelPatch(DEFAULT_CONFIG, { maxParallel: 5, autonomy: "manual" });
assert.equal(patched.maxParallel, 5);
assert.equal(patched.autonomy, "manual");
assert.equal(patched.mergeStrategy, DEFAULT_CONFIG.mergeStrategy);
assert.equal(DEFAULT_CONFIG.maxParallel, 3, "the source configuration is not mutated");
assert.deepEqual(applyPanelPatch(DEFAULT_CONFIG, { checks: [" npm test "] }).checks, ["npm test"]);
assert.deepEqual(applyPanelPatch(DEFAULT_CONFIG, { allowFrameworks: [] }).allowFrameworks, []);

assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, {}), /empty/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, null), /must be an object/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { base: "develop" }), /not editable/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { maxParallel: 0 }), /positive integer/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { maxParallel: 2.5 }), /positive integer/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { autonomy: "sometimes" }), /must be one of/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { mergeStrategy: "fast-forward" }), /must be one of/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { reviewThreshold: 5.5 }), /between 0 and 5/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { checks: [""] }), /non-empty strings/);
assert.throws(() => applyPanelPatch(DEFAULT_CONFIG, { leaseTtlMinutes: -1 }), /positive integer/);
assert.deepEqual([...PANEL_CONFIG_KEYS].sort(), [
  "allowFrameworks",
  "autonomy",
  "checks",
  "leaseTtlMinutes",
  "maxParallel",
  "mergeStrategy",
  "reviewEngine",
  "reviewThreshold",
]);

// The embedded snapshot cannot close the script element that carries it.
const hostile = panelSnapshot({
  project: "demo",
  now,
  goal: null,
  state: {
    schemaVersion: 1,
    config: { ...DEFAULT_CONFIG },
    sequence: 1,
    tasks: [task("T-0001", { title: "</script><b>escaped</b>" })],
  },
});
const html = panelHtml(hostile);
assert.ok(html.startsWith("<!doctype html>"));
assert.ok(html.includes('id="snapshot"'));
assert.ok(html.includes("azflow_config"), "the panel can call the configuration tool");
assert.ok(html.includes("ui/initialize"), "the panel performs the host handshake");
assert.equal(html.includes("</script><b>escaped</b>"), false);
assert.ok(html.includes("\\u003c/script"), "the title is escaped inside the embedded JSON");

// The panel is declared as a sidebar destination, not only as a tool result.
const meta = panelToolMeta();
assert.deepEqual(Object.keys(meta).sort(), [
  "openai/outputTemplate",
  "openai/ui",
  "ui",
  "ui/resourceUri",
  "ui/visibility",
]);
assert.deepEqual(meta.ui, { resourceUri: PANEL_UI_URI, visibility: ["app"] });
assert.equal(meta["ui/resourceUri"], PANEL_UI_URI);
assert.deepEqual(meta["ui/visibility"], ["app"]);
assert.equal(meta["openai/outputTemplate"], PANEL_UI_URI);
assert.deepEqual(meta["openai/ui"], { entrypoints: [{ type: "global" }] });
assert.equal(PANEL_ICON.mimeType, "image/svg+xml");
assert.ok(PANEL_ICON.src.startsWith("data:image/svg+xml;base64,"), "the icon is inlined, so the bundle needs no extra file");

// The document follows the host theme instead of forcing a dark scheme.
assert.ok(html.includes("data-theme"), "the panel exposes a theme attribute");
assert.ok(html.includes(":root[data-theme=\"dark\"]"), "dark tokens live behind the theme attribute");
assert.ok(html.includes("color-scheme: light"), "the base document is light");
assert.ok(
  html.indexOf("color-scheme: light") < html.indexOf("color-scheme: dark"),
  "light is declared before the dark override, so no unconditional dark scheme ships",
);
assert.ok(html.includes("host-context-changed"), "the panel follows host theme changes");
assert.ok(html.includes("ui/notifications/initialized"), "the panel completes the UI handshake");
assert.ok(html.includes("Pin this panel in the Codex sidebar"), "the panel tells the user how to keep it open");

// A real stdio handshake proves the advertised meta reaches a client.
const server = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "azflow-panel.ts");
const listed = await new Promise<{ title?: string; icons?: unknown; annotations?: { readOnlyHint?: boolean }; _meta?: Record<string, unknown> }>(
  (resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [server], { stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      child.kill();
      rejectPromise(new Error("panel server did not answer tools/list in time"));
    }, 20000);
    let buffer = "";
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill();
    };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const message = JSON.parse(line) as { id?: number; result?: { tools?: Array<Record<string, unknown>> } };
        if (message.id !== 2 || message.result === undefined) continue;
        const tools = message.result.tools ?? [];
        const tool = tools.find((candidate) => candidate.name === PANEL_TOOL);
        assert.ok(tool !== undefined, "the server lists the panel tool");
        finish();
        resolvePromise(tool as never);
      }
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    const send = (message: unknown): void => {
      child.stdin.write(JSON.stringify(message) + "\n");
    };
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  },
);

assert.equal(listed.title, "AzFlow");
assert.equal(Array.isArray(listed.icons) && listed.icons.length, 1, "the tool advertises its icon");
assert.equal(listed.annotations?.readOnlyHint, true, "reading the panel changes nothing");
const advertised = listed._meta ?? {};
for (const key of ["ui", "ui/resourceUri", "ui/visibility", "openai/outputTemplate", "openai/ui"]) {
  assert.ok(key in advertised, "tools/list carries " + key);
}
assert.deepEqual(
  (advertised["openai/ui"] as { entrypoints?: unknown }).entrypoints,
  [{ type: "global" }],
  "the panel is declared as a global sidebar entrypoint",
);

console.log("panel.test.ts: all assertions passed");
