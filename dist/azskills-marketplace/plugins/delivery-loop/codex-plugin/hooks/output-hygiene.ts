/*
 * Shared detection and wording for leaked reasoning in assistant messages.
 *
 * The Stop guard only sees the final reply, yet a model also leaks reasoning
 * tags into the short progress notes it writes between tool calls. Those notes
 * stream immediately, so the tag is already on screen and cannot be recalled.
 * The UserPromptSubmit hook states the rule before the first message, and the
 * PreToolUse hook repeats a short correction as soon as a leak is recorded, so
 * the rest of the turn stops leaking instead of only the final reply.
 *
 * Wording here never contains a literal reasoning tag: repeating the tag shape
 * in an instruction invites the model to copy it.
 */

import { leadingUnclosedTag, stripAllThinking } from "../../no-think-tags/lib/think-tags.ts";

/** Marks text injected by this plugin so it is never mistaken for a user prompt. */
export const OUTPUT_HYGIENE_PREFIX = "OUTPUT HYGIENE:";

export const OUTPUT_HYGIENE_RULE = [
  OUTPUT_HYGIENE_PREFIX + " every assistant message is user-facing, including short progress notes between tool calls.",
  "Never wrap any part of a message in a reasoning tag, such as a think, thinking, thought, analysis, scratchpad, reflection, or chain-of-thought tag, whether closed or unclosed.",
  "Keep reasoning internal and write the sentence the user should read directly.",
  "A leaked tag is visible immediately and cannot be recalled afterwards, so this rule applies to every message, not only the final answer.",
].join("\n");

/**
 * True when a message carries a raw reasoning block or opens one that never
 * closes. A pair documented inside Markdown code stays out of the way because
 * the closer is only searched outside code.
 */
export function isReasoningLeak(text: string): boolean {
  if (text.trim() === "") return false;
  return stripAllThinking(text) !== text || leadingUnclosedTag(text) !== null;
}

/** True when text is this plugin's own injected rule rather than a user prompt. */
export function isHygieneEcho(text: string): boolean {
  return text.trimStart().startsWith(OUTPUT_HYGIENE_PREFIX);
}

/**
 * The mid-turn nudge. It names no tag and quotes no leaked text, because both
 * would put the reasoning back in front of the user through the correction.
 * `nudgeCount` is how many corrections this turn has now received, so the last
 * allowed one says so instead of implying another is coming.
 */
export function hygieneCorrection(newLeaks: number, nudgeCount: number): string {
  const subject =
    newLeaks === 1
      ? "your last visible message leaked a raw reasoning block"
      : newLeaks + " of your recent visible messages leaked raw reasoning blocks";
  const last = nudgeCount >= 3 ? " This is the last reminder for this turn." : "";
  return [
    OUTPUT_HYGIENE_PREFIX + " " + subject + ", so the tags were shown to the user.",
    "That text cannot be recalled. Write the next message as plain user-facing prose, including any progress note before a tool call, and do not use reasoning tags anywhere in it.",
    "Continue the task without commenting on this reminder." + last,
  ].join("\n");
}
