/*
 * Commit and pull request message rules.
 *
 * These assertions pin the standard itself: ASCII only, Conventional Commits
 * with a Refs footer, and the fixed five-section pull request body. A failure
 * here means `azflow commit` or `azflow pr` would accept a message the delivery
 * standard forbids.
 */
import assert from "node:assert/strict";
import {
  buildCommitMessage,
  buildPullRequestBody,
  buildPullRequestTitle,
  parseCommitHeader,
  pullRequestSectionHeadings,
  validateCommitMessage,
  validatePullRequestBody,
  validatePullRequestTitle,
} from "../scripts/message.ts";
import type { PullRequestBodyInput } from "../scripts/message.ts";

const violations = (message: string, issueId: number | null = 12): string[] =>
  validateCommitMessage(message, { issueId }).violations;

const good =
  "feat(cart): add total helper\n" +
  "\n" +
  "Fold the cart items in one pass so the badge shows a running sum.\n" +
  "\n" +
  "Refs: #12\n";

assert.deepEqual(violations(good), [], "a compliant message must pass");

// Header shape.
assert.ok(violations("add cart total").length > 0, "a bare sentence is not a header");
assert.ok(violations("feature(cart): add total\n\nRefs: #12\n").length > 0, "unknown type is rejected");
assert.ok(violations("feat(Cart): add total\n\nRefs: #12\n").length > 0, "uppercase scope is rejected");
assert.ok(violations("feat(cart): Add total\n\nRefs: #12\n").length > 0, "subject must start lowercase");
assert.ok(violations("feat(cart): add total.\n\nRefs: #12\n").length > 0, "trailing period is rejected");
assert.ok(violations("feat(cart): add total #12\n\nRefs: #12\n").length > 0, "header must not name an issue");
assert.ok(violations("feat(cart): update files\n\nRefs: #12\n").length > 0, "vague subject is rejected");
assert.ok(violations("feat(cart): misc fixes\n\nRefs: #12\n").length > 0, "vague subject is rejected");
assert.ok(violations("feat(cart): wip\n\nRefs: #12\n").length > 0, "wip subject is rejected");

const longSubject = "feat(cart): add the running total helper for the checkout badge row here now";
assert.ok(
  violations(longSubject + "\n\nRefs: #12\n").length > 0,
  "a header over 72 characters is rejected",
);
const targetSubject = "feat(cart): add the running total helper for the badge";
const targetCheck = validateCommitMessage(targetSubject + "\n\nRefs: #12\n", { issueId: 12 });
assert.deepEqual(targetCheck.violations, []);
assert.ok(targetCheck.warnings.length > 0, "a header over 50 characters warns");

// ASCII red line.
assert.ok(violations("feat(cart): \u6dfb\u52a0\u603b\u4ef7\n\nRefs: #12\n").length > 0, "non-ASCII subject is rejected");
assert.ok(
  violations("feat(cart): add total \u2013 fixed\n\nRefs: #12\n").length > 0,
  "an en dash is rejected",
);
assert.ok(
  violations("feat(cart): add total\n\nRefs: #12\nfoo \\n bar\n").length > 0,
  "a literal escape sequence is rejected",
);
assert.deepEqual(violations("feat(cart): add total\n\nRefs: #12\n"), []);

// Footer.
assert.ok(violations("feat(cart): add total\n").length > 0, "a missing Refs footer is rejected");
assert.ok(
  violations("feat(cart): add total\n\nRefs: #99\n").length > 0,
  "a footer naming another issue is rejected",
);
assert.ok(
  violations("feat(cart): add total\n", null).some((item) => item.includes("azflow issue")),
  "an issue-less task is told to create the issue",
);

// Breaking changes.
assert.ok(
  violations("feat(cart)!: drop the total flag\n\nRefs: #12\n").length > 0,
  "a breaking header needs the footer note",
);
assert.deepEqual(
  violations("feat(cart)!: drop the total flag\n\nRefs: #12\nBREAKING CHANGE: use totalV2 instead\n"),
  [],
);
assert.ok(
  violations("feat(cart): drop the total flag\n\nRefs: #12\nBREAKING CHANGE: use totalV2 instead\n").length > 0,
  "a breaking footer needs the header marker",
);

// Body width.
assert.ok(
  violations("feat(cart): add total\n\n" + "x".repeat(80) + "\n\nRefs: #12\n").length > 0,
  "a body line over 72 characters is rejected",
);

// Builder round trip.
const built = buildCommitMessage({
  type: "fix",
  scope: "cart",
  subject: "guard empty totals",
  body: "Return zero instead of NaN when the cart is empty.",
  breaking: null,
  issueId: 31,
});
assert.deepEqual(violations(built, 31), [], "the builder emits a compliant message");
assert.ok(built.endsWith("Refs: #31\n"), "the footer closes the message");

const builtBreaking = buildCommitMessage({
  type: "refactor",
  scope: null,
  subject: "rename the total flag",
  body: null,
  breaking: "rename --total to --sum",
  issueId: 31,
});
assert.deepEqual(violations(builtBreaking, 31), [], "a breaking message passes with its note");
assert.ok(builtBreaking.includes("refactor!: rename the total flag"), "the bang marker is added");

// Header parsing.
assert.deepEqual(parseCommitHeader("feat(cart): add total"), {
  type: "feat",
  scope: "cart",
  breaking: false,
  subject: "add total",
});
assert.deepEqual(parseCommitHeader("chore!: drop node 20"), {
  type: "chore",
  scope: null,
  breaking: true,
  subject: "drop node 20",
});
assert.equal(parseCommitHeader("add total"), null);

// Pull request title.
const title = buildPullRequestTitle({
  type: "feat",
  scope: "cart",
  subject: "add total helper",
  issueId: 12,
});
assert.equal(title, "feat(cart): add total helper (#12)");
assert.deepEqual(validatePullRequestTitle(title, { issueId: 12 }).violations, []);
assert.ok(
  validatePullRequestTitle("feat(cart): add total helper", { issueId: 12 }).violations.length > 0,
  "a title without the issue suffix is rejected",
);
assert.ok(
  validatePullRequestTitle("feat(cart): add total helper (#99)", { issueId: 12 }).violations.length > 0,
  "a title naming another issue is rejected",
);
assert.ok(
  validatePullRequestTitle("feat(cart): Add total helper (#12)", { issueId: 12 }).violations.length > 0,
  "an uppercase summary is rejected",
);
assert.ok(
  validatePullRequestTitle(
    "feat(cart): add the running total helper for the checkout badge row (#12)",
    { issueId: 12 },
  ).violations.length > 0,
  "a title of 72 characters or more is rejected",
);

// Pull request body.
const bodyInput: PullRequestBodyInput = {
  issueId: 12,
  base: "main",
  issueSummary: "Expose a running cart total.",
  commits: [{ sha: "abc1234", header: "feat(cart): add total helper", note: "Adds the fold." }],
  guarantees: "No breaking marker; public APIs stay as they were.",
  staticChecks: "`npm run check` (exit 0)",
  runtimeChecks: "2 of 2 recorded probes passed, 0 not applicable.",
  unverified: "None - every assertion above was recorded locally.",
  dependencies: "No build or dependency commit on this branch.",
  dimensions: [
    { id: "correctness", status: "PASS", note: "fold matches the sum contract" },
    { id: "performance", status: "PASS", note: "single pass" },
    { id: "compatibility", status: "PASS", note: "no API change" },
    { id: "readability", status: "PASS", note: "named expression" },
  ],
  verdict: "PASS",
  blocking: [],
  round: 1,
  stackedOn: null,
  permission:
    "The agent opens, reviews, and merges this pull request; installing the plugin delegates that authority.",
};

const body = buildPullRequestBody(bodyInput);
assert.deepEqual(validatePullRequestBody(body, { issueId: 12 }).violations, [], "the body passes its rules");
assert.deepEqual(pullRequestSectionHeadings(body), [
  "Linked Issue",
  "Change summary",
  "Verification & Dependencies",
  "Review conclusion",
  "Permission Notice",
]);
assert.ok(body.includes("Closes #12: Expose a running cart total."), "the issue is linked");
assert.ok(body.includes("**Overall Verdict**: PASS"), "the verdict is stated");
assert.ok(!body.includes("Blocking issues:"), "a passing body carries no blocking section");

const failing = buildPullRequestBody({
  ...bodyInput,
  verdict: "FAIL",
  blocking: ["round 2 still leaves an unguarded empty cart"],
  round: 2,
});
assert.ok(failing.includes("Blocking issues:"), "a failing body lists the blocker");
assert.ok(failing.includes("Active iteration: Round 2 of 5"), "a failing body states the round");
const customCap = buildPullRequestBody({
  ...bodyInput,
  verdict: "FAIL",
  blocking: ["round 3 still leaves the badge stale"],
  round: 3,
  maxRounds: 4,
});
assert.ok(
  customCap.includes("Active iteration: Round 3 of 4"),
  "the round budget follows the scoring policy rather than a hardcoded cap",
);

assert.ok(
  validatePullRequestBody(body.replace("## Review conclusion", "## Review"), { issueId: 12 }).violations.length > 0,
  "a renamed section is rejected",
);
assert.ok(
  validatePullRequestBody(body + "\n## Extra\n", { issueId: 12 }).violations.length > 0,
  "an extra section is rejected",
);
assert.ok(
  validatePullRequestBody(body.replace("Closes #12", "Refs #12"), { issueId: 12 }).violations.length > 0,
  "a body that does not close the issue is rejected",
);
assert.ok(
  validatePullRequestBody(body.replace("Permission Notice", "Permission \u2014 Notice"), { issueId: 12 })
    .violations.length > 0,
  "non-ASCII body text is rejected",
);

console.log("message.test.ts: all assertions passed");
