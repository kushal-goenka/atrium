import type { Plugin, Source } from "@/lib/types";

/**
 * Seed catalog for development.
 * Fictional plugins spanning Claude Code, OpenAI, Gemini, MCP, and generic
 * providers — sized to look like a realistic enterprise atrium deployment.
 */

export const sources: Source[] = [
  {
    id: "official-reference",
    kind: "git",
    name: "Anthropic reference marketplace",
    url: "https://github.com/anthropics/claude-code/examples/marketplace",
    lastSyncedAt: "2026-04-17T06:00:00Z",
    trust: "official",
    pluginCount: 2,
  },
  {
    id: "openai-store",
    kind: "http",
    name: "OpenAI GPT directory",
    url: "https://chat.openai.com/g/catalog.json",
    lastSyncedAt: "2026-04-17T04:30:00Z",
    trust: "official",
    pluginCount: 2,
  },
  {
    id: "community-curated",
    kind: "git",
    name: "Community (curated)",
    url: "https://github.com/agentops-community/curated",
    lastSyncedAt: "2026-04-17T05:30:00Z",
    trust: "verified",
    pluginCount: 4,
  },
  {
    id: "acme-internal",
    kind: "local",
    name: "Acme Corp internal",
    lastSyncedAt: "2026-04-17T08:12:00Z",
    trust: "internal",
    pluginCount: 4,
  },
];

export const plugins: Plugin[] = [
  {
    slug: "incident-commander",
    name: "Incident Commander",
    description:
      "On-call copilot. Triages alerts, drafts status page updates, assembles a timeline, and runs a postmortem skeleton.",
    version: "2.3.1",
    provider: "claude-code",
    category: "ops",
    author: { name: "Anthropic", url: "https://anthropic.com" },
    keywords: ["oncall", "sre", "incident", "postmortem"],
    homepage: "https://github.com/anthropics/incident-commander",
    license: "Apache-2.0",
    sourceId: "official-reference",
    commands: [
      { name: "/ic start", description: "Open a new incident with a short title", argumentHint: "<title>" },
      { name: "/ic status", description: "Draft a status page update based on the current context" },
      { name: "/ic timeline", description: "Render the incident timeline from chat + PR + deploy events" },
      { name: "/ic postmortem", description: "Scaffold a blameless postmortem doc" },
    ],
    agents: [
      {
        name: "triage-agent",
        description: "Correlates alerts with recent deploys and surfaces the likely culprit commits.",
        model: "sonnet",
        tools: ["Grep", "Read", "Bash"],
      },
    ],
    skills: [
      {
        name: "postmortem-template",
        description: "A blameless postmortem template with prompts for contributing factors and action items.",
      },
    ],
    hooks: [],
    mcpServers: [
      {
        name: "pagerduty",
        command: "npx",
        args: ["-y", "@pagerduty/mcp-server"],
        description: "Read-only access to PagerDuty incidents and schedules.",
      },
    ],
    versions: [
      { version: "2.3.1", releasedAt: "2026-04-11T14:02:00Z", changelog: "Fix timeline rendering when deploys lack git SHAs." },
      { version: "2.3.0", releasedAt: "2026-03-28T09:14:00Z", changelog: "Add /ic postmortem. Extract status updates to a skill." },
      { version: "2.2.0", releasedAt: "2026-02-14T11:50:00Z", changelog: "First release with subagent support." },
    ],
    signals: [
      { id: "s1", severity: "info", title: "Read-only MCP", detail: "Declared pagerduty MCP uses read-only scopes.", scanner: "mcp-scope" },
    ],
    usage: { installs30d: 284, installsAllTime: 1842, activeUsers7d: 196, topCommands: [
      { name: "/ic status", count: 913 },
      { name: "/ic start", count: 611 },
      { name: "/ic timeline", count: 284 },
    ] },
    policyState: "approved",
    updatedAt: "2026-04-11T14:02:00Z",
  },
  {
    slug: "deploy-guard",
    name: "Deploy Guard",
    description:
      "Pre-deploy safety net. Runs a checklist of production readiness checks before you ship and refuses to continue if any fail.",
    version: "1.8.0",
    provider: "claude-code",
    category: "devops",
    author: { name: "Anthropic" },
    keywords: ["deploy", "ci", "safety", "release"],
    license: "Apache-2.0",
    sourceId: "official-reference",
    commands: [
      { name: "/deploy check", description: "Run the full preflight checklist" },
      { name: "/deploy rollback", description: "Generate rollback plan for the last deploy" },
    ],
    agents: [],
    skills: [
      { name: "release-notes-writer", description: "Drafts release notes from merged PRs since last tag." },
    ],
    hooks: [
      {
        event: "PreToolUse",
        command: "/usr/local/bin/deploy-guard check --silent",
        timeoutMs: 8000,
        description: "Blocks deploys when checklist fails.",
      },
    ],
    mcpServers: [],
    versions: [
      { version: "1.8.0", releasedAt: "2026-04-02T10:00:00Z", changelog: "Checklist: migration drift against prod schema." },
      { version: "1.7.2", releasedAt: "2026-03-11T18:22:00Z" },
    ],
    signals: [
      { id: "s2", severity: "medium", title: "PreToolUse hook runs shell", detail: "Installs a hook that executes a local binary before every tool call. Review the binary source before approving for general use.", scanner: "hook-shell" },
    ],
    usage: { installs30d: 156, installsAllTime: 874, activeUsers7d: 89, topCommands: [
      { name: "/deploy check", count: 621 },
    ] },
    policyState: "approved",
    updatedAt: "2026-04-02T10:00:00Z",
  },
  {
    slug: "pr-reviewer-gpt",
    name: "PR Reviewer GPT",
    description:
      "OpenAI-backed code review GPT. Reads diffs via GitHub action, posts a structured review comment.",
    version: "3.1.0",
    provider: "openai",
    category: "productivity",
    author: { name: "Sam Crichton", url: "https://github.com/scrichton" },
    keywords: ["review", "github", "diff", "lint"],
    license: "MIT",
    sourceId: "openai-store",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [],
    actions: [
      {
        name: "review_pr",
        description: "Fetches the PR diff and returns a structured review.",
        schemaUrl: "https://raw.githubusercontent.com/scrichton/pr-reviewer-gpt/main/openapi.yaml",
        scope: "read",
      },
      {
        name: "comment_on_pr",
        description: "Posts a review comment on the PR.",
        scope: "write",
      },
    ],
    versions: [
      { version: "3.1.0", releasedAt: "2026-04-09T13:00:00Z", changelog: "Add structured scope field to comment action." },
      { version: "3.0.0", releasedAt: "2026-03-20T08:30:00Z", changelog: "Rewrite using the Assistants API." },
    ],
    signals: [
      { id: "s2a", severity: "low", title: "Write-scope action", detail: "The comment_on_pr action has write scope. Scope it to specific repos via OpenAI plugin settings.", scanner: "openai-scope" },
    ],
    usage: { installs30d: 412, installsAllTime: 3201, activeUsers7d: 288, topCommands: [] },
    policyState: "approved",
    updatedAt: "2026-04-09T13:00:00Z",
  },
  {
    slug: "snowflake-analyst",
    name: "Snowflake Analyst",
    description:
      "Internal data-team plugin. Query Acme's Snowflake warehouse through a natural-language interface with guardrails on PII tables.",
    version: "0.7.2",
    provider: "claude-code",
    category: "data",
    author: { name: "Acme Data Platform", email: "data-platform@acme.corp" },
    keywords: ["snowflake", "sql", "analytics", "internal"],
    license: "Proprietary",
    sourceId: "acme-internal",
    commands: [
      { name: "/sql", description: "Translate natural language to SQL and run it", argumentHint: "<question>" },
      { name: "/sql schema", description: "Describe a table" },
    ],
    agents: [
      { name: "sql-author", description: "Writes and iterates on SQL against our warehouse schema.", model: "sonnet" },
    ],
    skills: [
      { name: "pii-guardrail", description: "Rewrites queries that would touch PII tables into aggregated-only variants." },
    ],
    hooks: [
      { event: "PreToolUse", command: "sf-guard audit", timeoutMs: 3000, description: "Blocks queries that violate data access policy." },
    ],
    mcpServers: [
      { name: "snowflake-readonly", command: "/opt/acme/bin/sf-mcp", description: "Read-only warehouse access, scoped by role." },
    ],
    versions: [
      { version: "0.7.2", releasedAt: "2026-04-16T17:04:00Z", changelog: "PII guardrail: catch lateral joins." },
      { version: "0.7.1", releasedAt: "2026-04-02T11:21:00Z" },
      { version: "0.7.0", releasedAt: "2026-03-14T09:00:00Z", changelog: "First widely-released version." },
    ],
    signals: [
      { id: "s3", severity: "info", title: "Internal MCP server", detail: "Uses an internal MCP binary (/opt/acme/bin/sf-mcp). Ensure hosts have it installed via endpoint management.", scanner: "mcp-scope" },
    ],
    usage: { installs30d: 74, installsAllTime: 211, activeUsers7d: 68, topCommands: [
      { name: "/sql", count: 1211 },
      { name: "/sql schema", count: 98 },
    ] },
    policyState: "approved",
    updatedAt: "2026-04-16T17:04:00Z",
  },
  {
    slug: "figma-bridge",
    name: "Figma Bridge",
    description:
      "Pure MCP server. Read Figma files, extract components, walk design tokens. Works with any MCP-aware agent.",
    version: "1.2.4",
    provider: "mcp",
    category: "design",
    author: { name: "Priya Chen", url: "https://github.com/priyachen" },
    keywords: ["figma", "design", "tokens", "frontend"],
    license: "MIT",
    sourceId: "community-curated",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [
      { name: "figma", command: "npx", args: ["-y", "@figma/mcp-server"], description: "Figma API." },
    ],
    versions: [
      { version: "1.2.4", releasedAt: "2026-04-01T12:00:00Z" },
      { version: "1.2.0", releasedAt: "2026-02-22T14:30:00Z", changelog: "Add Tailwind token mapping." },
    ],
    signals: [],
    usage: { installs30d: 198, installsAllTime: 1423, activeUsers7d: 144, topCommands: [] },
    policyState: "approved",
    updatedAt: "2026-04-01T12:00:00Z",
  },
  {
    slug: "security-audit",
    name: "Security Audit",
    description:
      "Acme security team's assistant. Runs threat modeling prompts, dependency CVE checks, and secret scanning across the open repo.",
    version: "0.4.0",
    provider: "claude-code",
    category: "security",
    author: { name: "Acme Security", email: "security@acme.corp" },
    keywords: ["security", "threat-model", "cve", "secrets"],
    license: "Proprietary",
    sourceId: "acme-internal",
    commands: [
      { name: "/sec threat-model", description: "Walk the STRIDE threat model for the current feature" },
      { name: "/sec scan", description: "Run secret scanner + dependency audit" },
    ],
    agents: [
      { name: "threat-modeler", description: "Senior AppSec engineer persona.", model: "opus" },
    ],
    skills: [],
    hooks: [
      { event: "UserPromptSubmit", command: "secscan --chat-context", timeoutMs: 1500, description: "Redacts credentials before submission." },
    ],
    mcpServers: [
      { name: "cve-feed", command: "/opt/acme/sec/cve-mcp", description: "Internal CVE feed mirror." },
    ],
    versions: [
      { version: "0.4.0", releasedAt: "2026-04-08T10:10:00Z", changelog: "Add PreSubmit credential redaction." },
      { version: "0.3.2", releasedAt: "2026-03-15T16:22:00Z" },
    ],
    signals: [
      { id: "s4", severity: "low", title: "UserPromptSubmit hook", detail: "Intercepts every user message. Reviewed by platform security on 2026-04-08; purpose is credential redaction.", scanner: "hook-shell" },
    ],
    usage: { installs30d: 52, installsAllTime: 181, activeUsers7d: 41, topCommands: [
      { name: "/sec scan", count: 298 },
    ] },
    policyState: "approved",
    updatedAt: "2026-04-08T10:10:00Z",
  },
  {
    slug: "docs-writer-gemini",
    name: "Docs Writer",
    description:
      "Gemini extension that ships technical documentation in your existing voice. Walks your docs repo and writes the next page.",
    version: "2.0.1",
    provider: "gemini",
    category: "writing",
    author: { name: "Lina Park", url: "https://github.com/linapark" },
    keywords: ["docs", "writing", "technical", "markdown"],
    license: "MIT",
    sourceId: "community-curated",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [],
    extensions: [
      { name: "docs.new", description: "Scaffold a new docs page from a title.", trigger: "when user asks to create docs" },
      { name: "docs.polish", description: "Rewrite a file in the project's voice.", trigger: "when user asks to polish prose" },
    ],
    versions: [
      { version: "2.0.1", releasedAt: "2026-03-30T09:00:00Z", changelog: "MDX formatter respects remark plugins." },
      { version: "2.0.0", releasedAt: "2026-03-12T13:04:00Z", changelog: "Rewrite as a Gemini extension; v1 config not compatible." },
    ],
    signals: [],
    usage: { installs30d: 342, installsAllTime: 2104, activeUsers7d: 231, topCommands: [] },
    policyState: "approved",
    updatedAt: "2026-03-30T09:00:00Z",
  },
  {
    slug: "k8s-operator",
    name: "k8s Operator",
    description:
      "Kubernetes day-two operations. Explain what changed, draft kubectl commands for common fixes, and produce cluster health reports.",
    version: "1.5.2",
    provider: "mcp",
    category: "devops",
    author: { name: "Dmitri Vasquez" },
    keywords: ["kubernetes", "k8s", "ops", "infra"],
    license: "MIT",
    sourceId: "community-curated",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [
      { name: "kubernetes", command: "npx", args: ["-y", "@k8s/mcp-server"], description: "kubectl operations scoped to the active context." },
    ],
    versions: [
      { version: "1.5.2", releasedAt: "2026-03-25T18:14:00Z" },
    ],
    signals: [
      { id: "s5", severity: "high", title: "kubectl shell access", detail: "The Kubernetes MCP can execute arbitrary kubectl commands in the caller's active context. Pair with RBAC on the cluster side — do not install broadly without review.", scanner: "mcp-scope" },
    ],
    usage: { installs30d: 91, installsAllTime: 702, activeUsers7d: 58, topCommands: [] },
    policyState: "quarantined",
    updatedAt: "2026-03-25T18:14:00Z",
  },
  {
    slug: "linear-gpt",
    name: "Linear GPT",
    description:
      "OpenAI GPT with Linear Actions. Pull issue context into the prompt, draft updates, close issues from commit messages.",
    version: "1.0.0",
    provider: "openai",
    category: "productivity",
    author: { name: "Marco Silva" },
    keywords: ["linear", "issues", "project-management"],
    license: "MIT",
    sourceId: "openai-store",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [],
    actions: [
      { name: "get_issue", description: "Returns issue details by identifier.", scope: "read" },
      { name: "update_issue", description: "Updates issue state, assignee, or priority.", scope: "write" },
      { name: "close_issue", description: "Closes an issue with a completion summary.", scope: "write" },
    ],
    versions: [
      { version: "1.0.0", releasedAt: "2026-04-05T15:30:00Z", changelog: "1.0. Stable Actions surface." },
    ],
    signals: [],
    usage: { installs30d: 267, installsAllTime: 987, activeUsers7d: 201, topCommands: [] },
    policyState: "approved",
    updatedAt: "2026-04-05T15:30:00Z",
  },
  {
    slug: "spark-etl",
    name: "Spark ETL",
    description:
      "Acme Data Engineering's plugin. Author, test, and deploy PySpark ETL jobs against our staging and prod clusters.",
    version: "0.2.0",
    provider: "claude-code",
    category: "data",
    author: { name: "Acme Data Engineering" },
    keywords: ["spark", "etl", "pipelines", "internal"],
    license: "Proprietary",
    sourceId: "acme-internal",
    commands: [
      { name: "/spark new", description: "Scaffold a new ETL job from a template" },
      { name: "/spark test", description: "Run the job against staging data" },
      { name: "/spark deploy", description: "Submit to the shared cluster via Airflow" },
    ],
    agents: [
      { name: "pipeline-author", description: "Opinionated PySpark author. Favors idempotency and clear partitioning.", model: "opus" },
    ],
    skills: [
      { name: "schema-evolver", description: "Plans safe schema migrations for Iceberg tables." },
    ],
    hooks: [],
    mcpServers: [
      { name: "airflow", command: "/opt/acme/bin/airflow-mcp", description: "Submit and monitor Airflow DAGs." },
    ],
    versions: [
      { version: "0.2.0", releasedAt: "2026-04-14T09:21:00Z", changelog: "Schema evolver skill." },
      { version: "0.1.0", releasedAt: "2026-03-01T10:00:00Z" },
    ],
    signals: [
      { id: "s6", severity: "medium", title: "Production cluster access", detail: "The airflow MCP can submit jobs to shared Spark clusters. Policy currently restricts /spark deploy to data engineering role.", scanner: "mcp-scope" },
    ],
    usage: { installs30d: 39, installsAllTime: 112, activeUsers7d: 31, topCommands: [
      { name: "/spark test", count: 203 },
      { name: "/spark new", count: 44 },
    ] },
    policyState: "approved",
    updatedAt: "2026-04-14T09:21:00Z",
  },
  // Un-curated plugins — no category, empty keywords. Demo targets for the
  // AI curation engine (see /admin/curation).
  {
    slug: "finance-forecaster",
    name: "Finance Forecaster",
    description:
      "Runs monthly revenue and expense forecasts against historical data pulled from NetSuite. Produces a slide-deck-ready summary and flags variances.",
    version: "0.1.3",
    provider: "generic",
    category: "other",
    author: { name: "Acme FP&A" },
    keywords: [],
    license: "Proprietary",
    sourceId: "acme-internal",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [
      { name: "netsuite", command: "/opt/acme/fin/netsuite-mcp", description: "Read-only NetSuite access." },
    ],
    versions: [{ version: "0.1.3", releasedAt: "2026-04-15T11:00:00Z" }],
    signals: [],
    usage: { installs30d: 8, installsAllTime: 8, activeUsers7d: 7, topCommands: [] },
    policyState: "quarantined",
    updatedAt: "2026-04-15T11:00:00Z",
  },
  {
    slug: "meeting-notes",
    name: "Meeting Notes",
    description:
      "Summarizes transcripts from meeting recordings. Extracts decisions, action items with owners, and open questions.",
    version: "0.9.0",
    provider: "generic",
    category: "other",
    author: { name: "Jordan Rhee" },
    keywords: [],
    license: "MIT",
    sourceId: "community-curated",
    commands: [],
    agents: [],
    skills: [],
    hooks: [],
    mcpServers: [],
    versions: [{ version: "0.9.0", releasedAt: "2026-04-13T09:00:00Z" }],
    signals: [],
    usage: { installs30d: 42, installsAllTime: 42, activeUsers7d: 31, topCommands: [] },
    policyState: "quarantined",
    updatedAt: "2026-04-13T09:00:00Z",
  },
];

export function findPlugin(slug: string): Plugin | undefined {
  return plugins.find((p) => p.slug === slug);
}

export function findSource(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}
