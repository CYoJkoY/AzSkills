import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

/** The session and turn a correction budget is scoped to. */
export interface SessionScope {
  readonly sessionId: string;
  readonly turnId: string;
}

export interface StopInput extends SessionScope {
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
  const configured = process.env.PLUGIN_DATA ?? process.env.CLAUDE_PLUGIN_DATA;
  if (typeof configured === "string" && configured.trim() !== "") return configured;
  return tmpdir();
}

/**
 * The correction budget is split by namespace so the mid-turn nudge and the
 * Stop-time re-send never spend each other's allowance.
 */
function statePath(input: SessionScope, namespace: string): string | null {
  const base = stateDirectory();
  if (base === null) return null;
  const key = createHash("sha256")
    .update(namespace + "\u0000" + input.sessionId + "\u0000" + input.turnId)
    .digest("hex")
    .slice(0, 32);
  return path.join(base, "azskills-no-think-tags", key + ".json");
}

/** A stable, short signature for a leaked message, so one leak is nudged once. */
export function correctionKey(text: string): string {
  return createHash("sha256").update(text.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 16);
}

const MAX_SIGNATURES = 40;

export interface CorrectionState {
  readonly count: number;
  readonly signatures: readonly string[];
}

function readSignatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const signatures: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item !== "") signatures.push(item);
  }
  return signatures.slice(-MAX_SIGNATURES);
}

export async function readCorrections(input: SessionScope, namespace = "reply"): Promise<CorrectionState> {
  const file = statePath(input, namespace);
  if (file === null) return { count: 0, signatures: [] };
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return { count: 0, signatures: [] };
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed) || typeof parsed.count !== "number" || !Number.isInteger(parsed.count) || parsed.count < 0) {
      return { count: 0, signatures: [] };
    }
    return { count: Math.min(parsed.count, 8), signatures: readSignatures(parsed.signatures) };
  } catch {
    return { count: 0, signatures: [] };
  }
}

/** Records the correction count. Returns false when the state cannot be stored. */
export async function writeCorrections(
  input: SessionScope,
  state: CorrectionState,
  namespace = "reply",
): Promise<boolean> {
  const file = statePath(input, namespace);
  if (file === null) return false;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify({ count: state.count, signatures: state.signatures.slice(-MAX_SIGNATURES) }) + "\n",
      "utf8",
    );
    return true;
  } catch {
    // A read-only state directory must never block the turn.
    return false;
  }
}
