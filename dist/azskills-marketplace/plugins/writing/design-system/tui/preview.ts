#!/usr/bin/env node
/*
 * AzSkills terminal preview.
 *
 * Dependency-free renderer for the Terminal / TUI contract in DESIGN.md.
 * It is a verification artifact, not a framework: one cell grid, ANSI roles,
 * ASCII fallbacks, and a deterministic --check mode for CI.
 */

import process from "node:process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { errorMessage, isRecord } from "../../scripts/runtime.ts";

interface SkillEntry {
  name: string;
  group: string;
  purpose: string;
  when: string;
  contract: string;
}

type ThemeName = "light" | "dark";
type Density = "compact" | "comfortable";
type ColorMode = "auto" | "truecolor" | "256" | "16" | "none";
type Role =
  | "text"
  | "textBold"
  | "underline"
  | "reverse"
  | "muted"
  | "border"
  | "accent"
  | "accentBold"
  | "success"
  | "warning"
  | "danger";
type PaletteRole = "accent" | "muted" | "border" | "success" | "warning" | "danger";
type Rgb = [number, number, number];
type Palette = Record<PaletteRole, Rgb>;
type SgrCode = string | number;

interface Segment {
  t: string;
  r?: Role;
}

type Style = (role: Role, text: unknown) => string;

interface Glyphs {
  marker: string;
  chevron: string;
  check: string;
  cross: string;
  ellipsis: string;
  h: string;
  v: string;
  bullet: string;
}

interface RenderOptions {
  width?: number;
  rows?: number;
  theme?: string;
  density?: string;
  color?: string;
  ascii?: boolean;
  plain?: boolean;
  selected?: string;
  environment?: Record<string, string | undefined>;
  isTTY?: boolean;
}

interface RawOptions {
  width: number;
  rows: number;
  theme: string | undefined;
  density: string | undefined;
  color: string | undefined;
  ascii: boolean;
  plain: boolean;
  selected: string | undefined;
  check: boolean;
  help: boolean;
}

interface ParsedOptions {
  width: number;
  rows: number;
  theme: ThemeName;
  density: Density;
  color: ColorMode;
  ascii: boolean;
  plain: boolean;
  selected: string;
  check: boolean;
  help: boolean;
}

interface ResolvedOptions {
  width: number;
  rows: number;
  theme: ThemeName;
  density: Density;
  selected: string;
  plain: boolean;
  ascii: boolean;
  color: ColorMode;
}

interface CheckResult {
  ok: boolean;
  frames: number;
  widths: number[];
  narrowWidths: number[];
  issues: string[];
}

interface FrameResult {
  issues: string[];
  output: string;
}

const MODULES: readonly SkillEntry[] = [
  {
    name: "architecture",
    group: "ARCH",
    purpose: "Choose the smallest runtime, frontend, persistence, and process boundary.",
    when: "Use when a stack, runtime, or boundary is unresolved.",
    contract: "Native first. Explicit boundaries. The heavier runtime needs evidence.",
  },
  {
    name: "design-system",
    group: "INTERFACE",
    purpose: "Consume, normalize, and verify DESIGN.md visual contracts.",
    when: "Use when design evidence must become executable tokens and rules.",
    contract: "Source integrity. Semantic mapping. Provenance. Render verification.",
  },
  {
    name: "ui-design",
    group: "INTERFACE",
    purpose: "Production interface hierarchy, states, responsive behavior, and visual QA.",
    when: "Use when an interface needs structure, implementation, refinement, or review.",
    contract: "One thesis. Token-only spacing. Every state. Rendered verification.",
  },
  {
    name: "logo-generator",
    group: "VISUAL",
    purpose: "Develop logos, product marks, character marks, and identity systems.",
    when: "Use when a product needs a recognizable mark and identity rules.",
    contract: "Original geometry. Small-size proof. One identity system.",
  },
  {
    name: "photo-abstract-editorial",
    group: "VISUAL",
    purpose: "Turn one supplied photograph into a restrained editorial diptych.",
    when: "Use when a photograph needs a faithful abstract companion panel.",
    contract: "Keep the source faithful. Derive only spatial and tonal relationships.",
  },
  {
    name: "frontend-slides",
    group: "PROD",
    purpose: "Build fixed-stage HTML presentations with authored assets and rendered QA.",
    when: "Use when content must become a designed 1920x1080 deck.",
    contract: "One narrative argument. Fixed stage. No overflow. Render every slide.",
  },
  {
    name: "remotion-production",
    group: "PROD",
    purpose: "Build deterministic programmatic video with Remotion as the time authority.",
    when: "Use when the deliverable is a rendered time-based artifact.",
    contract: "Frame is time. One visual owner per concern. Reproducible renders.",
  },
  {
    name: "document-writing",
    group: "PUBLISH",
    purpose: "Write, rewrite, and audit GitHub README and Steam Workshop documents.",
    when: "Use when a repository or Mod needs a publication-ready document.",
    contract: "Branch-specific format. Verified facts. Stable links. Final lint.",
  },
  {
    name: "localization",
    group: "PUBLISH",
    purpose: "Translate game CSV rows with intact markup and clean escaping.",
    when: "Use when a localization batch or locale audit is requested.",
    contract: "Preserve schema. Protect BBCode. Complete every locale.",
  },
  {
    name: "resume-evidence-workflow",
    group: "CAREER",
    purpose: "Build a career evidence bank and tailor a resume to one requirement.",
    when: "Use when career material must become an evidence-backed application.",
    contract: "Confirmed evidence. Explicit gaps. Approved removals. Print-verified artifact.",
  },
  {
    name: "tool-integration",
    group: "OPS",
    purpose: "Connect AzSkills to supported AI clients with verified setup steps.",
    when: "Use when installing, configuring, troubleshooting, or removing AzSkills in a client.",
    contract: "Registry-backed mechanism. Preview writes. Verify discovery. Preserve unrelated data.",
  },
  {
    name: "delivery-loop",
    group: "OPS",
    purpose: "Deliver concurrent issue-to-merge work with leases and worktrees.",
    when: "Use when several tasks must ship in parallel without local conflicts.",
    contract: "Touch-scope leases. Per-task worktrees. Computed score. Gated merge.",
  },
  {
    name: "taste",
    group: "OPS",
    purpose: "Apply judgment, collaboration, and clear execution behavior.",
    when: "Use when work benefits from Taste Main or agent roles.",
    contract: "Main, Sub, and Independent roles. Automatic Codex steering.",
  },
  {
    name: "az-clean-code",
    group: "ARCH",
    purpose: "Keep application logic explicit, flat, reusable, and data-driven.",
    when: "Use when authoring, reviewing, or refactoring application behavior.",
    contract: "C1-C7 acceptance. Schema before logic. Automated structural checks.",
  },
  {
    name: "godot-3-dev",
    group: "ARCH",
    purpose: "Write, review, and down-port Godot 3.6 GDScript with safe virtuals.",
    when: "Use when a task targets Godot 3.x, GDScript, scenes, or 4.x down-porting.",
    contract: "No re-called virtuals. 3.6-only symbols. Version pinned before code.",
  },
  {
    name: "style-presets",
    group: "INTERFACE",
    purpose: "Resolve a named style, a keyword, or a loading state to one maintained preset.",
    when: "Use when a request names a style or needs a loader, spinner, or progress indicator.",
    contract: "One preset per artifact. Prefixed tokens. Both themes verified. Reduced-motion pose.",
  },
  {
    name: "scientific-figures",
    group: "VISUAL",
    purpose: "Draw medical and scientific schematics as validated, editable SVG.",
    when: "Use for pathway, mechanism, or figure requests, including SciPrism redraws.",
    contract: "Preserve relationships and ratio. Real text. Named groups. Render inspection.",
  },
];

const DEFAULT_SELECTED = "ui-design";

// The terminal adapter reads canonical material roles; it never paints a canvas.
const stylesheet = readFileSync(new URL("../wabi-press.css", import.meta.url), "utf8");
const material = stylesheet.slice(stylesheet.indexOf("/* Wabi Press material tokens:"), stylesheet.indexOf("   2 · Workbench"));
const blocks = [...material.matchAll(/:root(?:\[data-theme="dark"\])?\s*\{([\s\S]*?)\}/g)];
if (blocks.length !== 2) throw new Error("Expected light and dark Wabi Press material blocks.");
const roleTokens: Record<PaletteRole, string> = {
  accent: "accent-cinnabar",
  muted: "text-muted",
  border: "text-muted",
  success: "accent-moss",
  warning: "accent-ochre",
  danger: "accent-cinnabar",
};

function hexToRgb(hex: string): Rgb {
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return [red, green, blue];
}

function buildPalette(theme: ThemeName, index: number): Palette {
  const block = blocks[index];
  if (!block) throw new Error("Missing Wabi Press material block for " + theme);
  const body = block[1];
  if (body === undefined) throw new Error("Missing Wabi Press material body for " + theme);
  const values = new Map<string, string>();
  for (const match of body.matchAll(/--([\w-]+):\s*#([0-9a-f]{6})\s*;/gi)) {
    const [, token, hex] = match;
    if (token && hex) values.set(token, hex);
  }
  const read = (token: string): Rgb => {
    const hex = values.get(token);
    if (!hex) throw new Error("Missing terminal color role: " + theme + " " + token);
    return hexToRgb(hex);
  };
  return {
    accent: read(roleTokens.accent),
    muted: read(roleTokens.muted),
    border: read(roleTokens.border),
    success: read(roleTokens.success),
    warning: read(roleTokens.warning),
    danger: read(roleTokens.danger),
  };
}

const THEMES: Record<ThemeName, Palette> = {
  light: buildPalette("light", 0),
  dark: buildPalette("dark", 1),
};

const WIDE: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xa960, 0xa97f],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f300, 0x1faff],
  [0x20000, 0x3fffd],
];

const ANSI_RE = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))/g;
const ZERO_RE = /\p{Mn}|\p{Me}|\p{Cf}/u;
const COLOR_MODES: ReadonlySet<string> = new Set(["auto", "truecolor", "256", "16", "none"]);

function isColorMode(value: string | undefined): value is ColorMode {
  return value !== undefined && COLOR_MODES.has(value);
}
const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

function isWide(codePoint: number): boolean {
  return WIDE.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function codePointWidth(codePoint: number): number {
  if (codePoint === 0) return 0;
  if (codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  const character = String.fromCodePoint(codePoint);
  if (ZERO_RE.test(character)) return 0;
  return isWide(codePoint) ? 2 : 1;
}

function graphemes(text: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function stripAnsi(text: string): string {
  return String(text).replace(ANSI_RE, "");
}

function stringWidth(text: string): number {
  let width = 0;
  for (const grapheme of graphemes(stripAnsi(text))) {
    for (const character of grapheme) {
      const codePoint = character.codePointAt(0);
      if (codePoint !== undefined) width += codePointWidth(codePoint);
    }
  }
  return width;
}

function sanitize(text: string): string {
  return String(text)
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/[\u{e000}-\u{f8ff}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]/gu, "")
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1f1e6}-\u{1f1ff}\u{20e3}\u{fe0f}]/gu, "");
}

function truncate(text: string, maxWidth: number, ellipsis: string): string {
  const clean = sanitize(text);
  if (maxWidth <= 0) return "";
  if (stringWidth(clean) <= maxWidth) return clean;
  const ellipsisWidth = stringWidth(ellipsis);
  if (maxWidth <= ellipsisWidth) return ".".repeat(maxWidth);
  let output = "";
  let used = 0;
  for (const grapheme of graphemes(clean)) {
    const width = stringWidth(grapheme);
    if (used + width + ellipsisWidth > maxWidth) break;
    output += grapheme;
    used += width;
  }
  return output + ellipsis;
}

function truncateMiddle(text: string, maxWidth: number, ellipsis: string): string {
  const clean = sanitize(text);
  if (stringWidth(clean) <= maxWidth) return clean;
  const ellipsisWidth = stringWidth(ellipsis);
  if (maxWidth <= ellipsisWidth + 2) return truncate(clean, maxWidth, ellipsis);
  const available = maxWidth - ellipsisWidth;
  const headWidth = Math.max(1, Math.floor(available * 0.55));
  const tailWidth = Math.max(1, available - headWidth);
  const parts = graphemes(clean);
  let head = "";
  let used = 0;
  for (const grapheme of parts) {
    const width = stringWidth(grapheme);
    if (used + width > headWidth) break;
    head += grapheme;
    used += width;
  }
  let tail = "";
  used = 0;
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const grapheme = parts[index];
    if (grapheme === undefined) break;
    const width = stringWidth(grapheme);
    if (used + width > tailWidth) break;
    tail = grapheme + tail;
    used += width;
  }
  return head + ellipsis + tail;
}

function wrapText(text: string, maxWidth: number): string[] {
  const clean = sanitize(text).replace(/\s+/g, " ").trim();
  if (!clean) return [""];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (stringWidth(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    if (stringWidth(word) <= maxWidth) {
      current = word;
      continue;
    }
    let part = "";
    for (const grapheme of graphemes(word)) {
      if (stringWidth(part + grapheme) > maxWidth) {
        if (part) lines.push(part);
        part = grapheme;
      } else {
        part += grapheme;
      }
    }
    current = part;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function makeStyle(colorMode: ColorMode, theme: ThemeName): Style {
  const palette = THEMES[theme];
  const fg = (rgb: Rgb): string => "38;2;" + rgb.join(";");

  function codes(role: Role): SgrCode[] {
    if (role === "text") return [];
    if (role === "textBold") return [1];
    if (role === "underline") return [4];
    if (role === "reverse") return [7];
    if (colorMode === "none") return [];

    if (colorMode === "16") {
      if (role === "muted" || role === "border") return [90];
      if (role === "accent") return [31];
      if (role === "accentBold") return [31, 1];
      if (role === "success") return [32];
      if (role === "warning") return [33];
      if (role === "danger") return [31];
      return [];
    }

    if (colorMode === "256") {
      if (role === "muted") return ["38;5;" + (theme === "dark" ? "247" : "242")];
      if (role === "border") return ["38;5;" + (theme === "dark" ? "247" : "242")];
      if (role === "accent") return ["38;5;" + (theme === "dark" ? "174" : "131")];
      if (role === "accentBold") {
        return ["38;5;" + (theme === "dark" ? "174" : "131"), "1"];
      }
      if (role === "success") return ["38;5;" + (theme === "dark" ? "108" : "65")];
      if (role === "warning") return ["38;5;" + (theme === "dark" ? "179" : "94")];
      if (role === "danger") return ["38;5;" + (theme === "dark" ? "174" : "131")];
      return [];
    }

    if (role === "muted") return [fg(palette.muted)];
    if (role === "border") return [fg(palette.border)];
    if (role === "accent") return [fg(palette.accent)];
    if (role === "accentBold") return [fg(palette.accent), "1"];
    if (role === "success") return [fg(palette.success)];
    if (role === "warning") return [fg(palette.warning)];
    if (role === "danger") return [fg(palette.danger)];
    return [];
  }

  return function style(role: Role, text: unknown): string {
    const value = String(text);
    if (colorMode === "none" || role === "text" || !value) return value;
    const sequence = codes(role);
    if (!sequence.length) return value;
    return "\x1b[" + sequence.join(";") + "m" + value + "\x1b[0m";
  };
}

function glyphs(ascii: boolean): Glyphs {
  if (ascii) {
    return {
      marker: ">",
      chevron: ">",
      check: "OK",
      cross: "x",
      ellipsis: "...",
      h: "-",
      v: "|",
      bullet: "*",
    };
  }
  return {
    marker: "\u258c",
    chevron: "\u203a",
    check: "\u2713",
    cross: "\u00d7",
    ellipsis: "\u2026",
    h: "\u2500",
    v: "\u2502",
    bullet: "\u2022",
  };
}

function segmentWidth(segments: readonly Segment[]): number {
  return segments.reduce((total, item) => total + stringWidth(sanitize(item.t || "")), 0);
}

function renderSegments(
  segments: readonly Segment[],
  width: number,
  style: Style,
  ellipsis: string,
): string {
  let output = "";
  let used = 0;
  for (const item of segments) {
    if (used >= width) break;
    const text = sanitize(item.t || "");
    if (!text) continue;
    const room = width - used;
    const textWidth = stringWidth(text);
    if (textWidth > room) {
      const cut = truncate(text, room, ellipsis);
      output += style(item.r || "text", cut);
      used += stringWidth(cut);
      break;
    }
    output += style(item.r || "text", text);
    used += textWidth;
  }
  return output + " ".repeat(Math.max(0, width - used));
}

function fitPair(
  left: readonly Segment[],
  right: readonly Segment[],
  width: number,
  style: Style,
  ellipsis: string,
): string {
  const rightWidth = Math.min(stringWidth(segmentText(right)), width);
  const leftLimit = Math.max(0, width - rightWidth - (rightWidth ? 1 : 0));
  const leftWidth = Math.min(segmentWidth(left), leftLimit);
  const leftText = renderSegments(left, leftWidth, style, ellipsis);
  const rightText = renderSegments(right, rightWidth, style, ellipsis);
  const gap = Math.max(0, width - leftWidth - rightWidth);
  return leftText + " ".repeat(gap) + rightText;
}

function segmentText(segments: readonly Segment[]): string {
  return segments.map((item) => sanitize(item.t || "")).join("");
}

function padDisplay(text: string, width: number): string {
  const used = stringWidth(text);
  if (used > width) {
    throw new RangeError("pane line exceeds " + width + " cells");
  }
  return used === width ? text : text + " ".repeat(width - used);
}

function headerLine(
  width: number,
  options: ResolvedOptions,
  style: Style,
  glyph: Glyphs,
): string {
  const left: Segment[] = [
    { t: "AzSkills", r: "textBold" },
    { t: " / ", r: "muted" },
    { t: "Skills", r: "muted" },
  ];
  let right = MODULES.length + " skills";
  if (width >= 80) right += " / " + options.theme;
  if (width >= 100) right += " / " + options.density;
  if (stringWidth(right) > Math.floor(width * 0.5)) right = MODULES.length + " skills";
  return fitPair(left, [{ t: right, r: "muted" }], width, style, glyph.ellipsis);
}

function buildRail(height: number, style: Style, glyph: Glyphs): string[] {
  const items: readonly (readonly [string, string])[] = [
    ["S", "Skills"],
    ["/", "Search"],
    ["V", "Validate"],
    ["?", "Help"],
  ];
  const lines: string[] = [];
  for (let index = 0; index < height; index += 1) {
    const item = items[index];
    if (!item) {
      lines.push(" ".repeat(4));
      continue;
    }
    const active = index === 0;
    const marker = active ? glyph.marker : " ";
    lines.push(
      renderSegments(
        [
          { t: marker, r: active ? "accent" : "muted" },
          { t: item[0], r: active ? "textBold" : "muted" },
        ],
        4,
        style,
        glyph.ellipsis,
      ),
    );
  }
  return lines;
}

function buildList(
  width: number,
  height: number,
  options: ResolvedOptions,
  style: Style,
  glyph: Glyphs,
): string[] {
  const lines: string[] = [];
  const searchText = width >= 28 ? "Search skills" : "Search";
  const visible = Math.min(MODULES.length, Math.max(1, height - 2));
  const selectedIndex = MODULES.findIndex((item) => item.name === options.selected);
  const start =
    selectedIndex >= visible
      ? Math.min(selectedIndex - visible + 1, MODULES.length - visible)
      : 0;
  const end = start + visible;
  const range = start + 1 + "-" + end + "/" + MODULES.length;
  lines.push(
    fitPair(
      [{ t: "MODULES", r: "textBold" }],
      [{ t: "ALL " + range, r: "muted" }],
      width,
      style,
      glyph.ellipsis,
    ),
  );
  lines.push(
    renderSegments(
      [
        { t: "[", r: "accent" },
        { t: " / ", r: "accentBold" },
        { t: searchText, r: "underline" },
        { t: " ]", r: "accent" },
      ],
      width,
      style,
      glyph.ellipsis,
    ),
  );

  const showCategory = width >= 28;
  for (const skill of MODULES.slice(start, end)) {
    if (lines.length >= height) break;
    const selected = skill.name === options.selected;
    const maxName = width - 2 - (showCategory ? stringWidth(skill.group) + 2 : 0);
    const name = truncate(skill.name, Math.max(6, maxName), glyph.ellipsis);
    const segments: Segment[] = [
      { t: selected ? glyph.marker : " ", r: selected ? "accent" : "text" },
      { t: " ", r: "text" },
      { t: name, r: selected ? "textBold" : "text" },
    ];
    if (showCategory) {
      const gap = Math.max(2, width - 2 - stringWidth(name) - stringWidth(skill.group));
      segments.push({ t: " ".repeat(gap), r: "text" });
      segments.push({ t: skill.group, r: "muted" });
    }
    lines.push(renderSegments(segments, width, style, glyph.ellipsis));
  }

  while (lines.length < height) lines.push(" ".repeat(width));
  return lines;
}

function pushWrapped(
  lines: string[],
  text: string,
  width: number,
  firstPrefix: string,
  restPrefix: string,
  style: Style,
  glyph: Glyphs,
): void {
  const bodyWidth = Math.max(8, width - stringWidth(firstPrefix));
  const wrapped = wrapText(text, bodyWidth);
  for (let index = 0; index < wrapped.length; index += 1) {
    const prefix = index === 0 ? firstPrefix : restPrefix;
    lines.push(prefix + wrapped[index]);
  }
}

function buildDetail(
  width: number,
  height: number,
  options: ResolvedOptions,
  style: Style,
  glyph: Glyphs,
): string[] {
  const skill = MODULES.find((item) => item.name === options.selected) ?? MODULES[0];
  if (!skill) throw new Error("Preview module list is empty.");
  const purpose =
    skill.purpose || "Repository-local behavior contract for " + skill.name + ".";
  const when = skill.when || "Use when this capability owns the task.";
  const contract = skill.contract || "Read scope, constraints, workflow, and quality gates.";
  const measure = Math.min(width, 100);
  const sectionGap = width >= 100 && options.density === "comfortable" ? 2 : 1;
  const lines: string[] = [];
  const addGap = () => {
    for (let index = 0; index < sectionGap && lines.length < height; index += 1) {
      lines.push("");
    }
  };
  lines.push(
    fitPair(
      [{ t: skill.name, r: "textBold" }],
      [{ t: glyph.check, r: "success" }],
      width,
      style,
      glyph.ellipsis,
    ),
  );
  lines.push(style("muted", truncate(skill.group + " / core / verified", width, glyph.ellipsis)));
  lines.push(style("border", glyph.h.repeat(width)));
  for (const line of wrapText(purpose, measure)) {
    lines.push(truncate(line, width, glyph.ellipsis));
  }

  addGap();
  if (lines.length < height) {
    lines.push(style("textBold", truncate("WHEN TO USE", width, glyph.ellipsis)));
  }
  if (lines.length < height) {
    pushWrapped(lines, when, measure, glyph.bullet + " ", "  ", style, glyph);
  }

  addGap();
  if (lines.length < height) {
    lines.push(style("textBold", truncate("CONTRACT", width, glyph.ellipsis)));
  }
  if (lines.length < height) {
    pushWrapped(lines, contract, measure, glyph.bullet + " ", "  ", style, glyph);
  }

  if (width >= 70 && lines.length + sectionGap + 2 <= height) {
    addGap();
    lines.push(style("textBold", truncate("NEXT", width, glyph.ellipsis)));
    lines.push(
      style(
        "muted",
        truncate("[Enter] Open  [Tab] Focus  [?] Help", width, glyph.ellipsis),
      ),
    );
  }

  while (lines.length < height) lines.push("");
  return lines.slice(0, height);
}

function statusLine(
  width: number,
  options: ResolvedOptions,
  style: Style,
  glyph: Glyphs,
): string {
  const selected = options.selected;
  const left = width >= 52 ? selected + "  selected" : selected;
  const right = width >= 52 ? "? help  / search  q quit" : "? help  / search  Enter";
  return fitPair(
    [{ t: left, r: "muted" }],
    [{ t: right, r: "muted" }],
    width,
    style,
    glyph.ellipsis,
  );
}

function renderNarrow(options: RenderOptions & { width: number }): string {
  const width = Math.max(24, Math.min(39, Number(options.width) || 40));
  const requestedSelected = sanitize(options.selected || DEFAULT_SELECTED);
  const selected = MODULES.some((item) => item.name === requestedSelected)
    ? requestedSelected
    : DEFAULT_SELECTED;
  const lines = [
    "AzSkills",
    MODULES.length + " skills",
    "Selected: " + selected,
    "Enter open",
    "/ search",
    "? help",
  ];
  return lines.map((line) => truncate(line, width, "...")).join("\n") + "\n";
}

export function renderTui(options: RenderOptions = {}): string {
  const requestedWidth = Number(options.width);
  const width = Number.isFinite(requestedWidth)
    ? Math.max(24, Math.min(240, Math.trunc(requestedWidth)))
    : 80;
  const rows = Math.max(8, Math.min(60, Number(options.rows) || 18));
  const plain = Boolean(options.plain);
  if (width < 40) return renderNarrow({ ...options, width });
  const theme = options.theme === "light" ? "light" : "dark";
  const density = options.density === "comfortable" ? "comfortable" : "compact";
  const ascii = Boolean(options.ascii || plain);
  const rawColor = options.color || "auto";
  if (!isColorMode(rawColor)) {
    throw new RangeError("Unsupported colour mode: " + rawColor);
  }
  const environment = options.environment || process.env;
  const isTTY = options.isTTY === undefined ? process.stdout.isTTY : Boolean(options.isTTY);
  const environmentDisablesColor =
    environment.NO_COLOR !== undefined ||
    environment.CLICOLOR === "0" ||
    environment.TERM === "dumb";
  const requestedColor = plain || environmentDisablesColor ? "none" : rawColor;
  const color = requestedColor === "auto" ? detectColor(environment, isTTY) : requestedColor;
  const style = makeStyle(color, theme);
  const glyph = glyphs(ascii);
  const requestedSelected = sanitize(options.selected || DEFAULT_SELECTED);
  const selected = MODULES.some((item) => item.name === requestedSelected)
    ? requestedSelected
    : DEFAULT_SELECTED;
  const resolved: ResolvedOptions = { width, rows, theme, density, selected, plain, ascii, color };
  const lines: string[] = [];

  lines.push(headerLine(width, resolved, style, glyph));
  lines.push(style("border", glyph.h.repeat(width)));

  let body: string[] = [];
  if (width >= 100) {
    const railWidth = 4;
    const gutter = 2;
    const listWidth = Math.max(24, Math.min(32, Math.floor(width * 0.28)));
    const detailWidth = width - railWidth - gutter - listWidth - gutter;
    const rail = buildRail(rows, style, glyph);
    const list = buildList(listWidth, rows, resolved, style, glyph);
    const detail = buildDetail(detailWidth, rows, resolved, style, glyph).map((line) =>
      padDisplay(line, detailWidth),
    );
    const separator = style("border", glyph.v) + " ";
    for (let index = 0; index < rows; index += 1) {
      body.push(rail[index] + separator + list[index] + separator + detail[index]);
    }
  } else if (width >= 60) {
    const gutter = 2;
    const listWidth = Math.max(24, Math.min(32, Math.floor(width * 0.4)));
    const detailWidth = width - listWidth - gutter;
    const list = buildList(listWidth, rows, resolved, style, glyph);
    const detail = buildDetail(detailWidth, rows, resolved, style, glyph).map((line) =>
      padDisplay(line, detailWidth),
    );
    const separator = style("border", glyph.v) + " ";
    for (let index = 0; index < rows; index += 1) {
      body.push(list[index] + separator + detail[index]);
    }
  } else {
    body = buildList(width, rows, resolved, style, glyph);
  }

  lines.push(...body);
  lines.push(style("border", glyph.h.repeat(width)));
  lines.push(statusLine(width, resolved, style, glyph));
  return lines.join("\n") + "\n";
}

function detectColor(
  environment: Record<string, string | undefined> = process.env,
  isTTY: boolean | undefined = process.stdout.isTTY,
): ColorMode {
  if (
    environment.NO_COLOR !== undefined ||
    environment.CLICOLOR === "0" ||
    environment.TERM === "dumb" ||
    !isTTY
  ) {
    return "none";
  }
  if (String(environment.COLORTERM || "").toLowerCase() === "truecolor") {
    return "truecolor";
  }
  if (String(environment.TERM || "").includes("256color")) return "256";
  return "16";
}

function hasBackgroundColor(output: string): boolean {
  const pattern = /\x1b\[([0-9;:]*)m/g;
  let match = pattern.exec(output);
  while (match) {
    const params = (match[1] ?? "").split(";");
    for (let index = 0; index < params.length; index += 1) {
      const param = params[index];
      if (param === undefined) continue;
      const head = param.split(":")[0];
      if (head === undefined) continue;
      const code = Number(head);
      if (head === "48" || (code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        return true;
      }
      if (head === "38" || head === "48" || head === "58") {
        if (param.includes(":")) continue;
        const mode = params[index + 1];
        if (mode === "5") index += 2;
        else if (mode === "2") index += 4;
      }
    }
    match = pattern.exec(output);
  }
  return false;
}

function auditSafety(output: string, label: string, issues: string[]): void {
  if (/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1f1e6}-\u{1f1ff}\u{20e3}\u{fe0f}\u{e000}-\u{f8ff}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]/u.test(output)) {
    issues.push("emoji or Private Use Area glyph at " + label);
  }
  if (hasBackgroundColor(output)) {
    issues.push("terminal background colour at " + label);
  }
  if (output.includes("\x1b]")) {
    issues.push("OSC sequence at " + label);
  }
}

function stateFixture(color: ColorMode, theme: ThemeName, ascii: boolean): string {
  const style = makeStyle(color, theme);
  const glyph = glyphs(ascii);
  const line = (segments: readonly Segment[]): string =>
    renderSegments(segments, 40, style, glyph.ellipsis);
  return [
    line([{ t: glyph.marker, r: "accent" }, { t: " selected", r: "textBold" }]),
    line([{ t: "[", r: "accent" }, { t: " focus ", r: "underline" }, { t: "]", r: "accent" }]),
    line([{ t: glyph.check, r: "success" }, { t: " success", r: "text" }]),
    line([{ t: "!", r: "warning" }, { t: " warning", r: "text" }]),
    line([{ t: glyph.cross, r: "danger" }, { t: " error", r: "text" }]),
  ].join("\n");
}

function checkFrame(
  width: number,
  color: ColorMode,
  theme: ThemeName,
  density: Density,
): FrameResult {
  const issues: string[] = [];
  let output = "";
  try {
    output = renderTui({ width, color, theme, density, rows: 18, environment: {} });
  } catch (error) {
    issues.push("render failed at " + width + "/" + color + ": " + errorMessage(error));
    return { issues, output };
  }
  const lines = output.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (lines.length !== 22) {
    issues.push("unexpected line count at " + width + "/" + color + ": " + lines.length);
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    const measured = stringWidth(line);
    if (measured !== width) {
      issues.push(
        "width mismatch at " + width + "/" + color + " line " + (index + 1) + ": " + measured,
      );
    }
    if (line.includes("\t")) {
      issues.push("tab at " + width + "/" + color + " line " + (index + 1));
    }
  }
  if (color === "none" && output.includes("\x1b")) {
    issues.push("ANSI in no-colour frame at " + width);
  }
  if (output.includes("\x1b]")) {
    issues.push("OSC sequence at " + width + "/" + color);
  }
  auditSafety(output, width + "/" + color, issues);
  if (color === "truecolor" && !output.includes("38;2;")) {
    issues.push("truecolor SGR missing at " + width);
  }
  if (color === "256" && !output.includes("38;5;")) {
    issues.push("256-colour SGR missing at " + width);
  }
  if (color === "16" && !output.includes("\x1b[31")) {
    issues.push("16-colour accent SGR missing at " + width);
  }
  for (const required of ["AzSkills", "MODULES", "ui-design"]) {
    if (!output.includes(required)) {
      issues.push("missing " + required + " at " + width + "/" + color);
    }
  }
  return { issues, output };
}

function runCheck(): CheckResult {
  const issues: string[] = [];
  let frames = 0;
  try {
    const registry: unknown = JSON.parse(
      readFileSync(new URL("../../skills.json", import.meta.url), "utf8"),
    );
    if (!isRecord(registry) || !Array.isArray(registry.modules)) {
      throw new Error("skills.json must contain a modules array");
    }
    const registered = registry.modules
      .map((skill) => (isRecord(skill) && typeof skill.id === "string" ? skill.id : ""))
      .join(",");
    const rendered = MODULES.map((skill) => skill.name).join(",");
    if (registered !== rendered) issues.push("preview skill list drifted from skills.json");
  } catch (error) {
    issues.push("cannot read skills.json: " + errorMessage(error));
  }
  const widths: number[] = [40, 60, 80, 100, 120, 140, 160];
  const colorModes: readonly ColorMode[] = ["truecolor", "256", "16", "none"];
  const themeNames: readonly ThemeName[] = ["light", "dark"];
  const densities: readonly Density[] = ["compact", "comfortable"];
  for (const width of widths) {
    for (const color of colorModes) {
      for (const theme of themeNames) {
        for (const density of densities) {
          frames += 1;
          issues.push(...checkFrame(width, color, theme, density).issues);
        }
      }
    }
  }

  for (const width of [40, 80, 120]) {
    frames += 1;
    let output = "";
    try {
      output = renderTui({
        width,
        color: "none",
        ascii: true,
        plain: true,
        theme: "light",
        density: "comfortable",
        rows: 18,
      });
    } catch (error) {
      issues.push("plain render failed at " + width + ": " + errorMessage(error));
      continue;
    }
    if (/[^\x00-\x7f]/.test(output)) {
      issues.push("non-ASCII in plain frame at " + width);
    }
    if (output.includes("\x1b")) issues.push("ANSI in plain frame at " + width);
  }

  const narrowWidths: number[] = [24, 30, 39];
  for (const width of narrowWidths) {
    frames += 1;
    let output = "";
    try {
      output = renderTui({ width, plain: true, rows: 18 });
    } catch (error) {
      issues.push("narrow render failed at " + width + ": " + errorMessage(error));
      continue;
    }
    const lines = output.split("\n").filter((line) => line.length > 0);
    if (/[^\x00-\x7f]/.test(output)) issues.push("non-ASCII in narrow frame at " + width);
    if (output.includes("\x1b")) issues.push("ANSI in narrow frame at " + width);
    if (lines.some((line) => stringWidth(line) > width)) {
      issues.push("narrow line overflow at " + width);
    }
    if (output.includes("---")) issues.push("narrow frame still draws a rule at " + width);
    if (!output.includes("Enter open")) issues.push("narrow action missing at " + width);
  }

  const hostile = "A\x1b]0;title\x07B\x1b[31mC\x9b\u2705\u{1f3fb}";
  if (sanitize(hostile) !== "ABC") {
    issues.push("sanitize did not strip terminal control sequences");
  }

  const backgroundCases: readonly (readonly [string, boolean])[] = [
    ["\x1b[48mX", true],
    ["\x1b[48;5;17mX", true],
    ["\x1b[48:2:1:2:3mX", true],
    ["\x1b[41mX", true],
    ["\x1b[104mX", true],
    ["\x1b[38;5;48mX", false],
    ["\x1b[38;2;48;1;2mX", false],
  ];
  for (const [sequence, expected] of backgroundCases) {
    if (hasBackgroundColor(sequence) !== expected) {
      issues.push("background detection failed for " + JSON.stringify(sequence));
    }
  }

  if (stringWidth("\u6280\u80fd") !== 4) {
    issues.push("CJK width is not two cells per ideograph");
  }
  if (stringWidth("e\u0301") !== 1) {
    issues.push("combining mark width is not zero");
  }
  if (stringWidth(truncate("\u6280\u80fd", 3, "\u2026")) !== 3) {
    issues.push("wide-character truncation exceeds its budget");
  }

  frames += 1;
  const unicodeFrame = renderTui({
    width: 80,
    color: "truecolor",
    theme: "dark",
    density: "compact",
    rows: 18,
  });
  auditSafety(unicodeFrame, "unicode sample", issues);

  for (const color of ["truecolor", "256", "16", "none"] as const) {
    for (const theme of ["light", "dark"] as const) {
      frames += 1;
      const fixture = stateFixture(color, theme, false);
      const glyph = glyphs(false);
      for (const cue of [glyph.marker, "[", glyph.check, "!", glyph.cross]) {
        if (!fixture.includes(cue)) {
          issues.push("state cue " + cue + " missing in " + color + "/" + theme);
        }
      }
      if (color !== "none") {
        if (!fixture.includes("\x1b[1m")) {
          issues.push("selection bold missing in " + color + "/" + theme);
        }
        if (!fixture.includes("\x1b[4m")) {
          issues.push("focus underline missing in " + color + "/" + theme);
        }
      }
      const roleCodes: readonly string[] =
        color === "16"
          ? ["\x1b[32", "\x1b[33", "\x1b[31"]
          : color === "256"
            ? [
                "38;5;" + (theme === "dark" ? "108" : "65"),
                "38;5;" + (theme === "dark" ? "179" : "94"),
                "38;5;" + (theme === "dark" ? "174" : "131"),
              ]
            : color === "truecolor"
              ? (["success", "warning", "danger"] as const).map(
                  (role) => "38;2;" + THEMES[theme][role].join(";"),
                )
              : [];
      for (const code of roleCodes) {
        if (!fixture.includes(code)) {
          issues.push("state colour " + code + " missing in " + color + "/" + theme);
        }
      }
      if (color === "none" && fixture.includes("\x1b")) {
        issues.push("ANSI in no-colour state fixture");
      }
    }
  }
  frames += 1;
  const asciiFixture = stateFixture("none", "dark", true);
  for (const cue of [">", "OK", "x"]) {
    if (!asciiFixture.includes(cue)) {
      issues.push("ASCII state cue " + cue + " missing");
    }
  }

  const colorCases: readonly (readonly [Record<string, string>, boolean, ColorMode])[] = [
    [{ NO_COLOR: "1" }, true, "none"],
    [{ CLICOLOR: "0" }, true, "none"],
    [{ TERM: "dumb" }, true, "none"],
    [{ TERM: "xterm-256color" }, true, "256"],
    [{ TERM: "xterm", COLORTERM: "truecolor" }, true, "truecolor"],
    [{}, false, "none"],
  ];
  for (const [environment, tty, expected] of colorCases) {
    if (detectColor(environment, tty) !== expected) {
      issues.push("colour detection mismatch for " + JSON.stringify(environment));
    }
  }

  frames += 1;
  const hostileSelected = renderTui({
    width: 80,
    plain: true,
    selected: "A\x1b[31mRED\nFORGED",
  });
  if (hostileSelected.includes("\x1b") || hostileSelected.includes("FORGED\n")) {
    issues.push("hostile selected label reached the terminal");
  }
  if (hostileSelected.split("\n").length !== 23) {
    issues.push("hostile selected label changed the frame line count");
  }

  frames += 1;
  const plainApi = renderTui({ width: 80, plain: true, rows: 18 });
  if (plainApi.includes("\x1b")) {
    issues.push("plain API emitted ANSI");
  }

  frames += 1;
  const envNoColor = renderTui({
    width: 80,
    color: "truecolor",
    environment: { NO_COLOR: "1" },
  });
  if (envNoColor.includes("\x1b")) {
    issues.push("NO_COLOR did not override explicit colour");
  }
  frames += 1;
  const envColor = renderTui({ width: 80, color: "truecolor", environment: {} });
  if (!envColor.includes("\x1b")) {
    issues.push("explicit truecolor was suppressed without NO_COLOR");
  }

  frames += 1;
  const puaSelected = renderTui({
    width: 80,
    plain: true,
    selected: "ui-design \u{e000}",
  });
  if (/[\u{e000}-\u{f8ff}]/u.test(puaSelected)) {
    issues.push("Private Use Area label reached the terminal");
  }

  frames += 1;
  const unknownSelected = renderTui({ width: 80, plain: true, selected: "not-a-skill" });
  if (!/ui-design\s+selected/u.test(unknownSelected)) {
    issues.push("unknown selection was not normalized");
  }

  return {
    ok: issues.length === 0,
    frames,
    widths,
    narrowWidths,
    issues: issues.slice(0, 20),
  };
}

function usage(): string {
  return [
    "AzSkills terminal preview",
    "",
    "Usage: node design-system/tui/preview.ts [options]",
    "",
    "Options:",
    "  --width <cols>       Columns, 24-240; CI matrix covers 40-160 (default 80)",
    "  --rows <count>       Body rows, 8-60 (default 18)",
    "  --theme <name>       light or dark (default dark)",
    "  --density <name>     compact or comfortable (default compact)",
    "  --color <mode>       auto, truecolor, 256, 16, none (default auto)",
    "  --ascii              ASCII glyphs; colour still follows --color",
    "  --plain              No ANSI, ASCII glyphs, logs and screen readers",
    "  --selected <name>    Selected skill row (default ui-design)",
    "  --check              Run the conformance matrix and print JSON",
    "  --help               Show this message",
    "",
  ].join("\n");
}

function parseNumber(value: string | undefined, name: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error("Invalid " + name + ": " + value);
  }
  return Math.trunc(parsed);
}

function isThemeName(value: string | undefined): value is ThemeName {
  return value === "light" || value === "dark";
}

function isDensity(value: string | undefined): value is Density {
  return value === "compact" || value === "comfortable";
}

function parseArgs(args: readonly string[]): ParsedOptions {
  const raw: RawOptions = {
    width: 80,
    rows: 18,
    theme: "dark",
    density: "compact",
    color: "auto",
    ascii: false,
    plain: false,
    selected: "ui-design",
    check: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (arg === "--help" || arg === "-h") {
      raw.help = true;
    } else if (arg === "--check") {
      raw.check = true;
    } else if (arg === "--ascii") {
      raw.ascii = true;
    } else if (arg === "--plain") {
      raw.plain = true;
    } else if (arg.startsWith("--width=")) {
      raw.width = parseNumber(arg.slice(8), "width", 24, 240);
    } else if (arg === "--width") {
      raw.width = parseNumber(args[index + 1], "width", 24, 240);
      index += 1;
    } else if (arg.startsWith("--rows=")) {
      raw.rows = parseNumber(arg.slice(7), "rows", 8, 60);
    } else if (arg === "--rows") {
      raw.rows = parseNumber(args[index + 1], "rows", 8, 60);
      index += 1;
    } else if (arg.startsWith("--theme=")) {
      raw.theme = arg.slice(8);
    } else if (arg === "--theme") {
      raw.theme = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--density=")) {
      raw.density = arg.slice(10);
    } else if (arg === "--density") {
      raw.density = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--color=")) {
      raw.color = arg.slice(8);
    } else if (arg === "--color") {
      raw.color = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--selected=")) {
      raw.selected = arg.slice(11);
    } else if (arg === "--selected") {
      raw.selected = args[index + 1];
      index += 1;
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }
  if (!isThemeName(raw.theme)) {
    throw new Error("Invalid theme: " + raw.theme);
  }
  if (!isDensity(raw.density)) {
    throw new Error("Invalid density: " + raw.density);
  }
  if (!isColorMode(raw.color)) {
    throw new Error("Invalid colour mode: " + raw.color);
  }
  return {
    width: raw.width,
    rows: raw.rows,
    theme: raw.theme,
    density: raw.density,
    color: raw.color,
    ascii: raw.ascii,
    plain: raw.plain,
    selected: raw.selected ?? "ui-design",
    check: raw.check,
    help: raw.help,
  };
}

function main(): void {
  let options: ParsedOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(errorMessage(error) + "\n");
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  if (options.check) {
    const result = runCheck();
    process.stdout.write(JSON.stringify(result) + "\n");
    process.exitCode = result.ok ? 0 : 1;
    return;
  }
  if (options.plain) {
    options.ascii = true;
    options.color = "none";
  } else if (options.color === "auto") {
    options.color = detectColor();
  }
  try {
    process.stdout.write(renderTui(options));
  } catch (error) {
    process.stderr.write(errorMessage(error) + "\n");
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
