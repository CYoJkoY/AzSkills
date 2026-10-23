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

const SKILLS = [
  {
    name: "ultrathink",
    group: "CORE",
    purpose: "Deep reasoning overlay for ambiguous or high-risk work.",
    when: "Use when assumptions, alternatives, or failure modes need explicit analysis.",
    contract: "State assumptions. Compare alternatives. Record the decision.",
  },
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
    name: "ui-motion",
    group: "INTERFACE",
    purpose: "Design state transitions that preserve meaning and accessibility.",
    when: "Use when interaction needs motion or an existing motion needs review.",
    contract: "Named purpose. Smallest mechanism. Interruptible. Reduced-motion parity.",
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
    name: "readme-craft",
    group: "PUBLISH",
    purpose: "Design, rewrite, and audit evidence-first GitHub README pages.",
    when: "Use when a repository needs a readable and verifiable landing page.",
    contract: "Information architecture first. Verified links. Theme-safe SVG.",
  },
  {
    name: "steam-mod-page",
    group: "PUBLISH",
    purpose: "Write and audit Steam Workshop descriptions as clean BBCode.",
    when: "Use when a Mod needs a player-first or developer-first Workshop page.",
    contract: "BBCode only. Bilingual separation. Verified facts. Final lint.",
  },
  {
    name: "localization",
    group: "PUBLISH",
    purpose: "Translate game CSV rows with intact markup and clean escaping.",
    when: "Use when a localization batch or locale audit is requested.",
    contract: "Preserve schema. Protect BBCode. Complete every locale.",
  },
];

const DEFAULT_SELECTED = "ui-design";

const THEMES = {
  light: {
    accent: [11, 87, 208],
    muted: [102, 108, 120],
    border: [217, 221, 227],
    success: [19, 115, 51],
    warning: [138, 75, 0],
    danger: [179, 38, 30],
  },
  dark: {
    accent: [168, 199, 250],
    muted: [146, 153, 165],
    border: [56, 59, 67],
    success: [129, 201, 149],
    warning: [253, 214, 99],
    danger: [242, 184, 181],
  },
};

const WIDE = [
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
const COLOR_MODES = new Set(["auto", "truecolor", "256", "16", "none"]);
const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

function isWide(codePoint) {
  return WIDE.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function codePointWidth(codePoint) {
  if (codePoint === 0) return 0;
  if (codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  const character = String.fromCodePoint(codePoint);
  if (ZERO_RE.test(character)) return 0;
  return isWide(codePoint) ? 2 : 1;
}

function graphemes(text) {
  if (segmenter) {
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function stripAnsi(text) {
  return String(text).replace(ANSI_RE, "");
}

function stringWidth(text) {
  let width = 0;
  for (const grapheme of graphemes(stripAnsi(text))) {
    for (const character of grapheme) {
      width += codePointWidth(character.codePointAt(0));
    }
  }
  return width;
}

function sanitize(text) {
  return String(text)
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/[\u{e000}-\u{f8ff}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]/gu, "")
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1f1e6}-\u{1f1ff}\u{20e3}\u{fe0f}]/gu, "");
}

function truncate(text, maxWidth, ellipsis) {
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

function truncateMiddle(text, maxWidth, ellipsis) {
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
    const width = stringWidth(grapheme);
    if (used + width > tailWidth) break;
    tail = grapheme + tail;
    used += width;
  }
  return head + ellipsis + tail;
}

function wrapText(text, maxWidth) {
  const clean = sanitize(text).replace(/\s+/g, " ").trim();
  if (!clean) return [""];
  const words = clean.split(" ");
  const lines = [];
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

function makeStyle(colorMode, theme) {
  const palette = THEMES[theme];
  const fg = (rgb) => "38;2;" + rgb.join(";");

  function codes(role) {
    if (role === "text") return [];
    if (role === "textBold") return [1];
    if (role === "underline") return [4];
    if (role === "reverse") return [7];
    if (colorMode === "none") return [];

    if (colorMode === "16") {
      if (role === "muted" || role === "border") return [90];
      if (role === "accent") return [34];
      if (role === "accentBold") return [34, 1];
      if (role === "success") return [32];
      if (role === "warning") return [33];
      if (role === "danger") return [31];
      return [];
    }

    if (colorMode === "256") {
      if (role === "muted") return ["38;5;" + (theme === "dark" ? "246" : "244")];
      if (role === "border") return ["38;5;" + (theme === "dark" ? "238" : "240")];
      if (role === "accent") return ["38;5;" + (theme === "dark" ? "153" : "26")];
      if (role === "accentBold") {
        return ["38;5;" + (theme === "dark" ? "153" : "26"), "1"];
      }
      if (role === "success") return ["38;5;" + (theme === "dark" ? "114" : "28")];
      if (role === "warning") return ["38;5;" + (theme === "dark" ? "221" : "130")];
      if (role === "danger") return ["38;5;" + (theme === "dark" ? "217" : "160")];
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

  return function style(role, text) {
    const value = String(text);
    if (colorMode === "none" || role === "text" || !value) return value;
    const sequence = codes(role);
    if (!sequence.length) return value;
    return "\x1b[" + sequence.join(";") + "m" + value + "\x1b[0m";
  };
}

function glyphs(ascii) {
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

function segmentWidth(segments) {
  return segments.reduce((total, item) => total + stringWidth(sanitize(item.t || "")), 0);
}

function renderSegments(segments, width, style, ellipsis) {
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

function fitPair(left, right, width, style, ellipsis) {
  const rightWidth = Math.min(stringWidth(segmentText(right)), width);
  const leftLimit = Math.max(0, width - rightWidth - (rightWidth ? 1 : 0));
  const leftWidth = Math.min(segmentWidth(left), leftLimit);
  const leftText = renderSegments(left, leftWidth, style, ellipsis);
  const rightText = renderSegments(right, rightWidth, style, ellipsis);
  const gap = Math.max(0, width - leftWidth - rightWidth);
  return leftText + " ".repeat(gap) + rightText;
}

function segmentText(segments) {
  return segments.map((item) => sanitize(item.t || "")).join("");
}

function padDisplay(text, width) {
  const used = stringWidth(text);
  if (used > width) {
    throw new RangeError("pane line exceeds " + width + " cells");
  }
  return used === width ? text : text + " ".repeat(width - used);
}

function headerLine(width, options, style, glyph) {
  const left = [
    { t: "AzSkills", r: "textBold" },
    { t: " / ", r: "muted" },
    { t: "Skills", r: "muted" },
  ];
  let right = SKILLS.length + " skills";
  if (width >= 80) right += " / " + options.theme;
  if (width >= 100) right += " / " + options.density;
  if (stringWidth(right) > Math.floor(width * 0.5)) right = SKILLS.length + " skills";
  return fitPair(left, [{ t: right, r: "muted" }], width, style, glyph.ellipsis);
}

function buildRail(height, style, glyph) {
  const items = [
    ["S", "Skills"],
    ["/", "Search"],
    ["V", "Validate"],
    ["?", "Help"],
  ];
  const lines = [];
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

function buildList(width, height, options, style, glyph) {
  const lines = [];
  const searchText = width >= 28 ? "Search skills" : "Search";
  const visible = Math.min(SKILLS.length, Math.max(1, height - 2));
  const selectedIndex = SKILLS.findIndex((item) => item.name === options.selected);
  const start =
    selectedIndex >= visible
      ? Math.min(selectedIndex - visible + 1, SKILLS.length - visible)
      : 0;
  const end = start + visible;
  const range = start + 1 + "-" + end + "/" + SKILLS.length;
  lines.push(
    fitPair(
      [{ t: "SKILLS", r: "textBold" }],
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
  for (const skill of SKILLS.slice(start, end)) {
    if (lines.length >= height) break;
    const selected = skill.name === options.selected;
    const maxName = width - 2 - (showCategory ? stringWidth(skill.group) + 2 : 0);
    const name = truncate(skill.name, Math.max(6, maxName), glyph.ellipsis);
    const segments = [
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

function pushWrapped(lines, text, width, firstPrefix, restPrefix, style, glyph) {
  const bodyWidth = Math.max(8, width - stringWidth(firstPrefix));
  const wrapped = wrapText(text, bodyWidth);
  for (let index = 0; index < wrapped.length; index += 1) {
    const prefix = index === 0 ? firstPrefix : restPrefix;
    lines.push(prefix + wrapped[index]);
  }
}

function buildDetail(width, height, options, style, glyph) {
  const skill = SKILLS.find((item) => item.name === options.selected) || SKILLS[0];
  const purpose =
    skill.purpose || "Repository-local behavior contract for " + skill.name + ".";
  const when = skill.when || "Use when this capability owns the task.";
  const contract = skill.contract || "Read scope, constraints, workflow, and quality gates.";
  const measure = Math.min(width, 100);
  const sectionGap = width >= 100 && options.density === "comfortable" ? 2 : 1;
  const lines = [];
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

function statusLine(width, options, style, glyph) {
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

function renderNarrow(options) {
  const width = Math.max(24, Math.min(39, Number(options.width) || 40));
  const requestedSelected = sanitize(options.selected || DEFAULT_SELECTED);
  const selected = SKILLS.some((item) => item.name === requestedSelected)
    ? requestedSelected
    : DEFAULT_SELECTED;
  const lines = [
    "AzSkills",
    SKILLS.length + " skills",
    "Selected: " + selected,
    "Enter open",
    "/ search",
    "? help",
  ];
  return lines.map((line) => truncate(line, width, "...")).join("\n") + "\n";
}

export function renderTui(options = {}) {
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
  if (!COLOR_MODES.has(rawColor)) {
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
  const selected = SKILLS.some((item) => item.name === requestedSelected)
    ? requestedSelected
    : DEFAULT_SELECTED;
  const resolved = { width, rows, theme, density, selected, plain, ascii, color };
  const lines = [];

  lines.push(headerLine(width, resolved, style, glyph));
  lines.push(style("border", glyph.h.repeat(width)));

  let body = [];
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

function detectColor(environment = process.env, isTTY = process.stdout.isTTY) {
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

function hasBackgroundColor(output) {
  const pattern = /\x1b\[([0-9;:]*)m/g;
  let match = pattern.exec(output);
  while (match) {
    const params = match[1].split(";");
    for (let index = 0; index < params.length; index += 1) {
      const head = params[index].split(":")[0];
      const code = Number(head);
      if (head === "48" || (code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        return true;
      }
      if (head === "38" || head === "48" || head === "58") {
        if (params[index].includes(":")) continue;
        const mode = params[index + 1];
        if (mode === "5") index += 2;
        else if (mode === "2") index += 4;
      }
    }
    match = pattern.exec(output);
  }
  return false;
}

function auditSafety(output, label, issues) {
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

function stateFixture(color, theme, ascii) {
  const style = makeStyle(color, theme);
  const glyph = glyphs(ascii);
  const line = (segments) => renderSegments(segments, 40, style, glyph.ellipsis);
  return [
    line([{ t: glyph.marker, r: "accent" }, { t: " selected", r: "textBold" }]),
    line([{ t: "[", r: "accent" }, { t: " focus ", r: "underline" }, { t: "]", r: "accent" }]),
    line([{ t: glyph.check, r: "success" }, { t: " success", r: "text" }]),
    line([{ t: "!", r: "warning" }, { t: " warning", r: "text" }]),
    line([{ t: glyph.cross, r: "danger" }, { t: " error", r: "text" }]),
  ].join("\n");
}

function checkFrame(width, color, theme, density) {
  const issues = [];
  let output = "";
  try {
    output = renderTui({ width, color, theme, density, rows: 18, environment: {} });
  } catch (error) {
    issues.push("render failed at " + width + "/" + color + ": " + error.message);
    return { issues, output };
  }
  const lines = output.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (lines.length !== 22) {
    issues.push("unexpected line count at " + width + "/" + color + ": " + lines.length);
  }
  for (let index = 0; index < lines.length; index += 1) {
    const measured = stringWidth(lines[index]);
    if (measured !== width) {
      issues.push(
        "width mismatch at " + width + "/" + color + " line " + (index + 1) + ": " + measured,
      );
    }
    if (lines[index].includes("\t")) {
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
  if (color === "16" && !output.includes("\x1b[34")) {
    issues.push("16-colour accent SGR missing at " + width);
  }
  for (const required of ["AzSkills", "SKILLS", "ui-design"]) {
    if (!output.includes(required)) {
      issues.push("missing " + required + " at " + width + "/" + color);
    }
  }
  return { issues, output };
}

function runCheck() {
  const issues = [];
  let frames = 0;
  try {
    const registry = JSON.parse(readFileSync(new URL("../../skills.json", import.meta.url), "utf8"));
    const registered = registry.skills.map((skill) => skill.id).join(",");
    const rendered = SKILLS.map((skill) => skill.name).join(",");
    if (registered !== rendered) issues.push("preview skill list drifted from skills.json");
  } catch (error) {
    issues.push("cannot read skills.json: " + error.message);
  }
  const widths = [40, 60, 80, 100, 120, 140, 160];
  for (const width of widths) {
    for (const color of ["truecolor", "256", "16", "none"]) {
      for (const theme of ["light", "dark"]) {
        for (const density of ["compact", "comfortable"]) {
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
      issues.push("plain render failed at " + width + ": " + error.message);
      continue;
    }
    if (/[^\x00-\x7f]/.test(output)) {
      issues.push("non-ASCII in plain frame at " + width);
    }
    if (output.includes("\x1b")) issues.push("ANSI in plain frame at " + width);
  }

  const narrowWidths = [24, 30, 39];
  for (const width of narrowWidths) {
    frames += 1;
    let output = "";
    try {
      output = renderTui({ width, plain: true, rows: 18 });
    } catch (error) {
      issues.push("narrow render failed at " + width + ": " + error.message);
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

  const backgroundCases = [
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

  for (const color of ["truecolor", "256", "16", "none"]) {
    for (const theme of ["light", "dark"]) {
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
      const roleCodes =
        color === "16"
          ? ["\x1b[32", "\x1b[33", "\x1b[31"]
          : color === "256"
            ? [
                "38;5;" + (theme === "dark" ? "114" : "28"),
                "38;5;" + (theme === "dark" ? "221" : "130"),
                "38;5;" + (theme === "dark" ? "217" : "160"),
              ]
            : color === "truecolor"
              ? [
                  "38;2;" +
                    (theme === "dark" ? "129;201;149" : "19;115;51"),
                  "38;2;" +
                    (theme === "dark" ? "253;214;99" : "138;75;0"),
                  "38;2;" +
                    (theme === "dark" ? "242;184;181" : "179;38;30"),
                ]
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

  const colorCases = [
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

function usage() {
  return [
    "AzSkills terminal preview",
    "",
    "Usage: node design-system/tui/preview.mjs [options]",
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

function parseNumber(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error("Invalid " + name + ": " + value);
  }
  return Math.trunc(parsed);
}

function parseArgs(args) {
  const options = {
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
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--check") {
      options.check = true;
    } else if (arg === "--ascii") {
      options.ascii = true;
    } else if (arg === "--plain") {
      options.plain = true;
    } else if (arg.startsWith("--width=")) {
      options.width = parseNumber(arg.slice(8), "width", 24, 240);
    } else if (arg === "--width") {
      options.width = parseNumber(args[index + 1], "width", 24, 240);
      index += 1;
    } else if (arg.startsWith("--rows=")) {
      options.rows = parseNumber(arg.slice(7), "rows", 8, 60);
    } else if (arg === "--rows") {
      options.rows = parseNumber(args[index + 1], "rows", 8, 60);
      index += 1;
    } else if (arg.startsWith("--theme=")) {
      options.theme = arg.slice(8);
    } else if (arg === "--theme") {
      options.theme = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--density=")) {
      options.density = arg.slice(10);
    } else if (arg === "--density") {
      options.density = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--color=")) {
      options.color = arg.slice(8);
    } else if (arg === "--color") {
      options.color = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--selected=")) {
      options.selected = arg.slice(11);
    } else if (arg === "--selected") {
      options.selected = args[index + 1];
      index += 1;
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }
  if (!["light", "dark"].includes(options.theme)) {
    throw new Error("Invalid theme: " + options.theme);
  }
  if (!["compact", "comfortable"].includes(options.density)) {
    throw new Error("Invalid density: " + options.density);
  }
  if (!COLOR_MODES.has(options.color)) {
    throw new Error("Invalid colour mode: " + options.color);
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(error.message + "\n");
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
    process.stderr.write(error.message + "\n");
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
