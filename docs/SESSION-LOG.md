# Session Log

> Append-only. Each Claude Code session that ships something adds an entry. **Do not rewrite history.** If a prior entry is wrong, add a correction entry below it.

Format:

```
## YYYY-MM-DD — <one-line summary>
- Session owner: <user handle> / Claude model
- Shipped: <bullet list>
- Commits: <hash1> <hash2> ...
- Tests: N unit / M e2e (delta: +X/+Y)
- Stubs removed: <list or "none">
- Next up: <pointer into PROJECT.md>
```

Keep entries short. The commits are the ground truth; this index helps a future session figure out *where to look* in git log without reading every commit.

---

## 2026-04-20 — v0.1.x stub closure: plugin-DB migration + install telemetry + user-contrib surface

- Session owner: @kushal-goenka
- Shipped:
  - Plugins migrated off the static fixture: `data/plugins.ts` → `prisma/fixtures/plugins.ts`, `lib/plugins-repo.ts` reads DB rows, seed populates 12 plugins + 22 versions + 7 signals
  - `Plugin` schema gets `provider`, `version`, `usageJson`, `forkedFromJson`, `authorUrl` columns
  - All 10 callers (browse / detail / sources / admin / mkt / api v1 / curation / pin-fork / fork-diff / profile) now read from `plugins-repo`
  - Install telemetry: `recordInstallIntentAction(slug, version, clientType)` writes real `Install` rows; InstallPanel fires it on any copy-install; user profile activity reads the last 10 installs per user
  - Approved `UploadedSkill` rows now mirror into Plugin + PluginVersion under an auto-created `user-contributions` internal source; rejection removes the mirror
  - Three CLAUDE.md/PROJECT.md stubs closed in the same commit
- Earlier in the session (separate commit 1b9762b): four interactive setup skills (`atrium-setup-org`, `atrium-setup-dev`, `atrium-add-provider`, `atrium-diagnose`), `.claude-plugin/marketplace.json` self-publishing, auth-gap issue #6
- Earlier (commit 5b1b935): dropped `ATRIUM_ALLOW_EXTERNAL_FETCH` legacy env + legacy KIND_LABEL, scrubbed internal metadata, wrote `docs/AGENT-SETUP.md`
- Cheap hosting: `docs/DEMO.md` now has a 5-option cost matrix + Fly.io command sequence for a $0 demo
- Commits: 0a54ab0, 1b9762b, 5b1b935, 8d9c6b2
- Tests: 93 unit / 24 e2e (unchanged)
- Stubs removed: plugin-DB migration, install telemetry, user-contribution surface
- Next up: start v0.2 — SSO (NextAuth OIDC + SAML) per issue #3, then signed artifact serving per #4

## 2026-04-18 — Session handoff infrastructure

- Session owner: @kushal-goenka
- Shipped:
  - `CLAUDE.md` — briefing for any future Claude Code session
  - `docs/PROJECT.md` — living status + prioritized next-up list
  - `docs/SESSION-LOG.md` — this file
  - `docs/decisions/` — scaffold + 3 historical ADRs (provider discriminator, auth modes, air-gap)
  - `docs/DEMO.md` — demo deployment guide (Fly.io, Railway, Vercel)
  - `docs/prompts/` — reusable prompts for common session tasks
  - ROADMAP tightened with concrete v0.2+ work items
- Tests: 94 unit / 24 e2e (unchanged — docs only)
- Stubs removed: none
- Next up: pick the topmost item from `docs/PROJECT.md` § "v0.1.x — close the stubs". Most likely **plugin-DB migration** — unblocks three downstream items at once.

## 2026-04-18 — Public API, suggestions, user uploads, air-gap

- Session owner: @kushal-goenka
- Shipped:
  - Full `/api/v1/*` surface with bearer-token auth, OpenAPI spec, rate limits
  - `/admin/tokens` admin UI to issue/revoke
  - Suggestions forum (list + vote + create + detail + admin status controls)
  - User-contributed skill uploads (`/users/[id]/upload` + `/admin/uploads` review)
  - Air-gap posture (`open` / `allowlist` / `strict`), enforced in ingest adapters
- Commits: 83e60fc
- Tests: 94 unit (was 73) / 24 e2e (unchanged)
- Stubs removed: none

## 2026-04-18 — Logo redesign (A), de-brand, Ollama, fork diff

- Session owner: @kushal-goenka
- Shipped:
  - New "A" mark across logo/wordmark/favicon/Logo component
  - De-branded marketplace names (owner = `ATRIUM_ORG_NAME`, not "atrium@host")
  - Ollama provider in the vault (OpenAI-compat, key optional, default `gemma3:4b`)
  - docker-compose `ollama` profile
  - Fork diff view (`/admin/forks/[id]`) with field-aware diff algorithm
- Commits: b0b8eb6, 780a340
- Tests: 73 unit / 24 e2e

## 2026-04-18 — Multi-provider + LLM vault + AI curation + pin/fork

- Session owner: @kushal-goenka
- Shipped:
  - `PluginProvider` discriminator across Claude Code / OpenAI / Gemini / MCP / generic
  - Provider filter in browse
  - OpenAI actions + Gemini extensions sections on plugin detail
  - Encrypted ProviderConfig vault (AES-256-GCM)
  - `/admin/providers` with Test button
  - AI curation engine (`Suggest` → `Apply override`)
  - Version pinning + fork workflow with snapshot capture
  - Multi-client install matrix
  - User switcher + `/users/[id]` profile pages
  - Optional auth modes: `open` / `admin-password`
- Commits: 3149ea9, 3b28e02, caca209
- Tests: 66 unit / 21 e2e

## 2026-04-17 — v0.1.0-alpha foundation

- Session owner: @kushal-goenka
- Shipped:
  - Initial public repo at `github.com/kushal-goenka/atrium`
  - Apache 2.0 with full docs (README, ARCHITECTURE, SECURITY, VISION, ROADMAP)
  - Browse + plugin detail + admin + sources
  - Add source flow with Prisma
  - Testing infra (vitest + playwright)
  - Manifest parser + git/http ingest adapters + `/mkt/marketplace.json`
  - URL-persisted filters + light/dark/system theme toggle
  - docs/DEPLOY.md
  - `/api/health`, sync-now button, snapshot history
- Commits: ad79290, d83e841, b4a7985, 819be45, 498f65d, 729aa24, c7cfa3a, 167acd8
- Tests: 56 unit / 23 e2e (founding)
