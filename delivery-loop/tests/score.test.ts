import assert from "node:assert/strict";
import {
  DEFAULT_POLICY,
  PROBES,
  DIMENSIONS,
  renderReport,
  scoreReview,
  validateReviewComment,
  type Finding,
  type ProbeResult,
  type DimensionResult,
  type VerificationResult,
} from "../scripts/score.ts";

function passProbes(): ProbeResult[] {
  return PROBES.map((id) => ({ id, status: "passed", note: "checked" }));
}

function passDimensions(): DimensionResult[] {
  return DIMENSIONS.map((id) => ({ id, status: "pass", note: "clear" }));
}

function greenVerification(): VerificationResult {
  return { command: "npm test", exitCode: 0, output: "ok" };
}

function finding(severity: Finding["severity"]): Finding {
  return {
    severity,
    file: "src/a.ts",
    line: 1,
    dimension: "correctness",
    summary: "test finding",
    evidence: "evidence",
    fix: "fix",
  };
}

function distinctFinding(severity: Finding["severity"], line: number): Finding {
  return { ...finding(severity), line };
}

function baseInput(overrides: Partial<Parameters<typeof scoreReview>[0]> = {}) {
  return {
    headSha: "abc123",
    round: 1,
    diffFiles: ["src/a.ts"],
    reviewedFiles: ["src/a.ts"],
    findings: [],
    carryOver: [],
    probes: passProbes(),
    dimensions: passDimensions(),
    verification: greenVerification(),
    ...overrides,
  };
}

const clean = scoreReview(baseInput());
assert.equal(clean.score, 5.0);
assert.equal(clean.verdict, "PASS");

const p0 = scoreReview(baseInput({ findings: [finding("P0")] }));
assert.equal(p0.score, 2.0);
assert.equal(p0.verdict, "FAIL");

const p1 = scoreReview(baseInput({ findings: [finding("P1")] }));
assert.equal(p1.score, 3.5);
assert.equal(p1.verdict, "FAIL");

const p2 = scoreReview(baseInput({ findings: [finding("P2")] }));
assert.equal(p2.score, 4.5);
assert.equal(p2.verdict, "FAIL");

const twoP3 = scoreReview(baseInput({ findings: [distinctFinding("P3", 1), distinctFinding("P3", 2)] }));
assert.equal(twoP3.score, 4.6);
assert.equal(twoP3.verdict, "FAIL");

const threeP4 = scoreReview(baseInput({ findings: [distinctFinding("P4", 1), distinctFinding("P4", 2), distinctFinding("P4", 3)] }));
assert.equal(threeP4.score, 4.7);
assert.equal(threeP4.verdict, "FAIL");

assert.equal(DEFAULT_POLICY.threshold, 4.8, "the acceptance bar defaults to 4.80");

// The bar is strict: a 4.90 round passes, a 4.80 round is still a repair.
const aboveThreshold = scoreReview(baseInput({ findings: [finding("P4")] }));
assert.equal(aboveThreshold.score, 4.9);
assert.equal(aboveThreshold.verdict, "PASS");

const atThreshold = scoreReview(
  baseInput({ findings: [distinctFinding("P4", 1), distinctFinding("P4", 2)] }),
);
assert.equal(atThreshold.score, 4.8);
assert.equal(atThreshold.verdict, "FAIL", "a score equal to 4.80 must be repaired, not merged");

const noReview = scoreReview(baseInput({ reviewedFiles: [] }));
assert.equal(noReview.score, 3.5);
assert.equal(noReview.verdict, "FAIL");

const failedVerify = scoreReview(
  baseInput({ verification: { command: "npm test", exitCode: 1, output: "failed" } }),
);
assert.equal(failedVerify.score, 3.5);
assert.equal(failedVerify.verdict, "FAIL");

const missingProbes = scoreReview(
  baseInput({ probes: passProbes().filter((probe) => probe.id !== "security") }),
);
assert.equal(missingProbes.score, 4.5);
assert.equal(missingProbes.verdict, "FAIL");

const failedDimension = scoreReview(
  baseInput({
    dimensions: passDimensions().map((dimension) =>
      dimension.id === "correctness" ? { ...dimension, status: "fail", note: "broken" } : dimension,
    ),
  }),
);
assert.equal(failedDimension.score, 4.5);
assert.equal(failedDimension.verdict, "FAIL");
assert.equal(
  failedDimension.gates.find((gate) => gate.id === "dimensions")?.status,
  "fail",
);

const emptyEvidence = scoreReview(
  baseInput({ findings: [{ ...finding("P4"), evidence: "  " }] }),
);
assert.equal(emptyEvidence.score, 4.5);
assert.equal(emptyEvidence.verdict, "FAIL");

const monotonic = scoreReview(
  baseInput({
    findings: [finding("P1")],
    previous: { score: 3.0, resolved: [] },
  }),
);
assert.equal(monotonic.score, 3.0);
assert.equal(monotonic.verdict, "FAIL");

const recovered = scoreReview(
  baseInput({
    previous: { score: 3.0, resolved: [finding("P1")] },
  }),
);
assert.equal(recovered.score, 4.5);
assert.equal(recovered.verdict, "FAIL");

const firstReport = renderReport(clean, {
  taskId: "T-0001",
  issue: 42,
  previousHeadSha: null,
  headSha: "abc123",
  reviewedAt: "2026-11-22T00:00:00.000Z",
  reviewer: "reviewer-prime",
  findings: [],
  carryOver: [],
  resolved: [],
  dimensions: passDimensions(),
});
assert.ok(firstReport.startsWith("### \u{1F50D} Autonomous Code Review Report (Round 1)"));
assert.match(firstReport, /#### 1\. Previous Round Issue Resolution \(Initial Review\)/);
assert.match(firstReport, /#### 2\. Quantitative Deduction Formula/);
assert.match(firstReport, /#### 3\. Current Round Findings & Exact Line Numbers \(P0-P4\)/);
assert.match(firstReport, /#### 4\. Dimension Summary/);
assert.match(firstReport, /\| P0 \| None \| - \| No P0 findings \| - \|/);
assert.match(firstReport, /Initial review round; no prior issues\./);
assert.match(firstReport, /\*\*Final Score\*\*: `5\.00 \/ 5\.00`/);
assert.match(firstReport, /- Reviewer: `reviewer-prime` \(independent, fresh context\)/);
assert.deepEqual(
  validateReviewComment(firstReport, {
    round: 1,
    headSha: "abc123",
    taskId: "T-0001",
    verdict: "PASS",
    score: 5,
  }),
  [],
);
assert.ok(validateReviewComment("LGTM").length > 0, "free-form text is not a review report");

const secondReport = renderReport(
  scoreReview(baseInput({ round: 2, findings: [distinctFinding("P3", 9)] })),
  {
    taskId: "T-0001",
    issue: 42,
    previousHeadSha: "def456",
    headSha: "abc789",
    reviewedAt: "2026-11-22T01:00:00.000Z",
    findings: [distinctFinding("P3", 9)],
    carryOver: [],
    resolved: [finding("P1")],
    dimensions: passDimensions(),
  },
);
assert.match(secondReport, /#### 1\. Previous Round Issue Resolution \(Round 1 Closure Tracking\)/);
assert.match(secondReport, /\| P1 \| `src\/a\.ts:L1` \| test finding \| Fixed \|/);
assert.match(secondReport, /\| P3 \| `src\/a\.ts:L9` \| Correctness & Regression \|/);

console.log("score.test.ts: all assertions passed");
