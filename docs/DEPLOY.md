# Deploying Atrium

This guide covers everything from a zero-config dev spin-up to a hardened
production deployment with SSO and telemetry.

If you're new to Atrium, [`README.md`](../README.md) has the 5-minute
quickstart. Read this when you're about to put Atrium behind a company
firewall.

---

## Deployment shapes

Atrium is a single Next.js app with one database. There are three supported
shapes, from least to most production:

1. **Dev** — `pnpm dev` + SQLite. One machine, fast iteration.
2. **Self-host (single container)** — `docker compose up -d`. One VM, SQLite
   or Postgres. Fine for teams up to ~500 people.
3. **Production (Kubernetes-ready container)** — the same Docker image, a
   managed Postgres (RDS/Cloud SQL/Neon), an OTLP collector, SSO in front,
   TLS-terminating load balancer.

The code path is the same in all three. The database changes; that's it.

---

## Dev

See the [quickstart](../README.md#quickstart-dev). The SQLite database at
`prisma/dev.db` is seeded by `pnpm db:seed` with 4 roles and the 3 built-in
federated sources. Additional sources added via the UI go into that same
database.

### Dev env file

Copy `.env.example` to `.env.local` and edit. In dev you typically only need:

```bash
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="any-string-at-least-32-characters"
ATRIUM_ORG_NAME="Your Team"
```

---

## Self-host (docker compose)

### Step 1: configuration

```bash
cp .env.example .env
# edit .env — at minimum: AUTH_SECRET, ATRIUM_ORG_NAME
```

The compose file reads `.env` (note: no `.local` suffix). It also reads
`POSTGRES_PASSWORD` from the environment — set it in `.env` or export
before running.

### Step 2: bring it up

```bash
docker compose up -d
docker compose exec atrium pnpm db:push
docker compose exec atrium pnpm db:seed
```

Open `http://<host>:3000`.

### Step 3: put it behind a reverse proxy

Never expose Atrium directly on port 80/443. Put it behind something that
terminates TLS. A minimum Caddyfile:

```caddy
atrium.yourcompany.com {
    reverse_proxy localhost:3000
    encode gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}
```

Or nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name atrium.yourcompany.com;
    ssl_certificate /etc/letsencrypt/live/atrium.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atrium.yourcompany.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Once TLS is live, set `ATRIUM_PUBLIC_URL=https://atrium.yourcompany.com`
in `.env` and restart.

---

## Production (Kubernetes-grade)

### Database

Use a managed Postgres. The schema is small; any tier with 1 vCPU and 2 GB
RAM is enough for a 1000-engineer org. Set `DATABASE_URL` to the connection
string; Prisma handles the pool.

Run migrations as a one-shot Job (not in the app startup):

```yaml
# migrate-job.yaml — runs on every release
apiVersion: batch/v1
kind: Job
metadata:
  name: atrium-migrate
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ghcr.io/your-org/atrium:v0.1.0-alpha
          command: ["pnpm", "exec", "prisma", "db", "push"]
          env:
            - name: DATABASE_URL
              valueFrom: { secretKeyRef: { name: atrium, key: database-url } }
```

### App deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atrium
spec:
  replicas: 2
  selector:
    matchLabels: { app: atrium }
  template:
    metadata:
      labels: { app: atrium }
    spec:
      containers:
        - name: atrium
          image: ghcr.io/your-org/atrium:v0.1.0-alpha
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom: { secretKeyRef: { name: atrium, key: database-url } }
            - name: AUTH_SECRET
              valueFrom: { secretKeyRef: { name: atrium, key: auth-secret } }
            - name: ATRIUM_PUBLIC_URL
              value: "https://atrium.yourcompany.com"
            - name: ATRIUM_ORG_NAME
              value: "Your Company"
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://otel-collector:4318"
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits: { cpu: 500m, memory: 512Mi }
          readinessProbe:
            httpGet: { path: "/api/health", port: 3000 }
            periodSeconds: 10
```

Two replicas is enough for HA; Atrium is horizontally scalable (stateless
web tier, database is the single source of truth).

---

## SSO (OIDC / SAML)

**M1 ships with magic-link email auth only.** OIDC and SAML land in M2 (see
`ROADMAP.md`). Until then, use `ATRIUM_ADMIN_EMAILS` to bootstrap admins
by their email address and invite others via link.

When OIDC lands, configuration will look like:

```bash
AUTH_OIDC_ISSUER=https://your-idp.okta.com
AUTH_OIDC_CLIENT_ID=...
AUTH_OIDC_CLIENT_SECRET=...
```

and the magic-link flow will be disabled.

---

## LLM providers (AI curation)

Atrium's AI curation engine needs at least one LLM provider configured under
Admin → LLM providers. You have three deployment shapes:

1. **Hosted provider(s)** — Anthropic / OpenAI / Gemini API keys directly. Simplest.
   Keys are AES-256-GCM encrypted at rest using a value derived from
   `AUTH_SECRET`.

2. **LiteLLM proxy** — if you already route LLM traffic through a centralized
   LiteLLM deployment, register provider = `litellm-proxy`, `baseUrl = https://litellm.yourcompany.com`,
   and your LiteLLM API key. Atrium speaks the OpenAI-compatible schema it expects.

3. **Local-only (Ollama)** — for orgs that forbid plugin metadata from leaving
   the cluster. Run Ollama as a sidecar (the compose profile is ready):

   ```bash
   docker compose --profile ollama up -d
   docker compose exec ollama ollama pull gemma3:4b   # or gemma3:1b for <2GB
   ```

   Register provider = `ollama`, `baseUrl = http://ollama:11434/v1`,
   `defaultModel = gemma3:4b`. The API-key field is disabled for local providers.

All three shapes can coexist — Atrium uses the most-recently-updated enabled
provider by default, and callers can request a specific provider via
`preferredProvider` in `lib/ai/client.ts`.

## Observability (OpenTelemetry)

Atrium exports OTLP traces when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. It
talks the standard protocol, so any collector works: OpenTelemetry
Collector, Grafana Tempo, Honeycomb, Datadog, New Relic, Jaeger.

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=atrium
```

See `docker-compose.yml` for a sample collector sidecar. A pre-built Grafana
dashboard JSON lands in M3.

---

## Branding (per-deployment)

Atrium is white-labelable via environment variables. None of them touch
code or require a rebuild.

| Variable | Example | Purpose |
|---|---|---|
| `ATRIUM_ORG_NAME` | `Acme Corp` | Long-form org name shown in the browse header |
| `ATRIUM_ORG_SHORT_NAME` | `Acme` | Short name in the top nav |
| `ATRIUM_ORG_URL` | `https://acme.corp` | Homepage (optional link target) |
| `ATRIUM_ORG_LOGO_URL` | `/brand/acme.svg` | SVG/PNG to render next to the Atrium mark |
| `ATRIUM_ACCENT_HEX` | `#0066CC` | Overrides the default terracotta accent |
| `ATRIUM_SUPPORT_EMAIL` | `platform@acme.corp` | Shown to devs requesting a plugin |
| `ATRIUM_PROPOSAL_URL` | `https://github.com/acme/atrium-requests/issues/new` | Plugin-proposal link |

To host your own logo, drop the file in `public/brand/` and point
`ATRIUM_ORG_LOGO_URL` at `/brand/your-file.svg`.

---

## Backups

Atrium's state is entirely in Postgres (or SQLite in dev). The threat model
is "lose the DB, lose the audit log."

**SQLite**:

```bash
sqlite3 prisma/dev.db ".backup '/backups/atrium-$(date +%Y%m%d).db'"
```

Run daily via cron. Retain 30 days.

**Postgres**: use your provider's native backup (RDS automated backups, Neon
point-in-time, etc.). Retain at minimum enough history to investigate
security incidents — 90 days is a reasonable floor for most organizations.

---

## Hardening checklist

Before a production cutover, complete the checklist in
[`SECURITY.md`](../SECURITY.md#hardening-checklist-for-operators).
Highlights:

- [ ] TLS-terminating reverse proxy in front of Atrium
- [ ] OIDC or SAML (not magic links) — *coming in v0.2*
- [ ] `ATRIUM_ADMIN_EMAILS` set to bootstrap admins
- [ ] `ATRIUM_FOUR_EYES=true` for destructive admin actions
- [ ] `ATRIUM_CVE_POLL=true`
- [ ] OTEL export configured
- [ ] `ATRIUM_PUBLIC_CATALOG=false` if the catalog should require auth
- [ ] Postgres backups verified (restore test run once)
- [ ] Quarantine walkthrough for the first federated source

---

## Upgrades

Atrium is versioned with SemVer. Alpha releases (`0.x`) may include breaking
changes at minor-version bumps; production deployments pin to a patch.

The upgrade procedure is always:

1. Read the [CHANGELOG](../CHANGELOG.md) for the target version.
2. Take a Postgres snapshot.
3. Deploy the migrate Job (`pnpm exec prisma db push`).
4. Deploy the new app image.
5. Verify `/api/health` returns 200 and `/mkt/marketplace.json` renders.
6. Re-run scanners if the release notes call for it.

Breaking changes are called out in the CHANGELOG with the label
`BREAKING:` and a migration note.

---

## Common gotchas

- **SQLite in Docker** — SQLite wants a writable volume mount at
  `/app/prisma`. Compose handles this; plain `docker run` does not.
- **Behind a proxy with a non-root base path** — set `basePath` in
  `next.config.ts` and `ATRIUM_PUBLIC_URL` accordingly. Tested for `/`
  only in the alpha.
- **`output: "standalone"` + `next start`** — these warn on each other; use
  `node .next/standalone/server.js` for the standalone output, or drop
  `output: "standalone"` if you're running with `next start`. The provided
  Dockerfile uses the standalone server.
