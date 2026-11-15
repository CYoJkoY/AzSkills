#!/usr/bin/env python3
"""Check language-neutral tabs and Python function complexity constraints."""
import ast
import argparse
from pathlib import Path
import sys

SOURCE_SUFFIXES = {".py", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".java", ".cs", ".go", ".rs", ".php", ".rb", ".swift", ".kt"}
IGNORED = {".git", "node_modules", "vendor", "dist", "build", "__pycache__"}

def control_depth(node, level=0):
    controls = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.With, ast.AsyncWith, ast.Match)
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)) and level:
        return level
    current = level + int(isinstance(node, controls))
    return max([current] + [control_depth(child, current) for child in ast.iter_child_nodes(node)])

def function_findings(path, node):
    count = sum((len(node.args.posonlyargs), len(node.args.args), len(node.args.kwonlyargs), int(node.args.vararg is not None), int(node.args.kwarg is not None)))
    end = max(getattr(item, "end_lineno", item.lineno) for item in node.body)
    lines = end - node.lineno
    depth = max((control_depth(item) for item in node.body), default=0)
    findings = []
    if count > 3: findings.append(f"{path}:{node.lineno}: {node.name} has {count} parameters (limit 3)")
    if lines > 21: findings.append(f"{path}:{node.lineno}: {node.name} spans {lines} lines (review above 20 body lines)")
    if depth > 2: findings.append(f"{path}:{node.lineno}: {node.name} has control-flow nesting depth {depth} (limit 2)")
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
    args = parser.parse_args()
    try:
        files = source_files(args.paths)
    except OSError as error:
        print(f"Missing path: {error}", file=sys.stderr)
        return 2
    findings = [finding for path in files for finding in check_file(path)]
    if findings:
        print("\n".join(findings))
        return 1
    print(f"Clean-code structural checks passed for {len(set(files))} source files. Python AST checks: .py files only; semantic constraints require review.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
