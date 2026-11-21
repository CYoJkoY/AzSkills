#!/usr/bin/env node
/*
 * AzSkills plugin catalog validator.
 *
 * The catalog is the distribution contract: every canonical module must be
 * owned by exactly one module plugin, and every standalone plugin must carry
 * the manifest and skill entry it claims.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { errorMessage, isRecord } from "./runtime.ts";
import type { PluginCatalog, PluginCatalogEntry, SkillCatalog } from "./types.ts";

const root = process.cwd();
const asciiOnly = (text: string): boolean => !/[^\x00-\x7F]/.test(text);
const kebab = (id: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);

const errors: string[] = [];
const fail = (message: string): void => {
  errors.push(message);
};

function isPluginEntry(value: unknown): value is PluginCatalogEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.kind === "module" || value.kind === "standalone") &&
    typeof value.category === "string" &&
    Array.isArray(value.capabilities) &&
    value.capabilities.every((item) => typeof item === "string") &&
    Array.isArray(value.extra) &&
    value.extra.every((item) => typeof item === "string") &&
    (value.hooks === null || typeof value.hooks === "string") &&
    (value.module === undefined || (typeof value.module === "string" && kebab(value.module))) &&
    (value.source === undefined || typeof value.source === "string")
  );
}

async function exists(target: string): Promise<boolean> {
  return stat(target).then(() => true).catch(() => false);
}

async function main(): Promise<void> {
  let registry: SkillCatalog;
  let parsed: unknown;
  try {
    registry = JSON.parse(await readFile(path.join(root, "skills.json"), "utf8")) as SkillCatalog;
    parsed = JSON.parse(await readFile(path.join(root, "catalog/plugins.json"), "utf8"));
  } catch (error) {
    console.error("Cannot read catalog inputs: " + errorMessage(error));
    process.exit(1);
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.plugins) || !isRecord(parsed.marketplace)) {
    console.error("catalog/plugins.json: expected schemaVersion 1 with marketplace and plugins");
    process.exit(1);
  }
  const catalog = parsed as unknown as PluginCatalog;
  const marketplace = catalog.marketplace;
  for (const key of ["name", "displayName", "description"] as const) {
    if (typeof marketplace[key] !== "string" || marketplace[key].trim() === "") fail("catalog: marketplace." + key + " is required");
  }
  if (!asciiOnly(JSON.stringify(catalog))) fail("catalog: metadata must be ASCII");

  const ids = new Set<string>();
  const moduleEntries = new Map<string, PluginCatalogEntry>();
  const moduleOwners = new Map<string, string>();
  for (const plugin of catalog.plugins) {
    if (!isPluginEntry(plugin)) {
      fail("catalog: malformed plugin entry");
      continue;
    }
    if (!kebab(plugin.id)) fail("catalog: invalid plugin id " + plugin.id);
    if (ids.has(plugin.id)) fail("catalog: duplicate plugin id " + plugin.id);
    ids.add(plugin.id);
    if (plugin.capabilities.length === 0) fail(plugin.id + ": at least one capability is required");
    for (const extra of plugin.extra) {
      if (!(await exists(path.join(root, extra)))) fail(plugin.id + ": extra path is missing: " + extra);
      if (path.isAbsolute(extra) || extra.split(/[\\/]/).includes("..")) fail(plugin.id + ": extra path must stay inside the repository: " + extra);
    }
    if (plugin.kind === "module") {
      if (plugin.module === undefined) fail(plugin.id + ": module plugins must declare a canonical module");
      if (plugin.module !== undefined) {
        if (!registry.modules.some((module) => module.id === plugin.module)) {
          fail(plugin.id + ": module must reference a registered canonical module: " + plugin.module);
        }
        if (plugin.id !== plugin.module) fail(plugin.id + ": module plugin id must match its canonical module");
        if (moduleOwners.has(plugin.module)) {
          fail("catalog: module " + plugin.module + " is claimed by both " + moduleOwners.get(plugin.module) + " and " + plugin.id);
        }
        moduleOwners.set(plugin.module, plugin.id);
      }
      if (plugin.source !== undefined) fail(plugin.id + ": module plugins are built from the module contract, not from a source directory");
      if (moduleEntries.has(plugin.id)) fail(plugin.id + ": duplicate module plugin");
      for (const extra of plugin.extra) {
        if (path.isAbsolute(extra) || extra.split(/[\\/]/).includes("..")) fail(plugin.id + ": extra path must stay inside the repository: " + extra);
      }
      moduleEntries.set(plugin.id, plugin);
      continue;
    }
    if (typeof plugin.source !== "string") {
      fail(plugin.id + ": standalone plugins require a source directory");
      continue;
    }
    if (path.isAbsolute(plugin.source) || plugin.source.split(/[\\/]/).includes("..")) {
      fail(plugin.id + ": source path must stay inside the repository: " + plugin.source);
      continue;
    }
    const source = path.join(root, plugin.source);
    if (!(await exists(source))) {
      fail(plugin.id + ": source directory is missing: " + plugin.source);
      continue;
    }
    if (!(await exists(path.join(source, ".codex-plugin/plugin.json")))) fail(plugin.id + ": .codex-plugin/plugin.json is missing");
    if (!(await exists(path.join(source, "skills", plugin.id, "SKILL.md")))) fail(plugin.id + ": skills/" + plugin.id + "/SKILL.md is missing");
    if (plugin.hooks !== null && !(await exists(path.join(source, plugin.hooks)))) fail(plugin.id + ": hooks manifest is missing: " + plugin.hooks);
  }

  const modules = registry.modules.map((module) => module.id).sort();
  for (const id of modules) {
    if (!moduleOwners.has(id)) fail("catalog: module " + id + " is not owned by any plugin");
  }
  if (errors.length > 0) {
    console.error("Plugin catalog validation failed with " + errors.length + " issue(s):");
    for (const error of errors) console.error("- " + error);
    process.exitCode = 1;
    return;
  }
  const standalone = catalog.plugins.length - moduleEntries.size;
  console.log("Plugin catalog validation passed: " + moduleEntries.size + " module plugins, " + standalone + " standalone plugins.");
}

await main();
