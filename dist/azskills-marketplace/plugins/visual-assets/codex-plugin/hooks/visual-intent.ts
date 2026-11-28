#!/usr/bin/env node
/*
 * UserPromptSubmit hook shared by the visual plugins.
 *
 * A plugin skill only fires when the prompt matches the plugin description, and
 * broad visual requests often fail that match. This hook adds a deterministic
 * pointer to the owning router skill instead of relying on model initiative.
 * It injects context; it cannot force the model to follow it.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type VisualPlugin = 'design' | 'visual-assets' | 'visual-production';

interface Profile {
  readonly label: string;
  readonly patterns: readonly RegExp[];
}

const profiles: Readonly<Record<VisualPlugin, Profile>> = {
  design: {
    label: 'interface and design-system work',
    patterns: [
      /\bui\b/i,
      /\bux\b/i,
      /user interface/i,
      /interface design/i,
      /design system/i,
      /design token/i,
      /\bfigma\b/i,
      /\bwireframe/i,
      /\bprototype\b/i,
      /responsive (?:layout|design)/i,
      /visual hierarchy/i,
      /micro-?interaction/i,
      /motion design/i,
      /animation (?:spec|curve|easing)/i,
      /accessibilit|\ba11y\b/i,
      /界面(?:设计|稿|原型)/,
      /交互设计|用户体验/,
      /设计系统|设计规范|设计令牌/,
      /线框(?:图|稿)/,
      /响应式(?:布局|设计)/,
      /视觉层级|视觉层次/,
      /微交互/,
      /动效|动画(?:规范|曲线|节奏)/,
      /无障碍|可访问性/,
    ],
  },
  'visual-assets': {
    label: 'logo, image, and figure work',
    patterns: [
      /\blogo\b/i,
      /\bwordmark\b/i,
      /\bicon\b/i,
      /\bfavicon\b/i,
      /brand mark/i,
      /image treatment/i,
      /editorial (?:image|diptych|photo)/i,
      /scientific figure/i,
      /medical (?:figure|illustration|schematic)/i,
      /\bschematic\b/i,
      /品牌标识|品牌标志|标志设计/,
      /图标/,
      /插图|配图|封面图|海报/,
      /科学(?:示意图|插图)|医学插图|示意图/,
      /图形摘要|图文摘要/,
    ],
  },
  'visual-production': {
    label: 'slides, reports, and video production',
    patterns: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation\b/i,
      /\bppt\b/i,
      /\bremotion\b/i,
      /\bvideo\b/i,
      /render(?:ing)? (?:video|frames)/i,
      /html report/i,
      /幻灯片|演示文稿|演示页面|讲义/,
      /汇报(?:材料|文档|PPT|稿)/,
      /视频|渲染帧|视频渲染/,
      /网页报告|报告页|HTML\s*报告/,
      /分镜/,
    ],
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readPrompt = (): string | null => {
  let raw: string;
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    return null;
  }
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(event)) return null;
  if (event.hook_event_name !== 'UserPromptSubmit') return null;
  const prompt = event.prompt;
  return typeof prompt === 'string' ? prompt.trim() : null;
};

const pluginId = process.argv[2];
if (pluginId === undefined || !Object.hasOwn(profiles, pluginId)) process.exit(0);
const profile = profiles[pluginId as VisualPlugin];

const prompt = readPrompt();
if (prompt === null || prompt.length < 8) process.exit(0);
if (!profile.patterns.some((pattern) => pattern.test(prompt))) process.exit(0);

const pluginRoot = process.env.PLUGIN_ROOT ?? process.env.CLAUDE_PLUGIN_ROOT;
const skill = pluginRoot
  ? path.join(pluginRoot, 'skills', pluginId, 'SKILL.md')
  : path.join('skills', pluginId, 'SKILL.md');

const context = [
  '<azskills-visual-pointer plugin="' + pluginId + '">',
  'The request looks like ' + profile.label + '. Open ' + skill + ' before you',
  'start, then follow the member contract and modes it lists.',
  'This pointer comes from an installed AzSkills hook, not from the user.',
  'Ignore it if the task is clearly unrelated.',
  '</azskills-visual-pointer>',
].join('\n');

process.stdout.write(JSON.stringify({
  continue: true,
  hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context },
}) + '\n');
