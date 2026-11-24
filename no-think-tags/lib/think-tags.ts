/*
 * Detects and strips raw reasoning-tag blocks that leak into a final reply.
 *
 * A block counts when it opens at the very start of the text (leading
 * whitespace allowed). Any reasoning-family closing tag ends it, regardless of
 * which opener began the block and tolerant of internal whitespace. A reply
 * that opens the think tag but closes with the thinking tag - or opens with one
 * family member and closes with another - is still recognized, because the
 * whole family of closing tags terminates the block. A leading orphan closer
 * left by malformed nested blocks is also part of the leak.
 *
 * A block that opens and never closes still counts: its opening tag is on
 * screen, and nothing after it can be separated from the reasoning. Closing
 * tags that sit inside Markdown inline code or a fenced block do not terminate
 * a block, so a reply that merely documents the tags is left alone.
 *
 * The opener is matched loosely on purpose: case is ignored, inner padding is
 * allowed, and a trailing attribute, self-closing form, or extra spaces before
 * the closing bracket still count. Tag names are normalized into words, so
 * prefix, suffix, camel-case, separator, and special-token spellings all count
 * while ordinary prose that merely contains a stem does not.
 */

export const THINKING_BLOCKS: ReadonlyArray<readonly [string, string]> = [
  ["<think>", "</think>"],
  ["<thinking>", "</thinking>"],
  ["<thought>", "</thought>"],
  ["<thoughts>", "</thoughts>"],
  ["<reasoning>", "</reasoning>"],
  ["<reflection>", "</reflection>"],
  ["<analysis>", "</analysis>"],
  ["<scratchpad>", "</scratchpad>"],
  ["<cot>", "</cot>"],
  ["<chain-of-thought>", "</chain-of-thought>"],
  ["<chain_of_thought>", "</chain_of_thought>"],
  ["<inner-thoughts>", "</inner-thoughts>"],
  ["<internal-reasoning>", "</internal-reasoning>"],
];

/*
 * Words, not tag-name literals. Camel case becomes separate words and every
 * non-alphanumeric character separates words, so prefixed, suffixed,
 * camel-case, separator, and special-token spellings all reduce to a reasoning
 * word. Only whole words count: "thoughtful" and "thinkfoo" stay prose.
 * Quoted attribute values may contain a `>`; they are never treated as markup.
 */
const REASONING_WORDS: ReadonlySet<string> = new Set([
  "think",
  "thinking",
  "thought",
  "reason",
  "reasoning",
  "reflection",
  "reflect",
  "analysis",
  "analyze",
  "analyse",
  "scratchpad",
  "cot",
  "deliberation",
  "deliberate",
  "monologue",
  "muse",
  "musing",
  "rumination",
  "ruminate",
  "introspection",
  "introspect",
  "rationale",
]);
const TAG_BODY = /(?:[^<>"']|"[^"]*"|'[^']*')*/;
const TRIVIA_SOURCE = "[\\s\\u00AD\\u200B-\\u200D\\u2060\\uFEFF]*";
const LEADING_TRIVIA = new RegExp("^" + TRIVIA_SOURCE);
const OPENER = new RegExp("^<\\s*(?!/)(" + TAG_BODY.source + ")>", "iy");
const OPENER_ANY = new RegExp("<\\s*(?!/)(" + TAG_BODY.source + ")>", "gi");
const CLOSER = new RegExp("<\\s*\\/\\s*(" + TAG_BODY.source + ")>", "iy");
const LEADING_CLOSER = new RegExp(
  "^" + TRIVIA_SOURCE + "<\\s*\\/\\s*(" + TAG_BODY.source + ")>" + TRIVIA_SOURCE,
  "iy",
);
/*
 * Pipe-wrapped special tokens (llama-style `<|begin_of_thought|>`,
 * `<|end_of_thinking|>`, and the `▁`-spaced formatting) close without a slash.
 * Only a token whose words include both a reasoning word and an explicit end
 * word counts, so configuration tokens such as `<|channel|>` or
 * `<|end_of_text|>` are never treated as a closer.
 */
const PIPE_BODY = "(?:[^<>\"'|｜]|\"[^\"]*\"|'[^']*')*";
const PIPE_CLOSER = new RegExp(
  "<\\s*[|｜]\\s*(" + PIPE_BODY + ")\\s*[|｜]\\s*\\/?\\s*>",
  "iy",
);
const LEADING_PIPE_CLOSER = new RegExp(
  "^" +
    TRIVIA_SOURCE +
    "<\\s*[|｜]\\s*(" +
    PIPE_BODY +
    ")\\s*[|｜]\\s*\\/?\\s*>" +
    TRIVIA_SOURCE,
  "iy",
);
const END_WORDS: ReadonlySet<string> = new Set([
  "end",
  "ends",
  "ending",
  "stop",
  "stops",
  "close",
  "closes",
  "closing",
  "finish",
  "finishes",
  "finished",
  "done",
  "eot",
  "terminate",
  "terminated",
]);

function splitWords(text: string): string[] {
  const cased = text
    .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .toUpperCase();
  return cased
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

/*
 * A tag's name ends at the first whitespace-separated token that carries an
 * attribute. This keeps `class="thinking"` from classifying an unrelated tag,
 * while multiword names and unquoted attributes still read as names.
 * Pipe-wrapped special tokens use their pipes as delimiters instead.
 */
function tagNameBody(body: string): string {
  let text = body.trim();
  if (text.startsWith("!") || text.startsWith("?")) return "";
  if (text.endsWith("/")) text = text.slice(0, -1).trim();
  if (text.startsWith("|") || text.startsWith("｜")) {
    return text.replace(/^[|｜]+/, "").replace(/[|｜]+$/, "");
  }
  if (text.includes("|") || text.includes("｜")) {
    return text
      .replace(/^[^|｜]*[|｜]+/, "")
      .replace(/[|｜]+[^|｜]*$/, "");
  }
  const nameTokens: string[] = [];
  for (const token of text.split(/\s+/)) {
    if (token.includes("=") || token.includes('"') || token.includes("'")) break;
    nameTokens.push(token);
  }
  return nameTokens.join(" ");
}

function isReasoningWord(word: string): boolean {
  if (REASONING_WORDS.has(word)) return true;
  return word.endsWith("s") && REASONING_WORDS.has(word.slice(0, -1));
}

function hasScratchPadPair(words: readonly string[]): boolean {
  for (let index = 0; index + 1 < words.length; index += 1) {
    if (words[index] === "scratch" && words[index + 1] === "pad") return true;
  }
  return false;
}

function isReasoningTagBody(body: string): boolean {
  const name = tagNameBody(body);
  if (name === "") return false;
  const words = splitWords(name);
  return (
    words.some(isReasoningWord) ||
    hasScratchPadPair(words) ||
    isReasoningWord(words.join(""))
  );
}

/*
 * A pipe token closes a block only when it names a reasoning family and an
 * explicit end word. This keeps `<|begin_of_thought|>` from ending a block the
 * moment it opens, while still accepting `<|end_of_thinking|>`.
 */
function isPipeCloserBody(body: string): boolean {
  if (!isReasoningTagBody(body)) return false;
  const words = splitWords(tagNameBody(body));
  return words.some((word) => END_WORDS.has(word));
}

export interface StripResult {
  readonly stripped: boolean;
  readonly text: string;
}

export interface ClosingHit {
  readonly index: number;
  readonly length: number;
}

export interface OpenerHit {
  /** The literal opener text as it appears in the message. */
  readonly tag: string;
  readonly length: number;
}

const BACKTICK = String.fromCharCode(96);

/**
 * Returns the first reasoning-family closing tag that sits outside code, or
 * null. The closer is whitespace-tolerant around the slash and name, accepts
 * malformed suffixes or attributes, and is family-wide so mismatched openers and
 * closers still terminate the block.
 */
export function findClosingTag(haystack: string): ClosingHit | null {
  let span = false;
  let fence = false;
  let midLine = false;
  for (let index = 0; index < haystack.length; index += 1) {
    const char = haystack.charAt(index);
    if (char === "\n") {
      span = false;
      midLine = false;
      continue;
    }
    if (char === BACKTICK) {
      let run = 1;
      while (haystack.charAt(index + run) === BACKTICK) run += 1;
      if (fence) {
        if (run >= 3 && !midLine) fence = false;
      } else if (run >= 3 && !midLine) {
        fence = true;
      } else {
        span = !span;
      }
      index += run - 1;
      midLine = true;
      continue;
    }
    if (fence || span) {
      midLine = true;
      continue;
    }
    CLOSER.lastIndex = index;
    const match = CLOSER.exec(haystack);
    if (match !== null && isReasoningTagBody(match[1] ?? "")) {
      return { index, length: match[0].length };
    }
    PIPE_CLOSER.lastIndex = index;
    const pipe = PIPE_CLOSER.exec(haystack);
    if (pipe !== null && isPipeCloserBody(pipe[1] ?? "")) {
      return { index, length: pipe[0].length };
    }
    midLine = true;
  }
  return null;
}

/** Returns the reasoning opener that begins the text, or null. */
export function openingTagAt(body: string): OpenerHit | null {
  OPENER.lastIndex = 0;
  const match = OPENER.exec(body);
  if (match === null || !isReasoningTagBody(match[1] ?? "")) return null;
  return { tag: match[0], length: match[0].length };
}

/** Removes reasoning-family closing tags that begin the text, if any. */
function stripLeadingOrphanClosers(body: string): string {
  let rest = body;
  for (;;) {
    LEADING_CLOSER.lastIndex = 0;
    const match = LEADING_CLOSER.exec(rest);
    if (match !== null && isReasoningTagBody(match[1] ?? "")) {
      rest = rest.slice(match[0].length);
      continue;
    }
    LEADING_PIPE_CLOSER.lastIndex = 0;
    const pipe = LEADING_PIPE_CLOSER.exec(rest);
    if (pipe === null || !isPipeCloserBody(pipe[1] ?? "")) return rest;
    rest = rest.slice(pipe[0].length);
  }
}

/** Strips every reasoning block that opens the text. */
export function stripLeadingThinking(input: string): StripResult {
  let rest = input;
  let stripped = false;
  const orphanStripped = stripLeadingOrphanClosers(rest);
  if (orphanStripped !== rest) {
    rest = orphanStripped;
    stripped = true;
  }
  for (;;) {
    const leading = LEADING_TRIVIA.exec(rest);
    const offset = leading === null ? 0 : leading[0].length;
    const body = rest.slice(offset);
    const open = openingTagAt(body);
    if (open === null) break;
    const hit = findClosingTag(body.slice(open.length));
    if (hit === null) break;
    rest = stripLeadingOrphanClosers(
      body.slice(open.length + hit.index + hit.length).replace(LEADING_TRIVIA, ""),
    );
    stripped = true;
  }
  return { stripped, text: rest };
}

/**
 * Returns the opening tag when the text begins with a reasoning block whose
 * closing tag never appears outside Markdown code. Such a reply leaks the tag
 * and leaves every following line indistinguishable from reasoning.
 */
export function leadingUnclosedTag(input: string): string | null {
  const leading = LEADING_TRIVIA.exec(input);
  const body = input.slice(leading === null ? 0 : leading[0].length);
  const open = openingTagAt(body);
  if (open === null) return null;
  return findClosingTag(body.slice(open.length)) === null ? open.tag : null;
}

/** Removes reasoning blocks anywhere in the text, for emptiness checks. */
export function stripAllThinking(input: string): string {
  let rest = input;
  for (;;) {
    OPENER_ANY.lastIndex = 0;
    let match: RegExpExecArray | null;
    do {
      match = OPENER_ANY.exec(rest);
    } while (match !== null && !isReasoningTagBody(match[1] ?? ""));
    if (match === null) return rest;
    const start = match.index;
    const hit = findClosingTag(rest.slice(start + match[0].length));
    if (hit === null) return rest;
    rest = rest.slice(0, start) + rest.slice(start + match[0].length + hit.index + hit.length);
  }
}
