/*
 * Repository-relative bundle builder.
 *
 * AzSkills module contracts link to supporting files with paths relative to
 * their own location inside this repository. A distributable plugin keeps that
 * layout, so the same relative paths resolve inside the plugin root and no
 * contract text has to be rewritten for distribution.
 */

import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { errorCode } from "./runtime.ts";

export interface BundleFile {
  /** Repository-relative POSIX path kept inside the bundle. */
  readonly name: string;
  /** Absolute source path on disk. */
  readonly source: string;
}

const BACKTICK = String.fromCharCode(96);
const SCANNED_EXTENSIONS = new Set([".md", ".html", ".htm", ".css"]);

export function inside(base: string, candidate: string): boolean {
  const relative = path.relative(base, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative));
}

export function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

export async function filesUnder(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Bundle source must not contain symbolic links: " + file);
    if (entry.isDirectory()) files.push(...(await filesUnder(file)));
    else if (entry.isFile()) files.push(file);
    else throw new Error("Bundle source contains an unsupported entry: " + file);
  }
  return files;
}

export function isScannable(file: string): boolean {
  return SCANNED_EXTENSIONS.has(path.extname(file).toLowerCase());
}

interface Reference {
  readonly target: string;
}

function splitSuffix(target: string): { pathname: string; suffix: string } {
  const index = target.search(/[?#]/);
  return { pathname: index < 0 ? target : target.slice(0, index), suffix: index < 0 ? "" : target.slice(index) };
}

export function isExternalTarget(target: string): boolean {
  return !target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target);
}

function fenceMarkers(content: string): string[] {
  // Returns the fenced-code state per line so links inside code are ignored.
  const markers: string[] = [];
  let fence = "";
  for (const line of content.split(/\r?\n/)) {
    const marker = new RegExp("^\\s{0,3}([" + BACKTICK + "~]{3,})").exec(line)?.[1];
    if (marker) {
      if (fence === "") fence = marker.slice(0, 1);
      else if (marker.slice(0, 1) === fence) fence = "";
      markers.push("fence");
      continue;
    }
    markers.push(fence);
  }
  return markers;
}

export function collectReferences(content: string, file: string): string[] {
  const extension = path.extname(file).toLowerCase();
  const targets: string[] = [];
  const markers = fenceMarkers(content);
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (markers[index] !== "") continue;
    const line = (lines[index] ?? "").replace(new RegExp(BACKTICK + "[^" + BACKTICK + "\\n]*" + BACKTICK, "g"), "");
    if (extension === ".md") {
      for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const target = match[1];
        if (target !== undefined) targets.push(target);
      }
    }
    if (extension === ".md" || extension === ".html" || extension === ".htm") {
      for (const match of line.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) {
        const target = match[2];
        if (target !== undefined) targets.push(target);
      }
      for (const match of line.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gi)) {
        for (const candidate of (match[2] ?? "").split(",")) {
          const target = candidate.trim().split(/\s+/)[0];
          if (target) targets.push(target);
        }
      }
    }
    if (extension === ".css") {
      for (const match of line.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
        const target = match[1];
        if (target !== undefined) targets.push(target.trim());
      }
    }
  }
  return targets;
}

export function resolveLocal(sourceFile: string, target: string, repoRoot: string): string | null {
  const trimmed = target.trim().replace(/^<|>$/g, "");
  if (isExternalTarget(trimmed)) return null;
  const { pathname } = splitSuffix(trimmed);
  if (!pathname) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  const resolved = path.resolve(path.dirname(sourceFile), decoded);
  return inside(repoRoot, resolved) ? resolved : null;
}

/**
 * Walks the local reference graph from the given seeds and returns every file
 * that must ship with the bundle, keyed by repository-relative path.
 */
export async function collectClosure(repoRoot: string, seeds: readonly string[]): Promise<Map<string, string>> {
  const base = path.resolve(repoRoot);
  const bundle = new Map<string, string>();
  const queue: string[] = [];
  const enqueueFile = (file: string): void => {
    if (!inside(base, file)) throw new Error("Bundle seed escapes repository: " + file);
    const name = toPosix(path.relative(base, file));
    if (!bundle.has(name)) bundle.set(name, file);
    if (isScannable(file)) queue.push(file);
  };
  const addPath = async (file: string): Promise<void> => {
    const info = await stat(file).catch((error: unknown) => {
      if (errorCode(error) === "ENOENT") throw new Error("Bundle reference is missing: " + toPosix(path.relative(base, file)));
      throw error;
    });
    if (info.isDirectory()) {
      for (const child of await filesUnder(file)) enqueueFile(child);
      return;
    }
    if (!info.isFile()) throw new Error("Bundle reference is not a file: " + file);
    enqueueFile(file);
  };
  for (const seed of seeds) await addPath(path.resolve(base, seed));

  const scanned = new Set<string>();
  while (queue.length > 0) {
    const file = queue.shift();
    if (file === undefined || scanned.has(file)) continue;
    scanned.add(file);
    const content = await readFile(file, "utf8").catch(() => null);
    if (content === null) continue;
    if (/^\uFEFF?[^\n]*\0/.test(content.slice(0, 64))) continue;
    for (const target of collectReferences(content, file)) {
      const resolved = resolveLocal(file, target, base);
      if (resolved === null || scanned.has(resolved)) continue;
      const name = toPosix(path.relative(base, resolved));
      if (bundle.has(name)) continue;
      await addPath(resolved);
    }
  }
  return bundle;
}

export async function materialize(bundle: Map<string, string>, targetDirectory: string): Promise<void> {
  const target = path.resolve(targetDirectory);
  for (const [name, source] of bundle) {
    const destination = path.resolve(target, name.split("/").join(path.sep));
    if (!inside(target, destination)) throw new Error("Bundle entry escapes target: " + name);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
  }
}

export async function validateBundle(directory: string): Promise<void> {
  const base = path.resolve(directory);
  const errors: string[] = [];
  for (const file of await filesUnder(base)) {
    if (!isScannable(file)) continue;
    const content = await readFile(file, "utf8");
    for (const target of collectReferences(content, file)) {
      const trimmed = target.trim().replace(/^<|>$/g, "");
      if (isExternalTarget(trimmed)) continue;
      const { pathname } = splitSuffix(trimmed);
      if (!pathname) continue;
      let decoded: string;
      try {
        decoded = decodeURIComponent(pathname);
      } catch {
        decoded = pathname;
      }
      const resolved = path.resolve(path.dirname(file), decoded);
      if (!inside(base, resolved)) {
        errors.push(toPosix(path.relative(base, file)) + ": link escapes bundle: " + trimmed);
        continue;
      }
      const present = await stat(resolved).then(() => true).catch(() => false);
      if (!present) errors.push(toPosix(path.relative(base, file)) + ": missing bundle link: " + trimmed);
    }
  }
  if (errors.length > 0) throw new Error("Incomplete bundle:\n- " + errors.join("\n- "));
}
