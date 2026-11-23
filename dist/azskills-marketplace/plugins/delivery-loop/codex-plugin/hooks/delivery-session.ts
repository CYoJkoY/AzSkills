#!/usr/bin/env node
/*
 * SessionStart hook for the delivery loop: re-grounds an active goal run.
 *
 * A long run outlives one context window. When the session starts or resumes,
 * the goal file on disk is the authoritative record of the objective, its
 * done-when criteria, the progress made, and the next step. Injecting that
 * compass at session start means a compacted or freshly opened context picks up
 * the goal from disk instead of from memory, so the run keeps moving even when
 * Codex's Goal mode is off.
 *
 * The hook is inert unless a goal file with status `active` resolves from the
 * working directory, and it fails open on any error.
 */

import process from "node:process";
import { findGoalProject, goalCompass, readGoal } from "../../delivery-loop/scripts/goal.ts";
import { readState } from "../../delivery-loop/scripts/state.ts";
import { isRecord } from "./session-state.ts";

function out(value: unknown): void {
  process.stdout.write(JSON.stringify(value) + "\n");
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
  if (!isRecord(parsed) || parsed.hook_event_name !== "SessionStart") return;

  const project = await findGoalProject(process.cwd()).catch(() => null);
  if (project === null) return;
  const goal = await readGoal(project).catch(() => null);
  if (goal === null || goal.status !== "active") return;
  const flow = await readState(project).catch(() => null);

  const context = [
    "<azflow-goal-run>",
    "An AZFLOW goal run is active in this repository and persists across turns.",
    "Continue toward it without waiting to be re-asked; the goal file is .azflow/goal.json.",
    "",
    goalCompass(goal, flow),
    "",
    "Do the next step now. Record each real step with `azflow goal note`; only run",
    "`azflow goal complete` when every done-when criterion is verified true in the",
    "current repository and ledger.",
    "</azflow-goal-run>",
  ].join("\n");

  out({ continue: true, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } });
}

main().catch(() => undefined);
