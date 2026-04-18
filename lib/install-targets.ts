import type { Plugin } from "./types";

/**
 * Install-command templates for the major agentic clients.
 *
 * Each target knows how to produce:
 *   - a one-shot setup command (first-time: register this registry), and
 *   - a per-plugin install command or config snippet
 *
 * Some clients (Cursor, Continue, Aider) don't have a first-class
 * "marketplace" concept — for those we generate the raw MCP/config JSON
 * the user would paste into their settings.
 *
 * The shape is intentionally declarative so adding a new target is one
 * entry here + an option in the InstallPanel dropdown.
 */

export interface InstallTarget {
  key: string;
  label: string;
  /** Short copy rendered above the commands. */
  tagline: string;
  /** Which plugin providers this target can install. */
  supports: Plugin["provider"][];
  /** First-time "add this registry" setup commands. Empty if N/A. */
  setup: (ctx: InstallContext) => CommandBlock[];
  /** Commands to install a specific plugin. */
  install: (ctx: InstallContext, plugin: Plugin) => CommandBlock[];
  /** Optional note rendered below the commands. */
  note?: (ctx: InstallContext, plugin: Plugin) => string | null;
}

export interface InstallContext {
  /** Hostname of this atrium deployment, e.g. "atrium.acme.corp". */
  hostname: string;
  /** Friendly org name used as the marketplace display name. */
  orgName: string;
}

export interface CommandBlock {
  /** "shell" for a terminal command, "slash" for an in-app slash command, "json" for config paste. */
  kind: "shell" | "slash" | "json";
  /** Short label above the block. */
  label: string;
  /** The literal command or JSON body. */
  body: string;
  /** Filename hint for json blocks (`~/.cursor/mcp.json`, etc.). */
  file?: string;
}

export const INSTALL_TARGETS: InstallTarget[] = [
  {
    key: "claude-code-session",
    label: "Claude Code — in session",
    tagline: "Run these inside a running Claude Code session.",
    supports: ["claude-code", "mcp"],
    setup: ({ hostname }) => [
      {
        kind: "slash",
        label: "One-time: add the registry",
        body: `/plugin marketplace add https://${hostname}`,
      },
    ],
    install: (_, plugin) => [
      {
        kind: "slash",
        label: "Install",
        body: `/plugin install ${plugin.slug}@${plugin.pinnedVersion ?? plugin.version}`,
      },
    ],
  },
  {
    key: "claude-code-cli",
    label: "Claude Code — CLI (one-shot)",
    tagline: "Shell commands. No session required.",
    supports: ["claude-code", "mcp"],
    setup: ({ hostname }) => [
      {
        kind: "shell",
        label: "One-time: add the registry",
        body: `claude plugin marketplace add https://${hostname}`,
      },
    ],
    install: (_, plugin) => [
      {
        kind: "shell",
        label: "Install",
        body: `claude plugin install ${plugin.slug}@${plugin.pinnedVersion ?? plugin.version}`,
      },
    ],
    note: () => "Requires Claude Code CLI v1.3+.",
  },
  {
    key: "openai-codex",
    label: "OpenAI Codex CLI",
    tagline: "MCP servers drop into your Codex config.",
    supports: ["openai", "mcp"],
    setup: () => [],
    install: ({ hostname }, plugin) => {
      const mcpServers = plugin.mcpServers.length > 0 ? plugin.mcpServers : null;
      if (plugin.provider === "openai") {
        return [
          {
            kind: "shell",
            label: "Register the GPT as a Codex action",
            body: `codex gpt import --from https://${hostname}/api/v1/plugins/${plugin.slug}`,
          },
        ];
      }
      if (!mcpServers) {
        return [
          {
            kind: "shell",
            label: "Not installable",
            body: `# ${plugin.name} has no MCP or OpenAI action to register.`,
          },
        ];
      }
      const mcp = mcpServers[0]!;
      return [
        {
          kind: "json",
          label: "Paste into ~/.codex/config.toml (mcpServers section)",
          file: "~/.codex/config.toml",
          body: `[mcpServers.${mcp.name}]\ncommand = "${mcp.command}"\nargs = [${(mcp.args ?? []).map((a) => `"${a}"`).join(", ")}]`,
        },
      ];
    },
  },
  {
    key: "cursor",
    label: "Cursor",
    tagline: "Paste into Settings → MCP servers.",
    supports: ["mcp", "claude-code"],
    setup: () => [],
    install: (_, plugin) => {
      const mcp = plugin.mcpServers[0];
      if (!mcp) {
        return [
          {
            kind: "shell",
            label: "Not installable",
            body: `# ${plugin.name} has no MCP server — Cursor only consumes MCP.`,
          },
        ];
      }
      const json = JSON.stringify(
        {
          mcpServers: {
            [mcp.name]: {
              command: mcp.command,
              args: mcp.args ?? [],
              env: mcp.env,
            },
          },
        },
        null,
        2,
      );
      return [
        {
          kind: "json",
          label: "Paste into ~/.cursor/mcp.json",
          file: "~/.cursor/mcp.json",
          body: json,
        },
      ];
    },
  },
  {
    key: "gemini-cli",
    label: "Gemini CLI",
    tagline: "Register a Gemini extension by URL.",
    supports: ["gemini"],
    setup: ({ hostname }) => [
      {
        kind: "shell",
        label: "One-time: point gemini at this registry",
        body: `gemini extensions marketplace add https://${hostname}`,
      },
    ],
    install: (_, plugin) => [
      {
        kind: "shell",
        label: "Install",
        body: `gemini extensions install ${plugin.slug}@${plugin.pinnedVersion ?? plugin.version}`,
      },
    ],
  },
  {
    key: "aider",
    label: "Aider",
    tagline: "Aider supports MCP as of 0.78+.",
    supports: ["mcp"],
    setup: () => [],
    install: (_, plugin) => {
      const mcp = plugin.mcpServers[0];
      if (!mcp) {
        return [
          {
            kind: "shell",
            label: "Not applicable",
            body: `# ${plugin.name} has no MCP server — aider only consumes MCP.`,
          },
        ];
      }
      const cmd = [mcp.command, ...(mcp.args ?? [])].join(" ");
      return [
        {
          kind: "shell",
          label: "Run aider with this MCP server",
          body: `aider --mcp "${cmd}"`,
        },
      ];
    },
  },
  {
    key: "raw-mcp",
    label: "Raw MCP config",
    tagline: "Copy this into any MCP-aware client.",
    supports: ["mcp", "claude-code"],
    setup: () => [],
    install: (_, plugin) => {
      if (plugin.mcpServers.length === 0) {
        return [
          {
            kind: "shell",
            label: "Not applicable",
            body: `# ${plugin.name} doesn't expose an MCP server.`,
          },
        ];
      }
      const servers: Record<string, unknown> = {};
      for (const m of plugin.mcpServers) {
        servers[m.name] = {
          command: m.command,
          args: m.args ?? [],
          env: m.env,
        };
      }
      return [
        {
          kind: "json",
          label: "MCP servers JSON",
          body: JSON.stringify({ mcpServers: servers }, null, 2),
        },
      ];
    },
  },
];

export function targetsForProvider(provider: Plugin["provider"]): InstallTarget[] {
  return INSTALL_TARGETS.filter((t) => t.supports.includes(provider));
}
