#!/usr/bin/env node
/*
 * Preset executable layer checks.
 *
 * Cobalt Kit must hold its contrast contract in both themes, keep colour out of
 * component rules, and stay scoped. The loader layer must expose every
 * documented variant with its tokens and a reduced-motion pose.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const css = read("style-presets/assets/cobalt-kit.css");
const loaders = read("style-presets/assets/loaders.css");
const gallery = read("style-presets/assets/gallery.html");
const catalog = read("style-presets/references/catalog.md");

function block(source: string, selector: string): Record<string, string> {
  const start = source.indexOf(selector);
  assert.ok(start >= 0, `Missing selector: ${selector}`);
  const body = source.slice(start + selector.length).split("}")[0] ?? "";
  const pairs: Array<[string, string]> = [];
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name && value) pairs.push([name, value.trim()]);
  }
  return Object.fromEntries(pairs);
}

const luminance = (hex: string): number => {
  assert.match(hex, /^#[0-9a-f]{6}$/i, `Invalid hex colour: ${hex}`);
  const pairs = hex.slice(1).match(/../g);
  assert.ok(pairs, `Invalid hex colour: ${hex}`);
  const linear = pairs.map((pair) => {
    const value = parseInt(pair, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = linear;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};

const contrast = (foreground: string, background: string): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 1) + 0.05);
};

const light = block(css, '[data-style="cobalt-kit"] {');
const dark = block(css, '[data-style="cobalt-kit"][data-theme="dark"] {');

const required = [
  "canvas", "surface", "overlay", "text", "text-secondary", "text-muted",
  "accent", "accent-hover", "accent-active", "accent-text",
  "secondary", "secondary-hover", "secondary-active", "secondary-text",
  "border", "border-strong", "focus", "on-accent",
  "tint-accent", "tint-secondary", "success", "warning", "danger",
];

for (const theme of [
  { name: "light", tokens: light },
  { name: "dark", tokens: dark },
]) {
  for (const role of required) {
    assert.ok(theme.tokens[`--ck-${role}`], `${theme.name}: missing --ck-${role}`);
  }
  const pairs: Array<[string, string, string]> = [];
  for (const foreground of ["text", "text-secondary", "text-muted", "accent-text", "secondary-text", "success", "warning", "danger"]) {
    for (const background of ["canvas", "surface", "overlay"]) {
      pairs.push([`--ck-${foreground}`, `--ck-${background}`, `${foreground} on ${background}`]);
    }
  }
  for (const fill of ["accent", "accent-hover", "accent-active", "secondary", "secondary-hover", "secondary-active"]) {
    pairs.push(["--ck-on-accent", `--ck-${fill}`, `on-accent on ${fill}`]);
  }
  for (const foreground of ["text", "text-secondary", "accent-text", "secondary-text"]) {
    for (const background of ["tint-accent", "tint-secondary"]) {
      pairs.push([`--ck-${foreground}`, `--ck-${background}`, `${foreground} on ${background}`]);
    }
  }
  pairs.push(["--ck-focus", "--ck-canvas", "focus ring on canvas"]);

  let count = 0;
  for (const [foreground, background, label] of pairs) {
    const foregroundValue = theme.tokens[foreground];
    const backgroundValue = theme.tokens[background];
    assert.ok(foregroundValue, `${theme.name}: missing ${foreground}`);
    assert.ok(backgroundValue, `${theme.name}: missing ${background}`);
    const ratio = contrast(foregroundValue, backgroundValue);
    const floor = label === "focus ring on canvas" ? 3 : 4.5;
    assert.ok(ratio >= floor, `${theme.name} ${label}: ${ratio.toFixed(2)}`);
    count += 1;
  }
  assert.equal(count, 39, `${theme.name}: expected the full contrast matrix`);
}

// Component rules address tokens, never raw colour values.
const primitivesAt = css.indexOf("Primitives - only the surfaces");
assert.ok(primitivesAt > 0, "Missing primitives section");
assert.doesNotMatch(css.slice(primitivesAt), /#[0-9a-f]{3,8}\b/i, "Component rule carries a raw hex colour");
assert.match(css, /\[data-style="cobalt-kit"\] \.ck-btn--primary/, "Missing primary action primitive");
for (const selector of [".ck-btn--secondary", ".ck-field__input", ".ck-chip", ".ck-panel", ".ck-row", ".ck-selection", ".ck-status--danger"]) {
  assert.ok(css.includes(selector), `Missing primitive: ${selector}`);
}
assert.match(css, /:focus-visible/, "Missing focus-visible treatment");
assert.match(css, /prefers-reduced-motion/, "Missing reduced-motion handling");
assert.doesNotMatch(css, /(^|\n):root\s*\{/, "Preset must not write :root");

// Loader layer: eight variants, shared tokens, accessible label, reduced motion.
const variants = ["ring", "arc", "dots", "bars", "sweep", "squish", "orbit", "meter"];
for (const variant of variants) {
  assert.ok(loaders.includes(`.sp-loader--${variant}`), `Missing loader variant: ${variant}`);
  assert.ok(gallery.includes(`["${variant}"`), `Gallery is missing loader variant: ${variant}`);
  assert.ok(catalog.length > 0);
}
const loaderReference = read("style-presets/references/loaders.md");
for (const token of ["--sp-size", "--sp-stroke", "--sp-gap", "--sp-color", "--sp-track", "--sp-shine", "--sp-duration", "--sp-value"]) {
  assert.ok(loaders.includes(`var(${token},`), `Loader must read ${token} with a fallback so an ancestor value survives`);
  assert.ok(loaderReference.includes(token), `Loader reference omits ${token}`);
}
assert.doesNotMatch(
  loaders,
  /^\s*--sp-(size|stroke|gap|color|track|shine|duration|value):/m,
  "A loader must not re-declare a public token; that shadows the value set on an ancestor",
);
assert.doesNotMatch(
  loaders,
  /^\s*--_gap:\s*var\(--sp-gap,\s*\d/m,
  "The default gap must scale with --sp-size, not sit at a fixed pixel value",
);
assert.match(loaders, /\.sp-sr-only\s*\{/, "Missing visually hidden label");
assert.match(loaders, /box-sizing:\s*border-box/, "Loaders must not grow past --sp-size with their own border");
for (const derived of ["--_dot: calc(var(--_size)", "--_bar: max(2px, calc(var(--_size)", "--_bead: calc(var(--_size)"]) {
  assert.ok(loaders.includes(derived), `Loader geometry must derive from --sp-size: ${derived}`);
}
assert.match(loaders, /prefers-reduced-motion:\s*reduce/, "Missing media-query fallback");
assert.match(loaders, /\[data-motion="reduce"\]/, "Missing explicit reduced-motion hook");
assert.match(
  loaders,
  /\[data-motion="reduce"\][^{]*\{[^}]*animation:\s*none/,
  "Reduced motion must cancel the animation, not only set animation-play-state",
);
assert.match(
  loaders,
  /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?animation:\s*none/,
  "The media-query fallback must cancel the animation",
);
assert.match(loaders, /@media \(forced-colors: active\)/, "Missing forced-colors handling");

// Preview wires both layers, both themes, and both controls.
assert.match(gallery, /<body data-style="cobalt-kit">/, "Gallery must scope the preset");
assert.ok(gallery.includes('href="cobalt-kit.css"'), "Gallery must load the preset stylesheet");
assert.ok(gallery.includes('href="loaders.css"'), "Gallery must load the loader stylesheet");
for (const id of ["theme-toggle", "motion-toggle", "swatches", "loaders"]) {
  assert.ok(gallery.includes(`id="${id}"`), `Gallery is missing ${id}`);
}
assert.match(gallery, /role="progressbar"/, "Gallery must show determinate progress semantics");
assert.match(gallery, /aria-busy="true"/, "Gallery must show a busy region");

// ASCII contract for executable assets; references may carry CJK triggers.
for (const [name, text] of Object.entries({ "cobalt-kit.css": css, "loaders.css": loaders, "gallery.html": gallery })) {
  assert.doesNotMatch(text, /[^\x00-\x7F]/, `${name} must be ASCII`);
}

console.log(
  "Style presets passed: Cobalt Kit holds 4.5:1 in both themes, primitives are token-only, and 8 loader variants carry status semantics and a reduced-motion pose.",
);
