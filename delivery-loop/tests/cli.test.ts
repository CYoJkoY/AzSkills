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
if (group === "auth" && action === "status") reply("ok");
if (group === "issue" && action === "create") reply("https://github.com/acme/demo/issues/" + process.env.AZFLOW_SHIM_ISSUE);
if (group === "issue" && (action === "close" || action === "comment")) reply("");
if (group === "pr" && action === "create") reply("https://github.com/acme/demo/pull/" + process.env.AZFLOW_SHIM_PR);
if (group === "pr" && action === "comment") reply("");
if (group === "pr" && action === "ready") reply("");
if (group === "pr" && action === "checks") reply("[]");
if (group === "pr" && action === "merge") {
  const push = spawnSync("git", ["-C", process.env.AZFLOW_SHIM_REPO, "push", "origin",
    process.env.AZFLOW_SHIM_HEAD_SHA + ":refs/heads/main"], { encoding: "utf8" });
  if (push.status !== 0) { process.stderr.write(push.stderr || "push failed"); process.exit(1); }
  reply("merged");
}
if (group === "pr" && action === "view") {
  reply(JSON.stringify({
    number: Number(process.env.AZFLOW_SHIM_PR),
    url: "https://github.com/acme/demo/pull/" + process.env.AZFLOW_SHIM_PR,
    title: "Add checkout helper",
    body: "",
    headRefName: process.env.AZFLOW_SHIM_BRANCH,
    baseRefName: "main",
    headRefOid: process.env.AZFLOW_SHIM_HEAD_SHA,
    state: "OPEN",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    isDraft: false,
    labels: [],
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

  must(["issue", "T-0001", "--label", "enhancement"]);
  const claimed = JSON.parse(must(["claim", "T-0001"]).stdout) as { worktree: string; branch: string };
  await mkdir(path.join(claimed.worktree, "src", "cart"), { recursive: true });
  await writeFile(
    path.join(claimed.worktree, "src", "cart", "total.ts"),
    "export const total = (values: readonly number[]): number =>\n  values.reduce((sum, value) => sum + value, 0);\n",
    "utf8",
  );
  git(claimed.worktree, ["add", "."]);
  git(claimed.worktree, ["commit", "-m", "feat(cart): add total helper"]);

  // A pull request cannot reference a branch the remote has never seen.
  const early = cli(["pr", "T-0001"]);
  assert.equal(early.status, 1, "pr before push must fail");
  assert.match(early.stderr, /push issue\/t-0001/);

  git(claimed.worktree, ["push", "-u", "origin", claimed.branch]);
  const headSha = git(claimed.worktree, ["rev-parse", "HEAD"]);

  const opened = JSON.parse(must(["pr", "T-0001"]).stdout) as { pr: number; draft: boolean };
  assert.equal(opened.pr, 9);
  assert.equal(opened.draft, true, "a pull request opens as a draft");
  const draftLog = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.ok(draftLog.includes("pr create --title"), "the pull request is created by gh");
  assert.ok(draftLog.includes("--draft"), "the pull request opens as a draft");
  must(["ready", "T-0001"]);

  // A review that names a different commit must be rejected, not scored.
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
  const stale = cli(["review", "T-0001", "--input", stalePath]);
  assert.equal(stale.status, 1, "a stale review head must fail");

  const withoutWorktree = cli(["review", "T-0002", "--input", inputPath]);
  assert.equal(withoutWorktree.status, 1, "a review without a claimed worktree must fail");
  assert.match(withoutWorktree.stderr, /requires a claimed worktree/);

  const skippedFirstRound = cli(["review", "T-0001", "--input", firstRoundPath]);
  assert.equal(skippedFirstRound.status, 1, "the first review must be round 1");
  assert.match(skippedFirstRound.stderr, /must be round 1/);

  must(["review", "T-0001", "--input", inputPath, "--scan"]);
  const state = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { id: string; status: string; issue: number | null; pr: number | null; review: { verdict: string; headSha: string; score: number } | null }[];
  };
  const task = state.tasks[0];
  assert.ok(task);
  assert.equal(task.issue, 7);
  assert.equal(task.pr, 9);
  assert.equal(task.review?.verdict, "PASS");
  assert.equal(task.review?.headSha, headSha);

  const replayedRound = cli(["review", "T-0001", "--input", inputPath]);
  assert.equal(replayedRound.status, 1, "a review round may not be replayed");
  assert.match(replayedRound.stderr, /must advance by one/);

  const missingPreviousPath = path.join(work, "review-missing-previous.json");
  await writeFile(
    missingPreviousPath,
    JSON.stringify({ ...reviewInput, round: 2 }, null, 2),
    "utf8",
  );
  const missingPrevious = cli(["review", "T-0001", "--input", missingPreviousPath]);
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
  const mismatchedPrevious = cli(["review", "T-0001", "--input", mismatchedPreviousPath]);
  assert.equal(mismatchedPrevious.status, 1, "a later review must match the recorded score");
  assert.match(mismatchedPrevious.stderr, /does not match recorded round/);

  const shipped = must(["ship", "T-0001"], { AZFLOW_SHIM_HEAD_SHA: headSha });
  assert.match(shipped.stdout, /Merged and synced main/);
  const log = await readFile(env.AZFLOW_SHIM_LOG ?? "", "utf8");
  assert.match(log, /pr merge 9 --squash --delete-branch/);
  assert.match(log, /issue close 7/);

  const merged = JSON.parse(await readFile(stateFile(project), "utf8")) as {
    tasks: { status: string; review: { verdict: string } | null }[];
  };
  assert.equal(merged.tasks[0]?.status, "merged");
  assert.equal(git(remote, ["rev-parse", "refs/heads/main"]), headSha, "base carries the merged commit");
  assert.equal(git(project, ["rev-parse", "main"]), headSha, "local base fast-forwarded");
  assert.equal(git(project, ["rev-parse", "--abbrev-ref", "HEAD"]), "main");

  await rm(work, { recursive: true, force: true });
  console.log("cli.test.ts: all assertions passed");
}

main().catch((error: unknown) => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
