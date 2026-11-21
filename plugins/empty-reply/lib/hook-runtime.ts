import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

export interface StopInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly stopHookActive: boolean;
  readonly message: string | null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readStopInput(raw: unknown): StopInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "Stop") return null;
  const message = raw.last_assistant_message;
  if (message !== null && typeof message !== "string") return null;
  return {
    sessionId: typeof raw.session_id === "string" ? raw.session_id : "",
    turnId: typeof raw.turn_id === "string" ? raw.turn_id : "",
    stopHookActive: raw.stop_hook_active === true,
    message: typeof message === "string" ? message : null,
  };
}

function statePath(input: StopInput): string | null {
  const configured = process.env.PLUGIN_DATA;
  const base = typeof configured === "string" && configured.trim() !== "" ? configured : tmpdir();
  const key = createHash("sha256").update(input.sessionId + "\u0000" + input.turnId).digest("hex").slice(0, 32);
  return path.join(base, "azskills-empty-reply", key + ".json");
}

export async function readContinuations(input: StopInput): Promise<number> {
  const file = statePath(input);
  if (file === null) return 0;
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return 0;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed) || typeof parsed.count !== "number" || !Number.isInteger(parsed.count) || parsed.count < 0) return 0;
    return Math.min(parsed.count, 8);
  } catch {
    return 0;
  }
}

export async function writeContinuations(input: StopInput, count: number): Promise<void> {
  const file = statePath(input);
  if (file === null) return;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ count }) + "\n", "utf8");
  } catch {
    // A read-only state directory must never block the turn.
  }
}
