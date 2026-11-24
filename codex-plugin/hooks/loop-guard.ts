/*
 * Pure dead-loop detection and loop-break wording for the delivery-loop hooks.
 *
 * A long unattended turn fails in a characteristic way: the model repeats one
 * step instead of advancing. The step is either the same tool call issued again
 * and again, or the same final reply produced again and again. Both waste the
 * whole run, and neither is caught by a review gate because the run never
 * reaches a review.
 *
 * Detection here works on plain strings so it can be unit tested without a
 * transcript. `transcript.ts` supplies the calls, `session-state.ts` supplies
 * the recent replies, and the hook wrappers turn a finding into a block reason.
 */

import { MAX_PROMPT_CHARS } from "./session-state.ts";

export interface CallLike {
  readonly name: string;
  readonly arguments: string;
}

/** A repeating run found at the tail of the sequence. */
export interface LoopFinding {
  /** Length of the repeating unit. */
  readonly period: number;
  /** How many times the unit repeats. */
  readonly repeats: number;
  /** One readable copy of the unit. */
  readonly signature: string;
  /** Total items in the repeating run. */
  readonly total: number;
}

export interface RepeatOptions {
  /** Longest repeating unit considered. Defaults to 4. */
  readonly maxPeriod?: number;
  /** Repeats required for a unit longer than one. Defaults to 4. */
  readonly minRepeats?: number;
  /** Repeats required for a single-item unit, because one call is common. Defaults to 4. */
  readonly minSingleRepeats?: number;
  /** Only the newest items are compared. Defaults to 24. */
  readonly window?: number;
}

export interface ReplyLoopOptions {
  /** Shortest reply that can count as a repeated answer. Defaults to 160. */
  readonly minLength?: number;
  /** Identical consecutive replies needed. Defaults to 3. */
  readonly minRepeats?: number;
  /** Replies are compared on this many leading characters. Defaults to 2000. */
  readonly compareLimit?: number;
}

const DEFAULT_MAX_PERIOD = 4;
/*
 * A multi-step unit has to complete four times before it counts as a loop. Two
 * or three passes over "read A, read B" is ordinary work on a task that touches
 * several files, and calling it a dead loop restarted healthy turns. Four full
 * passages with no varied step in between is repetition no longer producing
 * anything new.
 */
const DEFAULT_MIN_REPEATS = 4;
const DEFAULT_MIN_SINGLE_REPEATS = 4;
const DEFAULT_WINDOW = 24;
const DEFAULT_REPLY_MIN_LENGTH = 160;
const DEFAULT_REPLY_MIN_REPEATS = 3;
const DEFAULT_REPLY_COMPARE_LIMIT = 2000;
const SIGNATURE_LIMIT = 240;
// The same cap session-state.ts stores, so a stored prompt is never truncated a
// second time on the way out; the replay is the text that was actually kept.
const PROMPT_LIMIT = MAX_PROMPT_CHARS;

const BEGIN_PROMPT = "----- BEGIN RESENT PROMPT -----";
const END_PROMPT = "----- END RESENT PROMPT -----";

/**
 * Collapses whitespace runs to a single space, but leaves text inside single or
 * double quotes untouched. Formatting drifts between runs, yet whitespace inside
 * a quoted argument or here-doc body is significant, so normalizing there would
 * make genuinely different commands compare equal.
 */
function collapseUnquoted(text: string): string {
  let result = "";
  let quote: '"' | "'" | null = null;
  let pendingSpace = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? "";
    if (quote !== null) {
      result += char;
      if (char === "\\" && index + 1 < text.length) {
        index += 1;
        result += text[index] ?? "";
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      if (pendingSpace && result !== "") result += " ";
      pendingSpace = false;
      quote = char;
      result += char;
      continue;
    }
    if (char === " " || char === "\t" || char === "\n" || char === "\r" || char === "\f" || char === "\v") {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && result !== "") result += " ";
    pendingSpace = false;
    result += char;
  }
  return result.trim();
}

/**
 * A stable, readable identity for one tool call. Tool names are case-insensitive
 * across harnesses, and argument formatting drifts between runs even when the
 * call is identical, so both sides are collapsed before comparison.
 */
export function normalizeCall(call: CallLike): string {
  const name = call.name.trim().toLowerCase();
  if (name === "") return "";
  const rest = collapseUnquoted(call.arguments);
  return rest === "" ? name : name + " " + rest;
}

/** The same identity rule for an assistant reply. */
export function normalizeReply(text: string): string {
  return collapseUnquoted(text);
}

/**
 * Finds a repeating run that touches the end of the sequence. Only a run at the
 * tail counts: a model that repeats a step and then moves on is not stuck, and
 * the newest items are the ones that show it is stuck now.
 */
export function findRepeatedPattern(items: readonly string[], options: RepeatOptions = {}): LoopFinding | null {
  const maxPeriod = options.maxPeriod ?? DEFAULT_MAX_PERIOD;
  const minRepeats = options.minRepeats ?? DEFAULT_MIN_REPEATS;
  const minSingleRepeats = options.minSingleRepeats ?? DEFAULT_MIN_SINGLE_REPEATS;
  const window = options.window ?? DEFAULT_WINDOW;
  const tail = items.slice(-window);

  for (let period = 1; period <= maxPeriod; period += 1) {
    const repeats = period === 1 ? minSingleRepeats : minRepeats;
    const size = period * repeats;
    if (tail.length < size) continue;
    const run = tail.slice(-size);
    let matches = true;
    for (let index = period; index < size; index += 1) {
      if (run[index] !== run[index % period]) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;
    const signature = run[0] ?? "";
    if (signature === "") continue;
    return { period, repeats, signature, total: size };
  }
  return null;
}

/** Detects a tool call repeated at the end of the current turn. */
export function detectToolLoop(calls: readonly CallLike[], options: RepeatOptions = {}): LoopFinding | null {
  const items: string[] = [];
  for (const call of calls) {
    const key = normalizeCall(call);
    if (key !== "") items.push(key);
  }
  return findRepeatedPattern(items, options);
}

/**
 * Detects the same final reply delivered again and again. A short answer such as
 * "Done." can legitimately repeat, so the check needs a real body of text.
 */
export function detectReplyLoop(replies: readonly string[], options: ReplyLoopOptions = {}): LoopFinding | null {
  const minLength = options.minLength ?? DEFAULT_REPLY_MIN_LENGTH;
  const minRepeats = options.minRepeats ?? DEFAULT_REPLY_MIN_REPEATS;
  const compareLimit = options.compareLimit ?? DEFAULT_REPLY_COMPARE_LIMIT;
  if (replies.length < minRepeats) return null;
  const run = replies.slice(-minRepeats).map((reply) => normalizeReply(reply).slice(0, compareLimit));
  const first = run[0] ?? "";
  if (first.length < minLength) return null;
  if (!run.every((item) => item === first)) return null;
  return { period: 1, repeats: minRepeats, signature: first, total: minRepeats };
}

function clipSignature(text: string): string {
  return text.length <= SIGNATURE_LIMIT ? text : text.slice(0, SIGNATURE_LIMIT) + " ...";
}

/**
 * Quotes the prompt back verbatim so a model whose context was compacted or
 * flooded still knows what it was asked. A missing prompt degrades to a plain
 * instruction rather than an empty block.
 */
export function promptReplay(prompt: string | null, limit: number = PROMPT_LIMIT): string {
  const text = prompt === null ? "" : prompt.trim();
  if (text === "") {
    return [
      BEGIN_PROMPT,
      "The original prompt could not be recovered from this session.",
      "Continue from the current task state and the user's last visible instruction.",
      END_PROMPT,
    ].join("\n");
  }
  const body = text.length <= limit ? text : text.slice(0, limit) + "\n[... prompt truncated ...]";
  return [BEGIN_PROMPT, body, END_PROMPT].join("\n");
}

/** True when a submitted prompt is this guard quoting itself back. */
export function isGuardEcho(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("DEAD LOOP ") || trimmed.includes(BEGIN_PROMPT);
}

function describe(finding: LoopFinding, kind: "tool" | "reply" | "blank"): string {
  if (kind === "tool") {
    return "You issued the same tool call " + finding.repeats + " times in a row: " + clipSignature(finding.signature) + ".";
  }
  if (kind === "blank") {
    return "You produced a blank final reply " + finding.repeats + " times in a row (no visible text once reasoning was removed).";
  }
  return "You produced the same final reply " + finding.repeats + " times in a row.";
}

/**
 * The reason for a Stop-time restart. It says plainly that the attempt is void
 * and that the prompt is being re-sent, because the model must not believe it is
 * continuing a conversation that has moved forward.
 */
export function loopRestartReason(finding: LoopFinding, kind: "tool" | "reply" | "blank", prompt: string | null): string {
  return [
    "DEAD LOOP DETECTED. " + describe(finding, kind),
    "That repetition made no progress, so the looped attempt is void.",
    "The dialog state has been restarted without opening a new conversation: the text below is the user prompt re-sent as a fresh message.",
    "Do not repeat the looped step. Re-read the prompt, check the repository and task state the earlier attempts left behind, and continue with a different approach.",
    promptReplay(prompt),
  ].join("\n");
}

/**
 * The reason for a mid-turn interruption. The tool call is denied, so nothing is
 * executed and the model keeps the state it already built.
 */
export function loopBreakerReason(finding: LoopFinding, kind: "tool" | "reply" | "blank", prompt: string | null): string {
  return [
    "DEAD LOOP INTERRUPTED. " + describe(finding, kind),
    "The call was blocked before it ran, and the looped attempt is void.",
    "The dialog state has been restarted without opening a new conversation: the text below is the user prompt re-sent as a fresh message.",
    "Do not retry the same call. Re-read the prompt, check what the earlier attempts already changed, and continue with a different approach.",
    promptReplay(prompt),
  ].join("\n");
}

export type ReplyProblem = "leading-block" | "unclosed-block" | "blank";

/**
 * The reason for a reply correction. The prompt is repeated for the same reason
 * as above: after a long run the model may not still hold the request, and the
 * correction must not be the only thing it can see.
 */
export function replyCorrectionReason(problem: ReplyProblem, prompt: string | null): string {
  const head =
    problem === "blank"
      ? "Your final reply had no visible text: once reasoning blocks were removed, nothing was left for the user to read."
      : problem === "unclosed-block"
        ? "Your final reply opened with a raw reasoning block that never closed (a think-, thought-, or reasoning-style tag with no matching closing tag). Everything after the tag reads as leaked reasoning, not as the answer."
        : "Your final reply opened with a raw reasoning block (a think-, thought-, or reasoning-style tag). The user sees those tags as literal text, and the emitted text cannot be recalled.";
  return [
    head,
    "Send the answer again as plain assistant text: no thinking-tag blocks, no preamble about this instruction, and only the content the user asked for.",
    "Context may have been compacted, so the prompt you are answering is repeated below.",
    promptReplay(prompt),
  ].join("\n");
}
