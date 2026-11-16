// The local function contract carries a namespace and a function name.
// App hooks flatten that pair; retain the bare name for the original entry.
const wait = 'wait_agent' as const;
const namespaces = ['multi_agent_v1', 'collaboration'] as const;
const forms = [wait, ...namespaces.flatMap(namespace => [`${namespace}.${wait}`, `${namespace}${wait}`])];
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const WAIT_TOOL_MATCHER = `^(?:${forms.map(escapeRegex).join('|')})$`;
export function normalizeLocalTool(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  return forms.includes(name) ? wait : null;
}
