#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const patterns = [
  /symbols?|find (?:all )?references?|references? to|go to definition|goto definition|call (?:graph|hierarchy|chain|sites?|path)|callers?|who calls|usages?|usage sites?|implementations?|subtypes?|type hierarchy|impact analysis|dependency graph|rename (?:a )?symbol|refactor|language server|\blsp\b|semantic (?:search|code)|code navigation|cross-file/i,
  /(?<!标点)符号|语义搜索|引用关系|引用位置|引用分析|引用[\s\S]{0,10}(?:位置|地方|处)|查找?引用|谁引用|跳转定义|转到定义|定义位置|调用链|调用图|调用关系|调用栈|调用者|谁调用|被调用|哪些地方[\s\S]{0,8}(?:调用|使用|引用)|被哪些[\s\S]{0,8}(?:调用|使用|引用|读取)|实现类|接口实现|继承关系|子类|影响范围|影响面|使用位置|使用处|模块依赖|模块[\s\S]{0,8}依赖|依赖关系|依赖链|依赖分析|语言服务器|跨文件|跨模块|重命名|重构/,
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

const pluginRoot = process.env.PLUGIN_ROOT ?? process.env.CLAUDE_PLUGIN_ROOT;
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
