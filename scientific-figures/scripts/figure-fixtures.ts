/*
 * Fixture scenes for the renderer self-test.
 *
 * Each fixture exercises a different figure family so a regression in one
 * primitive cannot hide behind another's passing render: a receptor pathway, a
 * three-panel experimental workflow, and a text-heavy bilingual legend panel.
 */

/** Ligand-receptor signalling with a nucleus, membrane, and inhibition edge. */
export const pathwayScene = {
  canvas: { width: 720, height: 420, background: "canvas" },
  theme: "cobalt",
  title: "Ligand-induced receptor activation",
  panels: [
    { id: "panel-a", box: { x: 16, y: 56, width: 336, height: 340 }, letter: "A", title: "Extracellular ligand binding", fill: "neutral" },
    { id: "panel-b", box: { x: 368, y: 56, width: 336, height: 340 }, letter: "B", title: "Nuclear response", fill: "neutral" },
  ],
  nodes: [
    { id: "ligand", kind: "protein", box: { x: 60, y: 96, width: 56, height: 56 }, label: "EGF", detail: "", tone: "accent", shape: "circle", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "receptor-egfr", kind: "receptor", box: { x: 168, y: 150, width: 64, height: 76 }, label: "EGFR", detail: "", tone: "accent-2", shape: "rect", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "membrane", kind: "membrane", box: { x: 132, y: 190, width: 260, height: 16 }, label: "", detail: "", tone: "neutral", shape: "rect", stroke: "none", labelPlacement: "inside", rotate: 0 },
    { id: "cell-body", kind: "cell", box: { x: 424, y: 150, width: 200, height: 150 }, label: "HeLa", detail: "24 h", tone: "accent-2", shape: "ellipse", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "nucleus-main", kind: "nucleus", box: { x: 486, y: 190, width: 80, height: 64 }, label: "STAT3", detail: "", tone: "accent", shape: "ellipse", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "readout", kind: "badge", box: { x: 612, y: 96, width: 48, height: 48 }, label: "P", detail: "", tone: "success", shape: "circle", stroke: "solid", labelPlacement: "right", rotate: 0 },
  ],
  arrows: [
    { id: "flow-ligand", from: { node: "ligand", side: "auto" }, to: { node: "receptor-egfr", side: "auto" }, kind: "flow", route: "straight", label: "", tone: "ink", dashed: false },
    { id: "flow-activation", from: { node: "receptor-egfr", side: "auto" }, to: { node: "cell-body", side: "auto" }, kind: "activation", route: "elbow", label: "p-EGFR", tone: "ink", dashed: false },
    { id: "flow-transport", from: { node: "cell-body", side: "auto" }, to: { node: "nucleus-main", side: "auto" }, kind: "transport", route: "straight", label: "", tone: "accent", dashed: false },
    { id: "flow-readout", from: { node: "nucleus-main", side: "auto" }, to: { node: "readout", side: "auto" }, kind: "activation", route: "straight", label: "", tone: "success", dashed: false },
  ],
  labels: [
    { id: "figure-title", text: "Ligand-induced receptor activation", x: 16, y: 34, role: "title", anchor: "start", tone: "ink", maxWidth: 520 },
    { id: "figure-note", text: "n = 3 biological replicates; scale bars 10 um", x: 16, y: 410, role: "note", anchor: "start", tone: "muted", maxWidth: 400 },
  ],
  legend: [
    { id: "legend-accent", label: "Ligand or nuclear signal", kind: "swatch", tone: "accent", dashed: false },
    { id: "legend-accent2", label: "Receptor complex", kind: "swatch", tone: "accent-2", dashed: false },
    { id: "legend-flow", label: "Activation", kind: "arrow", tone: "ink", dashed: false },
  ],
};

/** Three-panel assay workflow with wells, a channel, and a feedback loop. */
export const workflowScene = {
  canvas: { width: 840, height: 340, background: "surface" },
  theme: "wabi",
  title: "Dose-response assay workflow",
  panels: [
    { id: "step-plate", box: { x: 12, y: 48, width: 248, height: 264 }, letter: "A", title: "Seed 96-well plate", fill: "neutral" },
    { id: "step-treat", box: { x: 276, y: 48, width: 248, height: 264 }, letter: "B", title: "Treat 48 h", fill: "neutral" },
    { id: "step-read", box: { x: 540, y: 48, width: 248, height: 264 }, letter: "C", title: "Read absorbance", fill: "neutral" },
  ],
  nodes: [
    { id: "well-1", kind: "well", box: { x: 40, y: 106, width: 40, height: 40 }, label: "", detail: "", tone: "accent", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "well-2", kind: "well", box: { x: 96, y: 106, width: 40, height: 40 }, label: "", detail: "", tone: "accent", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "well-3", kind: "well", box: { x: 152, y: 106, width: 40, height: 40 }, label: "", detail: "", tone: "neutral", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "well-4", kind: "well", box: { x: 40, y: 162, width: 40, height: 40 }, label: "", detail: "", tone: "neutral", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "well-5", kind: "well", box: { x: 96, y: 162, width: 40, height: 40 }, label: "", detail: "", tone: "accent", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "well-6", kind: "well", box: { x: 152, y: 162, width: 40, height: 40 }, label: "", detail: "", tone: "neutral", shape: "circle", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "compound", kind: "protein", box: { x: 330, y: 112, width: 60, height: 60 }, label: "Compound X", detail: "0-100 uM", tone: "accent-2", shape: "circle", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "channel-plate", kind: "channel", box: { x: 452, y: 112, width: 40, height: 72 }, label: "", detail: "", tone: "neutral", shape: "rect", stroke: "none", labelPlacement: "inside", rotate: 0 },
    { id: "plate-reader", kind: "shape", box: { x: 600, y: 110, width: 120, height: 76 }, label: "Plate reader", detail: "450 nm", tone: "neutral", shape: "round", stroke: "solid", labelPlacement: "inside", rotate: 0 },
    { id: "dna-target", kind: "dna", box: { x: 640, y: 214, width: 24, height: 72 }, label: "", detail: "", tone: "accent", shape: "rect", stroke: "none", labelPlacement: "inside", rotate: 0 },
  ],
  arrows: [
    { id: "flow-seed", from: { node: "well-3", side: "auto" }, to: { node: "compound", side: "auto" }, kind: "flow", route: "straight", label: "", tone: "ink", dashed: false },
    { id: "flow-treat", from: { node: "compound", side: "auto" }, to: { node: "channel-plate", side: "auto" }, kind: "conversion", route: "straight", label: "transfer", tone: "ink", dashed: false },
    { id: "flow-read", from: { node: "channel-plate", side: "auto" }, to: { node: "plate-reader", side: "auto" }, kind: "flow", route: "straight", label: "", tone: "ink", dashed: false },
    { id: "flow-inhibit", from: { node: "plate-reader", side: "auto" }, to: { node: "well-2", side: "auto" }, kind: "inhibition", route: "elbow", label: "re-dose", tone: "danger", dashed: true },
  ],
  labels: [
    { id: "figure-title", text: "Dose-response assay workflow", x: 12, y: 30, role: "title", anchor: "start", tone: "ink", maxWidth: 560 },
    { id: "figure-note", text: "Mean of three plates; error bars omitted for clarity", x: 12, y: 328, role: "note", anchor: "start", tone: "muted", maxWidth: 480 },
  ],
  legend: [
    { id: "legend-treated", label: "Treated well", kind: "swatch", tone: "accent", dashed: false },
    { id: "legend-control", label: "Control well", kind: "swatch", tone: "neutral", dashed: false },
    { id: "legend-feedback", label: "Feedback re-dose", kind: "arrow", tone: "danger", dashed: true },
  ],
};

/** CJK-heavy panel that proves wrapping and text roles survive translation. */
export const bilingualScene = {
  canvas: { width: 480, height: 320, background: "canvas" },
  theme: "mono",
  title: "信号通路总览",
  panels: [
    { id: "panel-cjk", box: { x: 16, y: 56, width: 448, height: 228 }, letter: "A", title: "细胞因子刺激后的转录响应", fill: "neutral" },
  ],
  nodes: [
    { id: "cjk-receptor", kind: "receptor", box: { x: 60, y: 150, width: 48, height: 62 }, label: "受体", detail: "IL-6R", tone: "accent", shape: "rect", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "cjk-stat", kind: "protein", box: { x: 220, y: 146, width: 56, height: 56 }, label: "STAT3 二聚体", detail: "", tone: "accent-2", shape: "circle", stroke: "solid", labelPlacement: "below", rotate: 0 },
    { id: "cjk-nucleus", kind: "nucleus", box: { x: 340, y: 140, width: 92, height: 72 }, label: "细胞核", detail: "", tone: "success", shape: "ellipse", stroke: "solid", labelPlacement: "inside", rotate: 0 },
  ],
  arrows: [
    { id: "cjk-flow-1", from: { node: "cjk-receptor", side: "auto" }, to: { node: "cjk-stat", side: "auto" }, kind: "activation", route: "straight", label: "磷酸化", tone: "ink", dashed: false },
    { id: "cjk-flow-2", from: { node: "cjk-stat", side: "auto" }, to: { node: "cjk-nucleus", side: "auto" }, kind: "transport", route: "straight", label: "核转位", tone: "ink", dashed: false },
  ],
  labels: [
    { id: "cjk-title", text: "信号通路总览", x: 16, y: 34, role: "title", anchor: "start", tone: "ink", maxWidth: 320 },
    { id: "cjk-note", text: "每组 n = 3；标尺 10 微米", x: 16, y: 306, role: "note", anchor: "start", tone: "muted", maxWidth: 300 },
  ],
  legend: [
    { id: "cjk-legend-activation", label: "激活", kind: "arrow", tone: "ink", dashed: false },
    { id: "cjk-legend-signal", label: "信号分子", kind: "swatch", tone: "accent-2", dashed: false },
  ],
};

export const fixtures = [
  { name: "pathway", scene: pathwayScene },
  { name: "workflow", scene: workflowScene },
  { name: "bilingual", scene: bilingualScene },
];
