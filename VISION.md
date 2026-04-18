# Vision

## The problem

In November 2025 Anthropic shipped the plugin marketplace primitive for Claude Code. Plugins bundle slash commands, subagents, hooks, MCP servers, and skills into a single installable unit. A marketplace is a `.claude-plugin/marketplace.json` manifest, typically hosted in a git repo.

This is an excellent primitive. It is also **incomplete for enterprises**:

- **No private control plane.** If your company writes internal plugins (wrapped around proprietary APIs, billing systems, sensitive knowledge bases), the only way to distribute them today is "publish a git repo and ask devs to add it by URL." No approval flow, no usage metrics, no revocation.
- **No federation policy.** Devs can add any public marketplace from any URL. Security and platform teams have no central choke point for allow-listing, version pinning, or CVE gating.
- **No observability.** Nobody can answer "which plugins does my org use, who installed them, how often, and what are they failing on." Plugins are black boxes after install.
- **No UX for discovery.** The current browse experience is a text list inside a CLI. For an org with 50+ plugins across 10+ sources, this does not scale.

Every large Anthropic customer we've talked to is solving this privately with a shell script and a wiki page. That is the LiteLLM moment.

## Who this is for

Primary: **platform engineers at companies with 100+ Claude Code users** who need a managed plugin story.

Secondary:
- **Open source maintainers** who want a nicer browse/discovery experience than a GitHub README.
- **Agent platforms** (internal and external) that want to ship a plugin marketplace without building one from scratch.
- **Individual power users** who want a personal dashboard of their own plugins.

## What atrium is

A self-hostable web application that:

1. **Ingests** plugin marketplace manifests (Anthropic's format, unchanged) from git repos, URLs, uploaded tarballs, or federated peer atriums.
2. **Renders** a beautiful browse/search UI over the aggregated catalog with full plugin detail, version history, install snippets, and security metadata.
3. **Governs** what's visible to which users via RBAC, approval workflows, and allow-lists.
4. **Observes** install events, command invocations, and skill uses via OpenTelemetry.
5. **Integrates** with Claude Code natively — `atrium` looks like an ordinary marketplace from Claude's POV.

## What atrium is not

- **Not a new plugin format.** We speak Anthropic's format verbatim. If they change it, we follow.
- **Not a replacement for the public Claude marketplace.** We federate from it by default.
- **Not an agent runtime.** Atrium serves manifests and artifacts; Claude Code runs the plugins. No code execution on our servers.
- **Not a social layer.** No stars, comments, or user-generated reviews in v1. Those are nice-to-haves; enterprise trust is the job.
- **Not Anthropic-only, long-term.** The architecture is designed so OpenAI, Gemini, or any agent framework that ships a plugin concept can be plugged in as a second format. But Claude Code is the wedge.

## Why "atrium"

Eric Raymond's 1999 essay *The Cathedral and the Atrium* framed the two ways software gets made: tightly controlled from the top (cathedral) or from a loud, open marketplace of contributors (atrium). Anthropic's reference marketplace is one cathedral. Atrium is the open square where every company's cathedral can be visited, catalogued, and governed.

The word also lands in the marketplace semantic field without the baggage of "store" (monetization) or "hub" (overloaded).

## Product principles

1. **Don't invent new formats.** Every manifest we read and every URL we expose should be a superset of what Anthropic already defined.
2. **Nothing important is client-side.** Auth, policy, audit log, metrics — all server-authoritative. The UI is a rendering.
3. **One binary, one database.** No Kubernetes. No 12 sidecars. A platform team should be able to run atrium on a $20 VM for a 500-person company.
4. **Safe by default.** New federated sources are sandboxed until an admin approves. New plugins are hidden until scanned. Installing is one click; approving is deliberate.
5. **Boring stack, obvious code.** Next.js + Postgres + Prisma. No exotic libraries. Engineers should be able to read and patch atrium in an afternoon.

## Competitive landscape

| Product | What they do | How atrium differs |
|---|---|---|
| Anthropic's reference marketplace | The canonical public directory | We federate from it; we add governance on top |
| Private git repos as marketplaces | DIY approach most companies use today | We give them a UI, metrics, RBAC, federation |
| OpenAI's GPT Store / Custom GPTs | Closed, proprietary, OpenAI-hosted | We're open-source, self-hostable, vendor-neutral |
| Internal developer portals (Backstage, etc.) | General-purpose dev catalogs | We're purpose-built for AI agent plugins |
| LiteLLM | Proxy/gateway for LLM providers | Same posture (thin neutral layer) applied to plugins instead of model calls |

## Success metrics

- **M1**: A platform engineer at any company can go from `git clone` to a working atrium instance with SSO in under 30 minutes.
- **M2**: 10+ organizations running atrium in production.
- **M3**: Atrium-format federation is adopted by at least one other agent framework (OpenAI or similar).
- **M4**: Anthropic links to atrium from their docs as a recommended enterprise option.

## Non-goals for v1

- Plugin authoring UI (use your editor)
- Billing / paid plugins
- AI-generated plugin discovery
- Mobile app
- Self-service tenant provisioning (multi-tenant SaaS comes later if there's demand)
