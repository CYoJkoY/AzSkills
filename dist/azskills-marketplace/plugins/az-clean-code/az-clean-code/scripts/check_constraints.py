#!/usr/bin/env python3
"""Check language-neutral tabs and Python function complexity constraints."""
import ast
import argparse
import json
from pathlib import Path
import sys

SOURCE_SUFFIXES = {".py", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".java", ".cs", ".go", ".rs", ".php", ".rb", ".swift", ".kt"}
IGNORED = {".git", "node_modules", "vendor", "dist", "build", "__pycache__"}
POLICY = json.loads((Path(__file__).parent.parent / "constraints.json").read_text(encoding="utf-8"))
LIMITS = POLICY["limits"]

def control_depth(node, level=0):
    controls = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.With, ast.AsyncWith, ast.Match)
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)):
        return level
    current = level + int(isinstance(node, controls))
    return max([current] + [control_depth(child, current) for child in ast.iter_child_nodes(node)])

def function_findings(path, node):
    count = sum((len(node.args.posonlyargs), len(node.args.args), len(node.args.kwonlyargs), int(node.args.vararg is not None), int(node.args.kwarg is not None)))
    end = max(getattr(item, "end_lineno", item.lineno) for item in node.body)
    lines = end - node.lineno
    depth = max((control_depth(item) for item in node.body), default=0)
    findings = []
    if count > LIMITS["functionParameters"]: findings.append(f"{path}:{node.lineno}: {node.name} has {count} parameters (limit {LIMITS['functionParameters']})")
    if lines > LIMITS["functionBodyLinesReviewAt"]: findings.append(f"{path}:{node.lineno}: {node.name} spans {lines} lines (review above {LIMITS['functionBodyLinesReviewAt']} body lines)")
    if depth > LIMITS["controlFlowDepth"]: findings.append(f"{path}:{node.lineno}: {node.name} has control-flow nesting depth {depth} (limit {LIMITS['controlFlowDepth']})")
    return findings

def python_findings(path, source):
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as error:
        return [f"{path}:{error.lineno}: Python syntax error: {error.msg}"]
    functions = (node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.body)
    return [finding for node in functions for finding in function_findings(path, node)]

def expand_path(item):
    path = Path(item)
    if path.is_file(): return [path]
    if path.is_dir(): return [file for file in path.rglob("*") if file.is_file() and file.suffix.lower() in SOURCE_SUFFIXES and not IGNORED.intersection(file.parts)]
    raise FileNotFoundError(path)

def source_files(items):
    return sorted(set(file for item in items for file in expand_path(item)))

def check_file(path):
    if path.suffix.lower() not in SOURCE_SUFFIXES: return []
    source = path.read_text(encoding="utf-8")
    findings = [f"{path}:{number}: tab character found (C2)" for number, line in enumerate(source.splitlines(), 1) if "\t" in line]
    if path.suffix.lower() == ".py": findings.extend(python_findings(path, source))
    return findings

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", help="source files or directories")
    parser.add_argument("--json", action="store_true", help="emit findings and coverage as JSON")
    args = parser.parse_args()
    try:
        files = source_files(args.paths)
    except OSError as error:
        print(f"Missing path: {error}", file=sys.stderr)
        return 2
    findings = [finding for path in files for finding in check_file(path)]
    review_modes = {"review", "before-coding-review"}
    report = {"ok": not findings, "files": len(files), "findings": findings, "automated": ["C2 supported-language tab scan", "C3 Python AST nesting", "C6 Python AST parameter and size review"], "reviewRequired": [key for key, rule in POLICY["checks"].items() if rule["mode"] in review_modes] + ["non-Python C3/C6"]}
    if args.json: print(json.dumps(report, indent=2))
    elif findings: print("\n".join(findings))
    else: print(f"Clean-code checks passed for {len(files)} files; semantic constraints and non-Python complexity require review.")
    return 0 if not findings else 1

if __name__ == "__main__":
    raise SystemExit(main())
