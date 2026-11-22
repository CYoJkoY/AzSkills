#!/usr/bin/env node
/*
 * Mechanical diff scanner for the delivery loop.
 *
 * It re-reads the added lines of a diff and emits findings the reviewing model
 * cannot suppress. The model still owns judgement calls; this file owns the
 * ground truth that a self-review tends to hide. Output is deterministic so it
 * can be tested and reproduced.
 */
import type { Dimension, Finding, Severity } from "./score.ts";

export interface AddedLine {
  readonly line: number;
  readonly text: string;
}

export interface DiffFile {
  readonly path: string;
  readonly added: readonly AddedLine[];
}

export interface ScanOptions {
  /* Paths allowed to import a component framework (for example a vendored app). */
  readonly frameworkAllowlist?: readonly string[];
}

interface Rule {
  readonly id: string;
  readonly severity: Severity;
  readonly dimension: Dimension;
  readonly summary: string;
  readonly fix: string;
  readonly match: RegExp;
  readonly appliesTo: (file: string) => boolean;
  readonly skipComment: boolean;
}

const TS_LIKE = /\.(?:ts|tsx|mts|cts)$/i;
const CODE_LIKE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|gd|rs|zig|c|h|cc|cpp|hpp|go|py)$/i;
const TEXT_LIKE = /\.(?:md|markdown|txt|rst|ya?ml|json|toml|ini|cfg|env|sh|ps1|bat)$/i;

const anyCode = (file: string): boolean => CODE_LIKE.test(file) || TS_LIKE.test(file);
const anyFile = (): boolean => true;

const FRAMEWORK_IMPORT =
  /\bfrom\s+['"](?:react|react-dom|vue|svelte|@angular\/[a-z-]+|solid-js|preact|next)(?:\/[^'"]*)?['"]/;

const RULES: readonly Rule[] = [
  {
    id: "conflict-marker",
    severity: "P0",
    dimension: "correctness",
    summary: "Merge conflict marker committed",
    fix: "Resolve the conflict and remove the marker lines",
    match: /^(?:<{7}(?:\s|$)|={7}$|>{7}(?:\s|$))/,
    appliesTo: anyFile,
    skipComment: false,
  },
  {
    id: "private-key",
    severity: "P0",
    dimension: "correctness",
    summary: "Private key material committed",
    fix: "Remove the key, rotate it, and load secrets from the environment",
    match: /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/,
    appliesTo: anyFile,
    skipComment: false,
  },
  {
    id: "aws-key",
    severity: "P0",
    dimension: "correctness",
    summary: "AWS access key id committed",
    fix: "Remove the credential, rotate it, and use scoped environment credentials",
    match: /\bAKIA[0-9A-Z]{16}\b/,
    appliesTo: anyFile,
    skipComment: false,
  },
  {
    id: "github-token",
    severity: "P0",
    dimension: "correctness",
    summary: "GitHub token committed",
    fix: "Revoke the token and load it from the environment or a secret store",
    match: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
    appliesTo: anyFile,
    skipComment: false,
  },
  {
    id: "openai-key",
    severity: "P0",
    dimension: "correctness",
    summary: "API key literal committed",
    fix: "Revoke the key and load it from the environment or a secret store",
    match: /\bsk-[A-Za-z0-9]{20,}\b/,
    appliesTo: anyFile,
    skipComment: false,
  },
  {
    id: "explicit-any",
    severity: "P2",
    dimension: "discipline",
    summary: "Explicit any escape hatch",
    fix: "Replace any with a precise type or an unknown plus a type guard",
    match: /(?::\s*any\b|\bas\s+any\b|<\s*any\s*>|\bany\[\])/,
    appliesTo: (file) => TS_LIKE.test(file),
    skipComment: true,
  },
  {
    id: "ts-ignore",
    severity: "P2",
    dimension: "discipline",
    summary: "Type checker suppressed without resolution",
    fix: "Fix the underlying type error instead of suppressing it",
    match: /@ts-(?:ignore|nocheck)\b/,
    appliesTo: (file) => TS_LIKE.test(file),
    skipComment: true,
  },
  {
    id: "empty-catch",
    severity: "P2",
    dimension: "correctness",
    summary: "Empty catch swallows an error",
    fix: "Handle, rethrow, or log the error with context",
    match: /\bcatch\b[^{]*\{\s*\}/,
    appliesTo: anyCode,
    skipComment: true,
  },
  {
    id: "debugger",
    severity: "P2",
    dimension: "correctness",
    summary: "Debugger statement committed",
    fix: "Remove the debugger statement before delivery",
    match: /\bdebugger\b/,
    appliesTo: (file) => TS_LIKE.test(file) || /\.(?:js|jsx|mjs|cjs)$/i.test(file),
    skipComment: true,
  },
  {
    id: "framework-import",
    severity: "P2",
    dimension: "discipline",
    summary: "Component framework imported",
    fix: "Use native TypeScript and CSS, or record an approved exception",
    match: FRAMEWORK_IMPORT,
    appliesTo: (file) => (TS_LIKE.test(file) || /\.(?:js|jsx|mjs|cjs)$/i.test(file)),
    skipComment: true,
  },
  {
    id: "tab-indent",
    severity: "P2",
    dimension: "readability",
    summary: "Tab indentation",
    fix: "Use spaces to match the repository style",
    match: /^\t/,
    appliesTo: anyCode,
    skipComment: false,
  },
  {
    id: "console-log",
    severity: "P3",
    dimension: "readability",
    summary: "console.log left in code",
    fix: "Remove the debug log or route it through the project logger",
    match: /\bconsole\.(?:log|debug)\s*\(/,
    appliesTo: (file) => TS_LIKE.test(file) || /\.(?:js|jsx|mjs|cjs)$/i.test(file),
    skipComment: true,
  },
  {
    id: "loose-equality",
    severity: "P3",
    dimension: "discipline",
    summary: "Loose equality comparison",
    fix: "Use strict equality or inequality",
    match: /(?:[^=!<>]==(?!=))|(?:[^!=]!=(?!=))/,
    appliesTo: (file) => TS_LIKE.test(file) || /\.(?:js|jsx|mjs|cjs)$/i.test(file),
    skipComment: true,
  },
  {
    id: "eslint-disable",
    severity: "P3",
    dimension: "discipline",
    summary: "Lint rule disabled without a reason",
    fix: "Add a trailing -- reason to the disable comment or fix the rule",
    match: /eslint-disable(?:-next-line|-line)?\s*$/,
    appliesTo: anyCode,
    skipComment: false,
  },
  {
    id: "todo-marker",
    severity: "P4",
    dimension: "readability",
    summary: "Deferred work marker",
    fix: "Resolve it now or track it in an issue",
    match: /\b(?:TODO|FIXME|XXX)\b/,
    appliesTo: anyFile,
    skipComment: false,
  },
];

function commentPrefix(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("--") ||
    trimmed.startsWith("<!--") ||
    trimmed.startsWith(";")
  );
}

function isAllowedFramework(file: string, allowlist: readonly string[]): boolean {
  if (allowlist.some((entry) => file === entry || file.startsWith(entry))) return true;
  return TEXT_LIKE.test(file);
}

function evidenceOf(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 160 ? trimmed.slice(0, 157) + "..." : trimmed;
}

function ruleMatches(rule: Rule, file: string, text: string, allowlist: readonly string[]): boolean {
  if (!rule.appliesTo(file)) return false;
  if (rule.skipComment && commentPrefix(text)) return false;
  if (rule.id === "framework-import" && isAllowedFramework(file, allowlist)) return false;
  return rule.match.test(text);
}

/** Scan added diff lines and return findings in file, then line, order. */
export function scanDiff(files: readonly DiffFile[], options: ScanOptions = {}): Finding[] {
  const allowlist = options.frameworkAllowlist ?? [];
  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    for (const added of file.added) {
      for (const rule of RULES) {
        if (!ruleMatches(rule, file.path, added.text, allowlist)) continue;
        const key = [rule.id, file.path, String(added.line)].join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          severity: rule.severity,
          file: file.path,
          line: added.line,
          dimension: rule.dimension,
          summary: rule.summary,
          evidence: evidenceOf(added.text),
          fix: rule.fix,
        });
      }
    }
  }
  findings.sort((left, right) => {
    if (left.file !== right.file) return left.file < right.file ? -1 : 1;
    return left.line - right.line;
  });
  return findings;
}

/** Combine mechanical and reviewed findings without duplicating a location. */
export function mergeFindings(...groups: readonly (readonly Finding[])[]): Finding[] {
  const seen = new Set<string>();
  const merged: Finding[] = [];
  for (const group of groups) {
    for (const finding of group) {
      const key = [
        finding.severity,
        finding.file,
        String(finding.line),
        finding.summary.trim().toLowerCase(),
      ].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(finding);
    }
  }
  return merged;
}

export const SCAN_RULE_IDS: readonly string[] = RULES.map((rule) => rule.id);
