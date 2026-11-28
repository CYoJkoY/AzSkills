/*
 * The editable delivery-loop configuration.
 *
 * `azflow config` changes the ledger configuration without a hand edit of
 * `.azflow/state.json`. Every key it accepts is validated here, so a typo is
 * refused instead of stored. `base` and `remote` stay out of reach because
 * they change what git means, not how the loop behaves.
 */

import { isRecord } from "./state.ts";
import type { FlowConfig } from "./state.ts";

/** Every key `azflow config set` may change; everything else stays CLI-only. */
export const CONFIG_KEYS: readonly string[] = [
  "autonomy",
  "mergeStrategy",
  "maxParallel",
  "reviewThreshold",
  "reviewEngine",
  "leaseTtlMinutes",
  "checks",
  "allowFrameworks",
];

function requireOneOf<T extends string>(key: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error("Config " + key + " must be one of: " + allowed.join(", ") + ".");
  }
  return value as T;
}

function requirePositiveInt(key: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error("Config " + key + " must be a positive integer.");
  }
  return value;
}

function requireThreshold(key: string, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new Error("Config " + key + " must be a number between 0 and 5.");
  }
  return value;
}

function requireStringList(key: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("Config " + key + " must be a list of non-empty strings.");
  }
  return value.map((item: string) => item.trim());
}

/**
 * Applies a patch to a configuration. Unknown keys are refused rather than
 * ignored: a misspelt key must not look like a saved change.
 */
export function applyConfigPatch(config: FlowConfig, patch: unknown): FlowConfig {
  if (!isRecord(patch)) throw new Error("Config patch must be an object.");
  const entries = Object.entries(patch);
  if (entries.length === 0) throw new Error("Config patch is empty; nothing to change.");
  const next: FlowConfig = { ...config };
  for (const [key, value] of entries) {
    switch (key) {
      case "autonomy":
        next.autonomy = requireOneOf(key, value, ["full", "manual"] as const);
        break;
      case "mergeStrategy":
        next.mergeStrategy = requireOneOf(key, value, ["squash", "merge", "rebase"] as const);
        break;
      case "reviewEngine":
        next.reviewEngine = requireOneOf(key, value, ["egm", "self"] as const);
        break;
      case "maxParallel":
        next.maxParallel = requirePositiveInt(key, value);
        break;
      case "leaseTtlMinutes":
        next.leaseTtlMinutes = requirePositiveInt(key, value);
        break;
      case "reviewThreshold":
        next.reviewThreshold = requireThreshold(key, value);
        break;
      case "checks":
        next.checks = requireStringList(key, value);
        break;
      case "allowFrameworks":
        next.allowFrameworks = requireStringList(key, value);
        break;
      default:
        throw new Error(
          "Config key " + key + " is not editable. Editable keys: " + CONFIG_KEYS.join(", ") + ".",
        );
    }
  }
  return next;
}
