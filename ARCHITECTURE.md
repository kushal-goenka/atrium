# Architecture

## System at a glance

```
                    ┌─────────────────────────────────────────┐
                    │           Claude Code (user)            │
                    │  /plugin marketplace add atrium.co/mkt  │
                    └───────────────┬─────────────────────────┘
                                    │ GET marketplace.json
                                    │ GET plugin-archive.tar.gz
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │            atrium (Next.js)             │
                    │                                          │
                    │  ┌────────────┐      ┌───────────────┐  │
                    │  │  Browse UI │      │   Admin UI    │  │
                    │  └─────┬──────┘      └───────┬───────┘  │
                    │        │                     │          │
                    │  ┌─────┴─────────────────────┴───────┐  │
                    │  │       API routes (App Router)    │  │
                    │  └─────┬─────────────────────────────┘  │
                    │        │                                 │
                    │  ┌─────┴──────┐  ┌─────────┐  ┌───────┐ │
                    │  │ Prisma ORM │  │ OTEL    │  │ Auth  │ │
                    │  └─────┬──────┘  └────┬────┘  └───────┘ │
                    └────────┼────────────────┼────────────────┘
                             │                │
                     ┌───────┴──────┐  ┌──────┴──────┐
                     │ Postgres /   │  │  OTLP       │
                     │ SQLite       │  │  collector  │
                     └──────────────┘  └─────────────┘

                    ┌─────────────────────────────────────────┐
                    │     Federation sources (pulled)         │
                    │                                          │
                    │  github.com/anthropics/reference-mkt    │
                    │  github.com/your-org/internal-plugins   │
                    │  atrium.partner-company.com             │
                    └─────────────────────────────────────────┘
```

## Layers

### 1. Ingestion

A scheduled job (cron, or on-demand from admin UI) pulls `marketplace.json` from each configured source. Three source types in v1:

- **`git`** — clone a repo, read `.claude-plugin/marketplace.json` at the root or a configured subpath
- **`http`** — fetch a marketplace.json from an arbitrary URL (includes other atrium instances)
- **`upload`** — admin uploads a tarball; parsed locally

Each ingest produces a `MarketplaceSnapshot` row keyed on `(source_id, fetched_at, content_hash)`. Snapshots are immutable and diffed on next fetch. This gives us:
- A full history of what each source claimed at each point in time
- A trivial rollback story (point the active pointer at a prior snapshot)
- Deterministic reproducibility for audits

### 2. Storage (data model)

Simplified schema:

```
Source          one row per federated upstream (git URL, HTTP URL, or "local")
MarketplaceSnapshot  immutable marketplace.json blob + parsed plugins
Plugin          a plugin observed in at least one snapshot (unique by name+source)
PluginVersion   a specific version of a plugin, with full manifest + artifact pointer
Install         audit event: user X installed plugin Y version Z via client C at time T
Usage           OTEL-aggregated metric: count/p50/p95 of command invocations etc.
User            identity (SSO-backed)
Role            RBAC: viewer, installer, curator, admin
Policy          allow/block/pin rules: per-plugin, per-source, per-role
AuditLog        every admin action, every policy decision, immutable
```

Full Prisma schema lives in `prisma/schema.prisma`.

### 3. Serving

The public-facing surface has two shapes:

**a. Anthropic-compatible marketplace endpoints**, consumed by Claude Code:
- `GET /mkt/marketplace.json` — the aggregated, policy-filtered catalog for the caller
- `GET /mkt/plugins/{slug}/{version}.tar.gz` — the plugin archive

These endpoints respect the caller's identity (via signed cookie or API token) so a junior dev and a staff engineer can see different catalogs if policy says so.

**b. Human-facing UI**, rendered by Next.js:
- `/` — browse with search/filter
- `/plugins/[slug]` — detail view (manifest, versions, install snippets, usage stats, security signals)
- `/admin/*` — sources, plugins, users, policies, audit log, metrics

### 4. Plugin format

Unchanged from Anthropic. A `marketplace.json` looks like:

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Your Org" },
  "plugins": [
    {
      "name": "awesome-plugin",
      "source": "./plugins/awesome-plugin",
      "description": "Does awesome things",
      "version": "1.2.0",
      "category": "productivity",
      "author": { "name": "Jane Dev" }
    }
  ]
}
```

Each plugin resolves to a directory containing:
- `.claude-plugin/plugin.json` (optional, for overrides)
- `commands/*.md` (slash commands)
- `agents/*.md` (subagents)
- `skills/*/SKILL.md` (skills)
- `hooks/hooks.json` (hook definitions)
- `.mcp.json` (MCP server config)

Atrium parses all of these to populate the detail view and to generate security signals (e.g., "this plugin installs a hook that runs arbitrary shell").

### 5. OpenTelemetry

Two flows:

**Outbound (atrium → your collector)**: standard OTLP. We emit:
- `atrium.http.*` for API traffic
- `atrium.ingest.*` for source sync jobs
- `atrium.policy.decision` for each allow/deny
- `atrium.install.issued` when a user downloads an artifact

**Inbound (Claude Code / your own plugins → atrium)**: optional. A plugin can import `@atrium/telemetry` (thin wrapper over OTEL SDK) that tags spans with `atrium.plugin.name` and `atrium.plugin.version`. Atrium ingests these via an OTLP receiver and aggregates into `Usage` rows.

Users who don't want telemetry set `ATRIUM_TELEMETRY=off`. Disabled is a first-class state, not a second-class one.

### 6. Auth

NextAuth.js with pluggable providers:
- Email magic link (dev default)
- OIDC (generic)
- SAML (via `@auth/saml`)
- GitHub / Google (dev/personal use)

Sessions are JWT-in-cookie. API tokens are hashed-at-rest with SHA-256 and scoped by role.

### 7. Deployment

**Dev**: `pnpm dev` + SQLite. Zero config.

**Self-host**: `docker compose up`. Spawns:
- `atrium` (the app)
- `postgres`
- `otel-collector` (optional)

**Prod**: any container runtime. Recommend putting atrium behind a reverse proxy with TLS. See `docs/DEPLOY.md`.

## Request flow example

A developer runs `/plugin install awesome-plugin@1.2.0` in Claude Code, pointed at `atrium.acme.com`.

1. Claude Code calls `GET https://atrium.acme.com/mkt/marketplace.json` with the user's bearer token
2. `app/mkt/marketplace.json/route.ts` loads the user from the token, applies policy (this user is in "engineering" role, which has `awesome-plugin` allowed), returns the filtered manifest
3. Claude Code finds `awesome-plugin@1.2.0` in the manifest, calls `GET /mkt/plugins/awesome-plugin/1.2.0.tar.gz`
4. Same route handler validates policy, issues an `Install` audit row with user/plugin/version/time, and streams the tarball
5. `atrium.install.issued` span emitted
6. Admin can see "Alice installed awesome-plugin@1.2.0 at 14:02" in the audit log
7. If `awesome-plugin` is later revoked, the next `marketplace.json` pull will simply omit it — Claude Code handles removal

## Extension points

- **Scanners**: `/lib/scanners/*.ts` — functions that take a parsed plugin and emit `SecuritySignal` rows. First scanner: "detects hook that runs arbitrary shell."
- **Policy engine**: `/lib/policy/*.ts` — a small rule DSL. Policies are evaluated on every request for every plugin.
- **Source adapters**: `/lib/sources/*.ts` — one file per source type. Add Artifactory, Nexus, S3 here later.

## What we explicitly avoid

- **No runtime plugin execution.** Atrium never runs plugin code. It serves manifests and archives. This keeps our attack surface tiny and makes the security story much easier.
- **No background workers we don't control.** One Next.js process. Scheduled jobs run in-process or as a sidecar, not via Redis queues.
- **No frontend state framework.** React Server Components render from the database. Client components are used only where genuinely needed (search input, install modal).
