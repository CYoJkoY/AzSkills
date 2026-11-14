#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {normalizeLocalTool} from './local-tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FALLBACK_ROUTES = new Map([['user', 'UserPromptSubmit'], ['sub', 'SubagentStart'], ['agent', 'PostToolUse']]);
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function parseEvent(raw) {
  let event = raw;
  if (typeof raw === 'string') {
    try { event = JSON.parse(raw); } catch (error) { error.code = 'INVALID_INPUT'; throw error; }
  }
  if (!event || typeof event !== 'object' || Array.isArray(event)) fail('INVALID_INPUT', 'Expected a Codex hook event object');
  if (typeof event.hook_event_name !== 'string' || !event.hook_event_name) fail('MISSING_METADATA', 'stdin event is missing hook_event_name');
  return event;
}
function agentInputKind(response) {
  let value = response;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!value || value.timed_out !== false) return null;
  if (value.status && typeof value.status === 'object' &&
      Object.values(value.status).some(status => status && typeof status.completed === 'string')) return 'receipt';
  // Codex 0.162.1's collaboration wait wakes Main for pending mailbox input.
  // It is not a completion receipt; the reminder asks Main to reconcile input.
  return !Object.hasOwn(value, 'status') && value.message === 'Wait completed.' ? 'mailbox' : null;
}
function classify(event, knownChild = false) {
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
function childState(event, dataDirectory) {
  const childId = event.agent_id || event.session_id;
  if (!dataDirectory || typeof childId !== 'string' || !childId) return null;
  const directory = path.join(dataDirectory, 'steer-start');
  // Windows can report ENOENT for a lookup beneath a regular file.
  for (const location of [dataDirectory, directory]) {
    let state;
    try { state = fs.statSync(location); }
    catch (error) {
      if (error.code === 'ENOENT') return null;
      fail('STATE_IO_FAILED', `Cannot read child identity at ${location}: ${error.message}`);
    }
    if (!state.isDirectory()) fail('STATE_IO_FAILED', `Child identity requires a directory: ${location}`);
  }
  const file = path.join(directory, `${encodeURIComponent(childId)}.json`);
  const candidates = [file];
  // Existing installations used a parent/child key for the initial-turn record.
  if (event.agent_id && typeof event.session_id === 'string') {
    candidates.push(path.join(directory, `${encodeURIComponent(event.session_id)}--${encodeURIComponent(childId)}.json`));
  }
  for (const candidate of candidates) {
    try {
      const state = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (typeof state.turnId !== 'string' || (Object.hasOwn(state, 'initialPending') && typeof state.initialPending !== 'boolean')) throw new Error('Invalid child-turn record');
      return {file, previous: candidate, state};
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      fail('STATE_IO_FAILED', `Cannot read child identity at ${candidate}: ${error.message}`);
    }
  }
  return null;
}
function recordChild(file, state, previous = file) {
  try {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, JSON.stringify(state));
    if (previous !== file) fs.unlinkSync(previous);
  } catch (error) { fail('STATE_IO_FAILED', `Cannot record child identity at ${file}: ${error.message}`); }
}
export function selectRoute(event) { return classify(event).route; }
function routeOutput(route, hookEventName, prompts) {
  const file = typeof prompts === 'object' ? prompts[route] : path.join(prompts, route === 'main' ? '../recipe/main.md' : `${route}-steer.md`);
  let text;
  try { text = fs.readFileSync(file, 'utf8').trim(); }
  catch (error) { fail('MISSING_SOURCE', `Cannot read the ${route} Steer at ${file}: ${error.message}`); }
  if (!text) fail('MISSING_SOURCE', `The ${route} Steer file is empty: ${file}`);
  return {continue: true, hookSpecificOutput: {
    hookEventName,
    additionalContext: `<gpt-with-taste-${route}-steer>\n${text}\n</gpt-with-taste-${route}-steer>`
  }};
}
export function evaluateHook(raw, prompts = path.join(root, 'prompts'), dataDirectory = null) {
  const event = parseEvent(raw);
  const readsIdentity = event.hook_event_name === 'UserPromptSubmit' ||
    (event.hook_event_name === 'PostToolUse' && normalizeLocalTool(event.tool_name));
  const knownChild = readsIdentity ? childState(event, dataDirectory) : null;
  const result = classify(event, Boolean(knownChild));
  if (!result.route) return {...result, response: {continue: true}};
  if (result.route === 'sub' && dataDirectory) {
    const childId = event.agent_id || (knownChild ? event.session_id : null);
    if (['session_id', 'turn_id'].some(key => typeof event[key] !== 'string' || !event[key]) || typeof childId !== 'string' || !childId) {
      fail('MISSING_METADATA', `${event.hook_event_name} requires string session_id, turn_id and a known child identity`);
    }
    const file = path.join(dataDirectory, 'steer-start', `${encodeURIComponent(childId)}.json`);
    if (event.hook_event_name === 'SubagentStart') {
      const response = routeOutput(result.route, event.hook_event_name, prompts);
      recordChild(file, {turnId: event.turn_id, initialPending: true});
      return {...result, response};
    }
    // Suppress only an observed paired turn. A missing initial input must never
    // suppress a later turn, and consuming the pair must not erase child identity.
    const state = knownChild?.state;
    const duplicate = state && state.initialPending !== false && state.turnId === event.turn_id;
    const response = duplicate ? {continue: true} : routeOutput(result.route, event.hook_event_name, prompts);
    recordChild(file, {turnId: state?.turnId ?? event.turn_id, initialPending: false}, knownChild?.previous ?? file);
    return {...result, reason: duplicate ? 'DEDUPLICATED' : result.reason, response};
  }
  return {...result, response: routeOutput(result.route, event.hook_event_name, prompts)};
}
export function handleHook(raw, prompts = path.join(root, 'prompts'), dataDirectory = null) {
  return evaluateHook(raw, prompts, dataDirectory).response;
}
export function fallbackHook(route) {
  if (!FALLBACK_ROUTES.has(route)) fail('MISSING_METADATA', `Invalid --route fallback: ${route || '(missing)'}`);
  fail('MISSING_METADATA', `The ${route} route requires event JSON to identify its consumer, turn and completed result`);
}
function cliRoute(argv) {
  const index = argv.indexOf('--route');
  if (index < 0 || index + 1 >= argv.length || argv.length !== index + 2) return null;
  return FALLBACK_ROUTES.has(argv[index + 1]) ? argv[index + 1] : null;
}
function audit(event, route, fallback, reason, emitted) {
  if (!process.env.GPT_WITH_TASTE_HOOK_AUDIT) return;
  const record = {event: event?.hook_event_name ?? null, sessionId: event?.session_id ?? null,
    turnId: event?.turn_id ?? null, agentId: event?.agent_id ?? null, agentType: event?.agent_type ?? null,
    tool: event?.tool_name ?? null, normalizedTool: normalizeLocalTool(event?.tool_name), toolUseId: event?.tool_use_id ?? null,
    route, fallback, reason, emitted, injected: emitted};
  try { fs.appendFileSync(process.env.GPT_WITH_TASTE_HOOK_AUDIT, JSON.stringify(record) + '\n'); }
  catch (error) { process.stderr.write(`GPT with Taste Hook [AUDIT_WRITE_FAILED]: ${error.message}\n`); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let event, fallback = false, route = null;
  try {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const fallbackRoute = cliRoute(process.argv.slice(2));
    fallback = input.trim() === '';
    if (fallback && !fallbackRoute) fail('MISSING_METADATA', 'Expected a Codex hook event JSON object on stdin');
    event = fallback ? {hook_event_name: FALLBACK_ROUTES.get(fallbackRoute)} : parseEvent(input);
    const needsState = event.hook_event_name === 'SubagentStart' || (event.hook_event_name === 'UserPromptSubmit' && event.agent_id);
    if (!fallback && needsState && !process.env.PLUGIN_DATA?.trim()) fail('MISSING_METADATA', `${event.hook_event_name} requires nonempty PLUGIN_DATA for initial child-turn dedup`);
    const result = fallback ? {route: fallbackRoute, reason: 'INJECTED', response: fallbackHook(fallbackRoute)} : evaluateHook(event, path.join(root, 'prompts'), process.env.PLUGIN_DATA);
    route = result.route;
    audit(event, route, fallback, result.reason, Boolean(result.response.hookSpecificOutput));
    process.stdout.write(JSON.stringify(result.response) + '\n');
  } catch (error) {
    const code = error.code ?? 'HOOK_FAILED';
    audit(event, route, fallback, code, false);
    process.stderr.write(`GPT with Taste Hook [${code}]: ${error.message}\n`);
    process.exitCode = 1;
  }
}
