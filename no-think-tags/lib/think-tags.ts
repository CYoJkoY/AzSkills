/*
 * Detects and strips raw reasoning-tag blocks that leak into a final reply.
 *
 * A block counts when it opens at the very start of the text (leading
 * whitespace allowed). Any reasoning-family closing tag ends it, regardless of
 * which opener began the block and tolerant of internal whitespace. A reply
 * that opens the think tag but closes with the thinking tag - or opens with one
 * family member and closes with another - is still recognized, because the
 * whole family of closing tags terminates the block.
 *
 * A block that opens and never closes still counts: its opening tag is on
 * screen, and nothing after it can be separated from the reasoning. Closing
 * tags that sit inside Markdown inline code or a fenced block do not terminate
 * a block, so a reply that merely documents the tags is left alone.
 *
 * The opener is matched loosely on purpose: case is ignored, inner padding is
 * allowed, and a trailing attribute or extra spaces before the closing bracket
 * still count. Models emit those variants often, and a stricter literal match
 * silently misses the leak.
 */

export const THINKING_BLOCKS: ReadonlyArray<readonly [string, string]> = [
  ["<think>", "</think>"],
  ["<thinking>", "</thinking>"],
  ["<thought>", "</thought>"],
];

/* A reasoning opener, tolerant of case, inner padding, and attributes. */
const OPENER = /<\s*(?:think|thinking|thought)\b[^<>]*>/iy;
const OPENER_ANY = /<\s*(?:think|thinking|thought)\b[^<>]*>/gi;

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
 * Returns the first reasoning-family closing tag (the think, thinking, or
 * thought closer, whitespace-tolerant around both the slash and the name) that
 * sits outside code, or null.
 */
export function findClosingTag(haystack: string): ClosingHit | null {
  const closer = /<\s*\/\s*(?:think|thinking|thought)\s*>/iy;
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
    closer.lastIndex = index;
    const match = closer.exec(haystack);
    if (match !== null) return { index, length: match[0].length };
    midLine = true;
  }
  return null;
}

/** Returns the reasoning opener that begins the text, or null. */
export function openingTagAt(body: string): OpenerHit | null {
  OPENER.lastIndex = 0;
  const match = OPENER.exec(body);
  return match === null ? null : { tag: match[0], length: match[0].length };
}

/** Strips every reasoning block that opens the text. */
export function stripLeadingThinking(input: string): StripResult {
  let rest = input;
  let stripped = false;
  for (;;) {
    const leading = /^\s*/.exec(rest);
    const offset = leading === null ? 0 : leading[0].length;
    const body = rest.slice(offset);
    const open = openingTagAt(body);
    if (open === null) break;
    const hit = findClosingTag(body.slice(open.length));
    if (hit === null) break;
    rest = body.slice(open.length + hit.index + hit.length).replace(/^\s+/, "");
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
  const leading = /^\s*/.exec(input);
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
    const match = OPENER_ANY.exec(rest);
    if (match === null) return rest;
    const start = match.index;
    const hit = findClosingTag(rest.slice(start + match[0].length));
    if (hit === null) return rest;
    rest = rest.slice(0, start) + rest.slice(start + match[0].length + hit.index + hit.length);
  }
}
