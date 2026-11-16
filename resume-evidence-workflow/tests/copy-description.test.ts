// Run with Node.js; no browser or third-party dependencies required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

interface ElementAttributes {
  main?: boolean;
  date?: boolean;
  row?: boolean;
  exclude?: string;
  field?: string;
}

interface FakeElement {
  tagName: string;
  innerText: string;
  textContent: string;
  children: FakeElement[];
  dataset: { copyExclude?: string; copyField?: string };
  matches(selector: string): boolean;
  querySelector(selector: string): FakeElement | null;
  main?: boolean;
  date?: boolean;
}

interface CopyEntry {
  label: string;
  company: string;
  role: string;
  dates: string;
  parts: string[];
}

interface FitSheet {
  ratio: number;
  index: number;
}

interface EditorDocument {
  body: { classList: { add(): void; remove(): void; toggle(): void } };
  querySelectorAll(): FitSheet[];
}

interface EditorContext {
  collectCopyEntries(page: FakeElement): CopyEntry[];
  preparePrint(): { safe: boolean };
  fitOnePage(target: unknown, compressOnly: boolean, sheet: FitSheet): void;
  contentMetrics(sheet: FitSheet): { ratio: number; overflow: boolean };
  updateFitStatus(): void;
  document: EditorDocument;
  currentBlock: unknown;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.join(here, '../assets/editable-resume-base.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'The resume editor must ship an inline script.');
const script = scriptMatch[1] ?? '';
new vm.Script(script); // Verify the complete editor's JavaScript syntax.
const start = script.indexOf('function collectCopyEntries(');
const end = script.indexOf('function buildCopyPanel(', start);
const sandbox: Partial<EditorContext> = {};
const context = vm.createContext(sandbox);
vm.runInContext(script.slice(start, end), context);

const collectCopyEntries = (page: FakeElement): CopyEntry[] => {
  const collect = context.collectCopyEntries;
  assert.ok(collect, 'collectCopyEntries must be defined by the editor script.');
  return collect(page);
};

function element(tag: string, text = '', children: FakeElement[] = [], attrs: ElementAttributes = {}): FakeElement {
  return {
    tagName: tag.toUpperCase(), innerText: text, textContent: text, children,
    dataset: { copyExclude: attrs.exclude, copyField: attrs.field },
    matches(selector: string): boolean {
      return selector.split(',').some((part) => part.trim() === tag || (part.trim() === '.row' && attrs.row === true));
    },
    querySelector(selector: string): FakeElement | null {
      if (selector.startsWith('[data-copy-field=')) {
        const field = selector.match(/"([^"]+)"/)?.[1];
        return children.find((child) => child.dataset.copyField === field)
          ?? children.map((child) => child.querySelector(selector)).find((found) => found !== null)
          ?? null;
      }
      return children.find((child) => selector === 'b.row-main' ? child.tagName === 'B' && child.main === true : selector === '.row-date' ? child.date === true : child.main === true) ?? null;
    },
    main: attrs.main, date: attrs.date,
  };
}

function header(label: string, date: string): FakeElement {
  return element('div', '', [element('b', label, [], { main: true }), element('span', date, [], { date: true })], { row: true });
}

const boldBody = element('p', 'A fully bold description.', [element('b', 'A fully bold description.')]);
const editedBullet = element('li', 'First contribution.');
const page = element('main', '', [
  element('h2', 'Experience'), header('Example Company | Intern', '2024–2025'),
  element('p', 'Example department', [], { exclude: 'true' }),
  element('p', 'Work overview.'), boldBody,
  element('ul', '', [editedBullet, element('li', 'Second contribution.')]),
  header('Sample Project | Contributor', '2025'),
  element('ul', '', [element('li', 'Project description.')]),
  element('h2', 'Skills'), element('p', 'Must not become project content.'),
]);
const entries = collectCopyEntries(page);
assert.equal(entries.length, 2);
const first = entries[0];
assert.ok(first, 'The first experience entry must exist.');
assert.equal(first.label, 'Example Company | Intern');
assert.equal(first.company, 'Example Company');
assert.equal(first.role, 'Intern');
assert.equal(first.dates, '2024–2025');
assert.equal(first.parts.join('\n'), 'Work overview.\nA fully bold description.\nFirst contribution.\nSecond contribution.');
assert.equal(entries[1]?.parts.join('\n'), 'Project description.');
assert(!first.parts.join('\n').includes('2024'));
assert(!first.parts.join('\n').includes('Example department'));
editedBullet.innerText = 'Edited contribution.';
assert(collectCopyEntries(page)[0]?.parts.includes('Edited contribution.') === true);
const zhPage = element('main', '', [element('h2', '项目经历'), header('示例项目', '2025'), element('p', '项目背景。'), element('ul', '', [element('li', '项目正文。')])]);
assert.equal(collectCopyEntries(zhPage)[0]?.parts.join('\n'), '项目背景。\n项目正文。');
console.log('PASS: grouping, metadata exclusion, bold descriptions, ordering, live edits, English and Chinese text, editor syntax.');

const explicit = element('main', '', [
  element('h2', 'Experience'),
  element('div', '', [
    element('b', 'Example Holdings Limited\nResearch Analyst', [
      element('span', 'Example Holdings Limited', [], { field: 'company' }),
      element('span', 'Research Analyst', [], { field: 'role' }),
    ], { main: true }),
    element('span', '2023–2025', [], { field: 'dates' }),
    element('span', 'Example City'),
  ], { row: true }),
  element('p', 'Work content.'),
]);
const fields = collectCopyEntries(explicit)[0];
assert.ok(fields, 'The explicit-field entry must exist.');
assert.equal(fields.company, 'Example Holdings Limited');
assert.equal(fields.role, 'Research Analyst');
assert.equal(fields.dates, '2023–2025');
assert.equal(fields.parts.join('\n'), 'Work content.');
console.log('PASS: separate full employer, role and dates, location exclusion.');

const printStart = script.indexOf('function preparePrint(');
const printEnd = script.indexOf('function finishPrint(', printStart);
let ratios = [0.35, 0.96];
const fitted: number[] = [];
context.document = { body: { classList: { add(): void {}, remove(): void {}, toggle(): void {} } }, querySelectorAll: () => ratios.map((ratio, index) => ({ ratio, index })) };
context.currentBlock = null;
context.fitOnePage = (_target: unknown, compressOnly: boolean, sheet: FitSheet): void => {
  assert.equal(compressOnly, true);
  fitted.push(sheet.index);
};
context.contentMetrics = (sheet: FitSheet) => ({ ratio: sheet.ratio, overflow: sheet.ratio > 1 });
context.updateFitStatus = (): void => {};
vm.runInContext(script.slice(printStart, printEnd), context);
const preparePrint = (): { safe: boolean } => {
  const prepare = context.preparePrint;
  assert.ok(prepare, 'preparePrint must be defined by the editor script.');
  return prepare();
};
assert.equal(preparePrint().safe, true);
assert.deepEqual(fitted, [0, 1]);
ratios = [0.96, 1.1];
assert.equal(preparePrint().safe, false);
console.log('PASS: per-language compression-only preflight, under-filled page allowed, overflowing page blocked.');
