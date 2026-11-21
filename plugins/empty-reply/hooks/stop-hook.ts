#!/usr/bin/env node
/*
 * Stop hook: a turn that ends without visible text leaves the user with an
 * empty reply. Ask the model to continue, at most twice per turn.
 */

import process from "node:process";
import { hasVisibleAnswer } from "../lib/empty-reply.ts";
import { readContinuations, readStopInput, writeContinuations } from "../lib/hook-runtime.ts";

const MAX_CONTINUATIONS = 2;

const REASON = [
  "The turn ended without any visible assistant text.",
  "Reasoning or empty output is not an answer.",
  "Continue now and send the actual reply as normal assistant text.",
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
  if (hasVisibleAnswer(input.message)) return;
  const count = await readContinuations(input);
  if (count >= MAX_CONTINUATIONS) return;
  await writeContinuations(input, count + 1);
  process.stdout.write(JSON.stringify({ decision: "block", reason: REASON }) + "\n");
}

await main();
