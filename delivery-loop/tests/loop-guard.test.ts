import assert from "node:assert/strict";
import {
  detectReplyLoop,
  detectToolLoop,
  findRepeatedPattern,
  loopBreakerReason,
  loopRestartReason,
  normalizeCall,
  promptReplay,
  replyCorrectionReason,
} from "../../codex-plugin/hooks/loop-guard.ts";

const longReply = "A".repeat(180);

assert.equal(normalizeCall({ name: " Bash ", arguments: "  git   status\n" }), "bash git status");
assert.deepEqual(findRepeatedPattern(["a", "a", "a", "a"]), {
  period: 1,
  repeats: 4,
  signature: "a",
  total: 4,
});
// Two or three passes over a two-step unit are ordinary work, not a dead loop.
assert.equal(findRepeatedPattern(["a", "b", "a", "b", "a", "b"]), null);
assert.equal(findRepeatedPattern(["a", "b", "a", "b", "a", "b", "a", "b"])?.period, 2);
assert.deepEqual(findRepeatedPattern(["a", "b", "a", "b", "a", "b", "a", "b"]), {
  period: 2,
  repeats: 4,
  signature: "a",
  total: 8,
});
assert.equal(findRepeatedPattern(["a", "a", "a"]), null);
assert.equal(
  detectToolLoop([
    { name: "Bash", arguments: "git status" },
    { name: "bash", arguments: " git   status " },
    { name: "BASH", arguments: "git status" },
  ]),
  null,
);
assert.ok(
  detectToolLoop([
    { name: "Bash", arguments: "git status" },
    { name: "bash", arguments: " git   status " },
    { name: "BASH", arguments: "git status" },
    { name: "Bash", arguments: "git status" },
  ]),
);
assert.ok(detectReplyLoop([longReply, longReply, longReply]));
assert.equal(detectReplyLoop(["Done.", "Done.", "Done."]), null);

const prompt = "Implement the delivery loop and preserve this exact wording.";
assert.match(promptReplay(prompt), /BEGIN RESENT PROMPT/);
assert.match(promptReplay(prompt), /Implement the delivery loop/);
assert.match(loopRestartReason({ period: 1, repeats: 4, signature: "bash git status", total: 4 }, "tool", prompt), /DEAD LOOP DETECTED/);
assert.match(loopBreakerReason({ period: 1, repeats: 4, signature: "bash git status", total: 4 }, "tool", prompt), /DEAD LOOP INTERRUPTED/);
assert.match(replyCorrectionReason("blank", prompt), /no visible text/);
assert.match(replyCorrectionReason("blank", prompt), /Implement the delivery loop/);
assert.match(
  loopRestartReason({ period: 1, repeats: 2, signature: "<blank reply>", total: 2 }, "blank", prompt),
  /blank final reply 2 times/,
);
assert.match(
  loopRestartReason({ period: 1, repeats: 2, signature: "<blank reply>", total: 2 }, "blank", prompt),
  /Implement the delivery loop/,
);

console.log("loop-guard.test.ts: all assertions passed");
