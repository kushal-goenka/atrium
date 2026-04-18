/**
 * Plugin manifest types. Strict superset of Anthropic's Claude Code plugin format:
 * https://docs.anthropic.com/claude-code/plugins
 *
 * Anything atrium adds on top is optional and lives under `atrium:*` namespaces.
 */

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
  model?: "opus" | "sonnet" | "haiku" | "inherit";
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
 * Parsed plugin, fully hydrated with manifest contents. This is what the UI renders from.
 */
export interface Plugin {
  /** URL-safe slug, unique within a source. */
  slug: string;
  name: string;
  description: string;
  version: string;
  category: PluginCategory;
  author: Author;
  keywords: string[];
  homepage?: string;
  license?: string;
  /** The source this plugin was ingested from. */
  sourceId: string;
  /** The full manifest contents. */
  commands: SlashCommand[];
  agents: Subagent[];
  skills: Skill[];
  hooks: Hook[];
  mcpServers: McpServer[];
  /** All versions we've observed for this plugin, newest first. */
  versions: PluginVersionSummary[];
  /** Signals produced by our scanners. */
  signals: SecuritySignal[];
  /** Aggregated install / usage metrics (nullable if telemetry disabled). */
  usage?: UsageSnapshot;
  /** Policy state in the current viewer's context. */
  policyState: "approved" | "quarantined" | "blocked";
  updatedAt: string;
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
  /** Scanner that produced this signal. */
  scanner: string;
}

export interface UsageSnapshot {
  installs30d: number;
  installsAllTime: number;
  activeUsers7d: number;
  /** Top commands by invocation count over last 30d. */
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
