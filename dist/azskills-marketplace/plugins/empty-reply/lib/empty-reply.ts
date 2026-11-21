/*
 * Decides whether a finished turn produced anything the user can read.
 *
 * A reply counts as empty when, after removing reasoning blocks and invisible
 * characters, no visible characters remain.
 */

import { stripAllThinking } from "./think-tags.ts";

const INVISIBLE = /[\s\u00AD\u200B-\u200D\u2060\uFEFF]/g;

export function visibleText(input: string): string {
  return stripAllThinking(input).replace(INVISIBLE, "");
}

export function hasVisibleAnswer(input: string | null): boolean {
  if (input === null) return false;
  return visibleText(input).length > 0;
}
