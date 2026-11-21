/*
 * Detects and strips raw reasoning-tag blocks that leak into a final reply.
 *
 * A block only counts when it opens at the very start of the text (leading
 * whitespace allowed) and closes with its own tag. Closing tags that sit inside
 * Markdown inline code or a fenced block do not terminate a block, so a reply
 * that merely documents the tags is left alone.
 */

export const THINKING_BLOCKS: ReadonlyArray<readonly [string, string]> = [
  ["<think>", "</think>"],
  ["<thinking>", "</thinking>"],
  ["<thought>", "</thought>"],
];

export interface StripResult {
  readonly stripped: boolean;
  readonly text: string;
}

const BACKTICK = String.fromCharCode(96);

/** Returns the index of the first closing tag outside code, or -1. */
export function findClosingTag(haystack: string, closeTag: string): number {
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
    if (haystack.startsWith(closeTag, index)) return index;
    midLine = true;
  }
  return -1;
}

/** Strips every reasoning block that opens the text. */
export function stripLeadingThinking(input: string): StripResult {
  let rest = input;
  let stripped = false;
  for (;;) {
    const leading = /^\s*/.exec(rest);
    const offset = leading === null ? 0 : leading[0].length;
    const body = rest.slice(offset);
    const block = THINKING_BLOCKS.find(([open]) => body.startsWith(open));
    if (block === undefined) break;
    const open = block[0];
    const close = block[1];
    const at = findClosingTag(body.slice(open.length), close);
    if (at < 0) break;
    rest = body.slice(open.length + at + close.length).replace(/^\s+/, "");
    stripped = true;
  }
  return { stripped, text: rest };
}

/** Removes reasoning blocks anywhere in the text, for emptiness checks. */
export function stripAllThinking(input: string): string {
  let rest = input;
  for (;;) {
    const block = THINKING_BLOCKS.find(([open]) => rest.includes(open));
    if (block === undefined) return rest;
    const open = block[0];
    const close = block[1];
    const start = rest.indexOf(open);
    const at = findClosingTag(rest.slice(start + open.length), close);
    if (at < 0) return rest;
    rest = rest.slice(0, start) + rest.slice(start + open.length + at + close.length);
  }
}
