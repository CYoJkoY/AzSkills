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

const root = process.cwd();
const registryPath = path.join(root, "skills.json");
const readmePath = path.join(root, "README.md");
const errors = [];
const checkedFiles = new Set();
let registry;

const fail = (message) => errors.push(message);

function parseFrontmatter(text, file) {
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
  const data = {};
  for (let index = 0; index < raw.length; index += 1) {
    const line = raw[index];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) {
      fail(file + ": invalid frontmatter line: " + line);
      continue;
    }
    const key = match[1];
    const value = match[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (value.startsWith("\"") && value.endsWith("\"")) {
      data[key] = value.slice(1, -1);
    } else if (/^[>|][+-]?\d*$/.test(value)) {
      const parts = [];
      while (index + 1 < raw.length) {
        const next = raw[index + 1];
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

function sectionBody(body, heading) {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => line === "## " + heading);
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  return lines.slice(start + 1, end === -1 ? lines.length : end);
}

function hasSection(body, heading) {
  return body.split("\n").includes("## " + heading);
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(full)));
    else output.push(full);
  }
  return output;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function asciiOnly(text) {
  return !/[^\x00-\x7F]/.test(text);
}

function resolveTarget(file, target) {
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
    decoded = decodeURIComponent(trimmed.split("#")[0]);
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

async function assertTargetExists(file, target) {
  const hit = resolveTarget(file, target);
  if (!hit) return;
  try {
    await stat(hit.resolved);
  } catch {
    fail(relative(file) + ": broken local link: " + hit.target);
  }
}

async function checkLinks(file, text) {
  const scannable = text.replace(/```[\s\S]*?```/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const markdown = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of scannable.replace(/`[^`\n]*`/g, "").matchAll(markdown)) {
    await assertTargetExists(file, match[1]);
  }
  const assetText = scannable.replace(/`[^`\n]*`/g, "");
  const assets = /<(?:img|source)\b[^>]*?\b(src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of assetText.matchAll(assets)) {
    const value = match[2] ?? match[3] ?? "";
    if (match[1].toLowerCase() === "srcset") {
      for (const candidate of value.split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) await assertTargetExists(file, url);
      }
    } else {
      await assertTargetExists(file, value);
    }
  }
}

async function scanLinks(file, text) {
  if (checkedFiles.has(file)) return;
  checkedFiles.add(file);
  await checkLinks(file, text);
}

async function main() {
  try {
    registry = JSON.parse(await readFile(registryPath, "utf8"));
  } catch (error) {
    console.error("Cannot read skills.json: " + error.message);
    process.exit(1);
  }

  if (registry.schemaVersion !== 1) fail("skills.json: schemaVersion must be 1");
  if (!registry.families || typeof registry.families !== "object") {
    fail("skills.json: missing families");
  }
  if (!Array.isArray(registry.skills)) fail("skills.json: skills must be an array");
  if (!Array.isArray(registry.aliases)) fail("skills.json: aliases must be an array");
  if (errors.length) return finish();

  const checkRegistryAscii = (value, at) => {
    if (typeof value === "string" && !asciiOnly(value)) fail("skills.json: non-ASCII value at " + at);
    if (Array.isArray(value)) value.forEach((item, index) => checkRegistryAscii(item, at + "[" + index + "]"));
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) checkRegistryAscii(child, at + "." + key);
    }
  };
  checkRegistryAscii(registry, "skills");

  const familyNames = Object.keys(registry.families);
  const canonical = new Map();
  const allPathEntries = new Map();
  const allIds = new Set();
  const texts = new Map();

  for (const skill of registry.skills) {
    if (skill.status !== "canonical") fail(skill.id + ": canonical entry must use status canonical");
    if (!skill.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.id)) {
      fail("skills.json: invalid canonical id: " + skill.id);
    }
    if (allIds.has(skill.id)) fail("skills.json: duplicate id: " + skill.id);
    allIds.add(skill.id);
    if (!familyNames.includes(skill.family)) fail(skill.id + ": unknown family " + skill.family);
    if (!Array.isArray(skill.modes) || skill.modes.length === 0) {
      fail(skill.id + ": at least one mode is required");
    }
    if (skill.path !== skill.id + "/SKILL.md") {
      fail(skill.id + ": canonical path must be <id>/SKILL.md");
    }
    canonical.set(skill.id, skill);
    allPathEntries.set(skill.path, skill);
  }

  for (const skill of registry.skills) {
    for (const target of skill.composes || []) {
      if (!canonical.has(target)) fail(skill.id + ": composes unknown canonical Skill " + target);
    }
  }

  for (const alias of registry.aliases) {
    if (alias.status !== "alias") fail(alias.id + ": alias entry must use status alias");
    if (allIds.has(alias.id)) fail("skills.json: duplicate id: " + alias.id);
    allIds.add(alias.id);
    if (!canonical.has(alias.canonical)) {
      fail(alias.id + ": unknown canonical target " + alias.canonical);
    } else if (!canonical.get(alias.canonical).modes.includes(alias.mode)) {
      fail(alias.id + ": mode " + alias.mode + " is not declared by " + alias.canonical);
    }
    if (alias.path !== alias.id + "/SKILL.md") {
      fail(alias.id + ": alias path must be <id>/SKILL.md");
    }
    allPathEntries.set(alias.path, alias);
  }

  const files = await walk(root);
  const skillFiles = files.filter((file) => path.basename(file) === "SKILL.md");
  const foundPaths = new Set(skillFiles.map(relative));

  for (const [entryPath, entry] of allPathEntries) {
    if (!foundPaths.has(entryPath)) fail(entry.id + ": registered file is missing: " + entryPath);
  }
  for (const found of foundPaths) {
    if (!allPathEntries.has(found)) fail(found + ": unregistered SKILL.md");
  }

  for (const entry of [...registry.skills, ...registry.aliases]) {
    const file = path.join(root, entry.path);
    let text;
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
      if (data.description.length > 320) fail(entry.path + ": description exceeds 320 characters");
      if (!asciiOnly(data.description)) fail(entry.path + ": description must be ASCII");
    }
    if (!asciiOnly(text)) fail(entry.path + ": contract must be ASCII");

    if (entry.status === "canonical") {
      if (lineCount > 280) fail(entry.path + ": " + lineCount + " lines exceeds 280");
      if (data.status !== "canonical") fail(entry.path + ": status must be canonical");
      if (data.family !== entry.family) fail(entry.path + ": family must be " + entry.family);
      const modes = Array.isArray(data.modes) ? data.modes : [];
      if (modes.join(",") !== entry.modes.join(",")) {
        fail(entry.path + ": modes must match registry order: " + entry.modes.join(", "));
      }
      if (!data.version) fail(entry.path + ": version is required");
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
        const values = new Map();
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
        const named = new Set();
        for (const match of (values.get("Compose with") || "").matchAll(/`([a-z0-9-]+)`/g)) {
          const id = match[1];
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
        const declared = new Set(entry.composes || []);
        const missing = [...named].filter((id) => !declared.has(id)).sort();
        const extra = [...declared].filter((id) => !named.has(id)).sort();
        if (missing.length) fail(entry.path + ": composes is missing " + missing.join(", "));
        if (extra.length) fail(entry.path + ": composes has undeclared " + extra.join(", "));
      }

      const referenceLines = sectionBody(body, "References") || [];
      for (const line of referenceLines) {
        for (const match of line.matchAll(/`([^`]+\.md)`/g)) {
          const target = match[1];
          if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("/")) continue;
          const resolved = path.resolve(path.dirname(file), target);
          if (!resolved.startsWith(root + path.sep)) {
            fail(entry.path + ": reference path escapes repository: " + target);
            continue;
          }
          const exists = await stat(resolved).then(() => true).catch(() => false);
          if (!exists) fail(entry.path + ": broken reference path: " + target);
        }
      }
      if (entry.modes.length !== new Set(entry.modes).size) fail(entry.id + ": duplicate mode");
      if (!entry.role) fail(entry.id + ": role is required");
    } else {
      if (lineCount > 24) fail(entry.path + ": alias has " + lineCount + " lines; limit is 24");
      if (data.status !== "alias") fail(entry.path + ": status must be alias");
      if (data.canonical !== entry.canonical) fail(entry.path + ": canonical must be " + entry.canonical);
      if (data.mode !== entry.mode) fail(entry.path + ": mode must be " + entry.mode);
      const aliasSections = body.split("\n").filter((line) => /^## /.test(line));
      if (aliasSections.length) {
        fail(entry.path + ": alias must not define level-2 sections: " + aliasSections.join(", "));
      }
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
    const catalog = readme.split("<!-- SKILL-CATALOG:START -->")[1]?.split("<!-- SKILL-CATALOG:END -->")[0];
    const aliases = readme.split("<!-- SKILL-ALIASES:START -->")[1]?.split("<!-- SKILL-ALIASES:END -->")[0];
    if (!catalog) fail("README.md: missing SKILL-CATALOG block");
    if (!aliases) fail("README.md: missing SKILL-ALIASES block");
    if (catalog) {
      const rows = catalog
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .filter((line) => !line.startsWith("| :") && !line.startsWith("| Family"));
      if (rows.length !== registry.skills.length) {
        fail("README catalog has " + rows.length + " rows; expected " + registry.skills.length);
      }
      for (const skill of registry.skills) {
        const row = rows.find((line) => line.includes("](" + skill.path + ")"));
        if (!row) {
          fail("README catalog missing row for " + skill.id + ": " + skill.path);
          continue;
        }
        const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
        const family = registry.families[skill.family]?.label;
        if (cells[0] !== family) fail("README catalog family mismatch for " + skill.id + ": " + cells[0]);
        if (cells[1] !== "[`" + skill.id + "`](" + skill.path + ")") fail("README catalog link mismatch for " + skill.id);
        if (cells[2] !== skill.modes.join(", ")) fail("README catalog mode mismatch for " + skill.id + ": " + cells[2]);
        if (!cells[3]) fail("README catalog focus is empty for " + skill.id);
      }
      const ordered = rows
        .map((line) => registry.skills.find((skill) => line.includes("](" + skill.path + ")"))?.id)
        .filter(Boolean);
      const expected = registry.skills.map((skill) => skill.id);
      if (ordered.length === expected.length && ordered.join(",") !== expected.join(",")) {
        fail("README catalog order must follow skills.json: " + expected.join(", "));
      }
    }
    if (aliases) {
      const aliasRows = aliases
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .filter((line) => !line.startsWith("| :") && !line.startsWith("| Alias"));
      if (aliasRows.length !== registry.aliases.length) {
        fail("README aliases has " + aliasRows.length + " rows; expected " + registry.aliases.length);
      }
      for (const alias of registry.aliases) {
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

  const templateSpecs = [
    { file: "bug_report.yml", dropdown: "skill" },
    { file: "new_skill.yml", dropdown: "composition" },
    { file: "skill_improvement.yml", dropdown: "skill" },
  ];
  for (const spec of templateSpecs) {
    const template = spec.file;
    const relativeTemplate = ".github/ISSUE_TEMPLATE/" + template;
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
    const optionsText = block?.split(/\n\s+options:\s*\n/)[1]?.split(/\n\s+validations:/)[0] || "";
    const entries = new Set(
      optionsText
        .split("\n")
        .map((line) => /^\s{8}- (.+)$/.exec(line)?.[1])
        .filter(Boolean),
    );
    if (!block) fail(relativeTemplate + ": missing dropdown " + spec.dropdown);
    for (const skill of registry.skills) {
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

  for (const skill of registry.skills) {
    const refDir = path.join(root, skill.id, "references");
    const hasRefs = await stat(refDir).then(() => true).catch(() => false);
    if (!hasRefs) continue;
    const text = texts.get(skill.path) || "";
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

function finish() {
  if (errors.length) {
    console.error("Skill validation failed with " + errors.length + " issue(s):");
    for (const error of errors) console.error("- " + error);
    process.exitCode = 1;
    return;
  }
  console.log(
    "Skill validation passed: " +
      registry.skills.length +
      " canonical Skills, " +
      registry.aliases.length +
      " aliases, " +
      Object.keys(registry.families).length +
      " families.",
  );
}

await main();
