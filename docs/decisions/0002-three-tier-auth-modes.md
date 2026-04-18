# ADR-0002 — Three-tier auth modes

**Status**: Accepted
**Date**: 2026-04-18

## Context

Atrium targets two usage shapes: "already behind company SSO / VPN" and "public-ish demo or small team that just wants a password on /admin". Forcing every operator into a full OIDC setup kills the "clone and run in 5 minutes" quickstart. But shipping only a password-on-admin story leaves enterprises needing per-user identity to bolt their own auth on top.

## Decision

Atrium has exactly three auth modes, selected by `ATRIUM_AUTH_MODE`:

- `open` (default) — no login. Relies on the network perimeter / outer auth proxy.
- `admin-password` — shared password gates `/admin/*`. Browse, `/mkt`, `/api/v1`, `/api/health` stay open. HMAC-signed cookie, no user rows required.
- `sso` — per-user identity via OIDC/SAML. Real `User` rows, role enforcement. (Planned for v0.2.)

Auth mode is orthogonal to the "acting as" user switcher, which is always present for demo/impersonation and has no security implications.

## Consequences

- Positive: trivial quickstart. `pnpm dev` and everything works, no login dialogs.
- Positive: small teams get a single-env-var password gate without dragging in NextAuth.
- Positive: `admin-password` is cryptographically sound (constant-time compare, HMAC session) — not a trivial string check.
- Negative: `admin-password` has a shared-password attack surface. Not a substitute for SSO. Rotation requires a restart.
- Follow-up: `sso` mode lands in v0.2 and deprecates the acting-as switcher in prod (still used in dev).

## Alternatives considered

- **Boolean `ATRIUM_AUTH_ENABLED`.** Rejected: a boolean can't distinguish "password" from "SSO"; we'd end up bolting a second env var on top anyway.
- **Only full SSO.** Rejected: makes the demo story terrible and excludes small-team deploys.
- **Admin-password via DB-stored bcrypt user rows.** Rejected as overkill for v0.1 — env-var password + HMAC cookie is one-screen of code and does the job. v0.2 SSO replaces it wholesale.
