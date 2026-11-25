/*
 * doneWhen verification for a goal run.
 *
 * A goal's done-when criteria are prose, and prose is what lets a long run
 * drift: the model can believe it is finished without the repository saying so.
 * This module compiles the criteria it can actually check (a merged issue or
 * pull request, a tag, a commit, a file) into assertions and evaluates them
 * against the real repository. Criteria it cannot check stay `manual`, so an
 * unparseable criterion never blocks completion and never fakes one either.
 *
 * Only a goal whose every criterion is machine-checkable, and whose every
 * check passes, is auto-completed by the Stop hook. Everything else still
 * needs the model's explicit `azflow goal complete`.
 */

import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";

export type DoneWhenKind = "issue" | "pr" | "tag" | "commit" | "file" | "manual";

export interface DoneWhenCheck {
  readonly criterion: string;
  readonly kind: DoneWhenKind;
  /** The issue/PR number, tag, commit SHA, or file path the criterion names. */
  readonly target: string;
}

export interface DoneWhenResult {
  readonly check: DoneWhenCheck;
  /** True/false when verified, null when the check could not be evaluated. */
  readonly verified: boolean | null;
  readonly detail: string;
}

export interface DoneWhenReport {
  readonly results: readonly DoneWhenResult[];
  /** Every criterion names something this module knows how to check. */
  readonly allVerifiable: boolean;
  /** Every check is verifiable and evaluated true. */
  readonly allPassed: boolean;
}

const VERIFY_TIMEOUT_MS = 5000;

const trim = (value: string): string => value.replace(/^[`'"\s]+|[`'"\s]+$/g, "");

/**
 * Compiles one criterion into a check. Patterns are deliberately narrow: a
 * loose match would turn "tests pass" into a fake issue lookup.
 */
export function parseDoneWhen(criterion: string): DoneWhenCheck {
  const text = criterion.trim();
  const base = { criterion: text } as const;

  const issue = /^(?:gh\s+)?issue\s*#?(\d+)\s+(?:is\s+|was\s+)?(?:merged|closed|resolved|done)\b/i.exec(text);
  if (issue !== null && issue[1] !== undefined) return { ...base, kind: "issue", target: issue[1] };

  const pr = /^(?:gh\s+)?(?:pr|pull request)\s*#?(\d+)\s+(?:is\s+|was\s+|has been\s+)?merged\b/i.exec(text);
  if (pr !== null && pr[1] !== undefined) return { ...base, kind: "pr", target: pr[1] };

  const tag = /^(?:tag|release)\s+([^\s]+)\s*(?:is\s+)?(?:published|pushed|exists|created)?$/i.exec(text);
  if (tag !== null && tag[1] !== undefined) return { ...base, kind: "tag", target: trim(tag[1]) };

  const commit = /^(?:commit\s+)?([0-9a-f]{7,40})\s+(?:is\s+|was\s+)?(?:merged|landed|pushed|on\s+[^\s]+)\b/i.exec(text);
  if (commit !== null && commit[1] !== undefined) return { ...base, kind: "commit", target: commit[1] };

  const file = /^(?:file\s+)?([^\s]+\.[A-Za-z0-9]+)\s+(?:exists|is\s+present|present)\b/i.exec(text);
  if (file !== null && file[1] !== undefined) return { ...base, kind: "file", target: trim(file[1]) };

  return { ...base, kind: "manual", target: "" };
}

function runGit(project: string, args: readonly string[]): { status: number; stdout: string } {
  const result = spawnSync("git", ["-C", project, ...args], {
    encoding: "utf8",
    windowsHide: true,
    timeout: VERIFY_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
  };
}

/**
 * Reads only `state` from GitHub. Missing `gh`, no auth, or a network failure
 * all return null, which means "unverifiable" rather than "not done".
 */
function ghState(args: readonly string[]): string | null {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    windowsHide: true,
    timeout: VERIFY_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error !== undefined || result.status !== 0) return null;
  const text = typeof result.stdout === "string" ? result.stdout : "";
  const match = /"state"\s*:\s*"([A-Z_]+)"/.exec(text);
  return match?.[1] ?? null;
}

async function verifyOne(project: string, check: DoneWhenCheck): Promise<DoneWhenResult> {
  if (check.kind === "manual") {
    return { check, verified: null, detail: "no machine-checkable assertion" };
  }

  if (check.kind === "file") {
    const exists = await stat(path.resolve(project, check.target))
      .then(() => true)
      .catch(() => false);
    return { check, verified: exists, detail: exists ? "file exists" : "file is missing" };
  }

  if (check.kind === "tag") {
    const listed = runGit(project, ["tag", "--list", check.target]);
    const found = listed.status === 0 && listed.stdout.trim() !== "";
    return { check, verified: found, detail: found ? "tag exists" : "tag is not present locally" };
  }

  if (check.kind === "commit") {
    const cat = runGit(project, ["cat-file", "-e", check.target + "^{commit}"]);
    const found = cat.status === 0;
    return { check, verified: found, detail: found ? "commit is reachable" : "commit is not reachable" };
  }

  if (check.kind === "issue") {
    const state = ghState(["issue", "view", check.target, "--json", "state"]);
    if (state === null) return { check, verified: null, detail: "gh unavailable; issue state unknown" };
    const closed = state === "CLOSED";
    return { check, verified: closed, detail: "issue state " + state };
  }

  const state = ghState(["pr", "view", check.target, "--json", "state"]);
  if (state === null) return { check, verified: null, detail: "gh unavailable; pull request state unknown" };
  const merged = state === "MERGED";
  return { check, verified: merged, detail: "pull request state " + state };
}

/** Evaluates every criterion, reporting which ones are machine-checkable. */
export async function verifyDoneWhen(project: string, doneWhen: readonly string[]): Promise<DoneWhenReport> {
  const checks = doneWhen.map(parseDoneWhen);
  const results: DoneWhenResult[] = [];
  for (const check of checks) results.push(await verifyOne(project, check));
  const allVerifiable = results.every((result) => result.check.kind !== "manual");
  return {
    results,
    allVerifiable,
    allPassed: allVerifiable && results.every((result) => result.verified === true),
  };
}

/** One-line summary of what the verification found, for a compass or a CLI. */
export function describeDoneWhen(report: DoneWhenReport): string {
  return report.results
    .map((result) => {
      const mark = result.verified === true ? "pass" : result.verified === false ? "fail" : "manual";
      return "- [" + mark + "] " + result.check.criterion + ": " + result.detail;
    })
    .join("\n");
}

/** True when every criterion is already verified true. */
export function doneWhenSatisfied(report: DoneWhenReport): boolean {
  return report.allPassed;
}
