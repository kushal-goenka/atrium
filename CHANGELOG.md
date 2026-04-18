# Changelog

All notable changes to Atrium are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial public browse UI (search, category filter, source filter, trust-tier badges)
- Plugin detail page with full manifest (commands, subagents, skills, hooks, MCP servers), install snippet, sticky sidebar for usage/provenance, security signals panel, version history
- Admin dashboard with stats, approvals queue, federated sources list, immutable audit log, high-severity signals panel
- `/sources` federation view
- `/admin/sources/new` with server-side validation and Prisma persistence
- `/admin/users` placeholder with role table
- Org theming via `ATRIUM_ORG_*` environment variables (name, logo URL, homepage, proposal URL, support email, accent hex)
- Claude Code-compatible plugin and marketplace type definitions
- Prisma schema covering sources, plugins, versions, installs, policies, security signals, usage, audit log, users, roles, tokens
- Dockerfile (multi-stage, non-root) and docker-compose (app + postgres + optional OTEL collector)
- Threat model and supply-chain posture in `SECURITY.md`
- CI via GitHub Actions (typecheck + build)

## [0.1.0-alpha] — 2026-04-17

First public alpha. Not production-ready; see `ROADMAP.md` for milestones M1–M5.

[Unreleased]: https://github.com/kushal-goenka/atrium/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/kushal-goenka/atrium/releases/tag/v0.1.0-alpha
