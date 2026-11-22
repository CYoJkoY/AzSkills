/*
 * Commit and pull request message rules for the delivery loop.
 *
 * The rules are code, not prose: a message that violates them is refused before
 * it reaches git or GitHub, so an unattended run cannot drift into vague
 * subjects, non-ASCII punctuation, or a pull request body with a missing
 * section. Everything here is pure and deterministic, which keeps it testable
 * without git, gh, or a network.
 */

export const COMMIT_TYPES = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "docs",
  "chore",
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

const TYPE_SET: ReadonlySet<string> = new Set<string>(COMMIT_TYPES);

/** Subjects that describe no reviewable change, so they can never be shipped. */
const VAGUE_SUBJECTS: readonly RegExp[] = [
  /\bupdate (?:the )?files?\b/,
  /\bmisc(?:ellaneous)? fixes?\b/,
  /\bwip\b/,
  /\bvarious (?:changes|fixes|updates)\b/,
  /\bstuff\b/,
];

const HEADER_HARD_LIMIT = 72;
const HEADER_TARGET_LIMIT = 50;
const BODY_LINE_LIMIT = 72;
const PR_TITLE_LIMIT = 72;

const PR_SECTIONS = [
  "Linked Issue",
  "Change summary",
  "Verification & Dependencies",
  "Review conclusion",
  "Permission Notice",
] as const;

const PR_DIMENSIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: "correctness", label: "Correctness & Regression" },
  { id: "performance", label: "Performance Gain" },
  { id: "compatibility", label: "Compatibility & Architecture" },
  { id: "readability", label: "Readability & Commit Completeness" },
];

/**
 * The notice closes every generated pull request. Merge authority is delegated
 * when the plugin is installed, so the notice must never claim a manual step
 * that the loop does not wait for.
 */
export const DEFAULT_PERMISSION_NOTICE =
  "Delivery is unattended: the agent opens this pull request, runs the review, " +
  "closes the linked issue, and merges through `azflow ship` as soon as every " +
  "gate is green. Installing the plugin delegates that authority, so no " +
  "per-action confirmation is requested. To withhold merge authority, run " +
  "`azflow init --autonomy manual`.";

export interface CommitHeader {
  readonly type: string;
  readonly scope: string | null;
  readonly breaking: boolean;
  readonly subject: string;
}

export interface MessageCheck {
  readonly violations: string[];
  readonly warnings: string[];
}

const emptyCheck = (): MessageCheck => ({ violations: [], warnings: [] });

/** Character codes outside printable ASCII plus real LF. */
export function asciiIssues(text: string): { index: number; code: number }[] {
  const issues: { index: number; code: number }[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code === 0x0a) continue;
    if (code < 0x20 || code > 0x7e) issues.push({ index, code });
  }
  return issues;
}

function describeCode(code: number): string {
  return code < 0x20
    ? "control character 0x" + code.toString(16).padStart(2, "0")
    : "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}

/** Violations for non-ASCII text and for literal escape sequences such as `\n`. */
export function asciiViolations(text: string, label: string, limit = 3): string[] {
  const violations = asciiIssues(text)
    .slice(0, limit)
    .map((issue) => label + " has " + describeCode(issue.code) + " at index " + String(issue.index));
  const escape = /\\[nrt0]/.exec(text);
  if (escape !== null) {
    violations.push(label + ' contains the literal escape sequence "' + escape[0] + '"');
  }
  return violations;
}

/** Splits a commit message into header, body, and footer lines. */
function splitMessage(message: string): { header: string; body: string[]; footer: string[] } {
  const lines = message.replace(/\r\n/g, "\n").replace(/\s+$/, "").split("\n");
  const header = lines[0] ?? "";
  const rest = lines.slice(1);
  while (rest.length > 0 && (rest[0] ?? "").trim() === "") rest.shift();
  const footer: string[] = [];
  while (rest.length > 0) {
    const last = rest[rest.length - 1] ?? "";
    if (last.trim() === "") {
      rest.pop();
      continue;
    }
    if (/^(?:Refs|BREAKING CHANGE):/.test(last)) {
      footer.unshift(last);
      rest.pop();
      continue;
    }
    break;
  }
  return { header, body: rest, footer };
}

export function parseCommitHeader(line: string): CommitHeader | null {
  const match = /^([a-z]+)(?:\(([^()]+)\))?(!)?: (.+)$/.exec(line);
  if (match === null) return null;
  const type = match[1] ?? "";
  const scope = match[2] ?? null;
  const subject = (match[4] ?? "").trim();
  if (type === "" || subject === "") return null;
  return { type, scope, breaking: match[3] === "!", subject };
}

function checkSubject(subject: string, header: string): MessageCheck {
  const check = emptyCheck();
  if (!/^[a-z]/.test(subject)) {
    check.violations.push('subject must start with a lowercase verb in its base form, got "' + subject + '"');
  }
  if (/\.$/.test(subject)) check.violations.push("subject must not end with a period");
  if (/#\d+/.test(header)) check.violations.push("header must not reference an issue or pull request id; use the Refs footer");
  for (const pattern of VAGUE_SUBJECTS) {
    if (pattern.test(subject)) {
      check.violations.push('subject "' + subject + '" is too vague; name the module, file, or mechanism');
      break;
    }
  }
  if (header.length > HEADER_HARD_LIMIT) {
    check.violations.push("header is " + String(header.length) + " characters; the hard limit is " + String(HEADER_HARD_LIMIT));
  } else if (header.length > HEADER_TARGET_LIMIT) {
    check.warnings.push("header is " + String(header.length) + " characters; " + String(HEADER_TARGET_LIMIT) + " is the target");
  }
  return check;
}

/**
 * Validates one commit message against the delivery standard.
 * `issueId` is the task issue; the footer must carry exactly that reference.
 */
export function validateCommitMessage(
  message: string,
  options: { readonly issueId: number | null },
): MessageCheck {
  const check = emptyCheck();
  check.violations.push(...asciiViolations(message, "commit message"));

  const normalized = message.replace(/\r\n/g, "\n");
  const { header, body, footer } = splitMessage(normalized);
  const parsed = parseCommitHeader(header);
  if (parsed === null) {
    check.violations.push("header must match <type>(<scope>)[!]: <imperative subject>");
    return check;
  }
  if (!TYPE_SET.has(parsed.type)) {
    check.violations.push(
      'unknown type "' + parsed.type + '"; allowed types are ' + COMMIT_TYPES.join(", "),
    );
  }
  if (parsed.scope !== null && !/^[a-z0-9][a-z0-9._-]*$/.test(parsed.scope)) {
    check.violations.push('scope "' + parsed.scope + '" must be lowercase kebab-case');
  }
  const subjectCheck = checkSubject(parsed.subject, header);
  check.violations.push(...subjectCheck.violations);
  check.warnings.push(...subjectCheck.warnings);

  for (const line of body) {
    if (line.length > BODY_LINE_LIMIT) {
      check.violations.push(
        "body line exceeds " + String(BODY_LINE_LIMIT) + " characters: " + JSON.stringify(line.slice(0, 40)) + "...",
      );
      break;
    }
  }

  const refs = footer.filter((line) => line.startsWith("Refs:"));
  const breaking = footer.filter((line) => line.startsWith("BREAKING CHANGE:"));
  const expected = options.issueId === null ? null : "Refs: #" + String(options.issueId);
  if (refs.length === 0) {
    check.violations.push(
      expected === null
        ? "footer must carry a Refs: #<issue-id> line; this task has no issue yet, so run 'azflow issue' first"
        : "footer must carry '" + expected + "'",
    );
  } else if (expected !== null && refs[refs.length - 1] !== expected) {
    check.violations.push("footer must end with exactly '" + expected + "'");
  }
  if (refs.length !== 1 && refs.length !== 0) {
    check.violations.push("footer must carry a single Refs line");
  }
  if (parsed.breaking && breaking.length === 0) {
    check.violations.push("a '!' header requires a 'BREAKING CHANGE:' footer that states the migration");
  }
  if (!parsed.breaking && breaking.length > 0) {
    check.violations.push("a 'BREAKING CHANGE:' footer requires a '!' marker in the header");
  }
  if (breaking.length > 0 && (breaking[breaking.length - 1] ?? "").trim() === "BREAKING CHANGE:") {
    check.violations.push("'BREAKING CHANGE:' must describe the break and its migration path");
  }
  if (footer.some((line) => !/^(?:Refs|BREAKING CHANGE):/.test(line))) {
    check.violations.push("footer lines must start with 'Refs:' or 'BREAKING CHANGE:'");
  }
  return check;
}

export interface CommitParts {
  readonly type: string;
  readonly scope: string | null;
  readonly subject: string;
  readonly body: string | null;
  readonly breaking: string | null;
  readonly issueId: number | null;
}

export function commitHeader(parts: {
  readonly type: string;
  readonly scope: string | null;
  readonly subject: string;
  readonly breaking?: boolean;
}): string {
  const scope = parts.scope === null || parts.scope === "" ? "" : "(" + parts.scope + ")";
  const bang = parts.breaking === true ? "!" : "";
  return parts.type + scope + bang + ": " + parts.subject;
}

export function buildCommitMessage(parts: CommitParts): string {
  const lines: string[] = [
    commitHeader({
      type: parts.type,
      scope: parts.scope,
      subject: parts.subject,
      breaking: (parts.breaking ?? "").trim() !== "",
    }),
  ];
  const body = (parts.body ?? "").trim();
  if (body !== "") lines.push("", body);
  if (parts.issueId !== null) {
    lines.push("", "Refs: #" + String(parts.issueId));
  }
  const breaking = (parts.breaking ?? "").trim();
  if (breaking !== "") lines.push("BREAKING CHANGE: " + breaking);
  return lines.join("\n") + "\n";
}

export function buildPullRequestTitle(parts: {
  readonly type: string;
  readonly scope: string | null;
  readonly subject: string;
  readonly issueId: number;
  readonly breaking?: boolean;
}): string {
  return commitHeader({
    type: parts.type,
    scope: parts.scope,
    subject: parts.subject,
    breaking: parts.breaking === true,
  }) + " (#" + String(parts.issueId) + ")";
}

export function validatePullRequestTitle(
  title: string,
  options: { readonly issueId: number | null },
): MessageCheck {
  const check = emptyCheck();
  check.violations.push(...asciiViolations(title, "pull request title"));
  const suffix = options.issueId === null ? null : " (#" + String(options.issueId) + ")";
  const core = suffix !== null && title.endsWith(suffix) ? title.slice(0, title.length - suffix.length) : title;
  if (suffix !== null && !title.endsWith(suffix)) {
    check.violations.push("title must end with '" + suffix + "'");
  }
  if (title.length >= PR_TITLE_LIMIT) {
    check.violations.push("title is " + String(title.length) + " characters; keep it under " + String(PR_TITLE_LIMIT));
  }
  const parsed = parseCommitHeader(core);
  if (parsed === null) {
    check.violations.push("title must match <type>(<scope>)[!]: <imperative summary> (#<id>)");
    return check;
  }
  if (!TYPE_SET.has(parsed.type)) {
    check.violations.push('unknown type "' + parsed.type + '"');
  }
  const subjectCheck = checkSubject(parsed.subject, core);
  check.violations.push(...subjectCheck.violations);
  check.warnings.push(...subjectCheck.warnings);
  return check;
}

export interface PullRequestCommit {
  readonly sha: string;
  readonly header: string;
  readonly note: string;
}

export interface PullRequestDimension {
  readonly id: string;
  readonly status: "PASS" | "FAIL" | "N/A";
  readonly note: string;
}

export interface PullRequestBodyInput {
  readonly issueId: number | null;
  readonly base: string;
  readonly issueSummary: string;
  readonly commits: readonly PullRequestCommit[];
  readonly guarantees: string;
  readonly staticChecks: string;
  readonly runtimeChecks: string;
  readonly unverified: string;
  readonly dependencies: string;
  readonly dimensions: readonly PullRequestDimension[];
  readonly verdict: "PASS" | "FAIL";
  readonly blocking: readonly string[];
  readonly round: number;
  /** Repair-round budget from the scoring policy, so the body cannot drift. */
  readonly maxRounds?: number;
  readonly stackedOn: { readonly pr: number; readonly sha: string } | null;
  readonly permission: string;
}

function dimensionLine(input: PullRequestBodyInput, dimension: { id: string; label: string }): string {
  const found = input.dimensions.find((item) => item.id === dimension.id);
  if (found === undefined) {
    return "- **" + dimension.label + "**: N/A - not recorded in the review record";
  }
  return "- **" + dimension.label + "**: " + found.status + " - " + found.note;
}

/** Renders the fixed five-section pull request body. */
export function buildPullRequestBody(input: PullRequestBodyInput): string {
  const stacked =
    input.stackedOn === null
      ? "- **Stacked Branch Dependencies**: None (Branched directly from `" + input.base + "`)"
      : "- **Stacked Branch Dependencies**: Stacked on #" + String(input.stackedOn.pr) +
        " (requires commit `" + input.stackedOn.sha + "`). Merge #" + String(input.stackedOn.pr) + " first.";
  const linked =
    input.issueId === null
      ? "Closes: no issue is linked to this task."
      : "Closes #" + String(input.issueId) + ": " + input.issueSummary;
  const commits =
    input.commits.length === 0
      ? ["- No commit is recorded on this branch yet."]
      : input.commits.map(
          (commit) => "- `" + commit.sha + "`: `" + commit.header + "` - " + commit.note,
        );
  const blocking =
    input.verdict === "PASS"
      ? []
      : [
          "Blocking issues:",
          ...input.blocking.map((item, index) => String(index + 1) + ". " + item),
          "Active iteration: Round " + String(input.round) + " of " + String(input.maxRounds ?? 5),
        ];
  const lines: string[] = [
    "## Linked Issue",
    linked,
    stacked,
    "",
    "## Change summary",
    "Staged commit breakdown against `" + input.base + "`:",
    ...commits,
    "- **Behavioral Guarantees**: " + input.guarantees,
    "",
    "## Verification & Dependencies",
    "- **Verification Matrix**:",
    "  - `Static & Build checks`: " + input.staticChecks,
    "  - `Runtime & Functional assertions`: " + input.runtimeChecks,
    "  - `Unverified external facts`: " + input.unverified,
    "- **Dependency & Version Pinning**:",
    "  - " + input.dependencies,
    "",
    "## Review conclusion",
    "Self-audit across the four engineering dimensions:",
    ...PR_DIMENSIONS.map((dimension) => dimensionLine(input, dimension)),
    "",
    "**Overall Verdict**: " + input.verdict,
    ...blocking,
    "",
    "## Permission Notice",
    input.permission,
  ];
  return lines.join("\n") + "\n";
}

/** Heading lines in order, so a body with a missing or extra section fails. */
export function pullRequestSectionHeadings(body: string): string[] {
  return body
    .split(/\r?\n/)
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, "").trim());
}

export function validatePullRequestBody(
  body: string,
  options: { readonly issueId: number | null },
): MessageCheck {
  const check = emptyCheck();
  check.violations.push(...asciiViolations(body, "pull request body"));
  const headings = pullRequestSectionHeadings(body);
  if (headings.length !== PR_SECTIONS.length) {
    check.violations.push(
      "body must carry exactly " + String(PR_SECTIONS.length) + " H2 sections, found " + String(headings.length),
    );
  }
  PR_SECTIONS.forEach((expected, index) => {
    if (headings[index] !== expected) {
      check.violations.push(
        "section " + String(index + 1) + " must be '## " + expected + "', found '## " + (headings[index] ?? "") + "'",
      );
    }
  });
  if (options.issueId !== null && !new RegExp("\\bCloses #" + String(options.issueId) + "\\b").test(body)) {
    check.violations.push("body must close the linked issue with 'Closes #" + String(options.issueId) + "'");
  }
  return check;
}
