#!/usr/bin/env node
/*
 * Scientific figure checker.
 *
 * Verifies that an SVG is genuinely editable, semantically labelled, and
 * publication-legible: no raster payload, no monolithic trace, real text at a
 * printable size, unique ids, the canvas ratio and short side the policy
 * requires, and text contrast on the surface it actually sits on.
 *
 * Usage:
 *   node scientific-figures/scripts/check-figure.ts --svg figure.svg
 *   node scientific-figures/scripts/check-figure.ts --svg figure.svg --json
 *   node scientific-figures/scripts/check-figure.ts --self-test
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { type Policy, loadPolicy, textWidth } from "./figure-model.ts";

export type Severity = "error" | "warning" | "info";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
}

interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  parent: number | null;
  children: number[];
  text: string;
  selfClosing: boolean;
  /** 1-based source line, for a finding the user can jump to. */
  line: number;
}

interface Document {
  elements: XmlElement[];
  roots: number[];
  errors: string[];
}

const NAME = /^[A-Za-z_][\w:.-]*/;

/** A deliberately small XML reader: enough to prove well-formedness and walk structure. */
function parseXml(source: string): Document {
  const elements: XmlElement[] = [];
  const roots: number[] = [];
  const stack: number[] = [];
  const errors: string[] = [];
  let index = 0;
  while (index < source.length) {
    const open = source.indexOf("<", index);
    if (open < 0) {
      appendText(source.slice(index));
      break;
    }
    if (open > index) appendText(source.slice(index, open));
    if (source.startsWith("<!--", open)) {
      const end = source.indexOf("-->", open + 4);
      if (end < 0) {
        errors.push("unterminated comment at line " + lineOf(open));
        break;
      }
      index = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", open)) {
      const end = source.indexOf("]]>", open + 9);
      if (end < 0) {
        errors.push("unterminated CDATA at line " + lineOf(open));
        break;
      }
      appendText(source.slice(open + 9, end));
      index = end + 3;
      continue;
    }
    if (source.startsWith("<?", open)) {
      const end = source.indexOf("?>", open + 2);
      if (end < 0) {
        errors.push("unterminated processing instruction at line " + lineOf(open));
        break;
      }
      index = end + 2;
      continue;
    }
    if (source.startsWith("<!", open)) {
      const end = source.indexOf(">", open + 2);
      if (end < 0) {
        errors.push("unterminated declaration at line " + lineOf(open));
        break;
      }
      index = end + 1;
      continue;
    }
    const end = source.indexOf(">", open);
    if (end < 0) {
      errors.push("unterminated tag at line " + lineOf(open));
      break;
    }
    const raw = source.slice(open + 1, end);
    const line = lineOf(open);
    if (raw.startsWith("/")) {
      const name = raw.slice(1).trim();
      const top = stack.pop();
      if (top === undefined) errors.push("stray closing tag </" + name + "> at line " + line);
      else if (elements[top]?.name !== name) {
        errors.push("mismatched tag: expected </" + (elements[top]?.name ?? "?") + "> but found </" + name + "> at line " + line);
      }
      index = end + 1;
      continue;
    }
    const selfClosing = raw.endsWith("/");
    const body = selfClosing ? raw.slice(0, -1) : raw;
    const nameMatch = NAME.exec(body);
    if (!nameMatch) {
      errors.push("unreadable tag at line " + line);
      index = end + 1;
      continue;
    }
    const name = nameMatch[0];
    const attributes: Record<string, string> = {};
    let cursor = name.length;
    while (cursor < body.length) {
      while (cursor < body.length && /\s/.test(body[cursor] ?? "")) cursor += 1;
      if (cursor >= body.length) break;
      const keyMatch = /^[^\s=/>]+/.exec(body.slice(cursor));
      if (!keyMatch) {
        errors.push("unreadable attribute in <" + name + "> at line " + line);
        break;
      }
      const key = keyMatch[0];
      cursor += key.length;
      while (cursor < body.length && /\s/.test(body[cursor] ?? "")) cursor += 1;
      if (body[cursor] !== "=") {
        errors.push("attribute " + key + " in <" + name + "> has no value at line " + line);
        break;
      }
      cursor += 1;
      while (cursor < body.length && /\s/.test(body[cursor] ?? "")) cursor += 1;
      const quote = body[cursor];
      if (quote !== '"' && quote !== "'") {
        errors.push("attribute " + key + " in <" + name + "> is unquoted at line " + line);
        break;
      }
      const close = body.indexOf(quote, cursor + 1);
      if (close < 0) {
        errors.push("attribute " + key + " in <" + name + "> is unterminated at line " + line);
        break;
      }
      if (key in attributes) errors.push("duplicate attribute " + key + " in <" + name + "> at line " + line);
      attributes[key] = body.slice(cursor + 1, close);
      cursor = close + 1;
    }
    const parent = stack.length > 0 ? stack[stack.length - 1] ?? null : null;
    const node: XmlElement = { name, attributes, parent, children: [], text: "", selfClosing, line };
    elements.push(node);
    const own = elements.length - 1;
    if (parent === null) roots.push(own);
    else elements[parent]?.children.push(own);
    if (!selfClosing) stack.push(own);
    index = end + 1;
    continue;
  }
  if (stack.length > 0) {
    for (const open of stack) errors.push("unclosed <" + (elements[open]?.name ?? "?") + "> at line " + (elements[open]?.line ?? 0));
  }
  return { elements, roots, errors };

  function appendText(raw: string): void {
    const top = stack[stack.length - 1];
    if (top === undefined) {
      if (raw.trim()) errors.push("text outside the root element: " + JSON.stringify(raw.trim().slice(0, 40)));
      return;
    }
    const target = elements[top];
    if (target) target.text += raw;
  }

  function lineOf(offset: number): number {
    let line = 1;
    for (let cursor = 0; cursor < offset && cursor < source.length; cursor += 1) {
      if (source[cursor] === "\n") line += 1;
    }
    return line;
  }
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
};

function parseColour(value: string | undefined): Rgb | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  const named = NAMED[raw] ?? (/^url\(/.test(raw) || raw === "none" || raw === "transparent" || raw === "currentcolor" ? null : raw);
  if (!named) return null;
  const hex = named.startsWith("#") ? named.slice(1) : "";
  if (hex.length === 3) {
    const [r = "", g = "", b = ""] = hex.split("");
    return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16) };
  }
  if (hex.length === 6) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  const functional = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(named);
  if (functional) {
    return { r: Number(functional[1]), g: Number(functional[2]), b: Number(functional[3]) };
  }
  return null;
}

const channel = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour: Rgb): number => 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);

function contrast(foreground: Rgb, background: Rgb): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return ((light ?? 0) + 0.05) / ((dark ?? 1) + 0.05);
}

const mix = (foreground: Rgb, background: Rgb, alpha: number): Rgb => ({
  r: foreground.r * alpha + background.r * (1 - alpha),
  g: foreground.g * alpha + background.g * (1 - alpha),
  b: foreground.b * alpha + background.b * (1 - alpha),
});

const toHex = (colour: Rgb): string =>
  "#" +
  [colour.r, colour.g, colour.b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("");

interface Surface {
  colour: Rgb;
  area: number;
  contains: (x: number, y: number) => boolean;
}

const pointInElement = (element: XmlElement, x: number, y: number): boolean => {
  const number = (key: string): number | null => {
    const value = element.attributes[key];
    if (value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  if (element.name === "rect") {
    const left = number("x") ?? 0;
    const top = number("y") ?? 0;
    const width = number("width") ?? 0;
    const height = number("height") ?? 0;
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
  if (element.name === "circle" || element.name === "ellipse") {
    const radiusX = element.name === "circle" ? number("r") ?? 0 : number("rx") ?? 0;
    const radiusY = element.name === "circle" ? number("r") ?? 0 : number("ry") ?? 0;
    if (radiusX <= 0 || radiusY <= 0) return false;
    const dx = (x - (number("cx") ?? 0)) / radiusX;
    const dy = (y - (number("cy") ?? 0)) / radiusY;
    return dx * dx + dy * dy <= 1;
  }
  return false;
};

const elementArea = (element: XmlElement): number => {
  const number = (key: string): number => Number(element.attributes[key] ?? 0) || 0;
  if (element.name === "rect") return Math.max(1, number("width") * number("height"));
  if (element.name === "circle") return Math.max(1, Math.PI * (number("r") ** 2));
  if (element.name === "ellipse") return Math.max(1, Math.PI * number("rx") * number("ry"));
  return Number.MAX_SAFE_INTEGER;
};

export interface InspectOptions {
  /** Reference pixel dimensions, when the figure redraws a supplied image. */
  reference?: { width: number; height: number } | null;
}

/**
 * Visible text of a `<text>` element. A renderer puts each line in a `<tspan>`,
 * so the element's own text is normally empty; reading it alone would report
 * every real label as blank.
 */
function collectLines(document: Document, element: XmlElement): string[] {
  const lines: string[] = [];
  const own = element.text.replace(/\s+/g, " ").trim();
  if (own) lines.push(own);
  for (const child of element.children) {
    const node = document.elements[child];
    if (!node) continue;
    const content = node.text.replace(/\s+/g, " ").trim();
    if (content) lines.push(content);
  }
  return lines;
}

/** Inspect one SVG document against the figure policy. */
export function inspectFigure(svg: string, policy: Policy, options: InspectOptions = {}): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, message: string, severity: Severity = "error"): void => {
    findings.push({ rule, severity, message });
  };
  const document = parseXml(svg);
  for (const error of document.errors) add("xml", error);
  if (document.roots.length === 0) {
    add("xml", "the document has no root element");
    return findings;
  }
  if (document.roots.length > 1) add("xml", "the document has " + document.roots.length + " root elements");
  const rootIndex = document.roots[0];
  const root = rootIndex === undefined ? undefined : document.elements[rootIndex];
  if (!root || root.name !== "svg") {
    add("xml", "the root element must be <svg>");
    return findings;
  }

  const forbiddenElements = new Set(policy.forbidden.elements.map((name) => name.toLowerCase()));
  const forbiddenAttributes = new Set(policy.forbidden.attributes.map((name) => name.toLowerCase()));
  for (const element of document.elements) {
    const name = element.name.toLowerCase();
    if (forbiddenElements.has(name)) add("raster", "<" + name + "> is not allowed: the figure must stay vector-editable", "error");
    if (name === "filter" || name === "feimage") {
      add("raster", "<" + name + "> fakes pixels the vector layer cannot explain");
    }
    for (const [key, value] of Object.entries(element.attributes)) {
      const lowered = key.toLowerCase();
      if (forbiddenAttributes.has(lowered)) add("link", "<" + name + "> carries " + key + ", which can point at an external asset");
      if ((lowered === "style" || lowered === "fill" || lowered === "stroke") && /url\(\s*['"]?(?:data|https?|file):/i.test(value)) {
        add("raster", "<" + name + "> embeds a " + lowered + " payload from a URL");
      }
      if (lowered === "style") {
        for (const property of policy.forbidden.styleProperties) {
          if (new RegExp("(?:^|;)\\s*" + property + "\\s*:", "i").test(value)) {
            add("raster", "<" + name + "> uses " + property + " in style");
          }
        }
      }
      for (const scheme of policy.forbidden.urlSchemes) {
        if (value.toLowerCase().includes(scheme) && (lowered === "href" || lowered === "src" || lowered.includes("href"))) {
          add("raster", "<" + name + "> points at a " + scheme + " resource");
        }
      }
    }
  }

  const viewBox = root.attributes["viewBox"];
  if (policy.verification.requireViewBox && !viewBox) add("canvas", "<svg> has no viewBox, so it cannot scale");
  let canvasWidth = 0;
  let canvasHeight = 0;
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).filter(Boolean).map(Number);
    if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
      add("canvas", "viewBox must hold four numbers: " + viewBox);
    } else {
      const [, , width = 0, height = 0] = parts;
      canvasWidth = width;
      canvasHeight = height;
      if (width <= 0 || height <= 0) add("canvas", "viewBox width and height must be positive");
      else {
        const ratio = width / height;
        if (ratio < policy.canvas.minRatio || ratio > policy.canvas.maxRatio) {
          add("canvas", "ratio " + ratio.toFixed(2) + " is outside " + policy.canvas.minRatio + "-" + policy.canvas.maxRatio);
        }
        if (Math.min(width, height) < policy.canvas.minSidePt) {
          add("canvas", "the short side is " + Math.min(width, height) + "pt; below " + policy.canvas.minSidePt + "pt strokes and 6pt type stop being legible in print");
        }
        if (options.reference) {
          const expected = options.reference.width / options.reference.height;
          const drift = Math.abs(ratio - expected) / expected;
          if (drift > 0.01) {
            add("canvas", "ratio " + ratio.toFixed(3) + " drifts " + (drift * 100).toFixed(1) + "% from the reference " + expected.toFixed(3));
          }
        }
      }
    }
  }
  if (policy.verification.requireRoleImg && root.attributes["role"] !== "img") {
    add("a11y", '<svg> needs role="img"');
  }
  if (policy.verification.requireAria && !root.attributes["aria-label"] && !root.attributes["aria-labelledby"]) {
    add("a11y", '<svg> needs aria-label or aria-labelledby so a screen reader can name the figure');
  }
  const labelledBy = root.attributes["aria-labelledby"];
  const ids = new Map<string, number>();
  for (const element of document.elements) {
    const id = element.attributes["id"];
    if (id === undefined) continue;
    if (policy.verification.uniqueIds && ids.has(id)) add("ids", "duplicate id " + JSON.stringify(id) + " at line " + element.line);
    ids.set(id, element.line);
    if (policy.verification.idPattern && !new RegExp(policy.verification.idPattern).test(id)) {
      add("ids", "id " + JSON.stringify(id) + " does not match " + policy.verification.idPattern, "warning");
    }
  }
  if (labelledBy && !ids.has(labelledBy)) add("a11y", "aria-labelledby points at a missing id: " + labelledBy);

  const groups = document.elements.filter((element) => element.name === "g").length;
  if (groups < policy.verification.minGroups) {
    add("layers", ("only " + groups + " <g> layer(s); at least " + policy.verification.minGroups + " named groups keep the figure editable"));
  }
  const unnamed = document.elements.filter((element) => element.name === "g" && !element.attributes["id"]).length;
  if (unnamed > 0) add("layers", unnamed + " <g> layer(s) have no id", "warning");

  const texts = document.elements.filter((element) => element.name === "text");
  if (texts.length < policy.verification.minLabels) {
    add("text", "the figure has " + texts.length + " <text> element(s); text must stay real text, never outlined paths");
  }
  const surfaces: Surface[] = [];
  for (const element of document.elements) {
    if (element.name !== "rect" && element.name !== "circle" && element.name !== "ellipse") continue;
    const colour = parseColour(element.attributes["fill"]);
    if (!colour) continue;
    const alpha = Number(element.attributes["fill-opacity"] ?? "1");
    if (!Number.isFinite(alpha) || alpha <= 0) continue;
    const area = elementArea(element);
    surfaces.push({
      colour,
      area,
      contains: (x, y) => pointInElement(element, x, y),
    });
  }
  surfaces.sort((left, right) => right.area - left.area);
  const surfaceAt = (x: number, y: number): Rgb | null => {
    let resolved: Rgb | null = null;
    for (const surface of surfaces) {
      if (surface.contains(x, y)) resolved = surface.colour;
    }
    return resolved;
  };

  let checkedText = 0;
  let smallestFont = Number.POSITIVE_INFINITY;
  for (const text of texts) {
    const size = Number(text.attributes["font-size"] ?? "");
    if (!Number.isFinite(size) || size <= 0) {
      add("text", "<text> at line " + text.line + " has no numeric font-size");
      continue;
    }
    smallestFont = Math.min(smallestFont, size);
    if (size < policy.type.minPt) {
      add("text", "<text> at line " + text.line + " is " + size + "pt; the floor is " + policy.type.minPt + "pt");
    }
    const content = collectLines(document, text).join(" ");
    if (!content) {
      add("text", "<text> at line " + text.line + " is empty");
      continue;
    }
    const fill = parseColour(text.attributes["fill"]);
    if (!fill) continue;
    const x = Number(text.attributes["x"] ?? "0");
    const y = Number(text.attributes["y"] ?? "0");
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const surface = surfaceAt(x, y - size * 0.35);
    if (!surface) continue;
    const ratio = contrast(fill, surface);
    if (ratio < policy.contrast.textOnTint) {
      add(
        "contrast",
        "<text> at line " + text.line + " (" + JSON.stringify(content.slice(0, 28)) + ") is " + ratio.toFixed(2) + ":1 on " + toHex(surface) + "; the floor is " + policy.contrast.textOnTint + ":1",
      );
    }
    checkedText += 1;
  }

  // Overflow: a label drawn inside a shape must fit that shape's padded box.
  // A caption placed beside or below an object is measured against its own line
  // length instead, so a small icon is not held responsible for its label.
  const shapeOf = (element: XmlElement): XmlElement | undefined =>
    element.children.map((index) => document.elements[index]).find((child) => child !== undefined && ["rect", "ellipse", "circle"].includes(child.name));
  for (const text of texts) {
    const parentIndex = text.parent;
    const parent = parentIndex === null ? undefined : document.elements[parentIndex];
    if (!parent || parent.name !== "g") continue;
    const shape = shapeOf(parent);
    if (!shape) continue;
    const size = Number(text.attributes["font-size"] ?? "0");
    if (!Number.isFinite(size) || size <= 0) continue;
    const textX = Number(text.attributes["x"] ?? "0");
    const textY = Number(text.attributes["y"] ?? "0");
    if (!pointInElement(shape, textX, textY - size * 0.35)) continue;
    const width = Number(shape.attributes["width"] ?? (Number(shape.attributes["rx"] ?? shape.attributes["r"] ?? "0") * 2));
    if (!Number.isFinite(width) || width <= 0) continue;
    const available = width - policy.layout.labelPadPt * 2;
    if (available <= 0) continue;
    for (const line of collectLines(document, text)) {
      const estimated = textWidth(line, size, policy);
      if (estimated > available * policy.text.maxOverflowRatio) {
        add(
          "overflow",
          "label " + JSON.stringify(line.slice(0, 24)) + " at line " + text.line + " needs " + Math.round(estimated) + "pt but the object allows " + Math.round(available) + "pt",
        );
      }
    }
  }
  if (checkedText > 0) {
    findings.push({
      rule: "contrast",
      severity: "info",
      message: "checked " + checkedText + " label(s); smallest font " + (Number.isFinite(smallestFont) ? smallestFont + "pt" : "n/a"),
    });
  }

  const paths = document.elements.filter((element) => element.name === "path");
  const commandCount = (data: string): number => (data.match(/[MmZzLlHhVvCcSsQqTtAa]/g) ?? []).length;
  let totalCommands = 0;
  let largest = 0;
  for (const element of paths) {
    const commands = commandCount(element.attributes["d"] ?? "");
    totalCommands += commands;
    largest = Math.max(largest, commands);
    if (commands > policy.forbidden.maxSinglePathCommands) {
      add(
        "trace",
        "<path> at line " + element.line + " has " + commands + " commands; over " + policy.forbidden.maxSinglePathCommands + " it is a flattened trace, not editable artwork",
      );
    }
  }
  if (totalCommands > 0 && largest / totalCommands > policy.forbidden.maxPathShare && paths.length < 8) {
    add(
      "trace",
      "one path carries " + Math.round((largest / totalCommands) * 100) + "% of all path commands across " + paths.length + " path(s); split it into named objects",
    );
  }
  if (paths.length === 0 && document.elements.length < 4) {
    add("structure", "the document draws nothing: no shapes and no text");
  }

  if (canvasWidth > 0 && canvasHeight > 0) {
    const declaredWidth = Number(root.attributes["width"] ?? "");
    if (Number.isFinite(declaredWidth) && declaredWidth > 0) {
      const drift = Math.abs(declaredWidth - canvasWidth) / canvasWidth;
      if (drift > 0.01) add("canvas", "width=" + declaredWidth + " disagrees with viewBox width=" + canvasWidth, "warning");
    }
    for (const element of document.elements) {
      if (!["rect", "circle", "ellipse", "text"].includes(element.name)) continue;
      const x = Number(element.attributes["x"] ?? element.attributes["cx"] ?? "0");
      const y = Number(element.attributes["y"] ?? element.attributes["cy"] ?? "0");
      if (Number.isFinite(x) && (x < -canvasWidth * 0.02 || x > canvasWidth * 1.02)) {
        add("canvas", "<" + element.name + "> at line " + element.line + " sits outside the canvas horizontally", "warning");
      }
      if (Number.isFinite(y) && (y < -canvasHeight * 0.02 || y > canvasHeight * 1.02)) {
        add("canvas", "<" + element.name + "> at line " + element.line + " sits outside the canvas vertically", "warning");
      }
    }
  }

  return findings;
}

export function summarise(findings: readonly Finding[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const finding of findings) {
    if (finding.severity === "error") errors += 1;
    else if (finding.severity === "warning") warnings += 1;
  }
  return { errors, warnings };
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

function option(args: readonly string[], key: string): string {
  const index = args.indexOf(key);
  if (index < 0) return "";
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(key + " requires a value");
  return value;
}

function referenceDimensions(value: string): { width: number; height: number } | undefined {
  if (value === "") return undefined;
  const match = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/.exec(value);
  if (match === null) throw new Error("--reference requires <width>x<height>, for example 640x400");
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("--reference dimensions must be positive finite numbers");
  }
  return { width, height };
}

/** Negative probes: each mutation must be caught, or the gate is decorative. */
export function runSelfTest(): void {
  const policy = loadPolicy();
  const clean = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="Test figure">',
    "<title>Test figure</title>",
    '<g id="background"><rect x="0" y="0" width="640" height="400" fill="#FFFFFF"/></g>',
    '<g id="panels"><g id="panel-a"><rect x="10" y="10" width="300" height="200" fill="#F5F7FA"/></g></g>',
    '<g id="objects"><g id="cell-a"><ellipse cx="160" cy="110" rx="80" ry="60" fill="#DDE8FB" stroke="#1F5FD0" stroke-width="1"/>',
    '<text x="160" y="114" font-size="8" fill="#12212F" text-anchor="middle" font-weight="600"><tspan x="160" dy="0">HeLa</tspan></text></g></g>',
    '<g id="connectors"><g id="flow-a"><polyline points="250,110 340,110" fill="none" stroke="#12212F" stroke-width="1"/>',
    '<polygon points="350,110 343,107 343,113" fill="#12212F"/></g></g>',
    '<g id="labels"><g id="label-title"><text id="text-title" x="10" y="30" font-size="12" fill="#12212F"><tspan x="10" dy="0">Test</tspan></text></g></g>',
    "</svg>",
  ].join("\n");
  const baseline = summarise(inspectFigure(clean, policy));
  if (baseline.errors !== 0) {
    throw new Error(
      "self-test: the clean sample must pass, got " + baseline.errors + " error(s): " +
        inspectFigure(clean, policy).filter((finding) => finding.severity === "error").map((finding) => finding.rule + ": " + finding.message).join(" | "),
    );
  }
  const probes: Array<{ name: string; svg: string; rule: string }> = [
    { name: "embedded raster", svg: clean.replace("</g></g>\n<g id=\"connectors\">", "</g><image href=\"data:image/png;base64,AAAA\"/></g>\n<g id=\"connectors\">"), rule: "raster" },
    { name: "external href", svg: clean.replace('<rect x="0" y="0"', '<rect href="https://example.com/a.png" x="0" y="0"'), rule: "link" },
    { name: "duplicate id", svg: clean.replace('id="labels"', 'id="objects"'), rule: "ids" },
    { name: "monolithic trace", svg: clean.replace('</svg>', '<path d="' + "M 0 0 L 1 1 ".repeat(150) + '"/></svg>'), rule: "trace" },
    { name: "outlined text", svg: clean.replace(/<text[\s\S]*?<\/text>/g, ""), rule: "text" },
    { name: "tiny type", svg: clean.replace('font-size="8"', 'font-size="3"'), rule: "text" },
    { name: "low contrast", svg: clean.replace('fill="#12212F" text-anchor', 'fill="#E8EEF6" text-anchor'), rule: "contrast" },
    { name: "ratio drift", svg: clean.replace('viewBox="0 0 640 400"', 'viewBox="0 0 640 120"'), rule: "canvas" },
    { name: "unbalanced tag", svg: clean.replace("</g>\n</svg>", "</svg>"), rule: "xml" },
  ];
  for (const probe of probes) {
    const found = inspectFigure(probe.svg, policy);
    if (!found.some((finding) => finding.rule === probe.rule && finding.severity === "error")) {
      throw new Error("self-test: " + probe.name + " was not caught by the " + probe.rule + " gate");
    }
  }
  const drifted = inspectFigure(clean, policy, { reference: { width: 640, height: 300 } });
  if (!drifted.some((finding) => finding.rule === "canvas")) {
    throw new Error("self-test: reference ratio drift was not caught");
  }
  console.log(
    "Figure checker passed: clean sample clears every gate, " + probes.length + " mutations blocked, and reference ratio drift is detected.",
  );
}

if (isMain) {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--help") || args.includes("-h")) {
      console.log(
        [
          "Usage: node scientific-figures/scripts/check-figure.ts --svg <figure.svg> [--reference <width>x<height>] [--json]",
          "       node scientific-figures/scripts/check-figure.ts --self-test",
          "",
          "Exit code 1 means the figure fails a blocking gate.",
        ].join("\n"),
      );
    } else if (args.includes("--self-test")) {
      runSelfTest();
    } else {
      const svgPath = option(args, "--svg");
      if (!svgPath) throw new Error("--svg is required");
      const policy = loadPolicy();
      const reference = referenceDimensions(option(args, "--reference"));
      const findings = inspectFigure(readFileSync(svgPath, "utf8"), policy, { reference });
      const totals = summarise(findings);
      if (args.includes("--json")) {
        process.stdout.write(JSON.stringify({ file: svgPath, ...totals, findings }, null, 2) + "\n");
      } else {
        for (const finding of findings) console.log(finding.severity.toUpperCase() + " [" + finding.rule + "] " + finding.message);
        console.log(totals.errors + " error(s), " + totals.warnings + " warning(s) in " + svgPath);
      }
      if (totals.errors > 0) process.exitCode = 1;
    }
  } catch (error) {
    console.error("Figure check failed: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
