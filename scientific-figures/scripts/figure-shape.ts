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

export function elementArea(element: XmlElement): number {
  if (element.name === "rect") return Math.max(1, (numberAttribute(element, "width") ?? 0) * (numberAttribute(element, "height") ?? 0));
  if (element.name === "circle") return Math.max(1, Math.PI * (numberAttribute(element, "r") ?? 0) ** 2);
  if (element.name === "ellipse") return Math.max(1, Math.PI * (numberAttribute(element, "rx") ?? 0) * (numberAttribute(element, "ry") ?? 0));
  return Number.MAX_SAFE_INTEGER;
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
