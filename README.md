<p align="center">
  <img src="public/brand/logo-wordmark.svg" alt="atrium" height="56" />
</p>

<p align="center">
  <b>The open plugin registry for AI agents.</b><br>
  Self-host your own. Federate from others. Audit everything.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="Apache 2.0" src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" /></a>
  <a href="./ROADMAP.md"><img alt="status" src="https://img.shields.io/badge/status-alpha-orange.svg" /></a>
  <a href="./SECURITY.md"><img alt="threat model" src="https://img.shields.io/badge/security-documented-green.svg" /></a>
  <a href="https://github.com/kushal-goenka/atrium/actions"><img alt="ci" src="https://img.shields.io/badge/ci-github_actions-black.svg" /></a>
</p>

---

Anthropic shipped an excellent plugin primitive for Claude Code. It's incomplete for enterprises: no private mirror, no federation policy, no observability, no governance. Atrium is the thin, neutral control plane that fills the gap — **LiteLLM for plugin marketplaces**.

Point your team at one URL. Get a beautiful catalog, one-click install snippets, federation from public marketplaces, SSO, RBAC, and OpenTelemetry metrics.

## Screenshots

<p align="center">
  <img src="docs/screenshots/browse.png" alt="Browse page (dark)" width="80%" />
</p>

<p align="center">
  <img src="docs/screenshots/plugin-detail.png" alt="Plugin detail" width="80%" />
</p>

<p align="center">
  <img src="docs/screenshots/admin.png" alt="Admin dashboard" width="80%" />
</p>

<details>
<summary><b>Also: light theme · mobile · add-source · sources</b></summary>

<p align="center">
  <img src="docs/screenshots/browse-light.png" alt="Browse page (light)" width="70%" />
  <br><em>Light theme. Toggle in the nav persists per-user.</em>
</p>

<p align="center">
  <img src="docs/screenshots/browse-mobile.png" alt="Browse page (mobile)" width="30%" />
  <br><em>Responsive down to 375px.</em>
</p>

<p align="center">
  <img src="docs/screenshots/add-source.png" alt="Add a federated source" width="70%" />
  <br><em>Server-validated form; new sources appear in the catalog on submit.</em>
</p>

<p align="center">
  <img src="docs/screenshots/sources.png" alt="Federated sources" width="70%" />
  <br><em>Each source has a trust tier that drives policy decisions.</em>
</p>

</details>

## Why Atrium

| What enterprises need | What Anthropic's reference marketplace gives | What Atrium adds |
|---|---|---|
| A private mirror of approved plugins | Public catalog only | Self-hosted + federated, internal plugins live here |
| Policy on what devs can install | Anyone can add any URL | Role-aware allow-list, quarantine-by-default, CVE gating |
| Observability on plugin usage | None | OpenTelemetry traces + per-plugin install / command metrics |
| A human discovery UX | CLI text list | Searchable catalog with trust tiers, security signals, usage stats |
| White-labelled for your org | Anthropic-branded | `ATRIUM_ORG_*` env vars theme the whole UI |
| Compliance story | None | Immutable audit log, SBOM, signed releases, documented threat model |

## Quickstart (dev)

```bash
git clone https://github.com/kushal-goenka/atrium.git
cd atrium
cp .env.example .env.local
pnpm install
pnpm db:push
pnpm dev
```

Open http://localhost:3000. A seeded catalog of ten realistic plugins across three trust tiers loads automatically.

## Quickstart (Docker)

```bash
docker compose up -d
```

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for Postgres, object storage, SSO, and OTEL configuration. For a hardened production deploy, walk the checklist in [`SECURITY.md`](SECURITY.md#hardening-checklist-for-operators).

## Use with Claude Code

Once Atrium is running, point Claude Code at it:

```
/plugin marketplace add https://atrium.yourcompany.com
/plugin install incident-commander@2.3.1
```

Atrium serves Anthropic's `.claude-plugin/marketplace.json` format unchanged. Anything that works in the public marketplace works here.

## Features shipped in the alpha

- **Browse** — faceted catalog with category chips, trust-tier filter, per-plugin usage, and review flags for plugins with security signals.
- **Plugin detail** — full Anthropic manifest rendered (commands, subagents, skills, hooks, MCP servers), one-click install snippet, sticky sidebar with usage metrics, provenance, and a live security-signals panel.
- **Federation** — ingest from git repos, HTTP URLs, or local uploads; three-tier trust model (`official` / `verified` / `community` / `internal`); quarantine-by-default for new plugins.
- **Admin dashboard** — operational stats, approvals queue, source health, immutable audit log, high-severity signals panel.
- **Add source** — server-validated form + Prisma-backed persistence; new sources appear immediately in the catalog.
- **White-label theming** — `ATRIUM_ORG_NAME`, `ATRIUM_ORG_SHORT_NAME`, `ATRIUM_ORG_LOGO_URL`, `ATRIUM_ORG_URL`, `ATRIUM_SUPPORT_EMAIL`, `ATRIUM_PROPOSAL_URL`, `ATRIUM_ACCENT_HEX`. Theme without touching code.
- **Users** — role table (admin / curator / installer / viewer). SSO-backed invitations land in M2.

## What's coming next

See [`ROADMAP.md`](ROADMAP.md). The headline items:

- **M1** — real ingestion from git sources + Anthropic-compatible serving endpoints
- **M2** — OIDC/SAML, four-eyes approval, full RBAC
- **M3** — OpenTelemetry end-to-end, admin metrics page
- **M4** — policy engine, scanners, CVE gating, notifications
- **M5** — signed releases, SBOM, provenance, bug bounty

## Architecture at a glance

```
Claude Code ──▶ Atrium (Next.js + Prisma + Postgres)
                 ├── Browse / detail UI (SSR)
                 ├── /mkt/marketplace.json  (Anthropic-compatible)
                 ├── /mkt/plugins/…tar.gz   (policy-filtered artifacts)
                 ├── Admin UI (sources, plugins, users, policies, audit)
                 └── OTEL exporter  ──▶ your collector
                            ▲
          federated sources (git / http / other atriums)
```

Deep dive: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Self-host checklist

Before a production deploy, complete the ops checklist in [`SECURITY.md`](SECURITY.md#hardening-checklist-for-operators). Highlights:

- TLS-terminating reverse proxy
- OIDC or SAML (don't rely on magic links in prod)
- Bootstrap admins via `ATRIUM_ADMIN_EMAILS`
- Enable four-eyes mode and CVE polling
- Configure OTEL export
- Postgres backup policy

## Stack

Next.js 15 (App Router, Server Components) · React 19 · Tailwind v4 · Prisma 6 (Postgres / SQLite) · TypeScript strict · No shadcn dep, components are in-tree · Apache 2.0.

**Philosophy:** boring stack, obvious code. A platform engineer should be able to read and patch Atrium in an afternoon.

## Testing

```bash
pnpm test          # unit (vitest) — 56 tests
pnpm test:e2e      # end-to-end (playwright) — 21 tests
pnpm typecheck     # strict TypeScript
pnpm build         # production build verification
```

- **Unit** covers `lib/utils`, `lib/branding`, `lib/sources`, `lib/manifest`, git/http ingest adapters (mocked `fetch` + URL-validation cases), and Server Action validation paths (mocked `next/cache` + `next/navigation`).
- **E2E** covers browse/filter/search, category + source narrowing, plugin detail manifest rendering, install snippet, flag-for-rescan, admin stats, approve flow, add-source end-to-end, users page, `/mkt/marketplace.json` contract, theme persistence, URL-filter round-trip.
- **CI** (GitHub Actions) runs typecheck + unit + build in one job, then e2e in a separate job gated behind them, uploading the Playwright report on failure.

## Contributing

PRs welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md). Especially looking for help on source adapters (Artifactory, Nexus, S3), scanners (new static checks), auth providers, translations, and runbooks.

Security? Report privately via GitHub Security Advisories — not a public issue. Details in [`SECURITY.md`](SECURITY.md).

## License

Apache 2.0. See [`LICENSE`](LICENSE).
