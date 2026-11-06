"""Dependency-free report preflight; rendered layout and font QA remain required."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re


class Report(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.anchors = []
        self.stylesheets = []
        self.pages = 0
        self.viewport = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "section" and "report-page" in attrs.get("class", "").split():
            self.pages += 1
        if tag == "a" and attrs.get("href", "").startswith("#"):
            self.anchors.append(unquote(attrs["href"][1:]))
        if tag == "meta" and attrs.get("name") == "viewport":
            self.viewport = attrs.get("content", "")
        if tag == "link" and "stylesheet" in attrs.get("rel", "").split():
            self.stylesheets.append(attrs["href"])


def audit(path: Path) -> int:
    if not path.is_file():
        print(f"[FAIL] File not found: {path}")
        return 2
    html = path.read_text(encoding="utf-8")
    report = Report()
    report.feed(html)
    css = html
    failures = []

    def check(label, ok):
        print(f"[{'PASS' if ok else 'FAIL'}] {label}")
        if not ok:
            failures.append(label)

    for href in report.stylesheets:
        parsed = urlsplit(href)
        if parsed.scheme or parsed.netloc:
            check("No remote report stylesheet", False)
            continue
        stylesheet = path.parent / unquote(parsed.path)
        check("Local report stylesheet exists", stylesheet.is_file())
        if stylesheet.is_file():
            css += stylesheet.read_text(encoding="utf-8")

    check("Logical report pages exist", report.pages > 0)
    check("Unique IDs", len(report.ids) == len(set(report.ids)))
    check("Internal links resolve", all(anchor in report.ids for anchor in report.anchors))
    check("Device viewport with zoom allowed",
          "width=device-width" in report.viewport
          and not re.search(r"user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=", report.viewport))
    for label, pattern in [
        ("Requested font family declared", r"Maple Mono NF CN"),
        ("Report body size token", r"--report-body\s*:\s*1\.125rem"),
        ("Caption size token", r"--report-caption\s*:\s*1rem"),
        ("Phone reflow breakpoint", r"@media[^{}]*max-width\s*:\s*48rem"),
        ("44px navigation targets", r"min-height\s*:\s*44px"),
        ("Print layout", r"@media\s+print"),
        ("Reduced motion", r"prefers-reduced-motion"),
    ]:
        check(label, re.search(pattern, css, re.I) is not None)
    check("No fixed-stage scaling", not re.search(r"scale\s*\(|deck-stage", css, re.I))
    if not re.search(r"@font-face[^}]*url\(", css, re.I | re.S):
        print("[WARN] No bundled/embedded font face: exact-font delivery is unverified.")
    print(f"Report preflight: {'FAIL' if failures else 'PASS'}. Render every page on phone and desktop; verify actual fonts and print separately.")
    return 1 if failures else 0
