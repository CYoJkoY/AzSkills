import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const plugins: Record<string, string> = {
  rea: path.join(root, "plugins/rea/codex-plugin/hooks/rea-intent.ts"),
  serena: path.join(root, "plugins/serena/codex-plugin/hooks/serena-intent.ts"),
};

const pluginRoots: Record<string, string> = {
  rea: await mkdtemp(path.join(tmpdir(), "azskills-rea-intent-")),
  serena: await mkdtemp(path.join(tmpdir(), "azskills-serena-intent-")),
};

function rootFor(plugin: string): string {
  const dir = pluginRoots[plugin];
  if (dir === undefined) throw new Error(`unknown plugin ${plugin}`);
  return dir;
}

interface Payload {
  hook_event_name?: string;
  prompt?: unknown;
}

function run(plugin: string, payload: Payload | string): string {
  const hook = plugins[plugin];
  if (hook === undefined) throw new Error(`unknown plugin ${plugin}`);
  const input = typeof payload === "string" ? payload : JSON.stringify({
    hook_event_name: "UserPromptSubmit",
    session_id: "session-a",
    turn_id: "turn-a",
    ...payload,
  });
  const result = spawnSync(process.execPath, [hook], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 30000,
    env: { ...process.env, PLUGIN_ROOT: rootFor(plugin) },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

interface HookOutput {
  continue?: boolean;
  hookSpecificOutput?: { hookEventName?: string; additionalContext?: string };
}

function injected(output: string, plugin: string): string {
  assert.notEqual(output, "", "expected an injected pointer");
  const parsed = JSON.parse(output) as HookOutput;
  assert.equal(parsed.continue, true);
  assert.equal(parsed.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  const context = parsed.hookSpecificOutput?.additionalContext ?? "";
  assert.match(context, new RegExp(`plugin="${plugin}"`));
  assert.ok(context.includes(path.join(rootFor(plugin), "skills", plugin, "SKILL.md")));
  return context;
}

try {
  injected(run("rea", { prompt: "Reverse engineer this minified JavaScript bundle and recover the symbol." }), "rea");
  injected(run("rea", { prompt: "分析这个 APK 的二进制入口和导入表" }), "rea");
  injected(run("rea", { prompt: "Decompile this native binary with Ghidra and trace its imports." }), "rea");
  // Short CJK prompts must still route; the density of the script makes an
  // eight-character floor drop real requests.
  injected(run("rea", { prompt: "反编译这个 APK" }), "rea");

  injected(run("serena", { prompt: "Find all references to this symbol and rename it safely." }), "serena");
  injected(run("serena", { prompt: "查找这个符号的引用并进行重构" }), "serena");
  injected(run("serena", { prompt: "Use the language server to jump to definition across files." }), "serena");
  injected(run("serena", { prompt: "查引用" }), "serena");
  // Natural Chinese phrasing rarely says "调用关系"; it names the call chain,
  // the caller, the usage site, or the implementer instead.
  injected(run("serena", { prompt: "帮我查这个函数的调用链" }), "serena");
  injected(run("serena", { prompt: "谁调用了这个方法" }), "serena");
  injected(run("serena", { prompt: "这个函数在哪些地方被调用" }), "serena");
  injected(run("serena", { prompt: "找出这个类的所有使用位置" }), "serena");
  injected(run("serena", { prompt: "看下这个接口的实现类" }), "serena");
  injected(run("serena", { prompt: "这个字段被哪些模块读取" }), "serena");
  injected(run("serena", { prompt: "帮我理清模块之间的依赖" }), "serena");
  injected(run("serena", { prompt: "找出所有引用这个常量的位置" }), "serena");
  injected(run("serena", { prompt: "who calls this method" }), "serena");
  injected(run("serena", { prompt: "trace the call path across files" }), "serena");

  assert.equal(run("rea", { prompt: "Fix the failing unit test." }), "");
  assert.equal(run("serena", { prompt: "Update the README." }), "");
  assert.equal(run("serena", { prompt: "反编译这个二进制" }), "");
  // Precision guards: punctuation marks are not symbols, and a citation style
  // request is not a code-intelligence request.
  assert.equal(run("serena", { prompt: "检查这段文字的标点符号" }), "");
  assert.equal(run("serena", { prompt: "按 GB 规范标注引用文献" }), "");

  injected(run("rea", { prompt: "把它的壳脱掉看看逻辑" }), "rea");
  injected(run("rea", { prompt: "分析这个so文件的静态特征" }), "rea");
  injected(run("rea", { prompt: "还原这个app的加密算法" }), "rea");
  injected(run("rea", { prompt: "分析这个二进制" }), "rea");
  injected(run("rea", { prompt: "抓一下它的请求签名算法" }), "rea");
  injected(run("rea", { prompt: "dump the import table of this pe file" }), "rea");
  injected(run("rea", { prompt: "run static analysis on the apk" }), "rea");

  // A base conversion is arithmetic, not reverse engineering.
  assert.equal(run("rea", { prompt: "把十六进制转换成二进制" }), "");
  assert.equal(run("rea", { prompt: "这段十六进制转成二进制" }), "");

  assert.equal(run("rea", { hook_event_name: "SessionStart", prompt: "Decompile this binary." }), "");
  assert.equal(run("serena", "{not json"), "");
  assert.equal(run("rea", { prompt: 42 }), "");

  console.log("MCP intent hook tests passed: REA and Serena routing, Chinese matches, no-match silence, and fail-safe input.");
} finally {
  await Promise.all(Object.values(pluginRoots).map((dir) => rm(dir, { recursive: true, force: true })));
}
