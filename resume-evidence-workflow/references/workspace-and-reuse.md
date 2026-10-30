# Workspace and Reuse

Use this reference after the first resume import and whenever a later application
should reuse an existing evidence base. The purpose is to avoid reparsing the same
PDF for every job and to keep facts, selection, layout, and accepted wording separate.

## Layers

| File | Role | Update rule |
| :--- | :--- | :--- |
| `经历库.md` | Richest confirmed factual source | Update whenever confirmed evidence changes. |
| `基础简历.md` | Current general-purpose content and section order | Update only when the user adopts a change as the general default. |
| `简历版式档案.md` | Visual and structural defaults | Update only when the default design changes. |
| `基础简历.html` | Optional editable master | Patch content for company variants; update the master after an approved general or editor change. |
| `项目素材库.md` | Selectable project angles linked to evidence | Update after the factual source changes or a reusable angle is accepted. |
| `复用表达库.md` | Previously accepted resume wording | Update once after acceptance when a materially new expression appears. |

The original PDF or Word file may remain as archival calibration evidence. Do not
require it on every run.

## First import

When a resume is supplied for the first time:

1. extract visible text, sections, order, dates, bullets, and links;
2. remove OCR line-wrap artifacts without changing meaning;
3. record the base content in neutral Markdown;
4. record typography, color, page margins, dividers, alignment, date placement,
   column structure, and density separately;
5. identify formal employment, internships, freelance work, projects, campus
   activity, volunteering, and other relationship types;
6. show the extracted content and material layout choices for correction;
7. save the files when writing is available or provide them for download.

Do not assume every fact in the bank belongs in the base resume. The base resume is
the current selection, not the full factual record.

## Base resume

`基础简历.md` should preserve:

- section order and names;
- entry order within each section;
- dates and locations;
- current summary and bullets;
- links;
- the user's accepted spelling and terminology;
- a `last confirmed` date.

Correct an obvious OCR artifact when meaning is clear. Mark a material ambiguity and
resolve it before using the text in an application.

Do not insert a narrow target role into a general base summary. A base resume may be
reused across roles; the tailored artifact owns the specific positioning.

## Layout profile

`简历版式档案.md` should be detailed enough to recreate the design without reopening
the PDF:

```text
page size, margins, maximum pages
body, heading, name, and metadata type sizes
font families and fallback expectations
line height, paragraph spacing, and section spacing
ink, accent, divider, and background colors
alignment, date placement, and header relationships
section order and whether any section is multi-column
bullet style and indentation
link and contact treatment
print or export constraints
source file and last confirmed date
```

Record visual evidence, not guesses. If a value cannot be measured, state the
approximation and the reason. Preserve the source design when it is usable; do not
replace it with the AzSkills workbench skin.

## Editable HTML master

When `基础简历.html` exists:

- duplicate it for a new application;
- patch only content blocks and approved section changes;
- preserve the editor controls, CSS primitives, fitting logic, copy panel, and print
  script unless the user requested an editor or design change;
- use the generic asset only when no compatible master exists;
- update the master once after an approved general content or editor fix.

Company-specific wording, omissions, and titles do not overwrite the master. See
[editable-html.md](editable-html.md) for the artifact contract.

## Direction baselines

A direction baseline is a reusable starting selection for a role family, not a batch
of finished resumes. At first baseline creation, ask which roles or directions the
user is targeting unless already known. One direction needs one baseline; create more
only when the user chooses them.

Each baseline should record:

```text
direction name and scope
role families and seniority
section order and selected experiences
summary posture and language
preferred evidence modules
known omissions and their reason
layout master
last confirmed date
```

Load only the closest baseline. Run fresh job-description analysis, evidence lookup,
and Grooming for every application. A baseline saves repeated selection, not the work
of matching the actual requirement.

## Project material library

The evidence bank supplies facts. The project material library supplies selectable
angles from those facts. Each module should link back to its evidence and record:

- project name, dates, and relationship type;
- context and objective;
- personal actions, collaboration, and decisions;
- outputs, results, metric scope, and evidence status;
- relevant capability angles and previously accepted expressions;
- unresolved facts and claim boundaries.

Load only projects relevant to the current job description. A project module does not
require inclusion in every resume. Keep internship work under its actual relationship
type and avoid duplicating the same work as a personal project.

Update facts in the evidence bank first, then update the linked module. Resolve
obsolete facts rather than maintaining contradictions.

## Reusable expressions

The reuse library stores concise, accepted resume presentations. It is not a second
evidence bank and must not acquire unsupported facts through repeated polishing.

Organize entries by experience plus value angle, such as
`community operation + commercialization` or `research + audience insight`. Keep one
general expression and at most two or three materially different role-family variants.
Do not save cosmetic paraphrases.

Before reuse, check:

- the underlying evidence still supports the wording;
- the language, market, and role family fit;
- the user's current presentation instruction is compatible;
- the expression is not a company-specific variant being promoted silently;
- no newer correction invalidates the claim.

## Write-back boundaries

- New facts and corrections update the evidence bank.
- Accepted general changes may update the base resume.
- A new default visual system updates the layout profile.
- An approved editor fix or general content change updates the HTML master.
- An accepted tailored expression may update the reuse library once.
- A company-specific omission remains scoped to that application unless the user
  explicitly makes it a long-term decision.

Tell the user briefly when a reusable module changes. If nothing materially reusable
changed, skip the announcement and the redundant write-back pass.

## Portable package

For a conversation without persistent files, offer a small downloadable package:

```text
经历库.md
基础简历.md
简历版式档案.md
```

Add `项目素材库.md`, `复用表达库.md`, or `基础简历.html` only when they exist and
help the next task. The user can upload this package instead of repeatedly uploading
and parsing a PDF. Markdown remains the maintained source.

## Staleness

Ask whether the saved base is still current only when there is a concrete sign:

- the user says the source resume changed;
- a required fact is missing or contradictory;
- the target direction is materially different;
- the layout profile cannot reproduce a requested design;
- the last confirmation is old enough to matter for a metric or role.

Do not request a new PDF merely because a new job description arrived.
