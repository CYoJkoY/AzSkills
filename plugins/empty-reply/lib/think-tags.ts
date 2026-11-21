/*
 * Reasoning-block detection shared by the empty-reply plugin.
 *
 * This is a self-contained copy: catalog plugins never import across plugin
 * boundaries.
 */

export const THINKING_BLOCKS: ReadonlyArray<readonly [string, string]> = [
  ["<think>", "</think>"],
  ["<thinking>", "</thinking>"],
  ["<thought>", "</thought>"],
];

const BACKTICK = String.fromCharCode(96);

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
