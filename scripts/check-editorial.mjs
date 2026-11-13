import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../design-system/wabi-press.css");
const report = read("../frontend-slides/assets/report.css");
const tokens = (source, selector) => {
  const start = source.indexOf(selector);
  assert.ok(start >= 0, "Missing theme selector: " + selector);
  const block = source.slice(start + selector.length).split("}")[0];
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
};
const luminance = (hex) => {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  const linear = hex.slice(1).match(/../g).map((pair) => {
    const value = parseInt(pair, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (foreground, background) => {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};
const mix = (a, b, weight) => "#" + a.slice(1).match(/../g).map((part, index) => Math.round(parseInt(part, 16) * weight + parseInt(b.slice(1 + index * 2, 3 + index * 2), 16) * (1 - weight)).toString(16).padStart(2, "0")).join("");
let pairs = 0;
for (const theme of ["light", "dark"]) {
  const base = tokens(css, '/* Wabi Press material tokens: default for every surface. */\n:root {');
  const standalone = tokens(report, ":root {");
  const colors = theme === "light" ? base : { ...base, ...tokens(css, ':root[data-theme="dark"] {') };
  const mapped = theme === "light" ? standalone : { ...standalone, ...tokens(report, ':root[data-theme="dark"] {') };
  for (const [name, value] of Object.entries(colors)) {
    if (/^--(?:bg-|text-|accent-|tint-|reading-)/.test(name)) assert.equal(mapped[name], value, theme + " report token drift: " + name);
  }
  const check = (foreground, background) => {
    const ratio = contrast(colors[foreground], colors[background]);
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
      const background = mix(colors[pigment], colors["--text-primary"], weight);
      const ratio = contrast(colors["--bg-canvas"], background);
      assert.ok(ratio >= 4.5, theme + " " + pigment + " action weight " + weight + ": " + ratio.toFixed(2));
      pairs += 1;
    }
  }
  const githubCanvas = theme === "light" ? "#FFFFFF" : "#0D1117";
  assert.ok(contrast(colors["--accent-cinnabar"], githubCanvas) >= 4.5, "README icon contrast: " + theme);
  pairs += 1;
}
console.log("Editorial palette passed: " + pairs + " contrast pairs and light/dark report token parity.");
