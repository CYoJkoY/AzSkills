#!/usr/bin/env node
/*
 * UserPromptSubmit hook for the delivery-loop guards.
 *
 * This is the record keeping half of the prompt-replay feature. The Stop and
 * PreToolUse hooks cannot always recover the original prompt from the session
 * transcript, because a compacted or flooded context may no longer contain it.
 * This hook captures the prompt the moment it arrives and stores a bounded copy
 * in per-session state, so the correction can quote it verbatim later.
 *
 * It also states the output-hygiene rule before the turn's first visible text.
 * A leak in a progress note between tool calls streams immediately, so the Stop
 * hook can only correct the final reply; the earliest useful intervention is
 * context delivered with the prompt itself.
 *
 * It fails open: a malformed payload or a read-only state directory never
 * changes what the user sees, and the rule is still delivered.
 */

import process from "node:process";
import { isGuardEcho } from "./loop-guard.ts";
import { OUTPUT_HYGIENE_RULE, isHygieneEcho } from "./output-hygiene.ts";
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
  if (input === null || input.prompt.trim() === "" || input.sessionId === "") return;
  // A restart re-sends the guard's own block text as a new prompt. Recording it
  // would replace the real request with a copy of the correction, so skip it.
  if (isGuardEcho(input.prompt)) return;
  // This hook's own injected rule can come back as a prompt once the plugin is
  // reinstalled or a session replays its context; recording it would lose the
  // real request and re-inject the rule on every pass.
  if (isHygieneEcho(input.prompt)) return;
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
  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: OUTPUT_HYGIENE_RULE },
    }) + "\n",
  );
}

main().catch(() => undefined);
