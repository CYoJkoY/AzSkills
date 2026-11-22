import assert from "node:assert/strict";
import { SCAN_RULE_IDS, mergeFindings, scanDiff, type DiffFile } from "../scripts/scan.ts";

function file(text: string, path = "src/a.ts"): DiffFile {
  return {
    path,
  added: text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line, index) => ({ line: index + 1, text: line })),
  };
}

function ids(files: readonly DiffFile[]): string[] {
  return scanDiff(files).map((finding) => finding.summary).sort();
}

const samples: readonly [string, string][] = [
  ["<<<<<<< HEAD", "Merge conflict marker committed"],
  ["-----BEGIN RSA PRIVATE KEY-----", "Private key material committed"],
  ["const id = 'AKIA1234567890ABCDEF';", "AWS access key id committed"],
  ["const token = 'ghp_" + "a".repeat(36) + "';", "GitHub token committed"],
  ["const key = 'sk-" + "a".repeat(20) + "';", "API key literal committed"],
  ["const value: any = 1;", "Explicit any escape hatch"],
  ["const x = 1; // @ts-ignore", "Type checker suppressed without resolution"],
  ["try {} catch {}", "Empty catch swallows an error"],
  ["debugger;", "Debugger statement committed"],
  ["import * as React from 'react';", "Component framework imported"],
  ["\treturn 1;", "Tab indentation"],
  ["console.log('debug');", "console.log left in code"],
  ["if (a == b) return true;", "Loose equality comparison"],
  ["const x = 1; // eslint-disable-next-line", "Lint rule disabled without a reason"],
  ["// TODO fix later", "Deferred work marker"],
];

for (const [line, summary] of samples) {
  assert.ok(ids([file(line)]).includes(summary), "expected " + summary + " for: " + line);
}

const commentOnly = scanDiff([
  file("// const value: any = 1;\n// console.log('debug');\n/* debugger */"),
]);
assert.deepEqual(commentOnly, []);

assert.equal(SCAN_RULE_IDS.length, 15);

const f = (summary: string, line = 1) => ({
  severity: "P2" as const,
  file: "a.ts",
  line,
  dimension: "correctness" as const,
  summary,
  evidence: "",
  fix: "",
});

const merged = mergeFindings([f("a"), f("a")], [f("a"), f("b", 2)]);
assert.equal(merged.length, 2);
assert.deepEqual(merged.map((finding) => finding.summary).sort(), ["a", "b"]);

console.log("scan.test.ts: all assertions passed");
