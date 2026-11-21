import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marketplaceManifest } from "./package-plugin.ts";
import { readJson } from "./runtime.ts";
import type { PluginCatalog } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const exists = (file: string): Promise<boolean> =>
  stat(file).then(() => true).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  });

const committed = path.join(root, "dist/azskills-marketplace");
const catalog = await readJson<PluginCatalog>(path.join(root, "catalog/plugins.json"));
const manifest = JSON.parse(await readFile(path.join(root, ".agents/plugins/marketplace.json"), "utf8")) as Record<string, unknown>;
const expected = marketplaceManifest(catalog, "dist/azskills-marketplace");
if (JSON.stringify(manifest) !== JSON.stringify(expected)) {
  throw new Error("Repository marketplace manifest is stale; run node scripts/package-plugin.ts --refresh");
}

for (const entry of catalog.plugins) {
  const pluginRoot = path.join(committed, "plugins", entry.id);
  const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
  const checks = [
    manifestPath,
    path.join(pluginRoot, ".codex-plugin", "plugin.json"),
    path.join(pluginRoot, "skills", entry.id, "SKILL.md"),
  ];
  if (entry.hooks !== null) checks.push(path.join(pluginRoot, entry.hooks));
  for (const file of checks) {
    if (!await exists(file)) throw new Error("Missing marketplace file: " + file);
  }
  const pluginManifest = JSON.parse(await readFile(manifestPath, "utf8")) as { name: string; version: string };
  if (pluginManifest.name !== entry.id) {
    throw new Error(entry.id + ": marketplace plugin manifest name must match the catalog id");
  }
}

console.log("Repository marketplace passed: " + catalog.plugins.length + " independent plugins are publishable.");
