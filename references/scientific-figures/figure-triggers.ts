export const FIGURE_ALIASES = ["sciprism-svg", "scientific-figures", "sci-figure"] as const;

export const FIGURE_PHRASES = [
  "scientific figure", "publication figure", "pathway diagram", "mechanism figure",
  "biomedical illustration", "editable svg", "image-to-vector", "vector restoration",
  "科研绘图", "科研配图", "医学绘图", "机制图", "通路图", "科学示意图", "可编辑svg", "可编辑 SVG",
] as const;

export const FIGURE_SUBJECTS = [
  "medical", "medicine", "biomedical", "biology", "biological", "scientific", "research",
  "cell", "cells", "receptor", "signaling", "signalling", "pathway", "protein", "antibody", "dna",
  "医学", "科研", "生物", "细胞", "受体", "信号通路", "蛋白", "抗体", "实验",
] as const;

export const FIGURE_ACTIONS = [
  "draw", "redraw", "illustrate", "diagram", "schematic", "figure", "illustration",
  "绘图", "画图", "画一", "画个", "绘制", "重绘", "示意图", "流程图", "插图",
] as const;

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

export function isScientificFigureRequest(prompt: string): boolean {
  if (namedFigure.test(prompt)) return true;
  return prompt.split(/[\n。！？!?]/).some((sentence) => subject.test(sentence) && action.test(sentence));
}
