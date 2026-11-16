import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rmdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { packageSkill, packageSkillArchive, validatePackagedSkill } from './package-skill.ts';
import { packageCodexPlugin } from './package-plugin.ts';

interface HookEntry {
  command: string;
}

interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}

type HookFile = Record<string, HookGroup[]>;

const temp = await mkdtemp(path.join(os.tmpdir(), 'azskills-package-'));
const root = path.join(temp, 'repository');
const output = path.join(temp, 'output');
const source = path.join(root, 'fixture');
let inTreeOutput: string | undefined;
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
  const pluginManifest = JSON.parse(await readFile(path.join(plugin, '.codex-plugin/plugin.json'), 'utf8'));
  const marketplaceManifest = JSON.parse(await readFile(path.join(marketplace, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(pluginManifest.name, 'azskills');
  for (const field of ['composerIcon', 'logo']) {
    const asset = pluginManifest.interface[field];
    assert.match(asset, /^\.\/codex-plugin\/assets\//);
    assert.deepEqual(await readFile(path.join(plugin, asset)), await readFile(path.join(repository, asset)));
  }
  assert.equal(pluginManifest.version, JSON.parse(await readFile(path.join(plugin, 'skills.json'), 'utf8')).version);
  assert.match(await readFile(path.join(plugin, 'az-clean-code/SKILL.md'), 'utf8'), /C7 - Externalize business data before coding/);
  assert.match(await readFile(path.join(plugin, 'skills/azskills/SKILL.md'), 'utf8'), /canonical entry at \[SKILL\.md\]\(\.\.\/\.\.\/SKILL\.md\)/);
  assert.match(await readFile(path.join(plugin, 'skills/az-clean-code/SKILL.md'), 'utf8'), /canonical contract is \[az-clean-code\/SKILL\.md\]/);
  const taste = path.join(plugin, 'codex-plugin/taste');
  assert.match(await readFile(path.join(taste, 'recipe/main.md'), 'utf8'), /Own the result/);
  assert.match(await readFile(path.join(taste, 'recipe/sub.md'), 'utf8'), /parent's goal/i);
  assert.equal(pluginManifest.hooks, './codex-plugin/hooks/hooks.json');
  assert.equal(await readFile(path.join(plugin, 'plugin.json'), 'utf8').catch(error => error.code), 'ENOENT');
  const { hooks: pluginHooks } = JSON.parse(await readFile(path.join(plugin, pluginManifest.hooks.slice(2)), 'utf8'));
  assert.deepEqual(Object.keys(pluginHooks), ['SessionStart', 'UserPromptSubmit', 'SubagentStart', 'PreToolUse', 'PostToolUse']);
  assert.match(pluginHooks.PreToolUse[0].matcher, /apply_patch/);
  assert.match(pluginHooks.PreToolUse[0].matcher, /MultiEdit/);
  assert.match(pluginHooks.PreToolUse[0].matcher, /Bash/);
  assert.match(pluginHooks.PostToolUse[0].matcher, /apply_patch/);
  assert.match(pluginHooks.PostToolUse[0].matcher, /MultiEdit/);
  assert.match(pluginHooks.PostToolUse[0].matcher, /Bash/);
  assert.match(pluginHooks.PostToolUse[1].matcher, /wait_agent/);
  for (const event of ['SessionStart', 'UserPromptSubmit']) {
    const result = spawnSync(process.execPath, [path.join(taste, 'hooks/steer.ts')], {
      encoding: 'utf8',
      input: JSON.stringify({ hook_event_name: event, session_id: 'main', turn_id: 'turn-1', prompt: 'Build this' }),
      env: { ...process.env, PLUGIN_ROOT: plugin },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout).hookSpecificOutput;
    assert.equal(output.hookEventName, event);
    assert.match(output.additionalContext, event === 'SessionStart' ? /# GPT with Taste/ : /<gpt-with-taste-user-steer>/);
  }
  const tasteCommand = pluginHooks.SessionStart[1].hooks[0].command.replaceAll('${PLUGIN_ROOT}', plugin);
  const declaredTasteHook = spawnSync(tasteCommand, {
    shell: true,
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'SessionStart', session_id: 'main', turn_id: 'turn-1' }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(declaredTasteHook.status, 0, declaredTasteHook.stderr);
  assert.match(JSON.parse(declaredTasteHook.stdout).hookSpecificOutput.additionalContext, /# GPT with Taste/);
  const subStart = spawnSync(process.execPath, [path.join(taste, 'hooks/steer.ts')], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'SubagentStart', session_id: 'child-session', turn_id: 'turn-2', agent_id: 'child' }),
    env: { ...process.env, PLUGIN_ROOT: plugin, PLUGIN_DATA: temp },
  });
  assert.equal(subStart.status, 0, subStart.stderr);
  assert.match(JSON.parse(subStart.stdout).hookSpecificOutput.additionalContext, /<gpt-with-taste-sub-steer>/);
  const agentResult = spawnSync(process.execPath, [path.join(taste, 'hooks/steer.ts')], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'wait_agent', tool_response: { timed_out: false, status: { child: { completed: 'Done' } } } }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(agentResult.status, 0, agentResult.stderr);
  assert.match(JSON.parse(agentResult.stdout).hookSpecificOutput.additionalContext, /<gpt-with-taste-agent-steer>/);
  assert.equal(marketplaceManifest.plugins[0].source.path, './plugins/azskills');
  const standaloneCleanCode = await packageSkill(repository, 'az-clean-code', path.join(temp, 'standalone-skill'));
  assert.match(await readFile(path.join(standaloneCleanCode, 'SKILL.md'), 'utf8'), /C1-C7/);
  await validatePackagedSkill(standaloneCleanCode);
  const repositoryMarketplace = JSON.parse(await readFile(path.join(repository, '.agents/plugins/marketplace.json'), 'utf8'));
  assert.equal(repositoryMarketplace.plugins[0].source.path, './');
  assert.ok((await readdir(path.join(plugin, 'skills/azskills'))).includes('SKILL.md'));
  assert.ok((await readdir(path.join(plugin, 'skills/az-clean-code'))).includes('SKILL.md'));
  const hook = spawnSync(process.execPath, [path.join(plugin, 'codex-plugin/hooks/session-start.ts')], {
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(hook.status, 0, hook.stderr);
  const hookOutput = JSON.parse(hook.stdout);
  assert.equal(hookOutput.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(hookOutput.hookSpecificOutput.additionalContext, /do not wait for an explicit AzSkills invocation/);
  assert.match(hookOutput.hookSpecificOutput.additionalContext, /# AzSkills/);
  const checkoutHook = spawnSync(process.execPath, [path.join(repository, 'codex-plugin/hooks/session-start.ts')], {
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: repository },
  });
  assert.equal(checkoutHook.status, 0, checkoutHook.stderr);
  assert.match(JSON.parse(checkoutHook.stdout).hookSpecificOutput.additionalContext, /# AzSkills/);
  const guard = path.join(plugin, 'codex-plugin/hooks/godot3-guard.ts');
  const patchBody = (...lines: string[]): string => ['*** Begin Patch', ...lines, '*** End Patch'].join('\n');
  const deniedPatch = spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { patch: patchBody('*** Update File: Player.gd', '@@', '+\t._ready()') } }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(deniedPatch.status, 0, deniedPatch.stderr);
  assert.equal(JSON.parse(deniedPatch.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const allowedPatch = spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { patch: patchBody('*** Update File: Player.gd', '@@', '+\tvelocity = move_and_slide(velocity)') } }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(allowedPatch.status, 0, allowedPatch.stderr);
  assert.equal(JSON.parse(allowedPatch.stdout).continue, true);
  // Codex serializes apply_patch as {"command": patch}, not {"patch": patch}.
  // If the guard reads the wrong field, the full checker never runs.
  const codexShapeDenied = spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: patchBody('*** Update File: Player.gd', '@@', '+\t._ready()') } }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(codexShapeDenied.status, 0, codexShapeDenied.stderr);
  assert.equal(JSON.parse(codexShapeDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const codexShapeClean = spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: patchBody('*** Update File: Player.gd', '@@', '+\tvelocity = move_and_slide(velocity)') } }),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  assert.equal(codexShapeClean.status, 0, codexShapeClean.stderr);
  assert.equal(JSON.parse(codexShapeClean.stdout).continue, true);
  const prewriteProject = path.join(temp, 'godot-prewrite-project');
  await mkdir(prewriteProject, { recursive: true });
  await writeFile(path.join(prewriteProject, 'project.godot'), 'config_version=4\n');
  const prewriteScript = path.join(prewriteProject, 'Player.gd');
  const runGuard = (event: unknown) => spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    input: JSON.stringify(event),
    env: { ...process.env, PLUGIN_ROOT: plugin },
  });
  const checkerOnlyWrite = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: prewriteScript,
      content: 'extends Node\n\nfunc _ready():\n\tconnect("ready", self, "_missing")\n',
    },
  });
  assert.equal(checkerOnlyWrite.status, 0, checkerOnlyWrite.stderr);
  assert.equal(JSON.parse(checkerOnlyWrite.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(checkerOnlyWrite.stdout).hookSpecificOutput.permissionDecisionReason, /UNKNOWN_SIGNAL_TARGET/);
  const cleanWrite = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: prewriteScript,
      content: 'extends Node\n\nfunc _ready():\n\tprint("ok")\n',
    },
  });
  assert.equal(cleanWrite.status, 0, cleanWrite.stderr);
  assert.equal(JSON.parse(cleanWrite.stdout).continue, true);
  // A Godot 4.x manifest must veto even perfectly clean 3.x-looking scripts:
  // project.godot joins the checker targets, not just the symbol context.
  const godot4Project = path.join(temp, 'godot4-project');
  await mkdir(godot4Project, { recursive: true });
  await writeFile(path.join(godot4Project, 'project.godot'), 'config_version=5\n');
  const cleanWriteInGodot4 = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: path.join(godot4Project, 'Clean.gd'),
      content: 'extends Node\n\nfunc _ready():\n\tprint("ok")\n',
    },
  });
  assert.equal(cleanWriteInGodot4.status, 0, cleanWriteInGodot4.stderr);
  assert.equal(JSON.parse(cleanWriteInGodot4.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(cleanWriteInGodot4.stdout).hookSpecificOutput.permissionDecisionReason, /GODOT4_PROJECT/);
  const ambiguousWriteInGodot4 = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: path.join(godot4Project, 'Clean.gd'),
      edits: [{ old_string: '\n', new_string: '\n# note\n', replace_all: false }],
    },
  });
  assert.equal(ambiguousWriteInGodot4.status, 0, ambiguousWriteInGodot4.stderr);
  assert.equal(JSON.parse(ambiguousWriteInGodot4.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(ambiguousWriteInGodot4.stdout).hookSpecificOutput.permissionDecisionReason, /GODOT4_PROJECT/);
  const manifestDowngrade = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: path.join(godot4Project, 'project.godot'),
      content: 'config_version=4\n',
    },
  });
  assert.equal(manifestDowngrade.status, 0, manifestDowngrade.stderr);
  assert.equal(JSON.parse(manifestDowngrade.stdout).continue, true);
  await writeFile(prewriteScript, 'extends Node\n\nfunc _ready():\n\tprint("ok")\n');
  const checkerOnlyEdit = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: {
      file_path: prewriteScript,
      old_string: 'print("ok")',
      new_string: 'connect("ready", self, "_missing")',
      replace_all: false,
    },
  });
  assert.equal(checkerOnlyEdit.status, 0, checkerOnlyEdit.stderr);
  assert.equal(JSON.parse(checkerOnlyEdit.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const checkerOnlyPatch = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    tool_input: {
      patch: patchBody(
        '*** Update File: ' + prewriteScript,
        '@@',
        '-\tprint("ok")',
        '+\tconnect("ready", self, "_missing")',
      ),
    },
  });
  assert.equal(checkerOnlyPatch.status, 0, checkerOnlyPatch.stderr);
  assert.equal(JSON.parse(checkerOnlyPatch.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const incompletePatch = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    tool_input: { patch: patchBody('*** Update File: ' + prewriteScript, '@@', '+\tconnect("ready", self, "_missing")') },
  });
  assert.equal(incompletePatch.status, 0, incompletePatch.stderr);
  assert.equal(JSON.parse(incompletePatch.stdout).continue, true);
  const existingErrorScript = path.join(prewriteProject, 'ExistingError.gd');
  await writeFile(existingErrorScript, 'extends Node\n\nfunc _ready():\n\tconnect("ready", self, "_missing")\n');
  const existingErrorPatch = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    tool_input: {
      patch: patchBody(
        '*** Update File: ' + existingErrorScript,
        '@@',
        ' func _ready():',
        '+\tprint("still here")',
        '\tconnect("ready", self, "_missing")',
      ),
    },
  });
  assert.equal(existingErrorPatch.status, 0, existingErrorPatch.stderr);
  assert.equal(JSON.parse(existingErrorPatch.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(existingErrorPatch.stdout).hookSpecificOutput.permissionDecisionReason, /UNKNOWN_SIGNAL_TARGET/);
  const relativeCleanWrite = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    cwd: prewriteProject,
    tool_input: {
      file_path: 'Relative.gd',
      content: 'extends Node\n\nfunc _ready():\n\tprint("ok")\n',
    },
  });
  assert.equal(relativeCleanWrite.status, 0, relativeCleanWrite.stderr);
  assert.equal(JSON.parse(relativeCleanWrite.stdout).continue, true);
  const nonGodotWrite = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: path.join(prewriteProject, 'notes.txt'),
      content: 'instantiate() is documented here as a Godot 4.x example.\n',
    },
  });
  assert.equal(nonGodotWrite.status, 0, nonGodotWrite.stderr);
  assert.equal(JSON.parse(nonGodotWrite.stdout).continue, true);
  const badScene = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: path.join(prewriteProject, 'Bad.tscn'),
      content: '[gd_scene format=3]\n\n[node name="Root" type="Node"]\n',
    },
  });
  assert.equal(badScene.status, 0, badScene.stderr);
  assert.equal(JSON.parse(badScene.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(badScene.stdout).hookSpecificOutput.permissionDecisionReason, /WRONG_SCENE_FORMAT/);
  const cleanScene = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: path.join(prewriteProject, 'Good.tscn'),
      content: '[gd_scene format=2]\n\n[node name="Root" type="Node"]\n',
    },
  });
  assert.equal(cleanScene.status, 0, cleanScene.stderr);
  assert.equal(JSON.parse(cleanScene.stdout).continue, true);
  const multiClean = path.join(prewriteProject, 'MultiClean.gd');
  const multiBad = path.join(prewriteProject, 'MultiBad.gd');
  await writeFile(multiClean, 'extends Node\n');
  await writeFile(multiBad, 'extends Node\n\nfunc _ready():\n\tprint("ok")\n');
  const multiFilePatch = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    tool_input: {
      patch: patchBody(
        '*** Update File: ' + multiClean,
        '@@',
        ' extends Node',
        '+',
        '+func _ready():',
        '+\tprint("ok")',
        '*** Update File: ' + multiBad,
        '@@',
        '-\tprint("ok")',
        '+\tconnect("ready", self, "_missing")',
      ),
    },
  });
  assert.equal(multiFilePatch.status, 0, multiFilePatch.stderr);
  const multiFileReason = JSON.parse(multiFilePatch.stdout).hookSpecificOutput.permissionDecisionReason;
  assert.match(multiFileReason, /MultiBad\.gd/);
  assert.doesNotMatch(multiFileReason, /MultiClean\.gd/);
  const numberedInsertion = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    tool_input: {
      patch: patchBody(
        '*** Update File: ' + prewriteScript,
        '@@ -3,0 +4,1 @@',
        '+\tconnect("ready", self, "_missing")',
      ),
    },
  });
  assert.equal(numberedInsertion.status, 0, numberedInsertion.stderr);
  assert.equal(JSON.parse(numberedInsertion.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(numberedInsertion.stdout).hookSpecificOutput.permissionDecisionReason, /UNKNOWN_SIGNAL_TARGET/);
  const multiEditDenied = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: prewriteScript,
      edits: [
        { old_string: 'print("ok")', new_string: 'connect("ready", self, "_missing")', replace_all: false },
      ],
    },
  });
  assert.equal(multiEditDenied.status, 0, multiEditDenied.stderr);
  assert.equal(JSON.parse(multiEditDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(multiEditDenied.stdout).hookSpecificOutput.permissionDecisionReason, /UNKNOWN_SIGNAL_TARGET/);
  const multiEditAmbiguous = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: prewriteScript,
      edits: [{ old_string: '\n', new_string: '\n# comment\n', replace_all: false }],
    },
  });
  assert.equal(multiEditAmbiguous.status, 0, multiEditAmbiguous.stderr);
  assert.equal(JSON.parse(multiEditAmbiguous.stdout).continue, true);
  await writeFile(prewriteScript, 'extends Node\n\nfunc _ready():\n\tconnect("ready", self, "_missing")\n');
  const postPatchShape = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    cwd: prewriteProject,
    tool_input: { command: patchBody('*** Update File: Player.gd', '@@', '+\tprint("x")') },
  });
  assert.equal(postPatchShape.status, 0, postPatchShape.stderr);
  assert.equal(JSON.parse(postPatchShape.stdout).decision, 'block');
  assert.match(JSON.parse(postPatchShape.stdout).reason, /UNKNOWN_SIGNAL_TARGET/);
  const postWriteError = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: prewriteScript, content: '' },
  });
  assert.equal(postWriteError.status, 0, postWriteError.stderr);
  assert.equal(JSON.parse(postWriteError.stdout).decision, 'block');
  assert.match(JSON.parse(postWriteError.stdout).reason, /UNKNOWN_SIGNAL_TARGET/);
  const postMultiEditError = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'MultiEdit',
    tool_input: { file_path: prewriteScript, edits: [] },
  });
  assert.equal(postMultiEditError.status, 0, postMultiEditError.stderr);
  assert.equal(JSON.parse(postMultiEditError.stdout).decision, 'block');
  await writeFile(path.join(godot4Project, 'Written.gd'), 'extends Node\n');
  const postWriteInGodot4 = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: path.join(godot4Project, 'Written.gd'), content: '' },
  });
  assert.equal(postWriteInGodot4.status, 0, postWriteInGodot4.stderr);
  assert.equal(JSON.parse(postWriteInGodot4.stdout).decision, 'block');
  assert.match(JSON.parse(postWriteInGodot4.stdout).reason, /GODOT4_PROJECT/);
  await writeFile(prewriteScript, 'extends Node\n\nfunc _ready():\n\tprint("ok")\n');
  const postWriteClean = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: prewriteScript, content: '' },
  });
  assert.equal(postWriteClean.status, 0, postWriteClean.stderr);
  assert.equal(JSON.parse(postWriteClean.stdout).continue, true);
  assert.match(JSON.parse(postWriteClean.stdout).hookSpecificOutput.additionalContext, /errors=0/);
  const shellProject = path.join(temp, 'godot-shell-project');
  await mkdir(shellProject, { recursive: true });
  await writeFile(path.join(shellProject, 'project.godot'), 'config_version=4\n');
  await writeFile(path.join(shellProject, 'Player.gd'), 'extends Node\n\nfunc _ready():\n\tprint("ok")\n');
  const shellDenied = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Set-Content -Path Player.gd -Value "extends Node"' },
  });
  assert.equal(shellDenied.status, 0, shellDenied.stderr);
  assert.equal(JSON.parse(shellDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  assert.match(JSON.parse(shellDenied.stdout).hookSpecificOutput.permissionDecisionReason, /apply_patch/);
  const shellRedirectDenied = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'echo "extends Node" > Player.gd' },
  });
  assert.equal(shellRedirectDenied.status, 0, shellRedirectDenied.stderr);
  assert.equal(JSON.parse(shellRedirectDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const shellInterpreterDenied = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'powershell -Command "Set-Content -Path Player.gd -Value \'clean\'"' },
  });
  assert.equal(shellInterpreterDenied.status, 0, shellInterpreterDenied.stderr);
  assert.equal(JSON.parse(shellInterpreterDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const shellCmdCopyDenied = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'cmd /c "copy Player.gd Player.bak"' },
  });
  assert.equal(shellCmdCopyDenied.status, 0, shellCmdCopyDenied.stderr);
  assert.equal(JSON.parse(shellCmdCopyDenied.stdout).hookSpecificOutput.permissionDecision, 'deny');
  const shellReadAllowed = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Get-Content Player.gd' },
  });
  assert.equal(shellReadAllowed.status, 0, shellReadAllowed.stderr);
  assert.equal(JSON.parse(shellReadAllowed.stdout).continue, true);
  const shellUnsupportedScript = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'node tools/build-godot-assets.mjs' },
  });
  assert.equal(shellUnsupportedScript.status, 0, shellUnsupportedScript.stderr);
  assert.equal(JSON.parse(shellUnsupportedScript.stdout).continue, true);
  const shellPostClean = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Set-Content -Path Player.gd -Value "clean"' },
  });
  assert.equal(shellPostClean.status, 0, shellPostClean.stderr);
  assert.equal(JSON.parse(shellPostClean.stdout).continue, true);
  assert.match(JSON.parse(shellPostClean.stdout).hookSpecificOutput.additionalContext, /errors=0/);
  await writeFile(path.join(shellProject, 'Player.gd'), 'extends Node\n\nfunc _ready():\n\tconnect("ready", self, "_missing")\n');
  const shellPostError = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Set-Content -Path Player.gd -Value "bad"' },
  });
  assert.equal(shellPostError.status, 0, shellPostError.stderr);
  assert.equal(JSON.parse(shellPostError.stdout).decision, 'block');
  assert.match(JSON.parse(shellPostError.stdout).reason, /UNKNOWN_SIGNAL_TARGET/);
  // A read-only command that names a broken Godot file must not block on
  // pre-existing errors; only commands with write evidence rerun the checker.
  const shellPostReadOnly = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Get-Content Player.gd' },
  });
  assert.equal(shellPostReadOnly.status, 0, shellPostReadOnly.stderr);
  assert.equal(JSON.parse(shellPostReadOnly.stdout).continue, true);
  const shellPostUnrelatedCopy = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'Copy-Item README.md README.bak' },
  });
  assert.equal(shellPostUnrelatedCopy.status, 0, shellPostUnrelatedCopy.stderr);
  assert.equal(JSON.parse(shellPostUnrelatedCopy.stdout).continue, true);
  const shellPostQuotedProse = runGuard({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    cwd: shellProject,
    tool_input: { command: 'git commit -m "move Player.gd docs into a section"' },
  });
  assert.equal(shellPostQuotedProse.status, 0, shellPostQuotedProse.stderr);
  assert.equal(JSON.parse(shellPostQuotedProse.stdout).continue, true);
  const deleteProject = path.join(temp, 'godot-delete-project');
  await mkdir(deleteProject, { recursive: true });
  await writeFile(path.join(deleteProject, 'project.godot'), 'config_version=4\n');
  await writeFile(
    path.join(deleteProject, 'Main.tscn'),
    '[gd_scene load_steps=2 format=2]\n\n[ext_resource path="res://Removed.gd" type="Script" id=1]\n\n[node name="Main" type="Node2D"]\n',
  );
  await writeFile(path.join(deleteProject, 'Removed.gd'), 'extends Node\n');
  await rm(path.join(deleteProject, 'Removed.gd'));
  const postDelete = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    cwd: deleteProject,
    tool_input: { command: patchBody('*** Delete File: Removed.gd') },
  });
  assert.equal(postDelete.status, 0, postDelete.stderr);
  assert.equal(JSON.parse(postDelete.stdout).decision, 'block');
  assert.match(JSON.parse(postDelete.stdout).reason, /MISSING_SCENE_SCRIPT_PATH/);
  const brokenSceneProject = path.join(temp, 'godot-delete-broken-scene-project');
  await mkdir(brokenSceneProject, { recursive: true });
  await writeFile(path.join(brokenSceneProject, 'project.godot'), 'config_version=4\n');
  await writeFile(path.join(brokenSceneProject, 'Broken.tscn'), '[node name="Broken" type="Node"]\n');
  await writeFile(path.join(brokenSceneProject, 'Removed.gd'), 'extends Node\n');
  await rm(path.join(brokenSceneProject, 'Removed.gd'));
  const postDeleteUnrelatedError = runGuard({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    cwd: brokenSceneProject,
    tool_input: { command: patchBody('*** Delete File: Removed.gd') },
  });
  assert.equal(postDeleteUnrelatedError.status, 0, postDeleteUnrelatedError.stderr);
  assert.equal(JSON.parse(postDeleteUnrelatedError.stdout).continue, true);
  assert.match(JSON.parse(postDeleteUnrelatedError.stdout).hookSpecificOutput.additionalContext, /errors=1, related=0/);
  const godotCheck = spawnSync(process.execPath, [path.join(plugin, 'godot-3-dev/scripts/check-godot-3x.ts'), '--self-test'], { encoding: 'utf8' });
  assert.equal(godotCheck.status, 0, godotCheck.stderr);
  // Execute the declared commands, including their quoting, from an unrelated cwd.
  for (const pluginRoot of [plugin, repository]) {
    const hooksFile = JSON.parse(await readFile(path.join(pluginRoot, '.codex-plugin/plugin.json'), 'utf8')).hooks;
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
        assert.match(context.additionalContext, /Az Clean Code/);
        assert.match(context.additionalContext, /establish business-data configuration before coding/);
        const cleanCodeEntry = context.additionalContext.match(/This request matches Az Clean Code. Read (.+?) and follow its C1-C7/)[1];
        assert.match(await readFile(cleanCodeEntry, 'utf8'), /C1-C7/);
        assert.doesNotMatch(context.additionalContext, /# AzSkills/);
      } else {
        assert.match(context.additionalContext, /# AzSkills/);
      }
    }
    const unrelated = spawnSync(process.execPath, [path.join(pluginRoot, 'codex-plugin/hooks/session-start.ts'), 'UserPromptSubmit'], {
      cwd: temp, encoding: 'utf8', input: JSON.stringify({ prompt: 'Explain the architecture concept' }),
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
    });
    assert.equal(unrelated.status, 0, unrelated.stderr);
    assert.doesNotMatch(JSON.parse(unrelated.stdout).hookSpecificOutput.additionalContext, /Az Clean Code/);
  }
  console.log('Codex plugin package and SessionStart context assertions passed.');
  // A clean checkout has no ignored dist directory, so the marketplace must resolve inside it.
  const cleanClone = path.join(temp, 'clean-clone');
  await cp(repository, cleanClone, {
    recursive: true,
    filter(source) {
      const relative = path.relative(repository, source);
      if (!relative) return true;
      const top = relative.split(path.sep)[0] ?? '';
      return top !== '.git' && top !== 'dist' && top !== 'node_modules' && !top.startsWith('.tmp_');
    },
  });
  const cloneMarketplace = JSON.parse(await readFile(path.join(cleanClone, '.agents/plugins/marketplace.json'), 'utf8'));
  const clonePlugin = path.resolve(cleanClone, cloneMarketplace.plugins[0].source.path);
  for (const required of ['.codex-plugin/plugin.json', 'SKILL.md', 'skills/azskills/SKILL.md', 'skills/az-clean-code/SKILL.md', 'codex-plugin/hooks/hooks.json', 'codex-plugin/hooks/session-start.ts', 'codex-plugin/hooks/godot3-guard.ts', 'godot-3-dev/scripts/check-godot-3x.ts', 'godot-3-dev/scripts/godot3-lexical.ts', 'godot-3-dev/references/api-3.6.json', 'codex-plugin/taste/hooks/steer.ts']) {
    await stat(path.join(clonePlugin, required));
  }
  const cloneHooks = (JSON.parse(await readFile(path.join(clonePlugin, 'codex-plugin/hooks/hooks.json'), 'utf8')) as { hooks: HookFile }).hooks;
  for (const groups of Object.values(cloneHooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        const marker = '$' + '{PLUGIN_ROOT}';
        const target = hook.command.slice(hook.command.indexOf(marker) + marker.length, hook.command.indexOf('"', hook.command.indexOf(marker)));
        await stat(path.join(clonePlugin, target));
      }
    }
  }
  console.log('Clean checkout marketplace and hook command paths resolve without dist.');
  const pluginBuildResult = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.ts'), '--output', pluginBuild], { encoding: 'utf8' });
  assert.equal(pluginBuildResult.status, 0, pluginBuildResult.stderr);
  const pluginExpanded = path.join(temp, 'plugin-extracted');
  const pluginArchive = path.join(pluginBuild, 'azskills-plugin.zip');
  const pluginExtraction = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:AZSKILLS_ARCHIVE -DestinationPath $env:AZSKILLS_EXPANDED'], { encoding: 'utf8', env: { ...process.env, AZSKILLS_ARCHIVE: pluginArchive, AZSKILLS_EXPANDED: pluginExpanded } })
    : spawnSync('unzip', ['-q', pluginArchive, '-d', pluginExpanded], { encoding: 'utf8' });
  if (pluginExtraction.error) throw pluginExtraction.error;
  assert.equal(pluginExtraction.status, 0, pluginExtraction.stderr);
  const extractedPlugin = JSON.parse(await readFile(path.join(pluginExpanded, '.codex-plugin/plugin.json'), 'utf8'));
  assert.deepEqual(extractedPlugin, pluginManifest);
  assert.equal(await readFile(path.join(pluginExpanded, 'plugin.json'), 'utf8').catch(error => error.code), 'ENOENT');
  assert.deepEqual(JSON.parse(await readFile(path.join(pluginExpanded, extractedPlugin.hooks), 'utf8')).hooks, pluginHooks);
  // Resolve the repository marketplace against the build tree, as a local install does.
  const builtPlugin = path.join(pluginBuild, 'azskills-marketplace/plugins/azskills');
  assert.deepEqual(JSON.parse(await readFile(path.join(builtPlugin, '.codex-plugin/plugin.json'), 'utf8')), pluginManifest);
  const installedHook = spawnSync(process.execPath, [path.join(pluginExpanded, 'codex-plugin/hooks/session-start.ts')], {
    cwd: temp, encoding: 'utf8', env: { ...process.env, PLUGIN_ROOT: pluginExpanded },
  });
  assert.equal(installedHook.status, 0, installedHook.stderr);
  assert.match(JSON.parse(installedHook.stdout).hookSpecificOutput.additionalContext, /# AzSkills/);
  const collisionResult = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.ts'), '--output', pluginBuild], { encoding: 'utf8' });
  assert.notEqual(collisionResult.status, 0, 'Packaging must not replace existing deliverables');
  assert.match(collisionResult.stderr, /Output already exists/);
  const emptyOutputResult = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.ts'), '--output', ''], { encoding: 'utf8' });
  assert.notEqual(emptyOutputResult.status, 0, 'Packaging must reject an empty --output value');
  assert.match(emptyOutputResult.stderr, /--output requires a directory/);
  await mkdir(path.join(repository, 'dist'), { recursive: true });
  inTreeOutput = await mkdtemp(path.join(repository, 'dist', '.azskills-package-test-'));
  const inTreeBuild = spawnSync(process.execPath, [path.join(repository, 'scripts/package-plugin.ts'), '--output', inTreeOutput], { encoding: 'utf8' });
  assert.equal(inTreeBuild.status, 0, inTreeBuild.stderr);
  assert.deepEqual(JSON.parse(await readFile(path.join(inTreeOutput, 'azskills-marketplace/plugins/azskills/.codex-plugin/plugin.json'), 'utf8')), pluginManifest);
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
  const paths: string[] = [];
  async function collect(directory: string): Promise<void> {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      if (item.isDirectory()) await collect(full);
      else paths.push(path.relative(extracted, full).split(path.sep).join('/'));
    }
  }
  await collect(extracted);
  assert.deepEqual(paths.filter(p => /(^|\/)skill\.md$/i.test(p)).sort(), ['SKILL.md', 'az-clean-code/SKILL.md']);
  assert.ok(paths.every(p => !/^(\.git|dist|node_modules)\//.test(p)));
  const registry = JSON.parse(await readFile(path.join(repository, 'skills.json'), 'utf8'));
  for (const module of registry.modules as { path: string }[]) assert.ok(paths.includes(module.path), module.path);
  assert.deepEqual(JSON.parse(await readFile(path.join(extracted, 'skills.json'), 'utf8')).aliases, registry.aliases);
  assert.deepEqual(await readFile(path.join(extracted, 'ui-design/references/ux/overview.md')), await readFile(path.join(repository, 'ui-design/references/ux/overview.md')));
  await validatePackagedSkill(extracted);
  console.log('Unified archive passed: exactly one manifest, all modules and aliases, extracted supporting bytes and links, deterministic output, and excluded build metadata.');
  console.log('Skill package tests passed (Markdown, HTML assets, srcset, fenced examples, missing dependencies, deterministic zip, and extracted links).');
} finally {
  if (inTreeOutput) await rm(inTreeOutput, { recursive: true, force: true });
  await rm(temp, { recursive: true, force: true });
}
