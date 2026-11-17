export const FIGURE_ALIASES = ["sciprism-svg", "scientific-figures", "sci-figure"] as const;

export const FIGURE_PHRASES = [
  "scientific figure", "publication figure", "pathway diagram", "mechanism figure",
  "biomedical illustration", "editable svg", "image-to-vector", "vector restoration",
  "科研绘图", "科研配图", "医学绘图", "机制图", "通路图", "科学示意图", "可编辑svg", "可编辑 SVG",
] as const;

export const FIGURE_SUBJECTS = [
  "medical", "medicine", "biomedical", "biology", "biological", "scientific", "research",
  "cell", "cells", "receptor", "signaling", "signalling", "pathway", "protein", "antibody", "dna",
  "heart", "brain", "kidney", "liver", "lung", "tissue", "organ", "anatomy",
  "医学", "科研", "生物", "细胞", "受体", "信号通路", "蛋白", "抗体", "实验",
  "心脏", "大脑", "肾脏", "肝脏", "肺", "组织", "器官", "解剖",
] as const;

export const FIGURE_ACTIONS = [
  "draw", "redraw", "illustrate", "make", "create", "generate", "produce",
  "绘图", "画图", "画一", "画个", "绘制", "重绘", "生成", "制作",
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

const phrasePattern = (phrases: readonly string[]): RegExp => new RegExp(
  phrases.map((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    return /[^\x00-\x7f]/.test(phrase) ? escaped : "(?<![\\w-])" + escaped + "(?![\\w-])";
  }).join("|"),
  "i",
);

const namedFigure = phrasePattern([...FIGURE_ALIASES, ...FIGURE_PHRASES]);
const subject = phrasePattern(FIGURE_SUBJECTS);
const action = phrasePattern(FIGURE_ACTIONS);
const artifact = phrasePattern(FIGURE_ARTIFACTS);
const informational = phrasePattern(FIGURE_INFORMATIONAL);
const drawingRefusal = phrasePattern(FIGURE_DRAWING_REFUSALS);
const editAction = phrasePattern(FIGURE_EDIT_ACTIONS);
const editArtifact = phrasePattern(FIGURE_EDIT_ARTIFACTS);

const sentenceHasIntent = (sentence: string): boolean =>
  subject.test(sentence) && (editAction.test(sentence) || (action.test(sentence) && artifact.test(sentence)));

const isInformationalOnly = (prompt: string): boolean =>
  informational.test(prompt) && !action.test(prompt);

export function isScientificFigureRequest(prompt: string): boolean {
  if (drawingRefusal.test(prompt)) return false;
  if (isInformationalOnly(prompt)) return false;
  if (namedFigure.test(prompt)) return true;
  if (editAction.test(prompt) && editArtifact.test(prompt)) return true;
  return prompt.split(/[\n。！？!?]/).some(sentenceHasIntent);
}
