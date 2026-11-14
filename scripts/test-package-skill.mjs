import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rmdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { packageSkill, packageSkillArchive, validatePackagedSkill } from './package-skill.mjs';
import { packageCodexPlugin } from './package-plugin.mjs';

const temp = await mkdtemp(path.join(os.tmpdir(), 'azskills-package-'));
const root = path.join(temp, 'repository');
const output = path.join(temp, 'output');
const source = path.join(root, 'fixture');
try {
  await mkdir(path.join(source, 'references'), { recursive: true });
  await mkdir(path.join(root, 'integrations'), { recursive: true });
  await mkdir(path.join(root, 'assets'), { recursive: true });
  const fence = String.fromCharCode(96).repeat(3);
  await writeFile(path.join(source, 'SKILL.md'), [
    '# Fixture', '', '[Guide](../integrations/guide.md)', '', fence + 'md',
    '[not a dependency](../../outside.md)', fence, '',
  ].join('\n'));
  await writeFile(path.join(root, 'integrations/guide.md'), [
    '# Guide',
    '<img src="../assets/picture.svg" alt="example">',
    '<source srcset="../assets/small.svg 1x, ../assets/large.svg 2x">',
    '<a href="../assets/details.txt">details</a>',
  ].join('\n'));
  for (const file of ['picture.svg', 'small.svg', 'large.svg']) await writeFile(path.join(root, 'assets', file), '<svg/>');
  await writeFile(path.join(root, 'assets/details.txt'), 'Fixture details');
  const packaged = await packageSkill(root, 'fixture', output);
  await validatePackagedSkill(packaged);
  const guide = await readFile(path.join(packaged, '_azskills-support/integrations/guide.md'), 'utf8');
  assert.match(guide, /\.\.\/assets\/picture\.svg/);
  assert.match(guide, /\.\.\/assets\/small\.svg 1x, .*\.\.\/assets\/large\.svg 2x/);
  assert.match(guide, /\.\.\/assets\/details\.txt/);
  const archive = path.join(temp, 'fixture.zip');
  await packageSkillArchive(root, 'fixture', path.join(temp, 'archive-source'), archive);
  await packageSkillArchive(root, 'fixture', path.join(temp, 'archive-source'), path.join(output, 'fixture.zip'));
  assert.deepEqual(await readFile(archive), await readFile(path.join(output, 'fixture.zip')), 'Archives should be deterministic');
  const expanded = path.join(temp, 'expanded');
  const unzip = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED -Force'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: archive, AZSKILLS_EXPANDED: expanded } })
    : spawnSync('unzip', ['-q', archive, '-d', expanded], { encoding: 'utf8' });
  if (unzip.error) throw unzip.error;
  assert.equal(unzip.status, 0, unzip.stderr || 'Expand-Archive failed');
  await validatePackagedSkill(expanded);
  assert.match(await readFile(path.join(expanded, 'SKILL.md'), 'utf8'), /Fixture/);
  assert.match(await readFile(path.join(expanded, '_azskills-support/integrations/guide.md'), 'utf8'), /\.\.\/assets\/picture\.svg/);

  await writeFile(path.join(root, 'integrations/missing.md'), '[Missing](../assets/absent.svg)');
  await writeFile(path.join(source, 'broken.md'), '[Broken](../integrations/missing.md)');
  await assert.rejects(packageSkill(root, 'fixture', path.join(temp, 'broken-output')), /missing linked file/);
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const pluginBuild = path.join(temp, 'plugin-build');
  const { marketplace, plugin } = await packageCodexPlugin(repository, path.join(temp, 'marketplace output with spaces'));
  const pluginManifest = JSON.parse(await readFile(path.join(plugin, 'plugin.json'), 'utf8'));
  const marketplaceManifest = JSON.parse(await readFile(path.join(marketplace, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(pluginManifest.name, 'azskills');
  for (const field of ['composerIcon', 'logo']) {
    const asset = pluginManifest.extensions['com.openai'].interface[field];
    assert.match(asset, /^\.\/assets\//);
    assert.deepEqual(await readFile(path.join(plugin, asset)), await readFile(path.join(repository, 'codex-plugin', asset)));
  }
  assert.equal(pluginManifest.version, JSON.parse(await readFile(path.join(plugin, 'skills/azskills/skills.json'), 'utf8')).version);
  assert.equal(marketplaceManifest.plugins[0].source.path, './plugins/azskills');
  const repositoryMarketplace = JSON.parse(await readFile(path.join(repository, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(repositoryMarketplace.plugins[0].source.path, './codex-plugin');
  assert.equal(JSON.parse(await readFile(path.join(repository, repositoryMarketplace.plugins[0].source.path, 'plugin.json'), 'utf8')).name, 'azskills');
  assert.ok((await readdir(path.join(plugin, 'skills/azskills'))).includes('SKILL.md'));
  const hook = spawnSync(process.execPath, [path.join(plugin, 'hooks/session-start.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(hook.status, 0, hook.stderr);
  const hookOutput = JSON.parse(hook.stdout);
  assert.equal(hookOutput.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(hookOutput.hookSpecificOutput.additionalContext, /do not wait for an explicit AzSkills invocation/);
  assert.match(hookOutput.hookSpecificOutput.additionalContext, /# AzSkills/);
  const checkoutHook = spawnSync(process.execPath, [path.join(repository, 'codex-plugin/hooks/session-start.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: path.join(repository, 'codex-plugin') },
  });
  assert.equal(checkoutHook.status, 0, checkoutHook.stderr);
  assert.match(JSON.parse(checkoutHook.stdout).hookSpecificOutput.additionalContext, /# AzSkills/);
  // Execute the declared commands, including their quoting, from an unrelated cwd.
  for (const pluginRoot of [plugin, path.join(repository, 'codex-plugin')]) {
    const hooksFile = JSON.parse(await readFile(path.join(pluginRoot, 'plugin.json'), 'utf8')).extensions['com.openai'].hooks;
    const { hooks } = JSON.parse(await readFile(path.join(pluginRoot, hooksFile), 'utf8'));
    for (const event of ['SessionStart', 'UserPromptSubmit']) {
      const command = hooks[event][0].hooks[0].command.replaceAll('${PLUGIN_ROOT}', pluginRoot);
      const result = spawnSync(command, {
        shell: true, cwd: temp, encoding: 'utf8',
        input: JSON.stringify({ hook_event_name: event, prompt: 'Review this architecture' }),
        env: { ...process.env, PLUGIN_ROOT: pluginRoot },
      });
      assert.equal(result.status, 0, result.stderr);
      const context = JSON.parse(result.stdout).hookSpecificOutput;
      assert.equal(context.hookEventName, event);
      if (event === 'UserPromptSubmit') {
        assert.match(context.additionalContext, /proactively apply AzSkills/);
        assert.match(context.additionalContext, /SKILL\.md/);
        assert.doesNotMatch(context.additionalContext, /# AzSkills/);
      } else {
        assert.match(context.additionalContext, /# AzSkills/);
      }
    }
  }
  console.log('Codex plugin package and SessionStart context assertions passed.');
  const pluginBuildResult = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.mjs'), '--output', pluginBuild], { encoding: 'utf8' });
  assert.equal(pluginBuildResult.status, 0, pluginBuildResult.stderr);
  const collisionResult = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.mjs'), '--output', pluginBuild], { encoding: 'utf8' });
  assert.notEqual(collisionResult.status, 0, 'Packaging must not replace existing deliverables');
  assert.match(collisionResult.stderr, /Output already exists/);
  console.log('Codex plugin packaging collision guard passed.');
  const unified = path.join(temp, 'azskills.zip');
  await packageSkillArchive(repository, 'azskills', path.join(temp, 'unified-stage'), unified);
  const stagedSource = path.join(temp, 'unified-stage', 'azskills');
  const stagedRegistry = JSON.parse(await readFile(path.join(stagedSource, 'skills.json'), 'utf8'));
  for (const module of stagedRegistry.modules) {
    const directory = path.join(stagedSource, module.id);
    const entries = await readdir(directory).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (entries?.length === 0) await rmdir(directory);
  }
  const second = path.join(temp, 'azskills-second.zip');
  await packageSkillArchive(stagedSource, 'azskills', path.join(temp, 'unified-stage-two'), second);
  assert.deepEqual(await readFile(unified), await readFile(second), 'Unified archives must be deterministic');
  const extracted = path.join(temp, 'unified-extracted');
  const extraction = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: unified, AZSKILLS_EXPANDED: extracted } })
    : spawnSync('unzip', ['-q', unified, '-d', extracted], { encoding: 'utf8' });
  if (extraction.error) throw extraction.error;
  assert.equal(extraction.status, 0, extraction.stderr);
  const paths = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      if (item.isDirectory()) await collect(full);
      else paths.push(path.relative(extracted, full).split(path.sep).join('/'));
    }
  }
  await collect(extracted);
  assert.deepEqual(paths.filter(p => /(^|\/)skill\.md$/i.test(p)), ['SKILL.md']);
  assert.ok(paths.every(p => !/^(\.git|dist|node_modules)\//.test(p)));
  const registry = JSON.parse(await readFile(path.join(repository, 'skills.json'), 'utf8'));
  for (const module of registry.modules) assert.ok(paths.includes(module.path), module.path);
  assert.deepEqual(JSON.parse(await readFile(path.join(extracted, 'skills.json'), 'utf8')).aliases, registry.aliases);
  assert.deepEqual(await readFile(path.join(extracted, 'ui-design/references/ux/overview.md')), await readFile(path.join(repository, 'ui-design/references/ux/overview.md')));
  await validatePackagedSkill(extracted);
  console.log('Unified archive passed: exactly one manifest, all modules and aliases, extracted supporting bytes and links, deterministic output, and excluded build metadata.');
  console.log('Skill package tests passed (Markdown, HTML assets, srcset, fenced examples, missing dependencies, deterministic zip, and extracted links).');
} finally {
  await rm(temp, { recursive: true, force: true });
}
