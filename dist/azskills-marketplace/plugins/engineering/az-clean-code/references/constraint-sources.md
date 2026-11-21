# Constraint sources and decision rules

This document separates source-backed guidance from the stricter thresholds adopted by Az Clean Code. A threshold in this Skill is a project acceptance rule; do not attribute it as a verbatim universal requirement unless the cited source actually states it.

## C1 - Explicit behavior

- **Google Python Style Guide, Exceptions**: use exceptions for exceptional conditions; do not use `assert` to validate input that can fail during normal operation. This supports explicit runtime validation, not every prohibition in C1.
- **Clean Code principles**: meaningful names and small, focused functions are relevant background for named expressions and explicit intent. The Boolean-parameter rule is a local acceptance criterion.

## C2 - Spaces

- **Microsoft C# coding conventions, Conventions**: use four spaces for indentation and do not use tabs. Apply this directly to C#; the cross-language no-Tab rule is this Skill's portability policy.
- **Linux kernel coding style** uses tabs in its prescribed environment. That project-specific convention is not adopted here and does not establish a portable exception to C2.

## C3-C4 - Control flow

- **Clean Code, Robert C. Martin**, discusses minimizing nesting and keeping functions small. The maximum of two nested control-flow levels is this Skill's strict threshold; source editions may phrase the guidance differently.
- **Google Python Style Guide, If expressions and Exceptions** supports clear, explicit branching and appropriate error handling. Guard clauses are an adopted transformation, not a quoted Google rule.

## C5 - Reuse

- **The Rule of Three**, described in refactoring literature including Martin Fowler's Refactoring: duplication may be tolerated twice and refactored on the third occurrence. This exact trigger is adopted as this Skill's decision threshold.
- **YAGNI**, as described in Extreme Programming practice: avoid implementing speculative capabilities before they are needed. This supports requiring a current caller.

## C6 - Function size and parameters

- **Clean Code** advocates small functions and one level of abstraction per function. The 20-line reference is a review trigger, not a universal language limit.
- **Airbnb JavaScript Style Guide, Functions** recommends limiting parameters to two or fewer in its JavaScript context. This Skill uses a cross-language maximum of three and a named options object beyond it; that is this Skill's contract, not Airbnb's.
- **Rust API Guidelines** emphasize clear, maintainable APIs. They do not define the universal three-parameter threshold used here.

## C7 - Data-driven business rules

- **Martin Fowler, Domain Specific Languages and Language Workbenches** discusses externalizing rules/data in appropriate domains; **Feature Toggles** illustrates separating changeable policy from code. These support a data-driven approach, not a universal ban on all literals.
- The rule that business values live outside executable logic, and the 30-line rule-set threshold, are explicit Az Clean Code acceptance decisions. The line threshold is a practical trigger, not an industry-standard finding.
- Keep secrets in environment or secret-management systems; never commit credentials. Endpoints and business identifiers should come from their owning configuration or data source.

## Use and verification

Consult current official source text when a task depends on a source-specific claim. Do not invent section numbers or quote paraphrases as exact quotations. Relevant titles include Google Python Style Guide, Microsoft C# coding conventions, Linux kernel coding style, Airbnb JavaScript Style Guide, Rust API Guidelines, Clean Code, Refactoring, and Extreme Programming/YAGNI material.
