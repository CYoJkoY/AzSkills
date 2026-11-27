/*
 * Classifies a final assistant reply for the delivery-loop Stop guard.
 *
 * The guard has to name four different failures. A reply that opens with a raw
 * reasoning block is a leak: the tags are on screen and the text cannot be
 * recalled. A reply that opens a block which never closes is worse, because
 * everything after the opener reads as leaked reasoning. A reply that carries a
 * closed reasoning block further down leaks too, even though the surrounding
 * text is readable. A reply with no visible characters left after its reasoning
 * blocks are removed is blank: the user got nothing to read. Each needs one
 * bounded re-send, but the reason shown to the model differs.
 */

import {
  leadingUnclosedTag,
  stripAllThinking,
  stripLeadingThinking,
  unclosedTagAnywhere,
} from "./think-tags.ts";

export type ReplyVerdict = "clean" | "leading-block" | "unclosed-block" | "leaked-block" | "blank";

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
  if (unclosedTagAnywhere(message) !== null) return "unclosed-block";
  if (stripAllThinking(message) !== message) return "leaked-block";
  return visibleLength(message) === 0 ? "blank" : "clean";
}

/**
 * True when a message carries a raw reasoning block anywhere outside Markdown
 * code. Blank is not a leak: a short progress note can legitimately be empty
 * once a documented tag is removed, and only the final reply owes the user text.
 */
export function isReasoningLeak(message: string): boolean {
  const verdict = classifyReply(message);
  return verdict === "leading-block" || verdict === "unclosed-block" || verdict === "leaked-block";
}

/**
 * The reason for a Stop-time reply correction.
 *
 * It never quotes a literal tag or the leaked text: repeating the tag shape in
 * an instruction invites the model to copy it back into the next message.
 */
export function replyCorrectionReason(verdict: ReplyVerdict): string {
  const head =
    verdict === "blank"
      ? "Your final reply had no visible text: once reasoning blocks were removed, nothing was left for the user to read."
      : verdict === "unclosed-block"
        ? "A visible message opened a raw reasoning block that never closed (a think-, thought-, or reasoning-style tag with no matching closing tag). Everything after the tag reads as leaked reasoning, not as an answer."
        : verdict === "leaked-block"
          ? "A visible message carried a raw reasoning block (a think-, thought-, or reasoning-style tag) partway through. The user sees those tags as literal text, and the emitted text cannot be recalled."
          : "A visible message opened with a raw reasoning block (a think-, thought-, or reasoning-style tag). The user sees those tags as literal text, and the emitted text cannot be recalled.";
  return [
    head,
    "Send the answer again as plain assistant text: no reasoning-tag blocks anywhere in the message,",
    "no preamble about this instruction, and only the content the user asked for.",
  ].join(" ");
}
