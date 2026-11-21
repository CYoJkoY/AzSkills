# Data-driven schema

Define the data shape and its owning source before implementing business logic. Select JSON, YAML, a database table, environment configuration, or typed application configuration according to the repository's existing boundary and validation practices.

## Rule record

Represent each rule as data with at least these semantic fields (or equivalent):

| Field | Purpose | Example type |
| --- | --- | --- |
| `rule_id` | Stable identity for lookup and diagnostics | string/enum |
| `trigger` | Event or condition that activates the rule | enum |
| `condition_parameters` | Thresholds or selector inputs | typed fields |
| `reward_type` | Kind of resulting action or reward | enum |
| `reward_parameters` | Quantity, item ID, or typed arguments | typed fields |

An example conceptual record is `{rule_id, trigger, condition_parameters, reward_type, reward_parameters}`. Validate required fields, ranges, and references at the configuration boundary. Keep execution code generic enough to consume records without embedding each business combination in a new branch.

## Localization keys

Use stable semantic keys such as `combat.kill_reward.paint_brush`; keep translated display strings in locale data. Do not use a complete user-visible sentence as the lookup key. Preserve fallback behavior through the repository's localization contract.

## Boundary and secrets

Use environment variables or a secret manager for credentials. Do not place secrets in source, example fixtures, logs, or committed configuration. Configure endpoints and tunable values using the project's existing validated configuration mechanism. A configuration value does not become safe merely because it was moved to a file: validate untrusted or operator-controlled input at load time.

## Thirty-line trigger

When a rule/condition set reaches 30 lines, move the rule set into data/configuration. This is the Skill's review threshold. Smaller sets may also belong in data when they represent business policy that changes independently of code. Avoid introducing a configuration framework for fixed mathematical identities or implementation details.
