/*
 * Markers for the plugin's own former output-hygiene text.
 *
 * Earlier releases injected a rule as prompt context. That text can still be
 * replayed into a session, so the prompt reader skips it instead of mistaking it
 * for the user's request. Nothing injects it any more.
 */

/** Marks text injected by this plugin so it is never mistaken for a user prompt. */
export const OUTPUT_HYGIENE_PREFIX = "OUTPUT HYGIENE:";

/** True when text is this plugin's own injected rule rather than a user prompt. */
export function isHygieneEcho(text: string): boolean {
  return text.trimStart().startsWith(OUTPUT_HYGIENE_PREFIX);
}
