#!/usr/bin/env node
/*
 * PreToolUse hook: notices a leaked reasoning block in a visible message before
 * the next tool call runs, and asks for plain prose from that point on.
 *
 * The final reply is not the only visible text. A model also leaks tags into the
 * short progress notes it writes between tool calls, and those notes stream to
 * the user immediately, so the Stop hook is too late for them. This hook reads
 * the turn transcript, finds the visible assistant messages that carry a raw
 * reasoning block, and injects one short correction per new leak.
 *
 * It never blocks a tool call: a leaked message is a wording defect, and
 * interrupting the work would not remove the text already on screen. Each leak
 * is nudged once (by message id, or by a hash of its text), the nudges are
 * budgeted per turn, and any unreadable transcript or read-only state directory
 * leaves the turn untouched.
 */

import process from "node:process";
import { hygieneCorrection } from "../../codex-plugin/hooks/output-hygiene.ts";
import { readTurnSnapshot } from "../../codex-plugin/hooks/transcript.ts";
import { correctionKey, readCorrections, writeCorrections } from "../lib/hook-runtime.ts";
import type { CorrectionState, SessionScope } from "../lib/hook-runtime.ts";
import { isReasoningLeak } from "../lib/reply-guard.ts";

/** Corrections a single turn may receive, so a model that keeps leaking is not nagged forever. */
const MAX_NUDGES = 2;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_LINES = 12000;

interface ToolInput {
  readonly scope: SessionScope;
  readonly transcript: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/** Reads a PreToolUse payload; null when the event is not one this hook handles. */
function readInput(raw: unknown): ToolInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "PreToolUse") return null;
  const sessionId = typeof raw.session_id === "string" ? raw.session_id : "";
  if (sessionId === "") return null;
  const turnId = typeof raw.turn_id === "string" ? raw.turn_id : "";
  const transcript = typeof raw.transcript_path === "string" && raw.transcript_path !== "" ? raw.transcript_path : null;
  return { scope: { sessionId, turnId }, transcript };
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

  // A turn that already spent its nudges must not pay to re-read the transcript
  // on every later tool call. The scope is known up front when the payload
  // carries a turn id; without one the newest prompt is only known after the
  // snapshot is read, so that path reads the state below.
  let state: CorrectionState | null = null;
  if (input.scope.turnId !== "") {
    state = await readCorrections(input.scope, "midturn");
    if (state.count >= MAX_NUDGES) return;
  }

  const snapshot = await readTurnSnapshot(input.transcript, input.scope.turnId, {
    maxBytes: MAX_BYTES,
    maxLines: MAX_LINES,
  });
  if (snapshot === null) return;

  const leaks = snapshot.assistantMessages.filter((message) => isReasoningLeak(message.text));
  if (leaks.length === 0) return;

  // Without a turn id the transcript boundary still scopes the snapshot, so the
  // newest prompt stands in for the turn when the state key is built.
  const scope: SessionScope =
    input.scope.turnId !== "" || snapshot.prompt === null
      ? input.scope
      : { sessionId: input.scope.sessionId, turnId: "prompt:" + correctionKey(snapshot.prompt) };

  state ??= await readCorrections(scope, "midturn");
  if (state.count >= MAX_NUDGES) return;

  const seen = new Set(state.signatures);
  const fresh: string[] = [];
  for (const message of leaks) {
    const signature = message.id !== "" ? "id:" + message.id : "text:" + correctionKey(message.text);
    if (seen.has(signature)) continue;
    seen.add(signature);
    fresh.push(signature);
  }
  if (fresh.length === 0) return;

  const count = state.count + 1;
  const stored = await writeCorrections(
    scope,
    { count, signatures: [...state.signatures, ...fresh] },
    "midturn",
  );
  if (!stored) return;

  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext: hygieneCorrection(fresh.length, count),
      },
    }) + "\n",
  );
}

main().catch(() => undefined);
