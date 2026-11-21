# AI Video Workflow

## Purpose

Use this reference for AI-assisted production where the user starts with a brief, prompt, product description, dataset, script, or rough storyboard.

The goal is to convert ambiguous creative intent into explicit production decisions before implementation.

## Pipeline

    User intent
    ↓
    Deliverable contract
    ↓
    Storyboard
    ↓
    Scene graph
    ↓
    Asset plan
    ↓
    Visual-engine plan
    ↓
    Timeline spec
    ↓
    Implementation
    ↓
    Preview frames
    ↓
    QA / corrections
    ↓
    Final render
    ↓
    Variants / delivery

## Step 1 — Parse the request

Extract:

    purpose
    audience
    message
    tone
    channel
    duration
    aspect ratio
    language
    source material
    audio requirements
    CTA / final state

Mark unknowns as unresolved rather than inventing them.

## Step 2 — Convert prose into a storyboard

Use one row per scene:

| Scene | Purpose | Duration | Main visual | Supporting layer | Audio / caption |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | establish context | known / estimate | … | … | … |
| 02 | explain | … | … | … | … |
| 03 | demonstrate | … | … | … | … |
| 04 | conclude | … | … | … | … |

A storyboard is a reasoning artifact, not a final visual.

## Step 3 — Build the scene graph

For each scene define:

    scene ID
    start / end frame
    inputs
    layers
    motion primitives
    transition
    audio cues
    caption ranges

Do not start coding before major scene boundaries are explicit.

## Step 4 — Select visual engines

For every scene ask:

    Does this need:
    data?
    3D?
    choreography?
    authored animation?
    morphing?
    raster effects?
    UI semantics?

Then select the narrowest mechanism.

Do not automatically add all supported engines.

## Step 5 — Produce an asset manifest

Record:

    asset ID
    type
    source
    license / usage basis
    local path
    dimensions
    duration
    fallback

Missing asset information is a production risk, not a reason to fabricate content.

## Step 6 — Implement the timeline

Map scene-local frames to the global composition.

Keep:

    scene timing
    visual timing
    audio timing
    caption timing

inspectable and derivable from explicit data.

## Step 7 — Render checkpoints

Before the master render, inspect:

- storyboard representative frames
- major scene transitions
- dense data frames
- peak 3D frames
- caption-heavy frames
- the final CTA / end card

Correct systemic problems before polishing individual frames.

## Step 8 — Review against intent

Ask:

- Can the viewer understand the intended message?
- Is the hierarchy correct?
- Is motion helping comprehension?
- Is the timing readable?
- Do visuals agree with narration?
- Are assets consistent?
- Is the output appropriate for the channel?

Do not optimize visual novelty at the expense of communicative clarity.

## Step 9 — Generate variants

Keep the same scene semantics while adapting:

- dimensions
- safe areas
- text wrapping
- crop rules
- asset variants

Do not simply scale a landscape composition into a portrait output and assume it is production-safe.

## AI-specific guardrails

Do not:

- invent source data
- invent asset provenance
- silently replace missing brand assets
- turn uncertain duration estimates into hard guarantees
- claim a render succeeded without verification
- add every animation library merely because the Skill supports them

When requirements are incomplete, make the smallest explicit assumption and record it in the production contract.
