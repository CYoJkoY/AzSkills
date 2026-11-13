import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
for (const path of ["design-system/references/design-md-adapter.md", "design-system/references/design-md-schema.md", "design-system/references/source-format-matrix.md", "design-system/wabi-press-theme.ts"]) {
  assert.ok(existsSync(new URL("../" + path, import.meta.url)), "Missing compatibility entry: " + path);
}
const design = read("DESIGN.md");
assert.match(design, /^name: azskills-wabi-press$/m);
for (const term of ["NO_COLOR", "grapheme", "VSCodium"]) assert.ok(design.includes(term), "Missing retained contract: " + term);
for (const path of ["ui-design/SKILL.md", "architecture/references/runtime-selection.md"]) {
  assert.ok(read(path).includes("Terminal / TUI contract"), "Missing terminal guidance: " + path);
}
for (const heading of ["Contract", "Workflow", "Quality gates", "Output contract"]) {
  assert.ok(read("ui-design/SKILL.md").includes("## " + heading), "Missing UI contract: " + heading);
}
assert.match(read("design-system/SKILL.md"), /^name: design-system$/m);
for (const heading of ["Workbench layout", "Interaction contract", "Accessibility and responsiveness", "Scenario adaptation", "Layer scope", "Terminal / TUI contract", "Editorial reading contract", "Visual QA"]) {
  assert.ok(design.includes("## " + heading), "Missing contract section: " + heading);
}
const css = read("design-system/wabi-press.css");
for (const [alias, target] of Object.entries({canvas:"bg-canvas", surface:"bg-surface", text:"text-primary", "text-muted":"text-muted", accent:"accent-cinnabar", focus:"accent-indigo", success:"accent-moss", warning:"accent-ochre", danger:"accent-cinnabar"})) {
  assert.ok(css.includes("--wb-" + alias + ": var(--" + target + ");"), "Independent tool color: " + alias);
}
for (const selector of [".wb-shell", ".wb-sidebar", ".wb-statusbar", ".wabi-card", ".editorial-prose", 'html:not([data-surface="workbench"])']) {
  assert.ok(css.includes(selector), "Missing surface compatibility: " + selector);
}
assert.match(css, /--wb-row-height: 26px/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css, /#(?:0B57D0|A8C7FA|F7F8FA|18191C)/i);
assert.doesNotMatch(css, /html\[data-surface="editorial"\]\s*\{/);
const preview = read("design-system/preview/index.html");
const root = preview.match(/<html\b[^>]*>/)[0];
assert.doesNotMatch(root, /data-surface=/, "Default preview must not require an opt-in attribute.");
assert.match(preview, /id="workbench-view"[^>]* hidden/);
assert.doesNotMatch(preview.match(/<div id="editorial-view"[^>]*>/)[0], /hidden/);
for (const id of ["skill-search", "theme-toggle", "density", "surface-workbench", "surface-editorial"]) {
  assert.ok(preview.includes('id="' + id + '"'), "Missing interactive preview: " + id);
}
assert.match(preview, /delete root.dataset.surface/);
for (const path of ["design-system/SKILL.md", "ui-design/SKILL.md", "frontend-slides/SKILL.md", "readme-craft/SKILL.md"]) {
  assert.ok(read(path).includes("design-intelligence.md#default-visual-direction"), "Missing shared fallback: " + path);
}
const intelligence = read("design-intelligence.md");
assert.match(intelligence, /## Default visual direction/);
assert.match(intelligence, /platform constraints take priority/);
assert.doesNotMatch(read("README.md") + design, /workbench layer is the default|editorial layer is opt-in/i);
for (const path of ["assets/azskills-hero.svg", "assets/azskills-hero-dark.svg", "assets/readme/support-cta.svg", "assets/readme/support-cta-dark.svg"]) {
  const svg = read(path);
  assert.match(svg, /aria-labelledby="title desc"/);
  assert.match(svg, /<title id="title">.+<\/title>/);
  assert.match(svg, /<desc id="desc">.+<\/desc>/);
  assert.doesNotMatch(svg, /radialGradient|opacity="0\.0[45]"|rx="12"|#0B57D0|#A8C7FA/);
  assert.ok(svg.includes(path.includes("dark") ? "#E18C7C" : "#A6382A"), "Missing material accent: " + path);
}
const icons = readdirSync(new URL("../assets/readme/icons/", import.meta.url)).filter((name) => name.endsWith(".svg"));
assert.ok(icons.length > 0);
for (const name of icons) {
  const icon = read("assets/readme/icons/" + name);
  assert.match(icon, /svg\{color:#A6382A\}/);
  assert.match(icon, /@media\(prefers-color-scheme:dark\)\{svg\{color:#E18C7C\}\}/);
}
console.log("Design contract passed: default material, compatible tools, shared skill fallback and " + icons.length + " theme-aware icons.");
