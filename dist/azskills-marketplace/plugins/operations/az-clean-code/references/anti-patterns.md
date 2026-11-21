# Anti-patterns and refactoring directions

## Business decisions embedded in branches

**Smell:** each item, category, locale, endpoint, or reward combination adds another literal and branch.

**Direction:** define the data contract first, move records to the repository's configuration boundary, validate them there, then make code consume stable IDs and typed values. Do not first ship the literal implementation.

## Deeply nested happy path

**Smell:** the main behavior is indented under several validity checks.

**Direction:** return early for invalid state, missing data, and already-completed work. Extract a cohesive operation if the remaining block still exceeds two nested control-flow levels.

## Boolean mode switch

**Smell:** `save(value, true)` selects a different operation from `save(value, false)`.

**Direction:** use distinct named functions, or a named strategy/type when the behavior is genuinely data-driven.

## Premature abstraction

**Smell:** a generic helper has one caller or encodes imagined future variation.

**Direction:** keep the direct implementation until a third meaningful occurrence; then extract the common semantics. Check existing modules and libraries before adding another implementation.

## Oversized function or parameter list

**Smell:** a function has more than about 20 body lines, more than three parameters, or multiple responsibilities.

**Direction:** split by responsibility and introduce a named options object when the parameter count exceeds three, unless an external runtime contract fixes the signature. Do not silence the diagnostic instead.
