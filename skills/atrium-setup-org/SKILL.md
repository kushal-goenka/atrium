---
name: atrium-setup-org
description: Interactively provision an Atrium deployment for an organization. Walks the operator through org name, hosting, auth, database, LLM provider, air-gap, and initial federated sources, then executes each step with verification.
trigger: when the user asks to set up Atrium for their org, provision Atrium, deploy Atrium, or install Atrium for a company
---

# Interactive Atrium org setup

You are walking an operator through provisioning Atrium for their organization. Your job is to collect inputs, confirm the plan, execute, and verify.

**Do not** run any destructive command (deploy, write secrets, push schema) until you've confirmed the complete plan back to the operator and gotten explicit approval. **Do** stop immediately on any verification failure and surface the exact error.

---

## Phase 1 — Gather inputs

Ask one at a time. Confirm each answer in your own words before moving on. Skip optional questions when the operator says "skip" or "default".

### 1.1 Organization

1. "What's the organization name?" — non-empty string. Store as `org.name`.
2. "Short name for the nav (≤ 24 chars)?" — optional, defaults to `org.name`.
3. "What URL will developers use to reach Atrium? (e.g. `https://atrium.acme.corp`)" — must be `https://` except for `localhost`. Store as `org.publicUrl`.
4. "Organization homepage URL?" — optional.
5. "Support contact email?" — optional, shown on the request-a-plugin flow.

### 1.2 Hosting target

Pick one. If the operator is unsure, recommend **Fly.io** as the fastest path.

- `fly` — Fly.io (managed Postgres, Docker-native, nightly-reset-friendly)
- `railway` — Railway (free tier, GitHub push-to-deploy)
- `vercel` — Vercel + Neon Postgres (fastest global edge)
- `self-host` — Docker Compose on a VPS / on-prem

If `fly` or `railway`, also collect `hosting.region`.

### 1.3 Database

- "Postgres or SQLite?" — default to Postgres for any non-trial deployment. Warn explicitly if the operator picks SQLite for a production URL: SQLite is single-file, no concurrent writers, no backups unless configured; fine for a demo, not for prod.

### 1.4 Auth mode

Offer these in order:

- `open` (default) — no login at all. Best if Atrium is already behind an SSO proxy, corporate VPN, or private network.
- `admin-password` — a shared password gates `/admin/*`. Browse, `/mkt`, `/api/v1`, and `/api/health` stay public. Good for small teams.
- `sso` — **not yet implemented**. If the operator asks for SSO, explain that it's in v0.2 (OIDC + SAML via NextAuth) and recommend `admin-password` as the bridge.

If `admin-password`: ask for a password, require ≥ 12 characters, suggest `openssl rand -base64 24` if they don't have one ready. Store in a secret manager (1Password / Vault / platform secrets) — **never** echo it back in plain text beyond the one-time setup confirmation.

Also generate an `AUTH_SECRET` via `openssl rand -hex 32`. This signs the session cookie. Store separately.

### 1.5 LLM provider (optional but strongly recommended)

Ask: "Do you want AI curation features? This requires an LLM API key."

Options:

- `anthropic` / `openai` / `gemini` — collect API key, confirm model (defaults: `claude-sonnet-4-6` / `gpt-4o-mini` / `gemini-2.5-flash`)
- `azure-openai` — collect API key + base URL like `https://{name}.openai.azure.com/openai/deployments/{id}`
- `litellm-proxy` — collect base URL of the proxy + API key it expects
- `ollama` — **local, no key needed**. Recommend `gemma3:4b` (3GB, fits on most machines). Confirm the operator wants the Ollama sidecar running alongside Atrium.
- `none` — skip; AI curation features will be disabled until an admin adds a provider via `/admin/providers`.

### 1.6 Air-gap posture

- `open` (default) — outbound fetches unrestricted.
- `allowlist` — only hosts in `ATRIUM_ALLOWED_HOSTS` are reachable. Ask for the comma-separated host list.
- `strict` — no outbound at all. Warn: this requires all federated sources to be pre-registered internal URLs; external ingest is impossible.

### 1.7 Initial federated sources

Ask: "Any internal git repos or marketplaces you want Atrium to ingest from?"

For each, collect: `name`, `kind` (git / http / local), `url`, `trust` (official / verified / community / internal). The operator can skip this step — they can add sources later via `/admin/sources/new` or `POST /api/v1/sources`.

The built-in `official-reference`, `openai-store`, `community-curated`, and `acme-internal` sources are already seeded; don't duplicate those keys.

---

## Phase 2 — Confirm the plan

Before running anything, produce a summary table and ask: "Does this look right?"

```
Org:              <org.name> at <org.publicUrl>
Hosting:          <hosting.target> (<hosting.region>)
Database:         <db.kind>
Auth:             <auth.mode>   [admin password / OIDC: …]
LLM provider:     <llm.provider>   [model: <llm.defaultModel>]
Air-gap:          <airgap.mode>   [allow-list: <hosts>]
Federated sources: N custom + 4 built-in
Secrets to store: AUTH_SECRET, ATRIUM_ADMIN_PASSWORD, LLM_API_KEY
```

If the operator says "yes" or equivalent, proceed. If not, iterate.

---

## Phase 3 — Execute

Follow [`docs/AGENT-SETUP.md`](../../docs/AGENT-SETUP.md) sections 1–9 exactly. Each step has a verification check; do not move forward on any step that didn't pass its check.

In summary the execution is:

1. `git clone` + `pnpm install`
2. Generate `.env.local` from the inputs (respect all validation rules in AGENT-SETUP.md § 2)
3. `pnpm exec prisma db push && pnpm db:seed`
4. Seed LLM provider (if any) via the one-liner TSX script in AGENT-SETUP.md § 4
5. Seed custom sources (if any)
6. `pnpm build`
7. Deploy to the chosen target (§ 7a / 7b / 7c / 7d)
8. Post-deploy verification (§ 8) — **must pass all four curls**
9. Issue bootstrap admin API token (§ 9) — hand the plaintext to the operator's secret manager, confirm receipt, then move on

At any failure: stop, surface the exact error and the failing step number, offer the remediation from AGENT-SETUP.md's "Failure modes" table if one matches.

---

## Phase 4 — Handoff

Produce the final summary in this exact format:

```
Atrium deployed at:       <org.publicUrl>
Auth mode:                <auth.mode>
Database:                 <db.kind>
LLM provider:             <llm.provider or "none">
Air-gap mode:             <airgap.mode>
Health endpoint:          <org.publicUrl>/api/health
OpenAPI spec:             <org.publicUrl>/api/v1/openapi.json
Admin entrypoint:         <org.publicUrl>/admin
Bootstrap API token:      (delivered to <secret-manager>)

Next step for users:
  /plugin marketplace add <org.publicUrl>     (inside Claude Code)
  claude plugin marketplace add <org.publicUrl>   (CLI)
```

Tell the operator where to look for the Suggestions forum (`/suggestions`) and where engineers can upload their own skills (`/users/[id]/upload`).

Do not commit the generated `.env.local` or any file containing the bootstrap token.

---

## What to skip / not do

- Don't configure DNS, TLS certs, or the load balancer — that's the operator at their registrar.
- Don't seed fake user rows. Real identity requires SSO (v0.2); until then the mock `MOCK_USERS` in `lib/users.ts` is the demo identity.
- Don't enable `ATRIUM_AUTH_MODE=sso` — it's not implemented yet. If the operator insists, direct them to issue [#3](https://github.com/kushal-goenka/atrium/issues/3) and use `admin-password` in the meantime.
- Don't touch any existing customer data. This skill is for new deployments only.
