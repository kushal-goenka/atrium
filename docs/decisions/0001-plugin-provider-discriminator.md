# ADR-0001 — Plugin provider discriminator

**Status**: Accepted
**Date**: 2026-04-18

## Context

Atrium started as a Claude-Code-only registry. The product pivoted to cover OpenAI GPTs/Assistants, Gemini extensions, MCP-only servers, and generic agent frameworks. Each has its own manifest shape: Claude has `commands/agents/skills/hooks/mcpServers`, OpenAI has actions with OpenAPI schemas, Gemini has extensions with triggers.

The design question: one polymorphic `Plugin` type, or separate types per provider?

## Decision

Atrium uses a single `Plugin` type with a `provider` discriminator field (`claude-code` | `openai` | `gemini` | `mcp` | `generic`). Provider-specific fragments (`commands`, `actions`, `extensions`) live on the same object; only the fragments relevant to that provider are populated.

## Consequences

- Positive: the UI renders one `Plugin` shape. Filters, catalogs, browse components don't branch by provider. Adding a new provider is one field on the type plus an optional fragment.
- Positive: the `/api/v1/plugins` payload is uniform — consumers don't need per-provider branching.
- Negative: `Plugin` accumulates optional fields as we add providers. Size grows; JSON-shape invariants weaken.
- Follow-up: when a sixth provider arrives, reconsider whether to split to per-provider types.

## Alternatives considered

- **Separate types per provider, union type on the Plugin variable.** Rejected: would force every catalog component into a switch statement, and the common fields (name, description, version, author, category, keywords, usage) dominate the shape anyway.
- **Base `Plugin` + provider-specific subclasses.** Rejected: Prisma + TS structural typing make inheritance awkward; the discriminator pattern is idiomatic for TypeScript and trivial to serialize.
