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
const hexColor = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value);

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
    (value.mcpServers === undefined || typeof value.mcpServers === "string") &&
    (value.modules === undefined || (Array.isArray(value.modules) && value.modules.every((module) => typeof module === "string" && kebab(module)))) &&
    (value.source === undefined || typeof value.source === "string") &&
    (value.description === undefined || typeof value.description === "string") &&
    (value.icon === undefined || typeof value.icon === "string") &&
    (value.brandColor === undefined || typeof value.brandColor === "string") &&
    value.module === undefined
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
  const brandColors = new Map<string, string>();
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
    if (plugin.brandColor !== undefined) {
      if (!hexColor(plugin.brandColor)) fail(plugin.id + ": brandColor must be a #RRGGBB value");
      const owner = brandColors.get(plugin.brandColor.toLowerCase());
      if (owner !== undefined) fail("catalog: brandColor " + plugin.brandColor + " is shared by " + owner + " and " + plugin.id);
      brandColors.set(plugin.brandColor.toLowerCase(), plugin.id);
    }
    for (const extra of plugin.extra) {
      if (!(await exists(path.join(root, extra)))) fail(plugin.id + ": extra path is missing: " + extra);
      if (path.isAbsolute(extra) || extra.split(/[\\/]/).includes("..")) fail(plugin.id + ": extra path must stay inside the repository: " + extra);
    }
    if (plugin.mcpServers !== undefined) {
      if (path.isAbsolute(plugin.mcpServers) || plugin.mcpServers.split(/[\\/]/).includes("..")) {
        fail(plugin.id + ": mcpServers path must stay inside the repository: " + plugin.mcpServers);
      } else if (!(await exists(path.join(root, plugin.mcpServers)))) {
        fail(plugin.id + ": mcpServers manifest is missing: " + plugin.mcpServers);
      }
    }
    if (plugin.kind === "module") {
      if (plugin.modules === undefined || plugin.modules.length === 0) fail(plugin.id + ": workflow plugins must declare at least one canonical module");
      if (plugin.description === undefined) {
        fail(plugin.id + ": workflow plugins must declare a description");
      } else if (plugin.description.length > 320) {
        fail(plugin.id + ": description exceeds 320 characters");
      } else if (!asciiOnly(plugin.description)) {
        fail(plugin.id + ": description must be ASCII");
      }
      if (plugin.icon === undefined) {
        fail(plugin.id + ": workflow plugins must declare an icon");
      } else {
        const icon = path.join(root, plugin.icon);
        if (!(await exists(icon))) {
          fail(plugin.id + ": icon file is missing: " + plugin.icon);
        } else if (plugin.brandColor !== undefined) {
          const svg = await readFile(icon, "utf8");
          if (!svg.toLowerCase().includes(plugin.brandColor.toLowerCase())) {
            fail(plugin.id + ": icon must use its brandColor " + plugin.brandColor);
          }
        }
      }
      if (plugin.brandColor === undefined) fail(plugin.id + ": workflow plugins must declare a brandColor");
      for (const moduleId of plugin.modules ?? []) {
        if (!registry.modules.some((module) => module.id === moduleId)) fail(plugin.id + ": module is not registered: " + moduleId);
        if (moduleOwners.has(moduleId)) fail("catalog: module " + moduleId + " is claimed by both " + moduleOwners.get(moduleId) + " and " + plugin.id);
        moduleOwners.set(moduleId, plugin.id);
      }
      if (plugin.source !== undefined) fail(plugin.id + ": workflow plugins are built from module contracts, not a source directory");
      if (moduleEntries.has(plugin.id)) fail(plugin.id + ": duplicate module plugin");
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
    if (plugin.brandColor !== undefined) {
      const manifestPath = path.join(source, ".codex-plugin/plugin.json");
      if (await exists(manifestPath)) {
        const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { interface?: { brandColor?: string } };
        if (manifest.interface?.brandColor?.toLowerCase() !== plugin.brandColor.toLowerCase()) {
          fail(plugin.id + ": catalog brandColor must match .codex-plugin/plugin.json interface.brandColor");
        }
      }
    }
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
