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
  "肿瘤", "免疫", "微环境", "突触", "神经元", "神经系统", "血管", "心肌", "代谢", "基因",
  "病毒", "细菌", "药物", "疾病", "病理",
] as const;

export const FIGURE_ACTIONS = [
  "draw", "redraw", "illustrate", "make", "create", "generate", "produce",
  "绘图", "画图", "画一", "画个", "画出", "绘制", "重绘", "重画", "重新画",
  "生成", "制作", "做个", "做一个",
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
  "不要重画", "无需重画", "不用重画", "不要重绘",
] as const;

/**
 * A supplied figure is usually pointed at rather than named by an organ or a
 * pathway, so a pointing phrase plus a redraw verb is its own signal. The list
 * stays compound: a bare `图` also sits inside `图标`, and a bare `this` names
 * nothing.
 */
export const FIGURE_DEICTIC_REFERENCES = [
  "这张图", "这幅图", "那张图", "那幅图", "此图", "该图",
  "这张插图", "这幅插图", "这张示意图", "这幅示意图",
  "this figure", "this diagram", "this schematic", "this illustration",
] as const;

/** Redraw verbs strong enough to complete a pointing phrase on their own. */
export const FIGURE_REDRAW_ACTIONS = [
  "redraw", "recreate", "re-draw",
  "重新画", "重新绘制", "重绘", "重画",
] as const;

/**
 * A pronoun can point at the supplied figure when the sentence also names the
 * target format: "redraw this as editable svg". It needs both, so "redraw this
 * chart" stays out, and a format request that points at an existing export,
 * such as turning an editable svg into a png, names no redraw verb and also
 * stays out.
 */
export const FIGURE_PRONOUN_REFERENCES = ["this", "it", "these", "它", "它们"] as const;

export const FIGURE_EDIT_ACTIONS = [
  "draw", "redraw", "illustrate", "diagram",
  "绘图", "画图", "画一", "画个", "绘制", "重绘", "重画", "重新画",
] as const;
export const FIGURE_EDIT_ARTIFACTS = ["figure", "schematic", "illustration"] as const;

export const FIGURE_CONVERSION_ACTIONS = [
  "draw", "redraw", "illustrate", "make", "create", "generate", "produce",
  "convert", "turn", "vectorize", "vectorise", "restore",
  "绘图", "画图", "画一", "画个", "绘制", "重绘", "重画", "重新画",
  "生成", "制作", "转换", "转为", "转成", "改成", "矢量化",
] as const;

/**
 * Format phrases name a format, not a deliverable: "Why is this editable SVG so
 * large?" is a format question. They only route with a producing action and a
 * figure to produce.
 */
export const FIGURE_CONVERSION_PHRASES = [
  "editable svg", "image-to-vector", "vector restoration", "vectorize", "vectorise",
  "editable vector",
  "可编辑svg", "可编辑 SVG", "可编辑的svg", "可编辑的 SVG",
  "可编辑矢量", "可编辑的矢量", "矢量化", "矢量图",
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
const deicticReference = phrasePattern(FIGURE_DEICTIC_REFERENCES);
const redrawAction = phrasePattern(FIGURE_REDRAW_ACTIONS);
const pronounReference = phrasePattern(FIGURE_PRONOUN_REFERENCES);

const sentenceHasIntent = (sentence: string): boolean =>
  subject.test(sentence) && (editAction.test(sentence) || (action.test(sentence) && artifact.test(sentence)));

/**
 * A bare `通路` is a pathway in biology, a circuit in electronics, and a
 * channel in sales. Only the biological sense belongs here, so a qualifying
 * non-biological compound is blanked before subject matching. Blanking keeps
 * a real subject elsewhere in the sentence able to route the request, so
 * "细胞通信通路" still routes on `细胞`. `通信` is blanked because the bare
 * compound normally means a telecom channel; the biology sense survives only
 * when the sentence names its own subject.
 */
const NON_BIOLOGICAL_PATHWAY =
  /(?:电路|线路|油路|气路|水路|营销|渠道|分销|交通|通信|网络|物流|销售|供水|供气|暖通)通路/g;

const withoutNonBiologicalPathway = (prompt: string): string =>
  prompt.replace(NON_BIOLOGICAL_PATHWAY, " ");

/**
 * `图标` and `图表` begin with the pointing phrase `这张图`, but they name an
 * icon and a chart. Blanking them keeps "把这张图表重新画一下" out of the
 * figure module instead of letting a UI chart or an app icon look like a
 * supplied scientific figure.
 *
 * A chart is only a chart when the compound ends there: `这张图表示...` reads
 * as "the figure shows ...", so the lookahead leaves the verb form alone and
 * "重画这张图表示的信号关系" still reaches the module.
 */
const NON_FIGURE_COMPOUNDS = /(?:图标|图表(?!示))/g;

const isInformationalOnly = (prompt: string): boolean =>
  informational.test(prompt) && !action.test(prompt);

/**
 * An analysis question can name the very act it asks about: "why does redrawing
 * this figure take so long" carries a redraw verb, so the verb alone would send
 * it to the module. It stays a question only when the interrogative and the
 * first drawing verb share one clause, which is what makes the question *about*
 * the drawing act. A comma or any other clause break means the drawing verb
 * answers the complaint instead of naming it, so "why are these arrows such a
 * mess, redraw it" still draws. A request that draws first and explains
 * afterwards keeps its drawing intent, because no interrogative leads it.
 */
const INTERROGATIVE_MARKERS = ["为什么", "为何", "why", "how come"] as const;
const interrogative = phrasePattern(INTERROGATIVE_MARKERS);
const CLAUSE_BREAK = /[,;:!?\uFF0C\u3002\uFF1B\uFF1A\u3001\u2014\n]/;

const analysisLeads = (prompt: string): boolean => {
  const drawing = action.exec(prompt) ?? editAction.exec(prompt);
  if (drawing === null) return false;
  const question = interrogative.exec(prompt);
  if (question === null || question.index > drawing.index) return false;
  const between = prompt.slice(question.index + question[0].length, drawing.index);
  return !CLAUSE_BREAK.test(between);
};

/**
 * A summary can take the drawing act as its topic instead of asking for it:
 * "summarize the process of redrawing this figure" names both a pointing
 * phrase and a redraw verb, so the pointing branch would claim it. It stays
 * analysis only when an explaining verb leads the clause and the drawing verb
 * is followed by a noun about the act itself. "Redraw this figure, then
 * explain the arrows" keeps its drawing intent because the explaining verb
 * comes after the drawing verb.
 */
const FIGURE_PROCESS_NOUNS = [
  "过程", "步骤", "原理", "耗时", "多久", "多长", "时间", "历史", "思路", "代价", "开销",
] as const;
const processNoun = phrasePattern(FIGURE_PROCESS_NOUNS);

/** The rest of the clause, which is how far a topic noun can sit from its verb. */
const clauseTail = (text: string): string => {
  const breakIndex = text.search(CLAUSE_BREAK);
  return breakIndex === -1 ? text : text.slice(0, breakIndex);
};

const narratesDrawing = (prompt: string): boolean => {
  const explaining = informational.exec(prompt);
  if (explaining === null) return false;
  const drawing = action.exec(prompt) ?? editAction.exec(prompt);
  if (drawing === null || drawing.index < explaining.index) return false;
  const between = prompt.slice(explaining.index + explaining[0].length, drawing.index);
  if (CLAUSE_BREAK.test(between)) return false;
  const tail = clauseTail(prompt.slice(drawing.index + drawing[0].length));
  const noun = processNoun.exec(tail);
  if (noun === null) return false;
  const rest = tail.slice(noun.index + noun[0].length);
  if (artifact.test(rest)) return false;
  return !action.test(rest) && !editAction.test(rest);
};

export function isScientificFigureRequest(prompt: string): boolean {
  if (drawingRefusal.test(prompt)) return false;
  const scope = withoutNonBiologicalPathway(prompt).replace(NON_FIGURE_COMPOUNDS, " ");
  if (isInformationalOnly(scope)) return false;
  if (analysisLeads(scope)) return false;
  if (narratesDrawing(scope)) return false;
  if (namedFigure.test(scope)) return true;
  if (conversionPhrase.test(scope) && conversionAction.test(scope) && (conversionReference.test(scope) || subject.test(scope))) {
    return true;
  }
  if (editAction.test(scope) && editArtifact.test(scope)) return true;
  if (deicticReference.test(scope) && redrawAction.test(scope)) return true;
  if (pronounReference.test(scope) && redrawAction.test(scope) && conversionPhrase.test(scope)) return true;
  return scope.split(/[\n。！？!?]/).some(sentenceHasIntent);
}
