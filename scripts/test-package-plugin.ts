import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlugin, marketplaceManifest, packageMarketplace, publishRepositoryMarketplace } from "./package-plugin.ts";
import { errorCode, readJson } from "./runtime.ts";
import { writeZip } from "./zip-bundle.ts";
import type { PluginCatalog, SkillCatalog } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(path.join(tmpdir(), "azskills-package-"));
const exists = async (file: string): Promise<boolean> =>
  stat(file).then(() => true).catch((error: unknown) => {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  });

const fileBytes = async (file: string): Promise<Uint8Array> => readFile(file);
const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(file)));
    else if (entry.isFile()) files.push(file);
    else throw new Error("Unexpected marketplace entry: " + file);
  }
  return files.sort();
};

try {
  const catalog = await readJson<PluginCatalog>(path.join(root, "catalog/plugins.json"));
  const registry = await readJson<SkillCatalog>(path.join(root, "skills.json"));
  const built = await packageMarketplace(root, path.join(temp, "marketplace"));

  const committedMarketplace = path.join(root, "dist/azskills-marketplace");
  const builtFiles = await listFiles(built.marketplace);
  const committedFiles = await listFiles(committedMarketplace);
  assert.deepEqual(
    builtFiles.map((file) => path.relative(built.marketplace, file)),
    committedFiles.map((file) => path.relative(committedMarketplace, file)),
    "Committed marketplace file list must match a fresh build",
  );
  for (const file of builtFiles) {
    const relative = path.relative(built.marketplace, file);
    assert.deepEqual(
      await fileBytes(file),
      await fileBytes(path.join(committedMarketplace, relative)),
      "Committed marketplace file must match a fresh build: " + relative,
    );
  }

  assert.equal(built.plugins.length, catalog.plugins.length);
  assert.equal(built.plugins.length, 18);
  assert.equal(registry.modules.length, 16);

  const manifest = JSON.parse(await readFile(path.join(built.marketplace, ".agents/plugins/marketplace.json"), "utf8")) as {
    name: string;
    plugins: { name: string; source: { path: string } }[];
  };
  assert.equal(manifest.name, "azskills-local");
  assert.deepEqual(manifest.plugins.map((entry) => entry.name), catalog.plugins.map((entry) => entry.id));
  for (const entry of manifest.plugins) {
    assert.equal(entry.source.path, "./plugins/" + entry.name);
    assert.equal(await exists(path.join(built.marketplace, entry.source.path, ".codex-plugin/plugin.json")), true);
  }

  for (const plugin of built.plugins) {
    const pluginRoot = plugin.directory;
    const pluginManifest = JSON.parse(await readFile(path.join(pluginRoot, ".codex-plugin/plugin.json"), "utf8")) as {
      name: string;
      version: string;
      hooks?: string;
    };
    assert.equal(pluginManifest.name, plugin.id);
    assert.equal(pluginManifest.version, registry.version);
    const entry = catalog.plugins.find((candidate) => candidate.id === plugin.id);
    assert.ok(entry);
    if (entry.kind === "module") {
      const skill = path.join(pluginRoot, "skills", plugin.id, "SKILL.md");
      assert.equal(await exists(skill), true);
      const text = await readFile(skill, "utf8");
      assert.match(text, new RegExp("^---\\nname: " + plugin.id + "\\n", "m"));
      assert.ok(text.includes("../../references/modules/" + plugin.id + ".md"));
      assert.equal(await exists(path.join(pluginRoot, "references/modules", plugin.id + ".md")), true);
      if (plugin.id === "ui-design") assert.equal(await exists(path.join(pluginRoot, "SKILL-SYSTEM.md")), true);
      if (plugin.id === "ui-design") {
        assert.equal(await exists(path.join(pluginRoot, "ui-motion/references/review.md")), true);
        assert.equal(await exists(path.join(pluginRoot, "ui-motion/references/svg-animation.md")), true);
      }
      if (plugin.id === "document-writing") {
        assert.equal(await exists(path.join(pluginRoot, "references/modules/readme-craft.md")), true);
        assert.equal(await exists(path.join(pluginRoot, "references/modules/steam-mod-page.md")), true);
      }
    } else {
      assert.equal(await exists(path.join(pluginRoot, "hooks/stop-hook.ts")), true);
      assert.equal(await exists(path.join(pluginRoot, "lib/hook-runtime.ts")), true);
      assert.equal(await exists(path.join(pluginRoot, "skills", plugin.id, "SKILL.md")), true);
    }
    if (entry.hooks !== null) {
      assert.equal(await exists(path.join(pluginRoot, entry.hooks)), true);
      assert.equal(pluginManifest.hooks, "./" + entry.hooks);
    }
    assert.equal(await exists(path.join(pluginRoot, "codex-plugin/hooks/session-start.ts")), false, "Routing hook must not ship");
    assert.equal(await exists(path.join(pluginRoot, "codex-plugin/hooks/hooks.json")), false, "Monolithic hook manifest must not ship");
    assert.equal(await exists(path.join(pluginRoot, "skills/azskills")), false, "Single azskills entry must not ship");
    const icon = entry.kind === "module" ? "codex-plugin/assets/icon.svg" : "assets/icon.svg";
    assert.equal(await exists(path.join(pluginRoot, icon)), true);
  }

  const taste = built.plugins.find((plugin) => plugin.id === "taste");
  assert.ok(taste);
  assert.equal(await exists(path.join(taste.directory, "codex-plugin/taste/hooks/steer.ts")), true);
  assert.equal(await exists(path.join(taste.directory, "scripts/runtime.ts")), true);
  const godot = built.plugins.find((plugin) => plugin.id === "godot-3-dev");
  assert.ok(godot);
  assert.equal(await exists(path.join(godot.directory, "codex-plugin/hooks/godot3-guard.ts")), true);
  assert.equal(await exists(path.join(godot.directory, "godot-3-dev/scripts/check-godot-3x.ts")), true);

  const zipRoot = path.join(temp, "zips");
  for (const plugin of built.plugins) {
    const archive = path.join(zipRoot, plugin.id + ".zip");
    const result = await writeZip(plugin.directory, archive);
    assert.ok(result.files > 0);
    const signature = await readFile(archive);
    assert.deepEqual([...signature.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  }
  const archives = await readdir(zipRoot);
  assert.equal(archives.length, 18);

  const skillView = path.join(temp, "skill-view");
  const skillBuild = await buildPlugin(root, "ui-design", skillView, "skill");
  assert.equal(skillBuild.skillEntry, path.join(skillView, "SKILL.md"));
  const skillText = await readFile(path.join(skillView, "SKILL.md"), "utf8");
  assert.ok(skillText.includes("(references/modules/ui-design.md)"));
  assert.equal(await exists(path.join(skillView, ".codex-plugin")), false);
  assert.equal(await exists(path.join(skillView, "references/modules/ui-design.md")), true);
  assert.equal(await exists(path.join(skillView, "SKILL-SYSTEM.md")), true);

  await assert.rejects(buildPlugin(root, "no-think-tags", path.join(temp, "standalone-skill"), "skill"), /install as Codex plugins/);
  await assert.rejects(buildPlugin(root, "unknown-plugin", path.join(temp, "unknown")), /Unknown plugin/);

  const repositoryManifest = await publishRepositoryMarketplace(root, path.join(root, "dist/azskills-marketplace"));
  assert.equal(repositoryManifest, path.join(root, ".agents/plugins/marketplace.json"));
  const committedManifest = JSON.parse(await readFile(repositoryManifest, "utf8")) as Record<string, unknown>;
  const committedExpected = marketplaceManifest(catalog, "dist/azskills-marketplace");
  assert.deepEqual(committedManifest, committedExpected);
  await assert.rejects(publishRepositoryMarketplace(root, temp), /inside the repository/);

  console.log("Plugin packaging tests passed: 18 self-contained plugins, marketplace entries, hook assets, skill views, deterministic archives, repository manifest, and no routing hook.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
