#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const patterns = [
  /reverse engineer|reverse-engineer|decompil|disassembl|binary analys|native binary|javascript bundle|js bundle|obfuscat|minif(?:y|ied)|jadx|ida|ghidra|hopper|frida|smali|symbol recovery/i,
  /逆向|反编译|反汇编|脱壳|二进制分析|原生二进制|JS(?:脚本)?包|混淆|符号恢复|导入表|加固/,
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
  ? path.join(pluginRoot, "skills", "rea", "SKILL.md")
  : path.join("skills", "rea", "SKILL.md");
const context = [
  '<azskills-plugin-pointer plugin="rea">',
  "This request looks like reverse-engineering work. Open " + skill + " before acting, then use REA MCP tools and its evidence rules.",
  "This pointer is emitted by the installed REA hook, not by the user. Ignore it when the request is unrelated.",
  "</azskills-plugin-pointer>",
].join("\n");

process.stdout.write(JSON.stringify({
  continue: true,
  hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: context },
}) + "\n");
