/*
 * End-to-end test for the delivery loop command line.
 *
 * GitHub is replaced by a local double wired through AZFLOW_GH: it answers
 * `gh` calls and performs the merge by pushing the task head to the base branch
 * of a local bare remote. That exercises the real order of operations in
 * `azflow ship` - merge, state update, issue close, fetch, fast-forward - which
 * a unit test cannot reach.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const azflow = path.join(root, "delivery-loop", "scripts", "azflow.ts");

const run = (
  command: string,
  args: readonly string[],
  cwd: string,
  env: Record<string, string> = {},
): { status: number; stdout: string; stderr: string } => {
  const result = spawnSync(command, [...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    windowsHide: true,
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

const git = (cwd: string, args: readonly string[], env: Record<string, string> = {}) => {
  const result = run("git", args, cwd, env);
  if (result.status !== 0) {
    throw new Error("git " + args.join(" ") + " failed: " + result.stderr.trim());
  }
  return result.stdout.trim();
};

const GH_SHIM = `
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const args = process.argv.slice(2);
const log = process.env.AZFLOW_SHIM_LOG;
fs.appendFileSync(log, args.join(" ") + "\\n");
const reply = (value) => { process.stdout.write(value + "\\n"); process.exit(0); };
const [group, action] = args;
const issueStatePath = (issue) => process.env.AZFLOW_SHIM_ISSUE_STATE + "-" + issue;
const issueState = (issue) => (fs.existsSync(issueStatePath(issue))
  ? fs.readFileSync(issueStatePath(issue), "utf8").trim()
  : "OPEN");
const prBodyPath = process.env.AZFLOW_SHIM_PR_BODY;
const readBody = () => (fs.existsSync(prBodyPath) ? fs.readFileSync(prBodyPath, "utf8") : "");
const rememberBody = () => {
  const at = args.indexOf("--body");
  if (at !== -1) fs.writeFileSync(prBodyPath, args[at + 1] || "");
};
const commentsPath = process.env.AZFLOW_SHIM_PR_COMMENTS;
const readComments = () => {
  if (!fs.existsSync(commentsPath)) return {};
  try { return JSON.parse(fs.readFileSync(commentsPath, "utf8")); } catch { return {}; }
};
const rememberComment = () => {
  const at = args.indexOf("--body");
  const pr = args[2];
  const comments = readComments();
  const bucket = Array.isArray(comments[pr]) ? comments[pr] : [];
  bucket.push({
    body: at === -1 ? "" : args[at + 1] || "",
    author: { login: "shim-reviewer" },
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  comments[pr] = bucket;
  fs.writeFileSync(commentsPath, JSON.stringify(comments));
};
if (group === "auth" && action === "status") reply("ok");
if (group === "issue" && action === "create") reply("https://github.com/acme/demo/issues/" + process.env.AZFLOW_SHIM_ISSUE);
if (group === "issue" && action === "comment") reply("");
if (group === "issue" && action === "close") {
  if (process.env.AZFLOW_SHIM_ISSUE_STUCK !== "1") fs.writeFileSync(issueStatePath(args[2]), "CLOSED");
  reply("");
}
if (group === "issue" && action === "view") reply(JSON.stringify({ state: issueState(args[2]) }));
if (group === "pr" && action === "create") {
  rememberBody();
  reply("https://github.com/acme/demo/pull/" + process.env.AZFLOW_SHIM_PR);
}
if (group === "pr" && action === "comment") {
  rememberComment();
  reply("");
}
if (group === "pr" && action === "edit") {
  rememberBody();
  reply("");
}
if (group === "pr" && action === "ready") reply("");
if (group === "pr" && action === "checks") reply("[]");
if (group === "pr" && action === "merge") {
  const push = spawnSync("git", ["-C", process.env.AZFLOW_SHIM_REPO, "push", "origin",
    process.env.AZFLOW_SHIM_HEAD_SHA + ":refs/heads/main"], { encoding: "utf8" });
  if (push.status !== 0) { process.stderr.write(push.stderr || "push failed"); process.exit(1); }
  reply("merged");
}
if (group === "pr" && action === "view") {
  const comments = readComments();
  reply(JSON.stringify({
    number: Number(process.env.AZFLOW_SHIM_PR),
    url: "https://github.com/acme/demo/pull/" + process.env.AZFLOW_SHIM_PR,
    title: "Add checkout helper",
    body: readBody(),
    headRefName: process.env.AZFLOW_SHIM_BRANCH,
    baseRefName: "main",
    headRefOid: process.env.AZFLOW_SHIM_HEAD_SHA,
    state: "OPEN",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    isDraft: false,
    labels: [],
    comments: comments[String(args[2])] || [],
  }));
}
process.stderr.write("unexpected gh call: " + args.join(" ") + "\\n");
process.exit(1);
`;

async function setup(): Promise<{
  work: string;
  project: string;
  remote: string;
  env: Record<string, string>;
}> {
  const work = await mkdtemp(path.join(tmpdir(), "azflow-cli-"));
  const remote = path.join(work, "origin.git");
  const project = path.join(work, "project");
  const shim = path.join(work, "gh-shim.cjs");
  const log = path.join(work, "gh.log");
  git(work, ["init", "--bare", "--initial-branch=main", remote]);
  git(work, ["init", "--initial-branch=main", project]);
  git(project, ["config", "user.email", "test@example.com"]);
  git(project, ["config", "user.name", "Delivery Loop"]);
  await writeFile(path.join(project, "README.md"), "# demo\n", "utf8");
  git(project, ["add", "."]);
  git(project, ["commit", "-m", "init"]);
  git(project, ["remote", "add", "origin", remote]);
  git(project, ["push", "-u", "origin", "main"]);
  git(remote, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  await writeFile(shim, GH_SHIM, "utf8");
  await writeFile(log, "", "utf8");
  return {
    work,
    project,
    remote,
    env: {
      AZFLOW_GH: process.execPath + " " + shim,
      AZFLOW_SHIM_LOG: log,
      AZFLOW_SHIM_REPO: project,
      AZFLOW_SHIM_ISSUE: "7",
      AZFLOW_SHIM_PR: "9",
      AZFLOW_SHIM_ISSUE_STATE: path.join(work, "issue-state"),
      AZFLOW_SHIM_PR_BODY: path.join(work, "pr-body.txt"),
      AZFLOW_SHIM_PR_COMMENTS: path.join(work, "pr-comments.json"),
      AZFLOW_SHIM_BRANCH: "issue/t-0001-add-checkout-helper",
      AZFLOW_SHIM_HEAD_SHA: "",
    },
  };
}

const stateFile = (project: string): string => path.join(project, ".azflow", "state.json");

async function main(): Promise<void> {
  const { work, project, remote, env } = await setup();
  const cli = (args: readonly string[], extra: Record<string, string> = {}) => {
    const result = run(process.execPath, [azflow, ...args], project, { ...env, ...extra });
    return result;
  };
  const must = (args: readonly string[], extra: Record<string, string> = {}) => {
    const result = cli(args, extra);
    if (result.status !== 0) {
      throw new Error("azflow " + args.join(" ") + " failed: " + result.stderr.trim());
    }
    return result;
  };

  must(["init"]);
  must(["add", "Add checkout helper", "--touch", "src/cart/**"]);
  must(["add", "Add cart badge", "--touch", "src/badge/**", "--dep", "T-0001"]);

  // A task may not start before its dependency merged, nor past the parallel cap.
  const blocked = cli(["claim", "T-0002"]);
  assert.equal(blocked.status, 1, "a task with an unmerged dependency must not start");
  assert.match(blocked.stderr, /depends on unmerged T-0001/);

  // A claim is what starts the delivery contract, so it opens the linked issue
  // itself; a forgotten `azflow issue` step must not leave the work unlinkable.
  const claimedWithIssue = JSON.parse(must(["claim", "T-0001", "--label", "enhancement"]).stdout) as {
    worktree: string;
    branch: string;
  };
  const stateAfterClaim = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; issue: number | null }[];
  };
  assert.equal(stateAfterClaim.tasks.find((task) => task.id === "T-0001")?.issue, 7);
  const claimed = claimedWithIssue;
  await mkdir(path.join(claimed.worktree, "src", "cart"), { recursive: true });
  await writeFile(
    path.join(claimed.worktree, "src", "cart", "total.ts"),
    "export const total = (values: readonly number[]): number =>\n  values.reduce((sum, value) => sum + value, 0);\n",
    "utf8",
  );
  // A commit is refused while the index is empty, and a message the standard
  // forbids is refused before git records anything.
  const emptyStage = cli(["commit", "T-0001", "--type", "feat", "--scope", "cart", "--subject", "add total helper"]);
  assert.equal(emptyStage.status, 1, "an empty staging area must not produce a commit");
  assert.match(emptyStage.stderr, /staging area is empty/);

  git(claimed.worktree, ["add", "."]);

  // A stage is refused when the ledger records no static check at all, so an
  // unconfigured repository cannot commit on the strength of an empty check list.
  const unchecked = cli(["commit", "T-0001", "--type", "feat", "--scope", "cart", "--subject", "add total helper"]);
  assert.equal(unchecked.status, 2, "a commit without configured checks must be refused");
  assert.match(unchecked.stderr, /no static checks are configured/);
  const configured = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    config: { checks: string[] };
  };
  configured.config.checks = ['node -e "process.exit(0)"'];
  await writeFile(stateFile(project), JSON.stringify(configured, null, 2) + "\n", "utf8");

  const vague = cli(["commit", "T-0001", "--type", "feat", "--scope", "cart", "--subject", "update files"]);
  assert.equal(vague.status, 2, "a vague subject must be refused");
  assert.match(vague.stderr, /too vague/);

  const committed = JSON.parse(
    must(["commit", "T-0001", "--type", "feat", "--scope", "cart", "--subject", "add total helper"]).stdout,
  ) as { header: string; branch: string; pushed: boolean };
  assert.equal(committed.header, "feat(cart): add total helper");
  assert.equal(committed.pushed, true, "commit uploads the task branch automatically");
  assert.equal(git(claimed.worktree, ["log", "-1", "--format=%s"]), "feat(cart): add total helper");
  assert.match(git(claimed.worktree, ["log", "-1", "--format=%b"]), /Refs: #7/, "the commit cites the issue");
  assert.equal(
    git(remote, ["rev-parse", "refs/heads/" + claimed.branch]),
    git(claimed.worktree, ["rev-parse", "HEAD"]),
    "the commit is already on the remote",
  );

  // Every commit is scored before the next one is recorded, so a branch
  // cannot grow past a stage that no review ever saw.
  await writeFile(path.join(claimed.worktree, "src", "cart", "empty.ts"), "export const empty: readonly number[] = [];\n", "utf8");
  git(claimed.worktree, ["add", "src/cart/empty.ts"]);
  const unscoredHead = cli(["commit", "T-0001", "--type", "feat", "--scope", "cart", "--subject", "add empty list"]);
  assert.equal(unscoredHead.status, 2, "a stage before the head is scored must be refused");
  assert.match(unscoredHead.stderr, /has no review record/);
  git(claimed.worktree, ["restore", "--staged", "src/cart/empty.ts"]);
  await rm(path.join(claimed.worktree, "src", "cart", "empty.ts"), { force: true });

  // A pull request cannot be opened before its reviewed head is recorded. It
  // still uploads the task branch first, so a retry only needs the review.
  const early = cli(["pr", "T-0001"]);
  assert.equal(early.status, 1, "pr before review must fail");
  assert.match(early.stderr, /review is not recorded yet/);
  assert.equal(
    git(remote, ["rev-parse", "refs/heads/" + claimed.branch]),
    git(claimed.worktree, ["rev-parse", "HEAD"]),
    "pr pushed the branch before refusing the missing review",
  );

  const headSha = git(claimed.worktree, ["rev-parse", "HEAD"]);

  // Opening the pull request is when the stage stops being private, so the
  // project checks and the review must already be on record by then.
  const unreviewed = cli(["pr", "T-0001"]);
  assert.equal(unreviewed.status, 1, "pr before any record must fail");
  assert.match(unreviewed.stderr, /review is not recorded yet/);
  const reviewInput = {
    headSha: "",
    round: 1,
    diffFiles: [],
    reviewedFiles: ["src/cart/total.ts"],
    findings: [],
    carryOver: [],
    probes: [
      { id: "boundary", status: "passed", note: "empty list returns 0" },
      { id: "error-path", status: "na", note: "no error path in a pure fold" },
      { id: "resource", status: "na", note: "no allocation held" },
      { id: "concurrency", status: "na", note: "pure function" },
      { id: "regression", status: "passed", note: "new file only" },
      { id: "security", status: "na", note: "no external input" },
    ],
    dimensions: [
      { id: "correctness", status: "pass", note: "fold matches the sum contract" },
      { id: "performance", status: "pass", note: "single pass, no copies" },
      { id: "discipline", status: "pass", note: "typed, no any" },
      { id: "readability", status: "pass", note: "one expression, named" },
    ],
    verification: { command: "node --test", exitCode: 0, output: "pass 1" },
    previous: null,
    engine: "egm",
    reviewers: [
      {
        id: "egm-goldfish",
        persona: "codebase-details",
        status: "completed",
        freshContext: true,
        filesRead: ["src/cart/total.ts"],
      },
    ],
  };
  const inputPath = path.join(work, "review.json");
  await writeFile(inputPath, JSON.stringify(reviewInput, null, 2), "utf8");
  const firstRoundPath = path.join(work, "review-first-round.json");
  await writeFile(firstRoundPath, JSON.stringify({ ...reviewInput, round: 2 }, null, 2), "utf8");
  const stalePath = path.join(work, "review-stale.json");
  await writeFile(
    stalePath,
    JSON.stringify({ ...reviewInput, headSha: "0000000000000000000000000000000000000000" }, null, 2),
    "utf8",
  );
  const noReviewer = cli(["review", "T-0001", "--input", inputPath]);
  assert.equal(noReviewer.status, 1, "a review without a reviewer id must fail");
  assert.match(noReviewer.stderr, /requires --reviewer/);

  const selfReview = cli(["review", "T-0001", "--input", inputPath, "--reviewer", "primary"]);
  assert.equal(selfReview.status, 1, "the implementer may not review its own artifact");
  assert.match(selfReview.stderr, /is the implementer/);

  const stale = cli(["review", "T-0001", "--input", stalePath, "--reviewer", "reviewer-1"]);
  assert.equal(stale.status, 1, "a stale review head must fail");

  const withoutWorktree = cli(["review", "T-0002", "--input", inputPath]);
  assert.equal(withoutWorktree.status, 1, "a review without a claimed worktree must fail");
  assert.match(withoutWorktree.stderr, /requires a claimed worktree/);

  const skippedFirstRound = cli(["review", "T-0001", "--input", firstRoundPath, "--reviewer", "reviewer-1"]);
  assert.equal(skippedFirstRound.status, 1, "the first review must be round 1");
  assert.match(skippedFirstRound.stderr, /must be round 1/);

  // Independent review runs behind a short-lived window. Opening it records the
  // current head, and the window is what lets the EGM reviewers spawn.
  const reviewOpenBad = cli(["review-open", "T-9999"]);
  assert.equal(reviewOpenBad.status, 1, "review-open on an unknown task must fail");
  const openedWindow = JSON.parse(
    must(["review-open", "T-0001", "--reviewer", "egm-goldfish", "--json"]).stdout,
  ) as { window: { taskId: string; headSha: string; engine: string } };
  assert.equal(openedWindow.window.taskId, "T-0001");
  assert.equal(openedWindow.window.headSha, headSha);
  assert.equal(openedWindow.window.engine, "egm");

  must(["review", "T-0001", "--input", inputPath, "--scan", "--reviewer", "reviewer-1"]);
  // Opening the pull request is when the stage stops being private, so the
  // project checks must already be on record by then.
  const opened = JSON.parse(must(["pr", "T-0001"]).stdout) as { pr: number; draft: boolean };
  assert.equal(opened.pr, 9);
  assert.equal(opened.draft, true, "a pull request opens as a draft");
  const draftLog = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.ok(draftLog.includes("pr create --title"), "the pull request is created by gh");
  assert.ok(draftLog.includes("--draft"), "the pull request opens as a draft");
  assert.match(
    draftLog,
    /pr create --title feat\(cart\): add total helper \(#7\)/,
    "the title follows the conventional commit header and names the issue",
  );
  assert.ok(draftLog.includes("--body ## Linked Issue"), "the body opens with the fixed first section");
  assert.ok(draftLog.includes("pr comment 9"), "the recorded review report is posted as the first comment");
  for (const section of [
    "## Change summary",
    "## Verification & Dependencies",
    "## Review conclusion",
    "## Permission Notice",
  ]) {
    assert.ok(draftLog.includes(section), "the body carries " + section);
  }
  assert.ok(!draftLog.includes("exclusive human privilege"), "the notice no longer defers the merge");
  assert.ok(draftLog.includes("Closes #7:"), "the body closes the linked issue");
  assert.ok(/\(exit 0\)/.test(draftLog), "the body records the verification outcome");
  must(["ready", "T-0001"]);

  const state = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; status: string; issue: number | null; pr: number | null; review: { verdict: string; headSha: string; score: number } | null }[];
  };
  const task = state.tasks[0];
  assert.ok(task);
  assert.equal(task.issue, 7);
  assert.equal(task.pr, 9);
  assert.equal(task.review?.verdict, "PASS");
  assert.equal(task.review?.headSha, headSha);


  const replayedRound = cli(["review", "T-0001", "--input", inputPath, "--reviewer", "reviewer-1"]);
  assert.equal(replayedRound.status, 1, "a review round may not be replayed");
  assert.match(replayedRound.stderr, /must advance by one/);

  const missingPreviousPath = path.join(work, "review-missing-previous.json");
  await writeFile(
    missingPreviousPath,
    JSON.stringify({ ...reviewInput, round: 2 }, null, 2),
    "utf8",
  );
  const missingPrevious = cli(["review", "T-0001", "--input", missingPreviousPath, "--reviewer", "reviewer-1"]);
  assert.equal(missingPrevious.status, 1, "a later review must carry the previous record");
  assert.match(missingPrevious.stderr, /must include a previous record/);

  const mismatchedPreviousPath = path.join(work, "review-mismatched-previous.json");
  await writeFile(
    mismatchedPreviousPath,
    JSON.stringify(
      { ...reviewInput, round: 2, previous: { score: (task.review?.score ?? 0) + 0.01, resolved: [] } },
      null,
      2,
    ),
    "utf8",
  );
  const mismatchedPrevious = cli(["review", "T-0001", "--input", mismatchedPreviousPath, "--reviewer", "reviewer-1"]);
  assert.equal(mismatchedPrevious.status, 1, "a later review must match the recorded score");
  assert.match(mismatchedPrevious.stderr, /does not match recorded round/);

  // Ship repairs a missing issue link, but still refuses a self-review or a
  // commit that bypassed azflow. The dry run predicts the repair without
  // mutating the remote; the real run writes the repaired body before merging.
  const bodyPath = env.AZFLOW_SHIM_PR_BODY ?? "";
  const savedBody = await readFile(bodyPath, "utf8");
  await writeFile(bodyPath, "## Change summary\n\nBody was edited by hand.\n", "utf8");
  const unlinked = cli(["ship", "T-0001", "--json", "--dry-run"], { AZFLOW_SHIM_HEAD_SHA: headSha });
  assert.equal(unlinked.status, 0, "dry-run should predict the automatic issue-link repair");
  assert.ok(
    !(JSON.parse(unlinked.stdout) as { failed: string[] }).failed.includes("issue-linked"),
    "the issue-linked gate should pass when ship can repair the body",
  );
  assert.match(unlinked.stdout, /will restore it before merging/);
  assert.equal(await readFile(bodyPath, "utf8"), "## Change summary\n\nBody was edited by hand.\n");
  await writeFile(bodyPath, savedBody, "utf8");

  const withSelfReview = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; owner: string; review: { reviewer: string } | null }[];
  };
  const firstRecord = withSelfReview.tasks.find((item) => item.id === "T-0001");
  if (firstRecord === undefined || firstRecord.review === null) {
    throw new Error("T-0001 must exist with a recorded review");
  }
  firstRecord.review.reviewer = firstRecord.owner;
  await writeFile(stateFile(project), JSON.stringify(withSelfReview, null, 2) + "\n", "utf8");
  const selfReviewed = cli(["ship", "T-0001", "--json", "--dry-run"], { AZFLOW_SHIM_HEAD_SHA: headSha });
  assert.equal(selfReviewed.status, 2, "a review signed by the implementer must not merge");
  assert.ok((JSON.parse(selfReviewed.stdout) as { failed: string[] }).failed.includes("reviewer-independent"));
  firstRecord.review.reviewer = "reviewer-1";
  await writeFile(stateFile(project), JSON.stringify(withSelfReview, null, 2) + "\n", "utf8");

  await writeFile(path.join(claimed.worktree, "src", "cart", "bypass.ts"), "export const bypass = true;\n", "utf8");
  git(claimed.worktree, ["add", "src/cart/bypass.ts"]);
  git(claimed.worktree, ["commit", "-m", "feat(cart): bypass the loop"]);
  const bypassed = git(claimed.worktree, ["rev-parse", "HEAD"]);
  const unscoredShip = cli(["ship", "T-0001", "--json", "--dry-run"], { AZFLOW_SHIM_HEAD_SHA: bypassed });
  assert.equal(unscoredShip.status, 2, "a commit the loop never scored must not merge");
  assert.ok((JSON.parse(unscoredShip.stdout) as { failed: string[] }).failed.includes("stage-reviews"));
  git(claimed.worktree, ["reset", "--hard", headSha]);

  const shipped = must(["ship", "T-0001"], { AZFLOW_SHIM_HEAD_SHA: headSha });
  assert.match(shipped.stdout, /Merged and synced main/);
  const log = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.match(log, /pr merge 9 --squash --delete-branch/);
  assert.match(log, /issue close 7/);
  assert.match(log, /issue view 7 --json state/, "ship proves the issue closed after merging");
  assert.match(log, /pr edit 9 --body ## Linked Issue/, "ship refreshes the body before merging");

  const merged = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { status: string; review: { verdict: string } | null }[];
  };
  assert.equal(merged.tasks[0]?.status, "merged");
  assert.equal(git(remote, ["rev-parse", "refs/heads/main"]), headSha, "base carries the merged commit");
  assert.equal(git(project, ["rev-parse", "main"]), headSha, "local base fast-forwarded");
  assert.equal(git(project, ["rev-parse", "--abbrev-ref", "HEAD"]), "main");

  // A recorded verification that exited non-zero blocks the pull request. The
  // escape opens it on purpose, and the blocking issues stay in the body.
  const second = JSON.parse(must(["claim", "T-0002", "--issue", "8"], { AZFLOW_SHIM_ISSUE: "8" }).stdout) as {
    worktree: string;
    branch: string;
  };
  await mkdir(path.join(second.worktree, "src", "badge"), { recursive: true });
  await writeFile(
    path.join(second.worktree, "src", "badge", "count.ts"),
    "export const count = (items: readonly unknown[]): number => items.length;\n",
    "utf8",
  );
  git(second.worktree, ["add", "."]);
  must(["commit", "T-0002", "--type", "feat", "--scope", "badge", "--subject", "add count helper"]);
  assert.equal(
    git(remote, ["rev-parse", "refs/heads/" + second.branch]),
    git(second.worktree, ["rev-parse", "HEAD"]),
    "the second task branch was uploaded by commit",
  );
  const secondHead = git(second.worktree, ["rev-parse", "HEAD"]);
  const redInput = {
    ...reviewInput,
    headSha: secondHead,
    reviewedFiles: ["src/badge/count.ts"],
    // No review window is open and no reviewer is attested, so this round must
    // fail on the independent-review gate as well as the red verification.
    reviewers: [],
    verification: { command: "node --test", exitCode: 1, output: "fail 1" },
  };
  const redPath = path.join(work, "review-red.json");
  await writeFile(redPath, JSON.stringify(redInput, null, 2), "utf8");
  const redReview = cli(["review", "T-0002", "--input", redPath, "--scan", "--reviewer", "reviewer-1"]);
  assert.equal(redReview.status, 2, "a red verification scores FAIL");
  assert.match(
    redReview.stdout,
    /Independent \(EGM\) review not attested/,
    "a review without an open window and valid attestation cannot pass",
  );
  const redPull = cli(["pr", "T-0002"], { AZFLOW_SHIM_PR: "10" });
  assert.equal(redPull.status, 1, "a red verification must not open the pull request");
  assert.match(redPull.stderr, /did not exit 0/);
  const forced = JSON.parse(must(["pr", "T-0002", "--allow-unverified"], { AZFLOW_SHIM_PR: "10" }).stdout) as {
    pr: number;
  };
  assert.equal(forced.pr, 10);
  const forcedLog = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.match(forcedLog, /pr create --title feat\(badge\): add count helper \(#8\)/);


  // A stage is only named when the configured static checks are green. The
  // ledger records the failing command, so no message is produced from it.
  must(["add", "Add note reader", "--touch", "src/notes/**"]);
  const third = JSON.parse(must(["claim", "T-0003", "--issue", "11"], { AZFLOW_SHIM_ISSUE: "11" }).stdout) as {
    worktree: string;
    branch: string;
  };
  await mkdir(path.join(third.worktree, "src", "notes"), { recursive: true });
  await writeFile(path.join(third.worktree, "src", "notes", "read.ts"), "export const read = 1;\n", "utf8");
  git(third.worktree, ["add", "."]);
  const headBefore = git(third.worktree, ["rev-parse", "HEAD"]);
  const ledger = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    config: { checks: string[] };
  };
  ledger.config.checks = ['node -e "process.exit(3)"'];
  await writeFile(stateFile(project), JSON.stringify(ledger, null, 2) + "\n", "utf8");
  const redCheck = cli(["commit", "T-0003", "--type", "feat", "--scope", "notes", "--subject", "add note reader"]);
  assert.equal(redCheck.status, 2, "a failing static check must not record a stage");
  assert.match(redCheck.stderr, /static check failed: node -e/);
  assert.equal(git(third.worktree, ["rev-parse", "HEAD"]), headBefore, "the red stage left no commit");
  ledger.config.checks = ['node -e "process.exit(0)"'];
  await writeFile(stateFile(project), JSON.stringify(ledger, null, 2) + "\n", "utf8");
  const green = must(["commit", "T-0003", "--type", "feat", "--scope", "notes", "--subject", "add note reader"]);
  assert.match(green.stdout, /"command": "node -e /, "the recorded stage cites the check it ran");
  assert.notEqual(git(third.worktree, ["rev-parse", "HEAD"]), headBefore, "the green stage recorded a commit");
  const headAfterGreen = git(third.worktree, ["rev-parse", "HEAD"]);

  // A stage must stay inside the task's declared touch scopes, so a commit can
  // never smuggle a file the lease did not cover into the branch.
  await writeFile(path.join(third.worktree, "src", "cart", "total.ts"), "export const total = 0;\n", "utf8");
  git(third.worktree, ["add", "src/cart/total.ts"]);
  const outOfScope = cli([
    "commit",
    "T-0003",
    "--type",
    "feat",
    "--scope",
    "cart",
    "--subject",
    "add cart total helper",
  ]);
  assert.equal(outOfScope.status, 2, "a commit outside the task's touch scopes is refused");
  assert.match(outOfScope.stderr, /outside the declared touch scopes/);
  assert.match(
    git(third.worktree, ["diff", "--cached", "--name-only"]),
    /src\/cart\/total\.ts/,
    "the refused stage stays staged",
  );
  assert.equal(git(third.worktree, ["rev-parse", "HEAD"]), headAfterGreen, "the refused stage made no commit");

  // A merge that cannot prove its issue closed is reported, not accepted.
  must(["add", "Add writer helper", "--touch", "src/writer/**"]);
  const fourth = JSON.parse(must(["claim", "T-0004", "--issue", "12"], { AZFLOW_SHIM_ISSUE: "12" }).stdout) as {
    worktree: string;
    branch: string;
  };
  await mkdir(path.join(fourth.worktree, "src", "writer"), { recursive: true });
  await writeFile(
    path.join(fourth.worktree, "src", "writer", "write.ts"),
    "export const write = (value: string): string => value;\n",
    "utf8",
  );
  git(fourth.worktree, ["add", "."]);
  must(["commit", "T-0004", "--type", "feat", "--scope", "writer", "--subject", "add write helper"]);
  const fourthHead = git(fourth.worktree, ["rev-parse", "HEAD"]);
  const cleanPath = path.join(work, "review-clean.json");
  await writeFile(
    cleanPath,
    JSON.stringify({ ...reviewInput, headSha: fourthHead, reviewedFiles: ["src/writer/write.ts"] }, null, 2),
    "utf8",
  );
  must(["review-open", "T-0004", "--reviewer", "egm-goldfish"]);
  must(["review", "T-0004", "--input", cleanPath, "--scan", "--reviewer", "reviewer-2"]);
  must(["pr", "T-0004"], { AZFLOW_SHIM_PR: "11" });
  must(["ready", "T-0004"]);
  const stuck = cli(["ship", "T-0004"], { AZFLOW_SHIM_HEAD_SHA: fourthHead, AZFLOW_SHIM_ISSUE_STUCK: "1" });
  assert.equal(stuck.status, 1, "a merge whose issue stays open is a failed delivery");
  assert.match(stuck.stderr, /is not CLOSED/);

  // The delayed-closure path repairs exactly that one status and nothing else.
  const alreadyMerged = cli(["ship", "T-0001", "--verify-issue"]);
  assert.equal(alreadyMerged.status, 1, "verify-issue only repairs a merge whose issue stayed open");
  assert.match(alreadyMerged.stderr, /only finishes a merged pull request whose issue is still open/);
  const recovered = must(["ship", "T-0004", "--verify-issue"]);
  assert.match(recovered.stdout, /is CLOSED and T-0004 is merged/);
  const recoveredState = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; status: string }[];
  };
  assert.equal(recoveredState.tasks.find((item) => item.id === "T-0004")?.status, "merged");

  // A verified branch must never stall on a missing pull request: `gh pr create`
  // is refused inside the project, so ship opens the pull request itself and
  // then judges the very pull request it just opened.
  must(["add", "Add token helper", "--touch", "src/token/**"]);
  const fifth = JSON.parse(must(["claim", "T-0005"], { AZFLOW_SHIM_ISSUE: "13" }).stdout) as {
    worktree: string;
    branch: string;
  };
  await mkdir(path.join(fifth.worktree, "src", "token"), { recursive: true });
  await writeFile(
    path.join(fifth.worktree, "src", "token", "token.ts"),
    "export const token = (value: string): string => value.trim();\n",
    "utf8",
  );
  git(fifth.worktree, ["add", "."]);
  must(["commit", "T-0005", "--type", "feat", "--scope", "token", "--subject", "add token helper"]);
  const fifthHead = git(fifth.worktree, ["rev-parse", "HEAD"]);
  const fifthReviewPath = path.join(work, "review-fifth.json");
  await writeFile(
    fifthReviewPath,
    JSON.stringify({ ...reviewInput, headSha: fifthHead, reviewedFiles: ["src/token/token.ts"] }, null, 2),
    "utf8",
  );
  must(["review-open", "T-0005", "--reviewer", "egm-goldfish"]);
  must(["review", "T-0005", "--input", fifthReviewPath, "--scan", "--reviewer", "reviewer-3"]);
  const beforeShip = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; pr: number | null; status: string }[];
  };
  assert.equal(
    beforeShip.tasks.find((item) => item.id === "T-0005")?.pr,
    null,
    "the task reaches ship without any pull request",
  );

  // A dry run cannot judge gates without the pull request, so it says so instead
  // of opening one; only the live run creates it.
  const fifthDry = cli(["ship", "T-0005", "--json", "--dry-run"], { AZFLOW_SHIM_HEAD_SHA: fifthHead });
  assert.equal(fifthDry.status, 1, "a dry run must not open a pull request");
  assert.match(fifthDry.stderr, /a live ship opens one automatically/);

  const shippedFifth = must(["ship", "T-0005"], { AZFLOW_SHIM_HEAD_SHA: fifthHead, AZFLOW_SHIM_PR: "12" });
  assert.match(shippedFifth.stderr, /opened pull request #12 for T-0005/, "ship announces the open on stderr");
  assert.match(shippedFifth.stdout, /Merged and synced main/);
  const fifthLog = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.match(fifthLog, /pr create --title feat\(token\): add token helper \(#13\)/);
  assert.match(fifthLog, /Closes #13/, "the automatic pull request closes the linked issue");
  const fifthCreate = fifthLog.split("\n").find((line) => line.includes("pr create --title feat(token)")) ?? "";
  assert.ok(fifthCreate !== "" && !fifthCreate.includes("--draft"), "the automatic pull request is ready, not a draft");
  assert.match(fifthLog, /pr merge 12 --squash --delete-branch/);
  const fifthState = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; pr: number | null; status: string }[];
  };
  const fifthTask = fifthState.tasks.find((item) => item.id === "T-0005");
  assert.equal(fifthTask?.pr, 12, "ship records the pull request it opened");
  assert.equal(fifthTask?.status, "merged");

  // Uploads and review comments are automatic, not opt-in. This task proves a
  // commit and PR upload themselves, a review posts its fixed report by default,
  // free-form text is refused, and ship repairs a dropped comment before merge.
  must(["add", "Add promo helper", "--touch", "src/promo/**"]);
  const sixth = JSON.parse(must(["claim", "T-0006", "--issue", "14"], { AZFLOW_SHIM_ISSUE: "14" }).stdout) as {
    worktree: string;
    branch: string;
  };
  await mkdir(path.join(sixth.worktree, "src", "promo"), { recursive: true });
  await writeFile(
    path.join(sixth.worktree, "src", "promo", "promo.ts"),
    "export const promo = (value: string): string => value.toUpperCase();\n",
    "utf8",
  );
  git(sixth.worktree, ["add", "."]);
  const sixthCommit = JSON.parse(
    must(["commit", "T-0006", "--type", "feat", "--scope", "promo", "--subject", "add promo helper"]).stdout,
  ) as { headSha: string; pushed: boolean };
  assert.equal(sixthCommit.pushed, true, "the commit uploads its branch");
  const sixthHead = git(sixth.worktree, ["rev-parse", "HEAD"]);
  assert.equal(sixthCommit.headSha, sixthHead);
  assert.equal(
    git(remote, ["rev-parse", "refs/heads/" + sixth.branch]),
    sixthHead,
    "the remote already has the commit",
  );
  const explicitPush = JSON.parse(must(["push", "T-0006"]).stdout) as { headSha: string; pushed: boolean };
  assert.equal(explicitPush.pushed, true, "azflow push is an idempotent retry for a completed upload");
  assert.equal(explicitPush.headSha, sixthHead);

  const sixthReviewPath = path.join(work, "review-sixth.json");
  await writeFile(
    sixthReviewPath,
    JSON.stringify({ ...reviewInput, headSha: sixthHead, reviewedFiles: ["src/promo/promo.ts"] }, null, 2),
    "utf8",
  );
  must(["review-open", "T-0006", "--reviewer", "egm-goldfish"]);
  const sixthRound = JSON.parse(
    must(["review", "T-0006", "--input", sixthReviewPath, "--scan", "--reviewer", "reviewer-6", "--json"]).stdout,
  ) as { record: { score: number; round: number }; posted: boolean };
  assert.equal(sixthRound.record.round, 1);
  assert.equal(sixthRound.posted, false, "a review with no pull request posts nothing");
  const commentsPath = env.AZFLOW_SHIM_PR_COMMENTS ?? "";
  const commentsFor = async (pr: number): Promise<{ body: string }[]> => {
    const stored = JSON.parse(await readFile(commentsPath, "utf8")) as Record<string, { body: string }[]>;
    return stored[String(pr)] ?? [];
  };
  assert.equal((await commentsFor(13)).length, 0, "no comment exists before the pull request");

  const sixthPr = JSON.parse(
    must(["pr", "T-0006"], { AZFLOW_SHIM_PR: "13" }).stdout,
  ) as { pr: number; commentPosted: boolean; commentError: string | null };
  assert.equal(sixthPr.pr, 13);
  assert.equal(sixthPr.commentPosted, true, "opening the pull request posts the review report");
  assert.equal(sixthPr.commentError, null);
  const afterPr = await commentsFor(13);
  assert.equal(afterPr.length, 1);
  assert.match(afterPr[0]?.body ?? "", /Autonomous Code Review Report \(Round 1\)/);
  must(["ready", "T-0006"]);

  // A second round at the same head carries the prior score and posts by
  // default, because the pull request now exists.
  const sixthSecondPath = path.join(work, "review-sixth-r2.json");
  await writeFile(
    sixthSecondPath,
    JSON.stringify(
      {
        ...reviewInput,
        headSha: sixthHead,
        round: 2,
        reviewedFiles: ["src/promo/promo.ts"],
        previous: { score: sixthRound.record.score, resolved: [] },
      },
      null,
      2,
    ),
    "utf8",
  );
  must(["review-open", "T-0006", "--reviewer", "egm-goldfish"]);
  const sixthSecond = JSON.parse(
    must(["review", "T-0006", "--input", sixthSecondPath, "--scan", "--reviewer", "reviewer-7", "--json"]).stdout,
  ) as { posted: boolean; commentError: string | null };
  assert.equal(sixthSecond.posted, true, "a review on an open pull request posts by default");
  assert.equal(sixthSecond.commentError, null);
  const afterSecond = await commentsFor(13);
  assert.equal(afterSecond.length, 2);
  assert.match(afterSecond[1]?.body ?? "", /Autonomous Code Review Report \(Round 2\)/);

  // A missed post is repairable from the recorded report, and only the exact
  // template is accepted.
  must(["review-post", "T-0006", "--round", "1"]);
  assert.equal((await commentsFor(13)).length, 3, "review-post republishes the recorded round");
  const secondReportPath = path.join(project, ".azflow", "reviews", "T-0006-r2.md");
  const secondReport = await readFile(secondReportPath, "utf8");
  await writeFile(secondReportPath, "LGTM\n", "utf8");
  const tampered = cli(["review-post", "T-0006", "--round", "2"]);
  assert.equal(tampered.status, 2, "a hand-written body cannot pass as the report template");
  assert.match(tampered.stderr, /does not match the required template/);
  await writeFile(secondReportPath, secondReport, "utf8");

  // The comment is a merge gate, not a convenience: a dry run reports the gap,
  // and a live ship re-posts the fixed report before merging.
  await writeFile(commentsPath, "{}\n", "utf8");
  const missingComment = cli(["ship", "T-0006", "--json", "--dry-run"], { AZFLOW_SHIM_HEAD_SHA: sixthHead });
  assert.equal(missingComment.status, 2, "a pull request without its review comment must not merge");
  assert.ok(
    (JSON.parse(missingComment.stdout) as { failed: string[] }).failed.includes("review-comment"),
    "the review-comment gate blocks the merge",
  );
  const repairedShip = must(["ship", "T-0006"], { AZFLOW_SHIM_HEAD_SHA: sixthHead });
  assert.match(repairedShip.stdout, /Merged and synced main/);
  const repaired = await commentsFor(13);
  assert.equal(repaired.length, 1, "ship reposted exactly one templated report");
  assert.match(repaired[0]?.body ?? "", /Autonomous Code Review Report \(Round 2\)/);

  // The ledger keeps the implementer and one scored stage per commit.
  const finalState = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: {
      id: string;
      owner: string | null;
      stageReviews: Record<string, { reviewer: string; verdict: string; score: number }>;
    }[];
  };
  const firstTask = finalState.tasks.find((item) => item.id === "T-0001");
  assert.equal(firstTask?.owner, "primary", "claim records the implementer");
  assert.deepEqual(Object.keys(firstTask?.stageReviews ?? {}), [headSha], "each commit carries one stage record");
  assert.equal(Object.values(firstTask?.stageReviews ?? {})[0]?.reviewer, "reviewer-1");

  // A machine-checkable goal reports its verification, and the CLI stays the
  // single place where the model writes it down.
  const goalStarted = must([
    "goal",
    "start",
    "Ship the feature",
    "--done-when",
    "file README.md exists",
    "--allow",
    "npm test",
    "--auto-budget",
  ]);
  assert.match(goalStarted.stdout, /ACTIVE GOAL: Ship the feature/);
  const goalVerified = must(["goal", "verify"]);
  assert.match(goalVerified.stdout, /\[pass\] file README\.md exists/);
  assert.match(goalVerified.stdout, /Satisfied: yes/);

  await rm(work, { recursive: true, force: true });
  console.log("cli.test.ts: all assertions passed");
}

main().catch((error: unknown) => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
