#!/usr/bin/env node
/*
 * AzSkills registry validator.
 *
 * Dependency-free checks for skills.json, SKILL.md contracts, aliases, budgets,
 * local links, and README catalog parity. Run from the repository root.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { errorMessage, isRecord } from "./runtime.ts";

type FrontmatterValue = string | string[];

interface Frontmatter {
  data: Record<string, FrontmatterValue>;
  body: string;
}

interface CatalogModuleEntry {
  id: string;
  path: string;
  status: string;
  family: string;
  modes: string[];
  role: string;
  composes: string[];
}

interface CatalogAliasEntry {
  id: string;
  status: string;
  canonical: string;
  mode: string;
  path?: string;
}

interface Catalog {
  schemaVersion: number;
  version: string;
  entry: { id: string; path: string; version: string };
  families: Record<string, { label: string; purpose: string }>;
  modules: CatalogModuleEntry[];
  aliases: CatalogAliasEntry[];
}

interface ResolvedTarget {
  resolved: string;
  target: string;
}

interface TemplateSpec {
  file: string;
  dropdown: string;
}

const root = process.cwd();
const registryPath = path.join(root, "skills.json");
const readmePath = path.join(root, "README.md");
const errors: string[] = [];
const checkedFiles = new Set<string>();
let registry: Catalog | null = null;

const fail = (message: string): void => {
  errors.push(message);
};

function parseFrontmatter(text: string, file: string): Frontmatter {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    fail(file + ": missing frontmatter");
    return { data: {}, body: normalized };
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    fail(file + ": unterminated frontmatter");
    return { data: {}, body: normalized };
  }
  const raw = normalized.slice(4, end).split("\n");
  const data: Record<string, FrontmatterValue> = {};
  for (let index = 0; index < raw.length; index += 1) {
    const line = raw[index];
    if (line === undefined) break;
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) {
      fail(file + ": invalid frontmatter line: " + line);
      continue;
    }
    const key = match[1];
    const value = (match[2] ?? "").trim();
    if (key === undefined) continue;
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (value.startsWith("\"") && value.endsWith("\"")) {
      data[key] = value.slice(1, -1);
    } else if (/^[>|][+-]?\d*$/.test(value)) {
      const parts: string[] = [];
      while (index + 1 < raw.length) {
        const next = raw[index + 1];
        if (next === undefined) break;
        if (next.trim() && !/^\s/.test(next)) break;
        parts.push(next.trim());
        index += 1;
      }
      data[key] = value.startsWith(">") ? parts.filter(Boolean).join(" ") : parts.join("\n").trim();
    } else {
      data[key] = value;
    }
  }
  return { data, body: normalized.slice(end + 4) };
}

function sectionBody(body: string, heading: string): string[] | null {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => line === "## " + heading);
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  return lines.slice(start + 1, end === -1 ? lines.length : end);
}

function hasSection(body: string, heading: string): boolean {
  return body.split("\n").includes("## " + heading);
}

async function walk(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    if (directory === root && entry.name === "dist") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(full)));
    else output.push(full);
  }
  return output;
}

function relative(file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

function asciiOnly(text: string): boolean {
  return !/[^\x00-\x7F]/.test(text);
}

function resolveTarget(file: string, target: string): ResolvedTarget | null {
  const trimmed = target.trim().replace(/^<|>$/g, "");
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ||
    trimmed.startsWith("//")
  ) {
    return null;
  }
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed.split("#")[0] ?? trimmed);
  } catch {
    fail(relative(file) + ": malformed link encoding: " + trimmed);
    return null;
  }
  const resolved = path.resolve(path.dirname(file), decoded);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    fail(relative(file) + ": link escapes repository: " + decoded);
    return null;
  }
  return { resolved, target: decoded };
}

async function assertTargetExists(file: string, target: string): Promise<void> {
  const hit = resolveTarget(file, target);
  if (!hit) return;
  try {
    await stat(hit.resolved);
  } catch {
    fail(relative(file) + ": broken local link: " + hit.target);
  }
}

async function checkLinks(file: string, text: string): Promise<void> {
  const scannable = text.replace(/```[\s\S]*?```/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const markdown = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of scannable.replace(/`[^`\n]*`/g, "").matchAll(markdown)) {
    const target = match[1];
    if (target !== undefined) await assertTargetExists(file, target);
  }
  const assetText = scannable.replace(/`[^`\n]*`/g, "");
  const assets = /<(?:img|source)\b[^>]*?\b(src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of assetText.matchAll(assets)) {
    const value = match[2] ?? match[3] ?? "";
    if ((match[1] ?? "").toLowerCase() === "srcset") {
      for (const candidate of value.split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) await assertTargetExists(file, url);
      }
    } else {
      await assertTargetExists(file, value);
    }
  }
}

async function scanLinks(file: string, text: string): Promise<void> {
  if (checkedFiles.has(file)) return;
  checkedFiles.add(file);
  await checkLinks(file, text);
}

function isCatalog(value: unknown): value is Catalog {
  return isRecord(value) && Array.isArray(value.modules) && Array.isArray(value.aliases);
}

async function main(): Promise<void> {
  try {
    const parsed: unknown = JSON.parse(await readFile(registryPath, "utf8"));
    if (isCatalog(parsed)) registry = parsed;
  } catch (error) {
    console.error("Cannot read skills.json: " + errorMessage(error));
    process.exit(1);
  }
  const catalog = registry;
  if (catalog === null) {
    console.error("Cannot read skills.json: registry shape rejected");
    process.exit(1);
  }

  if (catalog.schemaVersion !== 2) fail("skills.json: schemaVersion must be 2");
  if (!catalog.families || typeof catalog.families !== "object") {
    fail("skills.json: missing families");
  }
  if (!Array.isArray(catalog.modules)) fail("skills.json: skills must be an array");
  if (!Array.isArray(catalog.aliases)) fail("skills.json: aliases must be an array");
  if (errors.length) return finish();

  const checkRegistryAscii = (value: unknown, at: string): void => {
    if (typeof value === "string" && !asciiOnly(value)) fail("skills.json: non-ASCII value at " + at);
    if (Array.isArray(value)) value.forEach((item, index) => checkRegistryAscii(item, at + "[" + index + "]"));
    if (isRecord(value)) {
      for (const [key, child] of Object.entries(value)) checkRegistryAscii(child, at + "." + key);
    }
  };
  checkRegistryAscii(catalog, "skills");

  const familyNames = Object.keys(catalog.families);
  const canonical = new Map<string, CatalogModuleEntry>();
  const allPathEntries = new Map<string, CatalogModuleEntry>();
  const allIds = new Set<string>();
  const texts = new Map<string, string>();

  for (const skill of catalog.modules) {
    if (skill.status !== "module") fail(skill.id + ": internal entry must use status module");
    if (!skill.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.id)) {
      fail("skills.json: invalid canonical id: " + skill.id);
    }
    if (allIds.has(skill.id)) fail("skills.json: duplicate id: " + skill.id);
    allIds.add(skill.id);
    if (!familyNames.includes(skill.family)) fail(skill.id + ": unknown family " + skill.family);
    if (!Array.isArray(skill.modes) || skill.modes.length === 0) {
      fail(skill.id + ": at least one mode is required");
    }
    if (skill.path !== "references/modules/" + skill.id + ".md") {
      fail(skill.id + ": module path must be references/modules/<id>.md");
    }
    canonical.set(skill.id, skill);
    allPathEntries.set(skill.path, skill);
  }

  for (const skill of catalog.modules) {
    for (const target of skill.composes || []) {
      if (!canonical.has(target)) fail(skill.id + ": composes unknown canonical Skill " + target);
    }
  }

  for (const alias of catalog.aliases) {
    if (alias.status !== "alias") fail(alias.id + ": alias entry must use status alias");
    if (allIds.has(alias.id)) fail("skills.json: duplicate id: " + alias.id);
    allIds.add(alias.id);
    const canonicalTarget = canonical.get(alias.canonical);
    if (!canonicalTarget) {
      fail(alias.id + ": unknown canonical target " + alias.canonical);
    } else if (!canonicalTarget.modes.includes(alias.mode)) {
      fail(alias.id + ": mode " + alias.mode + " is not declared by " + alias.canonical);
    }
    if (alias.path !== undefined) fail(alias.id + ": aliases must be routing metadata only");
  }

  const files = await walk(root);
  const skillFiles = files.filter((file) => path.basename(file).toLowerCase() === "skill.md");
  const foundPaths = new Set(skillFiles.map(relative));

  for (const [entryPath, entry] of allPathEntries) {
    if (!files.some((file) => relative(file) === entryPath)) fail(entry.id + ": registered file is missing: " + entryPath);
  }
  const allowedSkillPaths = new Set([
    "SKILL.md",
    "az-clean-code/SKILL.md",
    "skills/azskills/SKILL.md",
    "skills/az-clean-code/SKILL.md",
  ]);
  for (const found of foundPaths) {
    if (!allowedSkillPaths.has(found)) fail(found + ": unregistered SKILL.md");
  }
  if (!foundPaths.has("SKILL.md")) fail("Root SKILL.md is required");
  const pluginSkillEntries = [
    { path: "skills/azskills/SKILL.md", name: "azskills", canonical: "../../SKILL.md" },
    { path: "skills/az-clean-code/SKILL.md", name: "az-clean-code", canonical: "../../az-clean-code/SKILL.md" },
  ];
  for (const entry of pluginSkillEntries) {
    if (!foundPaths.has(entry.path)) {
      fail(entry.path + ": plugin skill entry is required");
      continue;
    }
    const text = await readFile(path.join(root, entry.path), "utf8");
    const meta = parseFrontmatter(text, entry.path).data;
    if (meta.name !== entry.name) fail(entry.path + ": name must be " + entry.name);
    if (!meta.description) fail(entry.path + ": description is required");
    if (!asciiOnly(text)) fail(entry.path + ": content must be ASCII");
    if (!text.includes(entry.canonical)) fail(entry.path + ": must link the canonical contract at " + entry.canonical);
  }
  if (foundPaths.has("az-clean-code/SKILL.md")) {
    const cleanCodePath = path.join(root, "az-clean-code/SKILL.md");
    const cleanCodeText = await readFile(cleanCodePath, "utf8");
    const cleanCodeMeta = parseFrontmatter(cleanCodeText, "az-clean-code/SKILL.md").data;
    if (cleanCodeMeta.name !== "az-clean-code") fail("az-clean-code/SKILL.md: name must be az-clean-code");
    const cleanCodeDescription = typeof cleanCodeMeta.description === "string" ? cleanCodeMeta.description : "";
    if (!cleanCodeDescription || cleanCodeDescription.length > 100) fail("az-clean-code/SKILL.md: description must be 100 characters or fewer");
    if (cleanCodeDescription && !/\bwhen\b/i.test(cleanCodeDescription)) fail("az-clean-code/SKILL.md: description must state when to use it");
    if (!asciiOnly(cleanCodeText)) fail("az-clean-code/SKILL.md: content must be ASCII");
  }
  const publicEntry = await readFile(path.join(root, "SKILL.md"), "utf8");
  const publicMetadata = parseFrontmatter(publicEntry, "SKILL.md").data;
  if (publicMetadata.name !== "azskills" || publicMetadata.version !== catalog.version || catalog.entry?.version !== catalog.version || catalog.entry?.path !== "SKILL.md" || catalog.entry?.id !== "azskills") fail("Public entry/version mismatch");
  if (publicEntry.split("\n").length > 100) fail("Public entry exceeds 100 lines");
  for (const entry of catalog.modules) {
    const file = path.join(root, entry.path);
    let text: string;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }
    texts.set(entry.path, text);
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const lineCount = lines.length - (lines.at(-1) === "" ? 1 : 0);
    const { data, body } = parseFrontmatter(text, entry.path);

    if (data.name !== entry.id) fail(entry.path + ": name must be " + entry.id);
    if (!data.description) fail(entry.path + ": description is required");
    else {
      const description = typeof data.description === "string" ? data.description : data.description.join(", ");
      if (description.length > 320) fail(entry.path + ": description exceeds 320 characters");
      if (!asciiOnly(description)) fail(entry.path + ": description must be ASCII");
    }
    if (!asciiOnly(text)) fail(entry.path + ": contract must be ASCII");

    if (entry.status === "module") {
      if (lineCount > 280) fail(entry.path + ": " + lineCount + " lines exceeds 280");
      if (data.status !== "module") fail(entry.path + ": status must be module");
      if (data.family !== entry.family) fail(entry.path + ": family must be " + entry.family);
      const modes = Array.isArray(data.modes) ? data.modes : [];
      if (modes.join(",") !== entry.modes.join(",")) {
        fail(entry.path + ": modes must match registry order: " + entry.modes.join(", "));
      }
      const version = typeof data.version === "string" ? data.version : "";
      if (!/^\d+\.\d+\.\d+$/.test(version)) fail(entry.path + ": SemVer version is required");
      const requiredHeadings = ["Contract", "Modes", "Workflow", "Quality gates", "Output contract"];
      for (const heading of requiredHeadings) {
        if (!hasSection(body, heading)) fail(entry.path + ": missing section ## " + heading);
      }
      const seenHeadings = body
        .split("\n")
        .filter((line) => /^## /.test(line))
        .map((line) => line.slice(3))
        .filter((heading) => requiredHeadings.includes(heading));
      if (seenHeadings.join(",") !== requiredHeadings.join(",")) {
        fail(entry.path + ": required sections out of order: " + seenHeadings.join(", "));
      }
      const allHeadings = body
        .split("\n")
        .filter((line) => /^## /.test(line))
        .map((line) => line.slice(3));
      const modesAt = allHeadings.indexOf("Modes");
      const gatesAt = allHeadings.indexOf("Quality gates");
      for (const heading of allHeadings) {
        if (requiredHeadings.includes(heading) || heading === "References") continue;
        const at = allHeadings.indexOf(heading);
        if (at < modesAt || at > gatesAt) {
          fail(entry.path + ": domain section must sit between Modes and Quality gates: " + heading);
        }
      }
      const contract = sectionBody(body, "Contract");
      if (contract) {
        const bullets = contract.filter((line) => line.startsWith("- "));
        if (bullets.length > 7) fail(entry.path + ": Contract has " + bullets.length + " bullets; limit is 7");
        const values = new Map<string, string>();
        for (const line of bullets) {
          const content = line.slice(2);
          const colon = content.indexOf(":");
          if (colon <= 0 || !content.slice(colon + 1).trim()) {
            fail(entry.path + ": Contract bullet must have a key and value: " + content);
            continue;
          }
          values.set(content.slice(0, colon).trim(), content.slice(colon + 1).trim());
        }
        for (const key of ["Use when", "Do not use when", "Owns", "Inputs", "Outputs", "Compose with", "Gates"]) {
          if (!values.has(key)) fail(entry.path + ": Contract missing bullet: " + key);
        }
        const named = new Set<string>();
        for (const match of (values.get("Compose with") ?? "").matchAll(/`([a-z0-9-]+)`/g)) {
          const id = match[1];
          if (id === undefined) continue;
          if (id === entry.id) {
            fail(entry.path + ": Compose with references itself");
            continue;
          }
          if (!canonical.has(id)) {
            fail(entry.path + ": Compose with names unknown canonical Skill " + id);
            continue;
          }
          named.add(id);
        }
        const declared = new Set<string>(entry.composes || []);
        const missing = [...named].filter((id) => !declared.has(id)).sort();
        const extra = [...declared].filter((id) => !named.has(id)).sort();
        if (missing.length) fail(entry.path + ": composes is missing " + missing.join(", "));
        if (extra.length) fail(entry.path + ": composes has undeclared " + extra.join(", "));
      }

      const referenceLines = sectionBody(body, "References") || [];
      for (const line of referenceLines) {
        for (const match of line.matchAll(/`([^`]+\.md)`/g)) {
          const target = match[1];
          if (target === undefined) continue;
          if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/")) continue;
          const resolved = path.resolve(path.dirname(file), target);
          if (!resolved.startsWith(root + path.sep)) {
            fail(entry.path + ": reference path escapes repository: " + target);
            continue;
          }
          const found = await stat(resolved).then(() => true).catch(() => false);
          if (!found) fail(entry.path + ": broken reference path: " + target);
        }
      }
      if (entry.modes.length !== new Set(entry.modes).size) fail(entry.id + ": duplicate mode");
      if (!entry.role) fail(entry.id + ": role is required");
    }

    await scanLinks(file, text);
  }

  let readme = "";
  try {
    readme = (await readFile(readmePath, "utf8")).replace(/\r\n/g, "\n");
  } catch {
    fail("README.md: missing");
  }
  if (readme) {
    await scanLinks(readmePath, readme);
    const catalogBlock = readme.split("<!-- SKILL-CATALOG:START -->")[1]?.split("<!-- SKILL-CATALOG:END -->")[0];
    const aliasesBlock = readme.split("<!-- SKILL-ALIASES:START -->")[1]?.split("<!-- SKILL-ALIASES:END -->")[0];
    if (!catalogBlock) fail("README.md: missing SKILL-CATALOG block");
    if (!aliasesBlock) fail("README.md: missing SKILL-ALIASES block");
    if (catalogBlock) {
      const rows = catalogBlock
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .filter((line) => !line.startsWith("| :") && !line.startsWith("| Family"));
      if (rows.length !== catalog.modules.length) {
        fail("README catalog has " + rows.length + " rows; expected " + catalog.modules.length);
      }
      for (const skill of catalog.modules) {
        const row = rows.find((line) => line.includes("](" + skill.path + ")"));
        if (!row) {
          fail("README catalog missing row for " + skill.id + ": " + skill.path);
          continue;
        }
        const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
        const family = catalog.families[skill.family]?.label;
        if (cells[0] !== family) fail("README catalog family mismatch for " + skill.id + ": " + cells[0]);
        if (cells[1] !== "[`" + skill.id + "`](" + skill.path + ")") fail("README catalog link mismatch for " + skill.id);
        if (cells[2] !== skill.modes.join(", ")) fail("README catalog mode mismatch for " + skill.id + ": " + cells[2]);
        if (!cells[3]) fail("README catalog focus is empty for " + skill.id);
      }
      const ordered = rows
        .map((line) => catalog.modules.find((skill) => line.includes("](" + skill.path + ")"))?.id)
        .filter((id): id is string => id !== undefined);
      const expected = catalog.modules.map((skill) => skill.id);
      if (ordered.length === expected.length && ordered.join(",") !== expected.join(",")) {
        fail("README catalog order must follow skills.json: " + expected.join(", "));
      }
    }
    if (aliasesBlock) {
      const aliasRows = aliasesBlock
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .filter((line) => !line.startsWith("| :") && !line.startsWith("| Alias"));
      if (aliasRows.length !== catalog.aliases.length) {
        fail("README aliases has " + aliasRows.length + " rows; expected " + catalog.aliases.length);
      }
      for (const alias of catalog.aliases) {
        const target = canonical.get(alias.canonical);
        const row = aliasRows.find((line) => line.startsWith("| `" + alias.id + "` |"));
        if (!row) {
          fail("README aliases missing " + alias.id);
          continue;
        }
        const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
        if (!target || cells[1] !== "[`" + target.id + "`](" + target.path + ")") {
          fail("README aliases canonical link mismatch for " + alias.id);
        }
        if (cells[2] !== alias.mode) fail("README aliases mode mismatch for " + alias.id + ": " + cells[2]);
      }
    }
  }

  const templateSpecs: TemplateSpec[] = [
    { file: "bug_report.yml", dropdown: "skill" },
    { file: "new_skill.yml", dropdown: "composition" },
    { file: "skill_improvement.yml", dropdown: "skill" },
  ];
  for (const spec of templateSpecs) {
    const relativeTemplate = ".github/ISSUE_TEMPLATE/" + spec.file;
    let text = "";
    try {
      text = (await readFile(path.join(root, relativeTemplate), "utf8")).replace(/\r\n/g, "\n");
    } catch {
      fail(relativeTemplate + ": missing");
      continue;
    }
    const block = text
      .split(/\n(?=  - type: )/)
      .find((item) => new RegExp("^    id: " + spec.dropdown + "$", "m").test(item));
    const optionsText = block?.split(/\n\s+options:\s*\n/)[1]?.split(/\n\s+validations:/)[0] ?? "";
    const entries = new Set<string>(
      optionsText
        .split("\n")
        .map((line) => /^\s{8}- (.+)$/.exec(line)?.[1])
        .filter((value): value is string => value !== undefined),
    );
    if (!block) fail(relativeTemplate + ": missing dropdown " + spec.dropdown);
    for (const skill of catalog.modules) {
      if (!entries.has(skill.id)) {
        fail(relativeTemplate + ": missing canonical Skill option " + skill.id);
      }
    }
  }

  for (const name of ["SKILL-SYSTEM.md", "design-intelligence.md", "THIRD_PARTY_NOTICES.md", "DESIGN.md"]) {
    const file = path.join(root, name);
    try {
      await scanLinks(file, await readFile(file, "utf8"));
    } catch {
      fail(name + ": missing");
    }
  }

  for (const skill of catalog.modules) {
    const refDir = path.join(root, skill.id, "references");
    const hasRefs = await stat(refDir).then(() => true).catch(() => false);
    if (!hasRefs) continue;
    const text = texts.get(skill.path) ?? "";
    if (!text) continue;
    const { body } = parseFrontmatter(text, skill.path);
    if (!hasSection(body, "References")) fail(skill.path + ": references directory exists but section is missing");
    for (const reference of files.filter((item) => item.startsWith(refDir + path.sep) && item.endsWith(".md"))) {
      await scanLinks(reference, await readFile(reference, "utf8"));
    }
  }

  for (const file of files.filter((item) => item.endsWith(".md"))) {
    await scanLinks(file, await readFile(file, "utf8"));
  }

  finish();
}

function finish(): void {
  if (errors.length) {
    console.error("Skill validation failed with " + errors.length + " issue(s):");
    for (const error of errors) console.error("- " + error);
    process.exitCode = 1;
    return;
  }
  const catalog = registry;
  if (catalog === null) {
    console.error("Skill validation failed: skills.json was not loaded.");
    process.exitCode = 1;
    return;
  }
  console.log(
    "Skill validation passed: " +
      catalog.modules.length +
      " internal modules, " +
      catalog.aliases.length +
      " aliases, " +
      Object.keys(catalog.families).length +
      " families.",
  );
}

await main();
