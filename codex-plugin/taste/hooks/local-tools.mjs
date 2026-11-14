// The local function contract carries a namespace and a function name.
// App hooks flatten that pair; retain the bare name for the original entry.
const wait = 'wait_agent';
const namespaces = ['multi_agent_v1', 'collaboration'];
const forms = [wait, ...namespaces.flatMap(namespace => [`${namespace}.${wait}`, `${namespace}${wait}`])];
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const WAIT_TOOL_MATCHER = `^(?:${forms.map(escapeRegex).join('|')})$`;
export function normalizeLocalTool(name) {
  return forms.includes(name) ? wait : null;
}
