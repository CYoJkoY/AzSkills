#!/usr/bin/env node
/*
 * Scientific figure executable layer checks.
 *
 * The scene schema is the input contract, the model must enforce it, and the
 * module must describe the triggers the prompt hook actually routes on. Each
 * check reads one of those sources rather than restating its values, so a
 * schema or trigger edit cannot silently drift away from the parser.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIGURE_ALIASES,
  FIGURE_CONVERSION_PHRASES,
  FIGURE_PHRASES,
  isScientificFigureRequest,
} from "../references/scientific-figures/figure-triggers.ts";
import { loadPolicy, parseScene } from "../scientific-figures/scripts/figure-model.ts";
import { renderScene } from "../scientific-figures/scripts/render-figure.ts";
import { pathwayScene } from "../scientific-figures/scripts/figure-fixtures.ts";

type SceneDocument = Record<string, unknown>;

interface SchemaNode {
  enum?: string[];
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, SchemaNode>;
  $defs?: Record<string, SchemaNode>;
  $ref?: string;
  maximum?: number;
}

interface AliasEntry {
  id: string;
  canonical: string;
  mode: string;
}

interface Registry {
  modules: Array<{ id: string; modes: string[] }>;
  aliases: AliasEntry[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = async (relativePath: string): Promise<string> =>
  (await readFile(path.join(root, relativePath), "utf8")).replace(/\r\n/g, "\n");

const readJson = async <T>(relativePath: string): Promise<T> =>
  JSON.parse(await read(relativePath)) as T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  assert.ok(isRecord(value), label + " must be an object");
  return value;
};

const firstItem = (scene: SceneDocument, key: string): Record<string, unknown> => {
  const value = scene[key];
  assert.ok(Array.isArray(value), "fixture is missing " + key + "[]");
  return asRecord(value[0], key + "[0]");
};

/** Resolve the local `#/$defs/<name>` references the schema uses for shared types. */
const resolveSchema = (schema: SchemaNode, node: SchemaNode | undefined): SchemaNode => {
  if (!node?.$ref) return node ?? {};
  const name = node.$ref.replace("#/$defs/", "");
  return schema.$defs?.[name] ?? {};
};

const enumOf = (schema: SchemaNode, owner: SchemaNode, key: string): string[] =>
  resolveSchema(schema, owner.properties?.[key]).enum ?? [];

const runScript = (name: string, args: string[]): { status: number | null; stdout: string; stderr: string } => {
  const result = spawnSync(process.execPath, [path.join(root, "scientific-figures", "scripts", name), ...args], {
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const policy = loadPolicy();

/** Parse a mutated fixture copy so validation failures stay one assertion away. */
const attempt = (mutate: (scene: SceneDocument) => void): { ok: boolean; message: string } => {
  const scene = JSON.parse(JSON.stringify(pathwayScene)) as SceneDocument;
  mutate(scene);
  try {
    parseScene(scene, policy);
    return { ok: true, message: "" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
};

const expectReject = (label: string, mutate: (scene: SceneDocument) => void): void => {
  const result = attempt(mutate);
  assert.ok(!result.ok, "scene validation accepted " + label);
};

const expectAccept = (label: string, mutate: (scene: SceneDocument) => void): void => {
  const result = attempt(mutate);
  assert.ok(result.ok, label + " was rejected: " + result.message);
};

/** Both self-tests must run the real code path before any static claim is trusted. */
function checkSelfTests(): void {
  for (const [name, marker] of [
    ["render-figure.ts", /Figure renderer passed/],
    ["check-figure.ts", /Figure checker passed/],
    ["check-figure-regression.ts", /Figure checker regressions passed/],
  ] as const) {
    const result = runScript(name, ["--self-test"]);
    assert.equal(result.status, 0, name + " --self-test failed: " + result.stderr);
    assert.match(result.stdout, marker);
  }
}

/** Every schema enum value must parse; anything outside the enum must not. */
function checkEnums(schema: SchemaNode): number {
  const definitions = schema.$defs ?? {};
  const node = definitions["node"] ?? {};
  const arrow = definitions["arrow"] ?? {};
  const port = definitions["port"] ?? {};
  const label = definitions["label"] ?? {};
  const legend = definitions["legendItem"] ?? {};
  const canvas = schema.properties?.["canvas"] ?? {};

  const probes: Array<{ label: string; values: string[]; apply: (scene: SceneDocument, value: string) => void }> = [
    { label: "node.kind", values: enumOf(schema, node, "kind"), apply: (scene, value) => { firstItem(scene, "nodes")["kind"] = value; } },
    { label: "node.tone", values: enumOf(schema, node, "tone"), apply: (scene, value) => { firstItem(scene, "nodes")["tone"] = value; } },
    { label: "node.shape", values: enumOf(schema, node, "shape"), apply: (scene, value) => { firstItem(scene, "nodes")["shape"] = value; } },
    { label: "node.stroke", values: enumOf(schema, node, "stroke"), apply: (scene, value) => { firstItem(scene, "nodes")["stroke"] = value; } },
    { label: "node.labelPlacement", values: enumOf(schema, node, "labelPlacement"), apply: (scene, value) => { firstItem(scene, "nodes")["labelPlacement"] = value; } },
    { label: "arrow.kind", values: enumOf(schema, arrow, "kind"), apply: (scene, value) => { firstItem(scene, "arrows")["kind"] = value; } },
    { label: "arrow.route", values: enumOf(schema, arrow, "route"), apply: (scene, value) => { firstItem(scene, "arrows")["route"] = value; } },
    { label: "port.side", values: enumOf(schema, port, "side"), apply: (scene, value) => { asRecord(firstItem(scene, "arrows")["from"], "arrow.from")["side"] = value; } },
    { label: "label.role", values: enumOf(schema, label, "role"), apply: (scene, value) => { firstItem(scene, "labels")["role"] = value; } },
    { label: "label.anchor", values: enumOf(schema, label, "anchor"), apply: (scene, value) => { firstItem(scene, "labels")["anchor"] = value; } },
    { label: "legendItem.kind", values: enumOf(schema, legend, "kind"), apply: (scene, value) => { firstItem(scene, "legend")["kind"] = value; } },
    { label: "theme", values: enumOf(schema, { properties: schema.properties ?? {} }, "theme"), apply: (scene, value) => { scene["theme"] = value; } },
    { label: "canvas.background", values: enumOf(schema, canvas, "background"), apply: (scene, value) => { asRecord(scene["canvas"], "canvas")["background"] = value; } },
  ];

  for (const probe of probes) {
    assert.ok(probe.values.length > 0, "schema declares no enum for " + probe.label);
    for (const value of probe.values) expectAccept(probe.label + "=" + value, (scene) => probe.apply(scene, value));
    expectReject(probe.label + " outside its enum", (scene) => probe.apply(scene, "schema-drift-probe"));
  }
  return probes.reduce((total, probe) => total + probe.values.length, 0);
}

/** Required fields and closed objects: the parser must reject what the schema rejects. */
function checkRequiredAndClosed(schema: SchemaNode): number {
  const definitions = schema.$defs ?? {};
  const groups: Array<{ def: string; take: (scene: SceneDocument) => Record<string, unknown> }> = [
    { def: "scene", take: (scene) => scene },
    { def: "canvas", take: (scene) => asRecord(scene["canvas"], "canvas") },
    { def: "panel", take: (scene) => firstItem(scene, "panels") },
    { def: "node", take: (scene) => firstItem(scene, "nodes") },
    { def: "arrow", take: (scene) => firstItem(scene, "arrows") },
    { def: "port", take: (scene) => asRecord(firstItem(scene, "arrows")["from"], "arrow.from") },
    { def: "label", take: (scene) => firstItem(scene, "labels") },
    { def: "legendItem", take: (scene) => firstItem(scene, "legend") },
    { def: "box", take: (scene) => asRecord(firstItem(scene, "nodes")["box"], "node.box") },
  ];

  let probes = 0;
  for (const group of groups) {
    // `canvas` is an inline property of the scene, not a shared definition.
    const definition = group.def === "scene" ? schema : group.def === "canvas" ? schema.properties?.["canvas"] ?? {} : definitions[group.def] ?? {};
    assert.equal(definition.additionalProperties, false, group.def + " must declare additionalProperties: false");
    expectReject(group.def + " with an unknown property", (scene) => {
      group.take(scene)["schemaDriftProbe"] = true;
    });
    probes += 1;
    for (const key of definition.required ?? []) {
      expectReject(group.def + " without required " + key, (scene) => {
        delete group.take(scene)[key];
      });
      probes += 1;
    }
  }
  assert.ok(probes >= groups.length + 10, "required-field coverage looks too small: " + probes);

  // Explicit ports are positional pairs: an x without y would silently fall back to a box anchor.
  expectAccept("port with both coordinates", (scene) => {
    Object.assign(asRecord(firstItem(scene, "arrows")["from"], "arrow.from"), { x: 120, y: 80 });
  });
  expectReject("port with only an x coordinate", (scene) => {
    const port = asRecord(firstItem(scene, "arrows")["from"], "arrow.from");
    port["x"] = 120;
    delete port["y"];
  });
  probes += 2;
  return probes;
}

/** The generated example is also the user-facing starting point, so it must stay valid. */
function checkExampleAndCli(): Promise<number> {
  return (async (): Promise<number> => {
    const example = await readJson<unknown>("scientific-figures/references/example.scene.json");
    const svg = renderScene(parseScene(example, policy), policy);
    for (const token of ["<image", "data:", "foreignObject", "<script", "xlink:href", " href="]) {
      assert.ok(!svg.includes(token), "example render emitted forbidden content: " + token);
    }
    assert.match(svg, /<title id="svg-title">/, "example render lost its accessible title");
    assert.match(svg, /role="img"/, "example render lost role=img");

    const temp = await mkdtemp(path.join(os.tmpdir(), "azskills-figure-"));
    try {
      const svgPath = path.join(temp, "example.svg");
      const render = runScript("render-figure.ts", [
        "--scene", path.join(root, "scientific-figures", "references", "example.scene.json"),
        "--out", svgPath,
      ]);
      assert.equal(render.status, 0, "render-figure.ts failed: " + render.stderr);
      await stat(svgPath);
      assert.equal(await readFile(svgPath, "utf8"), svg, "rendering must stay deterministic for one scene");

      const check = runScript("check-figure.ts", ["--svg", svgPath, "--json"]);
      assert.equal(check.status, 0, "check-figure.ts rejected the shipped example: " + check.stdout);
      const report = JSON.parse(check.stdout) as { errors: number; findings: Array<{ rule: string; severity: string }> };
      assert.equal(report.errors, 0, "example report carries errors");
      /*
       * The shipped example is the user-facing starting point, so it has to
       * satisfy every gate the checker advertises. Wrapping by width alone let
       * its own note line exceed the character cap, which is the kind of
       * self-contradiction a reader trusts us not to ship.
       */
      const warnings = report.findings.filter((finding) => finding.severity === "warning");
      assert.deepEqual(warnings, [], "example report carries warnings: " + JSON.stringify(warnings));

      const canvas = asRecord(example, "example scene")["canvas"];
      const width = asRecord(canvas, "example canvas")["width"];
      const height = asRecord(canvas, "example canvas")["height"];
      const matched = runScript("check-figure.ts", ["--svg", svgPath, "--reference", width + "x" + height, "--json"]);
      assert.equal(matched.status, 0, "--reference must accept the figure's own ratio: " + matched.stdout);

      const drifted = runScript("check-figure.ts", ["--svg", svgPath, "--reference", "640x300", "--json"]);
      assert.equal(drifted.status, 1, "--reference must fail a drifted ratio");
      const driftReport = JSON.parse(drifted.stdout) as { findings: Array<{ rule: string; severity: string }> };
      assert.ok(
        driftReport.findings.some((finding) => finding.rule === "canvas" && finding.severity === "error"),
        "--reference drift must be reported as a blocking canvas finding",
      );

      const help = runScript("check-figure.ts", ["--help"]);
      assert.equal(help.status, 0, "check-figure.ts --help failed");
      assert.match(help.stdout, /--reference/, "--help must document the reference ratio flag");

      const pipeline = await read("scientific-figures/references/pipeline.md");
      for (const flag of ["--scene", "--out", "--svg", "--json", "--reference", "--self-test"]) {
        assert.ok(pipeline.includes(flag), "pipeline guide omits " + flag);
      }
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
    return 4;
  })();
}

/** Aliases, phrases, and the module contract describe one routing surface. */
async function checkTriggers(): Promise<number> {
  const registry = await readJson<Registry>("skills.json");
  const module = registry.modules.find((entry) => entry.id === "scientific-figures");
  assert.ok(module, "skills.json is missing the scientific-figures module");
  const declared = registry.aliases
    .filter((alias) => alias.canonical === "scientific-figures")
    .map((alias) => alias.id);
  const moduleIds = new Set(registry.modules.map((entry) => entry.id));
  const routedAliases = FIGURE_ALIASES.filter((alias) => !moduleIds.has(alias));
  assert.deepEqual(
    [...declared].sort(),
    [...routedAliases].sort(),
    "skills.json aliases and the trigger source disagree",
  );

  const contract = await read("references/modules/scientific-figures.md");
  for (const alias of routedAliases) {
    const entry = registry.aliases.find((candidate) => candidate.id === alias);
    assert.ok(entry, "skills.json lost alias " + alias);
    assert.ok(module.modes.includes(entry.mode), alias + " declares an undeclared mode: " + entry.mode);
    assert.ok(contract.includes("`" + alias + "`"), "module contract omits alias " + alias);
  }

  let prompts = 0;
  for (const phrase of FIGURE_PHRASES) {
    assert.ok(isScientificFigureRequest(phrase), "named figure phrase is not routed: " + phrase);
    prompts += 1;
  }
  // A format phrase alone is a format question, not a request to produce one.
  for (const phrase of FIGURE_CONVERSION_PHRASES) {
    assert.ok(!isScientificFigureRequest(phrase), "a bare conversion phrase must not route: " + phrase);
    prompts += 1;
  }
  for (const prompt of [
    "Draw the receptor signaling pathway",
    "Redraw this immunofluorescence panel as editable SVG",
    "Diagram this cell membrane transport mechanism",
    "Redraw this figure",
    "Draw a diagram of the heart",
    "Create a diagram of a cell",
    "Redraw this panel as editable SVG",
    "Convert this pathway figure to an editable svg",
    "Vectorize this mechanism diagram",
    "生成一张细胞示意图",
    "画一个细胞信号通路示意图",
    "帮我把这张机制图重绘成可编辑的矢量图",
  ]) {
    assert.ok(isScientificFigureRequest(prompt), "figure request is not routed: " + prompt);
    prompts += 1;
  }
  for (const prompt of [
    "Explain the cell cycle",
    "Explain this pathway diagram",
    "Create a medical dashboard",
    "Generate a research summary",
    "Create a report about the cell pathway",
    "Animate this svg",
    "Summarize this paper about receptor signaling",
    "帮我解释这张机制图，不要绘图",
    "Draw a product logo",
    "Refactor the loading spinner module",
    "Use the BioRender style for this dashboard",
    "How do I open an editable SVG in Illustrator?",
    "Why is this editable SVG so large?",
    "Convert this PNG with our image-to-vector service",
  ]) {
    assert.ok(!isScientificFigureRequest(prompt), "unrelated request routed as a figure: " + prompt);
    prompts += 1;
  }
  return prompts;
}

/** Files that must stay ASCII; CJK fixtures and trigger phrases live in two named sources. */
async function checkAscii(): Promise<number> {
  const files = [
    "references/modules/scientific-figures.md",
    "scientific-figures/references/figure-scene.schema.json",
    "scientific-figures/references/quality-policy.json",
    "scientific-figures/references/example.scene.json",
    "scientific-figures/references/pipeline.md",
    "scientific-figures/scripts/render-figure.ts",
    "scientific-figures/scripts/check-figure.ts",
    "scientific-figures/scripts/figure-model.ts",
    "scientific-figures/scripts/scene-schema.ts",
    "scientific-figures/scripts/figure-self-test.ts",
    "scientific-figures/scripts/figure-fixtures.ts",
    "scientific-figures/scripts/figure-shape.ts",
    "scientific-figures/scripts/xml-document.ts",
    "scientific-figures/scripts/color-contrast.ts",
    "scientific-figures/scripts/check-figure-regression.ts",
    "references/scientific-figures/figure-triggers.ts",
  ];
  for (const file of files) {
    const text = await read(file);
    const exempt = file === "scientific-figures/scripts/figure-fixtures.ts" || file === "references/scientific-figures/figure-triggers.ts";
    if (exempt) continue;
    assert.ok(!/[^\x00-\x7F]/.test(text), file + " must stay ASCII");
  }
  return files.length;
}

checkSelfTests();
const schema = await readJson<SchemaNode>("scientific-figures/references/figure-scene.schema.json");
const enumProbes = checkEnums(schema);
const contractProbes = checkRequiredAndClosed(schema);
const exampleProbes = await checkExampleAndCli();
const triggerProbes = await checkTriggers();
const asciiFiles = await checkAscii();
console.log(
  "Scientific figure layer passed: " +
    enumProbes + " schema enum values, " +
    contractProbes + " required/closed-object probes, " +
    triggerProbes + " routing prompts, " +
    asciiFiles + " ASCII contracts, " +
    exampleProbes + " example and CLI checks.",
);
