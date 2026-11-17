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

const lowTraceFloor: Policy = { ...policy, forbidden: { ...policy.forbidden, traceShareMinCommands: 2 } };
assert.ok(inspectFigure(simplePath, lowTraceFloor).some((finding) => finding.rule === "trace"), "The trace-share floor comes from policy rather than a hard-coded constant");
for (const commands of [policy.forbidden.traceShareMinCommands - 1, policy.forbidden.traceShareMinCommands]) {
  const svg = documentWith('<g id="curves"><path id="curve-a" d="M 200 50 ' + "L 240 80 ".repeat(commands - 1) + '"/></g>');
  assert.equal(rules(svg).includes("trace"), commands >= policy.forbidden.traceShareMinCommands, "The configured trace floor is inclusive at " + commands + " commands");
}

console.log("Figure checker regressions passed: XML, prefixed elements, label placement and vertical bounds, configured path floor, and legend threshold.");
