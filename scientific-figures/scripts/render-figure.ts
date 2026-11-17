#!/usr/bin/env node
/*
 * Scientific figure renderer.
 *
 * Scene JSON in, semantic SVG out. Every panel, object, connector, and label
 * becomes its own named group so the result stays editable in Illustrator or
 * Inkscape: text is real <text>, arrow shafts and heads are separate shapes, and
 * no image, data URI, or flattened single-path trace is ever produced.
 *
 * Usage:
 *   node scientific-figures/scripts/render-figure.ts --scene figure.json --out figure.svg
 *   node scientific-figures/scripts/render-figure.ts --scene figure.json --stdout
 *   node scientific-figures/scripts/render-figure.ts --self-test
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  type Box,
  type Panel,
  type Policy,
  type Point,
  type ResolvedPalette,
  type Scene,
  type SceneArrow,
  type SceneNode,
  type Side,
  anchorOnBox,
  layoutLegend,
  loadPolicy,
  parseScene,
  resolvePalette,
  wrapText,
} from "./figure-model.ts";
import { runSelfTest } from "./figure-self-test.ts";

const round = (value: number): number => Math.round(value * 100) / 100;
const fmt = (value: number): string => String(round(value));

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const attribute = (name: string, value: string | number): string => " " + name + '="' + value + '"';

const roleSize = (role: string, policy: Policy): number => {
  switch (role) {
    case "title":
      return policy.type.titlePt;
    case "subtitle":
      return policy.type.panelPt;
    case "panel":
      return policy.type.panelPt;
    case "note":
      return policy.type.notePt;
    case "legend":
      return policy.type.footerPt;
    default:
      return policy.type.labelPt;
  }
};

/**
 * The checker caps note and label lines by character count, so wrapping has to
 * honour the same cap. Without it the renderer emits a line the gate rejects,
 * which is how the shipped example warned about its own note.
 */
const roleMaxChars = (role: string, policy: Policy): number | undefined => {
  switch (role) {
    case "note":
      return policy.text.maxCharsPerLineNote;
    case "label":
      return policy.text.maxCharsPerLineLabel;
    default:
      return undefined;
  }
};

const strokeWidth = (style: string, policy: Policy): number => {
  switch (style) {
    case "hairline":
      return policy.canvas.strokeMinPt;
    case "none":
      return 0;
    default:
      return policy.canvas.strokeDefaultPt;
  }
};

interface TextRequest {
  lines: readonly string[];
  x: number;
  y: number;
  size: number;
  fill: string;
  anchor: "start" | "middle" | "end";
  lineHeight: number;
  weight: number;
  family: string;
  id: string | null;
  tabular: boolean;
  style?: "italic" | "normal";
}

/** Emit one `<text>` element with a `<tspan>` per line, so edits stay targeted. */
function emitText(out: string[], request: TextRequest): void {
  if (request.lines.length === 0) return;
  const open =
    "<text" +
    (request.id === null ? "" : attribute("id", request.id)) +
    attribute("x", fmt(request.x)) +
    attribute("y", fmt(request.y)) +
    attribute("font-size", request.size) +
    attribute("fill", request.fill) +
    attribute("text-anchor", request.anchor) +
    attribute("font-weight", request.weight) +
    attribute("font-style", request.style ?? "normal") +
    attribute("font-family", escapeXml(request.family)) +
    (request.tabular ? attribute("font-variant-numeric", "tabular-nums") : "") +
    ">";
  out.push(open);
  request.lines.forEach((line, index) => {
    out.push(
      "<tspan" +
        attribute("x", fmt(request.x)) +
        attribute("dy", index === 0 ? 0 : round(request.size * request.lineHeight)) +
        ">" +
        escapeXml(line) +
        "</tspan>",
    );
  });
  out.push("</text>");
}

interface Paint {
  fill: string;
  /** Null when the object declares `stroke: none`. */
  stroke: string | null;
  strokeWidth: number;
  dashed: boolean;
}

interface RenderContext {
  policy: Policy;
  palette: ResolvedPalette;
}

interface ArrowContext extends RenderContext {
  nodes: ReadonlyMap<string, SceneNode>;
}

/** Paint attributes only; rotation is applied once on the object's outer group. */
const shapeAttributes = (paint: Paint): string =>
  attribute("fill", paint.fill) +
  (paint.stroke === null
    ? ""
    : attribute("stroke", paint.stroke) +
      attribute("stroke-width", paint.strokeWidth) +
      (paint.dashed ? attribute("stroke-dasharray", "4 3") : ""));

const rotationTransform = (rotate: number, centre: Point): string =>
  rotate === 0 ? "" : attribute("transform", "rotate(" + round(rotate) + " " + fmt(centre.x) + " " + fmt(centre.y) + ")");

/**
 * Primitive markup for one object kind. Each kind stays a small set of native
 * shapes; nothing collapses into a single tracing path, and every part is a
 * separate element the user can select.
 */
function nodePrimitives(
  node: SceneNode,
  context: RenderContext,
  paint: Paint,
): string[] {
  const { policy, palette } = context;
  const box: Box = node.box;
  const centre: Point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const attrs = shapeAttributes(paint);
  const ellipse = (radiusX: number, radiusY: number, extra: string): string =>
    '<ellipse cx="' + fmt(centre.x) + '" cy="' + fmt(centre.y) + '" rx="' + fmt(radiusX) + '" ry="' + fmt(radiusY) + '"' + extra + "/>";
  const innerTint = palette.tints["accent-2"] ?? "#EEEEEE";
  const coreTint = palette.tints["accent"] ?? "#EEEEEE";
  const stroke = paint.stroke ?? paint.fill;

  switch (node.kind) {
    case "cell":
      return [
        ellipse(box.width / 2, box.height / 2, attrs),
        // Interior discs stay tinted, never saturated, so an 8pt label on top keeps 4.5:1.
        ellipse(box.width * 0.27, box.height * 0.27, attribute("fill", innerTint)),
        ellipse(box.width * 0.15, box.height * 0.15, attribute("fill", coreTint)),
      ];
    case "nucleus":
    case "vesicle":
      return [ellipse(box.width / 2, box.height / 2, attrs)];
    case "membrane": {
      const band = policy.canvas.strokeDefaultPt * 2;
      const bead = Math.max(2, band);
      const count = Math.max(2, Math.floor(box.width / (bead * 2)));
      const parts = [
        '<rect x="' + fmt(box.x) + '" y="' + fmt(centre.y - policy.canvas.strokeDefaultPt) + '" width="' + fmt(box.width) +
          '" height="' + fmt(band) + '" rx="' + fmt(policy.canvas.strokeDefaultPt) + '"' + attribute("fill", paint.fill) + "/>",
      ];
      for (let index = 0; index < count; index += 1) {
        const x = box.x + (box.width * (index + 0.5)) / count;
        parts.push(
          '<circle cx="' + fmt(x) + '" cy="' + fmt(centre.y) + '" r="' + fmt(bead / 2) + '"' +
            attribute("fill", stroke) + attribute("fill-opacity", 0.55) + "/>",
        );
      }
      return parts;
    }
    case "dna": {
      const steps = 12;
      const parts: string[] = [];
      for (let index = 0; index <= steps; index += 1) {
        const ratio = index / steps;
        const y = box.y + box.height * ratio;
        const offset = Math.sin(ratio * Math.PI * 2) * (box.width / 2);
        parts.push(
          '<circle cx="' + fmt(centre.x + offset) + '" cy="' + fmt(y) + '" r="' + fmt(policy.canvas.strokeDefaultPt) +
            '"' + attribute("fill", paint.fill) + "/>",
        );
        parts.push(
          '<circle cx="' + fmt(centre.x - offset) + '" cy="' + fmt(y) + '" r="' + fmt(policy.canvas.strokeDefaultPt) +
            '"' + attribute("fill", paint.fill) + attribute("fill-opacity", 0.6) + "/>",
        );
        if (index < steps) {
          parts.push(
            '<line x1="' + fmt(centre.x + offset) + '" y1="' + fmt(y) + '" x2="' + fmt(centre.x - offset) +
              '" y2="' + fmt(y) + '"' + attribute("stroke", stroke) + attribute("stroke-width", 0.6) +
              attribute("stroke-opacity", 0.7) + "/>",
          );
        }
      }
      return parts;
    }
    case "channel": {
      const thickness = Math.max(policy.canvas.strokeDefaultPt * 2, box.width * 0.12);
      const leaf = (x: number): string =>
        '<rect x="' + fmt(x) + '" y="' + fmt(box.y) + '" width="' + fmt(thickness) + '" height="' + fmt(box.height) +
        '" rx="' + fmt(thickness / 2) + '"' + attribute("fill", paint.fill) + "/>";
      return [leaf(box.x), leaf(box.x + box.width - thickness)];
    }
    case "receptor": {
      const thickness = Math.max(policy.canvas.strokeDefaultPt * 2, box.width * 0.16);
      const arm = (x: number): string =>
        '<rect x="' + fmt(x) + '" y="' + fmt(box.y) + '" width="' + fmt(thickness) + '" height="' + fmt(box.height * 0.72) +
        '" rx="' + fmt(thickness / 2) + '"' + attribute("fill", paint.fill) + "/>";
      return [
        arm(box.x),
        arm(box.x + box.width - thickness),
        '<rect x="' + fmt(box.x - box.width * 0.12) + '" y="' + fmt(box.y + box.height * 0.62) + '" width="' +
          fmt(box.width * 1.24) + '" height="' + fmt(box.height * 0.22) + '" rx="' + fmt(box.height * 0.08) + '"' +
          attribute("fill", stroke) + "/>",
      ];
    }
    case "protein": {
      const radius = Math.min(box.width, box.height) / 2;
      const lobes: readonly Point[] = [
        { x: box.x + box.width * 0.22, y: box.y + box.height * 0.28 },
        { x: box.x + box.width * 0.78, y: box.y + box.height * 0.34 },
        { x: box.x + box.width * 0.5, y: box.y + box.height * 0.76 },
      ];
      return [
        '<circle cx="' + fmt(centre.x) + '" cy="' + fmt(centre.y) + '" r="' + fmt(radius) + '"' +
          attribute("fill", paint.fill) + attribute("fill-opacity", 0.75) + "/>",
        ...lobes.map((lobe) =>
          '<circle cx="' + fmt(lobe.x) + '" cy="' + fmt(lobe.y) + '" r="' + fmt(Math.min(box.width, box.height) * 0.2) +
          '"' + attribute("fill", paint.fill) + "/>",
        ),
      ];
    }
    case "antibody": {
      const weight = Math.max(1.4, box.width * 0.12);
      const stem: Point = { x: centre.x, y: box.y + box.height * 0.72 };
      const arm = (tip: Point): string =>
        '<path d="M ' + fmt(stem.x) + " " + fmt(stem.y) + " L " + fmt(tip.x) + " " + fmt(tip.y) + '" fill="none"' +
        attribute("stroke", paint.fill) + attribute("stroke-width", weight) +
        attribute("stroke-linecap", "round") + attribute("stroke-linejoin", "round") + "/>";
      return [
        '<line x1="' + fmt(stem.x) + '" y1="' + fmt(box.y + box.height) + '" x2="' + fmt(stem.x) + '" y2="' + fmt(stem.y) +
          '"' + attribute("stroke", paint.fill) + attribute("stroke-width", weight) + attribute("stroke-linecap", "round") + "/>",
        arm({ x: box.x, y: box.y }),
        arm({ x: box.x + box.width, y: box.y }),
      ];
    }
    case "well":
    case "badge":
      return [
        '<circle cx="' + fmt(centre.x) + '" cy="' + fmt(centre.y) + '" r="' +
          fmt(Math.min(box.width, box.height) / 2) + '"' + attrs + "/>",
      ];
    default:
      break;
  }
  if (node.shape === "circle") {
    return [
      '<circle cx="' + fmt(centre.x) + '" cy="' + fmt(centre.y) + '" r="' +
        fmt(Math.min(box.width, box.height) / 2) + '"' + attrs + "/>",
    ];
  }
  if (node.shape === "ellipse") {
    return [ellipse(box.width / 2, box.height / 2, attrs)];
  }
  if (node.shape === "diamond") {
    const points: readonly Point[] = [
      { x: centre.x, y: box.y },
      { x: box.x + box.width, y: centre.y },
      { x: centre.x, y: box.y + box.height },
      { x: box.x, y: centre.y },
    ];
    return ['<polygon points="' + points.map((point) => fmt(point.x) + "," + fmt(point.y)).join(" ") + '"' + attrs + "/>"];
  }
  const radius = node.shape === "rect" ? 0 : policy.layout.cornerRadiusPt * 2;
  return [
    '<rect x="' + fmt(box.x) + '" y="' + fmt(box.y) + '" width="' + fmt(box.width) + '" height="' + fmt(box.height) +
      '" rx="' + fmt(radius) + '"' + attrs + "/>",
  ];
}

const CIRCLE_KINDS: ReadonlySet<SceneNode["kind"]> = new Set(["well", "badge"]);

function drawsCircle(node: SceneNode): boolean {
  if (CIRCLE_KINDS.has(node.kind)) return true;
  return node.kind === "shape" && node.shape === "circle";
}

function nodeBounds(node: SceneNode): Box {
  const box = node.box;
  if (!drawsCircle(node)) return box;
  const side = Math.min(box.width, box.height);
  return { x: box.x + (box.width - side) / 2, y: box.y + (box.height - side) / 2, width: side, height: side };
}

/** The text area a node's label occupies; outside labels get a fixed gutter. */
function labelBox(node: SceneNode, policy: Policy): Box {
  const pad = policy.layout.labelPadPt;
  if (node.labelPlacement === "inside") {
    const bounds = nodeBounds(node);
    return {
      x: bounds.x + pad,
      y: bounds.y + pad,
      width: Math.max(policy.layout.minNodePt, bounds.width - pad * 2),
      height: Math.max(policy.layout.minNodePt, bounds.height - pad * 2),
    };
  }
  const height = policy.type.labelPt * policy.type.lineHeight * 2;
  const gutter = Math.min(120, Math.max(64, policy.type.labelPt * 9));
  switch (node.labelPlacement) {
    case "below":
      return { x: node.box.x, y: node.box.y + node.box.height + policy.type.labelPt * 0.9, width: Math.max(gutter, node.box.width), height };
    case "above":
      return { x: node.box.x, y: node.box.y - policy.type.labelPt * 1.3, width: Math.max(gutter, node.box.width), height };
    case "right":
      return { x: node.box.x + node.box.width + pad, y: node.box.y + node.box.height / 2 - policy.type.labelPt / 2, width: gutter, height };
    default:
      return { x: node.box.x - pad - gutter, y: node.box.y + node.box.height / 2 - policy.type.labelPt / 2, width: gutter, height };
  }
}

function nodePaint(node: SceneNode, palette: ResolvedPalette, policy: Policy): Paint {
  return {
    fill: palette.tints[node.tone] ?? palette.palette[node.tone] ?? palette.palette["neutral"] ?? "#EEEEEE",
    stroke: node.stroke === "none" ? null : palette.palette[node.tone] ?? palette.palette["ink"] ?? "#000000",
    strokeWidth: strokeWidth(node.stroke, policy),
    dashed: node.stroke === "dashed",
  };
}

/** Geometry only, so a later object can never paint over an earlier label. */
function renderNodeGeometry(node: SceneNode, context: RenderContext, out: string[]): void {
  const centre: Point = { x: node.box.x + node.box.width / 2, y: node.box.y + node.box.height / 2 };
  out.push("<g" + attribute("id", node.id) + attribute("data-kind", node.kind) + attribute("data-tone", node.tone) + rotationTransform(node.rotate, centre) + ">");
  out.push(...nodePrimitives({ ...node, rotate: 0 }, context, nodePaint(node, context.palette, context.policy)));
  out.push("</g>");
}

function renderNodeLabel(node: SceneNode, context: RenderContext, out: string[]): void {
  const { policy, palette } = context;
  if (node.label === "" && node.detail === "") return;
  const centre: Point = { x: node.box.x + node.box.width / 2, y: node.box.y + node.box.height / 2 };
  const followsNode = node.labelPlacement === "inside" ? rotationTransform(node.rotate, centre) : "";
  out.push(
    "<g" + attribute("id", "obj-label-" + node.id) + attribute("data-for", node.id) +
      attribute("data-kind", "node-label") + attribute("data-placement", node.labelPlacement) + followsNode + ">",
  );
  const area = labelBox(node, policy);
  const size = policy.type.labelPt;
  const anchor = node.labelPlacement === "inside" ? "middle" : "start";
  const x = anchor === "middle" ? area.x + area.width / 2 : area.x;
  const lines = wrapText(
    node.label,
    { sizePt: size, maxWidth: area.width, maxChars: roleMaxChars("label", policy) },
    policy,
  );
  /*
   * The detail line lives in the node-label group, so the checker measures it
   * under the label role. Without the label cap here the renderer can emit a
   * line its own gate reports as a warning.
   */
  const detailLines = wrapText(
    node.detail,
    { sizePt: policy.type.notePt, maxWidth: area.width, maxChars: roleMaxChars("label", policy) },
    policy,
  );
  const total = lines.length + detailLines.length;
  const firstY =
    node.labelPlacement === "inside"
      ? area.y + area.height / 2 - ((total - 1) * size * policy.type.lineHeight) / 2 + size * 0.35
      : area.y + size * 0.9;
  emitText(out, {
    lines,
    x,
    y: firstY,
    size,
    fill: palette.palette["ink"] ?? "#000000",
    anchor,
    lineHeight: policy.type.lineHeight,
    weight: 600,
    family: policy.type.family,
    id: null,
    tabular: false,
  });
  if (detailLines.length > 0) {
    emitText(out, {
      lines: detailLines,
      x,
      y: firstY + lines.length * size * policy.type.lineHeight,
      size: policy.type.notePt,
      fill: palette.palette["muted"] ?? "#444444",
      anchor,
      lineHeight: policy.type.lineHeight,
      weight: 400,
      family: policy.type.family,
      id: null,
      tabular: false,
    });
  }
  out.push("</g>");
}

interface ArrowGeometry {
  points: readonly Point[];
  start: Point;
  end: Point;
  startSide: Side;
  endSide: Side;
}

interface Anchor {
  point: Point;
  side: Side;
}

const SIDE_OFFSETS: Readonly<Record<Side, Point>> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

function rotatePoint(point: Point, centre: Point, degrees: number): Point {
  const radians = degrees * Math.PI / 180;
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  return {
    x: centre.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: centre.y + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

function offsetAnchor(anchor: Anchor, gap: number): Point {
  const direction = SIDE_OFFSETS[anchor.side];
  return { x: anchor.point.x + direction.x * gap, y: anchor.point.y + direction.y * gap };
}

function rotatedAnchor(node: SceneNode, target: Point, options: { side: Side | "auto"; gap: number }): Anchor {
  const centre = { x: node.box.x + node.box.width / 2, y: node.box.y + node.box.height / 2 };
  const localTarget = rotatePoint(target, centre, -node.rotate);
  const anchor = anchorOnBox(nodeBounds(node), localTarget, options.side);
  const direction = rotatePoint(SIDE_OFFSETS[anchor.side], { x: 0, y: 0 }, node.rotate);
  const horizontal = Math.abs(direction.x) >= Math.abs(direction.y);
  const side = horizontal ? direction.x >= 0 ? "right" : "left" : direction.y >= 0 ? "bottom" : "top";
  return { point: rotatePoint(offsetAnchor(anchor, options.gap), centre, node.rotate), side };
}

function arrowGeometry(arrow: SceneArrow, nodes: ReadonlyMap<string, SceneNode>, policy: Policy): ArrowGeometry {
  const fromNode = nodes.get(arrow.from.node);
  const toNode = nodes.get(arrow.to.node);
  if (!fromNode || !toNode) throw new Error("Arrow " + arrow.id + " references a missing node");
  const fromCentre: Point = { x: fromNode.box.x + fromNode.box.width / 2, y: fromNode.box.y + fromNode.box.height / 2 };
  const toCentre: Point = { x: toNode.box.x + toNode.box.width / 2, y: toNode.box.y + toNode.box.height / 2 };
  const explicit = (port: { x: number | null; y: number | null }): boolean => port.x !== null && port.y !== null;
  const fromTarget: Point = explicit(arrow.to) ? { x: arrow.to.x ?? 0, y: arrow.to.y ?? 0 } : toCentre;
  const toTarget: Point = explicit(arrow.from) ? { x: arrow.from.x ?? 0, y: arrow.from.y ?? 0 } : fromCentre;
  const gap = policy.layout.labelPadPt;
  const fromSide = arrow.from.side === "auto" ? "right" : arrow.from.side;
  const toSide = arrow.to.side === "auto" ? "left" : arrow.to.side;
  const start = explicit(arrow.from)
    ? { point: offsetAnchor({ point: { x: arrow.from.x ?? 0, y: arrow.from.y ?? 0 }, side: fromSide }, gap), side: fromSide }
    : rotatedAnchor(fromNode, fromTarget, { side: arrow.from.side, gap });
  const end = explicit(arrow.to)
    ? { point: offsetAnchor({ point: { x: arrow.to.x ?? 0, y: arrow.to.y ?? 0 }, side: toSide }, gap), side: toSide }
    : rotatedAnchor(toNode, toTarget, { side: arrow.to.side, gap });
  const startPoint = start.point;
  const endPoint = end.point;
  const points: Point[] = [startPoint];
  if (arrow.route === "elbow") {
    const horizontalFirst = start.side === "left" || start.side === "right";
    const mid: Point = horizontalFirst
      ? { x: (startPoint.x + endPoint.x) / 2, y: startPoint.y }
      : { x: startPoint.x, y: (startPoint.y + endPoint.y) / 2 };
    const second: Point = horizontalFirst ? { x: mid.x, y: endPoint.y } : { x: endPoint.x, y: mid.y };
    points.push(mid, second);
  }
  points.push(endPoint);
  return { points, start: startPoint, end: endPoint, startSide: start.side, endSide: end.side };
}

function renderArrow(
  arrow: SceneArrow,
  context: ArrowContext,
  out: string[],
): void {
  const { policy, palette } = context;
  const geometry = arrowGeometry(arrow, context.nodes, policy);
  const ink = palette.palette[arrow.tone] ?? palette.palette["ink"] ?? "#000000";
  const headLength = policy.layout.arrowHeadLengthPt;
  const headWidth = policy.layout.arrowHeadWidthPt;
  const tail = geometry.points[geometry.points.length - 2] ?? geometry.start;
  const tip = geometry.end;
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const shaftEnd: Point = { x: tip.x - Math.cos(angle) * headLength * 0.9, y: tip.y - Math.sin(angle) * headLength * 0.9 };
  const shaft: readonly Point[] = [...geometry.points.slice(0, -1), shaftEnd];
  const headAttrs =
    attribute("stroke", ink) +
    attribute("stroke-width", policy.canvas.strokeDefaultPt) +
    attribute("stroke-linejoin", "round") +
    attribute("stroke-linecap", "round");

  out.push("<g" + attribute("id", arrow.id) + attribute("data-kind", arrow.kind) + attribute("data-tone", arrow.tone) + ">");
  out.push(
    '<polyline points="' + shaft.map((point) => fmt(point.x) + "," + fmt(point.y)).join(" ") +
      '" fill="none"' + headAttrs + (arrow.dashed ? attribute("stroke-dasharray", "5 3") : "") + "/>",
  );
  if (arrow.kind === "inhibition") {
    // A bar perpendicular to the shaft: the standard inhibition glyph.
    const half = headWidth * 0.8;
    const normal: Point = { x: -Math.sin(angle) * half, y: Math.cos(angle) * half };
    out.push(
      '<line x1="' + fmt(tip.x - normal.x) + '" y1="' + fmt(tip.y - normal.y) + '" x2="' + fmt(tip.x + normal.x) +
        '" y2="' + fmt(tip.y + normal.y) + '"' + attribute("stroke", ink) +
        attribute("stroke-width", policy.canvas.strokeDefaultPt * 1.6) + attribute("stroke-linecap", "butt") + "/>",
    );
  } else {
    const wing = (offset: number): Point => ({
      x: tip.x - Math.cos(angle - offset) * headWidth,
      y: tip.y - Math.sin(angle - offset) * headWidth,
    });
    const left = wing(Math.PI / 7);
    const right = wing(-Math.PI / 7);
    out.push(
      '<polygon points="' + [fmt(tip.x) + "," + fmt(tip.y), fmt(left.x) + "," + fmt(left.y), fmt(right.x) + "," + fmt(right.y)].join(" ") +
        '"' + attribute("fill", ink) + "/>",
    );
  }
  if (arrow.label) {
    const mid = geometry.points[Math.floor(geometry.points.length / 2)] ?? geometry.start;
    const normal: Point = { x: -Math.sin(angle), y: Math.cos(angle) };
    const offset = policy.type.notePt * 0.9;
    const lines = wrapText(arrow.label, { sizePt: policy.type.notePt, maxWidth: 72 }, policy);
    emitText(out, {
      lines,
      x: mid.x + normal.x * offset,
      y: mid.y + normal.y * offset - policy.type.notePt * 0.2,
      size: policy.type.notePt,
      fill: palette.palette["muted"] ?? "#444444",
      anchor: "middle",
      lineHeight: policy.type.lineHeight,
      weight: 400,
      family: policy.type.family,
      id: null,
      tabular: false,
    });
  }
  out.push("</g>");
}

function renderPanels(panels: readonly Panel[], context: RenderContext, out: string[]): void {
  if (panels.length === 0) return;
  const { policy, palette: resolved } = context;
  const palette = resolved.palette;
  out.push('<g id="panels">');
  for (const panel of panels) {
    const fill = resolved.tints[panel.fill] ?? palette[panel.fill] ?? palette["neutral"] ?? "#EEEEEE";
    out.push("<g" + attribute("id", panel.id) + attribute("data-kind", "panel") + ">");
    out.push(
      '<rect x="' + fmt(panel.box.x) + '" y="' + fmt(panel.box.y) + '" width="' + fmt(panel.box.width) + '" height="' +
        fmt(panel.box.height) + '" rx="' + fmt(policy.layout.cornerRadiusPt * 2) + '"' + attribute("fill", fill) +
        attribute("stroke", palette["rule"] ?? "#CCCCCC") + attribute("stroke-width", policy.canvas.strokeMinPt) + "/>",
    );
    const top = panel.box.y + policy.type.panelPt * 1.1;
    let textX = panel.box.x + policy.layout.panelPaddingPt;
    if (panel.letter !== "") {
      emitText(out, {
        lines: [panel.letter],
        x: textX,
        y: top,
        size: policy.type.panelPt,
        fill: palette["ink"] ?? "#000000",
        anchor: "start",
        lineHeight: policy.type.lineHeight,
        weight: 700,
        family: policy.type.family,
        id: null,
        tabular: false,
      });
      textX += policy.type.panelPt;
    }
    if (panel.title !== "") {
      const width = panel.box.width - policy.layout.panelPaddingPt * 2 - (textX - panel.box.x - policy.layout.panelPaddingPt);
      emitText(out, {
        lines: wrapText(panel.title, { sizePt: policy.type.panelPt, maxWidth: width }, policy),
        x: textX,
        y: top,
        size: policy.type.panelPt,
        fill: palette["ink"] ?? "#000000",
        anchor: "start",
        lineHeight: policy.type.lineHeight,
        weight: 700,
        family: policy.type.family,
        id: null,
        tabular: false,
      });
    }
    out.push("</g>");
  }
  out.push("</g>");
}

function renderLegend(scene: Scene, context: RenderContext, out: string[]): void {
  if (scene.legend.length === 0) return;
  const { policy, palette: resolved } = context;
  const palette = resolved.palette;
  const layout = layoutLegend(scene.legend, scene.canvas, policy);
  out.push('<g id="legend">');
  for (const slot of layout.slots) {
    const { item, x, y, symbolWidth } = slot;
    const ink = palette[item.tone] ?? "#000000";
    out.push(
      "<g" + attribute("id", item.id) + attribute("data-kind", "legend-item") + attribute("data-tone", item.tone) + ">",
    );
    if (item.kind === "swatch") {
      out.push(
        '<rect x="' + fmt(x) + '" y="' + fmt(y - layout.rowHeight * 0.28) + '" width="' + fmt(layout.rowHeight * 0.56) + '" height="' +
          fmt(layout.rowHeight * 0.56) + '" rx="2"' + attribute("fill", resolved.tints[item.tone] ?? ink) +
          attribute("stroke", ink) + attribute("stroke-width", policy.canvas.strokeMinPt) + "/>",
      );
    } else if (item.kind === "arrow") {
      out.push(
        '<polyline points="' + fmt(x) + "," + fmt(y) + " " + fmt(x + symbolWidth - 4) + "," + fmt(y) + '" fill="none"' +
          attribute("stroke", ink) + attribute("stroke-width", policy.canvas.strokeDefaultPt) +
          (item.dashed ? attribute("stroke-dasharray", "5 3") : "") + "/>",
      );
      out.push(
        '<polygon points="' +
          [fmt(x + symbolWidth) + "," + fmt(y), fmt(x + symbolWidth - 4) + "," + fmt(y - 3), fmt(x + symbolWidth - 4) + "," + fmt(y + 3)].join(" ") +
          '"' + attribute("fill", ink) + "/>",
      );
    } else {
      out.push(
        '<line x1="' + fmt(x) + '" y1="' + fmt(y) + '" x2="' + fmt(x + symbolWidth) + '" y2="' + fmt(y) + '"' +
          attribute("stroke", ink) + attribute("stroke-width", policy.canvas.strokeDefaultPt) +
          (item.dashed ? attribute("stroke-dasharray", "5 3") : "") + "/>",
      );
    }
    emitText(out, {
      lines: [item.label],
      x: x + symbolWidth + policy.layout.labelPadPt,
      y: y + policy.type.footerPt * 0.35,
      size: policy.type.footerPt,
      fill: palette["ink"] ?? "#000000",
      anchor: "start",
      lineHeight: policy.type.lineHeight,
      weight: 400,
      family: policy.type.family,
      id: null,
      tabular: false,
    });
    out.push("</g>");
  }
  out.push("</g>");
}

/** Render one normalized scene to a semantic SVG document. */
export function renderScene(scene: Scene, policy: Policy): string {
  const resolved = resolvePalette(policy, scene.theme);
  const palette = resolved.palette;
  const out: string[] = [];
  const label = scene.title || "Scientific figure";
  out.push(
    '<svg xmlns="http://www.w3.org/2000/svg"' +
      attribute("viewBox", "0 0 " + fmt(scene.canvas.width) + " " + fmt(scene.canvas.height)) +
      attribute("width", fmt(scene.canvas.width)) +
      attribute("height", fmt(scene.canvas.height)) +
      attribute("role", "img") +
      attribute("aria-labelledby", "svg-title") +
      ">",
  );
  out.push("<title" + attribute("id", "svg-title") + ">" + escapeXml(label) + "</title>");
  out.push(
    "<desc>" +
      escapeXml(
        "Scientific figure reconstructed from declarative geometry. Every panel, object, connector, and label is an independently editable vector element.",
      ) +
      "</desc>",
  );
  if (scene.canvas.background !== "none") {
    const background = scene.canvas.background === "surface" ? palette["surface"] ?? "#F5F7FA" : palette["canvas"] ?? "#FFFFFF";
    out.push('<g id="background">');
    out.push(
      '<rect x="0" y="0"' + attribute("width", fmt(scene.canvas.width)) + attribute("height", fmt(scene.canvas.height)) +
        attribute("fill", background) + "/>",
    );
    out.push("</g>");
  }
  renderPanels(scene.panels, { policy, palette: resolved }, out);
  if (scene.nodes.length > 0) {
    out.push('<g id="objects">');
    for (const node of scene.nodes) renderNodeGeometry(node, { policy, palette: resolved }, out);
    out.push("</g>");
  }
  const byId = new Map(scene.nodes.map((node) => [node.id, node]));
  if (scene.arrows.length > 0) {
    out.push('<g id="connectors">');
    for (const arrow of scene.arrows) renderArrow(arrow, { policy, palette: resolved, nodes: byId }, out);
    out.push("</g>");
  }
  if (scene.labels.length > 0 || scene.nodes.some((node) => node.label !== "" || node.detail !== "")) {
    out.push('<g id="labels">');
    /*
     * Object captions paint here, not inside the object group: a label that sat
     * next to its own shape could be covered by a later neighbour, which is
     * exactly how a membrane band erases a receptor name.
     */
    for (const node of scene.nodes) renderNodeLabel(node, { policy, palette: resolved }, out);
    for (const item of scene.labels) {
      const size = roleSize(item.role, policy);
      const tone = palette[item.tone] ?? palette["ink"] ?? "#000000";
      const lines = wrapText(
        item.text,
        { sizePt: size, maxWidth: item.maxWidth ?? scene.canvas.width, maxChars: roleMaxChars(item.role, policy) },
        policy,
      );
      out.push(
        "<g" + attribute("id", "label-" + item.id) + attribute("data-role", item.role) + attribute("data-tone", item.tone) + ">",
      );
      emitText(out, {
        lines,
        x: item.x,
        y: item.y,
        size,
        fill: tone,
        anchor: item.anchor,
        lineHeight: policy.type.lineHeight,
        weight: item.role === "title" ? 700 : item.role === "subtitle" ? 600 : 400,
        family: policy.type.family,
        id: "text-" + item.id,
        tabular: item.role === "note",
      });
      out.push("</g>");
    }
    out.push("</g>");
  }
  renderLegend(scene, { policy, palette: resolved }, out);
  out.push("</svg>");
  return out.join("\n") + "\n";
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

function option(args: readonly string[], key: string): string {
  const index = args.indexOf(key);
  if (index < 0) return "";
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(key + " requires a value");
  return value;
}

if (isMain) {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--help") || args.includes("-h")) {
      console.log(
        [
          "Usage: node scientific-figures/scripts/render-figure.ts --scene <scene.json> [--out <file.svg>] [--stdout]",
          "       node scientific-figures/scripts/render-figure.ts --self-test",
          "",
          "Reads a declarative scene, writes semantic, fully editable SVG.",
        ].join("\n"),
      );
    } else if (args.includes("--self-test")) {
      runSelfTest(renderScene);
    } else {
      const scenePath = option(args, "--scene");
      if (!scenePath) throw new Error("--scene is required");
      const policy = loadPolicy();
      const parsed: unknown = JSON.parse(readFileSync(scenePath, "utf8"));
      const svg = renderScene(parseScene(parsed, policy), policy);
      const out = option(args, "--out");
      if (args.includes("--stdout") || !out) process.stdout.write(svg);
      else {
        writeFileSync(out, svg, "utf8");
        console.error("Wrote " + out + " (" + svg.length + " bytes)");
      }
    }
  } catch (error) {
    console.error("Figure render failed: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
