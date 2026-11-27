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
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { goalCompass, readGoal } from "../../delivery-loop/scripts/goal.ts";
import { readState, worktreesRoot } from "../../delivery-loop/scripts/state.ts";
import { continuityBriefing } from "../../delivery-loop/scripts/continuity.ts";
import { isRecord } from "./session-state.ts";

function out(value: unknown): void {
  process.stdout.write(JSON.stringify(value) + "\n");
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Finds the nearest ancestor that holds an azflow ledger or goal. A worktree
 * under `.azflow/worktrees/<id>` resolves to the project that owns it, so the
 * briefing fires in a task worktree as well as at the project root.
 */
async function findProject(start: string): Promise<string | null> {
  let current = path.resolve(start);
  for (;;) {
    for (const marker of [path.join(".azflow", "state.json"), path.join(".azflow", "goal.json")]) {
      if (await stat(path.join(current, marker)).then(() => true).catch(() => false)) return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Worktree directory names, used to spot one no ledger task owns. */
async function worktreeNames(project: string): Promise<string[]> {
  const entries = await readdir(worktreesRoot(project), { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
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

  const project = await findProject(process.cwd()).catch(() => null);
  if (project === null) return;
  const goal = await readGoal(project).catch(() => null);
  const flow = await readState(project).catch(() => null);
  if (goal === null && flow === null) return;

  const input = {
    goalStatus: goal?.status ?? null,
    tasks: flow?.tasks ?? [],
    worktreeDirectories: await worktreeNames(project).catch(() => [] as string[]),
  };
  const resume = goal === null ? "" : goal.nextStep !== "" ? goal.nextStep : goal.checkpoint?.step ?? "";
  const active = goal !== null && goal.status === "active";
  // A stale lease or an orphan worktree is real drift even mid-run, so an
  // active goal still gets the briefing; only the nudge to complete is left
  // out, because the compass already states whether open work remains.
  const brief = continuityBriefing(input, Date.now(), active ? "" : resume, {
    exclude: active ? ["goal-active-work-done"] : [],
  });

  const blocks: string[] = [];
  if (active && goal !== null) {
    blocks.push(
      [
        "<azflow-goal-run>",
        "An AZFLOW goal run is active in this repository and persists across turns.",
        "Continue toward it without waiting to be re-asked; the goal file is .azflow/goal.json.",
        "",
        goalCompass(goal, flow),
        "",
        "Do the next step now. Record each real step with `azflow goal note`; only run",
        "`azflow goal complete` when every done-when criterion is verified true in the",
        "current repository and ledger.",
        "The run also repairs itself within bounds: a transient failure is retried, a",
        "review just under 4.80 is re-fixed, and a spent budget is extended while work",
        "is still moving. A machine-checkable done-when set completes the goal on its own.",
        "</azflow-goal-run>",
      ].join("\n"),
    );
  }
  if (brief !== null) blocks.push(brief);
  if (blocks.length === 0) return;

  out({ continue: true, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: blocks.join("\n\n") } });
}

main().catch(() => undefined);
