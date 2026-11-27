/*
 * The delivery-loop panel.
 *
 * A run is easier to judge when its whole state is visible at once: the goal,
 * the ledger tasks, the next waves, the drift findings, and the configuration
 * the loop is running with. This module computes that snapshot, validates the
 * patch its configuration form sends, and renders the self-contained HTML the
 * Codex side panel shows.
 *
 * The snapshot is pure. Callers read the ledger, the goal file, and the
 * worktree directory and hand them in, so the panel rules are unit tested
 * without a repository and the MCP server carries no policy of its own.
 */

import { detectDrift, isTerminalStatus } from "./continuity.ts";
import type { DriftFinding } from "./continuity.ts";
import { isRecord, leaseAlive, planWaves } from "./state.ts";
import type { FlowConfig, FlowState } from "./state.ts";
import type { GoalState } from "./goal.ts";

/** The UI resource the side panel renders; the host resolves it from here. */
export const PANEL_UI_URI = "ui://azflow/panel.html";
export const PANEL_UI_MIME = "text/html;profile=mcp-app";
/** Snapshot resource, so a text-only client can read the same state. */
export const PANEL_SNAPSHOT_URI = "azflow://snapshot";

export const PANEL_TOOL = "azflow_panel";
export const PANEL_CONFIG_TOOL = "azflow_config";

export interface PanelTask {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly issue: number | null;
  readonly pr: number | null;
  readonly leaseActive: boolean;
}

export interface PanelGoal {
  readonly objective: string;
  readonly status: string;
  readonly iteration: number;
  readonly maxIterations: number;
  readonly noProgress: number;
  readonly maxNoProgress: number;
  readonly doneWhen: readonly string[];
  readonly nextStep: string;
  readonly summary: string;
}

export interface PanelWave {
  readonly index: number;
  readonly tasks: readonly string[];
}

export interface PanelBlocked {
  readonly id: string;
  readonly reason: string;
}

export interface PanelCounts {
  readonly total: number;
  readonly open: number;
  readonly delivered: number;
}

export interface PanelSnapshot {
  readonly project: string;
  readonly generatedAt: string;
  readonly goal: PanelGoal | null;
  readonly config: FlowConfig | null;
  readonly tasks: readonly PanelTask[];
  readonly waves: readonly PanelWave[];
  readonly blocked: readonly PanelBlocked[];
  readonly conflicts: readonly string[];
  readonly drift: readonly DriftFinding[];
  readonly counts: PanelCounts;
}

export interface PanelInput {
  readonly project: string;
  readonly now: number;
  readonly goal: GoalState | null;
  readonly state: FlowState | null;
  readonly worktreeDirectories?: readonly string[];
}

/** Every key the panel form may change; everything else stays CLI-only. */
export const PANEL_CONFIG_KEYS: readonly string[] = [
  "autonomy",
  "mergeStrategy",
  "maxParallel",
  "reviewThreshold",
  "reviewEngine",
  "leaseTtlMinutes",
  "checks",
  "allowFrameworks",
];

function goalOf(goal: GoalState): PanelGoal {
  return {
    objective: goal.objective,
    status: goal.status,
    iteration: goal.iteration,
    maxIterations: goal.maxIterations,
    noProgress: goal.noProgress,
    maxNoProgress: goal.maxNoProgress,
    doneWhen: [...goal.doneWhen],
    nextStep: goal.nextStep,
    summary: goal.summary,
  };
}

/**
 * One snapshot of everything the panel shows. The ledger and the goal file are
 * read by the caller, so a project with neither still produces a snapshot that
 * says so instead of failing.
 */
export function panelSnapshot(input: PanelInput): PanelSnapshot {
  const tasks = input.state?.tasks ?? [];
  const plan = input.state === null ? null : planWaves(input.state, input.now);
  const drift = detectDrift(
    {
      goalStatus: input.goal?.status ?? null,
      tasks,
      worktreeDirectories: input.worktreeDirectories ?? [],
    },
    input.now,
  );
  const delivered = tasks.filter((task) => task.status === "merged").length;
  return {
    project: input.project,
    generatedAt: new Date(input.now).toISOString(),
    goal: input.goal === null ? null : goalOf(input.goal),
    config: input.state === null ? null : { ...input.state.config },
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      issue: task.issue,
      pr: task.pr,
      leaseActive: leaseAlive(task.lease, input.now),
    })),
    waves: plan?.waves ?? [],
    blocked: plan?.blocked ?? [],
    conflicts: plan?.conflicts ?? [],
    drift,
    counts: {
      total: tasks.length,
      open: tasks.filter((task) => !isTerminalStatus(task.status)).length,
      delivered,
    },
  };
}

function requireOneOf<T extends string>(key: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error("Config " + key + " must be one of: " + allowed.join(", ") + ".");
  }
  return value as T;
}

function requirePositiveInt(key: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error("Config " + key + " must be a positive integer.");
  }
  return value;
}

function requireThreshold(key: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new Error("Config " + key + " must be a number between 0 and 5.");
  }
  return value;
}

function requireStringList(key: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("Config " + key + " must be a list of non-empty strings.");
  }
  return value.map((item: string) => item.trim());
}

/**
 * Applies a panel patch to a configuration. Unknown keys are refused rather
 * than ignored: a typo in the form must not look like a saved change. `base`
 * and `remote` stay out of reach because they change what git means.
 */
export function applyPanelPatch(config: FlowConfig, patch: unknown): FlowConfig {
  if (!isRecord(patch)) throw new Error("Config patch must be an object.");
  const entries = Object.entries(patch);
  if (entries.length === 0) throw new Error("Config patch is empty; nothing to change.");
  const next: FlowConfig = { ...config };
  for (const [key, value] of entries) {
    switch (key) {
      case "autonomy":
        next.autonomy = requireOneOf(key, value, ["full", "manual"] as const);
        break;
      case "mergeStrategy":
        next.mergeStrategy = requireOneOf(key, value, ["squash", "merge", "rebase"] as const);
        break;
      case "reviewEngine":
        next.reviewEngine = requireOneOf(key, value, ["egm", "self"] as const);
        break;
      case "maxParallel":
        next.maxParallel = requirePositiveInt(key, value);
        break;
      case "leaseTtlMinutes":
        next.leaseTtlMinutes = requirePositiveInt(key, value);
        break;
      case "reviewThreshold":
        next.reviewThreshold = requireThreshold(key, value);
        break;
      case "checks":
        next.checks = requireStringList(key, value);
        break;
      case "allowFrameworks":
        next.allowFrameworks = requireStringList(key, value);
        break;
      default:
        throw new Error(
          "Config key " + key + " is not editable from the panel. Editable keys: " + PANEL_CONFIG_KEYS.join(", ") + ".",
        );
    }
  }
  return next;
}

const statusLabel = (snapshot: PanelSnapshot): string =>
  snapshot.goal === null ? "no goal" : snapshot.goal.status;

/** A readable summary, used when the client cannot render the HTML panel. */
export function panelBrief(snapshot: PanelSnapshot): string {
  const lines = [
    "AzFlow panel - " + snapshot.project,
    "",
    "Goal: " + (snapshot.goal === null ? "none" : snapshot.goal.objective),
    "Status: " + statusLabel(snapshot),
    "Tasks: " + snapshot.counts.total + " total, " + snapshot.counts.open + " open, " + snapshot.counts.delivered + " merged",
  ];
  if (snapshot.goal !== null) {
    lines.push(
      "Iteration: " + snapshot.goal.iteration + "/" + snapshot.goal.maxIterations,
      "No progress: " + snapshot.goal.noProgress + "/" + snapshot.goal.maxNoProgress,
    );
    if (snapshot.goal.nextStep !== "") lines.push("Next step: " + snapshot.goal.nextStep);
  }
  const wave = snapshot.waves.at(0);
  if (wave !== undefined) lines.push("Next wave: " + wave.tasks.join(", "));
  if (snapshot.blocked.length > 0) {
    lines.push("Blocked: " + snapshot.blocked.map((entry) => entry.id + " (" + entry.reason + ")").join(", "));
  }
  if (snapshot.drift.length === 0) {
    lines.push("Continuity: goal, ledger, and worktrees agree");
  } else {
    lines.push("Continuity:");
    for (const finding of snapshot.drift) lines.push("- " + finding.detail + " Repair with `" + finding.fix + "`.");
  }
  return lines.join("\n");
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PANEL_STYLES = `
:root {
  color-scheme: dark;
  --bg: #14161c;
  --card: #1c1f27;
  --line: #2b3040;
  --text: #e7e9f0;
  --muted: #98a0b3;
  --accent: #7f92e0;
  --warn: #e0a95f;
  --bad: #e07f7f;
  --good: #77c79a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 16px;
  background: var(--bg);
  color: var(--text);
  font: 13px/1.5 "Segoe UI", system-ui, sans-serif;
}
h1 { font-size: 15px; margin: 0; letter-spacing: .01em; }
h2 { font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 600; }
header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.stamp { color: var(--muted); font-size: 11px; }
.pill { border-radius: 999px; padding: 2px 9px; font-size: 11px; border: 1px solid var(--line); color: var(--muted); }
.pill.active { color: var(--good); border-color: #2f4a3c; }
.pill.complete { color: var(--accent); border-color: #33406b; }
.pill.paused, .pill.stalled { color: var(--warn); border-color: #4a3f2a; }
.pill.abandoned, .pill.none { color: var(--muted); }
section { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
.objective { font-size: 14px; margin: 0 0 6px; }
.meta { color: var(--muted); font-size: 11px; }
ul { margin: 6px 0 0; padding-left: 18px; }
li { margin: 2px 0; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { text-align: left; color: var(--muted); font-weight: 500; padding: 4px 6px 4px 0; border-bottom: 1px solid var(--line); }
td { padding: 4px 6px 4px 0; border-bottom: 1px solid #232734; vertical-align: top; }
tr:last-child td { border-bottom: 0; }
code { font-family: "Cascadia Mono", Consolas, monospace; font-size: 11px; color: var(--accent); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
label { display: block; color: var(--muted); font-size: 11px; margin-bottom: 3px; }
input, select { width: 100%; background: #12141a; color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 5px 7px; font: inherit; }
button { margin-top: 10px; background: #2c3350; color: var(--text); border: 1px solid #3a4468; border-radius: 7px; padding: 6px 12px; font: inherit; cursor: pointer; }
button:hover { background: #343d60; }
.note { color: var(--muted); font-size: 11px; margin-top: 8px; }
.warn { color: var(--warn); }
.bad { color: var(--bad); }
.good { color: var(--good); }
.empty { color: var(--muted); font-size: 12px; }
`;

const PANEL_SCRIPT = `
(function () {
  var root = document.getElementById("root");
  var source = document.getElementById("snapshot");
  var current = JSON.parse(source.textContent || "{}");
  var host = window.parent && window.parent !== window ? window.parent : null;
  var nextId = 100;

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rows(items, render) {
    return items.map(render).join("");
  }

  function goalSection(goal) {
    if (!goal) return '<section><h2>Goal</h2><p class="empty">No goal in this project. Start one with <code>azflow goal start</code>.</p></section>';
    var done = goal.doneWhen.length === 0
      ? '<p class="empty">No machine-checkable criterion.</p>'
      : "<ul>" + rows(goal.doneWhen, function (item) { return "<li>" + esc(item) + "</li>"; }) + "</ul>";
    return '<section><h2>Goal</h2>'
      + '<p class="objective">' + esc(goal.objective) + "</p>"
      + '<p class="meta">iteration ' + esc(goal.iteration) + "/" + esc(goal.maxIterations)
      + " - no-progress " + esc(goal.noProgress) + "/" + esc(goal.maxNoProgress) + "</p>"
      + (goal.nextStep ? '<p class="meta">next: ' + esc(goal.nextStep) + "</p>" : "")
      + done
      + (goal.summary ? '<p class="note">' + esc(goal.summary) + "</p>" : "")
      + "</section>";
  }

  function configSection(config) {
    if (!config) return '<section><h2>Configuration</h2><p class="empty">No ledger. Run <code>azflow init</code>.</p></section>';
    return '<section><h2>Configuration</h2>'
      + '<div class="grid">'
      + '<div><label for="autonomy">Autonomy</label><select id="autonomy">'
      + '<option value="full"' + (config.autonomy === "full" ? " selected" : "") + ">full</option>"
      + '<option value="manual"' + (config.autonomy === "manual" ? " selected" : "") + ">manual</option></select></div>"
      + '<div><label for="mergeStrategy">Merge strategy</label><select id="mergeStrategy">'
      + rows(["squash", "merge", "rebase"], function (value) {
        return '<option value="' + value + '"' + (config.mergeStrategy === value ? " selected" : "") + ">" + value + "</option>";
      })
      + "</select></div>"
      + '<div><label for="reviewEngine">Review engine</label><select id="reviewEngine">'
      + rows(["egm", "self"], function (value) {
        return '<option value="' + value + '"' + (config.reviewEngine === value ? " selected" : "") + ">" + value + "</option>";
      })
      + "</select></div>"
      + '<div><label for="maxParallel">Max parallel</label><input id="maxParallel" type="number" min="1" value="' + esc(config.maxParallel) + '" /></div>'
      + '<div><label for="reviewThreshold">Review threshold</label><input id="reviewThreshold" type="number" min="0" max="5" step="0.05" value="' + esc(config.reviewThreshold) + '" /></div>'
      + '<div><label for="leaseTtlMinutes">Lease TTL (min)</label><input id="leaseTtlMinutes" type="number" min="1" value="' + esc(config.leaseTtlMinutes) + '" /></div>'
      + "</div>"
      + "<button id=\\"apply\\">Apply changes</button>"
      + '<p class="note">Base <code>' + esc(config.base) + "</code>, remote <code>" + esc(config.remote) + "</code>, "
      + esc(config.checks.length) + " check(s), " + esc(config.allowFrameworks.length) + " allowed framework(s)."
      + " Checks and frameworks are edited from the CLI.</p>"
      + '<p class="note" id="config-note"></p>'
      + "</section>";
  }

  function wavesSection(snapshot) {
    var waves = snapshot.waves.length === 0
      ? '<p class="empty">No planned task can start yet.</p>'
      : "<ul>" + rows(snapshot.waves, function (wave) {
        return "<li>wave " + esc(wave.index) + ": <code>" + esc(wave.tasks.join(", ")) + "</code></li>";
      }) + "</ul>";
    var blocked = snapshot.blocked.length === 0
      ? ""
      : "<ul>" + rows(snapshot.blocked, function (item) {
        return "<li>" + esc(item.id) + " - " + esc(item.reason) + "</li>";
      }) + "</ul>";
    var conflicts = snapshot.conflicts.length === 0
      ? ""
      : '<p class="warn">touch overlap: ' + esc(snapshot.conflicts.join("; ")) + "</p>";
    return "<section><h2>Next waves</h2>" + waves + blocked + conflicts + "</section>";
  }

  function tasksSection(snapshot) {
    if (snapshot.tasks.length === 0) return '<section><h2>Tasks</h2><p class="empty">The ledger is empty.</p></section>';
    var body = rows(snapshot.tasks, function (task) {
      return "<tr><td><code>" + esc(task.id) + "</code></td><td>" + esc(task.title) + "</td><td>"
        + esc(task.status) + (task.leaseActive ? " (leased)" : "") + "</td><td>"
        + (task.issue === null ? "-" : "#" + esc(task.issue)) + "</td><td>"
        + (task.pr === null ? "-" : "#" + esc(task.pr)) + "</td></tr>";
    });
    return "<section><h2>Tasks</h2><table><thead><tr><th>id</th><th>title</th><th>status</th><th>issue</th><th>pr</th></tr></thead><tbody>"
      + body + "</tbody></table></section>";
  }

  function driftSection(snapshot) {
    if (snapshot.drift.length === 0) {
      return '<section><h2>Continuity</h2><p class="good">Goal, ledger, and worktrees agree.</p></section>';
    }
    var items = rows(snapshot.drift, function (finding) {
      return "<li>" + esc(finding.detail) + " <code>" + esc(finding.fix) + "</code></li>";
    });
    return '<section><h2>Continuity</h2><ul class="warn">' + items + "</ul></section>";
  }

  function render() {
    var snapshot = current || {};
    var goal = snapshot.goal;
    var status = goal ? goal.status : "none";
    root.innerHTML =
      "<header><h1>" + esc(snapshot.project) + '</h1><div class="stamp"><span class="pill ' + esc(status) + '">'
      + esc(status) + "</span> " + esc(snapshot.generatedAt) + "</div></header>"
      + goalSection(goal)
      + '<section><h2>Progress</h2><p class="meta">'
      + esc(snapshot.counts.total) + " tasks - " + esc(snapshot.counts.open) + " open - "
      + esc(snapshot.counts.delivered) + " merged</p></section>"
      + configSection(snapshot.config)
      + wavesSection(snapshot)
      + tasksSection(snapshot)
      + driftSection(snapshot);
    var apply = document.getElementById("apply");
    if (apply) apply.addEventListener("click", submit);
  }

  function submit() {
    var note = document.getElementById("config-note");
    var patch = {
      autonomy: document.getElementById("autonomy").value,
      mergeStrategy: document.getElementById("mergeStrategy").value,
      reviewEngine: document.getElementById("reviewEngine").value,
      maxParallel: Number(document.getElementById("maxParallel").value),
      reviewThreshold: Number(document.getElementById("reviewThreshold").value),
      leaseTtlMinutes: Number(document.getElementById("leaseTtlMinutes").value)
    };
    if (!host) {
      if (note) note.textContent = "Open this panel from Codex to save. From a terminal: azflow config set <key> <value>.";
      return;
    }
    if (note) note.textContent = "Saving...";
    host.postMessage({
      jsonrpc: "2.0",
      id: nextId++,
      method: "ui/callTool",
      params: { name: "azflow_config", arguments: { action: "set", patch: patch } }
    }, "*");
  }

  function ingest(result) {
    var content = result && result.content;
    if (!Array.isArray(content)) return;
    for (var index = 0; index < content.length; index += 1) {
      var part = content[index];
      if (!part || part.type !== "text" || typeof part.text !== "string") continue;
      try {
        var parsed = JSON.parse(part.text);
        if (parsed && parsed.project) {
          current = parsed;
          render();
          return;
        }
        if (parsed && parsed.config) {
          var note = document.getElementById("config-note");
          if (note) note.textContent = "Saved.";
          return;
        }
      } catch (error) {
        // A plain-text tool result is a message, not a snapshot.
      }
    }
  }

  window.addEventListener("message", function (event) {
    var message = event.data;
    if (!message || typeof message !== "object") return;
    if (message.method === "ui/notifications/tool-result") {
      ingest(message.params && (message.params.result || message.params.toolResult));
      return;
    }
    if (message.id !== undefined && message.result !== undefined) ingest(message.result);
  });

  render();

  if (host) {
    host.postMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "ui/initialize",
      params: { appInfo: { name: "azflow-panel", version: "1" }, appCapabilities: { tools: { call: true } } }
    }, "*");
  }
})();
`;

/** The self-contained panel document; the snapshot is embedded, not fetched. */
export function panelHtml(snapshot: PanelSnapshot): string {
  const data = JSON.stringify(snapshot).replace(/</g, "\\u003c");
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<title>AzFlow panel - " + escapeHtml(snapshot.project) + "</title>",
    "<style>" + PANEL_STYLES + "</style>",
    "</head>",
    "<body>",
    '<main id="root"></main>',
    '<script id="snapshot" type="application/json">' + data + "</script>",
    "<script>" + PANEL_SCRIPT + "</script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
