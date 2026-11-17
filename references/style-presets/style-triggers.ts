/*
 * Single source of truth for style-preset and loader routing keywords.
 *
 * The hook, the preset catalog, and the validator all read this file so a
 * documented trigger cannot drift away from the phrase that actually routes.
 * Trigger literals stay lowercase and ASCII unless the phrase is genuinely CJK.
 */

export interface PresetTriggerGroup {
  preset: string;
  triggers: readonly string[];
}

/** Phrases that name a maintained preset. Case-insensitive at match time. */
export const PRESET_TRIGGERS: readonly PresetTriggerGroup[] = [
  {
    preset: "wabi-press",
    triggers: ["wabi press", "wabi-press", "paper and ink", "侘寂刊本"],
  },
  {
    preset: "cobalt-kit",
    triggers: [
      "biorender",
      "bio render",
      "bio-render",
      "cobalt kit",
      "cobalt-kit",
      "cobalt preset",
      "lab canvas",
      "research canvas",
    ],
  },
];

/** Phrases about the preset system itself route to the catalog. */
export const CATALOG_TRIGGERS: readonly string[] = [
  "style preset",
  "style presets",
  "style catalog",
  "style-catalog",
  "preset catalog",
  "风格目录", "样式目录", "设计风格", "风格预设", "样式预设",
];

/** Asking verbs required for an English loader request. */
export const LOADER_VERBS: readonly string[] = [
  "add", "show", "use", "need", "want", "design", "style", "build",
  "create", "give", "put", "render", "replace", "swap",
];

/** Unambiguous UI loader nouns; a verb must appear before them. */
export const LOADER_INDICATORS: readonly string[] = [
  "spinner", "loading indicator", "loading animation",
  "progress indicator", "skeleton screen",
];

export const LOADER_STATE_INDICATORS: readonly string[] = ["loading state", "加载状态"];

/** Concrete UI surfaces a loading primitive can sit on. */
export const LOADER_SURFACE_CONTEXT: readonly string[] = [
  "ui", "user interface", "screen", "component", "page", "panel", "dashboard", "modal", "editor", "viewer", "button",
  "dialog", "card", "form", "table", "list", "toolbar", "frontend", "front-end",
  "页面", "仪表盘", "编辑器", "查看器", "按钮", "列表", "面板", "弹窗", "界面", "窗口",
  "对话框", "视图", "组件", "卡片", "表格", "表单", "前端",
];

export const LOADER_VISUAL_CONTEXT: readonly string[] = [
  ...LOADER_SURFACE_CONTEXT,
  "visual", "spinner", "indicator", "animation", "placeholder",
];

/** Bare "loader" needs a UI context, so a bundler loader stays out. */
export const LOADER_NOUNS: readonly string[] = ["loader", "loaders"];

/** Tool names that make a bare "loader" a build-tool task. */
const LOADER_TOOL_CONTEXT: readonly string[] = [
  "webpack", "vite", "esbuild", "rollup", "babel", "bundler", "npm", "yarn", "pnpm", "cargo",
];

/** Phrases that name a non-visual loader, so no UI request can be meant. */
const LOADER_NONVISUAL_CONTEXT: readonly string[] = [
  "module loader", "file loader", "deserialize", "parser", "ast",
  "backend", "database", "schema", "enum", "column", "后端", "数据库", "枚举", "字段",
];

export const LOADER_CODE_CONTEXT: readonly string[] = [...LOADER_TOOL_CONTEXT, ...LOADER_NONVISUAL_CONTEXT];

/**
 * Package names that end in `-loader` belong to a build toolchain, not to a UI.
 * Hyphenated names such as `css-loader`, `sass-loader`, `style-loader`, or
 * `vue-loader` read as a bare loader noun to a word-boundary match, so the
 * hyphenated family is detected by shape instead of by an open-ended list.
 */
export const LOADER_PACKAGE_PATTERN: RegExp = /(?:^|[^\w-])[a-z][\w.]*-loaders?(?![\w-])/i;

/** CJK loader nouns route without an English asking verb. */
export const LOADER_CJK_INDICATORS: readonly string[] = [
  "骨架屏", "加载动画", "加载指示器", "加载指示", "进度加载器", "进度指示器", "菊花图",
];

/**
 * Chinese asking verbs that introduce a loader. The English verb list cannot
 * cover a mixed sentence such as "加一个 spinner", where the verb is Chinese
 * and the noun is not. A bare Chinese "写" stays out: "写一个模块加载器" is a
 * module, not a UI indicator.
 */
const LOADER_CJK_VERBS: readonly string[] = [
  "添加", "加上", "加一个", "加个", "来个", "做一个", "做个", "放一个", "放个",
  "加", "需要", "显示", "展示",
];

/** Unambiguous English indicators that a Chinese asking verb may introduce. */
const LOADER_CJK_VERB_NOUNS: readonly string[] = ["spinners", "spinner", "skeletons", "skeleton"];

/** A named library request, e.g. "use css loaders from css-loaders.com". */
export const LOADER_LIBRARY_TRIGGERS: readonly string[] = ["css loaders", "css-loaders", "css-loaders.com"];

const escapeLiteral = (literal: string): string => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Wrap an ASCII phrase in guards so a longer word cannot smuggle it in:
 * `collab canvas` must not reach `lab canvas`, and `lifestyle preset` must not
 * reach `style preset`. A leading hyphen is excluded too, so a `-loader` package
 * name never reads as a UI noun. CJK phrases carry no word boundaries and stay
 * unwrapped.
 */
const bounded = (literal: string): string =>
  /[^\x00-\x7F]/.test(literal) ? escapeLiteral(literal) : "(?<![\\w-])" + escapeLiteral(literal) + "(?!\\w)";

/** Escape, then bound, then order longest-first so no phrase is shadowed. */
const alternation = (literals: readonly string[]): string =>
  [...literals].sort((left, right) => right.length - left.length).map(bounded).join("|");

const verbThen = (nouns: readonly string[]): string =>
  "(?<![\\w-])(?:" + alternation(LOADER_VERBS) + ")(?![\\w-])[^.\\n]{0,40}?(?:" + alternation(nouns) + ")";

/**
 * A Chinese asking verb carries no word boundary to anchor on, so the span is
 * kept tight: one short gap between the verb and the English indicator keeps
 * "加一个 spinner" routed without letting a long clause reach an unrelated noun.
 */
const cjkVerbThen = (nouns: readonly string[]): string =>
  "(?:" + alternation(LOADER_CJK_VERBS) + ")[^.\\n]{0,12}?(?:" + alternation(nouns) + ")";

/** Every phrase that resolves to a named preset or to the catalog. */
export const STYLE_INTENT_PATTERN: RegExp = new RegExp(
  alternation([
    ...PRESET_TRIGGERS.flatMap((group) => group.triggers),
    ...CATALOG_TRIGGERS,
  ]),
  "i",
);

/** Unambiguous loader requests. */
export const LOADER_STRONG_PATTERN: RegExp = new RegExp(
  [
    verbThen(LOADER_INDICATORS),
    alternation(LOADER_CJK_INDICATORS),
    alternation(LOADER_LIBRARY_TRIGGERS),
  ].join("|"),
  "i",
);

/**
 * A mixed-language request pairs a Chinese asking verb with an English noun, so
 * no English verb guard can reach it. It stays a separate branch because it is
 * also the weakest signal: a sentence that names a toolchain is talking about
 * the spinner a build config owns, and "remove the spinner from the webpack
 * config" must not read as a request to draw one.
 */
const LOADER_MIXED_PATTERN: RegExp = new RegExp(cjkVerbThen(LOADER_CJK_VERB_NOUNS), "i");
const LOADER_TOOL_PATTERN: RegExp = new RegExp(alternation(LOADER_TOOL_CONTEXT), "i");

/**
 * A toolchain name that owns the noun it precedes: "the webpack config", "the
 * Vite plugin". A surface word inside such a container names code, so it cannot
 * promote the mixed branch: "add a spinner entry in the webpack config" edits a
 * file, while "add a spinner to the upload button in this Vite app" renders.
 *
 * A toolchain that modifies a screen is the exception, since the screen suffix
 * turns the compound into UI: "配置面板", "配置页", "配置界面", "配置弹窗".
 * The lookahead states that suffix list once, so `配置项`, `配置文件`, and
 * `配置的组件` stay code without needing an alternative for each of them.
 */
const LOADER_SCREEN_SUFFIX: readonly string[] = [
  "面板", "页面", "界面", "窗口", "弹窗", "对话框", "视图", "页",
];

const LOADER_TOOL_ARTIFACT_PATTERN: RegExp = new RegExp(
  "(?:" + alternation(LOADER_TOOL_CONTEXT) + ")[^.\\n]{0,8}?"
    + "(?:" + alternation(["插件", "源码", "依赖", "构建脚本", "plugin", "plugins"]) + ")"
    + "|(?:" + alternation(LOADER_TOOL_CONTEXT) + ")[^.\\n]{0,8}?"
    + "(?:配置(?!" + alternation(LOADER_SCREEN_SUFFIX) + "))",
  "i",
);

/** A bare loader noun only routes outside a build-tool context. */
export const LOADER_NOUN_PATTERN: RegExp = new RegExp(verbThen(LOADER_NOUNS), "i");
const loaderStatePattern = new RegExp(alternation(LOADER_STATE_INDICATORS), "i");
const loaderVisualPattern = new RegExp(alternation(LOADER_VISUAL_CONTEXT), "i");
const loaderSurfacePattern = new RegExp(alternation(LOADER_SURFACE_CONTEXT), "i");
const skeletonPattern = new RegExp(alternation(["skeleton"]), "i");
export const LOADER_CODE_CONTEXT_PATTERN: RegExp = new RegExp(alternation(LOADER_CODE_CONTEXT), "i");
const loaderNonvisualContextPattern = new RegExp(alternation(LOADER_NONVISUAL_CONTEXT), "i");

/**
 * Temporal subordinators and punctuation end the span in which a non-visual
 * noun can veto a loader request. "Add a spinner while the database query runs"
 * names the wait, not the target, so the spinner still routes; "Add a spinner
 * to the backend job model" names the target and stays a code task.
 *
 * `as` is deliberately absent: it also introduces role phrases, so
 * "use css-loaders as a build plugin" must not split into a loader request.
 * A bare CJK `时` is absent for the same reason: it is part of `实时` and
 * `即时`, so only the longer `的时候` / `的同时` / `期间` forms split.
 */
const LOADER_CLAUSE_BOUNDARY: RegExp = new RegExp(
  [
    alternation([
      "while", "whilst", "whenever", "when", "during", "after", "before", "until", "once",
      "\u7684\u65F6\u5019", "\u7684\u540C\u65F6", "\u540C\u65F6", "\u671F\u95F4",
      "\u4E4B\u540E", "\u4E4B\u524D",
    ]),
    "[,;:!?\\uFF0C\\u3002\\uFF1B\\uFF1A\\u3001\\u2014]",
  ].join("|"),
  "i",
);

/** Split a prompt at subordinate-clause boundaries, keeping empty parts out. */
function splitPromptClauses(prompt: string): readonly string[] {
  return prompt
    .split(LOADER_CLAUSE_BOUNDARY)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);
}

/** True when this single clause asks for a loading primitive. */
function clauseRoutesLoader(clause: string): boolean {
  const visual = loaderVisualPattern.test(clause);
  // An unambiguous indicator on a named surface outranks an incidental word
  // such as "parser" or "column"; a bare indicator does not, so "Add a spinner
  // to the backend job model" stays a code task.
  const cjkVerbNoun = LOADER_MIXED_PATTERN.test(clause);
  const toolArtifact = LOADER_TOOL_ARTIFACT_PATTERN.test(clause);
  const onSurface = loaderSurfacePattern.test(clause);
  const explicitUi = onSurface && LOADER_STRONG_PATTERN.test(clause);
  if (loaderNonvisualContextPattern.test(clause) && !explicitUi) return false;
  if (LOADER_CODE_CONTEXT_PATTERN.test(clause) && !visual) return false;
  if (LOADER_STRONG_PATTERN.test(clause)) return true;
  // The mixed branch is weaker than a named indicator, so it needs a surface
  // that the toolchain does not own: "给上传按钮加个 spinner" renders, while
  // "在 webpack 配置的按钮组件里加个 spinner 配置项" edits a file.
  if (cjkVerbNoun && (!LOADER_TOOL_PATTERN.test(clause) || (onSurface && !toolArtifact))) return true;
  if (!visual) return false;
  if (skeletonPattern.test(clause)) return false;
  if (loaderStatePattern.test(clause)) return true;
  return LOADER_NOUN_PATTERN.test(clause)
    && !LOADER_PACKAGE_PATTERN.test(clause);
}

/** True when the prompt asks for a loading primitive rather than a build loader. */
export function isLoaderRequest(prompt: string): boolean {
  if (clauseRoutesLoader(prompt)) return true;
  // Only a prompt that carries a temporal split earns a per-clause second look,
  // so a straight request keeps the whole-prompt verdict.
  const clauses = splitPromptClauses(prompt);
  if (clauses.length < 2) return false;
  return clauses.some(clauseRoutesLoader);
}
