import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectClosure, collectReferences, inside, materialize, resolveLocal, validateBundle } from "./link-bundle.ts";

const temp = await mkdtemp(path.join(tmpdir(), "azskills-link-bundle-"));

async function write(file: string, text: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

try {
  const repo = path.join(temp, "repo");
  await write(path.join(repo, "SKILL-SYSTEM.md"), "# System\n");
  await write(path.join(repo, "references/modules/ui-design.md"), [
    "---",
    "name: ui-design",
    "---",
    "",
    "- [System](../../SKILL-SYSTEM.md)",
    "- [Shared](../shared-rules.md)",
    "- [Asset](../media/frame.svg#view)",
    "- [External](https://example.com/page)",
    "- [Anchor](#modes)",
    "",
    "`[inline](../../SKILL-SYSTEM.md)` is documentation, not a link.",
    "",
    "```md",
    "[fenced](../../SKILL-SYSTEM.md)",
    "```",
    "",
    "<img src=\"../media/photo.png\" srcset=\"../media/photo.png 1x, ../media/frame.svg 2x\">",
    "<link href=\"../media/theme.css\" rel=\"stylesheet\">",
    "",
  ].join("\n"));
  await write(path.join(repo, "references/shared-rules.md"), "Shared rules.\n");
  await write(path.join(repo, "references/media/frame.svg"), "<svg/>\n");
  await write(path.join(repo, "references/media/photo.png"), "\u0089PNG\r\n");
  await write(path.join(repo, "references/media/theme.css"), ".frame { background: url('frame.svg'); }\n");
  await write(path.join(repo, "references/media/unused.md"), "Not referenced.\n");

  const references = collectReferences(await readFile(path.join(repo, "references/modules/ui-design.md"), "utf8"), "ui-design.md");
  assert.ok(references.includes("../../SKILL-SYSTEM.md"));
  assert.ok(references.includes("../media/photo.png"));
  assert.ok(!references.includes("[fenced](../../SKILL-SYSTEM.md)"), "Fenced code must not yield links");
  assert.equal(references.filter((item) => item === "../../SKILL-SYSTEM.md").length, 1, "Inline code must not duplicate links");

  assert.equal(inside(repo, path.join(repo, "references/modules/ui-design.md")), true);
  assert.equal(inside(repo, path.join(temp, "outside.md")), false);
  assert.equal(resolveLocal(path.join(repo, "references/modules/ui-design.md"), "../../SKILL-SYSTEM.md", repo), path.join(repo, "SKILL-SYSTEM.md"));
  assert.equal(resolveLocal(path.join(repo, "references/modules/ui-design.md"), "../../../../escape.md", repo), null);

  const bundle = await collectClosure(repo, ["references/modules/ui-design.md"]);
  assert.deepEqual([...bundle.keys()].sort(), [
    "SKILL-SYSTEM.md",
    "references/media/frame.svg",
    "references/media/photo.png",
    "references/media/theme.css",
    "references/modules/ui-design.md",
    "references/shared-rules.md",
  ]);
  assert.equal(bundle.has("references/media/unused.md"), false, "Unreferenced files must not be bundled");

  const target = path.join(temp, "bundle");
  await materialize(bundle, target);
  await validateBundle(target);
  assert.equal(await readFile(path.join(target, "references/modules/ui-design.md"), "utf8"), await readFile(path.join(repo, "references/modules/ui-design.md"), "utf8"));
  const files = await readdir(path.join(target, "references/media"));
  assert.deepEqual(files.sort(), ["frame.svg", "photo.png", "theme.css"]);

  await write(path.join(temp, "escape.md"), "Outside the repository.\n");
  await assert.rejects(collectClosure(repo, ["../escape.md"]), /escapes repository/);
  await assert.rejects(collectClosure(repo, ["references/modules/missing.md"]), /missing/);

  const incomplete = path.join(temp, "incomplete");
  await write(path.join(incomplete, "SKILL.md"), "[Missing](references/nope.md)\n");
  await assert.rejects(validateBundle(incomplete), /missing bundle link/);

  console.log("Link bundle tests passed: closure walk, code fences, inline code, external and anchored links, assets, binary copies, and escape rejection.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
