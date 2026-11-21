#!/usr/bin/env node
/*
 * Stop hook: a reply that opens with a raw reasoning block is not the answer
 * the user asked for. The text is already on screen, so this hook asks for one
 * bounded, clean re-send instead of claiming the block was removed.
 */

import process from "node:process";
import { stripLeadingThinking } from "../lib/think-tags.ts";
import { readCorrections, readStopInput, writeCorrections } from "../lib/hook-runtime.ts";

const MAX_CORRECTIONS = 1;

const REASON = [
  "Your final reply opened with a raw reasoning block (a <think>, <thinking>, or <thought> block).",
  "The user sees those tags as literal text, and the emitted text cannot be recalled.",
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
  if (input.stopHookActive) return;
  if (input.message === null) return;
  const result = stripLeadingThinking(input.message);
  if (!result.stripped) return;
  const state = await readCorrections(input);
  if (state.count >= MAX_CORRECTIONS) return;
  await writeCorrections(input, { count: state.count + 1 });
  process.stdout.write(JSON.stringify({ decision: "block", reason: REASON }) + "\n");
}

await main();
