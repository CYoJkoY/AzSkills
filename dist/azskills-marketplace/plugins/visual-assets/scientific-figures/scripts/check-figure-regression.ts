#!/usr/bin/env node
/*
 * Checker regressions for XML validity, detached label geometry, the path
 * complexity floor, and the legend tone threshold. Run directly:
 *   node scientific-figures/scripts/check-figure-regression.ts
 */

import assert from "node:assert/strict";
import { inspectFigure, summarise } from "./check-figure.ts";
import { type Policy, loadPolicy } from "./figure-model.ts";
import { parseXml } from "./xml-document.ts";

const policy: Policy = loadPolicy();

function documentWith(body: string, label = "Regression figure"): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="' + label + '">',
    '<g id="background"><rect x="0" y="0" width="640" height="400" fill="#FFFFFF"/></g>',
    '<g id="panels"><g id="panel-a"><rect x="10" y="10" width="300" height="200" fill="#F5F7FA"/></g></g>',
    '<g id="labels"><g id="label-body"><text id="text-body" x="30" y="330" font-size="10" fill="#12212F"><tspan x="30" dy="0">Baseline</tspan></text></g></g>',
    body,
    "</svg>",
  ].join("\n");
}

function rules(svg: string): string[] {
  return inspectFigure(svg, policy).map((finding) => finding.rule);
}

interface LabelFixture {
  placement?: string;
  y: number;
  spans: string;
  height?: number;
  x?: number;
}

function labelDocument(fixture: LabelFixture): string {
  const placement = fixture.placement === undefined ? "" : ' data-placement="' + fixture.placement + '"';
  return documentWith([
    '<g id="objects"><g id="node-a"><rect x="100" y="170" width="60" height="' + (fixture.height ?? 20) + '" fill="#FFFFFF"/></g></g>',
    '<g id="detached-labels"><g id="obj-label-node-a" data-for="node-a"' + placement + '>',
    '<text x="' + (fixture.x ?? 130) + '" y="' + fixture.y + '" font-size="8" fill="#000000" text-anchor="middle">' + fixture.spans + '</text>',
    '</g></g>',
  ].join("\n"));
}

function assertClean(svg: string, message: string): void {
  const errors = inspectFigure(svg, policy).filter((finding) => finding.severity === "error");
  assert.deepEqual(errors, [], message);
}

const baseline = summarise(inspectFigure(documentWith(""), policy));
assert.equal(baseline.errors, 0, "The regression baseline is clean");

const malformed = documentWith("<title>A & B</title>");
assert.ok(rules(malformed).includes("xml"), "A bare ampersand is rejected as XML");
assert.ok(parseXml(malformed).errors.length > 0, "The exported parser reports the bare ampersand");

const quoted = documentWith("<title>Signal > noise</title>", "Signal > noise");
assert.ok(!rules(quoted).includes("xml"), "A greater-than inside a quoted attribute is valid XML");
assert.equal(parseXml(quoted).errors.length, 0, "The parser accepts a quoted greater-than sign");
assert.ok(!parseXml(documentWith("<title>A &amp; B</title>")).errors.length, "Predefined entities stay valid");
assert.ok(parseXml(documentWith("<title>&#65;&#x42;</title>")).errors.length === 0, "Numeric entities stay valid");
assert.ok(parseXml(documentWith("<title>&unknown;</title>")).errors.length > 0, "Unknown entities are rejected");
assert.ok(parseXml(documentWith("<title><![CDATA[A & B]]></title>")).errors.length === 0, "CDATA ampersands are not entity-decoded");
assert.ok(parseXml(documentWith("<title>&#0;</title>")).errors.length > 0, "Invalid XML character references are rejected");
assert.ok(parseXml(documentWith('<title aria-label="x < y"/>')).errors.length > 0, "Literal less-than signs in attributes are rejected");
assert.ok(parseXml(documentWith("<!-- invalid -- comment -->")).errors.length > 0, "Invalid comment delimiters are rejected");

const invalidAttributeXml = [
  "<g id='probe-aa'data-test='x'/>",
  "<g 7bad='x'/>",
  "<g good?bad='x'/>",
  "<g good+bad='x'/>",
  "<g good!bad='x'/>",
  "<g .bad='x'/>",
  "<g -bad='x'/>",
  "<g id='x'\u00a0data-test='y'/>",
  "<g id\u00a0='x'/>",
  "<g id='x' id='y'/>",
  "<g __proto__='x' __proto__='y'/>",
  "<g></ g>",
  "<g></g\u00a0>",
  "<g></g/>",
  "<7bad/>",
  "<g?/>",
  "<!-- x--->",
];

for (const fragment of invalidAttributeXml) {
  const svg = documentWith(fragment);
  assert.ok(parseXml(svg).errors.length > 0, fragment);
  assert.ok(rules(svg).includes("xml"), fragment);
}

const validAttributeXml = [
  "<g id='x' data-test='y'/>",
  "<g\tid='x'\r\ndata-test = 'y' />",
  "<g _ok='x' ns:ok.name-7='y'/>",
  "<g id='Signal > noise'/>",
  "<g id='A &amp; B &lt; &gt; &apos; &quot; &#65; &#x42;'/>",
  "<g><![CDATA[A & B < C > D]]></g>",
  "<!-- A & B < C > D -->",
  "<g></g \t\r\n>",
  "<g __proto__='literal' constructor='value'/>",
];

for (const fragment of validAttributeXml) {
  const svg = documentWith(fragment);
  assert.deepEqual(parseXml(svg).errors, [], fragment);
  assert.ok(!rules(svg).includes("xml"), fragment);
}

for (const name of ["script", "foreignObject", "filter", "feImage"]) {
  const prefixed = documentWith("<s:" + name + " xmlns:s='http://www.w3.org/2000/svg'>alert(1)</s:" + name + ">");
  assert.ok(rules(prefixed).includes("raster"), "A prefixed " + name + " cannot bypass the forbidden-element gate");
}
assertClean(
  documentWith('<meta:source xmlns:meta="urn:figure:metadata">Independent source</meta:source>'),
  "A supported metadata namespace remains clean",
);

const detached = documentWith(
  [
    '<g id="objects"><g id="node-a"><rect x="100" y="100" width="60" height="40" fill="#FFFFFF"/></g></g>',
    '<g id="detached-labels"><g id="obj-label-node-a" data-for="node-a">',
    '<text x="130" y="120" font-size="8" fill="#000000"><tspan x="130" dy="0">IL6 SUPERCALIFRAGILISTICEXPIALIDOCIOUS</tspan></text>',
    "</g></g>",
  ].join("\n"),
);
assert.ok(rules(detached).includes("overflow"), "A detached data-for label overflow is detected");

const overflowLines = "ABCD".repeat(40).match(/.{1,11}/g) ?? [];
assert.equal(overflowLines.length, 15, "The vertical-overflow reproduction has 15 wrapped lines");
const verticalOverflow = labelDocument({
  placement: "inside",
  y: 112.8,
  spans: overflowLines.map((line, index) => '<tspan x="130" dy="' + (index === 0 ? 0 : 10) + '">' + line + '</tspan>').join(""),
});
const overflowFindings = inspectFigure(verticalOverflow, policy).filter((finding) => finding.rule === "overflow");
assert.equal(overflowFindings.length, 1, "The reproduction fails its vertical gate without a spurious width finding");
assert.match(overflowFindings[0]?.message ?? "", /spans y=/, "An inside label is checked even when its first baseline is outside the object");

for (const spans of [
  '<tspan dy="0">TNF</tspan><tspan dy="50">IL6</tspan>',
  '<tspan dy="0">TNF</tspan><tspan y="110">IL6</tspan>',
  '<tspan dy="0">TNF</tspan><tspan dy="-50">IL6</tspan>',
]) {
  assert.ok(rules(labelDocument({ placement: "inside", y: 182.8, spans })).includes("overflow"), "Every positioned line contributes to the vertical bounds");
}

assertClean(labelDocument({ placement: "inside", y: 182.8, spans: '<tspan dy="0">TNF</tspan>' }), "A fitting inside label passes");
assertClean(labelDocument({ placement: "inside", y: 182.8, height: 40, spans: '<tspan dy="0">TNF</tspan><tspan dy="10">IL6</tspan>' }), "A fitting multiline inside label passes");
assertClean(labelDocument({ y: 182.8, spans: '<tspan dy="0">TNF</tspan>' }), "A legacy inside label without placement remains supported");
assertClean(labelDocument({ y: 204.4, spans: '<tspan dy="0">Long label here</tspan>' }), "A legacy outside label is not constrained to the object's width");

for (const fixture of [
  { placement: "above", y: 166.8, spans: '<tspan dy="0">Long label here</tspan><tspan dy="10">TNF</tspan>' },
  { placement: "below", y: 204.4, spans: '<tspan dy="0">Long label here</tspan>' },
  { placement: "left", x: 24, y: 182.8, spans: '<tspan dy="0">Long label here</tspan>' },
  { placement: "right", x: 164, y: 182.8, spans: '<tspan dy="0">Long label here</tspan>' },
]) {
  assertClean(labelDocument(fixture), "A legitimate " + fixture.placement + " label is not constrained to the object's bounds");
}

const tones = documentWith(
  [
    '<g id="objects">',
    '<g id="accent-node" data-tone="accent"><rect x="30" y="40" width="40" height="30" fill="#DDE8FB"/></g>',
    '<g id="second-node" data-tone="accent-2"><rect x="90" y="40" width="40" height="30" fill="#E8F3EA"/></g>',
    '<g id="success-node" data-tone="success"><rect x="150" y="40" width="40" height="30" fill="#EDF7EA"/></g>',
    '<g id="warning-node" data-tone="warning"><rect x="210" y="40" width="40" height="30" fill="#FFF4DD"/></g>',
    "</g>",
    '<g id="labels"><g id="label-body"><text id="text-body" x="30" y="330" font-size="10" fill="#12212F"><tspan x="30" dy="0">Four tones</tspan></text></g></g>',
  ].join("\n"),
);
assert.ok(rules(tones).includes("legend"), "Four tones without a legend are rejected");
const tonesWithLegend = tones.replace("</svg>", '<g id="legend"><g id="legend-four" data-kind="legend-item" data-tone="warning"/></g></svg>');
assert.ok(!rules(tonesWithLegend).includes("legend"), "A legend clears the tone threshold");

const simplePath = documentWith(
  '<g id="curves"><path id="curve-a" d="M 200 50 Q 240 80 280 50" fill="none" stroke="#12212F"/></g>',
);
assert.ok(!rules(simplePath).includes("trace"), "A two-command named curve clears the trace floor");

// A stylesheet is not an attribute: external imports and embedded payloads hid there.
for (const css of [
  '@import url("https://evil.example/x.css");',
  ".n{fill:url(data:image/png;base64,AAA)}",
  ".n{filter:blur(2px)}",
] as const) {
  assert.ok(rules(documentWith("<style>" + css + "</style>")).includes("raster"), "A <style> block bypassed the raster gate: " + css);
}
assert.ok(rules(documentWith('<path id="curve-b" d="M 0 0 L 1 1 base64"/>')).includes("raster"), "Path data carrying a raster token is rejected");
assertClean(documentWith('<g id="curves"><path id="curve-c" d="M 200 50 Q 240 80 280 50" stroke="#12212F" fill="none"/></g>'), "A clean path is not flagged by the payload gate");

// Bounds must cover the painted extent, not just the anchor.
for (const fragment of [
  '<g id="objects"><g id="wide"><rect x="600" y="40" width="200" height="40" fill="#DDE8FB"/></g></g>',
  '<g id="objects"><g id="tall"><rect x="40" y="380" width="60" height="120" fill="#DDE8FB"/></g></g>',
  '<g id="objects"><g id="round"><circle cx="630" cy="200" r="40" fill="#DDE8FB"/></g></g>',
  '<g id="labels"><g id="label-x"><text x="620" y="200" font-size="10" fill="#12212F"><tspan x="620" dy="0">Overflowing label</tspan></text></g></g>',
] as const) {
  assert.ok(rules(documentWith(fragment)).includes("canvas"), "A clipping shape is reported: " + fragment);
}
assertClean(documentWith('<g id="objects"><g id="inside"><rect x="400" y="120" width="60" height="40" fill="#DDE8FB"/></g></g>'), "A shape inside the canvas stays quiet");
for (const path of ['M 900 500 L 1200 700', 'M 100 200 A 400 400 0 1 1 200 200']) {
  assert.ok(
    rules(documentWith('<g id="curves"><path id="curve-x" d="' + path + '" stroke="#12212F" fill="none"/></g>')).includes("canvas"),
    "A path drawn off the canvas is reported: " + path,
  );
}
assertClean(documentWith('<g id="curves"><path id="curve-y" d="M 100 100 C 140 60 200 60 240 100" stroke="#12212F" fill="none"/></g>'), "A path inside the canvas stays quiet");

// Contrast resolves the composited stack, so a light veil is not read as its own RGB.
function veil(fill: string, opacity: string, textFill: string): string {
  return documentWith(
    [
      '<g id="objects"><g id="veil"><rect x="0" y="290" width="640" height="110" fill="' + fill + '" fill-opacity="' + opacity + '"/></g></g>',
      '<g id="veil-label"><g id="label-veil"><text x="40" y="340" font-size="10" fill="' + textFill + '"><tspan x="40" dy="0">Veiled</tspan></text></g></g>',
    ].join("\n"),
  );
}
assertClean(veil("#12212F", "0.08", "#12212F"), "An 8% veil does not manufacture a contrast failure");
assert.ok(rules(veil("#12212F", "1", "#2A3440")).includes("contrast"), "An opaque dark veil over dark text fails contrast");
assertClean(veil("#12212F", "0.5", "#12212F"), "A half-opacity veil is composited against the page, not read as its own ink");
assert.ok(rules(veil("#FFFFFF", "0.95", "#EEF2F6")).includes("contrast"), "Light text under a near-white veil still fails");

// Surfaces composite in paint order, so a later scrim wins over a smaller node.
function layered(first: string, second: string, textFill: string): string {
  return documentWith(
    [
      '<g id="objects">' + first + second + "</g>",
      '<g id="late-labels"><g id="label-late"><text x="140" y="160" font-size="10" fill="' + textFill + '"><tspan x="140" dy="0">Late label</tspan></text></g></g>',
    ].join("\n"),
  );
}
const darkNode = '<g id="node-dark"><rect x="100" y="100" width="200" height="120" fill="#101820"/></g>';
const wideScrim = '<g id="scrim"><rect x="40" y="60" width="560" height="280" fill="#FFFFFF" fill-opacity="0.9"/></g>';
assertClean(layered(darkNode, wideScrim, "#12212F"), "A scrim painted over a node composites lighter than the node");
assert.ok(
  rules(layered(darkNode, wideScrim, "#F7F9FC")).includes("contrast"),
  "Light text is still measured against the scrim that was painted last, not the node beneath",
);
assertClean(layered(wideScrim, darkNode, "#F7F9FC"), "A node painted over a scrim composites darker than the scrim");
assertClean(
  documentWith(
    [
      '<defs><rect x="0" y="0" width="640" height="400" fill="#101820"/></defs>',
      '<g id="defs-labels"><g id="label-defs"><text x="60" y="200" font-size="10" fill="#12212F"><tspan x="60" dy="0">Clean</tspan></text></g></g>',
    ].join("\n"),
  ),
  "Geometry declared inside defs is not read as a painted background",
);
assertClean(
  documentWith('<defs><path id="symbol-curve" d="M 900 500 L 1200 700" stroke="#12212F" fill="none"/></defs>'),
  "A path template inside defs is not clipped against the canvas",
);
assertClean(
  documentWith(
    [
      '<g id="objects"><g id="dark-band"><rect x="40" y="150" width="400" height="120" fill="#101820"/></g></g>',
      '<g id="veil-opacity"><g id="scrim-opacity"><rect x="40" y="150" width="400" height="120" fill="#FFFFFF" opacity="0.9"/></g></g>',
      '<g id="opacity-labels"><g id="label-opacity"><text x="60" y="200" font-size="10" fill="#12212F"><tspan x="60" dy="0">Covered</tspan></text></g></g>',
    ].join("\n"),
  ),
  "An element-level opacity veil is composited like a fill-opacity veil",
);

// A legend paints last, so content under its strip is already covered.
const legendStrip =
  '<g id="legend"><g id="legend-one" data-kind="legend-item" data-tone="accent"><rect x="480" y="356" width="10" height="10" fill="#E8EEF6"/>' +
  '<text x="494" y="364" font-size="6.5" fill="#12212F"><tspan x="494" dy="0">Signal</tspan></text></g></g>';
assert.ok(
  rules(documentWith('<g id="objects"><g id="node-under"><rect x="470" y="340" width="120" height="50" fill="#DDE8FB"/></g></g>\n' + legendStrip)).includes("legend"),
  "An object under the legend strip is reported as covered",
);
assertClean(
  documentWith('<g id="objects"><g id="node-clear"><rect x="40" y="300" width="120" height="50" fill="#DDE8FB"/></g></g>\n' + legendStrip),
  "An object clear of the legend strip is not reported",
);
/*
 * One transform policy governs both sides: a rotated legend item is left out of
 * the band instead of being measured where it would have sat unrotated.
 */
assertClean(
  documentWith(
    [
      '<g id="objects"><g id="node-under-rotated"><rect x="470" y="340" width="120" height="50" fill="#DDE8FB"/></g></g>',
      '<g id="legend"><g id="legend-rotated" data-kind="legend-item" data-tone="accent" transform="rotate(30 480 360)">',
      '<rect x="480" y="356" width="10" height="10" fill="#E8EEF6"/>',
      "</g></g>",
    ].join("\n"),
  ),
  "A rotated legend item is excluded from the band the same way rotated content is",
);

// A band thinner than two label pads has no vertical room, so it is not overflow.
assertClean(
  documentWith(
    [
      '<g id="objects"><g id="band"><rect x="100" y="100" width="200" height="8" fill="#E4EBF2"/></g></g>',
      '<g id="band-label"><g id="obj-label-band" data-for="band" data-placement="inside">',
      '<text x="200" y="106" font-size="8" fill="#12212F" text-anchor="middle"><tspan x="200" dy="0">membrane</tspan></text>',
      "</g></g>",
    ].join("\n"),
  ),
  "A membrane-thin band does not report a reversed vertical range",
);

// Line length is a policy limit, not only a geometry one.
const longNote = documentWith(
  '<g id="note-label"><g id="label-note" data-role="note"><text x="20" y="200" font-size="7" fill="#12212F"><tspan x="20" dy="0">' +
    "a".repeat(policy.text.maxCharsPerLineNote + 1) + "</tspan></text></g></g>",
);
assert.ok(rules(longNote).includes("text"), "A note longer than the configured line limit is reported");
const shortNote = documentWith(
  '<g id="note-label"><g id="label-note" data-role="note"><text x="20" y="200" font-size="7" fill="#12212F"><tspan x="20" dy="0">' +
    "a".repeat(policy.text.maxCharsPerLineNote) + "</tspan></text></g></g>",
);
assert.ok(!rules(shortNote).includes("text"), "A note at the configured line limit stays clean");
const unroledLabel = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="Loose label">',
  '<g id="background"><rect x="0" y="0" width="640" height="400" fill="#FFFFFF"/></g>',
  '<g id="labels"><g id="label-free"><text x="20" y="200" font-size="7" fill="#12212F"><tspan x="20" dy="0">' +
    "a".repeat(policy.text.maxCharsPerLineLabel + 1) + "</tspan></text></g></g>",
  "</svg>",
].join("\n");
assert.ok(rules(unroledLabel).includes("text"), "Text in the labels layer is measured even without data-role");

const lowTraceFloor: Policy = { ...policy, forbidden: { ...policy.forbidden, traceShareMinCommands: 2 } };
assert.ok(inspectFigure(simplePath, lowTraceFloor).some((finding) => finding.rule === "trace"), "The trace-share floor comes from policy rather than a hard-coded constant");
for (const commands of [policy.forbidden.traceShareMinCommands - 1, policy.forbidden.traceShareMinCommands]) {
  const svg = documentWith('<g id="curves"><path id="curve-a" d="M 200 50 ' + "L 240 80 ".repeat(commands - 1) + '"/></g>');
  assert.equal(rules(svg).includes("trace"), commands >= policy.forbidden.traceShareMinCommands, "The configured trace floor is inclusive at " + commands + " commands");
}
/*
 * An arc only sweeps a slice of its ellipse, so its box follows the swept range
 * rather than the whole ellipse. A short chord on a huge-radius ellipse bulges
 * by a couple of units; the whole-ellipse box and the older
 * one-radius-per-endpoint rule both reported it as a large overflow.
 */
assertClean(
  documentWith('<g id="objects"><path id="shallow-arc" d="M 100 200 A 500 500 0 0 1 200 200" fill="none" stroke="#12212F" stroke-width="1"/></g>'),
  "A shallow arc on a large-radius ellipse is not reported as estimated overflow",
);
assertClean(
  documentWith('<g id="objects"><path id="rotated-arc" d="M 120 200 A 140 60 30 0 1 320 250" fill="none" stroke="#12212F" stroke-width="1"/></g>'),
  "A rotated elliptical arc inside the canvas is not reported as estimated overflow",
);
assert.ok(
  rules(documentWith('<g id="objects"><path id="outside-arc" d="M 120 200 A 400 300 0 0 1 900 200" fill="none" stroke="#12212F" stroke-width="1"/></g>')).includes("canvas"),
  "An arc that leaves the canvas is still reported",
);

console.log(
  "Figure checker regressions passed: XML, prefixed elements, stylesheet payloads, painted bounds, composited contrast, label placement and vertical bounds, legend strip, transform policy and threshold, configured path floor, arc bounds, and line-length policy.",
);
