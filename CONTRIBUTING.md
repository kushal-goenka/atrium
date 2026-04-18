# Contributing

We would love your help. Atrium is Apache 2.0 and every PR from every contributor gets read.

## Setting up

```bash
git clone https://github.com/your-org/atrium
cd atrium
cp .env.example .env.local
pnpm install
pnpm db:push
pnpm dev
```

The dev server runs on http://localhost:3000. A seed catalog with ~10 sample plugins loads automatically.

## Before you send a PR

- **Scope**: one focused change. If you find yourself refactoring three subsystems, split it.
- **Tests**: every behavior change has a test. Bug fixes get a regression test that fails without the fix.
- **Lint + types**: `pnpm check` must pass.
- **Docs**: if you add a config var, update `.env.example` and `docs/DEPLOY.md`.

Small PRs land fast. Big PRs want an issue first to discuss scope.

## What we'd love help with

The `good-first-issue` label is curated. Beyond those:

- **Source adapters**: add Artifactory, Nexus, S3, or any other backend to `lib/sources/`.
- **Scanners**: new static checks for `lib/scanners/`. Security-focused scanners especially welcome.
- **Auth providers**: extra OIDC/SAML backends tested against a real IdP.
- **Translations**: the UI is English-only in v1. We'd like at least Spanish, Mandarin, and German by M2.
- **Runbooks**: `docs/RUNBOOKS/` — real operational scenarios you've hit.

## What we will not merge

- Features that require us to execute plugin code server-side.
- Large new dependencies without a PR-level justification.
- Code that can only run on a proprietary cloud (Vercel-specific, AWS-specific, etc.) without a portable fallback.
- UI that breaks without JavaScript for non-interactive pages (SSR is non-negotiable for `/` and `/plugins/*`).

## Code style

- Prettier + ESLint enforced via `pnpm check`. Do not override.
- TypeScript strict mode is on. No `any` without a comment explaining why.
- Server Components by default. Client Components only where you truly need state or effects.
- Prefer function composition over class hierarchies.
- One exported thing per file when practical.

## Security-sensitive changes

If your PR touches auth, policy, ingestion, or serving artifacts, tag it with the `security` label. We require two reviewers for these PRs and run the security-review checklist before merging.

To report a vulnerability privately, see [`SECURITY.md`](SECURITY.md).

## Governance

For now: benevolent-maintainer model. Decisions are public in GitHub Discussions. Once we have 5+ regular contributors we'll formalize a steering committee with documented voting rules.

## Code of conduct

Be kind. Disagree on the substance, not the person. Don't be surprised when we enforce this.

Full text: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — based on Contributor Covenant 2.1.
