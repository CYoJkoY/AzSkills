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

export function groupShape(document: XmlDocument, group: XmlElement): XmlElement | undefined {
  return group.children
    .map((index) => document.elements[index])
    .find((child) => child !== undefined && isShape(child));
}

export function commandCount(data: string): number {
  return (data.match(/[MmZzLlHhVvCcSsQqTtAa]/g) ?? []).length;
}
