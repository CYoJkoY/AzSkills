import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastHex, mixHex } from "../scientific-figures/scripts/color-contrast.ts";

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
    const ratio = contrastHex(foregroundColor, backgroundColor);
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
      const background = mixHex(pigmentColor, textColor, weight);
      const ratio = contrastHex(canvasColor, background);
      assert.ok(ratio >= 4.5, theme + " " + pigment + " action weight " + weight + ": " + ratio.toFixed(2));
      pairs += 1;
    }
  }
  const githubCanvas = theme === "light" ? "#FFFFFF" : "#0D1117";
  const accent = colors["--accent-cinnabar"];
  assert.ok(accent, "Missing accent token");
  assert.ok(contrastHex(accent, githubCanvas) >= 4.5, "README icon contrast: " + theme);
  pairs += 1;
}
console.log("Editorial palette passed: " + pairs + " contrast pairs and light/dark report token parity.");
