export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const channel = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour: Rgb): number =>
  0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);

export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 1) + 0.05);
}

function parseHex(hex: string): Rgb {
  assertHex(hex);
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function assertHex(hex: string): void {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Invalid hex color: " + hex);
}

export function contrastHex(foreground: string, background: string): number {
  return contrastRatio(parseHex(foreground), parseHex(background));
}

export function mixHex(foreground: string, background: string, weight: number): string {
  const first = parseHex(foreground);
  const second = parseHex(background);
  return "#" + [first.r, first.g, first.b].map((value, index) => {
    const other = [second.r, second.g, second.b][index] ?? 0;
    return Math.round(value * weight + other * (1 - weight)).toString(16).padStart(2, "0");
  }).join("");
}
