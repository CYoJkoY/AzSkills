/*
 * Deterministic review scoring.
 *
 * The model finds defects; this module decides the number. Scores are computed
 * from counted findings, evidence gates, and hard caps, so a review cannot
 * round up, average away a P2, or declare a clean pass without proofs.
 */

export const SEVERITIES = ["P0", "P1", "P2", "P3", "P4"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const WEIGHTS: Record<Severity, number> = {
  P0: 2.5,
  P1: 1.5,
  P2: 0.5,
  P3: 0.2,
  P4: 0.1,
};

export const DIMENSIONS = [
  "correctness",
  "performance",
  "discipline",
  "readability",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const PROBES = [
  "boundary",
  "error-path",
  "resource",
  "concurrency",
  "regression",
  "security",
] as const;
export type ProbeId = (typeof PROBES)[number];

export interface Finding {
  readonly severity: Severity;
  readonly file: string;
  readonly line: number;
  readonly dimension: Dimension;
  readonly summary: string;
  readonly evidence: string;
  readonly fix: string;
}

export interface ProbeResult {
  readonly id: ProbeId;
  readonly status: "passed" | "failed" | "na";
  readonly note: string;
}

export interface DimensionResult {
  readonly id: Dimension;
  readonly status: "pass" | "fail";
  readonly note: string;
}

export interface VerificationResult {
  readonly command: string;
  readonly exitCode: number;
  readonly output: string;
}

export interface PreviousRound {
  readonly score: number;
  readonly resolved: Finding[];
}

/**
 * One independent reviewer's attestation for an EGM review. A reviewer only
 * counts when it ran to completion in a fresh context and actually read files.
 */
export interface EgmReviewer {
  readonly id: string;
  readonly persona: string;
  readonly status: "completed" | "not run";
  readonly freshContext: boolean;
  readonly filesRead: readonly string[];
}

export interface ReviewInput {
  readonly headSha: string;
  readonly round: number;
  readonly diffFiles: string[];
  readonly reviewedFiles: string[];
  readonly findings: Finding[];
  readonly carryOver: Finding[];
  readonly probes: ProbeResult[];
  readonly dimensions: DimensionResult[];
  readonly verification: VerificationResult | null;
  readonly noVerificationReason?: string;
  readonly previous?: PreviousRound | null;
  /** Which review engine produced this input. */
  readonly engine?: "egm" | "self";
  /** Attestation of each fresh-context EGM reviewer that produced findings. */
  readonly reviewers?: readonly EgmReviewer[];
}

export interface ScorePolicy {
  readonly threshold: number;
  readonly maxRounds: number;
  readonly requiredProbes: readonly ProbeId[];
}

export const DEFAULT_POLICY: ScorePolicy = {
  // A round passes only when its score is strictly above this bar, so a
  // score of exactly 4.80 is still a repair, not a merge.
  threshold: 4.8,
  maxRounds: 5,
  requiredProbes: PROBES,
};

export interface Gate {
  readonly id: string;
  readonly status: "pass" | "fail";
  readonly detail: string;
}

export interface ScoreResult {
  readonly score: number;
  readonly verdict: "PASS" | "FAIL";
  readonly threshold: number;
  readonly counts: Record<Severity, number>;
  readonly deduction: number;
  readonly caps: { reason: string; value: number }[];
  readonly gates: Gate[];
  readonly autoFindings: Finding[];
  readonly reasons: string[];
  readonly round: number;
}

const floor2 = (value: number): number => Math.floor(value * 100 + 1e-9) / 100;

const isSeverity = (value: unknown): value is Severity =>
  typeof value === "string" && (SEVERITIES as readonly string[]).includes(value);
const isDimension = (value: unknown): value is Dimension =>
  typeof value === "string" && (DIMENSIONS as readonly string[]).includes(value);
const isProbeId = (value: unknown): value is ProbeId =>
  typeof value === "string" && (PROBES as readonly string[]).includes(value);

export class ReviewInputError extends Error {}

/** Rejects a review record that cannot be counted, instead of guessing. */
export function assertReviewInput(value: unknown): asserts value is ReviewInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("Review input must be an object");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.headSha !== "string" || record.headSha === "") {
    throw new ReviewInputError("headSha is required");
  }
  if (typeof record.round !== "number" || !Number.isInteger(record.round) || record.round < 1) {
    throw new ReviewInputError("round must be a positive integer");
  }
  if (!Array.isArray(record.diffFiles) || !record.diffFiles.every((item) => typeof item === "string")) {
    throw new ReviewInputError("diffFiles must be a string array");
  }
  if (!Array.isArray(record.reviewedFiles) || !record.reviewedFiles.every((item) => typeof item === "string")) {
    throw new ReviewInputError("reviewedFiles must be a string array");
  }
  if (!Array.isArray(record.findings)) throw new ReviewInputError("findings must be an array");
  if (!Array.isArray(record.carryOver)) throw new ReviewInputError("carryOver must be an array");
  if (!Array.isArray(record.probes)) throw new ReviewInputError("probes must be an array");
  if (!Array.isArray(record.dimensions)) throw new ReviewInputError("dimensions must be an array");
  for (const finding of [...record.findings, ...record.carryOver]) {
    assertFinding(finding);
  }
  for (const probe of record.probes) assertProbeResult(probe);
  for (const dimension of record.dimensions) assertDimensionResult(dimension);
  if (record.verification !== null && record.verification !== undefined) {
    assertVerification(record.verification);
  }
  if (record.noVerificationReason !== undefined && typeof record.noVerificationReason !== "string") {
    throw new ReviewInputError("noVerificationReason must be a string when present");
  }
  if (record.previous !== null && record.previous !== undefined) {
    assertPreviousRound(record.previous);
  }
  if (record.engine !== undefined && record.engine !== "egm" && record.engine !== "self") {
    throw new ReviewInputError("engine must be 'egm' or 'self' when present");
  }
  if (record.reviewers !== undefined) {
    if (!Array.isArray(record.reviewers)) {
      throw new ReviewInputError("reviewers must be an array when present");
    }
    for (const reviewer of record.reviewers) assertEgmReviewer(reviewer);
  }
}

export function assertEgmReviewer(value: unknown): asserts value is EgmReviewer {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("Reviewer attestation must be an object");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id === "") {
    throw new ReviewInputError("Reviewer id is required");
  }
  if (typeof record.persona !== "string") {
    throw new ReviewInputError("Reviewer persona must be a string");
  }
  if (record.status !== "completed" && record.status !== "not run") {
    throw new ReviewInputError("Reviewer status must be 'completed' or 'not run'");
  }
  if (typeof record.freshContext !== "boolean") {
    throw new ReviewInputError("Reviewer freshContext must be a boolean");
  }
  if (!Array.isArray(record.filesRead) || !record.filesRead.every((item) => typeof item === "string")) {
    throw new ReviewInputError("Reviewer filesRead must be a string array");
  }
}

export function assertProbeResult(value: unknown): asserts value is ProbeResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("Probe result must be an object");
  }
  const record = value as Record<string, unknown>;
  if (!isProbeId(record.id)) {
    throw new ReviewInputError("Probe id must be one of " + PROBES.join(", "));
  }
  if (record.status !== "passed" && record.status !== "failed" && record.status !== "na") {
    throw new ReviewInputError("Probe status must be passed, failed, or na");
  }
  if (typeof record.note !== "string") {
    throw new ReviewInputError("Probe note must be a string");
  }
}

export function assertDimensionResult(value: unknown): asserts value is DimensionResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("Dimension result must be an object");
  }
  const record = value as Record<string, unknown>;
  if (!isDimension(record.id)) {
    throw new ReviewInputError("Dimension id must be one of " + DIMENSIONS.join(", "));
  }
  if (record.status !== "pass" && record.status !== "fail") {
    throw new ReviewInputError("Dimension status must be pass or fail");
  }
  if (typeof record.note !== "string") {
    throw new ReviewInputError("Dimension note must be a string");
  }
}

export function assertVerification(value: unknown): asserts value is VerificationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("Verification must be an object");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.command !== "string") {
    throw new ReviewInputError("Verification command must be a string");
  }
  if (typeof record.exitCode !== "number" || !Number.isInteger(record.exitCode)) {
    throw new ReviewInputError("Verification exitCode must be an integer");
  }
  if (typeof record.output !== "string") {
    throw new ReviewInputError("Verification output must be a string");
  }
}

export function assertPreviousRound(value: unknown): asserts value is PreviousRound {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ReviewInputError("previous must be an object");
  }
  const record = value as Record<string, unknown>;
  if (typeof record.score !== "number" || !Number.isFinite(record.score)) {
    throw new ReviewInputError("previous.score must be a finite number");
  }
  if (!Array.isArray(record.resolved)) {
    throw new ReviewInputError("previous.resolved must be a Finding array");
  }
  for (const finding of record.resolved) assertFinding(finding);
}

export function assertFinding(value: unknown): asserts value is Finding {
  if (typeof value !== "object" || value === null) throw new ReviewInputError("Finding must be an object");
  const record = value as Record<string, unknown>;
  if (!isSeverity(record.severity)) throw new ReviewInputError("Finding severity must be P0-P4");
  if (typeof record.file !== "string" || record.file === "") throw new ReviewInputError("Finding file is required");
  if (typeof record.line !== "number" || !Number.isInteger(record.line) || record.line < 1) {
    throw new ReviewInputError("Finding line must be a positive integer");
  }
  if (typeof record.dimension !== "string" || !isDimension(record.dimension)) {
    throw new ReviewInputError("Finding dimension must be correctness, performance, discipline, or readability");
  }
  if (typeof record.summary !== "string" || record.summary.trim() === "") {
    throw new ReviewInputError("Finding summary is required");
  }
  if (typeof record.evidence !== "string") {
    throw new ReviewInputError("Finding evidence must be a string");
  }
  if (typeof record.fix !== "string") {
    throw new ReviewInputError("Finding fix must be a string");
  }
}

export function findingKey(finding: Finding): string {
  return [
    finding.severity,
    finding.file,
    String(finding.line),
    finding.dimension,
    finding.summary.trim().toLowerCase(),
  ].join("|");
}

export function dedupe(findings: readonly Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const finding of findings) {
    const key = findingKey(finding);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

/**
 * Findings that name a defect without an observation, a location, or a repair
 * still count on the score. They also flag the review itself as unreliable,
 * which caps the report: an unevidenced claim is never worth a clean pass.
 */
function integrityIssues(input: ReviewInput): string[] {
  const issues: string[] = [];
  const all = [...input.findings, ...input.carryOver];
  for (const finding of all) {
    const label = finding.file + ":" + finding.line;
    if (finding.evidence.trim() === "") issues.push("Finding has no observation: " + label);
    if (finding.fix.trim() === "") issues.push("Finding has no repair: " + label);
  }
  for (const dimension of DIMENSIONS) {
    if (!input.dimensions.some((item) => item.id === dimension)) {
      issues.push("Dimension not reported: " + dimension);
    }
  }
  for (const dimension of input.dimensions) {
    if (dimension.note.trim() === "") {
      issues.push("Dimension reported without evidence: " + dimension.id);
    }
  }
  for (const probe of input.probes) {
    if (probe.note.trim() === "") {
      issues.push("Probe reported without a note: " + probe.id);
    }
  }
  const verification = input.verification;
  if (verification !== null && verification.command.trim() === "") {
    issues.push("Verification command is empty");
  }
  if (verification !== null && verification.output.trim() === "") {
    issues.push("Verification output is empty");
  }
  return issues;
}

export function scoreReview(
  input: ReviewInput,
  policy: ScorePolicy = DEFAULT_POLICY,
): ScoreResult {
  assertReviewInput(input);
  if (!Number.isFinite(policy.threshold) || policy.threshold <= 0 || policy.threshold > 5) {
    throw new ReviewInputError("Review threshold must be between 0 and 5");
  }

  const gates: Gate[] = [];
  const reasons: string[] = [];
  const autoFindings: Finding[] = [];
  const caps: { reason: string; value: number }[] = [];

  const reviewed = new Set(input.reviewedFiles);
  const unreviewed = input.diffFiles.filter((file) => !reviewed.has(file));
  if (unreviewed.length > 0) {
    for (const file of unreviewed) {
      autoFindings.push({
        severity: "P1",
        file,
        line: 1,
        dimension: "correctness",
        summary: "Diff file was not reviewed",
        evidence: "File is in the pull request diff but absent from reviewedFiles",
        fix: "Review the file and list it in reviewedFiles before scoring",
      });
    }
    caps.push({ reason: "Unreviewed diff files", value: 3.5 });
    gates.push({
      id: "diff-coverage",
      status: "fail",
      detail: unreviewed.length + " file(s) not reviewed",
    });
    reasons.push("Every changed file must be reviewed; " + unreviewed.length + " were skipped.");
  } else {
    gates.push({ id: "diff-coverage", status: "pass", detail: "all diff files reviewed" });
  }

  const verification = input.verification;
  const noVerifyReason = (input.noVerificationReason ?? "").trim();
  const probeSet = new Map(input.probes.map((probe) => [probe.id, probe]));
  const allNa = input.probes.length > 0 && input.probes.every((probe) => probe.status === "na");
  if (verification === null || verification.exitCode !== 0) {
    if (verification === null && noVerifyReason !== "" && allNa) {
      caps.push({ reason: "No executable verification", value: 4.3 });
      gates.push({
        id: "verification",
        status: "fail",
        detail: "no verification ran: " + noVerifyReason,
      });
      reasons.push("A change with no executable verification cannot pass.");
    } else {
      autoFindings.push({
        severity: "P1",
        file: "verification",
        line: 1,
        dimension: "correctness",
        summary: "Verification did not pass",
        evidence:
          verification === null
            ? "No verification command was recorded"
            : "Command exited with code " + String(verification.exitCode),
        fix: "Run the project test, build, or typecheck command and record its real output",
      });
      caps.push({ reason: "Verification failed or missing", value: 3.5 });
      gates.push({
        id: "verification",
        status: "fail",
        detail: verification === null ? "missing" : "exit code " + String(verification.exitCode),
      });
      reasons.push("Verification must be green before a review can pass.");
    }
  } else {
    gates.push({
      id: "verification",
      status: "pass",
      detail: verification.command + " exited 0",
    });
  }

  const missingProbes = policy.requiredProbes.filter((id) => !probeSet.has(id));
  if (missingProbes.length > 0) {
    autoFindings.push({
      severity: "P2",
      file: "review",
      line: 1,
      dimension: "correctness",
      summary: "Required adversarial probes were not reported",
      evidence: "Missing: " + missingProbes.join(", "),
      fix: "Report every probe as passed, failed, or na with a concrete note",
    });
    caps.push({ reason: "Incomplete probe set", value: 4.5 });
    gates.push({
      id: "probes",
      status: "fail",
      detail: "missing " + missingProbes.join(", "),
    });
    reasons.push("An incomplete probe set cannot be a clean pass.");
  }
  const failedProbes = input.probes.filter((probe) => probe.status === "failed");
  for (const probe of failedProbes) {
    autoFindings.push({
      severity: "P2",
      file: "review",
      line: 1,
      dimension: "correctness",
      summary: "Adversarial probe failed: " + probe.id,
      evidence: probe.note.trim() === "" ? "Probe marked failed without a note" : probe.note,
      fix: "Repair the defect the probe exposed, then rerun the probe",
    });
  }
  if (failedProbes.length === 0 && missingProbes.length === 0) {
    gates.push({ id: "probes", status: "pass", detail: "all probes reported" });
  }
  const failedDimensions = input.dimensions.filter((dimension) => dimension.status === "fail");
  for (const dimension of failedDimensions) {
    autoFindings.push({
      severity: "P2",
      file: "review",
      line: 1,
      dimension: "correctness",
      summary: "Review dimension reported as failing: " + dimension.id,
      evidence: dimension.note.trim() === "" ? "Dimension marked failing without evidence" : dimension.note,
      fix: "Repair the defect the dimension reports, then rerun that dimension",
    });
  }
  if (failedDimensions.length > 0) {
    caps.push({ reason: "A review dimension failed", value: 4.5 });
    gates.push({
      id: "dimensions",
      status: "fail",
      detail: failedDimensions.map((dimension) => dimension.id).join(", "),
    });
    reasons.push("A dimension the reviewer marked as failing cannot carry a pass.");
  } else {
    gates.push({ id: "dimensions", status: "pass", detail: "every dimension passed" });
  }

  const integrity = integrityIssues(input);
  if (integrity.length > 0) {
    caps.push({ reason: "Review evidence integrity", value: 4.5 });
    gates.push({
      id: "integrity",
      status: "fail",
      detail: integrity.length + " incomplete claim(s)",
    });
    for (const issue of integrity) reasons.push(issue);
  } else {
    gates.push({ id: "integrity", status: "pass", detail: "findings are evidenced" });
  }

  const findings = dedupe([...autoFindings, ...input.findings, ...input.carryOver]);
  const counts: Record<Severity, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  if (counts.P0 > 0) caps.push({ reason: "P0 present", value: 2.0 });
  if (counts.P1 > 0) caps.push({ reason: "P1 present", value: 3.5 });
  if (counts.P2 > 0) caps.push({ reason: "P2 present", value: 4.5 });

  const deduction = SEVERITIES.reduce(
    (total, severity) => total + WEIGHTS[severity] * counts[severity],
    0,
  );

  let cap = 5.0;
  for (const entry of caps) cap = Math.min(cap, entry.value);

  const previous = input.previous ?? null;
  if (previous !== null && Number.isFinite(previous.score) && previous.score > 0) {
    const recovered = previous.resolved.reduce(
      (total, finding) => total + WEIGHTS[finding.severity],
      0,
    );
    const allowed = Math.min(5.0, previous.score + recovered);
    if (allowed < cap) {
      cap = allowed;
      reasons.push(
        "Score rose faster than the resolved findings justify (previous " +
          previous.score.toFixed(2) +
          ", allowed " +
          allowed.toFixed(2) +
          ").",
      );
    }
  }

  const raw = Math.max(0, 5.0 - deduction);
  const score = floor2(Math.min(cap, raw));
  const blocking = counts.P0 + counts.P1 + counts.P2;
  const budgetExhausted = input.round > policy.maxRounds;
  if (budgetExhausted) {
    reasons.push(
      "Round " + input.round + " exceeds the repair budget of " + policy.maxRounds + ".",
    );
  }
  // The bar is strict: a score equal to the threshold is not above it, so a
  // round that lands exactly on 4.80 still needs another repair.
  const verdict: "PASS" | "FAIL" =
    blocking === 0 && score > policy.threshold && !budgetExhausted ? "PASS" : "FAIL";
  if (verdict === "FAIL" && blocking === 0 && !budgetExhausted) {
    reasons.push(
      "Score " + score.toFixed(2) + " is not above the acceptance threshold " + policy.threshold.toFixed(2) + ".",
    );
  }

  gates.push({
    id: "acceptance",
    status: verdict === "PASS" ? "pass" : "fail",
    detail:
      "blocking=" + String(blocking) + ", score=" + score.toFixed(2) + ", required=score>" + policy.threshold.toFixed(2),
  });

  return {
    score,
    verdict,
    threshold: policy.threshold,
    counts,
    deduction: floor2(deduction),
    caps,
    gates,
    autoFindings,
    reasons: dedupeStrings(reasons),
    round: input.round,
  };
}

function dedupeStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export interface ReportMeta {
  readonly taskId: string;
  readonly issue: number | null;
  readonly previousHeadSha: string | null;
  readonly reviewedAt: string;
  readonly reviewer?: string;
  readonly findings: readonly Finding[];
  readonly headSha?: string;
  readonly carryOver?: readonly Finding[];
  readonly resolved?: readonly Finding[];
  readonly dimensions?: readonly DimensionResult[];
  /** Which review engine produced the report: EGM or self-review. */
  readonly engine?: "egm" | "self";
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  correctness: "Correctness & Regression",
  performance: "Performance & Resource Safety",
  discipline: "Engineering Discipline & Strong Typing",
  readability: "Readability & Commit Integrity",
};

const location = (finding: Finding): string =>
  "`" + finding.file + ":L" + String(finding.line) + "`";

/** Renders the pull-request comment from counted data, never from prose. */
export function renderReport(result: ScoreResult, meta: ReportMeta): string {
  const lines: string[] = [];
  const cap = result.caps.reduce(
    (lowest, entry) => Math.min(lowest, entry.value),
    5.0,
  );
  const head = meta.headSha ?? meta.previousHeadSha ?? "unknown";
  lines.push("### \u{1F50D} Autonomous Code Review Report (Round " + String(result.round) + ")");
  lines.push("");
  lines.push("- **Reviewed Commit (`head SHA`)**: `" + head + "`");
  lines.push(
    "- **Baseline**: " +
      (meta.previousHeadSha === null
        ? "Initial full diff"
        : "Previous head SHA (`" + meta.previousHeadSha + "`)"),
  );
  lines.push(
    "- **Verdict**: `" + result.verdict + "` (Acceptance rule: zero unresolved `P0/P1/P2` issues and final score `> " +
      result.threshold.toFixed(2) + " / 5.00`)",
  );
  lines.push("- **Final Score**: `" + result.score.toFixed(2) + " / 5.00`");
  lines.push("- Task: `" + meta.taskId + "`" + (meta.issue === null ? "" : " / Issue #" + String(meta.issue)));
  lines.push("- Reviewed at: `" + meta.reviewedAt + "`");
  if (meta.reviewer !== undefined && meta.reviewer !== "") {
    lines.push("- Reviewer: `" + meta.reviewer + "` (independent, fresh context)");
  }
  if (meta.engine !== undefined) {
    lines.push(
      "- Review engine: `" + meta.engine + "`" +
        (meta.engine === "egm"
          ? " (Elephant-Goldfish reviewers, fresh contexts)"
          : " (self-review, not accepted for merge)"),
    );
  }
  lines.push("");

  lines.push(
    result.round === 1
      ? "#### 1. Previous Round Issue Resolution (Initial Review)"
      : "#### 1. Previous Round Issue Resolution (Round " +
          String(result.round - 1) +
          " Closure Tracking)",
  );
  lines.push("");
  const resolved = meta.resolved ?? [];
  const carryOver = meta.carryOver ?? [];
  if (meta.previousHeadSha === null && resolved.length === 0 && carryOver.length === 0) {
    lines.push("> Initial review round; no prior issues.");
    lines.push("");
    lines.push("| Original Severity | File & Line | Issue Summary | Resolution Status | Fix Commit / Rationale |");
    lines.push("| :--- | :--- | :--- | :--- | :--- |");
    lines.push("| None | - | Initial review round; no prior issues. | - | - |");
  } else {
    lines.push("| Original Severity | File & Line | Issue Summary | Resolution Status | Fix Commit / Rationale |");
    lines.push("| :--- | :--- | :--- | :--- | :--- |");
    for (const finding of resolved) {
      lines.push(
        "| " + finding.severity + " | " + location(finding) + " | " + escapeCell(finding.summary) +
          " | Fixed | Verified against `" + (meta.previousHeadSha ?? "previous head") + "` |",
      );
    }
    for (const finding of carryOver) {
      lines.push(
        "| " + finding.severity + " | " + location(finding) + " | " + escapeCell(finding.summary) +
          " | Unresolved (Carry-over) | Carried into Section 3 and counted this round |",
      );
    }
    if (resolved.length === 0 && carryOver.length === 0) {
      lines.push("| None | - | No prior issues carried forward | - | - |");
    }
  }
  lines.push("");

  lines.push("#### 2. Quantitative Deduction Formula");
  lines.push("");
  const breakdown = SEVERITIES.map(
    (severity) =>
      "`" + severity + "`: `" + String(result.counts[severity]) + "` x `" +
      WEIGHTS[severity].toFixed(2) + "`",
  ).join(" + ");
  lines.push("- **Breakdown**: " + breakdown + " = Total Deduction `" + result.deduction.toFixed(2) + "`");
  const capTriggered = result.caps.length === 0
    ? "None (cap `5.00`)"
    : result.caps
        .map((entry) => entry.reason + " (`" + entry.value.toFixed(2) + "`)")
        .join("; ") + " -> effective cap `" + cap.toFixed(2) + "`";
  lines.push("- **Hard Cap Triggered**: " + capTriggered);
  lines.push(
    "- **Calculation**: `min(" + cap.toFixed(2) + ", max(0.00, 5.00 - " + result.deduction.toFixed(2) +
      ")) = " + result.score.toFixed(2) + "`",
  );
  lines.push("");

  lines.push("#### 3. Current Round Findings & Exact Line Numbers (P0-P4)");
  lines.push("");
  lines.push("| Severity | File & Line | Review Dimension | Issue Description | Recommended Fix |");
  lines.push("| :--- | :--- | :--- | :--- | :--- |");
  const all = [...result.autoFindings, ...meta.findings];
  const unique = dedupe(all);
  for (const severity of SEVERITIES) {
    const rows = unique.filter((finding) => finding.severity === severity);
    if (rows.length === 0) {
      lines.push(
        "| " + severity + " | None | - | No " + severity + " findings | - |",
      );
      continue;
    }
    for (const finding of rows) {
      lines.push(
        "| " + severity + " | " + location(finding) + " | " + DIMENSION_LABELS[finding.dimension] +
          " | " + escapeCell(finding.summary) + " | " + escapeCell(finding.fix) + " |",
      );
    }
  }
  lines.push("");

  lines.push("#### 4. Dimension Summary");
  lines.push("");
  const dimensions = meta.dimensions ?? [];
  for (const id of DIMENSIONS) {
    const found = dimensions.find((dimension) => dimension.id === id);
    const status = found === undefined ? "NOT REPORTED" : found.status.toUpperCase();
    const note = found === undefined || found.note.trim() === "" ? "No evidence reported" : found.note;
    lines.push("- **" + DIMENSION_LABELS[id] + "**: `" + status + "` - " + note);
  }

  lines.push("");
  lines.push("#### Evidence Gates");
  lines.push("");
  lines.push("| Gate | Status | Detail |");
  lines.push("| :--- | :--- | :--- |");
  for (const gate of result.gates) {
    lines.push("| " + gate.id + " | " + gate.status.toUpperCase() + " | " + escapeCell(gate.detail) + " |");
  }
  if (result.reasons.length > 0) {
    lines.push("");
    for (const reason of result.reasons) lines.push("- " + reason);
  }
  lines.push("");
  return lines.join("\n");
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/**
 * A review report parsed back from the text posted to a pull request. Only the
 * fields the gates compare are read; the body is otherwise opaque.
 */
export interface ParsedReviewComment {
  readonly round: number;
  readonly headSha: string;
  readonly verdict: "PASS" | "FAIL";
  readonly score: number;
  readonly taskId: string;
  readonly issue: number | null;
}

/** Fields a posted comment must agree with, so a hand-written body cannot pass. */
export interface ReviewCommentExpectation {
  readonly round?: number;
  readonly headSha?: string;
  readonly taskId?: string;
  readonly verdict?: "PASS" | "FAIL";
  readonly score?: number;
}

const REVIEW_TITLE = /^### \u{1F50D} Autonomous Code Review Report \(Round ([1-9]\d*)\)$/u;
const REVIEW_COMMIT = /^-\s+\*\*Reviewed Commit \(`head SHA`\)\*\*:\s*`([^`]+)`/;
const REVIEW_VERDICT = /^-\s+\*\*Verdict\*\*:\s*`(PASS|FAIL)`/;
const REVIEW_SCORE = /^-\s+\*\*Final Score\*\*:\s*`(\d+\.\d{2}) \/ 5\.00`/;
const REVIEW_TASK = /^- Task:\s*`([^`]+)`(?:\s*\/\s*Issue #(\d+))?/;

const REVIEW_SECTIONS = [
  "#### 1. Previous Round Issue Resolution",
  "#### 2. Quantitative Deduction Formula",
  "#### 3. Current Round Findings & Exact Line Numbers (P0-P4)",
  "#### 4. Dimension Summary",
  "#### Evidence Gates",
];

const FINDINGS_TABLE_HEADER = "| Severity | File & Line | Review Dimension | Issue Description | Recommended Fix |";
const GATES_TABLE_HEADER = "| Gate | Status | Detail |";

function reviewLines(body: string): string[] {
  return body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
}

function firstMatch(lines: readonly string[], pattern: RegExp): RegExpExecArray | null {
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match !== null) return match;
  }
  return null;
}

/**
 * Reads the fixed metadata a templated review report must carry. Returns null
 * when the body is not a report or a required field is missing, so a caller can
 * refuse to publish or accept free-form prose.
 */
export function parseReviewComment(body: string): ParsedReviewComment | null {
  const lines = reviewLines(body);
  const title = REVIEW_TITLE.exec(lines[0] ?? "");
  if (title === null) return null;
  const round = Number(title[1]);
  const commit = firstMatch(lines, REVIEW_COMMIT);
  const verdictMatch = firstMatch(lines, REVIEW_VERDICT);
  const scoreMatch = firstMatch(lines, REVIEW_SCORE);
  const taskMatch = firstMatch(lines, REVIEW_TASK);
  if (commit === null || verdictMatch === null || scoreMatch === null || taskMatch === null) return null;
  const headSha = (commit[1] ?? "").trim();
  const taskId = (taskMatch[1] ?? "").trim();
  const score = Number(scoreMatch[1]);
  if (headSha === "" || taskId === "" || !Number.isFinite(score)) return null;
  return {
    round,
    headSha,
    verdict: verdictMatch[1] === "PASS" ? "PASS" : "FAIL",
    score,
    taskId,
    issue: taskMatch[2] === undefined ? null : Number(taskMatch[2]),
  };
}

/**
 * Checks that a body is the deterministic report template and, when supplied,
 * that it describes the round/head/task/verdict/score it is expected to. An
 * empty array means "valid"; any entry is a reason to refuse publication.
 */
export function validateReviewComment(
  body: string,
  expect: ReviewCommentExpectation = {},
): string[] {
  const parsed = parseReviewComment(body);
  if (parsed === null) {
    return [
      "the comment is not a templated Autonomous Code Review Report; publish it with 'azflow review' or 'azflow review-post'",
    ];
  }
  const lines = reviewLines(body);
  const problems: string[] = [];
  if (!lines.some((line) => /^-\s+\*\*Baseline\*\*:/.test(line))) {
    problems.push("missing '- **Baseline**:' metadata line");
  }
  if (!lines.some((line) => /^- Reviewed at:/.test(line))) {
    problems.push("missing '- Reviewed at:' metadata line");
  }
  let cursor = -1;
  for (const header of REVIEW_SECTIONS) {
    const index = lines.findIndex((line, at) => at > cursor && line.trim().startsWith(header));
    if (index === -1) {
      problems.push("missing section header '" + header + "' in the required order");
    } else {
      cursor = index;
    }
  }
  if (!lines.some((line) => line.trim() === FINDINGS_TABLE_HEADER)) {
    problems.push("missing findings table header '" + FINDINGS_TABLE_HEADER + "'");
  }
  if (!lines.some((line) => line.trim() === GATES_TABLE_HEADER)) {
    problems.push("missing evidence gates table header '" + GATES_TABLE_HEADER + "'");
  }
  if (expect.round !== undefined && parsed.round !== expect.round) {
    problems.push("round is " + String(parsed.round) + ", expected " + String(expect.round));
  }
  if (expect.headSha !== undefined && parsed.headSha !== expect.headSha) {
    problems.push("reviewed head is " + parsed.headSha + ", expected " + expect.headSha);
  }
  if (expect.taskId !== undefined && parsed.taskId !== expect.taskId) {
    problems.push("task is " + parsed.taskId + ", expected " + expect.taskId);
  }
  if (expect.verdict !== undefined && parsed.verdict !== expect.verdict) {
    problems.push("verdict is " + parsed.verdict + ", expected " + expect.verdict);
  }
  if (expect.score !== undefined && Math.abs(parsed.score - expect.score) > 0.004) {
    problems.push(
      "final score is " + parsed.score.toFixed(2) + ", expected " + expect.score.toFixed(2),
    );
  }
  return problems;
}
