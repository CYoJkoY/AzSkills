export const FIGURE_ALIASES = ["sciprism-svg", "scientific-figures", "sci-figure"] as const;

export const FIGURE_PHRASES = [
  "scientific figure", "publication figure", "pathway diagram", "mechanism figure",
  "biomedical illustration",
  "科研绘图", "科研配图", "医学绘图", "机制图", "通路图", "科学示意图",
] as const;

export const FIGURE_SUBJECTS = [
  "medical", "medicine", "biomedical", "biology", "biological", "scientific", "research",
  "cell", "cells", "receptor", "signaling", "signalling", "pathway", "protein", "antibody", "dna",
  "heart", "brain", "kidney", "liver", "lung", "tissue", "organ", "anatomy",
  "gene", "virus", "bacteria", "tumour", "tumor", "immune", "synapse", "neuron", "vessel",
  "医学", "科研", "生物", "细胞", "受体", "信号通路", "通路", "蛋白", "抗体", "实验",
  "心脏", "大脑", "肾脏", "肝脏", "肺", "组织", "器官", "解剖",
  "肿瘤", "免疫", "微环境", "突触", "神经", "血管", "心肌", "代谢", "基因",
  "病毒", "细菌", "药物", "疾病", "病理",
] as const;

export const FIGURE_ACTIONS = [
  "draw", "redraw", "illustrate", "make", "create", "generate", "produce",
  "绘图", "画图", "画一", "画个", "画出", "绘制", "重绘", "生成", "制作", "做个", "做一个",
] as const;

export const FIGURE_ARTIFACTS = [
  "figure", "diagram", "schematic", "illustration",
  "图", "示意图", "流程图", "插图",
] as const;

export const FIGURE_INFORMATIONAL = [
  "explain", "describe", "summarize", "summarise", "interpret", "review",
  "解释", "说明", "总结", "解读", "分析",
] as const;

export const FIGURE_DRAWING_REFUSALS = [
  "do not draw", "don't draw", "without drawing", "no drawing",
  "不要绘图", "无需绘图", "不用绘图", "不要画图",
] as const;

export const FIGURE_EDIT_ACTIONS = [
  "draw", "redraw", "illustrate", "diagram",
  "绘图", "画图", "画一", "画个", "绘制", "重绘",
] as const;
export const FIGURE_EDIT_ARTIFACTS = ["figure", "schematic", "illustration"] as const;

export const FIGURE_CONVERSION_ACTIONS = [
  "draw", "redraw", "illustrate", "make", "create", "generate", "produce", "convert", "vectorize", "vectorise", "restore",
  "绘图", "画图", "画一", "画个", "绘制", "重绘", "生成", "制作", "转换", "转为", "矢量化",
] as const;

/**
 * Format phrases name a format, not a deliverable: "Why is this editable SVG so
 * large?" is a format question. They only route with a producing action and a
 * figure to produce.
 */
export const FIGURE_CONVERSION_PHRASES = [
  "editable svg", "image-to-vector", "vector restoration", "vectorize", "vectorise",
  "可编辑svg", "可编辑 SVG", "矢量化",
] as const;

/**
 * A conversion request names a figure to convert. "Convert this PNG with our
 * image-to-vector service" names only a file, so it stays out; "Convert this
 * pathway figure to an editable svg" names the figure and routes.
 */
export const FIGURE_CONVERSION_REFERENCES = [
  "panel", "figure", "diagram", "schematic", "illustration", "pathway", "mechanism",
  "图", "示意图", "流程图", "插图",
] as const;

const phrasePattern = (phrases: readonly string[]): RegExp => new RegExp(
  phrases.map((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    return /[^\x00-\x7f]/.test(phrase) ? escaped : "(?<![\\w-])" + escaped + "(?![\\w-])";
  }).join("|"),
  "i",
);

const namedFigure = phrasePattern([...FIGURE_ALIASES, ...FIGURE_PHRASES]);
const conversionPhrase = phrasePattern(FIGURE_CONVERSION_PHRASES);
const conversionAction = phrasePattern(FIGURE_CONVERSION_ACTIONS);
const conversionReference = phrasePattern(FIGURE_CONVERSION_REFERENCES);
const subject = phrasePattern(FIGURE_SUBJECTS);
const action = phrasePattern(FIGURE_ACTIONS);
const artifact = phrasePattern(FIGURE_ARTIFACTS);
const informational = phrasePattern(FIGURE_INFORMATIONAL);
const drawingRefusal = phrasePattern(FIGURE_DRAWING_REFUSALS);
const editAction = phrasePattern(FIGURE_EDIT_ACTIONS);
const editArtifact = phrasePattern(FIGURE_EDIT_ARTIFACTS);

const sentenceHasIntent = (sentence: string): boolean =>
  subject.test(sentence) && (editAction.test(sentence) || (action.test(sentence) && artifact.test(sentence)));

/**
 * A bare `通路` is a pathway in biology, a circuit in electronics, and a
 * channel in sales. Only the biological sense belongs here, so a qualifying
 * non-biological compound is blanked before subject matching. Blanking keeps
 * a real subject elsewhere in the sentence able to route the request.
 */
const NON_BIOLOGICAL_PATHWAY =
  /(?:电路|线路|油路|气路|水路|营销|渠道|分销|交通|通信|网络|物流|销售|供水|供气|暖通)通路/g;

const withoutNonBiologicalPathway = (prompt: string): string =>
  prompt.replace(NON_BIOLOGICAL_PATHWAY, " ");

const isInformationalOnly = (prompt: string): boolean =>
  informational.test(prompt) && !action.test(prompt);

export function isScientificFigureRequest(prompt: string): boolean {
  if (drawingRefusal.test(prompt)) return false;
  const scope = withoutNonBiologicalPathway(prompt);
  if (isInformationalOnly(scope)) return false;
  if (namedFigure.test(scope)) return true;
  if (conversionPhrase.test(scope) && conversionAction.test(scope) && (conversionReference.test(scope) || subject.test(scope))) {
    return true;
  }
  if (editAction.test(scope) && editArtifact.test(scope)) return true;
  return scope.split(/[\n。！？!?]/).some(sentenceHasIntent);
}
