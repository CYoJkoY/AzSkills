import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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
  assert.equal(registry.modules.length, 17);

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
      mcpServers?: string;
      interface?: { composerIcon?: string };
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
      const members = entry.modules ?? [];
      assert.ok(members.length > 0, "Module plugin must own at least one module: " + plugin.id);
      for (const member of members) {
        assert.ok(text.includes("../../references/modules/" + member + ".md"), "Router must link module " + member);
        assert.equal(await exists(path.join(pluginRoot, "references/modules", member + ".md")), true);
      }
      if (plugin.id === "design") assert.equal(await exists(path.join(pluginRoot, "SKILL-SYSTEM.md")), true);
      if (plugin.id === "design") {
        assert.equal(await exists(path.join(pluginRoot, "ui-motion/references/review.md")), true);
        assert.equal(await exists(path.join(pluginRoot, "ui-motion/references/svg-animation.md")), true);
      }
      if (plugin.id === "writing") {
        assert.equal(await exists(path.join(pluginRoot, "references/modules/readme-craft.md")), true);
        assert.equal(await exists(path.join(pluginRoot, "references/modules/steam-mod-page.md")), true);
      }
    } else {
      assert.equal(await exists(path.join(pluginRoot, "skills", plugin.id, "SKILL.md")), true);
      if (pluginManifest.mcpServers !== undefined) {
        const serverFile = path.resolve(pluginRoot, pluginManifest.mcpServers);
        assert.ok(serverFile.startsWith(pluginRoot + path.sep), "MCP manifest must stay inside the plugin");
        assert.equal(await exists(serverFile), true);
        const servers = JSON.parse(await readFile(serverFile, "utf8")) as {
          mcpServers?: Record<string, { command?: string; args?: string[] }>;
        };
        const ids = Object.keys(servers.mcpServers ?? {});
        assert.ok(ids.length > 0, "MCP manifest must declare a server: " + plugin.id);
        for (const id of ids) {
          const server = servers.mcpServers?.[id];
          assert.ok(server !== undefined && (server.command ?? "").length > 0, "MCP server needs a command: " + id);
        }
      }
      const composerIcon = pluginManifest.interface?.composerIcon;
      assert.ok(typeof composerIcon === "string" && composerIcon.length > 0, "Standalone plugin needs interface.composerIcon");
      assert.equal(await exists(path.resolve(pluginRoot, composerIcon)), true);
    }
    if (entry.hooks !== null) {
      assert.equal(await exists(path.join(pluginRoot, entry.hooks)), true);
      assert.equal(pluginManifest.hooks, "./" + entry.hooks);
      const hooksJson = JSON.parse(await readFile(path.join(pluginRoot, entry.hooks), "utf8")) as {
        hooks?: Record<string, Array<{ hooks?: Array<{ command?: string }> }>>;
      };
      const commands: string[] = [];
      for (const groups of Object.values(hooksJson.hooks ?? {})) {
        for (const group of groups) {
          for (const hook of group.hooks ?? []) {
            if (hook.command) commands.push(hook.command);
          }
        }
      }
      assert.ok(commands.length > 0, "Hook manifest must declare a command: " + entry.hooks);
      for (const command of commands) {
        const target = /\$\{PLUGIN_ROOT\}\/([^"]+)/.exec(command);
        assert.ok(target, "Hook command must resolve through PLUGIN_ROOT: " + command);
        const targetPath = target[1];
        assert.ok(targetPath, "Hook command must name a target: " + command);
        assert.equal(await exists(path.join(pluginRoot, targetPath)), true, "Hook target must ship with its plugin: " + targetPath);
      }
    }
    assert.equal(await exists(path.join(pluginRoot, "codex-plugin/hooks/session-start.ts")), false, "Routing hook must not ship");
    assert.equal(await exists(path.join(pluginRoot, "codex-plugin/hooks/hooks.json")), false, "Monolithic hook manifest must not ship");
    assert.equal(await exists(path.join(pluginRoot, "skills/azskills")), false, "Single azskills entry must not ship");
    const icon = entry.kind === "module"
      ? (entry.icon ?? "codex-plugin/assets/icon.svg")
      : (pluginManifest.interface?.composerIcon ?? "assets/icon.svg");
    assert.equal(await exists(path.join(pluginRoot, icon)), true);
  }

  assert.equal(built.plugins.some((plugin) => plugin.id === "operations"), false, "operations folds into engineering");
  const engineering = built.plugins.find((plugin) => plugin.id === "engineering");
  assert.ok(engineering);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/hooks/engineering-hooks.json")), true);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/hooks/godot3-guard.ts")), true);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/taste/hooks/steer.ts")), true);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/taste/hooks/local-tools.ts")), true);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/taste/prompts/user-steer.md")), true);
  assert.equal(await exists(path.join(engineering.directory, "codex-plugin/taste/recipe/main.md")), true);
  assert.equal(await exists(path.join(engineering.directory, "scripts/runtime.ts")), true);
  assert.equal(await exists(path.join(engineering.directory, "godot-3-dev/scripts/check-godot-3x.ts")), true);
  assert.equal(await exists(path.join(engineering.directory, "godot-3-dev/references/api-3.6.json")), true);

  const engineeringHooks = JSON.parse(
    await readFile(path.join(engineering.directory, "codex-plugin/hooks/engineering-hooks.json"), "utf8"),
  ) as { hooks: Record<string, Array<{ matcher?: string; hooks: Array<{ command: string }> }>> };
  for (const event of ["SessionStart", "UserPromptSubmit", "SubagentStart"]) {
    assert.ok(engineeringHooks.hooks[event]?.some((group) => group.hooks.some((hook) => hook.command.includes("taste/hooks/steer.ts"))), "engineering must keep the taste " + event + " steer");
  }
  assert.ok(engineeringHooks.hooks.PreToolUse?.some((group) => group.hooks.some((hook) => hook.command.includes("godot3-guard.ts"))), "engineering must keep the Godot guard");
  assert.ok(engineeringHooks.hooks.PostToolUse?.some((group) => group.hooks.some((hook) => hook.command.includes("godot3-guard.ts"))), "engineering must keep the Godot verifier");
  assert.ok(engineeringHooks.hooks.PostToolUse?.some((group) => group.matcher?.includes("wait_agent") && group.hooks.some((hook) => hook.command.includes("taste/hooks/steer.ts"))), "engineering must keep the taste agent-result steer");

  const zipRoot = path.join(temp, "zips");
  for (const plugin of built.plugins) {
    const archive = path.join(zipRoot, plugin.id + ".zip");
    const result = await writeZip(plugin.directory, archive);
    assert.ok(result.files > 0);
    const signature = await readFile(archive);
    assert.deepEqual([...signature.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  }
  const archives = await readdir(zipRoot);
  assert.equal(archives.length, catalog.plugins.length);

  const skillView = path.join(temp, "skill-view");
  const skillBuild = await buildPlugin(root, "design", skillView, "skill");
  assert.equal(skillBuild.skillEntry, path.join(skillView, "SKILL.md"));
  const skillText = await readFile(path.join(skillView, "SKILL.md"), "utf8");
  assert.ok(skillText.includes("(references/modules/ui-design.md)"));
  assert.equal(await exists(path.join(skillView, ".codex-plugin")), false);
  assert.equal(await exists(path.join(skillView, "references/modules/ui-design.md")), true);
  assert.equal(await exists(path.join(skillView, "SKILL-SYSTEM.md")), true);

  // No plugin uses the standalone kind today, but the kind stays supported, so
  // a throwaway fixture repository keeps both branches covered.
  const fixtureRoot = path.join(temp, "fixture-repo");
  const fixturePlugin = path.join(fixtureRoot, "plugins/hook-fixture");
  await mkdir(path.join(fixturePlugin, ".codex-plugin"), { recursive: true });
  await mkdir(path.join(fixtureRoot, "catalog"), { recursive: true });
  await writeFile(
    path.join(fixtureRoot, "catalog/plugins.json"),
    JSON.stringify({
      schemaVersion: catalog.schemaVersion,
      marketplace: catalog.marketplace,
      plugins: [{ id: "hook-fixture", kind: "standalone", source: "plugins/hook-fixture", description: "Hook fixture." }],
    }),
  );
  await writeFile(path.join(fixtureRoot, "skills.json"), JSON.stringify({ version: registry.version }));
  await writeFile(path.join(fixturePlugin, ".codex-plugin/plugin.json"), JSON.stringify({ name: "hook-fixture", version: "0.0.0" }));
  const standalone = await buildPlugin(fixtureRoot, "hook-fixture", path.join(temp, "standalone-plugin"));
  assert.equal(standalone.kind, "standalone");
  assert.equal(
    JSON.parse(await readFile(path.join(temp, "standalone-plugin/.codex-plugin/plugin.json"), "utf8")).version,
    registry.version,
  );
  await assert.rejects(buildPlugin(fixtureRoot, "hook-fixture", path.join(temp, "standalone-skill"), "skill"), /install as Codex plugins/);
  await assert.rejects(buildPlugin(root, "unknown-plugin", path.join(temp, "unknown")), /Unknown plugin/);

  const repositoryManifest = await publishRepositoryMarketplace(root, path.join(root, "dist/azskills-marketplace"));
  assert.equal(repositoryManifest, path.join(root, ".agents/plugins/marketplace.json"));
  const committedManifest = JSON.parse(await readFile(repositoryManifest, "utf8")) as Record<string, unknown>;
  const committedExpected = marketplaceManifest(catalog, "dist/azskills-marketplace");
  assert.deepEqual(committedManifest, committedExpected);
  await assert.rejects(publishRepositoryMarketplace(root, temp), /inside the repository/);

  console.log("Plugin packaging tests passed: " + built.plugins.length + " self-contained plugins, marketplace entries, hook assets, skill views, deterministic archives, repository manifest, and no routing hook.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
