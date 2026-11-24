#!/usr/bin/env node
/*
 * Stop hook: a reply that opens with a raw reasoning block is not the answer
 * the user asked for. The text is already on screen, so this hook asks for one
 * bounded, clean re-send instead of claiming the block was removed.
 */

import process from "node:process";
import { classifyReply } from "../lib/reply-guard.ts";
import { readCorrections, readStopInput, writeCorrections } from "../lib/hook-runtime.ts";

const MAX_CORRECTIONS = 1;

const CLOSED_REASON = [
  "Your final reply opened with a raw reasoning block (a think-, thought-, or reasoning-style tag).",
  "The user sees those tags as literal text, and the emitted text cannot be recalled.",
  "Send the answer again as plain assistant text: no thinking-tag blocks, no preamble about this instruction,",
  "and only the content the user asked for.",
].join(" ");

const UNCLOSED_REASON = [
  "Your final reply opened with a raw reasoning block that never closed (a think-, thought-, or reasoning-style",
  "tag with no matching closing tag). Everything after the tag reads as leaked reasoning, not as the answer.",
  "Send the answer again as plain assistant text: no thinking-tag blocks, no preamble about this instruction,",
  "and only the content the user asked for.",
].join(" ");

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
  const input = readStopInput(parsed);
  if (input === null) return;
  if (input.message === null) return;
  const verdict = classifyReply(input.message);
  if (verdict !== "leading-block" && verdict !== "unclosed-block") return;
  const reason = verdict === "leading-block" ? CLOSED_REASON : UNCLOSED_REASON;
  const emit = (): void => {
    process.stdout.write(JSON.stringify({ decision: "block", reason }) + "\n");
  };

  // stop_hook_active is shared by every Stop hook in the turn: it says some hook
  // already continued this turn, not that this hook already fired. Honour it only
  // when this hook has no per-turn id to dedupe on, or cannot record one.
  if (input.turnId === "") {
    if (!input.stopHookActive) emit();
    return;
  }
  const state = await readCorrections(input);
  if (state.count >= MAX_CORRECTIONS) return;
  const stored = await writeCorrections(input, { count: state.count + 1 });
  if (!stored && input.stopHookActive) return;
  emit();
}

await main();
