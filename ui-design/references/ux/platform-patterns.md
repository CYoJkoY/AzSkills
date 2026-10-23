# Platform UX Patterns

Load this reference when the product surface changes the interaction model. Use
the host platform's conventions before inventing a pattern.

## Windows desktop

- Respect native window behavior, resize, snap, and multi-monitor use.
- Support keyboard-first workflows and visible focus.
- Keep dense productivity layouts stable across DPI scaling.
- Use system integration only when it reduces a real task step.

## Browser extensions

- Popups have limited space; put the primary task above the fold.
- Explain permissions at the point of use, not in a wall of onboarding.
- Complete the common task in one or two actions.
- Respect browser conventions for tabs, history, downloads, and back navigation.
- Keep the extension usable when the service worker is asleep.

## Settings pages

- Group by user goal, not by implementation module.
- Show current value and default before advanced controls.
- Apply changes immediately or provide an explicit save state; never both silently.
- Keep destructive reset and export actions separated from routine settings.
- Make search or jump-to-setting available when the list is long.

## Developer tools

- Preserve information density and expert keyboard workflows.
- Keep raw values, identifiers, logs, and errors selectable.
- Make advanced configuration visible without forcing it on every user.
- Provide deterministic empty, loading, failure, and partial states.

## Localization

- Do not translate UI concepts word by word; adapt terminology and address form.
- Expect text expansion, CJK width, RTL direction, and different date and number formats.
- Avoid fixed-width labels and text baked into images.
- Keep commands, identifiers, and file paths unchanged.
