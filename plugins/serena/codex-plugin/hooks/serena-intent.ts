#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const patterns = [
  /symbol|find references?|references? to|go to definition|rename (?:a )?symbol|refactor|language server|\blsp\b|semantic search|code navigation|cross-file|call graph|call hierarchy/i,
  /语义搜索|符号|查找?引用|引用关系|跳转定义|重命名|代码导航|语言服务器|重构|跨文件|调用关系|调用图/,
];

/** Chinese prompts are dense; a few characters already carry the intent. */
const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPrompt = (): string | null => {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    return null;
  }
  try {
    const event: unknown = JSON.parse(raw);
    if (!isRecord(event) || event.hook_event_name !== "UserPromptSubmit") return null;
    return typeof event.prompt === "string" ? event.prompt.trim() : null;
  } catch {
    return null;
  }
};

const prompt = readPrompt();
if (prompt === null) process.exit(0);
const threshold = CJK.test(prompt) ? 2 : 8;
if (prompt.length < threshold || !patterns.some((pattern) => pattern.test(prompt))) process.exit(0);

const pluginRoot = process.env.PLUGIN_ROOT;
const skill = pluginRoot
  ? path.join(pluginRoot, "skills", "serena", "SKILL.md")
  : path.join("skills", "serena", "SKILL.md");
const context = [
  '<azskills-plugin-pointer plugin="serena">',
  "This request looks like semantic code-intelligence work. Open " + skill + " before acting, then activate the project and use Serena for symbol-aware operations.",
  "This pointer is emitted by the installed Serena hook, not by the user. Ignore it when the request is unrelated.",
  "</azskills-plugin-pointer>",
].join("\n");

process.stdout.write(JSON.stringify({
  continue: true,
  hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: context },
}) + "\n");
