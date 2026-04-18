# Roadmap

Milestones are scoped to make each release individually deployable and useful. We don't ship M1 by skipping half of M0.

## M0 — Beautiful read-only browser (weeks 1–2)

The "show don't tell" release. A platform engineer should be able to clone atrium, run `pnpm dev`, and immediately see a browse experience nicer than Claude Code's CLI listing.

- [x] Vision, architecture, security docs
- [ ] Next.js + Tailwind + shadcn scaffold
- [ ] Plugin manifest type definitions (Anthropic-compatible)
- [ ] Seed catalog (10 realistic sample plugins across categories)
- [ ] Browse page: grid, search, category filter
- [ ] Detail page: manifest, install snippet (copy-to-clipboard), version history
- [ ] Logo, favicon, brand
- [ ] Dark mode
- [ ] Keyboard shortcuts (⌘K search)

**Ship criterion**: a screenshot of the browse page is good enough to tweet.

## M1 — Federation and persistence (weeks 3–5)

Turn the prototype into a real thing backed by a database, ingesting from real sources.

- [ ] Prisma schema + migrations
- [ ] SQLite dev default, Postgres prod
- [ ] Source adapter: `git` (clone + parse marketplace.json)
- [ ] Source adapter: `http` (fetch raw URL)
- [ ] Ingest job runner (in-process cron)
- [ ] Anthropic-compatible `/mkt/marketplace.json` endpoint
- [ ] Plugin archive streaming endpoint
- [ ] Docker Compose (app + postgres)

**Ship criterion**: point atrium at `github.com/anthropics/claude-code/examples/marketplace` and see the plugins render.

## M2 — Auth, RBAC, admin (weeks 6–8)

Make it safe to put behind a company firewall.

- [ ] NextAuth with OIDC provider
- [ ] Four built-in roles: viewer / installer / curator / admin
- [ ] Admin UI: sources (add/remove/re-sync), plugins (approve/reject/quarantine), users (invite, assign roles)
- [ ] Policy engine v1: allow-list per source
- [ ] Audit log (immutable, paginated UI)
- [ ] API tokens for programmatic access

**Ship criterion**: a platform engineer at a real company deploys atrium and the security team signs off.

## M3 — Observability (weeks 9–10)

Know what's happening.

- [ ] OTEL SDK wired through all HTTP + ingest paths
- [ ] `atrium.install.issued` custom metric
- [ ] Admin metrics page: top plugins, recent installs, source health
- [ ] OTLP receiver endpoint for plugin-side telemetry
- [ ] Dashboards: Grafana JSON, pre-built

**Ship criterion**: an admin can answer "which plugins does my org use?" in under 30 seconds.

## M4 — Policy and scanning (weeks 11–14)

From "distribute code" to "govern code."

- [ ] Scanner framework with pluggable scanners
- [ ] Scanner: hooks that run shell
- [ ] Scanner: MCP servers calling external hosts
- [ ] Scanner: dependency CVEs (via OSV.dev)
- [ ] Policy engine v2: per-role, version-pinned, CVE-gated, quarantine-on-signal
- [ ] Four-eyes mode for destructive admin actions
- [ ] CVE notification fan-out (email, Slack, webhook)

**Ship criterion**: a CISO can read SECURITY.md and be comfortable.

## M5 — Release engineering (weeks 15–16)

Make it trustworthy to consume.

- [ ] Signed Docker images (cosign)
- [ ] SBOM (CycloneDX) on every release
- [ ] Reproducible builds
- [ ] Release GitHub Action with provenance
- [ ] Bug bounty program bootstrapped

**Ship criterion**: a user can verify the release they downloaded back to our source commit.

## Beyond v1 (not scheduled)

- Multi-tenant SaaS mode
- Plugin authoring UI
- Non-Anthropic plugin formats (OpenAI, Gemini, generic)
- Plugin marketplace peer-to-peer federation protocol
- Paid plugin support (Stripe)
- Self-service onboarding for plugin authors

## How to propose a change

Open an issue with `[proposal]` in the title and the following sections:
- **Problem** (who hits it and when)
- **Non-proposal** (what this isn't)
- **Sketch** (rough approach, not a final design)
- **Alternatives** (what we'd do instead)

Small PRs land. Big PRs start as a proposal issue so we can discuss scope before anyone writes code.
