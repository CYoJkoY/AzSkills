#!/usr/bin/env node
/*
 * PreToolUse hook that catches leaked reasoning in the progress notes a model
 * writes between tool calls.
 *
 * A progress note streams the moment it is written, so a wrapped reasoning
 * block is already on the user's screen before any Stop hook runs. Waiting for
 * the end of the turn therefore cannot fix it: the text is visible and the
 * remaining work still leaks. This hook runs at the next tool call, reads the
 * current turn's assistant messages from the transcript, and hands the model a
 * short correction before it writes another note.
 *
 * Each leaked message is corrected once, tracked by message id in per-session
 * state, and the turn gets a bounded number of nudges. It stays silent when
 * there is no transcript, no new leak, or no way to store state, because a
 * repeated reminder would cost more than the leak.
 */

import process from "node:process";
import { hygieneCorrection, isReasoningLeak } from "./output-hygiene.ts";
import {
  MAX_HYGIENE_NUDGES,
  MAX_HYGIENE_SIGNATURES,
  fingerprint,
  isRecord,
  pruneState,
  withState,
} from "./session-state.ts";
import { readTurnSnapshot } from "./transcript.ts";

interface HygieneInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly transcriptPath: string | null;
}

/**
 * A long turn interleaves small progress notes with large tool output, so a
 * small tail can hold no assistant message at all: one real 1.7 MB session had
 * none in its last megabyte and sixteen in its last two. Eight megabytes keeps
 * the newest notes in view without a parse cost that matters (two megabytes
 * parse in about fifteen milliseconds).
 */
const MAX_TRANSCRIPT_BYTES = 8 * 1024 * 1024;
const MAX_TRANSCRIPT_LINES = 20000;

function readInput(raw: unknown): HygieneInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "PreToolUse") return null;
  const sessionId = typeof raw.session_id === "string" ? raw.session_id : "";
  if (sessionId === "") return null;
  return {
    sessionId,
    turnId: typeof raw.turn_id === "string" ? raw.turn_id : "",
    transcriptPath: typeof raw.transcript_path === "string" && raw.transcript_path !== "" ? raw.transcript_path : null,
  };
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
  if (input === null || input.transcriptPath === null) return;

  const snapshot = await readTurnSnapshot(input.transcriptPath, input.turnId, {
    maxBytes: MAX_TRANSCRIPT_BYTES,
    maxLines: MAX_TRANSCRIPT_LINES,
  }).catch(() => null);
  if (snapshot === null) return;

  const leaks = snapshot.assistantMessages.filter((message) => isReasoningLeak(message.text));
  if (leaks.length === 0) return;

  const outcome = await withState(input.sessionId, (stored) => {
    const state = pruneState(stored, Date.now());
    // A record from another turn is not this turn's evidence, so it starts fresh.
    const sameTurn =
      state.hygiene !== null && (input.turnId === "" || state.hygiene.turnId === input.turnId);
    const record = sameTurn && state.hygiene !== null
      ? state.hygiene
      : { turnId: input.turnId, signatures: [] as readonly string[], nudges: 0 };

    const seen = new Set(record.signatures);
    const fresh: string[] = [];
    for (const message of leaks) {
      const signature = message.id !== "" ? message.id : fingerprint(message.text);
      if (seen.has(signature)) continue;
      seen.add(signature);
      fresh.push(signature);
    }
    if (fresh.length === 0 || record.nudges >= MAX_HYGIENE_NUDGES) {
      return { next: null, result: null };
    }

    const nudges = record.nudges + 1;
    return {
      next: {
        ...state,
        hygiene: {
          turnId: input.turnId,
          signatures: [...record.signatures, ...fresh].slice(-MAX_HYGIENE_SIGNATURES),
          nudges,
        },
      },
      result: hygieneCorrection(fresh.length, nudges),
    };
  });

  // A state write that could not land would make the same correction repeat on
  // every later tool call, so the hook stays silent rather than nagging.
  if (outcome === null || !outcome.stored || outcome.result === null) return;
  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: outcome.result },
    }) + "\n",
  );
}

main().catch(() => undefined);
