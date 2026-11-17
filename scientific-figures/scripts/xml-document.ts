import { decodeXmlEntities, validateXmlCharacters } from "./xml-entities.ts";

export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  parent: number | null;
  children: number[];
  text: string;
  selfClosing: boolean;
  line: number;
}

export interface XmlDocument {
  elements: XmlElement[];
  roots: number[];
  errors: string[];
}

interface ParserState {
  source: string;
  elements: XmlElement[];
  roots: number[];
  stack: number[];
  errors: string[];
  cursor: number;
}

interface AttributeRead {
  value: string;
  next: number;
  error: string | null;
}

const NAME = /^[A-Za-z_][\w:.-]*$/;
const XML_SPACE = /[ \t\r\n]/;
const SECTIONS: readonly (readonly [string, string])[] = [
  ["<!--", "-->"],
  ["<![CDATA[", "]]>"],
  ["<?", "?>"],
  ["<!", ">"],
];

const lineAt = (state: ParserState, offset: number): number =>
  state.source.slice(0, offset).split("\n").length;

function tagEnd(source: string, start: number): number {
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (quote === "" && (char === '"' || char === "'")) quote = char;
    else if (quote !== "" && char === quote) quote = "";
    else if (quote === "" && char === ">") return index;
  }
  return -1;
}

function appendRawText(state: ParserState, raw: string): void {
  const top = state.stack.at(-1);
  if (top === undefined) {
    if (raw.trim() !== "") state.errors.push("text outside the root element: " + JSON.stringify(raw.trim().slice(0, 40)));
    return;
  }
  state.elements[top]!.text += raw;
}

function appendDecodedText(state: ParserState, raw: string, offset: number): void {
  try {
    appendRawText(state, decodeXmlEntities(raw));
  } catch (error) {
    state.errors.push((error instanceof Error ? error.message : String(error)) + " in text at line " + lineAt(state, offset));
  }
}

function readValue(body: string, from: number, subject: AttributeSubject): AttributeRead {
  let cursor = from;
  while (XML_SPACE.test(body[cursor] ?? "")) cursor += 1;
  if (body[cursor] !== "=") return { value: "", next: cursor, error: subject.key + " has no value in <" + subject.name + "> at line " + subject.line };
  cursor += 1;
  while (XML_SPACE.test(body[cursor] ?? "")) cursor += 1;
  const quote = body[cursor];
  if (quote !== '"' && quote !== "'") return { value: "", next: cursor, error: subject.key + " is unquoted in <" + subject.name + "> at line " + subject.line };
  const end = body.indexOf(quote, cursor + 1);
  if (end < 0) return { value: "", next: cursor, error: subject.key + " is unterminated in <" + subject.name + "> at line " + subject.line };
  if (body.slice(cursor + 1, end).includes("<")) return { value: "", next: end, error: "literal < in attribute " + subject.key + " at line " + subject.line };
  try {
    return { value: decodeXmlEntities(body.slice(cursor + 1, end)), next: end + 1, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { value: "", next: end, error: message + " in attribute " + subject.key + " at line " + subject.line };
  }
}

interface AttributeSubject {
  key: string;
  name: string;
  line: number;
}

function readAttributes(body: string, name: string, line: number): { attributes: Record<string, string>; error: string | null } {
  const attributes: Record<string, string> = {};
  let cursor = name.length;
  while (cursor < body.length) {
    if (!XML_SPACE.test(body[cursor] ?? "")) return { attributes, error: "missing XML whitespace before attribute in <" + name + "> at line " + line };
    while (XML_SPACE.test(body[cursor] ?? "")) cursor += 1;
    if (cursor >= body.length) break;
    const matched = /^[^ \t\r\n=/>]+/.exec(body.slice(cursor));
    if (matched === null || !NAME.test(matched[0])) return { attributes, error: "invalid attribute name in <" + name + "> at line " + line };
    const key = matched[0];
    const read = readValue(body, cursor + key.length, { key, name, line });
    if (read.error !== null) return { attributes, error: read.error };
    if (Object.hasOwn(attributes, key)) return { attributes, error: "duplicate attribute " + key + " in <" + name + "> at line " + line };
    Object.defineProperty(attributes, key, { value: read.value, enumerable: true, writable: true, configurable: true });
    cursor = read.next;
  }
  return { attributes, error: null };
}

function closeTag(state: ParserState, name: string, line: number): void {
  if (!NAME.test(name)) {
    state.errors.push("invalid closing tag </" + name + "> at line " + line);
    return;
  }
  const top = state.stack.pop();
  if (top === undefined) state.errors.push("stray closing tag </" + name + "> at line " + line);
  else if (state.elements[top]?.name !== name) state.errors.push("mismatched closing tag </" + name + "> at line " + line);
}

function appendElement(state: ParserState, node: XmlElement): void {
  node.parent = state.stack.at(-1) ?? null;
  const index = state.elements.push(node) - 1;
  if (node.parent === null) state.roots.push(index);
  else state.elements[node.parent]!.children.push(index);
  if (!node.selfClosing) state.stack.push(index);
}

function readTag(state: ParserState, end: number, open: number): void {
  const line = lineAt(state, open);
  const raw = state.source.slice(open + 1, end);
  if (raw.startsWith("/")) {
    closeTag(state, raw.slice(1).replace(/[ \t\r\n]+$/, ""), line);
    return;
  }
  const selfClosing = raw.endsWith("/");
  const body = selfClosing ? raw.slice(0, -1) : raw;
  const name = /^[^ \t\r\n/]+/.exec(body)?.[0] ?? "";
  if (!NAME.test(name)) {
    state.errors.push("unreadable tag at line " + line);
    return;
  }
  const parsed = readAttributes(body, name, line);
  if (parsed.error !== null) state.errors.push(parsed.error);
  else appendElement(state, { name, attributes: parsed.attributes, parent: null, children: [], text: "", selfClosing, line });
}

function sectionKind(source: string, open: number): number {
  return SECTIONS.findIndex(([start]) => source.startsWith(start, open));
}

function readSection(state: ParserState, open: number, kind: number): number {
  const [start, terminator] = SECTIONS[kind]!;
  const from = open + start.length;
  const end = kind === 3 ? tagEnd(state.source, from) : state.source.indexOf(terminator, from);
  if (end < 0) {
    state.errors.push("unterminated " + (start === "<!--" ? "comment" : start === "<![CDATA[" ? "CDATA" : start === "<?" ? "processing instruction" : "declaration") + " at line " + lineAt(state, open));
    return state.source.length;
  }
  const content = state.source.slice(from, end);
  if (kind === 0 && (content.includes("--") || content.endsWith("-"))) state.errors.push("invalid -- in comment at line " + lineAt(state, open));
  if (start === "<![CDATA[") appendRawText(state, content);
  return end + terminator.length;
}

function readMarkup(state: ParserState, open: number): number {
  const kind = sectionKind(state.source, open);
  if (kind >= 0) return readSection(state, open, kind);
  const end = tagEnd(state.source, open + 1);
  if (end < 0) {
    state.errors.push("unterminated tag at line " + lineAt(state, open));
    return state.source.length;
  }
  readTag(state, end, open);
  return end + 1;
}

export function parseXml(source: string): XmlDocument {
  const state: ParserState = { source, elements: [], roots: [], stack: [], errors: [], cursor: 0 };
  try {
    validateXmlCharacters(source);
  } catch (error) {
    state.errors.push(error instanceof Error ? error.message : String(error));
  }
  while (state.cursor < source.length) {
    const open = source.indexOf("<", state.cursor);
    if (open < 0) {
      appendDecodedText(state, source.slice(state.cursor), state.cursor);
      break;
    }
    if (open > state.cursor) appendDecodedText(state, source.slice(state.cursor, open), state.cursor);
    state.cursor = readMarkup(state, open);
  }
  for (const index of state.stack) state.errors.push("unclosed <" + state.elements[index]!.name + "> at line " + state.elements[index]!.line);
  return { elements: state.elements, roots: state.roots, errors: state.errors };
}
