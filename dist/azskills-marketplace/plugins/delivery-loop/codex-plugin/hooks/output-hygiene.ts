/*
 * Shared wording for the reasoning-leak guard.
 *
 * A model leaks reasoning tags into every kind of visible text: the final
 * reply, and also the short progress notes it writes between tool calls. Those
 * notes stream immediately, so the tag is on screen before any hook can act.
 * Three layers therefore work together. The UserPromptSubmit hook states the
 * rule before the first message, the PreToolUse hook repeats a short
 * correction as soon as a leak is recorded mid-turn, and the Stop hook asks
 * for one bounded clean re-send when the final reply still leaks.
 *
 * Wording here never contains a literal reasoning tag and never quotes leaked
 * text: repeating either in an instruction invites the model to copy it back.
 * The marker prefix also lets the prompt reader skip this text, so an injected
 * rule is never mistaken for the user's request.
 */

/** Marks text injected by this plugin so it is never mistaken for a user prompt. */
export const OUTPUT_HYGIENE_PREFIX = "OUTPUT HYGIENE:";

/**
 * The standing rule, injected on every user prompt. It is short because it is
 * paid for on each turn, and it names the tag families as words rather than as
 * literal tags.
 */
export const OUTPUT_HYGIENE_RULE = [
  OUTPUT_HYGIENE_PREFIX + " every assistant message is user-facing, including short progress notes between tool calls.",
  "Never wrap any part of a message in a reasoning tag (a think, thinking, thought, analysis, scratchpad, reflection, or chain-of-thought tag), closed or unclosed.",
  "Keep reasoning internal and write the sentence the user should read directly; a leaked tag is visible immediately and cannot be recalled.",
].join("\n");

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
