# Roadmap

**Heads-up for new contributors / AI sessions**: the always-current priority list lives in [`docs/PROJECT.md`](docs/PROJECT.md) § "Next up". This document is the narrative version — when + why. For "what do I pick up next", read PROJECT.md.

---

## v0.1 — alpha (shipped)

The "show-don't-tell" release. Clone, run, and the full product loop works end-to-end against seeded data.

- [x] Catalog, plugin detail, search/filter, admin dashboard, add-source
- [x] Multi-provider support (Claude Code, OpenAI, Gemini, MCP, generic)
- [x] Version pinning, forking, field-aware fork-diff
- [x] LLM provider vault (AES-256-GCM), AI curation engine
- [x] Multi-client install matrix (Claude CLI, Codex, Cursor, Gemini CLI, Aider, raw MCP)
- [x] Mock user switcher + per-user profile pages
- [x] Optional auth modes: `open`, `admin-password`
- [x] Public `/api/v1` + bearer tokens + OpenAPI 3.1
- [x] Suggestions forum with vote + status triage
- [x] User-contributed skill uploads with admin review
- [x] Air-gap posture (open / allowlist / strict)
- [x] Docker Compose with optional `ollama` + `otel-collector` profiles

Tests: 94 unit / 24 e2e. CI: typecheck + unit + build → gated e2e.

---

## v0.1.x — close the stubs (next)

Small-but-meaningful cleanups that unblock future work. Ordered by dependency.

- [ ] **Plugin-DB migration** — move `data/plugins.ts` into `Plugin` + `PluginVersion` Prisma rows. Unblocks install telemetry and user-contribution publishing.
- [ ] **Install event recording** — write `Install` rows on `/mkt/plugins/…` fetches (and on copy-command clicks as intent signal).
- [ ] **User-contribution source surface** — approved `UploadedSkill` rows appear in browse under a `user-contributions` source.
- [ ] **Seed demo data** — extend `prisma/seed.ts` with plugins + suggestions + uploads for the public demo instance.

**Ship criterion**: the four "stubbed" callouts in CLAUDE.md are gone.

---

## v0.2 — enterprise SSO + air-gapped artifact serving

"Safe to put behind a company firewall."

- [ ] **OIDC + SAML** via NextAuth. Retire the cookie-backed acting-as switcher for prod.
- [ ] **Role enforcement** — four built-in roles act as real permission gates, not display metadata.
- [ ] **Signed artifact serving** — `/mkt/plugins/[slug]/[version].tar.gz` streams tarballs from configured storage (filesystem / S3 / MinIO). Optional cosign signing. Unlocks full `strict` air-gap mode.
- [ ] **Four-eyes approval mode** — `ATRIUM_FOUR_EYES=true` enforces two-admin approval on destructive actions.
- [ ] **Merge-from-upstream for forks** — three-way merge UI using the existing `lib/diff.ts`.

**Ship criterion**: an enterprise security team can read `SECURITY.md`, run the hardening checklist, and sign off without waivers.

---

## v0.3 — observability

"Know what's happening in production."

- [ ] **OTEL end-to-end** — spans on every HTTP handler, Prisma query, ingest job, server action. Custom attributes (`atrium.plugin.slug`, `atrium.source.id`, `atrium.user.role`).
- [ ] **Admin metrics page** — `/admin/metrics` with per-plugin trends, sync latency, top providers, policy decisions over time. Queries `UsageDaily` aggregates.
- [ ] **Grafana dashboards** — pre-built JSON in `deploy/grafana/` for the OTEL metrics.
- [ ] **OTLP receiver** — plugins can send their own spans through Atrium to the org's OTEL backend.

**Ship criterion**: an admin can answer "which plugins do we use, and is any of them degraded?" in under 30 seconds.

---

## v0.4 — policy + scanners + notifications

"From *distribute code* to *govern code*."

- [ ] **Policy engine** — small rule DSL stored in `Policy` rows. Evaluates per request: role × source × signal severity × CVE-state → allow / deny / quarantine.
- [ ] **Scanner framework** — `lib/scanners/*.ts`, pluggable. Ship three:
  - `hook-shell` — flags plugins installing shell hooks
  - `mcp-scope` — flags MCP servers calling unknown external hosts
  - `cve` — cross-references plugin dependencies with OSV.dev
- [ ] **Notifications** — fanout to email / Slack / webhook on: new high-severity signal, CVE matched on installed plugin, admin action requires approval.
- [ ] **CVE auto-gate** — `ATRIUM_CVE_POLL=true` polls OSV.dev hourly; matching plugins auto-transition to `quarantined`.

**Ship criterion**: a CISO accepts SECURITY.md at face value.

---

## v0.5 — trust, release engineering, federation

"Trustworthy to consume, discoverable across orgs."

- [ ] **Signed releases** — GitHub Actions publishes cosign-signed Docker images + SBOM (CycloneDX) + reproducible builds.
- [ ] **Release provenance** — SLSA Level 3 for the release workflow.
- [ ] **Bug bounty** — HackerOne program bootstrapped.
- [ ] **Federated suggestions** — opt-in protocol for Atriums to share suggestion rows across orgs (ActivityPub-lite).
- [ ] **`.well-known/atrium.json`** — client-discovery endpoint for clients that want to auto-detect Atrium instances.

**Ship criterion**: a user can verify a binary release back to the source commit. Two Atrium deployments can share suggestions without a central server.

---

## Not scheduled

These land when the problem they solve matters.

- Multi-tenant SaaS mode
- Plugin authoring UI (write a plugin in the browser)
- Paid plugin / billing layer (Stripe)
- Mobile app
- Self-service onboarding for plugin authors

---

## How to propose a change

1. Read [`docs/PROJECT.md`](docs/PROJECT.md) to make sure it's not already queued.
2. Open an issue with `[proposal]` in the title, sections:
   - **Problem** (who hits it and when)
   - **Non-proposal** (what this isn't)
   - **Sketch** (rough approach)
   - **Alternatives** (what we'd do instead)
3. For durable design decisions, an ADR lands with the PR in [`docs/decisions/`](docs/decisions/).

Small PRs land. Big PRs start as a proposal issue.
