#!/usr/bin/env node
/*
 * Renderer self-test.
 *
 * Renders every fixture through the real code path and then throws the result
 * back through the checker. A renderer regression and a checker regression
 * therefore cannot cancel each other out: the same document must satisfy both.
 */

import assert from "node:assert/strict";
import { fixtures } from "./figure-fixtures.ts";
import { inspectFigure, summarise } from "./check-figure.ts";
import { type Policy, type Scene, loadPolicy, parseScene, resolvePalette, wrapText, textWidth } from "./figure-model.ts";

/**
 * The renderer is injected rather than imported so the entry script can call the
 * self-test from its own module without a circular dynamic import.
 */
export type Renderer = (scene: Scene, policy: Policy) => string;

const ids = (svg: string): string[] =>
  [...svg.matchAll(/\bid="([^"]+)"/g)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

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
    for (const group of ["background", "panels", "objects", "connectors", "labels"]) {
      if (group === "background") continue;
      const expected = group === "panels" ? scene.panels.length : group === "objects" ? scene.nodes.length : group === "connectors" ? scene.arrows.length : scene.labels.length;
      if (expected > 0) assert.ok(svg.includes('<g id="' + group + '">'), fixture.name + " is missing the " + group + " layer");
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
    for (const node of scene.nodes) {
      if (!node.label) continue;
      const area = node.box.width - policy.layout.labelPadPt * 2;
      const lines = wrapText(node.label, policy.type.labelPt, node.labelPlacement === "inside" ? area : Math.max(node.box.width, 64), policy);
      for (const line of lines) {
        const width = textWidth(line, policy.type.labelPt, policy);
        assert.ok(
          width <= Math.max(node.box.width, 64) * policy.text.maxOverflowRatio,
          fixture.name + " label overflows its box: " + line,
        );
      }
      if (node.labelPlacement === "inside") {
        const height = lines.length * policy.type.labelPt * policy.type.lineHeight;
        assert.ok(
          height <= node.box.height * 1.02,
          fixture.name + " label " + node.id + " needs " + Math.round(height) + "pt of height in a " + node.box.height + "pt box",
        );
      }
    }
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
      " invalid scenes rejected, and every theme clears contrast.",
  );
}
