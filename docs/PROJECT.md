# Atrium — Project Status

> Living document. Updated every session that ships something. Before starting work, read this top-to-bottom.

**Current version**: `v0.1.0-alpha`
**Last updated**: 2026-04-18
**Status**: Alpha. Feature-complete for the "polished demo" bar; missing enterprise-SSO, real telemetry, and real scanners.

---

## Shipped in v0.1 (the feature floor)

The alpha ships these features end-to-end. If a feature is here, it works and has tests.

### Catalog & governance
- Multi-provider catalog (Claude Code, OpenAI, Gemini, MCP, generic)
- URL-persisted search + filter (query, category, provider, source)
- Plugin detail with full per-provider manifest rendering
- Quarantine / approval workflow with audit log
- Version pinning (PluginOverride)
- Forking with field-aware diff against upstream
- AI curation (category + tags) using any configured LLM provider
- Multi-client install matrix: Claude Code inline/CLI, Codex, Cursor, Gemini CLI, Aider, raw MCP JSON

### Identity & auth
- Mock "acting as" user switcher (cookie-backed) with per-user profile pages
- Optional auth modes: `open` (default), `admin-password` (HMAC-signed session), `sso` (planned)
- Four built-in role types: admin / curator / installer / viewer (metadata only — enforcement in v0.2)

### LLM integration
- Encrypted provider vault (AES-256-GCM, key derived from `AUTH_SECRET`)
- Providers: Anthropic, OpenAI, Azure OpenAI, Gemini, LiteLLM proxy, Ollama (local), custom
- Test-connection button per provider
- AI curation uses whatever provider is configured

### Public API & integrations
- `/api/v1/plugins` (list/detail), `/api/v1/sources` (list/create), `/api/v1/metrics/usage`
- OpenAPI 3.1 spec at `/api/v1/openapi.json`
- Bearer-token auth with scopes (`read:catalog`, `write:sources`, `write:plugins`)
- Per-IP rate limits with `x-ratelimit-*` headers
- `/admin/tokens` for issuing/revoking
- `/mkt/marketplace.json` Anthropic-compatible endpoint

### Community & contribution
- Suggestions forum at `/suggestions` with upvote, status workflow, admin triage
- User-contributed skill uploads (`/users/[id]/upload`) with admin review queue at `/admin/uploads`

### Operations
- Air-gap posture: `open` / `allowlist` / `strict` modes, enforced by ingest adapters
- `/api/health` liveness + readiness probe
- White-label theming via `ATRIUM_ORG_*` env vars
- Docker Compose with optional `ollama` + `otel-collector` profiles
- Fork snapshot history (MarketplaceSnapshot rows)

### Testing & CI
- 94 unit tests (vitest) across utils, branding, sources, manifest, crypto, git, http, api-auth, rate-limit, airgap, diff, actions
- 24 e2e tests (playwright) across browse, detail, admin, add-source, theme, filters, mkt endpoint, health
- GitHub Actions: typecheck + unit + build → gated e2e job

---

## What's stubbed (know before you build on top of it)

These are intentional shortcuts — will confuse you if you forget they're in place.

1. **Plugins live in `data/plugins.ts`, not Prisma.** `hydratePlugins()` merges `PluginOverride` on top of the static fixture. Migrating plugins to DB is the first piece of v0.1.x.
2. **User identity is mocked.** `MOCK_USERS` in `lib/users.ts`. Current user comes from a cookie (`atrium-acting-as`). `admin-password` mode gates `/admin/*` via middleware but doesn't associate sessions with any user row.
3. **Install telemetry is not persisted.** The `Install` Prisma model exists but no code creates rows. Plugin-DB migration unblocks this.
4. **Security scanners are declarative.** `SecuritySignal` rows in the fixture. No real static-analysis pass.
5. **OTEL export** — env-configured but no spans emitted. Instrumentation needed on all `fetch` + `prisma` calls.
6. **Four-eyes approval** — `ATRIUM_FOUR_EYES` env exists but there's no gate implementation.
7. **User-contribution source** — approved uploads persist in `UploadedSkill` but don't show up in the browse catalog yet (needs the plugin-DB migration to have a proper `Source` row they hang off).

When you finish any of these, remove the line in the same commit.

---

## Next up — priority-ordered

The ordering is opinionated. Pick from the top. If you pick out of order, put a note on the PR explaining why.

### v0.1.x — close the stubs (highest priority)

1. **Plugin-DB migration.** Move `data/plugins.ts` fixture into `Plugin` + `PluginVersion` rows. Seed script. `hydratePlugins()` becomes a pure DB read. Unblocks: real install telemetry, user-contribution publishing, scanner output per plugin.
2. **Install event recording.** Hook into the copy-install button + the `/mkt/plugins/…` fetch (when that ships) to write `Install` rows. Update `/users/[id]` activity feed to read real rows.
3. **User-contribution source surface.** When a curator approves an `UploadedSkill`, mirror it into the catalog under a `user-contributions` source so it shows up in browse.
4. **Delete the "stubbed" callouts in CLAUDE.md + PROJECT.md** for each item as it lands.

### v0.2 — SSO + artifact serving + policy enforcement

5. **OIDC + SAML via NextAuth.** New auth mode. Retire the acting-as cookie for prod. Real `User` rows. Role enforcement on every admin action.
6. **Signed artifact serving.** `/mkt/plugins/[slug]/[version].tar.gz` streams tarballs from configured object storage (S3 / MinIO / filesystem). Optional cosign signing. Unlocks full air-gap mode.
7. **Four-eyes approval mode.** `ATRIUM_FOUR_EYES=true` requires two admins for destructive actions (policy changes, source removal, plugin block).
8. **Merge-from-upstream for forks.** Uses the existing `lib/diff.ts` engine to produce a three-way merge UI on the fork detail page.
9. **Delete the "stubbed" callouts** for auth mocks.

### v0.3 — observability

10. **OTEL end-to-end.** Spans on every HTTP request, Prisma query, ingest job, and server action. Custom attributes (`atrium.plugin.slug`, `atrium.source.id`). Grafana dashboard JSON in `deploy/grafana/`.
11. **Admin metrics page.** `/admin/metrics` with per-plugin install trends, sync latency, top providers, policy decisions over time. Queries Prisma `UsageDaily` aggregates.

### v0.4 — policy + scanners + notifications

12. **Policy engine.** Small DSL stored in `Policy` rows. Evaluates per request: role + source + signal severity + CVE-state → allow/deny/quarantine.
13. **Scanners (plural).** `lib/scanners/*.ts` pluggable framework. Ship three: `hook-shell` (hooks running shell), `mcp-scope` (MCP calling unknown hosts), `cve` (OSV.dev against dependencies).
14. **Notifications.** Fanout to email / Slack / webhook on: new high-severity signal, CVE matched on installed plugin, admin action requires approval.

### v0.5 — trust & federation

15. **Signed releases.** Cosign signing in the release workflow, SBOM per release (CycloneDX), reproducible Docker builds.
16. **Federated suggestions.** Opt-in protocol for multiple Atriums to share suggestion rows (ActivityPub-lite).

### Ongoing — quality

- Test coverage: aim 80% on `lib/` modules, 100% on server-action validation paths.
- Accessibility audit pass.
- Internationalization scaffolding (i18n dictionaries in `lib/i18n/`).
- SQLite FTS for search once the catalog exceeds 50 plugins.
- `.well-known/atrium.json` for client auto-discovery.

---

## Known debt

Track in this section rather than GitHub Issues when the fix is trivial but not yet scheduled.

- `app/admin/page.tsx` hard-codes the audit log as a const — replace with DB read once `AuditLog` has rows flowing through it (likely v0.1.x with plugin migration).
- `lib/rate-limit.ts` is in-memory only. For multi-process deploys, needs Redis backend. The function signature is stable so this is a swap without caller changes.
- `components/theme-toggle.tsx` has duplicated color-palette code with `lib/users.ts` `userColor`. Consolidate into `lib/palette.ts` when either changes.
- Seed script (`prisma/seed.ts`) only seeds roles + sources. Plugins/users/suggestions never get seeded.

---

## Design decisions

Durable decisions live in [`docs/decisions/`](decisions/) as Architecture Decision Records (ADRs). Read the relevant ADR before changing any of these:

- ADR-0001: Why a provider discriminator on Plugin (vs. separate types per provider)
- ADR-0002: Three-tier auth modes (open / admin-password / sso)
- ADR-0003: Air-gap as three modes rather than a boolean

Add a new ADR whenever you make a decision that:
1. Affects the database schema
2. Commits to a pattern future contributors need to follow
3. Rejects an obvious alternative for a non-obvious reason

---

## Who's who

- **Maintainer**: [@kushal-goenka](https://github.com/kushal-goenka) on GitHub.
- **Contributions welcome**: see `CONTRIBUTING.md`. Good first issues tagged `good-first-issue`.
