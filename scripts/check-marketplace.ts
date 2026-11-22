import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marketplaceManifest } from "./package-plugin.ts";
import { isRecord, readJson } from "./runtime.ts";
import type { PluginCatalog, SkillCatalog } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const exists = (file: string): Promise<boolean> =>
  stat(file).then(() => true).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  });

const committed = path.join(root, "dist/azskills-marketplace");
const catalog = await readJson<PluginCatalog>(path.join(root, "catalog/plugins.json"));
const registry = await readJson<SkillCatalog>(path.join(root, "skills.json"));
const manifest: unknown = JSON.parse(await readFile(path.join(root, ".agents/plugins/marketplace.json"), "utf8"));
const expected = marketplaceManifest(catalog, "dist/azskills-marketplace");
if (JSON.stringify(manifest) !== JSON.stringify(expected)) {
  throw new Error("Repository marketplace manifest is stale; run node scripts/package-plugin.ts --refresh");
}

const iconFingerprints = new Map<string, string>();

for (const entry of catalog.plugins) {
  const pluginRoot = path.join(committed, "plugins", entry.id);
  const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
  const checks = [manifestPath, path.join(pluginRoot, "skills", entry.id, "SKILL.md")];
  if (entry.hooks !== null) checks.push(path.join(pluginRoot, entry.hooks));
  for (const file of checks) {
    if (!await exists(file)) throw new Error("Missing marketplace file: " + file);
  }
  const pluginManifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!isRecord(pluginManifest)) {
    throw new Error(entry.id + ": marketplace plugin manifest must be an object");
  }
  if (pluginManifest.name !== entry.id) {
    throw new Error(entry.id + ": marketplace plugin manifest name must match the catalog id");
  }
  if (pluginManifest.version !== registry.version) {
    throw new Error(entry.id + ": marketplace plugin version is stale: " + String(pluginManifest.version));
  }
  const ui = isRecord(pluginManifest.interface) ? pluginManifest.interface : null;
  const composerIcon = ui?.composerIcon;
  if (typeof composerIcon !== "string" || composerIcon.length === 0) {
    throw new Error(entry.id + ": marketplace plugin manifest is missing interface.composerIcon");
  }
  const iconPath = path.resolve(pluginRoot, composerIcon);
  if (!iconPath.startsWith(pluginRoot + path.sep)) {
    throw new Error(entry.id + ": marketplace icon escapes the plugin directory: " + composerIcon);
  }
  if (!await exists(iconPath)) throw new Error(entry.id + ": marketplace icon is missing: " + composerIcon);
  const fingerprint = createHash("sha256").update(await readFile(iconPath)).digest("hex");
  const owner = iconFingerprints.get(fingerprint);
  if (owner !== undefined) {
    throw new Error(entry.id + ": marketplace icon duplicates the icon of " + owner);
  }
  iconFingerprints.set(fingerprint, entry.id);
}

console.log("Repository marketplace passed: " + catalog.plugins.length + " independent plugins with unique icons are publishable.");
