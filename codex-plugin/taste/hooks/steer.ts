#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {normalizeLocalTool} from './local-tools.ts';
import {errorCode, errorMessage, isRecord} from '../../../scripts/runtime.ts';
import type {HookEvent} from '../../../scripts/types.ts';

type Route = 'main' | 'user' | 'sub' | 'agent';
type HookEventName = 'SessionStart' | 'UserPromptSubmit' | 'SubagentStart' | 'PostToolUse';
type AgentInputKind = 'receipt' | 'mailbox';

interface Classification {
  route: Route | null;
  reason: string;
}

interface HookResponse {
  continue: true;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext: string;
  };
}

interface ChildState {
  file: string;
  previous: string;
  state: {turnId: string; initialPending?: boolean};
}

class HookError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FALLBACK_ROUTES: ReadonlyMap<string, HookEventName> = new Map([['user', 'UserPromptSubmit'], ['sub', 'SubagentStart'], ['agent', 'PostToolUse']]);

function fail(code: string, message: string): never {
  throw new HookError(code, message);
}

function parseEvent(raw: unknown): HookEvent {
  let event: unknown = raw;
  if (typeof raw === 'string') {
    try {
      event = JSON.parse(raw);
    } catch (error) {
      // Preserve the original error object and its message; only the code is added.
      if (error !== null && typeof error === 'object') Object.assign(error, {code: 'INVALID_INPUT'});
      throw error;
    }
  }
  if (!isRecord(event)) fail('INVALID_INPUT', 'Expected a Codex hook event object');
  if (typeof event.hook_event_name !== 'string' || !event.hook_event_name) fail('MISSING_METADATA', 'stdin event is missing hook_event_name');
  return { ...event, hook_event_name: event.hook_event_name };
}

function agentInputKind(response: unknown): AgentInputKind | null {
  let value: unknown = response;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!isRecord(value) || value.timed_out !== false) return null;
  const status = value.status;
  if (isRecord(status) && Object.values(status).some((entry) => isRecord(entry) && typeof entry.completed === 'string')) return 'receipt';
  // Codex 0.162.1's collaboration wait wakes Main for pending mailbox input.
  // It is not a completion receipt; the reminder asks Main to reconcile input.
  return !Object.hasOwn(value, 'status') && value.message === 'Wait completed.' ? 'mailbox' : null;
}

function classify(event: HookEvent, knownChild = false): Classification {
  if (event.hook_event_name === 'SessionStart') return {route: 'main', reason: 'INJECTED'};
  if (event.hook_event_name === 'UserPromptSubmit') return {route: event.agent_id || knownChild ? 'sub' : 'user', reason: 'INJECTED'};
  if (event.hook_event_name === 'SubagentStart') return {route: 'sub', reason: 'INJECTED'};
  if (event.hook_event_name !== 'PostToolUse') return {route: null, reason: 'UNSUPPORTED_EVENT'};
  if (typeof event.tool_name !== 'string' || !event.tool_name) fail('MISSING_METADATA', 'PostToolUse event is missing tool_name');
  if (!normalizeLocalTool(event.tool_name)) return {route: null, reason: 'UNSUPPORTED_TOOL'};
  if (event.agent_id || knownChild) return {route: null, reason: 'CHILD_RESULT'};
  if (!Object.hasOwn(event, 'tool_response')) fail('MISSING_METADATA', 'wait_agent PostToolUse event is missing tool_response');
  const kind = agentInputKind(event.tool_response);
  return kind ? {route: 'agent', reason: kind === 'mailbox' ? 'MAILBOX_UPDATE' : 'INJECTED'} : {route: null, reason: 'NOT_COMPLETED'};
}

function childState(event: HookEvent, dataDirectory: string | null): ChildState | null {
  const childId = event.agent_id || event.session_id;
  if (!dataDirectory || typeof childId !== 'string' || !childId) return null;
  const directory = path.join(dataDirectory, 'steer-start');
  // Windows can report ENOENT for a lookup beneath a regular file.
  for (const location of [dataDirectory, directory]) {
    let info;
    try {
      info = fs.statSync(location);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return null;
      fail('STATE_IO_FAILED', `Cannot read child identity at ${location}: ${errorMessage(error)}`);
    }
    if (!info.isDirectory()) fail('STATE_IO_FAILED', `Child identity requires a directory: ${location}`);
  }
  const file = path.join(directory, `${encodeURIComponent(childId)}.json`);
  const candidates = [file];
  // Existing installations used a parent/child key for the initial-turn record.
  if (event.agent_id && typeof event.session_id === 'string') {
    candidates.push(path.join(directory, `${encodeURIComponent(event.session_id)}--${encodeURIComponent(childId)}.json`));
  }
  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (!isRecord(parsed) || typeof parsed.turnId !== 'string' || (Object.hasOwn(parsed, 'initialPending') && typeof parsed.initialPending !== 'boolean')) throw new Error('Invalid child-turn record');
      return {
        file,
        previous: candidate,
        state: {
          turnId: parsed.turnId,
          initialPending: typeof parsed.initialPending === 'boolean' ? parsed.initialPending : undefined,
        },
      };
    } catch (error) {
      if (errorCode(error) === 'ENOENT') continue;
      fail('STATE_IO_FAILED', `Cannot read child identity at ${candidate}: ${errorMessage(error)}`);
    }
  }
  return null;
}

function recordChild(file: string, state: {turnId: string; initialPending: boolean}, previous = file): void {
  try {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, JSON.stringify(state));
    if (previous !== file) fs.unlinkSync(previous);
  } catch (error) {
    fail('STATE_IO_FAILED', `Cannot record child identity at ${file}: ${errorMessage(error)}`);
  }
}

export function selectRoute(event: unknown): Route | null {
  return classify(parseEvent(event)).route;
}

function routeOutput(route: Route, hookEventName: string, prompts: string | Partial<Record<Route, string>>): HookResponse {
  const file = typeof prompts === 'object' ? prompts[route] : path.join(prompts, route === 'main' ? '../recipe/main.md' : `${route}-steer.md`);
  if (file === undefined) fail('MISSING_SOURCE', `No ${route} Steer source is configured`);
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8').trim();
  } catch (error) {
    fail('MISSING_SOURCE', `Cannot read the ${route} Steer at ${file}: ${errorMessage(error)}`);
  }
  if (!text) fail('MISSING_SOURCE', `The ${route} Steer file is empty: ${file}`);
  return {continue: true, hookSpecificOutput: {
    hookEventName,
    additionalContext: `<gpt-with-taste-${route}-steer>\n${text}\n</gpt-with-taste-${route}-steer>`,
  }};
}

export function evaluateHook(raw: unknown, prompts: string | Partial<Record<Route, string>> = path.join(root, 'prompts'), dataDirectory: string | null = null): Classification & {response: HookResponse} {
  const event = parseEvent(raw);
  const readsIdentity = event.hook_event_name === 'UserPromptSubmit' ||
    (event.hook_event_name === 'PostToolUse' && normalizeLocalTool(event.tool_name) !== null);
  const knownChild = readsIdentity ? childState(event, dataDirectory) : null;
  const result = classify(event, knownChild !== null);
  if (!result.route) return {...result, response: {continue: true}};
  if (result.route === 'sub' && dataDirectory) {
    const childId = event.agent_id || (knownChild ? event.session_id : null);
    if (['session_id', 'turn_id'].some((key) => typeof event[key] !== 'string' || !event[key]) || typeof childId !== 'string' || !childId) {
      fail('MISSING_METADATA', `${event.hook_event_name} requires string session_id, turn_id and a known child identity`);
    }
    const file = path.join(dataDirectory, 'steer-start', `${encodeURIComponent(childId)}.json`);
    if (event.hook_event_name === 'SubagentStart') {
      const response = routeOutput(result.route, event.hook_event_name, prompts);
      recordChild(file, {turnId: event.turn_id ?? '', initialPending: true});
      return {...result, response};
    }
    // Suppress only an observed paired turn. A missing initial input must never
    // suppress a later turn, and consuming the pair must not erase child identity.
    const state = knownChild?.state;
    const duplicate = state !== undefined && state.initialPending !== false && state.turnId === event.turn_id;
    const response: HookResponse = duplicate ? {continue: true} : routeOutput(result.route, event.hook_event_name, prompts);
    recordChild(file, {turnId: state?.turnId ?? event.turn_id ?? '', initialPending: false}, knownChild?.previous ?? file);
    return {...result, reason: duplicate ? 'DEDUPLICATED' : result.reason, response};
  }
  return {...result, response: routeOutput(result.route, event.hook_event_name, prompts)};
}

export function handleHook(raw: unknown, prompts: string | Partial<Record<Route, string>> = path.join(root, 'prompts'), dataDirectory: string | null = null): HookResponse {
  return evaluateHook(raw, prompts, dataDirectory).response;
}

export function fallbackHook(route: unknown): never {
  if (typeof route !== 'string' || !FALLBACK_ROUTES.has(route)) fail('MISSING_METADATA', `Invalid --route fallback: ${typeof route === 'string' ? route : '(missing)'}`);
  fail('MISSING_METADATA', `The ${route} route requires event JSON to identify its consumer, turn and completed result`);
}

function isFallbackRoute(value: string): value is Route {
  return FALLBACK_ROUTES.has(value);
}

function cliRoute(argv: string[]): Route | null {
  const index = argv.indexOf('--route');
  if (index < 0 || index + 1 >= argv.length || argv.length !== index + 2) return null;
  const candidate = argv[index + 1];
  if (candidate === undefined || !isFallbackRoute(candidate)) return null;
  // The CLI argument is the short route name (`user`, `sub`, `agent`); the
  // fallback event name lives in FALLBACK_ROUTES.
  return candidate;
}

function audit(event: HookEvent | undefined, route: Route | null, fallback: boolean, reason: string, emitted: boolean): void {
  const auditFile = process.env.GPT_WITH_TASTE_HOOK_AUDIT;
  if (!auditFile) return;
  const record = {event: event?.hook_event_name ?? null, sessionId: event?.session_id ?? null,
    turnId: event?.turn_id ?? null, agentId: event?.agent_id ?? null, agentType: event?.agent_type ?? null,
    tool: event?.tool_name ?? null, normalizedTool: normalizeLocalTool(event?.tool_name), toolUseId: event?.tool_use_id ?? null,
    route, fallback, reason, emitted, injected: emitted};
  try { fs.appendFileSync(auditFile, JSON.stringify(record) + '\n'); }
  catch (error) { process.stderr.write(`GPT with Taste Hook [AUDIT_WRITE_FAILED]: ${errorMessage(error)}\n`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let event: HookEvent | undefined;
  let fallback = false;
  let route: Route | null = null;
  try {
    let input = '';
    for await (const chunk of process.stdin) input += String(chunk);
    const fallbackRoute = cliRoute(process.argv.slice(2));
    fallback = input.trim() === '';
    if (fallback && !fallbackRoute) fail('MISSING_METADATA', 'Expected a Codex hook event JSON object on stdin');
    event = fallback ? {hook_event_name: FALLBACK_ROUTES.get(fallbackRoute ?? '') ?? ''} : parseEvent(input);
    const needsState = event.hook_event_name === 'SubagentStart' || (event.hook_event_name === 'UserPromptSubmit' && Boolean(event.agent_id));
    const stateRoot = process.env.PLUGIN_DATA ?? process.env.CLAUDE_PLUGIN_DATA;
    if (!fallback && needsState && !stateRoot?.trim()) fail('MISSING_METADATA', `${event.hook_event_name} requires nonempty PLUGIN_DATA or CLAUDE_PLUGIN_DATA for initial child-turn dedup`);
    if (fallback) fallbackHook(fallbackRoute);
    const result = evaluateHook(event, path.join(root, 'prompts'), stateRoot ?? null);
    route = result.route;
    audit(event, route, fallback, result.reason, Boolean(result.response.hookSpecificOutput));
    process.stdout.write(JSON.stringify(result.response) + '\n');
  } catch (error) {
    const code = errorCode(error) ?? 'HOOK_FAILED';
    audit(event, route, fallback, code, false);
    process.stderr.write(`GPT with Taste Hook [${code}]: ${errorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
