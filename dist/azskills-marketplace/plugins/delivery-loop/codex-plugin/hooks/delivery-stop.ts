#!/usr/bin/env node
/*
 * Stop hook for the delivery loop: dead-loop restart plus goal continuation.
 *
 * The Stop event is the moment the model believes the turn is finished. That
 * makes it the right place to catch a turn that just repeated itself: the
 * looped attempt is void, the dialog state is reset in place, and the original
 * prompt is re-sent verbatim with a notice that a dead loop just happened.
 *
 * Nothing here opens a new conversation. The block decision hands the prompt
 * back to the same session so the model can continue with a different approach.
 * The guard fails open and never emits more than its per-turn budgets allow.
 */

import process from "node:process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { classifyReply } from "../../no-think-tags/lib/reply-guard.ts";
import {
  detectReplyLoop,
  detectToolLoop,
  loopRestartReason,
  normalizeReply,
} from "./loop-guard.ts";
import {
  MAX_SAMPLE_CHARS,
  isRecord,
  pruneState,
  withState,
  type DeliveryState,
} from "./session-state.ts";
import { readTurnSnapshot } from "./transcript.ts";
import { advanceGoal, findGoalProject } from "../../delivery-loop/scripts/goal.ts";

interface StopInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly stopHookActive: boolean;
  readonly message: string | null;
  readonly transcriptPath: string | null;
}

const MAX_RESTARTS_PER_TURN = 2;
const BLANK_REPLY = "";

function out(value: unknown): void {
  process.stdout.write(JSON.stringify(value) + "\n");
}

function block(reason: string): void {
  out({ decision: "block", reason });
}

function readInput(raw: unknown): StopInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "Stop") return null;
  const message = raw.last_assistant_message;
  if (message !== null && typeof message !== "string") return null;
  return {
    sessionId: typeof raw.session_id === "string" ? raw.session_id : "",
    turnId: typeof raw.turn_id === "string" ? raw.turn_id : "",
    stopHookActive: raw.stop_hook_active === true,
    message: typeof message === "string" ? message : null,
    transcriptPath: typeof raw.transcript_path === "string" ? raw.transcript_path : null,
  };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Finds the azflow project that owns `start`: a directory carrying either the
 * delivery ledger or a goal file, or the worktree below one.
 *
 * A dead-loop restart voids the whole turn and re-sends the prompt, which is the
 * right repair inside a delivery run and a heavy-handed surprise everywhere
 * else. Ordinary work legitimately reads the same pair of files three times, so
 * the restart is scoped to the projects this plugin is accountable for. Leaked
 * reasoning is left to the model; a blank final reply is recorded everywhere but
 * only counts as a dead loop inside that same scope.
 */
async function findScopeProject(start: string): Promise<string | null> {
  let current = path.resolve(start);
  for (;;) {
    for (const name of ["state.json", "goal.json"]) {
      const found = await stat(path.join(current, ".azflow", name))
        .then(() => true)
        .catch(() => false);
      if (found) return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Records one reply for later repetition checks, keeping the history bounded. */
function appendReply(state: DeliveryState, message: string | null, turnId: string, now: number): DeliveryState {
  if (message === null) return state;
  const isBlank = classifyReply(message) === "blank";
  return {
    ...state,
    replies: [
      ...state.replies.slice(-3),
      {
        sample: isBlank ? BLANK_REPLY : normalizeReply(message).slice(0, MAX_SAMPLE_CHARS),
        at: now,
        turnId,
      },
    ],
  };
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
  if (input === null || input.sessionId === "") return;

  const snapshot = await readTurnSnapshot(input.transcriptPath, input.turnId).catch(() => null);
  const now = Date.now();
  const scope = await findScopeProject(process.cwd()).catch(() => null);
  const restartScope = scope !== null;

  const outcome = await withState(input.sessionId, (stored) => {
    const pruned = pruneState(stored, now);

    // A prompt is quoted only when it belongs to this turn. With a known turn
    // id, another turn's prompt would mislead the model; with no id we cannot
    // tell, so the newest stored prompt is the best available text.
    let prompt: string | null = null;
    if (pruned.prompt !== null && (input.turnId === "" || pruned.prompt.turnId === input.turnId)) {
      prompt = pruned.prompt.text;
    }
    if (prompt === null) prompt = snapshot?.prompt ?? null;

    // An empty record turn id must not act as a wildcard: records from another
    // turn, or from an unknown turn, are not this turn's evidence.
    const sameTurn = (id: string): boolean => input.turnId !== "" && id === input.turnId;
    const stateReplies = pruned.replies.filter((reply) => sameTurn(reply.turnId)).map((reply) => reply.sample);
    if (input.message !== null && input.message.trim() !== "") {
      stateReplies.push(input.message);
    }

    const currentBlank = input.message !== null && classifyReply(input.message) === "blank";
    const lastSameTurnReply = pruned.replies.filter((reply) => sameTurn(reply.turnId)).at(-1);
    const blankFinding =
      restartScope && currentBlank && lastSameTurnReply?.sample === BLANK_REPLY
        ? { period: 1, repeats: 2, signature: "<blank reply>", total: 2 }
        : null;
    const replyLoop = restartScope ? detectReplyLoop(stateReplies) : null;
    const toolLoop = restartScope ? detectToolLoop(snapshot?.toolCalls ?? []) : null;
    const restartsThisTurn = pruned.restarts.filter((restart) => sameTurn(restart.turnId)).length;
    const canRestart = restartsThisTurn < MAX_RESTARTS_PER_TURN;

    const finding = replyLoop ?? toolLoop ?? blankFinding;
    if (finding !== null && canRestart) {
      const kind = replyLoop !== null ? "reply" : toolLoop !== null ? "tool" : "blank";
      const next = appendReply(
        { ...pruned, restarts: [...pruned.restarts, { turnId: input.turnId, at: now }] },
        input.message,
        input.turnId,
        now,
      );
      // Without a turn id the guard cannot bound its own retries, so it records
      // the attempt but lets the stop-hook-active flag end the loop.
      if (input.turnId === "" && input.stopHookActive) return { next, result: null };
      return { next, result: loopRestartReason(finding, kind, prompt) };
    }

    return { next: appendReply(pruned, input.message, input.turnId, now), result: null };
  });

  if (outcome !== null && outcome.stored && outcome.result !== null) {
    block(outcome.result);
    return;
  }

  // A goal run is what gives the loop Goal-mode stamina without Goal mode: the
  // objective, done-when criteria, next step, and budget live on disk, so the
  // turn keeps going and a compacted context is re-grounded from the goal file.
  // A clean stop that would otherwise end the turn is held only while the goal
  // is active and still making measurable progress; it stalls or pauses itself
  // rather than running without bound, and a missing or erroring goal file lets
  // the turn end as usual.
  const project = await findGoalProject(process.cwd()).catch(() => null);
  if (project === null) return;
  // The turn's final message is the only reliable description of why it
  // stopped, so a transient failure can be retried instead of counted as a
  // stall. A complete goal still blocks once, so the model reports it.
  const advance = await advanceGoal(project, Date.now(), { reply: input.message }).catch(() => null);
  if (advance !== null && advance.reason !== null) block(advance.reason);
}

main().catch(() => undefined);
