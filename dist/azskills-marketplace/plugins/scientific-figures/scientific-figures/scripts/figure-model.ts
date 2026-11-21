/*
 * Scene model for scientific figures.
 *
 * A scene is declarative JSON: canvas, panels, nodes, arrows, labels, legend.
 * This module validates it against the shipped schema and policy, resolves
 * geometry, and hands the renderer a normalized model. Keeping validation here
 * means the renderer and the checker share one definition of a valid scene.
 */

import { readFileSync } from "node:fs";
import { validateSceneSchema } from "./scene-schema.ts";
import { validateXmlCharacters } from "./xml-entities.ts";

export type Tone =
  | "ink"
  | "muted"
  | "accent"
  | "accent-2"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type NodeKind =
  | "shape"
  | "cell"
  | "nucleus"
  | "vesicle"
  | "membrane"
  | "receptor"
  | "protein"
  | "channel"
  | "antibody"
  | "dna"
  | "well"
  | "badge";

export type ArrowKind = "flow" | "activation" | "inhibition" | "transport" | "conversion" | "feedback";
export type Side = "top" | "right" | "bottom" | "left";
export type LabelRole = "title" | "subtitle" | "panel" | "label" | "note" | "legend";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Panel {
  id: string;
  box: Box;
  letter: string;
  title: string;
  fill: Tone;
}

export interface SceneNode {
  id: string;
  kind: NodeKind;
  box: Box;
  label: string;
  detail: string;
  tone: Tone;
  shape: "rect" | "round" | "circle" | "ellipse" | "diamond";
  stroke: "none" | "hairline" | "solid" | "dashed";
  labelPlacement: "inside" | "below" | "above" | "right" | "left";
  rotate: number;
}

export interface Port {
  node: string;
  x: number | null;
  y: number | null;
  side: Side | "auto";
}

export interface SceneArrow {
  id: string;
  from: Port;
  to: Port;
  kind: ArrowKind;
  route: "straight" | "elbow";
  label: string;
  tone: Tone;
  dashed: boolean;
}

export interface SceneLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  role: LabelRole;
  anchor: "start" | "middle" | "end";
  tone: Tone;
  maxWidth: number | null;
}

export interface LegendItem {
  id: string;
  label: string;
  kind: "swatch" | "arrow" | "line";
  tone: Tone;
  dashed: boolean;
}

export interface Scene {
  canvas: { width: number; height: number; background: "canvas" | "surface" | "none" };
  theme: "cobalt" | "wabi" | "mono";
  title: string;
  panels: Panel[];
  nodes: SceneNode[];
  arrows: SceneArrow[];
  labels: SceneLabel[];
  legend: LegendItem[];
}

export interface Policy {
  canvas: {
    minRatio: number;
    maxRatio: number;
    minSidePt: number;
    strokeDefaultPt: number;
    strokeMinPt: number;
  };
  type: {
    labelPt: number;
    notePt: number;
    panelPt: number;
    titlePt: number;
    footerPt: number;
    minPt: number;
    family: string;
    charWidthRatio: number;
    lineHeight: number;
  };
  palette: Record<string, string>;
  tints: Record<string, string>;
  themes: Record<string, Record<string, string>>;
  themeTints: Record<string, Record<string, string>>;
  contrast: {
    textOnCanvas: number;
    textOnTint: number;
  };
  layout: {
    marginPt: number;
    gutterPt: number;
    panelPaddingPt: number;
    labelPadPt: number;
    arrowHeadLengthPt: number;
    arrowHeadWidthPt: number;
    cornerRadiusPt: number;
    maxNodes: number;
    maxArrows: number;
    maxLabels: number;
    maxPanels: number;
    maxNodesPerPanel: number;
    minNodePt: number;
  };
  forbidden: {
    elements: string[];
    attributes: string[];
    urlSchemes: string[];
    pathData: string[];
    styleProperties: string[];
    maxSinglePathCommands: number;
    maxPathShare: number;
    traceShareMinCommands: number;
  };
  text: {
    maxOverflowRatio: number;
    maxCharsPerLineNote: number;
    maxCharsPerLineLabel: number;
  };
  verification: {
    minLabels: number;
    minGroups: number;
    requireViewBox: boolean;
    requireTitle: boolean;
    requireLegendWhenTones: number;
    requireAria: boolean;
    requireRoleImg: boolean;
    uniqueIds: boolean;
    idPattern: string;
  };
}

export class SceneError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(path + ": " + message);
    this.name = "SceneError";
    this.path = path;
  }
}

export const policyPath = new URL("../references/quality-policy.json", import.meta.url);

export function loadPolicy(): Policy {
  return JSON.parse(readFileSync(policyPath, "utf8")) as Policy;
}

export interface ResolvedPalette {
  palette: Record<string, string>;
  tints: Record<string, string>;
}

/** Resolve a theme by layering its overrides over the base palette. */
export function resolvePalette(policy: Policy, theme: string): ResolvedPalette {
  const paletteOverride = policy.themes[theme];
  const tintOverride = policy.themeTints[theme];
  if (!paletteOverride || !tintOverride) {
    throw new SceneError("scene.theme", "unknown theme: " + theme);
  }
  return {
    palette: { ...policy.palette, ...paletteOverride },
    tints: { ...policy.tints, ...tintOverride },
  };
}

const TONES: readonly Tone[] = ["ink", "muted", "accent", "accent-2", "success", "warning", "danger", "neutral"];
const NODE_KINDS: readonly NodeKind[] = [
  "shape", "cell", "nucleus", "vesicle", "membrane", "receptor", "protein",
  "channel", "antibody", "dna", "well", "badge",
];
const ARROW_KINDS: readonly ArrowKind[] = ["flow", "activation", "inhibition", "transport", "conversion", "feedback"];
const LABEL_ROLES: readonly LabelRole[] = ["title", "subtitle", "panel", "label", "note", "legend"];
const ID_PATTERN = /^[a-z][a-z0-9-]{1,40}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function fail(path: string, message: string): never {
  throw new SceneError(path, message);
}

function number(value: unknown, path: string, options: { min?: number; max?: number; exclusiveMin?: boolean } = {}): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number");
  if (options.exclusiveMin === true ? value <= (options.min ?? 0) : options.min !== undefined && value < options.min) {
    fail(path, "must be greater than " + (options.min ?? 0));
  }
  if (options.max !== undefined && value > options.max) fail(path, "must be at most " + options.max);
  return value;
}

function text(value: unknown, path: string, maxLength: number): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") fail(path, "must be a string");
  if (Array.from(value).length > maxLength) fail(path, "must be at most " + maxLength + " characters");
  try {
    validateXmlCharacters(value);
  } catch (error) {
    fail(path, error instanceof Error ? error.message : "invalid XML text");
  }
  return value;
}

function pick<T extends string>(value: unknown, options: { allowed: readonly T[]; fallback: T }, path: string): T {
  if (value === undefined || value === null) return options.fallback;
  if (typeof value !== "string" || !(options.allowed as readonly string[]).includes(value)) {
    fail(path, "must be one of " + options.allowed.join(", "));
  }
  return value as T;
}

function boolean(value: unknown, fallback: boolean, path: string): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") fail(path, "must be a boolean");
  return value;
}

function id(value: unknown, path: string): string {
  const result = text(value, path, 41);
  if (!ID_PATTERN.test(result)) fail(path, "must match " + ID_PATTERN.source + " (got " + JSON.stringify(result) + ")");
  return result;
}

function box(value: unknown, path: string, policy: Policy): Box {
  if (!isRecord(value)) fail(path, "must be an object with x, y, width, height");
  const result: Box = {
    x: number(value["x"], path + ".x"),
    y: number(value["y"], path + ".y"),
    width: number(value["width"], path + ".width", { exclusiveMin: true, min: 0 }),
    height: number(value["height"], path + ".height", { exclusiveMin: true, min: 0 }),
  };
  const floor = policy.layout.minNodePt;
  if (result.width < floor || result.height < floor) {
    fail(path, "must be at least " + floor + "pt on each side so the figure stays legible when printed");
  }
  return result;
}

function port(value: unknown, path: string, nodeIds: ReadonlySet<string>): Port {
  if (!isRecord(value)) fail(path, "must be an object with a node id");
  const node = id(value["node"], path + ".node");
  if (!nodeIds.has(node)) fail(path + ".node", "does not name a node in this scene: " + node);
  const optional = (key: "x" | "y"): number | null => {
    const raw = value[key];
    return raw === undefined || raw === null ? null : number(raw, path + "." + key);
  };
  return {
    node,
    x: optional("x"),
    y: optional("y"),
    side: pick(value["side"], { allowed: ["top", "right", "bottom", "left", "auto"] as const, fallback: "auto" }, path + ".side"),
  };
}

function list(source: Record<string, unknown>, key: string, options: { max: number; path: string }): unknown[] {
  const value = source[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(options.path + "." + key, "must be an array");
  if (value.length > options.max) fail(options.path + "." + key, "has " + value.length + " entries; limit is " + options.max);
  return value;
}

/** Validate a parsed scene document and return the normalized model. */
export function parseScene(value: unknown, policy: Policy): Scene {
  validateSceneSchema(value);
  if (!isRecord(value)) fail("scene", "must be an object");
  for (const key of Object.keys(value)) {
    const known = ["canvas", "theme", "title", "panels", "nodes", "arrows", "labels", "legend"];
    if (!known.includes(key)) fail("scene." + key, "is not a scene field");
  }
  const canvasValue = value["canvas"];
  if (!isRecord(canvasValue)) fail("scene.canvas", "must be an object with width and height");
  const width = number(canvasValue["width"], "scene.canvas.width", { exclusiveMin: true, min: 0, max: 20000 });
  const height = number(canvasValue["height"], "scene.canvas.height", { exclusiveMin: true, min: 0, max: 20000 });
  const ratio = width / height;
  const { minRatio, maxRatio, minSidePt } = policy.canvas;
  if (ratio < minRatio || ratio > maxRatio) {
    fail("scene.canvas", "ratio " + ratio.toFixed(2) + " is outside " + minRatio + "-" + maxRatio);
  }
  if (Math.min(width, height) < minSidePt) {
    fail("scene.canvas", "the short side must be at least " + minSidePt + "pt; strokes and 6pt type stop being legible below that");
  }

  const ids = new Set(["svg-title", "background", "panels", "objects", "connectors", "labels", "legend"]);
  const claim = (candidate: string, path: string): void => {
    if (ids.has(candidate)) fail(path, "duplicate id: " + candidate);
    ids.add(candidate);
  };

  const panels: Panel[] = list(value, "panels", { max: policy.layout.maxPanels, path: "scene" }).map((raw, index) => {
    const path = "scene.panels[" + index + "]";
    if (!isRecord(raw)) fail(path, "must be an object");
    const panelId = id(raw["id"], path + ".id");
    claim(panelId, path + ".id");
    const letter = text(raw["letter"], path + ".letter", 1);
    if (raw["letter"] !== undefined && !/^[A-Za-z]$/.test(letter)) fail(path + ".letter", "must be a single letter");
    return {
      id: panelId,
      box: box(raw["box"], path + ".box", policy),
      letter,
      title: text(raw["title"], path + ".title", 120),
      fill: pick(raw["fill"], { allowed: TONES, fallback: "neutral" }, path + ".fill"),
    };
  });

  const nodes: SceneNode[] = list(value, "nodes", { max: policy.layout.maxNodes, path: "scene" }).map((raw, index) => {
    const path = "scene.nodes[" + index + "]";
    if (!isRecord(raw)) fail(path, "must be an object");
    const nodeId = id(raw["id"], path + ".id");
    claim(nodeId, path + ".id");
    claim("obj-label-" + nodeId, path + ".id");
    return {
      id: nodeId,
      kind: pick(raw["kind"], { allowed: NODE_KINDS, fallback: "shape" }, path + ".kind"),
      box: box(raw["box"], path + ".box", policy),
      label: text(raw["label"], path + ".label", 240),
      detail: text(raw["detail"], path + ".detail", 240),
      tone: pick(raw["tone"], { allowed: TONES, fallback: "neutral" }, path + ".tone"),
      shape: pick(raw["shape"], { allowed: ["rect", "round", "circle", "ellipse", "diamond"] as const, fallback: "round" }, path + ".shape"),
      stroke: pick(raw["stroke"], { allowed: ["none", "hairline", "solid", "dashed"] as const, fallback: "solid" }, path + ".stroke"),
      labelPlacement: pick(
        raw["labelPlacement"],
        { allowed: ["inside", "below", "above", "right", "left"] as const, fallback: "inside" },
        path + ".labelPlacement",
      ),
      rotate: raw["rotate"] === undefined ? 0 : number(raw["rotate"], path + ".rotate", { min: -180, max: 180 }),
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const panel of panels) {
    const owned = nodes.filter((node) =>
      node.box.x + node.box.width / 2 >= panel.box.x &&
      node.box.x + node.box.width / 2 <= panel.box.x + panel.box.width &&
      node.box.y + node.box.height / 2 >= panel.box.y &&
      node.box.y + node.box.height / 2 <= panel.box.y + panel.box.height,
    );
    if (owned.length > policy.layout.maxNodesPerPanel) {
      fail(
        "scene.panels[" + panels.indexOf(panel) + "]",
        "holds " + owned.length + " nodes; limit is " + policy.layout.maxNodesPerPanel + " so the panel stays readable at print size",
      );
    }
  }

  const arrows: SceneArrow[] = list(value, "arrows", { max: policy.layout.maxArrows, path: "scene" }).map((raw, index) => {
    const path = "scene.arrows[" + index + "]";
    if (!isRecord(raw)) fail(path, "must be an object");
    const arrowId = id(raw["id"], path + ".id");
    claim(arrowId, path + ".id");
    const kind = pick(raw["kind"], { allowed: ARROW_KINDS, fallback: "flow" }, path + ".kind");
    return {
      id: arrowId,
      from: port(raw["from"], path + ".from", nodeIds),
      to: port(raw["to"], path + ".to", nodeIds),
      kind,
      route: pick(raw["route"], { allowed: ["straight", "elbow"] as const, fallback: "straight" }, path + ".route"),
      label: text(raw["label"], path + ".label", 120),
      tone: pick(raw["tone"], { allowed: TONES, fallback: "ink" }, path + ".tone"),
      dashed: raw["dashed"] === undefined ? kind === "feedback" : boolean(raw["dashed"], false, path + ".dashed"),
    };
  });

  const labels: SceneLabel[] = list(value, "labels", { max: policy.layout.maxLabels, path: "scene" }).map((raw, index) => {
    const path = "scene.labels[" + index + "]";
    if (!isRecord(raw)) fail(path, "must be an object");
    const labelId = id(raw["id"], path + ".id");
    claim(labelId, path + ".id");
    claim("label-" + labelId, path + ".id");
    claim("text-" + labelId, path + ".id");
    const content = text(raw["text"], path + ".text", 240);
    if (!content.trim()) fail(path + ".text", "must not be empty");
    return {
      id: labelId,
      text: content,
      x: number(raw["x"], path + ".x"),
      y: number(raw["y"], path + ".y"),
      role: pick(raw["role"], { allowed: LABEL_ROLES, fallback: "label" }, path + ".role"),
      anchor: pick(raw["anchor"], { allowed: ["start", "middle", "end"] as const, fallback: "start" }, path + ".anchor"),
      tone: pick(raw["tone"], { allowed: TONES, fallback: "ink" }, path + ".tone"),
      maxWidth: raw["maxWidth"] === undefined ? null : number(raw["maxWidth"], path + ".maxWidth", { exclusiveMin: true, min: 0 }),
    };
  });

  const legend: LegendItem[] = list(value, "legend", { max: 24, path: "scene" }).map((raw, index) => {
    const path = "scene.legend[" + index + "]";
    if (!isRecord(raw)) fail(path, "must be an object");
    const itemId = id(raw["id"], path + ".id");
    claim(itemId, path + ".id");
    return {
      id: itemId,
      label: text(raw["label"], path + ".label", 120),
      kind: pick(raw["kind"], { allowed: ["swatch", "arrow", "line"] as const, fallback: "swatch" }, path + ".kind"),
      tone: pick(raw["tone"], { allowed: TONES, fallback: "neutral" }, path + ".tone"),
      dashed: boolean(raw["dashed"], false, path + ".dashed"),
    };
  });

  return {
    canvas: {
      width,
      height,
      background: pick(canvasValue["background"], { allowed: ["canvas", "surface", "none"] as const, fallback: "canvas" }, "scene.canvas.background"),
    },
    theme: pick(value["theme"], { allowed: ["cobalt", "wabi", "mono"] as const, fallback: "cobalt" }, "scene.theme"),
    title: text(value["title"], "scene.title", 200),
    panels,
    nodes,
    arrows,
    labels,
    legend,
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface LegendSlot {
  item: LegendItem;
  x: number;
  y: number;
  symbolWidth: number;
  /** Advance from this slot's left edge to the next slot's left edge. */
  advance: number;
}

export interface LegendLayout {
  slots: readonly LegendSlot[];
  rowHeight: number;
  rows: number;
}

/**
 * Pack legend entries into right-aligned rows. The checker measures the painted
 * legend group instead of re-deriving this layout, so the strip it guards and
 * the strip the reader sees are the same rectangle.
 */
export function layoutLegend(
  legend: readonly LegendItem[],
  canvas: { width: number; height: number },
  policy: Policy,
): LegendLayout {
  const rowHeight = Math.max(policy.type.footerPt * 2.4, 15);
  const symbolWidth = rowHeight * 1.1;
  const charWidth = policy.type.footerPt * policy.type.charWidthRatio;
  const gutter = policy.layout.gutterPt;
  const widths = legend.map(
    (item) => symbolWidth + policy.layout.labelPadPt + Array.from(item.label).length * charWidth,
  );
  const available = canvas.width - policy.layout.marginPt * 2;
  const packing: number[][] = [];
  let current: number[] = [];
  let currentWidth = 0;
  widths.forEach((width, index) => {
    const extra = current.length === 0 ? width : width + gutter;
    if (current.length > 0 && currentWidth + extra > available) {
      packing.push(current);
      current = [index];
      currentWidth = width;
      return;
    }
    current.push(index);
    currentWidth += extra;
  });
  if (current.length > 0) packing.push(current);
  const slots: LegendSlot[] = [];
  packing.forEach((row, rowIndex) => {
    const rowWidth = row.reduce((sum, index) => sum + (widths[index] ?? 0), 0) + gutter * (row.length - 1);
    const y = canvas.height - policy.layout.marginPt - rowHeight * (packing.length - 1 - rowIndex) - rowHeight / 2;
    let x = Math.max(policy.layout.marginPt, canvas.width - policy.layout.marginPt - rowWidth);
    for (const index of row) {
      const item = legend[index];
      if (!item) continue;
      const width = widths[index] ?? 0;
      slots.push({ item, x, y, symbolWidth, advance: width + gutter });
      x += width + gutter;
    }
  });
  return {
    slots,
    rowHeight,
    rows: packing.length,
  };
}

/** The intersection of a ray from the box centre toward `target` with the box edge. */
export function anchorOnBox(source: Box, target: Point, side: Side | "auto"): { point: Point; side: Side } {
  const centre: Point = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const dx = target.x - centre.x;
  const dy = target.y - centre.y;
  const resolved: Side =
    side !== "auto"
      ? side
      : Math.abs(dx) * source.height >= Math.abs(dy) * source.width
        ? dx >= 0 ? "right" : "left"
        : dy >= 0 ? "bottom" : "top";
  switch (resolved) {
    case "top":
      return { point: { x: centre.x, y: source.y }, side: "top" };
    case "bottom":
      return { point: { x: centre.x, y: source.y + source.height }, side: "bottom" };
    case "left":
      return { point: { x: source.x, y: centre.y }, side: "left" };
    default:
      return { point: { x: source.x + source.width, y: centre.y }, side: "right" };
  }
}

/**
 * Approximate rendered text width. CJK glyphs are square; latin glyphs average
 * narrower than a full em. The estimator drives wrapping and the overflow gate,
 * so it stays deliberately conservative.
 */
export function textWidth(content: string, sizePt: number, policy: Policy): number {
  let units = 0;
  for (const char of content) {
    units += /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(char) ? 1 : policy.type.charWidthRatio;
  }
  return units * sizePt;
}

export interface WrapOptions {
  sizePt: number;
  maxWidth: number;
  /**
   * Hard character cap per line. The checker gates note and label roles by
   * character count, so wrapping by width alone can emit a line the checker
   * then rejects. Passing the same limit here keeps render and gate aligned.
   */
  maxChars?: number;
}

interface WrapState {
  lines: string[];
  current: string;
}

function flushLine(state: WrapState): void {
  if (state.current.trim() !== "") state.lines.push(state.current.trim());
  state.current = "";
}

const lineLength = (line: string): number => Array.from(line).length;

function fits(current: string, addition: string, context: WrapOptions & { policy: Policy }): boolean {
  const candidate = current + addition;
  if (textWidth(candidate, context.sizePt, context.policy) > context.maxWidth) return false;
  return context.maxChars === undefined || lineLength(candidate) <= context.maxChars;
}

function appendToken(token: string, state: WrapState, context: WrapOptions & { policy: Policy }): void {
  if (/^\s+$/.test(token)) {
    if (state.current !== "") state.current += " ";
    return;
  }
  if (state.current !== "" && fits(state.current, token, context)) {
    state.current += token;
    return;
  }
  flushLine(state);
  for (const character of token) {
    if (state.current !== "" && !fits(state.current, character, context)) flushLine(state);
    state.current += character;
  }
}

/** Greedy word wrap that also breaks between CJK glyphs when no space exists. */
export function wrapText(content: string, options: WrapOptions, policy: Policy): string[] {
  if (content.trim() === "") return [];
  const state: WrapState = { lines: [], current: "" };
  const context = { ...options, policy };
  const tokens = content.split(/(\s+)/).filter((token) => token.length > 0);
  for (const token of tokens) appendToken(token, state, context);
  flushLine(state);
  return state.lines;
}
