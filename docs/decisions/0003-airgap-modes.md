# ADR-0003 — Air-gap is three modes, not a boolean

**Status**: Accepted
**Date**: 2026-04-18

## Context

Regulated orgs (finance, health, defense-adjacent) want atrium to make zero outbound network calls to hosts they haven't vetted. The naive approach is a boolean — `ATRIUM_ALLOW_EXTERNAL_FETCH=false` — which either blocks everything (making ingest impossible) or is too permissive. Real security postures have a middle ground: "outbound only to these hosts".

## Decision

Atrium has three air-gap modes via `ATRIUM_AIRGAP`:

- `open` (default) — unrestricted outbound.
- `allowlist` — outbound only to hosts in `ATRIUM_ALLOWED_HOSTS` (exact match or subdomain).
- `strict` — no outbound at all; ingest must use pre-registered local sources.

Ingest adapters (`lib/ingest/http.ts`, `lib/ingest/git.ts`) call `assertOutboundAllowed(url)` before opening a connection. The legacy `ATRIUM_ALLOW_EXTERNAL_FETCH=false` maps to `strict` for back-compat.

## Consequences

- Positive: the middle ground ("we trust GitHub and our internal GitLab, nothing else") is expressible and common.
- Positive: adding a new ingest adapter is trivially gated — just call `assertOutboundAllowed` first.
- Positive: the admin dashboard shows the current mode with a human summary; operators aren't guessing.
- Negative: we now have three configurations to test instead of two. Test matrix is wider.
- Follow-up: v0.2 signed artifact serving needs to operate inside `strict` mode — tarballs served from local storage only.

## Alternatives considered

- **Boolean.** Rejected above — forces the user to choose between "insecure" and "unusable".
- **Per-source `allowExternalFetch` flag.** Rejected: makes the security posture ambient (is this source allowed to fetch? depends on the source row). Global env-var posture is easier to audit.
- **Proxy-based egress control (Squid, etc.).** Rejected as out-of-scope for the app — operators who want that can still deploy it at the network layer; this ADR is about what the app itself enforces.
