import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const css = read("../design-system/wabi-press.css");
const report = read("../frontend-slides/assets/report.css");
const tokens = (source: string, selector: string): Record<string, string> => {
  const start = source.indexOf(selector);
  assert.ok(start >= 0, "Missing theme selector: " + selector);
  const block = source.slice(start + selector.length).split("}")[0] ?? "";
  const pairs: [string, string][] = [];
  for (const match of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name && value) pairs.push([name, value.trim()]);
  }
  return Object.fromEntries(pairs);
};
const luminance = (hex: string): number => {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  const pairs = hex.slice(1).match(/../g);
  assert.ok(pairs, "Invalid hex color: " + hex);
  const linear = pairs.map((pair) => {
    const value = parseInt(pair, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = linear;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};
const contrast = (foreground: string, background: string): number => {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return ((a ?? 0) + 0.05) / ((b ?? 1) + 0.05);
};
const mix = (a: string, b: string, weight: number): string => {
  const parts = a.slice(1).match(/../g);
  assert.ok(parts, "Invalid hex color: " + a);
  return "#" + parts.map((part, index) => {
    const mixed = Math.round(parseInt(part, 16) * weight + parseInt(b.slice(1 + index * 2, 3 + index * 2), 16) * (1 - weight));
    return mixed.toString(16).padStart(2, "0");
  }).join("");
};
let pairs = 0;
for (const theme of ["light", "dark"]) {
  const base = tokens(css, '/* Wabi Press material tokens: default for every surface. */\n:root {');
  const standalone = tokens(report, ":root {");
  const colors = theme === "light" ? base : { ...base, ...tokens(css, ':root[data-theme="dark"] {') };
  const mapped = theme === "light" ? standalone : { ...standalone, ...tokens(report, ':root[data-theme="dark"] {') };
  for (const [name, value] of Object.entries(colors)) {
    if (/^--(?:bg-|text-|accent-|tint-|reading-)/.test(name)) assert.equal(mapped[name], value, theme + " report token drift: " + name);
  }
  const check = (foreground: string, background: string): void => {
    const foregroundColor = colors[foreground];
    const backgroundColor = colors[background];
    assert.ok(foregroundColor, "Missing foreground token: " + foreground);
    assert.ok(backgroundColor, "Missing background token: " + background);
    const ratio = contrast(foregroundColor, backgroundColor);
    assert.ok(ratio >= 4.5, theme + " " + foreground + " on " + background + ": " + ratio.toFixed(2));
    pairs += 1;
  };
  for (const foreground of ["--text-primary", "--text-secondary", "--text-muted", "--accent-cinnabar", "--accent-moss", "--accent-indigo", "--accent-ochre", "--accent-clay"]) {
    for (const background of ["--bg-canvas", "--bg-surface", "--bg-overlay"]) check(foreground, background);
  }
  for (const background of ["--tint-indigo", "--tint-ochre", "--tint-clay"]) {
    for (const foreground of ["--text-primary", "--text-secondary"]) check(foreground, background);
  }
  for (const background of ["--accent-cinnabar", "--accent-moss"]) check("--bg-canvas", background);
  for (const pigment of ["--accent-cinnabar", "--accent-moss"]) {
    for (const weight of [1, 0.88, 0.78]) {
      const pigmentColor = colors[pigment];
      const textColor = colors["--text-primary"];
      const canvasColor = colors["--bg-canvas"];
      assert.ok(pigmentColor && textColor && canvasColor, "Missing palette token");
      const background = mix(pigmentColor, textColor, weight);
      const ratio = contrast(canvasColor, background);
      assert.ok(ratio >= 4.5, theme + " " + pigment + " action weight " + weight + ": " + ratio.toFixed(2));
      pairs += 1;
    }
  }
  const githubCanvas = theme === "light" ? "#FFFFFF" : "#0D1117";
  const accent = colors["--accent-cinnabar"];
  assert.ok(accent, "Missing accent token");
  assert.ok(contrast(accent, githubCanvas) >= 4.5, "README icon contrast: " + theme);
  pairs += 1;
}
console.log("Editorial palette passed: " + pairs + " contrast pairs and light/dark report token parity.");
