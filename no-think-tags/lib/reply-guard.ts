/*
 * Classifies a final assistant reply for the delivery-loop Stop guard.
 *
 * The guard has to name two different failures. A reply that opens with a raw
 * reasoning block is a leak: the tags are on screen and the text cannot be
 * recalled. A reply with no visible characters left after its reasoning blocks
 * are removed is blank: the user got nothing to read. Both need one bounded
 * re-send, but the reason shown to the model differs.
 */

import { leadingUnclosedTag, stripAllThinking, stripLeadingThinking } from "./think-tags.ts";

export type ReplyVerdict = "clean" | "leading-block" | "unclosed-block" | "blank";

const INVISIBLE = /[\s\u00AD\u200B-\u200D\u2060\uFEFF]/g;

/** Visible characters left after reasoning blocks and invisible marks are removed. */
export function visibleLength(message: string): number {
  return stripAllThinking(message).replace(INVISIBLE, "").length;
}

/** Classifies a reply. A null message carries no verdict because none was emitted. */
export function classifyReply(message: string | null): ReplyVerdict {
  if (message === null) return "clean";
  const leading = stripLeadingThinking(message);
  if (leading.stripped) return "leading-block";
  if (leadingUnclosedTag(message) !== null) return "unclosed-block";
  return visibleLength(message) === 0 ? "blank" : "clean";
}
