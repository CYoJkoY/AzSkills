---
name: resume-evidence-workflow
description: Build a portable career evidence bank, align a resume to a job description, and deliver an editable application-ready artifact. Use for career deep dives, evidence-backed tailoring, or resume audits.
version: 1.0.0
status: canonical
family: career
modes: [evidence, tailor, review]
---

# Resume Evidence Workflow

Turn scattered career material into a durable evidence bank, then use that evidence
to select, tailor, and deliver a resume for a real application. This Skill owns
career facts, requirement mapping, resume content, feedback intake, and artifact
delivery. It does not own interface construction or file-format engines.

Shared rules R01-R12 apply. Read [SKILL-SYSTEM.md](../SKILL-SYSTEM.md) before changing this contract.

## Contract

- Use when: career material must be gathered, preserved, matched to a job description, written into a resume, rendered as an editable document, or audited.
- Do not use when: the task is only visual styling with no career content, a generic document conversion, one isolated interview answer, or a finished resume that needs no evidence or content review.
- Owns: career evidence, reusable resume source files, requirement-to-evidence mapping, resume selection and wording, user presentation decisions, and artifact completeness.
- Inputs: user material and corrections, target market and language, job description when available, existing evidence and workspace files, artifact requirements, and explicit retention or presentation instructions.
- Outputs: an evidence bank, reusable base-resume workspace, matched and reviewed resume content, requested artifact, concise change record, and unresolved gaps.
- Compose with: `ui-design` for editor chrome, interaction states, accessibility, and rendered interface QA; hand file-format rendering to the available document tool that owns it.
- Gates: claims trace to supplied or confirmed evidence; the evidence layer and presentation layer stay separate; material removals are authorized; the delivered artifact opens, reads, and prints as requested.

## Modes

| Mode | Use when | Workflow | Output |
| :--- | :--- | :--- | :--- |
| `evidence` | Career material is scattered, incomplete, or has no reusable bank | Inventory, scan, deepen selectively, checkpoint, persist | Evidence bank and optional base-resume workspace |
| `tailor` | A bank or source resume must answer a concrete job description | Decode, map, select, draft, groom, deliver, write back | Tailored resume and change record |
| `review` | An existing bank, base resume, or delivered artifact needs an audit | Inspect, trace claims, test boundaries, rank findings | Read-only findings and smallest corrections |

## Workflow

### 1. Establish the current state

Inspect what the user already supplied before asking for more: resumes, profiles,
portfolios, notes, transcripts, saved evidence, workspace files, and the complete
job description. Identify the active mode and the artifact the user needs. Run only
the stages that move that artifact forward; resume an existing bank instead of
restarting discovery.

Keep the layers explicit:

```text
evidence bank       confirmed facts and context
base resume         current general selection and wording
layout profile      visual and structural defaults
direction baseline  optional starting selection for a role family
tailored artifact   one application-specific output
```

When speech or transcription is involved, treat wording, dates, numbers, names,
negation, and ownership as fallible. Preserve uncertainty and confirm high-risk
fields at a compact checkpoint.

### 2. Capture evidence with controlled depth

Use the inventory first, then three passes: recall what happened and why, scan only
plausible value branches, and deepen selectively. Name a non-binding question
estimate at the start of a substantial experience. Let one complete answer resolve
several themes, and stop when another question would add no distinct signal.

Read [intake-and-dialogue.md](references/intake-and-dialogue.md) before a career
deep dive, question selection, or transcript-heavy intake. Keep the bank factual
and neutral rather than a draft resume.

After a substantial answer, show only the neutral facts that would be added or
changed. This inline preview lets the user correct the record without opening the
file. Never invent a metric, responsibility, relationship type, or outcome.

### 3. Persist a portable evidence bank

Read [evidence-bank.md](references/evidence-bank.md) when creating or changing the
bank, evaluating ownership, or recording project logic and key events. Store the
underlying fact separately from a possible resume expression. Distinguish direct
output from later outcome and the user's contribution from team or external work.

When a resume is supplied for the first time, read
[workspace-and-reuse.md](references/workspace-and-reuse.md). Offer a reusable
Markdown base resume and a Markdown layout profile beside the bank, plus an
optional editable HTML master when that master will be maintained. Treat a source
PDF as calibration input, not a recurring prerequisite.

### 4. Decode the requirement before rewriting

Keep the complete original job description available through final verification.
Extract the business objective, must-haves, preferred signals, role family,
seniority, market, language, application channel, and likely evaluation standard.
Read [jd-and-delivery.md](references/jd-and-delivery.md) before mapping a concrete
role or choosing the delivery route.

Build a requirement-to-evidence matrix that separates direct, adjacent, weak, and
absent evidence. State intended emphasis, compression, movement, and gaps before
producing polished prose. Give an overall suitability judgment only when asked; do
not assign a default fit score.

### 5. Select and draft the resume

Reuse the current base resume, relevant project material, and accepted expressions
before inventing a new angle. Determine sections from the actual career stage and
relationship types. Formal employment, internships, freelance work, projects,
campus activity, and volunteering remain distinguishable; a section label may
adapt to the role but may not upgrade the underlying relationship.

Preserve V0 of the pre-revision content. Plan readable space by job-description
priority before drafting, then write natively for the target language. For Chinese,
useful context and work-focus labels are allowed; for English, use standalone
action-led bullets with integrated context. Never translate a Chinese resume
literally into English or the reverse.

Ask before materially deleting or merging a user-supplied experience, project,
section, overview, or bullet. Irrelevance supports a recommendation, not silent
removal. Reuse an approval only for the scope it covered.

### 6. Review the change against the requirement

Run the visible alignment review in [jd-and-delivery.md](references/jd-and-delivery.md)
after every targeted content revision and before delivery. Compare V0, the current
draft, and the complete job description. Repair what is authorized, show material
before/after changes with the requirement each addresses and the evidence used,
and list unresolved gaps plainly.

Missing evidence is a gap to report. Do not block a usable resume or turn a gap into
an unsupported claim. Do not add defensive statements about risks the user did not
raise.

### 7. Deliver the requested artifact

Deliver the format the application actually requires. For editable HTML, read
[editable-html.md](references/editable-html.md), start from
[the editable base](assets/editable-resume-base.html), preserve its tested editing,
copy, fitting, and print behavior, then adapt the document design. Compose with
`ui-design` when the editor surface itself needs construction, refinement, or a
visual review. The resume paper keeps its own design; do not apply the AzSkills
workbench skin to the printed document.

Check that the file opens independently, has no missing local assets, and prints
at the expected page count without clipping, overlap, or stray browser metadata.
Name the file for the person and employer. Deliver source files and the final
artifact the user requested.

### 8. Write confirmed facts back

During matching and rewriting, record genuinely new evidence, corrections, newer
metric snapshots, later developments, and changed status promptly. Check for an
equivalent record first, show a concise neutral preview, and never hide a
write-back. If the user declines or identifies duplication, honor that decision.

A tailored resume does not automatically replace the base resume. Update the base
only when the user adopts a change as a new general default. Update the reuse
library once after acceptance, and only when a materially new or better expression
appeared.

## Review checks

Use these checks in `review` mode and before a final delivery:

- every high-value claim resolves to evidence or an explicit user presentation choice;
- employment type, title, dates, scope, and personal versus team ownership remain accurate;
- sections fit the career stage and do not hide relationship boundaries;
- the summary and selection respond to the actual requirement rather than keywords alone;
- internal labels, confidence notes, placeholders, and advisor commentary do not ship;
- the requested locale, market conventions, links, filenames, and formats are correct;
- editable HTML retains its controls, live copy panel, fitting limits, and print isolation;
- unresolved gaps and unverified artifact behavior are stated rather than implied.

For an audit, report the verdict, findings ordered by user impact, the evidence
behind each finding, and one smallest corrective action. Do not edit the source
bank or resume unless the user asked for a repair.

## Quality gates

- [ ] The active mode and requested artifact are explicit; unrelated stages were skipped.
- [ ] Every material claim traces to supplied, confirmed, or clearly labeled uncertain evidence.
- [ ] Evidence and presentation choices are stored separately; no fact was invented to fill a gap.
- [ ] Material deletions or mergers were approved, and formal, internship, and non-employment types remain distinct.
- [ ] The requirement matrix and the final resume agree on emphasis, language, and market.
- [ ] The pristine pre-revision version and a concise change record exist when content was rewritten.
- [ ] Editable HTML opens independently, keeps its full editing and copy behavior, and prints without clipping.
- [ ] No private user data appears in examples, fixtures, screenshots, or public documentation.
- [ ] New evidence was written back only where confirmed and not duplicated.

## Output contract

For `evidence`:

```text
Evidence changes:
Confirmed scope and ownership:
Reusable workspace files:
Deferred questions and reasons:
Unverified items:
```

For `tailor`:

```text
Requirement and evidence decision:
Content changes and evidence used:
Artifact and location:
Verification evidence:
Remaining gaps:
Write-back performed:
```

For `review`:

```text
Verdict:
Findings ordered by user impact:
Evidence for each finding:
Smallest corrective actions:
Unverified items:
```

## References

- `references/intake-and-dialogue.md` - career discovery, value branches, question limits, voice input, and correction protocol.
- `references/evidence-bank.md` - portable bank structure, ownership, project logic, metrics, and key-event cards.
- `references/workspace-and-reuse.md` - base resume, layout profile, direction baselines, project material, and reusable wording.
- `references/jd-and-delivery.md` - requirement decoding, routing, selection, Grooming, and final artifact checks.
- `references/editable-html.md` - editable HTML controls, copy panel, fitting, print preflight, and layout preservation.
