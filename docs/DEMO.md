# Hosting the public demo

Atrium is a single-process Next.js 15 + Postgres app. A demo instance needs:

1. **App** — Node 20 runtime, Docker image or native deploy.
2. **Database** — Postgres (SQLite works for hobby demos too).
3. **Optional Ollama sidecar** — for the local-LLM curation story.
4. **Nightly reset** — so visitors don't break shared state.
5. **Domain + TLS** — see "Domain" section below.

## Cheapest path — spend $0–$5/mo

Rough cost matrix for a demo that gets ~100 visitors/day:

| Host | App | Postgres | TLS + domain | Total / mo | Nightly reset? |
|---|---|---|---|---|---|
| **Fly.io** | shared-cpu-1x (always-on: $0, scale-to-zero: $0) | free tier 1GB | free via Fly | **~$0** | built-in cron |
| **Railway** | ~$0.50–$2 usage | $0.50–$2 | free | **~$1–$4** | cron plugin |
| **Vercel + Neon** | free tier generous | Neon free (0.5GB) | free | **$0** | Vercel Cron |
| **Render** | free (spins down after 15min idle) | free 90d then $7 | free | **$0–$7** | manual cron |
| **Hetzner CX11 VPS** | €3.79/mo self-managed | self-hosted | Let's Encrypt free | **~$4.50** | your own cron |

**Recommendation for cheapest demo**: **Fly.io**. Docker-native, free Postgres tier handles the seed catalog + occasional visitor writes fine, cron is built into `fly.toml`, and if the demo gets dormant Fly scales it to zero so you pay nothing. Public URL is `https://<app>.fly.dev` by default — bring-your-own-domain is optional.

**Recommendation for cheapest with custom domain**: **Vercel + Neon Postgres**, both free. Add a domain ($10–$15/yr for `.dev` or `.sh`) and you're at $1/mo amortized.

**If you want a VPS you control**: **Hetzner CX11** at €3.79/mo. Full `docker compose up -d` works out of the box. Point DNS at the VPS, run Caddy in front for automatic TLS.

### Fly.io concrete commands (the fast path)

```bash
# One-time setup
fly auth signup
fly launch --no-deploy --copy-config
fly postgres create --name atrium-demo-db --region sjc --vm-size shared-cpu-1x --volume-size 1
fly postgres attach atrium-demo-db

# Secrets — generate fresh for the demo, never reuse prod values
fly secrets set \
  AUTH_SECRET="$(openssl rand -hex 32)" \
  ATRIUM_AUTH_MODE=open \
  ATRIUM_ORG_NAME="Atrium Demo" \
  ATRIUM_PUBLIC_URL="https://atrium-demo.fly.dev"

# First deploy
fly deploy --strategy rolling

# Init the schema + seed
fly ssh console -C "pnpm exec prisma db push && pnpm db:seed"

# Verify
curl https://atrium-demo.fly.dev/api/health
```

Total setup time: under 10 minutes. Total cost: $0/mo on the free tier.

## Three recommended hosts in order of ease:

## Option A: Fly.io (recommended — fastest path)

Pros: runs Docker natively, built-in Postgres, scales to zero.

```bash
fly launch --no-deploy                       # creates fly.toml from Dockerfile
fly postgres create --name atrium-db         # managed PG, free tier OK for demo
fly postgres attach atrium-db                # injects DATABASE_URL
fly secrets set AUTH_SECRET="$(openssl rand -hex 32)" \
  ATRIUM_ORG_NAME="Atrium Demo" \
  ATRIUM_ORG_SHORT_NAME="Demo" \
  ATRIUM_PUBLIC_URL="https://demo.atrium.example"
fly deploy
```

**Nightly reset** via a `fly.toml` cron:

```toml
[[processes]]
app = "node server.js"

[[services.http_checks]]
path = "/api/health"

[deploy]
strategy = "rolling"

# Nightly: drop + recreate the DB, re-push schema + seed
[[cron]]
name = "reset"
schedule = "0 6 * * *"  # 06:00 UTC = midnight PT
command = "pnpm exec prisma db push --force-reset --accept-data-loss && pnpm db:seed"
```

## Option B: Railway

Pros: pushes from GitHub, free Postgres, one-click deploy.

1. "New Project → Deploy from GitHub" → select the atrium repo.
2. Add a Postgres plugin. Railway sets `DATABASE_URL` automatically.
3. Set `AUTH_SECRET` + `ATRIUM_ORG_*` env vars.
4. Set build command `pnpm build` and start command `node .next/standalone/server.js`.
5. Add a daily cron: `pnpm exec prisma db push --force-reset --accept-data-loss && pnpm db:seed`.

## Option C: Vercel + Neon

Pros: fastest global edge, generous free tier.

1. Remove `output: "standalone"` from `next.config.ts` (Vercel manages the build).
2. Create a Neon Postgres project; copy the pooled connection URL to `DATABASE_URL`.
3. Import the repo on Vercel; set the env vars.
4. Schedule the reset via a Vercel Cron Job hitting `/api/admin/reset` (you'd need to add this route — gated by `ATRIUM_ADMIN_RESET_TOKEN`).

Neon has branching — useful for PR previews that get a fresh DB fork.

## Domain

Short list (availability checked April 2026, verify before purchase):

| Domain | Status | Notes |
|---|---|---|
| `atrium.io` | Taken | live |
| `atrium.app` | Taken | live |
| `atriumhq.com` | Taken | live |
| `atrium.dev` | Likely available | no HTTP response |
| `atrium.sh` | Likely available | no HTTP response |
| `atriumregistry.com` | Likely available | no HTTP response |
| `runatrium.com` | Likely available | no HTTP response |

**Recommendation**: `atrium.dev` (strong dev-tool signal, `.dev` is HTTPS-only by default, clean namespace) if it's actually available. `atrium.sh` is the backup — unix-y, short.

Confirm availability and buy via Namecheap, Porkbun, or Cloudflare Registrar (registrar-at-cost pricing). Point an A or AAAA record at the hosting platform's assigned IP, enable HTTPS via the platform's automatic TLS.

## Demo-specific configuration

The demo needs some extras that prod doesn't:

```bash
ATRIUM_AUTH_MODE=open                         # no login on the demo
ATRIUM_ORG_NAME="Demo Corp"                   # fictional
ATRIUM_ORG_SHORT_NAME="Demo"
ATRIUM_PROPOSAL_URL="https://github.com/kushal-goenka/atrium/issues/new"
ATRIUM_SUPPORT_EMAIL="hello@atrium.example"
```

Optional: configure an Ollama provider via seed so AI curation works out-of-the-box:

```bash
# In the reset cron, after db:seed, seed a demo Ollama config.
pnpm exec tsx prisma/seed-demo.ts
```

(That script doesn't exist yet — v0.1.x task.)

## Things the demo deliberately doesn't need

- OIDC / SAML (uses `ATRIUM_AUTH_MODE=open`)
- OTEL export (no production observability needed)
- Four-eyes approval (no real data at stake)
- Real LLM keys (if you don't provide them, AI curation just shows an error — fine for a demo)

## Public demo guardrails

To avoid the demo becoming an abuse vector:

- Rate-limit the public `/api/v1/*` more aggressively: set `ATRIUM_DEMO_MODE=true` and patch `lib/rate-limit.ts` defaults (not yet wired — v0.1.x).
- Disable provider writes (no `write:sources` tokens issued on demo).
- Reset nightly.
- Put Cloudflare in front for DDoS protection.
