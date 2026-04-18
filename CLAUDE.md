# CLAUDE.md

> **You are a Claude Code session picking up this project mid-flight.** Read this once — it's the briefing. Then do the task you were asked to do.

---

## What is Atrium (one paragraph)

Atrium is an **open-source, self-hostable plugin registry for AI agents** — "LiteLLM for plugin marketplaces." It ingests from Claude Code, OpenAI, Gemini, MCP servers, and generic agent sources; policy-filters them; and serves a unified catalog with governance (pin / fork / diff / curate) and an encrypted vault for provider LLM keys. Repo: `github.com/kushal-goenka/atrium`. Alpha (v0.1.0), Apache 2.0, single-process Next.js 15 + Prisma 6.

## The four files you probably need

| File | When you need it |
|---|---|
| [`README.md`](README.md) | User-facing pitch + features + quickstart. Don't restate this to the user. |
| [`docs/PROJECT.md`](docs/PROJECT.md) | **Living status doc**: what's shipped, what's next, known debt. Start here before proposing work. |
| [`docs/SESSION-LOG.md`](docs/SESSION-LOG.md) | Append-only journal. Read the last 3–4 entries to understand *what just happened*. |
| [`docs/decisions/`](docs/decisions) | ADRs — permanent design decisions. Read one if the user asks "why did you X?" |

Secondary (skim only):
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — layered overview
- [`SECURITY.md`](SECURITY.md) — threat model
- [`ROADMAP.md`](ROADMAP.md) — version plan
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — production deploy
- [`docs/DEMO.md`](docs/DEMO.md) — hosting the public demo

## Conventions (read once, then follow)

**Stack & style**

- Next.js 15 App Router, **Server Components by default**. Client-side only where you need state/effects.
- TypeScript strict. No `any` without a one-line comment explaining why.
- Tailwind v4 with CSS custom properties (`var(--color-fg)`, etc.). No shadcn dependency — components are in-tree.
- Prisma 6 with a SQLite/Postgres-portable schema. No enums (SQLite doesn't support them); string fields with a comment listing the valid values.
- No emojis in code, comments, or commit messages unless the user explicitly asks.

**Editing discipline**

- Don't add features, refactors, or tests beyond what's asked. Keep changes tight.
- Don't write trailing summaries, TL;DRs, or "let me know if you need anything else" in responses.
- When you finish, commit with a `type(scope): subject` message; expand in the body only if non-obvious.
- Treat dead code / unused imports as a build failure — Next's ESLint will flag them and CI will fail.

**Before any non-trivial change**

1. Read the relevant section of `docs/PROJECT.md`.
2. Run `pnpm typecheck && pnpm test` first — make sure the baseline is green.
3. When done: typecheck, unit tests, `pnpm build`, then (if UI) a spot-check in the browser.
4. Add an entry to `docs/SESSION-LOG.md` with what you shipped + commit hash.

## What's green vs what's stubbed

Skim this to avoid being surprised.

**Fully working end-to-end**: browse, plugin detail, search/filter, admin dashboard, add source, sync source (real git clone + http fetch), pin + fork + diff view, AI curation (calls real LLM via configured provider), LLM provider vault (AES-256-GCM encrypted), multi-client install matrix, user switcher + profile pages, optional auth modes, public `/api/v1` endpoints, suggestions forum with voting, user-contributed skill uploads with admin review, air-gap posture, `/api/health`.

**Intentionally stubbed** (will confuse you if you forget):
- **Plugins are a static fixture** in [`data/plugins.ts`](data/plugins.ts) — not yet DB-backed. `PluginOverride` merges in via [`lib/overrides.ts`](lib/overrides.ts). Migration is planned in v0.1.x.
- **User identity is mocked** ([`lib/users.ts`](lib/users.ts)). The "acting as" switcher sets a cookie; there's no real auth except `admin-password` mode for `/admin/*`. SSO arrives in v0.2.
- **Install telemetry is not wired** — the `Install` Prisma model exists but we don't record rows on copy-command clicks (needs plugin-DB migration first so the FK is real).
- **Scanners are declarative** — the `SecuritySignal` rows come from the seed fixture. Real scanners arrive in v0.4.
- **OTEL export** — configured via env vars but no actual spans emitted yet (v0.3).

When you finish a piece of stubbed work, **remove the stub note from this section** in the same commit.

## Build/test commands

```bash
pnpm install                               # deps
pnpm db:push && pnpm db:seed               # dev DB
pnpm dev                                   # dev server (turbopack)
pnpm typecheck                             # strict TS
pnpm test                                  # 94 unit tests (vitest)
pnpm test:e2e                              # 24 e2e tests (playwright)
pnpm build                                 # production build — must pass before PR
```

## When the user says "work on the next thing"

- If they didn't name it: open `docs/PROJECT.md` § "Next up", pick the topmost item, confirm once if the scope is large.
- If they named a feature: check `docs/decisions/` for an ADR on it first. If none exists and it's a durable decision, write an ADR as part of the PR.
- If they named an issue number: `gh issue view N` — GitHub issues are the authoritative queue for discrete work.

## When you're running out of context

- Append a **Session Log entry** to `docs/SESSION-LOG.md` before you lose context, summarizing what you shipped and what to pick up next.
- Tell the user: "I'm near context limit. Next session should read `CLAUDE.md` → `docs/SESSION-LOG.md` (last entry) → `docs/PROJECT.md`, then continue with [X]."

## What not to do

- **Don't** ship "nice-to-have" refactors adjacent to a requested change. One change, one commit.
- **Don't** ship backwards-compat shims or deprecation warnings. This is alpha — change the call sites.
- **Don't** rename "atrium" anywhere user-facing. The product is named Atrium; the de-brand on marketplace names is intentional (`ATRIUM_ORG_NAME` is what users see).
- **Don't** invent a new plugin manifest format. Atrium speaks Anthropic's Claude Code format verbatim for that provider and uses native formats for OpenAI/Gemini via the `provider` discriminator.
