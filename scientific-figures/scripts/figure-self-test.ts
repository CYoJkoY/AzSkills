#!/usr/bin/env node
/*
 * Renderer self-test.
 *
 * Renders every fixture through the real code path and then throws the result
 * back through the checker. A renderer regression and a checker regression
 * therefore cannot cancel each other out: the same document must satisfy both.
 */

import assert from "node:assert/strict";
import { connectorScene, fixtures, invalidXmlText, rotatedAnchorCases } from "./figure-fixtures.ts";
import { inspectFigure, summarise } from "./check-figure.ts";
import { type Point, type Policy, type Scene, type SceneNode, SceneError, loadPolicy, parseScene, resolvePalette, wrapText, textWidth } from "./figure-model.ts";
import { validateSceneSchema } from "./scene-schema.ts";

/**
 * The renderer is injected rather than imported so the entry script can call the
 * self-test from its own module without a circular dynamic import.
 */
export type Renderer = (scene: Scene, policy: Policy) => string;

const ids = (svg: string): string[] =>
  [...svg.matchAll(/\bid="([^"]+)"/g)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

function drawnBounds(node: SceneNode): { width: number; height: number } {
  const circular = node.kind === "well" || node.kind === "badge" || (node.kind === "shape" && node.shape === "circle");
  if (!circular || node.labelPlacement !== "inside") return { width: node.box.width, height: node.box.height };
  const side = Math.min(node.box.width, node.box.height);
  return { width: side, height: side };
}

function verifyNodeLabel(node: SceneNode, policy: Policy, name: string): void {
  if (node.label === "") return;
  const bounds = drawnBounds(node);
  const area = bounds.width - policy.layout.labelPadPt * 2;
  const maxWidth = node.labelPlacement === "inside" ? area : Math.max(bounds.width, 64);
  const lines = wrapText(node.label, { sizePt: policy.type.labelPt, maxWidth }, policy);
  for (const line of lines) {
    const width = textWidth(line, policy.type.labelPt, policy);
    assert.ok(width <= Math.max(bounds.width, 64) * policy.text.maxOverflowRatio, name + " label overflows its box: " + line);
  }
  if (node.labelPlacement !== "inside") return;
  const height = lines.length * policy.type.labelPt * policy.type.lineHeight;
  assert.ok(
    height <= bounds.height * 1.02,
    name + " label " + node.id + " needs " + Math.round(height) + "pt of height in a " + bounds.height + "pt box",
  );
}

function groupMarkup(svg: string, id: string): string {
  const group = svg.split('<g id="' + id + '"')[1]?.split("</g>")[0];
  assert.ok(group !== undefined, "missing rendered group " + id);
  return group;
}

function textLines(markup: string): string[] {
  return [...markup.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
}

function firstPoint(markup: string, element: "polyline" | "polygon"): Point {
  const match = new RegExp("<" + element + ' points="([-\\d.]+),([-\\d.]+)').exec(markup);
  assert.ok(match !== null, "missing " + element + " point list");
  assert.ok(match[1] !== undefined && match[2] !== undefined, "incomplete point coordinates");
  return { x: Number(match[1]), y: Number(match[2]) };
}

function blockingFindings(svg: string, policy: Policy) {
  return inspectFigure(svg, policy).filter((finding) => finding.severity === "error");
}

function verifyRotatedAnchors(render: Renderer, policy: Policy): void {
  for (const probe of rotatedAnchorCases) {
    const nodes = connectorScene.nodes.map((node) => node.id === "source" ? { ...node, rotate: probe.rotate } : node);
    const svg = render(parseScene({ ...connectorScene, nodes }, policy), policy);
    assert.deepEqual(firstPoint(groupMarkup(svg, "connection"), "polyline"), probe.start, "source anchor at " + probe.rotate + " degrees");
  }
  const nodes = connectorScene.nodes.map((node) => ({ ...node, rotate: 90, box: { ...node.box, width: node.id === "source" ? 160 : 120, height: 20 } }));
  const turned = parseScene({ ...connectorScene, nodes }, policy);
  const forward = groupMarkup(render(turned, policy), "connection");
  assert.deepEqual(firstPoint(forward, "polyline"), { x: 194, y: 110 }, "rotated source anchor moved off its boundary");
  assert.deepEqual(firstPoint(forward, "polygon"), { x: 446, y: 90 }, "rotated destination anchor moved off its boundary");
  const reverse = parseScene({ ...connectorScene, nodes, arrows: [{ id: "connection", from: { node: "target" }, to: { node: "source" } }] }, policy);
  const backward = groupMarkup(render(reverse, policy), "connection");
  assert.deepEqual(firstPoint(backward, "polyline"), { x: 446, y: 90 }, "reversed rotated source used an unrotated boundary");
  assert.deepEqual(firstPoint(backward, "polygon"), { x: 194, y: 110 }, "reversed rotated destination used an unrotated boundary");
  const elbow = parseScene({ ...connectorScene, nodes, arrows: [{ id: "connection", from: { node: "source" }, to: { node: "target" }, route: "elbow" }] }, policy);
  assert.match(groupMarkup(render(elbow, policy), "connection"), /<polyline points="194,110 320,110 320,90 /, "elbow used the local side instead of the rotated outward direction");
}

function verifyExplicitPorts(render: Renderer, policy: Policy): void {
  const cases = [
    { from: "auto", to: "auto", start: { x: 254, y: 110 }, end: { x: 396, y: 110 } },
    { from: "top", to: "bottom", start: { x: 250, y: 106 }, end: { x: 400, y: 114 } },
  ];
  for (const probe of cases) {
    const arrows = [{ id: "connection", from: { node: "source", x: 250, y: 110, side: probe.from }, to: { node: "target", x: 400, y: 110, side: probe.to } }];
    const upright = parseScene({ ...connectorScene, arrows }, policy);
    const turned = parseScene({ ...connectorScene, arrows, nodes: connectorScene.nodes.map((node) => ({ ...node, rotate: 90 })) }, policy);
    const baseline = groupMarkup(render(upright, policy), "connection");
    const rotated = groupMarkup(render(turned, policy), "connection");
    assert.equal(rotated, baseline, "node rotation changed explicit " + probe.from + "/" + probe.to + " coordinates");
    assert.deepEqual(firstPoint(rotated, "polyline"), probe.start);
    assert.deepEqual(firstPoint(rotated, "polygon"), probe.end);
  }
}

function verifyCircleGeometry(render: Renderer, policy: Policy): void {
  for (const box of [{ x: 100, y: 100, width: 120, height: 60 }, { x: 130, y: 70, width: 60, height: 120 }]) {
    const scene = parseScene({ canvas: connectorScene.canvas, nodes: [{ id: "circle-probe", kind: "shape", shape: "circle", box }] }, policy);
    const circle = groupMarkup(render(scene, policy), "circle-probe");
    assert.match(circle, /<circle cx="160" cy="130" r="30"/);
    assert.doesNotMatch(circle, /<ellipse\b/);
    const ellipse = parseScene({ canvas: connectorScene.canvas, nodes: [{ id: "ellipse-probe", kind: "shape", shape: "ellipse", box }] }, policy);
    assert.match(groupMarkup(render(ellipse, policy), "ellipse-probe"), /<ellipse\b/);
  }
}

interface LabelProbe {
  box: { x: number; y: number; width: number; height: number };
  rotate: number;
  shape: "rect" | "circle";
  placement: "inside" | "below";
  label: string;
}

function labelProbeScene(probe: LabelProbe) {
  return {
    canvas: connectorScene.canvas,
    nodes: [
      {
        id: "label-node",
        kind: "shape",
        shape: probe.shape,
        box: probe.box,
        rotate: probe.rotate,
        labelPlacement: probe.placement,
        label: probe.label,
      },
    ],
  };
}

function verifyCircularAnchors(render: Renderer, policy: Policy): void {
  const probes = [
    { name: "shape:circle", node: { kind: "shape", shape: "circle" } },
    { name: "well", node: { kind: "well" } },
    { name: "badge", node: { kind: "badge" } },
  ];
  for (const probe of probes) {
    for (const rotate of [0, 90]) {
      const scene = {
        canvas: connectorScene.canvas,
        nodes: [
          { id: "source", ...probe.node, box: { x: 100, y: 100, width: 120, height: 60 }, rotate },
          { id: "target", kind: "shape", box: { x: 400, y: 80, width: 60, height: 60 } },
        ],
        arrows: [{ id: "connection", from: { node: "source" }, to: { node: "target" } }],
      };
      const svg = render(parseScene(scene, policy), policy);
      assert.deepEqual(
        firstPoint(groupMarkup(svg, "connection"), "polyline"),
        { x: 194, y: 130 },
        probe.name + " anchor at " + rotate + " degrees used the raw box instead of the drawn circle",
      );
    }
  }
}

function verifyInsideLabels(render: Renderer, policy: Policy): void {
  const elongated = { x: 100, y: 100, width: 120, height: 40 };
  const rotated: LabelProbe = { box: elongated, rotate: 90, shape: "rect", placement: "inside", label: "STAT3 dimer" };
  const rotatedSvg = render(parseScene(labelProbeScene(rotated), policy), policy);
  assert.match(groupMarkup(rotatedSvg, "obj-label-label-node"), /transform="rotate\(90 160 120\)"/, "inside label ignored the node rotation");
  assert.equal(blockingFindings(rotatedSvg, policy).length, 0, "rotated inside label failed its own gate");
  const outsideSvg = render(parseScene(labelProbeScene({ ...rotated, placement: "below" }), policy), policy);
  assert.doesNotMatch(groupMarkup(outsideSvg, "obj-label-label-node"), /transform="/, "outside label must stay horizontal");

  const circle: LabelProbe = { box: { x: 100, y: 100, width: 120, height: 60 }, rotate: 0, shape: "circle", placement: "inside", label: "WWWWWWWWWWWW" };
  const circleSvg = render(parseScene(labelProbeScene(circle), policy), policy);
  const circleLabel = groupMarkup(circleSvg, "obj-label-label-node");
  assert.match(circleLabel, /<text x="160"/, "circle label is not centred on the drawn circle");
  assert.equal(textLines(circleLabel).length, 2, "circle label wrapped at the raw box width instead of the drawn circle");

  const crowded: LabelProbe = { ...rotated, label: "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi" };
  const findings = blockingFindings(render(parseScene(labelProbeScene(crowded), policy), policy), policy);
  assert.ok(findings.some((finding) => finding.rule === "overflow"), "an over-tall rotated label passed the gate");
}

function sceneWithText(content: string) {
  const node = connectorScene.nodes[0];
  assert.ok(node !== undefined);
  return {
    canvas: connectorScene.canvas,
    title: content,
    panels: [{ id: "text-panel", box: node.box, title: content }],
    nodes: [{ ...node, label: content, detail: content }],
    arrows: [{ id: "text-arrow", from: { node: node.id }, to: { node: node.id }, label: content }],
    labels: [{ id: "text-label", text: content, x: 10, y: 20 }],
    legend: [{ id: "text-legend", label: content }],
  };
}

function verifyXmlTextBoundaries(render: Renderer, policy: Policy): void {
  const valid = "TNF\t\n\r\u03b1 \u{1D6FC} \u{10FFFF} & < > \" '";
  const escaped = render(parseScene(sceneWithText(valid), policy), policy);
  assert.match(escaped, /&amp;/);
  assert.match(escaped, /&lt;/);
  const base = sceneWithText("valid");
  const probes = [
    { path: "scene.title", replace: (value: string) => ({ ...base, title: value }) },
    { path: "scene.panels[0].title", replace: (value: string) => ({ ...base, panels: base.panels.map((panel) => ({ ...panel, title: value })) }) },
    { path: "scene.nodes[0].label", replace: (value: string) => ({ ...base, nodes: base.nodes.map((node) => ({ ...node, label: value })) }) },
    { path: "scene.nodes[0].detail", replace: (value: string) => ({ ...base, nodes: base.nodes.map((node) => ({ ...node, detail: value })) }) },
    { path: "scene.arrows[0].label", replace: (value: string) => ({ ...base, arrows: base.arrows.map((arrow) => ({ ...arrow, label: value })) }) },
    { path: "scene.labels[0].text", replace: (value: string) => ({ ...base, labels: base.labels.map((label) => ({ ...label, text: value })) }) },
    { path: "scene.legend[0].label", replace: (value: string) => ({ ...base, legend: base.legend.map((item) => ({ ...item, label: value })) }) },
  ];
  for (const probe of probes) {
    for (const content of invalidXmlText) {
      assert.throws(() => render(parseScene(probe.replace(content), policy), policy), (error: unknown) => error instanceof SceneError && error.path === probe.path && /invalid XML character/.test(error.message), probe.path);
    }
  }
}

function verifyUnicodeLength(render: Renderer, policy: Policy): void {
  const node = connectorScene.nodes[0];
  assert.ok(node !== undefined);
  for (const length of [121, 240]) {
    const label = "\u{1D6FC}".repeat(length);
    const value = { canvas: connectorScene.canvas, nodes: [{ ...node, label, detail: label }] };
    assert.doesNotThrow(() => validateSceneSchema(value));
    const scene = parseScene(value, policy);
    assert.equal(scene.nodes[0]?.label, label);
    assert.equal(scene.nodes[0]?.detail, label);
    assert.ok(render(scene, policy).includes("\u{1D6FC}"));
  }
  const oversized = { canvas: connectorScene.canvas, nodes: [{ ...node, label: "\u{1D6FC}".repeat(241) }] };
  assert.throws(() => validateSceneSchema(oversized), /scene\.nodes\[0\]\.label: exceeds maxLength 240/);
  assert.throws(() => parseScene(oversized, policy), /scene\.nodes\[0\]\.label: exceeds maxLength 240/);
}

function verifySchemaArrays(policy: Policy): void {
  const arrows = [
    { id: "connection", from: { node: "source", x: 250 }, to: { node: "target" } },
    { id: "connection", from: { node: "source" }, to: { node: "target", y: 110 } },
  ];
  for (const arrow of arrows) {
    assert.throws(() => parseScene({ ...connectorScene, arrows: [arrow] }, policy), /is required with [xy]/);
  }
  const invalid = { ...connectorScene, nodes: [...connectorScene.nodes, { id: "bad-node", kind: "shape" }] };
  assert.throws(() => validateSceneSchema(invalid), /scene\.nodes\[2\]\.box: is required/);
  assert.throws(() => validateSceneSchema({ ...connectorScene, nodes: Array.from({ length: 201 }, () => connectorScene.nodes[0]) }), /scene\.nodes: exceeds maxItems 200/);
}

export function runSelfTest(render: Renderer): void {
  const policy = loadPolicy();
  const rendered: Array<{ name: string; svg: string }> = [];
  for (const fixture of fixtures) {
    // Re-parse the declared fixture so the self-test exercises validation too.
    const scene = parseScene(JSON.parse(JSON.stringify(fixture.scene)), policy);
    const svg = render(scene, policy);
    rendered.push({ name: fixture.name, svg });

    const findings = inspectFigure(svg, policy);
    const blocking = findings.filter((finding) => finding.severity === "error");
    assert.equal(
      blocking.length,
      0,
      fixture.name + " failed its own gates: " + blocking.map((finding) => finding.rule + ": " + finding.message).join(" | "),
    );

    for (const token of ["<image", "data:", "foreignObject", "<script", "xlink:href"]) {
      assert.ok(!svg.includes(token), fixture.name + " emitted a forbidden token: " + token);
    }
    assert.match(svg, /role="img"/, fixture.name + " lost its role");
    assert.match(svg, /<title id="svg-title">/, fixture.name + " lost its accessible title");
    assert.ok(svg.includes("<text"), fixture.name + " lost real text");
    const layers = [
      { id: "panels", count: scene.panels.length },
      { id: "objects", count: scene.nodes.length },
      { id: "connectors", count: scene.arrows.length },
      { id: "labels", count: scene.labels.length },
    ];
    for (const layer of layers.filter((layer) => layer.count > 0)) {
      assert.ok(svg.includes('<g id="' + layer.id + '">'), fixture.name + " is missing the " + layer.id + " layer");
    }

    const sceneIds = [
      ...scene.panels.map((panel) => panel.id),
      ...scene.nodes.map((node) => node.id),
      ...scene.arrows.map((arrow) => arrow.id),
      ...scene.labels.map((label) => "label-" + label.id),
      ...scene.legend.map((item) => item.id),
    ];
    const emitted = ids(svg);
    assert.equal(new Set(emitted).size, emitted.length, fixture.name + " emitted duplicate ids");
    for (const id of sceneIds) {
      assert.ok(emitted.includes(id), fixture.name + " dropped an editable group for " + id);
    }

    // Every arrow keeps a shaft and a head as separate elements.
    for (const arrow of scene.arrows) {
      const block = svg.split('<g id="' + arrow.id + '"')[1]?.split("</g>")[0] ?? "";
      assert.ok(block.includes("<polyline"), fixture.name + " arrow " + arrow.id + " has no shaft");
      const head = arrow.kind === "inhibition" ? "<line" : "<polygon";
      assert.ok(block.includes(head), fixture.name + " arrow " + arrow.id + " has no separate head");
    }

    // Text stays inside the box it belongs to: no silent clipping in print.
    for (const node of scene.nodes) verifyNodeLabel(node, policy, fixture.name);
  }

  verifyRotatedAnchors(render, policy);
  verifyExplicitPorts(render, policy);
  verifyCircleGeometry(render, policy);
  verifyCircularAnchors(render, policy);
  verifyInsideLabels(render, policy);
  verifyXmlTextBoundaries(render, policy);
  verifyUnicodeLength(render, policy);
  verifySchemaArrays(policy);

  // An accepted rotation must change the painted group, not just its metadata.
  for (const kind of ["membrane", "dna", "channel", "receptor", "protein", "antibody"] as const) {
    const scene = parseScene({
      canvas: { width: 640, height: 400 },
      nodes: [{ id: "rotor", kind, box: { x: 40, y: 80, width: 120, height: 90 }, label: "", rotate: 0 }],
    }, policy);
    const turned = render(parseScene({ ...scene, nodes: [{ ...scene.nodes[0], rotate: 90 }] }, policy), policy);
    const upright = render(scene, policy);
    assert.notEqual(turned, upright, kind + " ignored an accepted rotation");
    assert.match(turned, /<g id="rotor"[^>]*transform="rotate\(90 /, kind + " lost its rotation transform");
  }

  // A word longer than the line must wrap inside the width, not overflow once.
  const longLines = wrapText("IL6 phosphatidylinositol-3-kinase", { sizePt: 8, maxWidth: 52 }, policy);
  assert.ok(longLines.length > 1, "an oversized token stayed on one line");
  for (const line of longLines) {
    assert.ok(textWidth(line, 8, policy) <= 52, "wrapped line still overflows: " + line);
  }
  assert.deepEqual(wrapText("\u7ec6\u80de\u56e0\u5b50\u901a\u8def", { sizePt: 8, maxWidth: 16 }, policy), ["\u7ec6\u80de", "\u56e0\u5b50", "\u901a\u8def"]);
  assert.deepEqual(wrapText("\u{1D6FC}".repeat(3), { sizePt: 8, maxWidth: 8 }, policy), ["\u{1D6FC}", "\u{1D6FC}", "\u{1D6FC}"]);
  assert.deepEqual(wrapText(" \t \n ", { sizePt: 8, maxWidth: 52 }, policy), []);
  assert.deepEqual(wrapText("  IL6    IL6  ", { sizePt: 8, maxWidth: 15 }, policy), ["IL6", "IL6"]);

  // Renderer-generated wrapper and derived ids are reserved before input ids.
  const reservedScene = (nodes: unknown[], labels: unknown[] = []): unknown => ({
    canvas: { width: 640, height: 400 },
    nodes,
    labels,
  });
  const shape = { kind: "shape", box: { x: 40, y: 80, width: 60, height: 40 }, label: "" };
  const collisions: Array<[string, unknown]> = [
    ["wrapper id", reservedScene([{ ...shape, id: "objects" }])],
    ["derived object label id", reservedScene([{ ...shape, id: "nx" }, { ...shape, id: "obj-label-nx" }])],
    ["derived scene label id", reservedScene([], [
      { id: "ya", text: "a", x: 10, y: 10 },
      { id: "label-ya", text: "b", x: 10, y: 30 },
    ])],
    ["derived text id", reservedScene([], [
      { id: "za", text: "a", x: 10, y: 10 },
      { id: "text-za", text: "b", x: 10, y: 30 },
    ])],
  ];
  for (const [name, scene] of collisions) {
    assert.throws(() => parseScene(scene, policy), /duplicate id/, name + " collision accepted");
  }

  // The palette in every shipped theme must clear the text-contrast floor.
  for (const theme of ["cobalt", "wabi", "mono"]) {
    const resolved = resolvePalette(policy, theme);
    for (const role of ["ink", "muted"]) {
      const probe = inspectFigure(
        [
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="probe">',
          '<g id="background"><rect x="0" y="0" width="640" height="400" fill="' + (resolved.palette["canvas"] ?? "#FFFFFF") + '"/></g>',
          '<g id="objects"><g id="sample"><rect x="10" y="10" width="200" height="80" fill="' + (resolved.palette["surface"] ?? "#FFFFFF") + '"/></g></g>',
          '<g id="labels"><g id="label-probe"><text x="20" y="60" font-size="8" fill="' + (resolved.palette[role] ?? "#000000") + '"><tspan x="20" dy="0">probe</tspan></text></g></g>',
          "</svg>",
        ].join("\n"),
        policy,
      );
      assert.equal(
        summarise(probe).errors,
        0,
        theme + " " + role + " fails contrast: " + probe.filter((finding) => finding.severity === "error").map((finding) => finding.message).join(" | "),
      );
    }
  }

  // Scene validation must reject the mistakes that make a figure useless.
  const reject: Array<{ name: string; mutate: (value: Record<string, unknown>) => void }> = [
    { name: "unknown theme", mutate: (value) => { value["theme"] = "neon"; } },
    { name: "ratio outside policy", mutate: (value) => { value["canvas"] = { width: 640, height: 120 }; } },
    { name: "short side too small", mutate: (value) => { value["canvas"] = { width: 640, height: 200 }; } },
    {
      name: "dangling arrow port",
      mutate: (value) => {
        const arrows = value["arrows"] as Array<Record<string, unknown>>;
        const first = arrows[0];
        if (first) first["to"] = { node: "missing-node" };
      },
    },
    {
      name: "duplicate node id",
      mutate: (value) => {
        const nodes = value["nodes"] as Array<Record<string, unknown>>;
        const second = nodes[1];
        const first = nodes[0];
        if (first && second) second["id"] = first["id"];
      },
    },
    {
      name: "node below the legibility floor",
      mutate: (value) => {
        const nodes = value["nodes"] as Array<Record<string, unknown>>;
        const first = nodes[0];
        if (first) first["box"] = { x: 20, y: 100, width: 4, height: 4 };
      },
    },
    {
      name: "empty label text",
      mutate: (value) => {
        const labels = value["labels"] as Array<Record<string, unknown>>;
        const first = labels[0];
        if (first) first["text"] = "   ";
      },
    },
    {
      name: "unknown scene field",
      mutate: (value) => {
        value["palette"] = {};
      },
    },
  ];
  const base = JSON.parse(JSON.stringify(fixtures[0]?.scene ?? {})) as Record<string, unknown>;
  for (const probe of reject) {
    const copy = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
    probe.mutate(copy);
    assert.throws(() => parseScene(copy, policy), /.*/, "scene validation accepted: " + probe.name);
  }

  const totals = rendered.map((item) => ({
    name: item.name,
    groups: (item.svg.match(/<g\b/g) ?? []).length,
    texts: (item.svg.match(/<text\b/g) ?? []).length,
    bytes: item.svg.length,
  }));
  console.log(
    "Figure renderer passed: " +
      totals.length +
      " fixtures render clean (" +
      totals.map((item) => item.name + ": " + item.groups + " groups, " + item.texts + " text blocks").join("; ") +
      "), " +
      reject.length +
      " invalid scenes rejected; rotated anchors, explicit ports, circles, XML/Unicode boundaries, schema arrays, wrapping, and every theme pass.",
  );
}
