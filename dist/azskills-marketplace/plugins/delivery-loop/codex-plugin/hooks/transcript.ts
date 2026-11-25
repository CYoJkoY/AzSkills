/*
 * Reads the tail of a Codex session transcript for the delivery-loop guards.
 *
 * Two facts live only in the transcript: the user prompt that started the
 * current turn, and the tool calls the model already made inside it. The Stop
 * and PreToolUse hooks need both to quote the prompt back and to spot a call
 * that keeps repeating.
 *
 * The reader is deliberately tolerant. Transcript layout is an internal
 * surface, so every field is optional, an unparsable line is skipped, and a
 * missing file returns null rather than throwing. Only the last slice of the
 * file is read because a delivery session can grow to many megabytes.
 */

import { open } from "node:fs/promises";
import { OUTPUT_HYGIENE_PREFIX } from "./output-hygiene.ts";
import { isRecord, MAX_PROMPT_CHARS } from "./session-state.ts";

export interface ToolCallRecord {
  readonly name: string;
  readonly arguments: string;
}

export interface AssistantMessageRecord {
  /** Transcript message id when present, otherwise empty. */
  readonly id: string;
  readonly text: string;
  /** `commentary`, `final`, or empty when the transcript omits it. */
  readonly phase: string;
}

export interface TurnSnapshot {
  /** Last real user prompt found in the tail, or null. */
  readonly prompt: string | null;
  /** Tool calls in the current turn, oldest first. */
  readonly toolCalls: readonly ToolCallRecord[];
  /** Assistant messages in the current turn, oldest first, deduplicated by id. */
  readonly assistantMessages: readonly AssistantMessageRecord[];
}

export interface TranscriptOptions {
  /** Bytes read from the end of the file. Defaults to 2 MiB. */
  readonly maxBytes?: number;
  /** Parsed lines considered, newest kept. Defaults to 6000. */
  readonly maxLines?: number;
}

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_LINES = 6000;
const MAX_ARGUMENT_CHARS = 4000;
const MAX_ASSISTANT_CHARS = 8000;
const MAX_ASSISTANT_MESSAGES = 24;

/** Messages Codex injects around the human prompt; they are not the prompt. */
const SYNTHETIC_PREFIXES = [
  "<environment_context>",
  "<app-context>",
  "<user_instructions>",
  "<permissions",
  "<collaboration",
  "<codex_internal_context",
  "# Codex desktop context",
  OUTPUT_HYGIENE_PREFIX,
];

function textOfContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === "string") {
      parts.push(part);
      continue;
    }
    if (!isRecord(part)) continue;
    const text = part.text;
    if (typeof text === "string") parts.push(text);
  }
  return parts.join("\n");
}

function isSyntheticPrompt(text: string): boolean {
  const trimmed = text.trimStart();
  if (trimmed === "") return true;
  return SYNTHETIC_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

function clipArgument(value: unknown): string {
  if (typeof value === "string") return value.slice(0, MAX_ARGUMENT_CHARS);
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value).slice(0, MAX_ARGUMENT_CHARS);
  } catch {
    return "";
  }
}

function callTurn(payload: Record<string, unknown>): string {
  const metadata = payload.internal_chat_message_metadata_passthrough;
  if (isRecord(metadata) && typeof metadata.turn_id === "string") return metadata.turn_id;
  return typeof payload.turn_id === "string" ? payload.turn_id : "";
}

async function readTail(file: string, maxBytes: number): Promise<string | null> {
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(file, "r");
    const stat = await handle.stat();
    const start = Math.max(0, stat.size - maxBytes);
    const length = stat.size - start;
    if (length <= 0) return "";
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    const text = buffer.toString("utf8");
    // A sliced start lands mid-line; drop the partial line.
    if (start > 0) {
      const newline = text.indexOf("\n");
      return newline === -1 ? "" : text.slice(newline + 1);
    }
    return text;
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

/**
 * Returns what the tail says about the current turn. Null means the transcript
 * could not be read at all; an empty snapshot means it held nothing useful.
 */
export async function readTurnSnapshot(
  file: string | null,
  turnId: string,
  options: TranscriptOptions = {},
): Promise<TurnSnapshot | null> {
  if (file === null || file === "") return null;
  const text = await readTail(file, options.maxBytes ?? DEFAULT_MAX_BYTES);
  if (text === null) return null;

  const allLines = text.split("\n").filter((line) => line.trim() !== "");
  const lines = allLines.slice(-(options.maxLines ?? DEFAULT_MAX_LINES));

  const toolCalls: ToolCallRecord[] = [];
  const commandCalls: ToolCallRecord[] = [];
  /**
   * Assistant messages are collected with their line index so a tail without
   * turn ids can still be scoped to the newest prompt once the whole tail has
   * been read; the prompt boundary is not final until then.
   */
  const assistantCandidates: { readonly index: number; readonly record: AssistantMessageRecord }[] = [];
  const seenMessages = new Set<string>();
  let prompt: string | null = null;
  /**
   * Index of the newest real user message, or -1 when the tail holds none. Once
   * a transcript stops recording turn ids this boundary is the only way to tell
   * the current turn from earlier ones, so it is used instead of the whole tail.
   */
  let turnStart = -1;

  /** Whether a record belongs to the turn under inspection. */
  const inTurn = (index: number, lineTurn: string): boolean => {
    if (turnId !== "" && lineTurn !== "") return lineTurn === turnId;
    // Without a comparable id the prompt boundary decides; never "all lines",
    // because folding earlier turns in turns a healthy turn into a dead loop.
    return turnStart !== -1 && index >= turnStart;
  };

  /**
   * The same assistant text is recorded twice, once as an event item and once
   * as a response_item with the same id. Either shape alone is enough, so the
   * id deduplicates the pair; the text fallback covers records without an id.
   */
  const pushAssistant = (index: number, id: string, text: string, phase: string): void => {
    const clipped = text.slice(0, MAX_ASSISTANT_CHARS);
    if (clipped.trim() === "") return;
    const key = id !== "" ? "id:" + id : "text:" + phase + "\n" + clipped;
    if (seenMessages.has(key)) return;
    seenMessages.add(key);
    assistantCandidates.push({ index, record: { id, text: clipped, phase } });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isRecord(record)) continue;
    const payload = record.payload;
    if (!isRecord(payload)) continue;

    if (record.type === "response_item") {
      if (payload.type === "function_call") {
        const lineTurn = callTurn(payload);
        if (!inTurn(index, lineTurn)) continue;
        const name = typeof payload.name === "string" ? payload.name : "";
        if (name === "") continue;
        toolCalls.push({ name, arguments: clipArgument(payload.arguments) });
        continue;
      }
      if (payload.type === "message") {
        const lineTurn = callTurn(payload);
        if (payload.role === "user") {
          const text = textOfContent(payload.content);
          if (isSyntheticPrompt(text)) continue;
          if (turnId !== "" && lineTurn !== "" && lineTurn !== turnId) continue;
          prompt = text.slice(0, MAX_PROMPT_CHARS);
          turnStart = index;
        } else if (payload.role === "assistant" && inTurn(index, lineTurn)) {
          pushAssistant(
            index,
            typeof payload.id === "string" ? payload.id : "",
            textOfContent(payload.content),
            typeof payload.phase === "string" ? payload.phase : "",
          );
        }
      }
      continue;
    }

    if (record.type !== "event_msg") continue;
    // Older harnesses emit a bare agent_message event instead of an item_completed
    // carrying an AgentMessage item.
    if (payload.type === "agent_message") {
      const lineTurn = typeof payload.turn_id === "string" ? payload.turn_id : "";
      if (!inTurn(index, lineTurn)) continue;
      const text = typeof payload.message === "string" ? payload.message : textOfContent(payload.content);
      pushAssistant(
        index,
        typeof payload.id === "string" ? payload.id : "",
        text,
        typeof payload.phase === "string" ? payload.phase : "",
      );
      continue;
    }
    if (payload.type !== "item_completed") continue;
    const item = payload.item;
    if (!isRecord(item)) continue;
    const lineTurn = typeof payload.turn_id === "string" ? payload.turn_id : "";

    if (item.type === "UserMessage") {
      const text = textOfContent(item.content);
      if (isSyntheticPrompt(text)) continue;
      if (turnId !== "" && lineTurn !== "" && lineTurn !== turnId) continue;
      prompt = text.slice(0, MAX_PROMPT_CHARS);
      turnStart = index;
      continue;
    }
    if (item.type === "AgentMessage") {
      if (!inTurn(index, lineTurn)) continue;
      pushAssistant(
        index,
        typeof item.id === "string" ? item.id : "",
        textOfContent(item.content),
        typeof item.phase === "string" ? item.phase : "",
      );
      continue;
    }
    if (item.type === "CommandExecution") {
      if (!inTurn(index, lineTurn)) continue;
      const command = Array.isArray(item.parsed_cmd)
        ? item.parsed_cmd.map((entry) => (isRecord(entry) && typeof entry.cmd === "string" ? entry.cmd : "")).join(" ")
        : "";
      commandCalls.push({ name: "command", arguments: clipArgument(command === "" ? item.command : command) });
    }
  }

  // Parsed tool calls are the portable form; command items are a fallback for
  // harnesses that record executions without a function_call entry.
  const chosen = toolCalls.length > 0 ? toolCalls : commandCalls;
  const assistantMessages = assistantCandidates
    .filter((entry) => turnId !== "" || turnStart === -1 || entry.index >= turnStart)
    .slice(-MAX_ASSISTANT_MESSAGES)
    .map((entry) => entry.record);

  return { prompt, toolCalls: chosen, assistantMessages };
}
