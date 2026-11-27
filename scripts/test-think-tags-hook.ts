import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leadingUnclosedTag, stripAllThinking, stripLeadingThinking } from "../no-think-tags/lib/think-tags.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = path.join(root, "no-think-tags/hooks/stop-hook.ts");
const state = await mkdtemp(path.join(tmpdir(), "azskills-think-tags-"));

interface StopPayload {
  hook_event_name?: string;
  session_id?: string;
  turn_id?: string;
  stop_hook_active?: boolean;
  /** Untrusted payload fixture: any JSON value is allowed without a cast. */
  last_assistant_message?: unknown;
}

let turnCounter = 0;

function run(payload: StopPayload | string): string {
  const input = typeof payload === "string" ? payload : JSON.stringify({
    hook_event_name: "Stop",
    session_id: "session-a",
    turn_id: `turn-a-${turnCounter++}`,
    stop_hook_active: false,
    last_assistant_message: null,
    ...payload,
  });
  const result = spawnSync(process.execPath, [hook], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 30000,
    env: { ...process.env, PLUGIN_DATA: state },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

const blocks = (output: string): boolean => {
  if (output === "") return false;
  const parsed = JSON.parse(output) as { decision?: string; reason?: string };
  assert.equal(parsed.decision, "block");
  assert.match(parsed.reason ?? "", /reasoning block/);
  return true;
};

try {
  assert.deepEqual(stripLeadingThinking("Plain answer."), { stripped: false, text: "Plain answer." });
  assert.deepEqual(stripLeadingThinking("  <thinking>plan</thinking>\n\nAnswer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("<thought>a</thought><thinking>b</thinking>Done."), { stripped: true, text: "Done." });
  assert.deepEqual(stripLeadingThinking("<thinking>unclosed\nAnswer."), { stripped: false, text: "<thinking>unclosed\nAnswer." });
  assert.deepEqual(stripLeadingThinking("Intro <thinking>x</thinking>"), { stripped: false, text: "Intro <thinking>x</thinking>" });
  assert.equal(stripLeadingThinking("<thinking>a\n```\n</thinking>\n```\nBody").stripped, false);
  assert.equal(stripLeadingThinking("<thinking>a `</thinking>` b</thinking>Body").text, "Body");
  assert.equal(stripAllThinking("a<thinking>hidden</thinking>b"), "ab");
  assert.equal(leadingUnclosedTag("Plain answer."), null);
  assert.equal(leadingUnclosedTag("<thinking>x</thinking>Body"), null);
  assert.equal(leadingUnclosedTag("  <thought>never closes"), "<thought>");
  assert.equal(leadingUnclosedTag("<think>\n\n\nAnswer text."), "<think>");
  assert.equal(leadingUnclosedTag("Intro <think>never closes"), null);
  assert.equal(leadingUnclosedTag("<think>`</think>` in code only"), "<think>");
  assert.equal(leadingUnclosedTag("`<think>` in code"), null);
  assert.equal(leadingUnclosedTag("<think>a</think><think>b"), null);

  assert.equal(blocks(run({ last_assistant_message: "Plain answer." })), false);
  assert.equal(blocks(run({ last_assistant_message: "  <thinking>plan</thinking>\nAnswer." })), true);
  assert.equal(blocks(run({ last_assistant_message: "<thought>plan</thought>Done." })), true);
  // A block that opens partway through a message leaks too: the tags are on
  // screen even though the sentence around them is readable.
  assert.equal(blocks(run({ last_assistant_message: "Intro <thinking>x</thinking>" })), true);
  // An opener that never closes, away from the start, leaks the rest of the text.
  assert.equal(blocks(run({ last_assistant_message: "Intro <thinking>never closes" })), true);
  // A pair that only appears inside a fenced block is documentation, not a leak.
  assert.equal(blocks(run({ last_assistant_message: "Example:\n```\n<thinking>x</thinking>\n```\nDone." })), false);
  // A tag name quoted inside an inline span stays prose.
  assert.equal(blocks(run({ last_assistant_message: "The `<thinking>` tag is documented here." })), false);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>unclosed" })), true);
  assert.equal(blocks(run({ last_assistant_message: "<think>\n\n\nReasoning only, never closed." })), true);
  assert.equal(blocks(run({ last_assistant_message: "<think>" })), true);
  assert.equal(blocks(run({ last_assistant_message: "`<think>`" })), false);
  assert.equal(blocks(run({ last_assistant_message: "<thinking>a `</thinking>` b</thinking>Body" })), true);
  assert.equal(blocks(run({ last_assistant_message: null })), false);
  assert.equal(blocks(run({ last_assistant_message: 42 })), false);
  assert.equal(blocks(run({ hook_event_name: "UserPromptSubmit", last_assistant_message: "<thinking>x</thinking>Body" })), false);
  // stop_hook_active is turn-wide, not hook-wide: another Stop hook may have set
  // it before this hook ever ran, so a turn id makes this hook dedupe on its own
  // record instead of staying silent.
  assert.equal(blocks(run({ last_assistant_message: "<thinking>x</thinking>Body", stop_hook_active: true })), true);
  // Without a turn id there is nothing to dedupe on, so the shared flag stays the
  // only loop guard and the hook honours it.
  assert.equal(
    blocks(run({ turn_id: undefined, last_assistant_message: "<thinking>x</thinking>Body", stop_hook_active: true })),
    false,
  );
  assert.equal(blocks(run({ turn_id: undefined, last_assistant_message: "<thinking>x</thinking>Body" })), true);
  assert.equal(blocks(run("{not json")), false);
  assert.equal(blocks(run({ last_assistant_message: "" })), false);

  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: "<thinking>x</thinking>Body" })), true);
  assert.equal(blocks(run({ session_id: "session-b", turn_id: "turn-b", last_assistant_message: "<thinking>x</thinking>Body" })), false, "Only one correction per turn");

  // The whole reasoning family of closers terminates a block, not only the tag
  // that opened it. A reply that opens with one family member and closes with
  // another (or uses a whitespace variant) must still be recognized.
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const otag = (name: string): string => lt + name + gt;
  const ctag = (name: string): string => lt + "/" + name + gt;
  const answer = (open: string, close: string): string => open + "\nreasoning\n" + close + "\n\nAnswer.";
  // Pipe-wrapped special tokens close without a slash and appear in real model
  // output: a leading pair, an unclosed opener, and a leading closer all leak,
  // while unrelated special tokens stay prose.
  assert.equal(blocks(run({ last_assistant_message: answer(otag("|begin_of_thinking|"), otag("|end_of_thinking|")) })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|begin_of_thinking|") + "\nnever closed" })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|end_of_thinking|") + "Answer." })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|channel|") + "final" })), false);
  assert.deepEqual(stripLeadingThinking(answer(otag("think"), ctag("thinking"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer(otag("thinking"), ctag("think"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer(otag("thought"), ctag("think"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer(otag("think"), ctag("thought"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(otag("think") + "\n\n\n" + ctag("think") + "\n\nAnswer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(otag("think") + "\nreasoning\n" + lt + "/ think " + gt + "\n\nAnswer."), { stripped: true, text: "Answer." });
  assert.equal(leadingUnclosedTag(otag("think") + "\n\n\nAnswer text."), otag("think"));
  assert.equal(leadingUnclosedTag(otag("think") + "x" + ctag("thinking")), null);
  assert.equal(blocks(run({ last_assistant_message: answer(otag("think"), ctag("thinking")) })), true);

  // Real replies vary the spelling: upper case, inner padding, and trailing
  // attributes all still open a reasoning block.
  assert.deepEqual(stripLeadingThinking(answer(otag("THINK"), ctag("Think"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer(otag("Think"), ctag("THINK"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer("< think >", ctag("think"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer('<think type="text">', ctag("think"))), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(answer(otag("think"), "< / THINK >")), { stripped: true, text: "Answer." });
  // A block that opens on line one, leaves blank lines, and closes once is the
  // reported failure: it must be stripped, not reported as unclosed.
  assert.deepEqual(
    stripLeadingThinking(otag("think") + "\n\n\nreasoning\n\n" + ctag("think") + "\n\nAnswer."),
    { stripped: true, text: "Answer." },
  );
  // Carriage returns and deeper blank runs are the same shape: the opener sits
  // on line one, no closer interrupts it early, and the blank lines are spacing.
  assert.deepEqual(
    stripLeadingThinking(otag("think") + "\r\n\r\n\r\nreasoning\r\n\r\n" + ctag("think") + "\r\n\r\nAnswer."),
    { stripped: true, text: "Answer." },
  );
  assert.deepEqual(
    stripLeadingThinking(otag("think") + "\n \n\t\n\n   \nreasoning\n   \n" + ctag("think") + "\n\nAnswer."),
    { stripped: true, text: "Answer." },
  );
  // The same shape with no closer at all is the leak behind the report: blank
  // lines must never read as a terminator, and the reply must be blocked.
  assert.equal(leadingUnclosedTag(otag("think") + "\r\n\r\n\r\nReasoning only."), otag("think"));
  assert.equal(blocks(run({ last_assistant_message: otag("think") + "\r\n\r\n\r\nReasoning only." })), true);
  assert.equal(leadingUnclosedTag(otag("THINK") + "\n\n\nnever closes"), otag("THINK"));
  assert.equal(blocks(run({ last_assistant_message: answer(otag("THINK"), ctag("Think")) })), true);

  // Reasoning families vary by model. The common aliases are leaks too, while
  // ordinary words that merely contain a stem ("thoughtful") are not tags.
  for (const name of [
    "reasoning",
    "reflection",
    "analysis",
    "scratchpad",
    "cot",
    "chain-of-thought",
    "chain_of_thought",
    "inner-thoughts",
    "internal-reasoning",
    "hidden-reasoning",
    "internal-monologue",
    "private-thinking",
    "deliberation",
  ]) {
    assert.deepEqual(stripLeadingThinking(answer(otag(name), ctag(name))), { stripped: true, text: "Answer." });
    assert.equal(leadingUnclosedTag(otag(name) + "\nAnswer."), otag(name));
    assert.equal(blocks(run({ last_assistant_message: answer(otag(name), ctag(name)) })), true);
  }
  // Model-specific wrappers are part of the same family: prefixes, suffixes,
  // camel case, separators, and special-token delimiters all normalize to the
  // same reasoning words. Ordinary prose and unrelated HTML do not.
  const specialNames = [
    "thoughts",
    "antThinking",
    "redacted_thinking",
    "thought_process",
    "scratch_pad",
    "chain-of-thoughts",
    "anthropic:thinking",
    "begin_of_thinking",
    "|thinking|",
    "|begin_of_thought|",
  ];
  for (const name of specialNames) {
    assert.deepEqual(stripLeadingThinking(answer(otag(name), ctag(name))), { stripped: true, text: "Answer." });
    assert.equal(leadingUnclosedTag(otag(name) + "\nAnswer."), otag(name));
    assert.equal(blocks(run({ last_assistant_message: answer(otag(name), ctag(name)) })), true);
  }
  assert.deepEqual(stripLeadingThinking(answer("<|begin▁of▁thinking|>", "<|end▁of▁thinking|>")), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("<think/>Answer."), { stripped: false, text: "<think/>Answer." });
  assert.deepEqual(stripLeadingThinking("<div class=\"thinking\">Answer.</div>"), { stripped: false, text: "<div class=\"thinking\">Answer.</div>" });
  assert.deepEqual(stripLeadingThinking("</thought></thinking>Answer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("\u200B<thought>hidden</thought>Answer."), { stripped: true, text: "Answer." });

  // Pipe-wrapped special tokens often close without a slash (`<|end_of_...|>`)
  // and may use the `|` or `｜` delimiter with `▁` word spacing. Only tokens
  // that name both a reasoning family and an end word close a block.
  assert.deepEqual(
    stripLeadingThinking(otag("|begin_of_thinking|") + "hidden" + otag("|end_of_thinking|") + "Answer."),
    { stripped: true, text: "Answer." },
  );
  assert.deepEqual(
    stripLeadingThinking(otag("|begin_of_thought|") + "hidden" + otag("|end_of_thought|") + "Answer."),
    { stripped: true, text: "Answer." },
  );
  assert.deepEqual(
    stripLeadingThinking(otag("｜begin▁of▁reasoning｜") + "hidden" + otag("｜end▁of▁reasoning｜") + "Answer."),
    { stripped: true, text: "Answer." },
  );
  assert.deepEqual(stripLeadingThinking(otag("|end_of_thinking|") + "Answer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking(ctag("|end_of_thinking|") + "Answer."), { stripped: true, text: "Answer." });
  assert.deepEqual(
    stripLeadingThinking(otag("|thinking|") + "hidden" + otag("|end_of_thinking|") + "Answer."),
    { stripped: true, text: "Answer." },
  );
  assert.equal(leadingUnclosedTag(otag("|begin_of_thinking|") + "Answer."), otag("|begin_of_thinking|"));
  // A begin token is not a closer, and unrelated special tokens stay prose.
  assert.equal(
    leadingUnclosedTag(otag("|begin_of_thought|") + "hidden" + otag("|begin_of_thought|") + "Answer."),
    otag("|begin_of_thought|"),
  );
  assert.equal(stripLeadingThinking(otag("|channel|") + "final" + otag("|end_of_text|")).stripped, false);

  assert.deepEqual(stripLeadingThinking("Thoughtful answer."), { stripped: false, text: "Thoughtful answer." });
  // The derived and pipe-token spellings are caught end to end by the hook, not
  // only by the pure helpers: a closed pipe block still leaks because its tags
  // are on screen, an unclosed opener and a leading pipe closer are corrected,
  // and unrelated special tokens stay prose.
  assert.equal(blocks(run({ last_assistant_message: answer(otag("|begin_of_thinking|"), otag("|end_of_thinking|")) })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|begin_of_thinking|") + "hidden" })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|end_of_thinking|") + "Answer." })), true);
  assert.equal(blocks(run({ last_assistant_message: otag("|channel|") + "final" + otag("|end_of_text|") })), false);
  assert.equal(stripLeadingThinking("<thinkfoo>x</thinkfoo>").stripped, false);

  // Model output also produces malformed nesting, self-closing tags, quoted
  // attribute values, and stray closers. They remain raw reasoning leaks rather
  // than becoming visible junk before the answer.
  assert.deepEqual(stripLeadingThinking("<think><thought></thinking></thought>Answer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("<think></think></thought>Answer."), { stripped: true, text: "Answer." });
  assert.equal(leadingUnclosedTag("<think/>Answer."), "<think/>");
  assert.equal(blocks(run({ last_assistant_message: "<think/>Answer." })), true);
  assert.deepEqual(stripLeadingThinking('<think data="a>b">hidden</think>Answer.'), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("< thought data-x >hidden< / thought >Answer."), { stripped: true, text: "Answer." });
  assert.equal(stripLeadingThinking("Intro </think>Answer.").stripped, false);

  // The reported shape: the model truncates the opener, dropping its closing
  // bracket and running the text straight after the tag name. The tag name is
  // still on screen, and the closer may come from another family member.
  assert.deepEqual(stripLeadingThinking("<thinkingThere is a value</thinking>\n\nAnswer."), { stripped: true, text: "Answer." });
  assert.deepEqual(stripLeadingThinking("<thinkingThere is a value</THOUGHT>"), { stripped: true, text: "" });
  assert.equal(leadingUnclosedTag("<think beyond? Continue."), "<think");
  assert.equal(leadingUnclosedTag("< think beyond? Continue."), "< think");
  assert.equal(blocks(run({ last_assistant_message: "<think beyond? Continue." })), true);
  assert.equal(blocks(run({ last_assistant_message: "<thinkingThere is a value</thinking>\n\nAnswer." })), true);
  assert.equal(stripAllThinking("before <thinkingThere is a value</thinking> after"), "before  after");
  // A quoted bare opener is not a block: no closer follows it, and a complete
  // pair inside one code span is documentation rather than leaked reasoning.
  assert.equal(leadingUnclosedTag("Use `<thinking` in docs"), null);
  assert.equal(stripAllThinking("the tag `<thinking` has no bracket"), "the tag `<thinking` has no bracket");
  assert.equal(stripAllThinking("`<thinking>hidden</thinking>`"), "`<thinking>hidden</thinking>`");
  assert.equal(stripAllThinking("`<thinking` and `</thinking>` in docs"), "`<thinking` and `</thinking>` in docs");
  // A pipe token that spells the closing slash needs no separate end word.
  assert.deepEqual(
    stripLeadingThinking(otag("|begin_of_thinking|") + "hidden" + otag("|/thinking|") + "Answer."),
    { stripped: true, text: "Answer." },
  );

  console.log("No-think-tags hook tests passed: leading blocks, unclosed tags, code-aware closing tags, pipe special tokens, bounded correction, and fail-safe inputs.");
} finally {
  await rm(state, { recursive: true, force: true });
}
