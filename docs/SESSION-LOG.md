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

## 2026-04-18 — Session handoff infrastructure

- Session owner: @kushal-goenka / Claude Opus 4.7 (1M context)
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

- Session owner: @kushal-goenka / Claude Opus 4.7
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

- Session owner: @kushal-goenka / Claude Opus 4.7
- Shipped:
  - New "A" mark across logo/wordmark/favicon/Logo component
  - De-branded marketplace names (owner = `ATRIUM_ORG_NAME`, not "atrium@host")
  - Ollama provider in the vault (OpenAI-compat, key optional, default `gemma3:4b`)
  - docker-compose `ollama` profile
  - Fork diff view (`/admin/forks/[id]`) with field-aware diff algorithm
- Commits: b0b8eb6, 780a340
- Tests: 73 unit / 24 e2e

## 2026-04-18 — Multi-provider + LLM vault + AI curation + pin/fork

- Session owner: @kushal-goenka / Claude Opus 4.7
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

- Session owner: @kushal-goenka / Claude Opus 4.7
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
