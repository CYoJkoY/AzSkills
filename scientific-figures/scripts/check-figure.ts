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
import { contrastRatio, type Rgb } from "./color-contrast.ts";
import { type Policy, loadPolicy, textWidth } from "./figure-model.ts";
import { commandCount, elementArea, elementVerticalBounds, elementWidth, groupShape, numberAttribute, pointInElement, type VerticalBounds } from "./figure-shape.ts";
import { parseXml, type XmlDocument, type XmlElement } from "./xml-document.ts";

export type Severity = "error" | "warning" | "info";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
}

export interface InspectOptions {
  /** Reference pixel dimensions, when the figure redraws a supplied image. */
  reference?: { width: number; height: number } | null;
}

interface Inspection {
  document: XmlDocument;
  policy: Policy;
  reference?: { width: number; height: number } | null;
  add: (rule: string, message: string, severity?: Severity) => void;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface Surface {
  colour: Rgb;
  area: number;
  contains: (x: number, y: number) => boolean;
}

interface AttributeSubject {
  element: XmlElement;
  key: string;
  value: string;
}

interface TextResult {
  checked: boolean;
  smallest: number;
}

interface LabelSubject {
  text: XmlElement;
  shape: XmlElement;
  placement: string | undefined;
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
  if (functional) return { r: Number(functional[1]), g: Number(functional[2]), b: Number(functional[3]) };
  return null;
}

const toHex = (colour: Rgb): string =>
  "#" +
  [colour.r, colour.g, colour.b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("");

/**
 * Visible text of a `<text>` element. A renderer puts each line in a `<tspan>`,
 * so the element's own text is normally empty; reading it alone would report
 * every real label as blank.
 */
function collectLines(document: XmlDocument, element: XmlElement): string[] {
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

function checkElement(element: XmlElement, forbidden: ReadonlySet<string>, add: Inspection["add"]): void {
  const name = element.name.slice(element.name.lastIndexOf(":") + 1).toLowerCase();
  if (forbidden.has(name)) add("raster", "<" + name + "> is not allowed: the figure must stay vector-editable");
  if (name === "filter" || name === "feimage") add("raster", "<" + name + "> fakes pixels the vector layer cannot explain");
}

function checkStyleProperties(subject: AttributeSubject, policy: Policy, add: Inspection["add"]): void {
  for (const property of policy.forbidden.styleProperties) {
    if (new RegExp("(?:^|;)\\s*" + property + "\\s*:", "i").test(subject.value)) {
      add("raster", "<" + subject.element.name + "> uses " + property + " in style");
    }
  }
}

function checkUrlSchemes(subject: AttributeSubject, policy: Policy, add: Inspection["add"]): void {
  const lowered = subject.key.toLowerCase();
  if (lowered !== "href" && lowered !== "src" && !lowered.includes("href")) return;
  for (const scheme of policy.forbidden.urlSchemes) {
    if (subject.value.toLowerCase().includes(scheme)) add("raster", "<" + subject.element.name + "> points at a " + scheme + " resource");
  }
}

function checkAttribute(subject: AttributeSubject, policy: Policy, add: Inspection["add"]): void {
  const lowered = subject.key.toLowerCase();
  if ((lowered === "style" || lowered === "fill" || lowered === "stroke") && /url\(\s*['"]?(?:data|https?|file):/i.test(subject.value)) {
    add("raster", "<" + subject.element.name + "> embeds a " + lowered + " payload from a URL");
  }
  if (lowered === "style") checkStyleProperties(subject, policy, add);
  checkUrlSchemes(subject, policy, add);
}

function checkAttributes(element: XmlElement, forbidden: ReadonlySet<string>, inspection: Inspection): void {
  for (const [key, value] of Object.entries(element.attributes)) {
    if (forbidden.has(key.toLowerCase())) inspection.add("link", "<" + element.name + "> carries " + key + ", which can point at an external asset");
    checkAttribute({ element, key, value }, inspection.policy, inspection.add);
  }
}

function checkForbidden(inspection: Inspection): void {
  const forbiddenElements = new Set(inspection.policy.forbidden.elements.map((name) => name.toLowerCase()));
  const forbiddenAttributes = new Set(inspection.policy.forbidden.attributes.map((name) => name.toLowerCase()));
  for (const element of inspection.document.elements) {
    checkElement(element, forbiddenElements, inspection.add);
    checkAttributes(element, forbiddenAttributes, inspection);
  }
}

function checkReference(ratio: number, inspection: Inspection): void {
  const reference = inspection.reference;
  if (!reference) return;
  const expected = reference.width / reference.height;
  const drift = Math.abs(ratio - expected) / expected;
  if (drift > 0.01) inspection.add("canvas", "ratio " + ratio.toFixed(3) + " drifts " + (drift * 100).toFixed(1) + "% from the reference " + expected.toFixed(3));
}

function checkCanvasRatio(width: number, height: number, inspection: Inspection): void {
  const ratio = width / height;
  if (ratio < inspection.policy.canvas.minRatio || ratio > inspection.policy.canvas.maxRatio) {
    inspection.add("canvas", "ratio " + ratio.toFixed(2) + " is outside " + inspection.policy.canvas.minRatio + "-" + inspection.policy.canvas.maxRatio);
  }
  if (Math.min(width, height) < inspection.policy.canvas.minSidePt) {
    inspection.add("canvas", "the short side is " + Math.min(width, height) + "pt; below " + inspection.policy.canvas.minSidePt + "pt strokes and 6pt type stop being legible in print");
  }
  checkReference(ratio, inspection);
}

function checkCanvas(root: XmlElement, inspection: Inspection): CanvasSize {
  const viewBox = root.attributes["viewBox"];
  if (inspection.policy.verification.requireViewBox && !viewBox) inspection.add("canvas", "<svg> has no viewBox, so it cannot scale");
  if (!viewBox) return { width: 0, height: 0 };
  const parts = viewBox.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    inspection.add("canvas", "viewBox must hold four numbers: " + viewBox);
    return { width: 0, height: 0 };
  }
  const width = parts[2] ?? 0;
  const height = parts[3] ?? 0;
  if (width <= 0 || height <= 0) {
    inspection.add("canvas", "viewBox width and height must be positive");
    return { width: 0, height: 0 };
  }
  checkCanvasRatio(width, height, inspection);
  return { width, height };
}

function checkAccessibility(root: XmlElement, inspection: Inspection): void {
  if (inspection.policy.verification.requireRoleImg && root.attributes["role"] !== "img") inspection.add("a11y", '<svg> needs role="img"');
  if (inspection.policy.verification.requireAria && !root.attributes["aria-label"] && !root.attributes["aria-labelledby"]) {
    inspection.add("a11y", '<svg> needs aria-label or aria-labelledby so a screen reader can name the figure');
  }
  const labelledBy = root.attributes["aria-labelledby"];
  if (!labelledBy) return;
  const ids = new Set(inspection.document.elements.map((element) => element.attributes["id"]).filter((id): id is string => id !== undefined));
  if (!ids.has(labelledBy)) inspection.add("a11y", "aria-labelledby points at a missing id: " + labelledBy);
}

function checkIds(inspection: Inspection): void {
  const ids = new Map<string, number>();
  for (const element of inspection.document.elements) {
    const id = element.attributes["id"];
    if (id === undefined) continue;
    if (inspection.policy.verification.uniqueIds && ids.has(id)) inspection.add("ids", "duplicate id " + JSON.stringify(id) + " at line " + element.line);
    ids.set(id, element.line);
    if (inspection.policy.verification.idPattern && !new RegExp(inspection.policy.verification.idPattern).test(id)) {
      inspection.add("ids", "id " + JSON.stringify(id) + " does not match " + inspection.policy.verification.idPattern, "warning");
    }
  }
}

function checkLayers(inspection: Inspection): void {
  const groups = inspection.document.elements.filter((element) => element.name === "g").length;
  if (groups < inspection.policy.verification.minGroups) {
    inspection.add("layers", "only " + groups + " <g> layer(s); at least " + inspection.policy.verification.minGroups + " named groups keep the figure editable");
  }
  const unnamed = inspection.document.elements.filter((element) => element.name === "g" && !element.attributes["id"]).length;
  if (unnamed > 0) inspection.add("layers", unnamed + " <g> layer(s) have no id", "warning");
}

function buildSurfaces(document: XmlDocument): Surface[] {
  const surfaces: Surface[] = [];
  for (const element of document.elements) {
    if (element.name !== "rect" && element.name !== "circle" && element.name !== "ellipse") continue;
    const colour = parseColour(element.attributes["fill"]);
    if (!colour) continue;
    const alpha = Number(element.attributes["fill-opacity"] ?? "1");
    if (!Number.isFinite(alpha) || alpha <= 0) continue;
    surfaces.push({ colour, area: elementArea(element), contains: (x, y) => pointInElement(element, x, y) });
  }
  return surfaces.sort((left, right) => right.area - left.area);
}

function surfaceAt(surfaces: readonly Surface[], x: number, y: number): Rgb | null {
  let resolved: Rgb | null = null;
  for (const surface of surfaces) {
    if (surface.contains(x, y)) resolved = surface.colour;
  }
  return resolved;
}

function checkTextContrast(text: XmlElement, surfaces: readonly Surface[], inspection: Inspection): TextResult {
  const size = numberAttribute(text, "font-size");
  if (size === null || size <= 0) {
    inspection.add("text", "<text> at line " + text.line + " has no numeric font-size");
    return { checked: false, smallest: Number.POSITIVE_INFINITY };
  }
  if (size < inspection.policy.type.minPt) inspection.add("text", "<text> at line " + text.line + " is " + size + "pt; the floor is " + inspection.policy.type.minPt + "pt");
  const content = collectLines(inspection.document, text).join(" ");
  if (!content) {
    inspection.add("text", "<text> at line " + text.line + " is empty");
    return { checked: false, smallest: size };
  }
  const fill = parseColour(text.attributes["fill"]);
  if (!fill) return { checked: false, smallest: size };
  const x = numberAttribute(text, "x") ?? 0;
  const y = numberAttribute(text, "y") ?? 0;
  const surface = surfaceAt(surfaces, x, y - size * 0.35);
  if (!surface) return { checked: false, smallest: size };
  const ratio = contrastRatio(fill, surface);
  if (ratio < inspection.policy.contrast.textOnTint) {
    inspection.add("contrast", "<text> at line " + text.line + " (" + JSON.stringify(content.slice(0, 28)) + ") is " + ratio.toFixed(2) + ":1 on " + toHex(surface) + "; the floor is " + inspection.policy.contrast.textOnTint + ":1");
  }
  return { checked: true, smallest: size };
}

function checkTextContrasts(inspection: Inspection): void {
  const texts = inspection.document.elements.filter((element) => element.name === "text");
  if (texts.length < inspection.policy.verification.minLabels) inspection.add("text", "the figure has " + texts.length + " <text> element(s); text must stay real text, never outlined paths");
  const surfaces = buildSurfaces(inspection.document);
  const results = texts.map((text) => checkTextContrast(text, surfaces, inspection));
  const checked = results.filter((result) => result.checked).length;
  if (checked === 0) return;
  const smallest = Math.min(...results.map((result) => result.smallest));
  inspection.add("contrast", "checked " + checked + " label(s); smallest font " + smallest + "pt", "info");
}

function labelSubject(document: XmlDocument, text: XmlElement, byId: ReadonlyMap<string, XmlElement>): LabelSubject | undefined {
  const parent = text.parent === null ? undefined : document.elements[text.parent];
  if (parent === undefined || parent.name !== "g") return undefined;
  const targetId = parent.attributes["data-for"];
  const target = targetId === undefined ? parent : byId.get(targetId) ?? parent;
  const shape = groupShape(document, target);
  if (shape === undefined) return undefined;
  return { text, shape, placement: parent.attributes["data-placement"] };
}

function checkLabelLines(subject: LabelSubject, inspection: Inspection): void {
  const { text, shape } = subject;
  const available = elementWidth(shape) - inspection.policy.layout.labelPadPt * 2;
  if (available <= 0) return;
  const size = numberAttribute(text, "font-size") ?? 0;
  for (const line of collectLines(inspection.document, text)) {
    const estimated = textWidth(line, size, inspection.policy);
    if (estimated <= available * inspection.policy.text.maxOverflowRatio) continue;
    inspection.add(
      "overflow",
      "label " + JSON.stringify(line.slice(0, 24)) + " at line " + text.line + " needs " + Math.round(estimated) + "pt but the object allows " + Math.round(available) + "pt",
    );
  }
}

function textVerticalBounds(document: XmlDocument, text: XmlElement): VerticalBounds | null {
  let baseline = numberAttribute(text, "y") ?? 0;
  const size = numberAttribute(text, "font-size") ?? 0;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  const spans = text.children.map((index) => document.elements[index]).filter((element) => element?.name === "tspan");
  for (const element of [text, ...spans]) {
    if (element === undefined) continue;
    baseline = (numberAttribute(element, "y") ?? baseline) + (numberAttribute(element, "dy") ?? 0);
    if (element.text.trim() === "") continue;
    const fontSize = numberAttribute(element, "font-size") ?? size;
    const middle = baseline - fontSize * 0.35;
    top = Math.min(top, middle - fontSize / 2);
    bottom = Math.max(bottom, middle + fontSize / 2);
  }
  if (!Number.isFinite(top)) return null;
  return { top, bottom };
}

function checkLabelHeight(subject: LabelSubject, inspection: Inspection): void {
  const bounds = textVerticalBounds(inspection.document, subject.text);
  if (bounds === null) return;
  const shape = elementVerticalBounds(subject.shape);
  const top = shape.top + inspection.policy.layout.labelPadPt;
  const bottom = shape.bottom - inspection.policy.layout.labelPadPt;
  const tolerance = Math.max(0, bottom - top) * Math.max(0, inspection.policy.text.maxOverflowRatio - 1) / 2;
  if (bounds.top >= top - tolerance && bounds.bottom <= bottom + tolerance) return;
  inspection.add(
    "overflow",
    "label at line " + subject.text.line + " spans y=" + bounds.top.toFixed(1) + "-" + bounds.bottom.toFixed(1) + "pt but the object allows y=" + top.toFixed(1) + "-" + bottom.toFixed(1) + "pt",
  );
}

function isInsideLabel(subject: LabelSubject): boolean {
  if (subject.placement !== undefined) return subject.placement === "inside";
  const size = numberAttribute(subject.text, "font-size");
  const x = numberAttribute(subject.text, "x");
  const y = numberAttribute(subject.text, "y");
  if (size === null || size <= 0 || x === null || y === null) return false;
  return pointInElement(subject.shape, x, y - size * 0.35);
}

function checkOverflow(inspection: Inspection): void {
  const texts = inspection.document.elements.filter((element) => element.name === "text");
  const byId = new Map(
    inspection.document.elements
      .filter((element) => element.attributes["id"] !== undefined)
      .map((element) => [element.attributes["id"] as string, element] as const),
  );
  for (const text of texts) {
    const subject = labelSubject(inspection.document, text, byId);
    if (subject === undefined || !isInsideLabel(subject)) continue;
    checkLabelLines(subject, inspection);
    checkLabelHeight(subject, inspection);
  }
}

function checkPaths(inspection: Inspection): void {
  const paths = inspection.document.elements.filter((element) => element.name === "path");
  let total = 0;
  let largest = 0;
  for (const element of paths) {
    const commands = commandCount(element.attributes["d"] ?? "");
    total += commands;
    largest = Math.max(largest, commands);
    if (commands > inspection.policy.forbidden.maxSinglePathCommands) {
      inspection.add(
        "trace",
        "<path> at line " + element.line + " has " + commands + " commands; over " + inspection.policy.forbidden.maxSinglePathCommands + " it is a flattened trace, not editable artwork",
      );
    }
  }
  if (total > 0 && largest >= inspection.policy.forbidden.traceShareMinCommands && largest / total > inspection.policy.forbidden.maxPathShare && paths.length < 8) {
    inspection.add(
      "trace",
      "one path carries " + Math.round((largest / total) * 100) + "% of all path commands across " + paths.length + " path(s); split it into named objects",
    );
  }
  if (paths.length === 0 && inspection.document.elements.length < 4) inspection.add("structure", "the document draws nothing: no shapes and no text");
}

/**
 * Colour coding is a property of object geometry. The renderer reserves the
 * `objects` layer for those groups; connector ink and text tones are not a
 * legend's subject.
 */
function objectTones(document: XmlDocument): Set<string> {
  const layer = document.elements.find((element) => element.attributes["id"] === "objects");
  const tones = new Set<string>();
  for (const index of layer?.children ?? []) {
    const tone = document.elements[index]?.attributes["data-tone"];
    if (tone !== undefined) tones.add(tone);
  }
  return tones;
}

function legendItems(document: XmlDocument): number {
  return document.elements.filter((element) => element.attributes["data-kind"] === "legend-item").length;
}

function checkLegend(inspection: Inspection): void {
  const threshold = inspection.policy.verification.requireLegendWhenTones;
  const tones = objectTones(inspection.document);
  if (threshold > 0 && legendItems(inspection.document) === 0 && tones.size >= threshold) {
    inspection.add("legend", tones.size + " figure tone(s) need a legend; " + threshold + " distinct tones is the threshold");
  }
}

function checkHorizontal(element: XmlElement, width: number, inspection: Inspection): void {
  const x = numberAttribute(element, "x") ?? numberAttribute(element, "cx") ?? 0;
  if (x < -width * 0.02 || x > width * 1.02) inspection.add("canvas", "<" + element.name + "> at line " + element.line + " sits outside the canvas horizontally", "warning");
}

function checkVertical(element: XmlElement, height: number, inspection: Inspection): void {
  const y = numberAttribute(element, "y") ?? numberAttribute(element, "cy") ?? 0;
  if (y < -height * 0.02 || y > height * 1.02) inspection.add("canvas", "<" + element.name + "> at line " + element.line + " sits outside the canvas vertically", "warning");
}

function checkBounds(root: XmlElement, canvas: CanvasSize, inspection: Inspection): void {
  if (canvas.width <= 0 || canvas.height <= 0) return;
  const declaredWidth = Number(root.attributes["width"] ?? "");
  if (Number.isFinite(declaredWidth) && declaredWidth > 0) {
    const drift = Math.abs(declaredWidth - canvas.width) / canvas.width;
    if (drift > 0.01) inspection.add("canvas", "width=" + declaredWidth + " disagrees with viewBox width=" + canvas.width, "warning");
  }
  for (const element of inspection.document.elements) {
    if (!["rect", "circle", "ellipse", "text"].includes(element.name)) continue;
    checkHorizontal(element, canvas.width, inspection);
    checkVertical(element, canvas.height, inspection);
  }
}

function resolveSvgRoot(document: XmlDocument, add: Inspection["add"]): XmlElement | undefined {
  if (document.roots.length === 0) {
    add("xml", "the document has no root element");
    return undefined;
  }
  if (document.roots.length > 1) add("xml", "the document has " + document.roots.length + " root elements");
  const root = document.elements[document.roots[0] ?? -1];
  if (!root || root.name !== "svg") {
    add("xml", "the root element must be <svg>");
    return undefined;
  }
  return root;
}

/** Inspect one SVG document against the figure policy. */
export function inspectFigure(svg: string, policy: Policy, options: InspectOptions = {}): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, message: string, severity: Severity = "error"): void => {
    findings.push({ rule, severity, message });
  };
  const document = parseXml(svg);
  for (const error of document.errors) add("xml", error);
  const root = resolveSvgRoot(document, add);
  if (!root) return findings;
  const inspection: Inspection = { document, policy, reference: options.reference, add };
  checkForbidden(inspection);
  const canvas = checkCanvas(root, inspection);
  checkAccessibility(root, inspection);
  checkIds(inspection);
  checkLayers(inspection);
  checkTextContrasts(inspection);
  checkOverflow(inspection);
  checkPaths(inspection);
  checkLegend(inspection);
  checkBounds(root, canvas, inspection);
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
