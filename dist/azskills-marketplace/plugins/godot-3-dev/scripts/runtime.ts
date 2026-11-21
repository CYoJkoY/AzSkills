import { readFile } from "node:fs/promises";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function errorCode(error: unknown): string | null {
  if (!isRecord(error)) {
    return null;
  }
  return typeof error.code === "string" ? error.code : null;
}

export async function readJson<T>(file: string): Promise<T> {
  // Repository-controlled JSON is validated by the corresponding validator.
  return JSON.parse(await readFile(file, "utf8")) as T;
}
