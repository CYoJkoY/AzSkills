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
import {
  commandCount,
  elementExtent,
  elementVerticalBounds,
  elementWidth,
  groupShape,
  numberAttribute,
  pointInElement,
  type Extent,
  type VerticalBounds,
} from "./figure-shape.ts";
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
  alpha: number;
  /** The page itself rather than an object tint, so the canvas floor applies. */
  page: boolean;
  contains: (x: number, y: number) => boolean;
}

interface ResolvedSurface {
  colour: Rgb;
  /** True when only the page background was composited at this point. */
  page: boolean;
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
  if (lowered === "d") checkPathData(subject, policy, add);
  checkUrlSchemes(subject, policy, add);
}

/** Tokens that only appear when path data carries a bitmap or a foreign payload. */
function checkPathData(subject: AttributeSubject, policy: Policy, add: Inspection["add"]): void {
  const lowered = subject.value.toLowerCase();
  for (const token of policy.forbidden.pathData) {
    if (lowered.includes(token.toLowerCase())) {
      add("raster", "<" + subject.element.name + "> path data in " + subject.key + " carries " + token);
    }
  }
}

/**
 * A `<style>` block is a stylesheet, not an attribute, so the attribute gate
 * never sees it. External imports, embedded payloads, and filter effects hide
 * there just as easily, and the document still renders as if it were clean.
 */
function checkStyleBlock(element: XmlElement, inspection: Inspection): void {
  const css = element.text;
  if (css.trim() === "") return;
  const lowered = css.toLowerCase();
  if (lowered.includes("@import")) {
    inspection.add("raster", "<style> at line " + element.line + " imports a remote stylesheet with @import");
  }
  for (const scheme of inspection.policy.forbidden.urlSchemes) {
    if (lowered.includes("url(" ) && lowered.includes(scheme)) {
      inspection.add("raster", "<style> at line " + element.line + " points at a " + scheme + " resource");
    }
  }
  for (const token of inspection.policy.forbidden.pathData) {
    if (lowered.includes(token.toLowerCase())) {
      inspection.add("raster", "<style> at line " + element.line + " carries " + token);
    }
  }
  for (const property of inspection.policy.forbidden.styleProperties) {
    if (new RegExp("(?:^|[;{\\s])" + property + "\\s*:", "i").test(css)) {
      inspection.add("raster", "<style> at line " + element.line + " applies " + property);
    }
  }
  if (/url\(\s*['"]?#/i.test(css)) {
    inspection.add("raster", "<style> at line " + element.line + " references a paint server the checker cannot resolve");
  }
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
    if (element.name === "style") checkStyleBlock(element, inspection);
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
  if (inspection.policy.verification.requireTitle && !inspection.document.elements.some((element) => element.name === "title")) {
    inspection.add("a11y", "the document has no <title>, so a reader gets the file name instead of the figure purpose");
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

/**
 * Geometry inside `defs`, `clipPath`, `mask`, `pattern`, `marker`, and `symbol`
 * is never painted where it is declared. Counting it as a readable background
 * would report contrast for a colour no reader ever sees.
 */
const UNPAINTED_CONTAINERS = new Set(["defs", "clippath", "mask", "pattern", "marker", "symbol"]);

function isUnpainted(document: XmlDocument, element: XmlElement): boolean {
  let index = element.parent;
  while (index !== null) {
    const ancestor = document.elements[index];
    if (ancestor === undefined) return false;
    if (UNPAINTED_CONTAINERS.has(ancestor.name.toLowerCase())) return true;
    index = ancestor.parent;
  }
  return false;
}

/**
 * Collect the painted surfaces in document order, which is paint order for SVG.
 * Sorting by area instead put a small node above the wide scrim that covers it,
 * so a correctly composited label was measured against the wrong layer.
 */
function buildSurfaces(document: XmlDocument, canvas: CanvasSize): Surface[] {
  const surfaces: Surface[] = [];
  for (const element of document.elements) {
    if (element.name !== "rect" && element.name !== "circle" && element.name !== "ellipse") continue;
    if (isUnpainted(document, element)) continue;
    const colour = parseColour(element.attributes["fill"]);
    if (!colour) continue;
    /*
     * `opacity` applies to the whole element and `fill-opacity` only to its
     * paint, but the checker reads a flat fill, so their product is the
     * coverage a label actually sees. Reading just one of them let an
     * `opacity="0.08"` veil count as opaque.
     */
    const alpha = Number(element.attributes["fill-opacity"] ?? "1") * Number(element.attributes["opacity"] ?? "1");
    if (!Number.isFinite(alpha) || alpha <= 0) continue;
    surfaces.push({
      colour,
      alpha: Math.min(1, alpha),
      page: coversCanvas(element, canvas),
      contains: (x, y) => pointInElement(element, x, y),
    });
  }
  return surfaces;
}

function coversCanvas(element: XmlElement, canvas: CanvasSize): boolean {
  if (element.name !== "rect" || canvas.width <= 0 || canvas.height <= 0) return false;
  const left = numberAttribute(element, "x") ?? 0;
  const top = numberAttribute(element, "y") ?? 0;
  return left <= 0 && top <= 0 && left + (numberAttribute(element, "width") ?? 0) >= canvas.width && top + (numberAttribute(element, "height") ?? 0) >= canvas.height;
}

/**
 * Composite every covering surface in paint order. A tint layer at 8% opacity
 * over white is nearly white; reading its own RGB as the background reports a
 * contrast failure the reader never sees, and the reverse error hides a real one.
 */
function surfaceAt(surfaces: readonly Surface[], x: number, y: number): ResolvedSurface | null {
  const covering = surfaces.filter((surface) => surface.contains(x, y));
  if (covering.length === 0) return null;
  let colour: Rgb = { r: 255, g: 255, b: 255 };
  for (const surface of covering) {
    colour = {
      r: colour.r * (1 - surface.alpha) + surface.colour.r * surface.alpha,
      g: colour.g * (1 - surface.alpha) + surface.colour.g * surface.alpha,
      b: colour.b * (1 - surface.alpha) + surface.colour.b * surface.alpha,
    };
  }
  return { colour, page: covering.every((surface) => surface.page) };
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
  const floor = surface.page ? inspection.policy.contrast.textOnCanvas : inspection.policy.contrast.textOnTint;
  const ratio = contrastRatio(fill, surface.colour);
  if (ratio < floor) {
    inspection.add("contrast", "<text> at line " + text.line + " (" + JSON.stringify(content.slice(0, 28)) + ") is " + ratio.toFixed(2) + ":1 on " + toHex(surface.colour) + "; the floor is " + floor + ":1");
  }
  return { checked: true, smallest: size };
}

function checkTextContrasts(inspection: Inspection, canvas: CanvasSize): void {
  const texts = inspection.document.elements.filter((element) => element.name === "text");
  if (texts.length < inspection.policy.verification.minLabels) inspection.add("text", "the figure has " + texts.length + " <text> element(s); text must stay real text, never outlined paths");
  const surfaces = buildSurfaces(inspection.document, canvas);
  const results = texts.map((text) => checkTextContrast(text, surfaces, inspection));
  const checked = results.filter((result) => result.checked).length;
  if (checked === 0) return;
  const smallest = Math.min(...results.map((result) => result.smallest));
  inspection.add("contrast", "checked " + checked + " label(s); smallest font " + smallest + "pt", "info");
}

/** The nearest group that declares what a text run is, so notes get their own measure. */
function textRole(document: XmlDocument, text: XmlElement): string {
  let index = text.parent;
  while (index !== null) {
    const group = document.elements[index];
    if (group === undefined) return "";
    const role = group.attributes["data-role"];
    if (role !== undefined) return role;
    if (group.attributes["data-kind"] === "node-label") return "label";
    /*
     * Text inside the labels layer is a label even when the author omitted
     * `data-role`; without this fallback a long hand-written caption escaped the
     * label measure entirely, so the advertised line-length cap had a hole.
     */
    if (group.attributes["id"] === "labels") return "label";
    index = group.parent;
  }
  return "";
}

/**
 * Line length is a typographic limit, not a geometry one: a 140-character note
 * can fit its box and still be unreadable. Notes and labels carry separate
 * policy limits so a caption is not forced into a swatch's measure.
 */
function checkLineLengths(inspection: Inspection): void {
  const limits: Record<string, number> = {
    note: inspection.policy.text.maxCharsPerLineNote,
    label: inspection.policy.text.maxCharsPerLineLabel,
  };
  for (const text of inspection.document.elements) {
    if (text.name !== "text") continue;
    const limit = limits[textRole(inspection.document, text)];
    if (limit === undefined) continue;
    for (const line of collectLines(inspection.document, text)) {
      const length = Array.from(line).length;
      if (length <= limit) continue;
      inspection.add("text", "line at " + text.line + " runs " + length + " characters; " + textRole(inspection.document, text) + " lines stop being scannable past " + limit, "warning");
    }
  }
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
  // A membrane band or a DNA strand is thinner than two label pads: it has no
  // vertical room for an inside label at all, so the height gate cannot apply.
  if (bottom <= top) return;
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

function union(extents: readonly Extent[]): Extent | null {
  if (extents.length === 0) return null;
  return extents.reduce((left, right) => ({
    left: Math.min(left.left, right.left),
    right: Math.max(left.right, right.right),
    top: Math.min(left.top, right.top),
    bottom: Math.max(left.bottom, right.bottom),
  }));
}

function intersects(left: Extent, right: Extent, tolerance: number): boolean {
  return Math.min(left.right, right.right) - Math.max(left.left, right.left) > tolerance &&
    Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > tolerance;
}

/**
 * The legend is painted last, so anything else inside its strip is already
 * covered. Measuring the painted legend rather than a second copy of the layout
 * math keeps the gate honest when the legend wraps to a second row.
 *
 * Painted content is the leaves of the `objects` and `labels` layers. Shapes are
 * skipped when an ancestor carries a transform, because the checker does not
 * model that matrix and must not invent an overlap from unrotated geometry. The
 * same rule applies to the legend itself: a rotated legend item is left out of
 * the band rather than measured at its unrotated place, so one transform policy
 * governs both sides of the comparison.
 */
function contentLeaves(document: XmlDocument): XmlElement[] {
  const layers = new Set(["objects", "labels"]);
  const members: XmlElement[] = [];
  const walk = (index: number, inside: boolean, transformed: boolean): void => {
    const element = document.elements[index];
    if (element === undefined) return;
    const member = inside || layers.has(element.attributes["id"] ?? "");
    const moved = transformed || element.attributes["transform"] !== undefined;
    if (member && !moved && !["g", "svg", "title", "desc"].includes(element.name)) members.push(element);
    for (const child of element.children) walk(child, member, moved);
  };
  for (const root of document.roots) walk(root, false, false);
  return members;
}

function checkLegendOverlap(inspection: Inspection): void {
  const legend = inspection.document.elements.find((element) => element.attributes["id"] === "legend");
  if (legend === undefined) return;
  const painted: Extent[] = [];
  const collect = (index: number, transformed: boolean): void => {
    const element = inspection.document.elements[index];
    if (element === undefined) return;
    const moved = transformed || element.attributes["transform"] !== undefined;
    if (!moved) {
      const bounds = elementBounds(inspection.document, element, inspection.policy);
      if (bounds !== null) painted.push(bounds);
    }
    for (const child of element.children) collect(child, moved);
  };
  collect(inspection.document.elements.indexOf(legend), false);
  const band = union(painted);
  if (band === null) return;
  const tolerance = inspection.policy.layout.labelPadPt / 2;
  for (const element of contentLeaves(inspection.document)) {
    const bounds = elementBounds(inspection.document, element, inspection.policy);
    if (bounds === null || !intersects(bounds, band, tolerance)) continue;
    inspection.add(
      "legend",
      "<" + element.name + "> at line " + element.line + " overlaps the legend strip (y=" + band.top.toFixed(1) + "-" + band.bottom.toFixed(1) + "); the legend paints last and covers it",
    );
  }
}

function checkLegend(inspection: Inspection): void {
  const threshold = inspection.policy.verification.requireLegendWhenTones;
  const tones = objectTones(inspection.document);
  if (threshold > 0 && legendItems(inspection.document) === 0 && tones.size >= threshold) {
    inspection.add("legend", tones.size + " figure tone(s) need a legend; " + threshold + " distinct tones is the threshold");
  }
  checkLegendOverlap(inspection);
}

/**
 * Text is measured from its anchor and estimated advance; every other primitive
 * from its own extent. Anchors alone miss a wide rect placed just off the right
 * edge and a tall one hanging past the bottom, which is exactly the clipping a
 * reader notices first.
 */
function textExtent(document: XmlDocument, text: XmlElement, policy: Policy): Extent | null {
  const content = collectLines(document, text);
  if (content.length === 0) return null;
  const size = numberAttribute(text, "font-size") ?? 0;
  if (size <= 0) return null;
  const x = numberAttribute(text, "x") ?? 0;
  const y = numberAttribute(text, "y") ?? 0;
  const widest = Math.max(...content.map((line) => textWidth(line, size, policy)));
  const anchor = text.attributes["text-anchor"] ?? "start";
  const left = anchor === "middle" ? x - widest / 2 : anchor === "end" ? x - widest : x;
  const vertical = textVerticalBounds(document, text);
  return {
    left,
    right: left + widest,
    top: vertical?.top ?? y - size,
    bottom: vertical?.bottom ?? y,
  };
}

function elementBounds(document: XmlDocument, element: XmlElement, policy: Policy): Extent | null {
  return element.name === "text" ? textExtent(document, element, policy) : elementExtent(element);
}

function reportOverflow(element: XmlElement, canvas: CanvasSize, bounds: Extent, inspection: Inspection): void {
  const horizontal = Math.max(0, -bounds.left, bounds.right - canvas.width);
  const vertical = Math.max(0, -bounds.top, bounds.bottom - canvas.height);
  if (horizontal <= canvas.width * 0.02 && vertical <= canvas.height * 0.02) return;
  const parts: string[] = [];
  if (horizontal > canvas.width * 0.02) parts.push("x=" + bounds.left.toFixed(1) + "-" + bounds.right.toFixed(1));
  if (vertical > canvas.height * 0.02) parts.push("y=" + bounds.top.toFixed(1) + "-" + bounds.bottom.toFixed(1));
  /*
   * Rect, circle, ellipse, line, polyline, and polygon extents are exact; text
   * advance and the path control hull are estimates. A deterministic clip
   * blocks the figure, an estimated one is reported for review so a wide glyph
   * or an arc radius does not fail an otherwise valid element.
   */
  const estimated = element.name === "text" || element.name === "path";
  inspection.add(
    "canvas",
    "<" + element.name + "> at line " + element.line + " extends past the " + canvas.width + "x" + canvas.height + " canvas (" + parts.join(", ") + ")" + (estimated ? ", estimated from the control hull" : ""),
    estimated ? "warning" : "error",
  );
}

function checkBounds(root: XmlElement, canvas: CanvasSize, inspection: Inspection): void {
  if (canvas.width <= 0 || canvas.height <= 0) return;
  const declaredWidth = Number(root.attributes["width"] ?? "");
  if (Number.isFinite(declaredWidth) && declaredWidth > 0) {
    const drift = Math.abs(declaredWidth - canvas.width) / canvas.width;
    if (drift > 0.01) inspection.add("canvas", "width=" + declaredWidth + " disagrees with viewBox width=" + canvas.width, "warning");
  }
  for (const element of inspection.document.elements) {
    /*
     * A template inside `defs` is not painted where it is declared, so its
     * geometry cannot clip against this canvas. Reporting it would fail a
     * legitimate symbol that is placed elsewhere with a transform.
     */
    if (isUnpainted(inspection.document, element)) continue;
    const bounds = elementBounds(inspection.document, element, inspection.policy);
    if (bounds === null) continue;
    reportOverflow(element, canvas, bounds, inspection);
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
  checkTextContrasts(inspection, canvas);
  checkLineLengths(inspection);
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
    { name: "stylesheet import", svg: clean.replace("</svg>", '<style>@import url("https://example.com/a.css");</style></svg>'), rule: "raster" },
    { name: "duplicate id", svg: clean.replace('id="labels"', 'id="objects"'), rule: "ids" },
    { name: "monolithic trace", svg: clean.replace('</svg>', '<path d="' + "M 0 0 L 1 1 ".repeat(150) + '"/></svg>'), rule: "trace" },
    { name: "outlined text", svg: clean.replace(/<text[\s\S]*?<\/text>/g, ""), rule: "text" },
    { name: "tiny type", svg: clean.replace('font-size="8"', 'font-size="3"'), rule: "text" },
    { name: "low contrast", svg: clean.replace('fill="#12212F" text-anchor', 'fill="#E8EEF6" text-anchor'), rule: "contrast" },
    { name: "ratio drift", svg: clean.replace('viewBox="0 0 640 400"', 'viewBox="0 0 640 120"'), rule: "canvas" },
    { name: "clipped shape", svg: clean.replace('<rect x="10" y="10" width="300" height="200"', '<rect x="600" y="10" width="300" height="200"'), rule: "canvas" },
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
