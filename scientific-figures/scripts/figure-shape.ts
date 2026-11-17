import type { XmlDocument, XmlElement } from "./xml-document.ts";

export function numberAttribute(element: XmlElement, key: string): number | null {
  const value = element.attributes[key];
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isShape(element: XmlElement): boolean {
  return element.name === "rect" || element.name === "circle" || element.name === "ellipse";
}

export function pointInElement(element: XmlElement, x: number, y: number): boolean {
  if (element.name === "rect") {
    const left = numberAttribute(element, "x") ?? 0;
    const top = numberAttribute(element, "y") ?? 0;
    const width = numberAttribute(element, "width") ?? 0;
    const height = numberAttribute(element, "height") ?? 0;
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
  if (element.name !== "circle" && element.name !== "ellipse") return false;
  const radiusX = element.name === "circle" ? numberAttribute(element, "r") ?? 0 : numberAttribute(element, "rx") ?? 0;
  const radiusY = element.name === "circle" ? numberAttribute(element, "r") ?? 0 : numberAttribute(element, "ry") ?? 0;
  if (radiusX <= 0 || radiusY <= 0) return false;
  const dx = (x - (numberAttribute(element, "cx") ?? 0)) / radiusX;
  const dy = (y - (numberAttribute(element, "cy") ?? 0)) / radiusY;
  return dx * dx + dy * dy <= 1;
}

export function elementWidth(element: XmlElement): number {
  const width = numberAttribute(element, "width");
  if (width !== null) return width;
  const radius = element.name === "circle" ? numberAttribute(element, "r") : numberAttribute(element, "rx");
  return (radius ?? 0) * 2;
}

export interface VerticalBounds {
  top: number;
  bottom: number;
}

export function elementVerticalBounds(element: XmlElement): VerticalBounds {
  if (element.name === "rect") {
    const top = numberAttribute(element, "y") ?? 0;
    return { top, bottom: top + (numberAttribute(element, "height") ?? 0) };
  }
  const centre = numberAttribute(element, "cy") ?? 0;
  const radius = numberAttribute(element, element.name === "circle" ? "r" : "ry") ?? 0;
  return { top: centre - radius, bottom: centre + radius };
}

export interface Extent {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Point list of `<polyline>`/`<polygon>`: coordinates alternate x, y. */
export function pointList(element: XmlElement): Array<{ x: number; y: number }> {
  const numbers = (element.attributes["points"] ?? "")
    .split(/[\s,]+/)
    .filter((token) => token !== "")
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index] ?? 0, y: numbers[index + 1] ?? 0 });
  }
  return points;
}

/**
 * Path bounds from the control hull. Cubics stay inside their control points,
 * so a curve never escapes this box; arcs can bulge away from it, so the radius
 * is added around both endpoints. The result is deliberately generous and is
 * reported as an estimate rather than an exact extent.
 */
export function pathExtent(element: XmlElement): Extent | null {
  const tokens = (element.attributes["d"] ?? "").match(/[MmZzLlHhVvCcSsQqTtAa]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (tokens === null) return null;
  const points: Array<{ x: number; y: number }> = [];
  let cursorX = 0;
  let cursorY = 0;
  let startX = 0;
  let startY = 0;
  let index = 0;
  let command = "";
  const next = (): number => {
    const value = Number(tokens[index] ?? "0");
    index += 1;
    return Number.isFinite(value) ? value : 0;
  };
  while (index < tokens.length) {
    const token = tokens[index] ?? "";
    if (/[MmZzLlHhVvCcSsQqTtAa]/.test(token)) {
      command = token;
      index += 1;
      if (/[Zz]/.test(command)) {
        points.push({ x: startX, y: startY });
        cursorX = startX;
        cursorY = startY;
        continue;
      }
    }
    const relative = command === command.toLowerCase();
    const originX = relative ? cursorX : 0;
    const originY = relative ? cursorY : 0;
    switch (command.toUpperCase()) {
      case "M":
      case "L":
      case "T": {
        cursorX = originX + next();
        cursorY = originY + next();
        if (command.toUpperCase() === "M") {
          startX = cursorX;
          startY = cursorY;
          command = relative ? "l" : "L";
        }
        points.push({ x: cursorX, y: cursorY });
        break;
      }
      case "H": {
        cursorX = originX + next();
        points.push({ x: cursorX, y: cursorY });
        break;
      }
      case "V": {
        cursorY = originY + next();
        points.push({ x: cursorX, y: cursorY });
        break;
      }
      case "C": {
        for (let pair = 0; pair < 2; pair += 1) {
          points.push({ x: originX + next(), y: originY + next() });
        }
        cursorX = originX + next();
        cursorY = originY + next();
        points.push({ x: cursorX, y: cursorY });
        break;
      }
      case "S":
      case "Q": {
        points.push({ x: originX + next(), y: originY + next() });
        cursorX = originX + next();
        cursorY = originY + next();
        points.push({ x: cursorX, y: cursorY });
        break;
      }
      case "A": {
        const radiusX = Math.abs(next());
        const radiusY = Math.abs(next());
        next();
        next();
        next();
        cursorX = originX + next();
        cursorY = originY + next();
        const bulge = Math.max(radiusX, radiusY);
        points.push({ x: cursorX - bulge, y: cursorY - bulge });
        points.push({ x: cursorX + bulge, y: cursorY + bulge });
        points.push({ x: cursorX - bulge, y: cursorY + bulge });
        points.push({ x: cursorX + bulge, y: cursorY - bulge });
        break;
      }
      default:
        index += 1;
    }
  }
  if (points.length === 0) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

/**
 * Axis-aligned extent of one drawn element. `<text>` needs font metrics, so it
 * is resolved by the checker; every geometric primitive is answered here.
 */
export function elementExtent(element: XmlElement): Extent | null {
  if (element.name === "rect") {
    const left = numberAttribute(element, "x") ?? 0;
    const top = numberAttribute(element, "y") ?? 0;
    return {
      left,
      right: left + (numberAttribute(element, "width") ?? 0),
      top,
      bottom: top + (numberAttribute(element, "height") ?? 0),
    };
  }
  if (element.name === "circle" || element.name === "ellipse") {
    const centreX = numberAttribute(element, "cx") ?? 0;
    const centreY = numberAttribute(element, "cy") ?? 0;
    const radiusX = element.name === "circle" ? numberAttribute(element, "r") ?? 0 : numberAttribute(element, "rx") ?? 0;
    const radiusY = element.name === "circle" ? numberAttribute(element, "r") ?? 0 : numberAttribute(element, "ry") ?? 0;
    return { left: centreX - radiusX, right: centreX + radiusX, top: centreY - radiusY, bottom: centreY + radiusY };
  }
  if (element.name === "line") {
    const x1 = numberAttribute(element, "x1") ?? 0;
    const y1 = numberAttribute(element, "y1") ?? 0;
    const x2 = numberAttribute(element, "x2") ?? 0;
    const y2 = numberAttribute(element, "y2") ?? 0;
    return { left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2) };
  }
  if (element.name === "polyline" || element.name === "polygon") {
    const points = pointList(element);
    if (points.length === 0) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }
  if (element.name === "path") return pathExtent(element);
  return null;
}

export function groupShape(document: XmlDocument, group: XmlElement): XmlElement | undefined {
  return group.children
    .map((index) => document.elements[index])
    .find((child) => child !== undefined && isShape(child));
}

export function commandCount(data: string): number {
  return (data.match(/[MmZzLlHhVvCcSsQqTtAa]/g) ?? []).length;
}
