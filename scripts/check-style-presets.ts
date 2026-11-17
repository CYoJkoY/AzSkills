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
import { runInNewContext } from "node:vm";
import { PRESET_TRIGGERS, STYLE_INTENT_PATTERN, isLoaderRequest } from "../references/style-presets/style-triggers.ts";

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
const dark = block(css, '[data-style="cobalt-kit"][data-theme="dark"],');

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
const primitivesBodyFrom = css.indexOf("*/", primitivesAt) + 2;
assert.ok(primitivesBodyFrom > 2, "Missing primitives section terminator");
assert.match(css, /\[data-style="cobalt-kit"\] \.ck-btn--primary/, "Missing primary action primitive");
for (const selector of [".ck-btn--secondary", ".ck-field__input", ".ck-chip", ".ck-panel", ".ck-row", ".ck-selection", ".ck-status--danger"]) {
  assert.ok(css.includes(selector), `Missing primitive: ${selector}`);
}
assert.match(css, /:focus-visible/, "Missing focus-visible treatment");
assert.match(css, /prefers-reduced-motion/, "Missing reduced-motion handling");
assert.doesNotMatch(css, /(^|\n):root\s*\{/, "Preset must not write :root");

// Every primitive rule is scoped, so the pack cannot leak into a host page.
/*
 * A selector list may span lines, so splitting on lines misses every selector
 * before the last one. Parse the block structure instead: the prelude is all
 * text between the previous terminator and the opening brace.
 */
interface CssRule {
  chain: readonly string[];
  prelude: string;
}

const closingBrace = (source: string, open: number): number => {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error("Unbalanced braces at offset " + open);
};

interface CssScope {
  from: number;
  to: number;
  chain: readonly string[];
}

function nestedRules(source: string, head: string, scope: CssScope): CssRule[] {
  if (head.startsWith("@")) return parseRules(source, scope);
  if (head === "") return [];
  return [{ chain: scope.chain.slice(0, -1), prelude: head }];
}

function parseRules(source: string, scope: CssScope = { from: 0, to: source.length, chain: [] }): CssRule[] {
  const rules: CssRule[] = [];
  let prelude = "";
  let index = scope.from;
  while (index < scope.to) {
    const char = source[index];
    if (char === "{") {
      const head = prelude.trim();
      prelude = "";
      const end = closingBrace(source, index);
      rules.push(...nestedRules(source, head, { from: index + 1, to: end, chain: [...scope.chain, head] }));
      index = end + 1;
      continue;
    }
    if (char === "}" || (char === ";" && prelude.trim().startsWith("@"))) {
      prelude = "";
      index += 1;
      continue;
    }
    prelude += char;
    index += 1;
  }
  return rules;
}

/** Split a selector list on top-level commas; `:is(a, b)` stays one selector. */
const splitSelectors = (prelude: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of prelude) {
    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

const NESTING_AT_RULES = [/^@media\b/, /^@supports\b/, /^@layer\b/, /^@container\b/];
const SCOPED_SELECTOR = /^\[data-style="cobalt-kit"\]/;
const DARK_ROOT_SELECTOR = /^:root\[data-theme="dark"\] \[data-style="cobalt-kit"\]/;

const scopedPrimitives = css.slice(primitivesBodyFrom).replace(/\/\*[\s\S]*?\*\//g, "");
let checkedSelectors = 0;
for (const rule of parseRules(scopedPrimitives)) {
  // Keyframe steps, font-face descriptors, and page rules carry no host selector.
  if (!rule.chain.every((at) => NESTING_AT_RULES.some((pattern) => pattern.test(at)))) continue;
  for (const selector of splitSelectors(rule.prelude)) {
    assert.ok(
      SCOPED_SELECTOR.test(selector) || DARK_ROOT_SELECTOR.test(selector),
      "Unscoped primitive selector: " + selector,
    );
    checkedSelectors += 1;
  }
}
assert.ok(checkedSelectors >= 30, "Primitive scope check inspected too few selectors: " + checkedSelectors);
assert.ok(
  splitSelectors('[data-style="cobalt-kit"] .a,\n[data-style="cobalt-kit"] .b').length === 2,
  "Selector-list splitting must be top-level only",
);

// Dark theme resolves through the shipped controller as well as the same element.
assert.match(
  css,
  /:root\[data-theme="dark"\] \[data-style="cobalt-kit"\]/,
  "Dark theme must resolve from a root-level data-theme the controller sets",
);
assert.match(
  css,
  /@media \(pointer: coarse\)\s*\{[\s\S]*?--ck-control-height:\s*var\(--ck-touch-target\)/,
  "The documented 44px touch floor must be applied, not only declared",
);
// The touch floor is a value contract: prove the token itself reaches 44px.
const touchTarget = /^(\d+(?:\.\d+)?)px$/.exec(light["--ck-touch-target"] ?? "");
assert.ok(touchTarget, "Missing --ck-touch-target geometry token: " + (light["--ck-touch-target"] ?? "absent"));
assert.ok(Number(touchTarget[1]) >= 44, "--ck-touch-target must hold the 44px floor: " + touchTarget[0]);
assert.ok(
  parseFloat(light["--ck-control-height"] ?? "0") < 44,
  "The compact desktop control height must stay below the touch floor so the media query has work to do",
);

// Selection state is carried by a native control, not by invalid ARIA on a div.
assert.doesNotMatch(css, /\.ck-selection\[aria-selected/, "Selection must not key off aria-selected on a generic element");
assert.match(css, /\.ck-selection__input:checked/, "Selection must key off a native checked control");

// Loader layer: eight variants, shared tokens, accessible label, reduced motion.
const variants = ["ring", "arc", "dots", "bars", "sweep", "squish", "orbit", "meter"];
const catalogRows = catalog.split("\n").filter((line) => /^\| `[a-z-]+` \|/.test(line));
assert.equal(catalogRows.length, 2, "The catalog must document exactly the shipped presets");
const loaderReference = read("style-presets/references/loaders.md");
for (const variant of variants) {
  assert.ok(loaders.includes(`.sp-loader--${variant}`), `Missing loader variant: ${variant}`);
  assert.ok(gallery.includes(`["${variant}"`), `Gallery is missing loader variant: ${variant}`);
  assert.ok(loaderReference.includes("`sp-loader--" + variant + "`"), `Loader reference omits: ${variant}`);
}
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
for (const derived of [
  "--_dot: calc((var(--_size) - var(--_gap) * 2) / 3)",
  "--_bar: max(2px, calc(var(--_size)",
  "--_bead: calc(var(--_size)",
]) {
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
const loaderDefaults = block(loaders, ".sp-loader {");
for (const token of ["--_track", "--_shine"]) {
  assert.ok(loaderDefaults[token], "Missing loader fallback: " + token);
  assert.doesNotMatch(loaderDefaults[token], /color-mix\(/, "Loader fallback requires color-mix: " + token);
}

const sweep = /\.sp-loader--sweep\s*\{([^}]+)\}/.exec(loaders)?.[1] ?? "";
assert.match(sweep, /border:\s*var\(--_stroke\) solid var\(--_ink\)/, "Sweep needs a persistent foreground boundary in animated and static poses");
const sweepKeyframes = /@keyframes sp-sweep\s*\{([\s\S]*?)\n\}/.exec(loaders)?.[1] ?? "";
assert.doesNotMatch(sweepKeyframes, /(?:border|outline|opacity)\s*:/, "Sweep animation must preserve its foreground boundary");
for (const theme of [{ name: "light", tokens: light }, { name: "dark", tokens: dark }]) {
  for (const background of ["canvas", "surface", "overlay"]) {
    const ink = theme.tokens["--ck-text"];
    const surface = theme.tokens["--ck-" + background];
    assert.ok(ink !== undefined && surface !== undefined, "Missing sweep contrast tokens");
    assert.ok(contrast(ink, surface) >= 3, theme.name + " sweep boundary must hold 3:1 on " + background);
  }
}

/*
 * A layout property in a keyframe re-runs layout inside whatever table or
 * toolbar hosts the indicator, every frame. Paint-only properties such as
 * `background-size` and `border-radius` are allowed because each variant is a
 * single small element with `contain: layout`; a geometric property is not.
 */
const LAYOUT_PROPERTY =
  /(?:^|[\s;{])(?:inset(?:-block(?:-start|-end)?|-inline(?:-start|-end)?)?|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|min-width|min-height|max-width|max-height|width|height|margin(?:-(?:block|inline)(?:-(?:start|end))?|-(?:top|right|bottom|left))?|padding(?:-(?:block|inline)(?:-(?:start|end))?|-(?:top|right|bottom|left))?|top|right|bottom|left|grid-(?:template-)?(?:rows|columns)|flex-basis|gap|row-gap|column-gap)\s*:/;
let keyframesChecked = 0;
for (const keyframes of loaders.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\n\}/g)) {
  const body = (keyframes[1] ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(body, LAYOUT_PROPERTY, "Loader keyframes must not animate a layout property");
  keyframesChecked += 1;
}
assert.ok(keyframesChecked >= 8, "Expected a keyframe block per loader variant: " + keyframesChecked);
// Prove the deny list catches the property families a keyframe could quietly
// regress into; a bare list without a probe would pass on a regex typo.
for (const probe of ["margin-block-end: 4px", "inset-block-start: 1px", "max-width: 9px", "padding-inline: 2px", "inline-size: 3px"]) {
  assert.ok(LAYOUT_PROPERTY.test("\n  " + probe), "Layout deny list must catch " + probe);
}
for (const allowed of ["transform: scale(1.1)", "background-size: 4px 4px", "border-radius: 26%"]) {
  assert.ok(!LAYOUT_PROPERTY.test("\n  " + allowed), "Layout deny list must not reject a paint-only property: " + allowed);
}

// Documented triggers, catalog rows, and routed phrases come from one source.
const triggers = read("references/style-presets/style-triggers.ts");
for (const group of PRESET_TRIGGERS) {
  for (const trigger of group.triggers) {
    assert.ok(catalog.includes("`" + trigger + "`"), "Catalog omits routed trigger: " + trigger);
    assert.ok(triggers.includes('"' + trigger + '"'), "Trigger source omits: " + trigger);
  }
}
const loaderPrompts = [
  "Add a spinner while the report saves", "Give me a CSS loader for the upload card", "这个列表需要骨架屏",
  "Add a loading state to the upload button", "给列表加个加载状态", "Use css-loaders",
  "Add a loading state to the dashboard", "Add a loader to the modal", "给仪表盘加个加载状态",
  "Add a spinner to the JSON viewer", "Add a loader to the YAML editor panel",
  "Add a spinner to the upload button in this Vite app",
  "Add a spinner to the upload button in this webpack app",
  "Add a loading state to the upload button in this Vite app",
  "Add a spinner to the upload button in an app built with a bundler",
  "Add a spinner to the upload button while the parser runs",
  "Add a spinner to the dashboard while the parser runs",
  "给这个 Vite 应用的上传按钮加个加载状态",
];
for (const prompt of loaderPrompts) {
  assert.ok(isLoaderRequest(prompt), "Loader request not routed: " + prompt);
}
const codePrompts = [
  "Upgrade css-loader to v7 in the bundler config",
  "Fix the loading state bug in the auth store",
  "Rename the spinner module in the settings service",
  "Refactor the module loader in the bundler",
  "Add a loading state enum to the backend job model",
  "Use a loading state in the backend job model",
  "Add a loading state property to the job interface",
  "给后端任务模型添加加载状态枚举",
  "Add a loader to deserialize YAML configuration",
  "Add a loading state column to the jobs table",
  "Add a skeleton class to the parser AST",
  "Upgrade css-loaders to v7 in the bundler config",
  "给后端任务列表模型添加加载状态枚举",
  "给数据库任务列表添加加载状态字段",
  "Create a skeleton class for the payment service",
  "Add a loader to the Vite app",
  "Upgrade css-loaders to v7 in the Vite config",
  "Add a spinner to the backend job model",
  "Add a loading animation for the parser",
  "Add a loader to the parser AST",
];
for (const prompt of codePrompts) {
  assert.ok(!isLoaderRequest(prompt), "Code task routed as a loader request: " + prompt);
}
// A hyphenated package name is a build-tool loader even with no other context.
for (const prompt of [
  "Add css-loader to the build config",
  "Add sass-loader for the SCSS build",
  "Use style-loader for the stylesheet",
  "Add vue-loader for the SFC pipeline",
  "Swap to esbuild-loader in the prod config",
]) {
  assert.ok(!isLoaderRequest(prompt), "Package loader routed as a UI loader: " + prompt);
}
// The noun guard also keeps a longer word from smuggling in a preset trigger.
for (const prompt of [
  "Explain the collab canvas layout",
  "Switch the lifestyle preset to dark",
]) {
  assert.ok(!STYLE_INTENT_PATTERN.test(prompt), "Substring routed as a preset request: " + prompt);
}
for (const prompt of ["查看风格目录", "列出设计风格", "选择一个样式预设"]) {
  assert.ok(STYLE_INTENT_PATTERN.test(prompt), "Chinese catalog request not routed: " + prompt);
}

// Preview wires both layers, both themes, and both controls.
assert.match(gallery, /<body data-style="cobalt-kit">/, "Gallery must scope the preset");
assert.ok(gallery.includes('href="cobalt-kit.css"'), "Gallery must load the preset stylesheet");
assert.ok(gallery.includes('href="loaders.css"'), "Gallery must load the loader stylesheet");
for (const id of ["theme-toggle", "motion-toggle", "swatches", "loaders"]) {
  assert.ok(gallery.includes(`id="${id}"`), `Gallery is missing ${id}`);
}
assert.match(gallery, /role="progressbar"/, "Gallery must show determinate progress semantics");
assert.match(gallery, /aria-busy="true"/, "Gallery must show a busy region");

const galleryScript = /<script>([\s\S]*?)<\/script>/.exec(gallery)?.[1];
assert.ok(galleryScript !== undefined, "Missing gallery controller");
for (const preference of [{ matches: false, state: "Motion: full" }, { matches: true, state: "Motion: reduced" }]) {
  const handlers = new Map<string, () => void>();
  const attributes = new Map<string, string>();
  const motionButton = {
    textContent: "",
    setAttribute: (name: string, value: string): void => { attributes.set(name, value); },
    addEventListener: (name: string, handler: () => void): void => { handlers.set(name, handler); },
  };
  const mediaHandlers = new Map<string, () => void>();
  const media = {
    matches: preference.matches,
    addEventListener: (name: string, handler: () => void): void => { mediaHandlers.set(name, handler); },
  };
  const body: { dataset: Record<string, string> } = { dataset: {} };
  const status = { textContent: "" };
  const inert = { append: (): void => {}, querySelectorAll: (): [] => [], addEventListener: (): void => {} };
  const nodes: Record<string, unknown> = { "motion-toggle": motionButton, "motion-state": status };
  runInNewContext(galleryScript, {
    document: { body, getElementById: (id: string): unknown => nodes[id] ?? inert, createElement: (): object => ({}), querySelectorAll: (): [] => [] },
    getComputedStyle: (): object => ({ getPropertyValue: (): string => "" }),
    window: { matchMedia: (query: string): typeof media => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return media; } },
  });
  const click = handlers.get("click");
  const change = mediaHandlers.get("change");
  assert.ok(click !== undefined && change !== undefined, "Motion controls must subscribe to clicks and OS changes");
  assert.equal(status.textContent, preference.state, "Initial motion state must follow the OS");
  assert.equal(attributes.get("aria-pressed"), "false", "Initialization does not create a manual override");
  media.matches = !preference.matches;
  change();
  assert.equal(status.textContent, media.matches ? "Motion: reduced" : "Motion: full", "Motion status follows live OS changes");
  click();
  assert.equal(body.dataset["motion"], "reduce", "Enabling the toggle creates the reduced-motion override");
  assert.equal(attributes.get("aria-pressed"), "true");
  assert.equal(motionButton.textContent, "Use system motion", "The toggle offers system preference rather than promising full motion");
  media.matches = preference.matches;
  change();
  assert.equal(status.textContent, "Motion: reduced", "An active manual override survives OS changes");
  click();
  assert.equal(body.dataset["motion"], undefined, "Disabling the toggle removes the override");
  assert.equal(attributes.get("aria-pressed"), "false");
  assert.equal(status.textContent, preference.state, "Removing the override still honors the OS");
  assert.equal(motionButton.textContent, "Reduce motion");
}

// ASCII contract for executable assets; references may carry CJK triggers.
for (const [name, text] of Object.entries({ "cobalt-kit.css": css, "loaders.css": loaders, "gallery.html": gallery })) {
  assert.doesNotMatch(text, /[^\x00-\x7F]/, `${name} must be ASCII`);
}

console.log(
  "Style presets passed: Cobalt Kit holds 4.5:1 in both themes, primitives are token-only, and 8 loader variants carry status semantics and a reduced-motion pose.",
);
