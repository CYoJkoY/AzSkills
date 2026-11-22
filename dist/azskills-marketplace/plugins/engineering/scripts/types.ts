export interface SkillModule {
  id: string;
  path: string;
  status: string;
  family: string;
  modes: string[];
  role: string;
  composes: string[];
}

export interface SkillAlias {
  id: string;
  status: string;
  canonical: string;
  mode: string;
  legacyModes?: Record<string, string>;
}

export interface SkillCatalog {
  schemaVersion: number;
  system: string;
  families: Record<string, { label: string; purpose: string }>;
  aliases: SkillAlias[];
  version: string;
  entry: { id: string; path: string; version: string };
  modules: SkillModule[];
}

export type PluginKind = "module" | "standalone";

export interface PluginCatalogEntry {
  id: string;
  kind: PluginKind;
  modules?: string[];
  description?: string;
  icon?: string;
  brandColor?: string;
  source?: string;
  category: string;
  capabilities: string[];
  extra: string[];
  hooks: string | null;
}

export interface PluginCatalog {
  schemaVersion: number;
  marketplace: { name: string; displayName: string; description: string };
  plugins: PluginCatalogEntry[];
}

export type IntegrationMechanism =
  | "native-skills"
  | "shared-skills"
  | "codex-plugin"
  | "manual"
  | "mcp";

export type IntegrationAutomation = "managed-copy" | "guided-mcp" | "manual-import";
export type IntegrationDetection = "target-directory" | "manual";

export interface IntegrationTool {
  id: string;
  name: string;
  mechanism: IntegrationMechanism;
  target: string;
  userTarget: string;
  source: string;
  verify: string;
  automation: IntegrationAutomation;
  detection: IntegrationDetection;
  configTarget: null;
  verification: [string, string, string];
}

export interface IntegrationRegistry {
  schemaVersion: number;
  tools: IntegrationTool[];
}

export interface SkillManifest {
  schemaVersion: 1 | 2 | 3 | 4;
  version?: string;
  /** schemaVersion 1: legacy owned directory names. */
  paths?: string[];
  /** schemaVersion 2 and 3: legacy owned directory names. */
  skills?: string[];
  /** schemaVersion 4: installed plugin ids. */
  plugins?: string[];
  lastRun?: RollbackState | null;
}

export interface RollbackItem {
  id: string;
  existed: boolean;
  hash: string | null;
}

export interface RollbackState {
  directory: string;
  items: RollbackItem[];
  hadManifest: boolean;
  manifestHash: string | null;
}

export interface HookEvent {
  hook_event_name: string;
  session_id?: string;
  turn_id?: string;
  agent_id?: string;
  agent_type?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  tool_use_id?: string;
  prompt?: string;
  [key: string]: unknown;
}
