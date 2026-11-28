/*
 * Unit tests for the editable delivery-loop configuration.
 *
 * `azflow config` is the only supported way to change the ledger
 * configuration, so these assert that a patch touches exactly the keys it
 * names, that the source configuration is never mutated, and that every
 * refusal names the key that was wrong.
 */
import assert from "node:assert/strict";
import { CONFIG_KEYS, applyConfigPatch } from "../scripts/config.ts";
import { DEFAULT_CONFIG } from "../scripts/state.ts";

// Patches change exactly the keys they name.
const patched = applyConfigPatch(DEFAULT_CONFIG, { maxParallel: 5, autonomy: "manual" });
assert.equal(patched.maxParallel, 5);
assert.equal(patched.autonomy, "manual");
assert.equal(patched.mergeStrategy, DEFAULT_CONFIG.mergeStrategy);
assert.equal(DEFAULT_CONFIG.maxParallel, 3, "the source configuration is not mutated");
assert.deepEqual(applyConfigPatch(DEFAULT_CONFIG, { checks: [" npm test "] }).checks, ["npm test"]);
assert.deepEqual(applyConfigPatch(DEFAULT_CONFIG, { allowFrameworks: [] }).allowFrameworks, []);
assert.equal(applyConfigPatch(DEFAULT_CONFIG, { reviewEngine: "self" }).reviewEngine, "self");
assert.equal(applyConfigPatch(DEFAULT_CONFIG, { mergeStrategy: "rebase" }).mergeStrategy, "rebase");
assert.equal(applyConfigPatch(DEFAULT_CONFIG, { leaseTtlMinutes: 15 }).leaseTtlMinutes, 15);
assert.equal(applyConfigPatch(DEFAULT_CONFIG, { reviewThreshold: 4.95 }).reviewThreshold, 4.95);

// Refusals name the offending key and leave the configuration untouched.
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, {}), /empty/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, null), /must be an object/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { base: "develop" }), /not editable/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { remote: "upstream" }), /not editable/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { maxParallel: 0 }), /positive integer/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { maxParallel: 2.5 }), /positive integer/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { autonomy: "sometimes" }), /must be one of/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { mergeStrategy: "fast-forward" }), /must be one of/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { reviewThreshold: 5.5 }), /between 0 and 5/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { checks: [""] }), /non-empty strings/);
assert.throws(() => applyConfigPatch(DEFAULT_CONFIG, { leaseTtlMinutes: -1 }), /positive integer/);

// The advertised key list is exactly the set the patch accepts.
assert.deepEqual([...CONFIG_KEYS].sort(), [
  "allowFrameworks",
  "autonomy",
  "checks",
  "leaseTtlMinutes",
  "maxParallel",
  "mergeStrategy",
  "reviewEngine",
  "reviewThreshold",
]);
for (const key of CONFIG_KEYS) {
  assert.throws(
    () => applyConfigPatch(DEFAULT_CONFIG, { [key]: "not-a-valid-value" }),
    /Config /,
    "every advertised key is validated: " + key,
  );
}

console.log("config.test.ts: all assertions passed");
