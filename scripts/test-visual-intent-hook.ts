import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = path.join(root, "codex-plugin/hooks/visual-intent.ts");
const pluginRoot = await mkdtemp(path.join(tmpdir(), "azskills-visual-intent-"));

interface Payload {
  hook_event_name?: string;
  prompt?: unknown;
}

function run(plugin: string, payload: Payload | string): string {
  const input = typeof payload === "string" ? payload : JSON.stringify({
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-a",
    ...payload,
  });
  const result = spawnSync(process.execPath, [hook, plugin], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 30000,
    env: { ...process.env, PLUGIN_ROOT: pluginRoot },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

interface HookOutput {
  continue?: boolean;
  hookSpecificOutput?: { hookEventName?: string; additionalContext?: string };
}

function injected(output: string): string {
  assert.notEqual(output, "", "expected an injected pointer");
  const parsed = JSON.parse(output) as HookOutput;
  assert.equal(parsed.continue, true);
  assert.equal(parsed.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  return parsed.hookSpecificOutput?.additionalContext ?? "";
}

try {
  const design = injected(run("design", { prompt: "Refine this UI and add its motion states." }));
  assert.match(design, /plugin="design"/);
  assert.ok(design.includes(path.join(pluginRoot, "skills", "design", "SKILL.md")));

  const assets = injected(run("visual-assets", { prompt: "Create a logo and favicon for my app." }));
  assert.match(assets, /plugin="visual-assets"/);
  assert.ok(assets.includes(path.join(pluginRoot, "skills", "visual-assets", "SKILL.md")));

  const production = injected(run("visual-production", { prompt: "Turn these findings into a slide deck." }));
  assert.match(production, /plugin="visual-production"/);

  assert.match(injected(run("visual-production", { prompt: "Render an HTML REPORT from this data." })), /plugin="visual-production"/);

  const chineseDesign = injected(run("design", { prompt: "把这个界面的微交互和响应式布局改一下" }));
  assert.match(chineseDesign, /plugin="design"/);

  const chineseAssets = injected(run("visual-assets", { prompt: "给这个项目做一个品牌标识和图标" }));
  assert.match(chineseAssets, /plugin="visual-assets"/);

  const chineseProduction = injected(run("visual-production", { prompt: "把这份数据做成幻灯片" }));
  assert.match(chineseProduction, /plugin="visual-production"/);

  assert.equal(run("design", { prompt: "帮我设计一下数据库表结构" }), "");
  assert.equal(run("design", { prompt: "帮我做一个图标" }), "");

  assert.equal(run("design", { prompt: "Fix the failing unit test." }), "");
  assert.equal(run("design", { prompt: "hi" }), "");
  assert.equal(run("design", { prompt: 42 }), "");
  assert.equal(run("design", { hook_event_name: "SessionStart", prompt: "Refine this UI." }), "");
  assert.equal(run("unknown", { prompt: "Create a logo." }), "");
  assert.equal(run("design", "{not json"), "");

  console.log("Visual intent hook tests passed: per-plugin routing, case-insensitive matching, no-match silence, and fail-safe input.");
} finally {
  await rm(pluginRoot, { recursive: true, force: true });
}
