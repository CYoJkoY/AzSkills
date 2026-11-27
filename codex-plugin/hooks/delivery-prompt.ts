#!/usr/bin/env node
/*
 * UserPromptSubmit hook for the delivery-loop guards.
 *
 * Two jobs, both fail-open. First it records the prompt: the Stop hook cannot
 * always recover the original prompt from the transcript, because a compacted
 * or flooded context may no longer contain it, so a dead-loop restart needs a
 * bounded copy taken the moment the prompt arrives. Second it states the
 * reasoning-leak rule before the first assistant message, which is the only
 * point where a rule can be set without reacting to text already on screen.
 */

import process from "node:process";
import { isGuardEcho } from "./loop-guard.ts";
import { isHygieneEcho, OUTPUT_HYGIENE_RULE } from "./output-hygiene.ts";
import { MAX_PROMPT_CHARS, withState } from "./session-state.ts";

interface PromptInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly prompt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readInput(raw: unknown): PromptInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "UserPromptSubmit") return null;
  const prompt = raw.prompt;
  if (typeof prompt !== "string") return null;
  const session = typeof raw.session_id === "string" ? raw.session_id : "";
  const turn = typeof raw.turn_id === "string" ? raw.turn_id : "";
  return { sessionId: session, turnId: turn, prompt };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const raw = await readStdin();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  const input = readInput(parsed);
  if (input === null) return;
  const emitting = (): void => {
    process.stdout.write(
      JSON.stringify({
        continue: true,
        hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: OUTPUT_HYGIENE_RULE },
      }) + "\n",
    );
  };
  // A restart re-sends the guard's own block text as a new prompt. Recording it
  // would replace the real request with a copy of the correction, so skip it.
  if (isGuardEcho(input.prompt)) return;
  // An older installation injected its hygiene rule as context, and a replay can
  // still surface that text as a prompt; recording it would lose the real
  // request, and re-injecting the rule into it would stack copies of itself.
  if (isHygieneEcho(input.prompt)) return;
  if (input.sessionId === "") {
    emitting();
    return;
  }
  if (input.prompt.trim() === "") return;
  await withState(input.sessionId, (state) => ({
    next: {
      ...state,
      prompt: {
        text: input.prompt.slice(0, MAX_PROMPT_CHARS),
        turnId: input.turnId,
        capturedAt: Date.now(),
      },
    },
    result: undefined,
  }));
  emitting();
}

main().catch(() => undefined);
