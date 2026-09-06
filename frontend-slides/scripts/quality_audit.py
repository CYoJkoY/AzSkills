#!/usr/bin/env python3
"""Static quality audit for Frontend Slides HTML decks.

This script catches common production mistakes before visual screenshot review.
It intentionally has no third-party dependencies.

Usage:
    python scripts/quality_audit.py path/to/deck.html
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


FAIL = "FAIL"
WARN = "WARN"
PASS = "PASS"


def check(label: str, ok: bool, detail: str, *, warning: bool = False) -> bool:
    status = PASS if ok else (WARN if warning else FAIL)
    print(f"[{status}] {label}: {detail}")
    return ok or warning


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/quality_audit.py path/to/deck.html")
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"[FAIL] File: not found: {path}")
        return 2

    html = path.read_text(encoding="utf-8")
    css = html
    failures = 0

    print(f"\nFrontend Slides quality audit: {path}\n")

    def require(label: str, pattern: str, detail: str, flags: int = re.I) -> None:
        nonlocal failures
        ok = re.search(pattern, html, flags) is not None
        if not check(label, ok, detail if ok else f"missing: {detail}"):
            failures += 1

    require("Fixed stage", r"\.deck-stage\s*\{[^}]*width\s*:\s*1920px[^}]*height\s*:\s*1080px", "1920px × 1080px stage")
    require("Viewport", r"\.deck-viewport\s*\{", ".deck-viewport exists")
    require("Reduced motion", r"@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)", "prefers-reduced-motion support")
    require("Keyboard navigation", r"ArrowRight|ArrowLeft|PageDown|PageUp", "keyboard slide controls")
    require("Touch navigation", r"touchstart|touchend", "touch/swipe handlers", warning=True)
    require("Slide state", r"classList\.toggle\(\s*['\"]active['\"]", "active class based slide switching")

    display_none = re.search(r"\.slide[^\{]*\{[^}]*display\s*:\s*none", css, re.I | re.S)
    if not check(
        "Slide visibility",
        display_none is None,
        "do not switch slides with display:none",
    ):
        failures += 1

    bad_negative = re.findall(r"-(?:clamp|min|max)\s*\(", css, re.I)
    if not check(
        "CSS function negation",
        not bad_negative,
        "use calc(-1 * clamp(...)) / min(...) / max(...)",
    ):
        failures += 1

    prohibited_fonts = re.findall(r"\b(?:Inter|Roboto|Arial)\b", css, re.I)
    if prohibited_fonts:
        check(
            "Display font choice",
            False,
            "generic display fonts detected: " + ", ".join(sorted(set(prohibited_fonts))),
            warning=True,
        )
    else:
        check("Display font choice", True, "no prohibited generic display font detected")

    internal_labels = re.findall(
        r"\b(?:preview|template|preset|wildcard|Option\s+[ABC]|generated\s+from)\b",
        re.sub(r"https?://[^\s\"']+", "", html),
        re.I,
    )
    if not check(
        "Workflow text",
        not internal_labels,
        "no internal generation labels appear in the deck",
        warning=True,
    ):
        pass

    placeholders = re.findall(r"\b(?:Lorem ipsum|TODO|TBD|Your Display Font|Presentation Title)\b", html, re.I)
    if not check(
        "Placeholder content",
        not placeholders,
        "no obvious placeholder text",
    ):
        failures += 1

    external_scripts = re.findall(r"<script[^>]+src\s*=\s*[\"']([^\"']+)", html, re.I)
    external_styles = re.findall(r"<link[^>]+(?:rel\s*=\s*[\"']stylesheet[\"'][^>]+href|href\s*=\s*[\"'][^\"']+[\"'][^>]+rel\s*=\s*[\"']stylesheet[\"'])[^>]*>", html, re.I)
    if not check(
        "Runtime dependencies",
        not external_scripts and not external_styles,
        "no external runtime CSS/JS dependency",
        warning=True,
    ):
        pass

    image_tags = re.findall(r"<img\b[^>]*>", html, re.I)
    missing_alt = [tag for tag in image_tags if not re.search(r"\balt\s*=", tag, re.I)]
    if not check(
        "Image accessibility",
        not missing_alt,
        "all img elements have alt attributes",
        warning=True,
    ):
        pass

    ids = re.findall(r"\bid\s*=\s*[\"']([^\"']+)[\"']", html, re.I)
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if not check(
        "Duplicate IDs",
        not duplicates,
        "no duplicate HTML ids",
    ):
        failures += 1

    active_slides = re.findall(r"<section\b[^>]*class\s*=\s*[\"'][^\"']*\b(?:slide|section-slide)\b[^\"']*\b(?:active|visible)\b[^\"']*[\"']", html, re.I)
    check(
        "Initial visible slides",
        len(active_slides) <= 1,
        f"{len(active_slides)} initially active/visible slide(s)",
        warning=True,
    )

    if re.search(r"\.slide[^\{]*\{[^}]*overflow\s*:\s*visible", css, re.I | re.S):
        check("Slide overflow", False, "slide overflow is visible", warning=True)
    else:
        check("Slide overflow", True, "no explicit visible overflow on slide blocks")

    print()
    if failures:
        print(f"Audit result: {FAIL} ({failures} blocking issue(s)).")
        print("Fix blocking issues, then perform rendered screenshot review at 1920×1080, 1280×720, and a phone viewport.")
        return 1

    print("Audit result: PASS. Continue with rendered screenshot review and visual refinement.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
