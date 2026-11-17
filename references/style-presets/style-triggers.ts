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
];

/** Asking verbs required for an English loader request. */
export const LOADER_VERBS: readonly string[] = [
  "add", "show", "use", "need", "want", "design", "style", "build",
  "create", "give", "put", "render", "replace", "swap",
];

/** Unambiguous UI loader nouns; a verb must appear before them. */
export const LOADER_INDICATORS: readonly string[] = [
  "spinner", "loading indicator", "loading animation", "loading state",
  "progress indicator", "skeleton", "skeleton screen",
];

/** Bare "loader" needs a UI context, so a bundler loader stays out. */
export const LOADER_NOUNS: readonly string[] = ["loader", "loaders"];

/** Tool names that make a bare "loader" a build-tool task. */
export const LOADER_CODE_CONTEXT: readonly string[] = [
  "webpack", "vite", "esbuild", "rollup", "babel", "bundler",
  "module loader", "npm", "yarn", "pnpm", "cargo", "yaml loader",
  "json loader", "file loader",
];

/**
 * Package names that end in `-loader` belong to a build toolchain, not to a UI.
 * Hyphenated names such as `css-loader`, `sass-loader`, `style-loader`, or
 * `vue-loader` read as a bare loader noun to a word-boundary match, so the
 * hyphenated family is detected by shape instead of by an open-ended list.
 */
export const LOADER_PACKAGE_PATTERN: RegExp = /(?:^|[^\w-])[a-z][\w.]*-loaders?(?![\w-])/i;

/** CJK loader nouns route without an English asking verb. */
export const LOADER_CJK_INDICATORS: readonly string[] = [
  "骨架屏", "加载动画", "加载指示", "加载状态", "菊花图",
];

/** A named library request, e.g. "use css loaders from css-loaders.com". */
export const LOADER_LIBRARY_TRIGGERS: readonly string[] = ["css loaders", "css-loaders.com"];

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

/** A bare loader noun only routes outside a build-tool context. */
export const LOADER_NOUN_PATTERN: RegExp = new RegExp(verbThen(LOADER_NOUNS), "i");
export const LOADER_CODE_CONTEXT_PATTERN: RegExp = new RegExp(
  "\\b(?:" + alternation(LOADER_CODE_CONTEXT) + ")\\b",
  "i",
);

/** True when the prompt asks for a loading primitive rather than a build loader. */
export function isLoaderRequest(prompt: string): boolean {
  if (LOADER_STRONG_PATTERN.test(prompt)) return true;
  if (!LOADER_NOUN_PATTERN.test(prompt)) return false;
  return !LOADER_CODE_CONTEXT_PATTERN.test(prompt) && !LOADER_PACKAGE_PATTERN.test(prompt);
}
