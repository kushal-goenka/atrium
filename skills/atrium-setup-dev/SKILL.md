---
name: atrium-setup-dev
description: Bootstrap a local Atrium dev environment. Zero prompts — clones, installs, seeds, starts the dev server, and opens the browser.
trigger: when the user asks to get Atrium running locally, set up Atrium for development, or run Atrium on their machine
---

# Local Atrium dev bootstrap

You are setting up Atrium on the operator's machine for local development. This is not a production deploy — it uses SQLite, `ATRIUM_AUTH_MODE=open`, and the seeded demo catalog.

Run the steps below in order. Do not ask questions. Stop immediately on any failure with the exact error.

## Prerequisites (verify before starting)

- `node --version` → ≥ 20
- `pnpm --version` → if missing, run `corepack enable` then `corepack prepare pnpm@9.15.0 --activate`
- `git --version` → any modern version

If any is missing, surface what's missing and stop.

## Step 1 — Clone and install

```bash
git clone https://github.com/kushal-goenka/atrium.git
cd atrium
pnpm install --frozen-lockfile
```

**Success**: exits 0, `node_modules/` exists.

## Step 2 — Environment

```bash
cp .env.example .env.local
```

Then inject an `AUTH_SECRET`:

```bash
# Portable: works on macOS and Linux
grep -q '^AUTH_SECRET=' .env.local && \
  sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 32)|" .env.local || \
  echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env.local
rm -f .env.local.bak
```

`.env.local` is gitignored; confirm that before moving on (`grep '\.env\.local' .gitignore`).

## Step 3 — Database

```bash
pnpm exec prisma db push --skip-generate
pnpm exec prisma generate
pnpm db:seed
```

**Success**: seed prints `✓ 4 roles` and `✓ 3 sources`. SQLite file exists at `prisma/dev.db`.

## Step 4 — Dev server

```bash
pnpm dev > /tmp/atrium-dev.log 2>&1 &
```

Wait 5 seconds, then probe:

```bash
sleep 5
curl -fsS http://localhost:3000/api/health | jq -e '.status == "ok"'
```

**Success**: health check returns ok. If it fails, `tail /tmp/atrium-dev.log` and surface the Next.js error.

## Step 5 — Hand off

Tell the operator:

```
Atrium dev server running at http://localhost:3000
  - Browse catalog:       http://localhost:3000/
  - Admin dashboard:      http://localhost:3000/admin
  - Suggestions forum:    http://localhost:3000/suggestions
  - OpenAPI spec:         http://localhost:3000/api/v1/openapi.json
  - Dev log:              tail -f /tmp/atrium-dev.log

Stop the server with: pkill -f 'next dev'
```

Optionally offer to run the `atrium-add-provider` skill so AI curation works locally (they'd need an LLM API key or a local Ollama install).

## Common failures

| Symptom | Fix |
|---|---|
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| `AUTH_SECRET must be set to a 32+ character string` | Step 2 wrote a malformed line; run `openssl rand -hex 32` and replace the value in `.env.local` |
| Build fails with `Cannot find module '@prisma/client'` | Forgot `prisma generate`; re-run step 3 |
| `/api/health` returns `db.status == "down"` | SQLite file wasn't created; re-run `pnpm exec prisma db push` |
| Port 3000 already in use | `lsof -ti:3000 \| xargs kill` or change `PORT` env var |
