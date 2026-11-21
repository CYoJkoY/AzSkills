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

/** Reads a Stop hook payload, or null when the payload is not usable. */
export function readStopInput(raw: unknown): StopInput | null {
  if (!isRecord(raw)) return null;
  if (raw.hook_event_name !== "Stop") return null;
  const message = raw.last_assistant_message;
  if (message !== null && typeof message !== "string") return null;
  const session = typeof raw.session_id === "string" ? raw.session_id : "";
  const turn = typeof raw.turn_id === "string" ? raw.turn_id : "";
  return {
    sessionId: session,
    turnId: turn,
    stopHookActive: raw.stop_hook_active === true,
    message: typeof message === "string" ? message : null,
  };
}

function stateDirectory(): string | null {
  const configured = process.env.PLUGIN_DATA;
  if (typeof configured === "string" && configured.trim() !== "") return configured;
  return tmpdir();
}

function statePath(input: StopInput): string | null {
  const base = stateDirectory();
  if (base === null) return null;
  const key = createHash("sha256").update(input.sessionId + "\u0000" + input.turnId).digest("hex").slice(0, 32);
  return path.join(base, "azskills-no-think-tags", key + ".json");
}

export interface CorrectionState {
  readonly count: number;
}

export async function readCorrections(input: StopInput): Promise<CorrectionState> {
  const file = statePath(input);
  if (file === null) return { count: 0 };
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return { count: 0 };
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed) || typeof parsed.count !== "number" || !Number.isInteger(parsed.count) || parsed.count < 0) return { count: 0 };
    return { count: Math.min(parsed.count, 8) };
  } catch {
    return { count: 0 };
  }
}

export async function writeCorrections(input: StopInput, state: CorrectionState): Promise<void> {
  const file = statePath(input);
  if (file === null) return;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ count: state.count }) + "\n", "utf8");
  } catch {
    // A read-only state directory must never block the turn.
  }
}
