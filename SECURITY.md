# Security

Atrium distributes code that runs on developers' machines. We take that seriously. This document describes our threat model, supply-chain posture, and disclosure process.

## Threat model

We enumerate threats in the order an attacker would encounter them.

### T1. Malicious plugin uploaded to a federated source

A plugin with a shell hook that exfiltrates `~/.ssh/id_rsa` is published to a public marketplace atrium federates from.

**Mitigations**:
- Every federated source starts in **quarantine**: new plugins are not visible to users until an admin promotes them.
- Scanners run on every ingest and flag: hooks that execute shell, MCP servers that reach unknown network endpoints, commands that reference secrets paths (`.ssh`, `.aws`, `.npmrc`, env files), unpinned dependencies in `package.json` / `requirements.txt`.
- An allow-list per source can restrict which plugins from that source are ingested at all.

### T2. Supply-chain attack on atrium itself

An attacker compromises a atrium dependency (npm package, Docker base image) and ships malicious code.

**Mitigations**:
- **SBOM** published with every release (CycloneDX format).
- **Reproducible builds** — Docker builds pinned to content-addressed base images, `pnpm` lockfile with integrity hashes.
- **Signed releases** via Sigstore. Container images signed with cosign and published with attestations.
- **Minimal dependencies.** Every new dependency requires a PR justification.
- GitHub branch protection: signed commits, required reviews, required CI.

### T3. Policy bypass by authenticated user

A developer with `viewer` role tries to directly fetch a plugin they shouldn't see via `/mkt/plugins/secret-plugin/1.0.tar.gz`.

**Mitigations**:
- **Policy is evaluated server-side on every request** — never trusted from the client.
- All plugin artifact routes require an authenticated session *and* pass the requested plugin through the same policy engine as the catalog endpoint.
- Integration test: for each role, attempt direct-URL access to every plugin and assert 403 when policy says so.

### T4. Token theft / session hijack

An attacker steals a dev's atrium session cookie or API token.

**Mitigations**:
- Sessions are `HttpOnly; Secure; SameSite=Lax`.
- API tokens are hashed at rest (SHA-256) and displayed to the user exactly once on creation.
- Short default session lifetime (24h) with optional "remember me" extending to 30 days.
- All sessions bound to the origin they were created from — no cross-site re-use.
- Audit log entry on every token creation, rotation, and revocation.

### T5. Authenticated admin doing something stupid

An admin accidentally approves a malicious plugin, or widens a policy they shouldn't have.

**Mitigations**:
- **Four-eyes mode** (optional, off by default): destructive actions require a second admin's approval before taking effect.
- **Dry-run policies**: changes to policy can be staged and shown as a diff ("this change would remove access to 3 plugins for 47 users") before applying.
- **Immutable audit log**: no endpoint can delete or mutate audit rows. Retention is configurable (default: forever).

### T6. Plugin distributed through atrium is later found vulnerable

CVE published against `awesome-plugin@1.2.0`.

**Mitigations**:
- Atrium polls CVE feeds (OSV.dev) against every plugin's declared dependencies.
- Affected plugin versions auto-transition to `revoked`. Next marketplace.json pull omits them.
- Notification fans out to every user who has installed the affected version (via configured notifier: email, Slack, webhook).
- An "incident" record groups the CVE, affected users, and resolution for the audit log.

### T7. Denial of service

Attacker hammers the ingest or marketplace endpoints to exhaust resources.

**Mitigations**:
- Rate limits on every public endpoint (default: 60 req/min per IP, configurable).
- Ingest jobs respect `fetched_at + min_interval` — a source can be force-refreshed but not more than every 60s.
- Artifact downloads are streamed, not buffered. Memory bounded regardless of archive size.

## Secrets & credentials

- Atrium never stores plugin *secrets* — plugins that need secrets at runtime declare them in their MCP/hook config and users are prompted by Claude Code at install time. Nothing sensitive in the database.
- Atrium's own secrets (DB password, OIDC client secret, SMTP creds, etc.) are read from env vars. We never log them. `.env.example` documents every variable; `.env*` is gitignored.
- Secret rotation is a documented runbook in `docs/RUNBOOKS/rotate-secrets.md`.

## RBAC

Four built-in roles, configurable per-org:

| Role | Can browse | Can install | Can approve plugins | Can manage sources | Can manage users |
|---|---|---|---|---|---|
| `viewer` | approved only | no | no | no | no |
| `installer` | approved only | yes | no | no | no |
| `curator` | all including quarantine | yes | yes | limited (can add; can't delete) | no |
| `admin` | all | yes | yes | yes | yes |

Custom roles supported. Role assignments themselves logged in the audit log.

## Disclosure policy

Found a vulnerability? Please email `security@atrium.dev` (placeholder) with:
- A description
- Reproduction steps
- Your contact info
- Whether you want public credit

We aim to acknowledge within 48 hours and publish a fix within 30 days for high-severity issues. We run a bug-bounty program via HackerOne once the project reaches M2 (see ROADMAP.md).

## Hardening checklist for operators

When deploying atrium at your company, complete this checklist:

- [ ] Put atrium behind a TLS-terminating reverse proxy
- [ ] Configure OIDC or SAML (don't rely on email magic link in prod)
- [ ] Set `ATRIUM_ADMIN_EMAILS` to bootstrap your first admins
- [ ] Turn on four-eyes mode (`ATRIUM_FOUR_EYES=true`)
- [ ] Configure OTEL export to your observability backend
- [ ] Set `ATRIUM_PUBLIC_CATALOG=false` if the catalog should require auth
- [ ] Enable CVE polling (`ATRIUM_CVE_POLL=true`)
- [ ] Set backup policy for Postgres
- [ ] Run the quarantine walkthrough (`docs/RUNBOOKS/first-federated-source.md`)

## Build integrity

Every atrium release ships with:
- Source tarball (signed)
- Docker image (signed with cosign, attested build provenance)
- SBOM (CycloneDX)
- Changelog
- Checksums

Verify a release:

```bash
cosign verify --certificate-identity-regexp='https://github.com/your-org/atrium/.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  ghcr.io/your-org/atrium:v0.1.0
```
