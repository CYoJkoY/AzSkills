/*
 * Builds every catalog plugin as a self-contained Codex plugin directory.
 *
 * Module plugins are derived from references/modules/<id>.md plus the local
 * reference closure, keeping repository-relative paths so no contract text is
 * rewritten. Standalone plugins under plugins/<id>/ are copied as authored.
 */

import { cp, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";
import { collectClosure, filesUnder, materialize, validateBundle } from "./link-bundle.ts";
import { writeZip } from "./zip-bundle.ts";
import { errorCode, errorMessage, isRecord, readJson } from "./runtime.ts";
import type { PluginCatalog, PluginCatalogEntry, SkillCatalog, SkillModule } from "./types.ts";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export interface PluginBuild {
  readonly id: string;
  readonly kind: "module" | "standalone";
  readonly directory: string;
  readonly skillEntry: string;
  readonly hooks: string | null;
}

interface ModuleContract {
  readonly name: string;
  readonly description: string;
}

const asciiOnly = (text: string): boolean => !/[^\x00-\x7F]/.test(text);

function parseFrontmatter(text: string): Record<string, string> {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return {};
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return {};
  const data: Record<string, string> = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    if (key === undefined) continue;
    data[key] = (match[2] ?? "").trim().replace(/^["']|["']$/g, "");
  }
  return data;
}

async function readContract(repoRoot: string, module: SkillModule): Promise<ModuleContract> {
  const text = await readFile(path.join(repoRoot, module.path), "utf8");
  const data = parseFrontmatter(text);
  const name = data.name ?? module.id;
  const description = data.description ?? module.role;
  if (name !== module.id) throw new Error(module.id + ": module contract name must match the module id");
  if (description.length > 320) throw new Error(module.id + ": module description exceeds 320 characters");
  if (!asciiOnly(description)) throw new Error(module.id + ": module description must be ASCII");
  return { name, description };
}

function displayName(id: string): string {
  return id
    .split("-")
    .map((part) => (part === "3d" ? "3D" : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function pointer(contractPath: string, title: string, description: string): string {
  return [
    "---",
    "name: " + title,
    "description: " + description,
    "---",
    "",
    "# " + displayName(title),
    "",
    "This plugin ships one AzSkills workflow. Read the canonical contract before acting:",
    "",
    "- [Contract](" + contractPath + ")",
    "",
    "Load only the supporting references the task needs. The plugin is self-contained;",
    "do not look for a shared AzSkills entry or for other plugins in the catalog.",
    "",
  ].join("\n");
}

export function pluginManifest(
  entry: PluginCatalogEntry,
  version: string,
  description: string,
  modes: readonly string[],
): Record<string, unknown> {
  const hooks = entry.hooks === null ? {} : { hooks: entry.hooks.startsWith("./") ? entry.hooks : "./" + entry.hooks };
  return {
    name: entry.id,
    version,
    description,
    license: "MIT",
    keywords: [...entry.id.split("-"), "azskills", "workflow"],
    skills: "./skills/",
    ...hooks,
    interface: {
      displayName: displayName(entry.id),
      shortDescription: description,
      longDescription: description + (modes.length > 0 ? " Modes: " + modes.join(", ") + "." : ""),
      developerName: "AzSkills",
      category: entry.category,
      capabilities: entry.capabilities,
      brandColor: "#A6382A",
      composerIcon: "./codex-plugin/assets/icon.svg",
      logo: "./codex-plugin/assets/icon.svg",
    },
  };
}

async function buildModule(
  repoRoot: string,
  entry: PluginCatalogEntry,
  registry: SkillCatalog,
  destination: string,
  view: "plugin" | "skill",
): Promise<PluginBuild> {
  const module = registry.modules.find((candidate) => candidate.id === entry.module);
  if (module === undefined) throw new Error(entry.id + ": no matching canonical module");
  const contract = await readContract(repoRoot, module);
  const contractPath = view === "plugin" ? "../../" + module.path : module.path;
  const bundle = await collectClosure(repoRoot, [module.path, ...entry.extra]);
  await materialize(bundle, destination);
  const skillEntry = view === "plugin"
    ? path.join(destination, "skills", entry.id, "SKILL.md")
    : path.join(destination, "SKILL.md");
  await mkdir(path.dirname(skillEntry), { recursive: true });
  await writeFile(skillEntry, pointer(contractPath, entry.id, contract.description), "utf8");
  if (view === "plugin") {
    const manifest = pluginManifest(entry, registry.version, contract.description, module.modes);
    await mkdir(path.join(destination, ".codex-plugin"), { recursive: true });
    await writeFile(path.join(destination, ".codex-plugin/plugin.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
  await validateBundle(destination);
  return {
    id: entry.id,
    kind: "module",
    directory: destination,
    skillEntry,
    hooks: entry.hooks,
  };
}

async function buildStandalone(
  repoRoot: string,
  entry: PluginCatalogEntry,
  registry: SkillCatalog,
  destination: string,
  view: "plugin" | "skill",
): Promise<PluginBuild> {
  if (view === "skill") throw new Error(entry.id + ": standalone hook plugins install as Codex plugins, not skill entries");
  if (entry.source === undefined) throw new Error(entry.id + ": standalone plugin requires a source directory");
  const source = path.join(repoRoot, entry.source);
  for (const file of await filesUnder(source)) {
    const target = path.join(destination, path.relative(source, file));
    await mkdir(path.dirname(target), { recursive: true });
    await cp(file, target, { force: true });
  }
  const manifestPath = path.join(destination, ".codex-plugin/plugin.json");
  const raw: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!isRecord(raw) || raw.name !== entry.id) throw new Error(entry.id + ": plugin manifest name must match the catalog id");
  await writeFile(manifestPath, JSON.stringify({ ...raw, version: registry.version }, null, 2) + "\n", "utf8");
  await validateBundle(destination);
  return {
    id: entry.id,
    kind: "standalone",
    directory: destination,
    skillEntry: path.join(destination, "skills", entry.id, "SKILL.md"),
    hooks: entry.hooks,
  };
}

export async function buildPlugin(
  repoRoot: string,
  id: string,
  destination: string,
  view: "plugin" | "skill" = "plugin",
): Promise<PluginBuild> {
  const catalog = await readJson<PluginCatalog>(path.join(repoRoot, "catalog/plugins.json"));
  const registry = await readJson<SkillCatalog>(path.join(repoRoot, "skills.json"));
  const entry = catalog.plugins.find((plugin) => plugin.id === id);
  if (entry === undefined) throw new Error("Unknown plugin: " + id);
  await mkdir(destination, { recursive: true });
  return entry.kind === "module"
    ? buildModule(repoRoot, entry, registry, destination, view)
    : buildStandalone(repoRoot, entry, registry, destination, view);
}

export interface MarketplaceBuild {
  readonly marketplace: string;
  readonly plugins: PluginBuild[];
}

export function marketplaceManifest(catalog: PluginCatalog, pluginPathPrefix: string): Record<string, unknown> {
  const prefix = pluginPathPrefix.replace(/^\.?\//, "").replace(/\/$/, "");
  return {
    name: catalog.marketplace.name,
    interface: { displayName: catalog.marketplace.displayName, shortDescription: catalog.marketplace.description },
    plugins: catalog.plugins.map((entry) => ({
      name: entry.id,
      source: { source: "local", path: prefix === "" ? "./plugins/" + entry.id : "./" + prefix + "/plugins/" + entry.id },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: entry.category,
    })),
  };
}

export async function publishRepositoryMarketplace(
  repoRoot: string,
  marketplaceDirectory: string,
): Promise<string> {
  const base = path.resolve(repoRoot);
  const marketplace = path.resolve(marketplaceDirectory);
  const baseReal = await realpath(base);
  const marketplaceReal = await realpath(marketplace);
  if (marketplaceReal !== baseReal && !marketplaceReal.startsWith(baseReal + path.sep)) {
    throw new Error("Repository marketplace must be written inside the repository: " + marketplace);
  }
  const catalog = await readJson<PluginCatalog>(path.join(base, "catalog/plugins.json"));
  const relative = path.relative(base, marketplace).replace(/\\/g, "/");
  if (relative === "" || relative.startsWith("..")) {
    throw new Error("Repository marketplace must be a directory below the repository root: " + marketplace);
  }
  const manifestPath = path.join(base, ".agents/plugins/marketplace.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(marketplaceManifest(catalog, relative), null, 2) + "\n", "utf8");
  return manifestPath;
}

export async function packageMarketplace(repoRoot: string, outputDirectory: string): Promise<MarketplaceBuild> {
  const base = path.resolve(repoRoot);
  const output = path.resolve(outputDirectory);
  const catalog = await readJson<PluginCatalog>(path.join(base, "catalog/plugins.json"));
  const pluginsRoot = path.join(output, "plugins");
  await mkdir(pluginsRoot, { recursive: true });
  const plugins: PluginBuild[] = [];
  for (const entry of catalog.plugins) {
    plugins.push(await buildPlugin(base, entry.id, path.join(pluginsRoot, entry.id)));
  }
  const marketplace = marketplaceManifest(catalog, "");
  const manifestPath = path.join(output, ".agents/plugins/marketplace.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(marketplace, null, 2) + "\n", "utf8");
  return { marketplace: output, plugins };
}

export async function packagePluginArchive(
  repoRoot: string,
  id: string,
  stagingDirectory: string,
  archive: string,
): Promise<{ archive: string; files: number }> {
  const built = await buildPlugin(repoRoot, id, path.join(stagingDirectory, id), "plugin");
  return writeZip(built.directory, archive);
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const option = (key: string): string => {
    const index = args.indexOf(key);
    if (index < 0) return "";
    const result = args[index + 1];
    if (!result || result.startsWith("--")) throw new Error(key + " requires a value");
    return result;
  };
  if (args.includes("--help") || args.includes("-h")) {
    console.log([
      "Usage: node scripts/package-plugin.ts [--output <directory>] [--refresh]",
      "",
      "Builds one self-contained Codex plugin per catalog entry:",
      "  <output>/azskills-marketplace/.agents/plugins/marketplace.json",
      "  <output>/azskills-marketplace/plugins/<id>/",
      "  <output>/zips/<id>.zip (deterministic archives)",
      "  --refresh removes the target directories first",
      "  repository-local output also refreshes .agents/plugins/marketplace.json",
    ].join("\n"));
    process.exit(0);
  }
  try {
    const outputRoot = path.resolve(option("--output") || path.join(repositoryRoot, "dist"));
    const destination = path.join(outputRoot, "azskills-marketplace");
    const zipRoot = path.join(outputRoot, "zips");
    if (args.includes("--refresh")) {
      for (const target of [destination, zipRoot]) {
        await rm(target, { recursive: true, force: true });
      }
    }
    for (const target of [destination, zipRoot]) {
      const present = await stat(target).then(() => true).catch((error: unknown) => {
        if (errorCode(error) === "ENOENT") return false;
        throw error;
      });
      if (present) throw new Error("Output already exists; choose a fresh directory: " + target);
    }
    const staging = await mkdtemp(path.join(tmpdir(), "azskills-plugins-"));
    try {
      const built = await packageMarketplace(repositoryRoot, path.join(staging, "marketplace"));
      await cp(built.marketplace, destination, { recursive: true });
      await mkdir(zipRoot, { recursive: true });
      let files = 0;
      for (const plugin of built.plugins) {
        const result = await writeZip(plugin.directory, path.join(zipRoot, plugin.id + ".zip"));
        files += result.files;
      }
      console.log("Packaged " + built.plugins.length + " independent plugins into " + destination);
      console.log("Plugin archives: " + zipRoot + " (" + files + " files across " + built.plugins.length + " archives)");
    } finally {
      await rm(staging, { recursive: true, force: true });
      if (destination.startsWith(path.resolve(repositoryRoot) + path.sep)) {
        await publishRepositoryMarketplace(repositoryRoot, destination);
      }
    }
  } catch (error) {
    console.error("AzSkills packaging failed: " + errorMessage(error));
    process.exitCode = 1;
  }
}
