/**
 * Plugin types — deliberately provider-agnostic.
 *
 * Atrium consumes plugins from multiple agent frameworks. Each has its own
 * manifest shape; we keep a common core (name, version, description, author,
 * category, tags) and let provider-specific extensions live under `providerManifest`.
 *
 * Current providers:
 *   - "claude-code"  — Anthropic's .claude-plugin/marketplace.json format
 *   - "openai"       — OpenAI GPT / Custom GPT / Assistants actions
 *   - "gemini"       — Google Gemini extensions
 *   - "mcp"          — pure MCP server registrations (provider-neutral)
 *   - "generic"      — everything else (custom agent frameworks)
 */

export type PluginProvider =
  | "claude-code"
  | "openai"
  | "gemini"
  | "mcp"
  | "generic";

export type PluginCategory =
  | "productivity"
  | "data"
  | "devops"
  | "security"
  | "design"
  | "writing"
  | "research"
  | "ops"
  | "finance"
  | "sales"
  | "other";

export interface Author {
  name: string;
  email?: string;
  url?: string;
}

export interface SlashCommand {
  name: string;
  description: string;
  argumentHint?: string;
}

export interface Subagent {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
}

export interface Skill {
  name: string;
  description: string;
  trigger?: string;
}

export interface Hook {
  event:
    | "PreToolUse"
    | "PostToolUse"
    | "UserPromptSubmit"
    | "SessionStart"
    | "SessionEnd"
    | "Stop"
    | "SubagentStop"
    | "Notification";
  command: string;
  timeoutMs?: number;
  description?: string;
}

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
}

/**
 * OpenAI-flavored "action" — a named tool callable by a GPT or Assistant.
 */
export interface OpenAiAction {
  name: string;
  description: string;
  /** Schema URL, usually an OpenAPI spec. */
  schemaUrl?: string;
  scope?: "read" | "write";
}

/**
 * Gemini-flavored "extension" entry.
 */
export interface GeminiExtension {
  name: string;
  description: string;
  trigger?: string;
}

export interface Plugin {
  slug: string;
  name: string;
  description: string;
  version: string;
  /** Which agent framework this plugin targets. */
  provider: PluginProvider;
  category: PluginCategory;
  author: Author;
  keywords: string[];
  homepage?: string;
  license?: string;
  sourceId: string;

  /** Claude Code manifest fragments (only populated for provider === "claude-code"). */
  commands: SlashCommand[];
  agents: Subagent[];
  skills: Skill[];
  hooks: Hook[];
  mcpServers: McpServer[];

  /** OpenAI-flavored fragments. */
  actions?: OpenAiAction[];
  /** Gemini-flavored fragments. */
  extensions?: GeminiExtension[];

  versions: PluginVersionSummary[];
  signals: SecuritySignal[];
  usage?: UsageSnapshot;
  policyState: "approved" | "quarantined" | "blocked";
  updatedAt: string;

  /** Override that pins this plugin to a specific version. If set, atrium serves only this version to clients. */
  pinnedVersion?: string;
  /** If this plugin was forked from an external source, provenance info. */
  forkedFrom?: { sourceId: string; slug: string; atVersion: string };
}

export interface PluginVersionSummary {
  version: string;
  releasedAt: string;
  changelog?: string;
}

export interface SecuritySignal {
  id: string;
  severity: "info" | "low" | "medium" | "high";
  title: string;
  detail: string;
  scanner: string;
}

export interface UsageSnapshot {
  installs30d: number;
  installsAllTime: number;
  activeUsers7d: number;
  topCommands: { name: string; count: number }[];
}

export interface Source {
  id: string;
  kind: "git" | "http" | "local";
  name: string;
  url?: string;
  lastSyncedAt?: string;
  trust: "official" | "verified" | "community" | "internal";
  pluginCount: number;
}

export const PROVIDER_LABELS: Record<PluginProvider, string> = {
  "claude-code": "Claude Code",
  openai: "OpenAI",
  gemini: "Gemini",
  mcp: "MCP",
  generic: "Generic",
};
