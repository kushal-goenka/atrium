---
name: atrium-add-provider
description: Interactively add an LLM provider to a running Atrium instance. Works with Anthropic, OpenAI, Azure OpenAI, Gemini, LiteLLM proxies, Ollama (local), or any OpenAI-schema custom endpoint.
trigger: when the user asks to add an LLM provider, configure AI curation, set up an Anthropic key, or wire up Ollama for Atrium
---

# Add an LLM provider to Atrium

Atrium's AI curation and any future LLM-backed feature reads from the `ProviderConfig` Prisma table. Keys are encrypted at rest (AES-256-GCM, key derived from `AUTH_SECRET`). This skill walks the operator through picking a provider, collecting credentials, testing connectivity, and persisting the config.

## Phase 1 — Pick the provider

Ask: "Which LLM provider do you want to add?" Present the list with a one-line explanation of when to pick each:

| Option | When to pick |
|---|---|
| `anthropic` | You have a Claude API key |
| `openai` | You have an OpenAI API key |
| `azure-openai` | Enterprise Azure OpenAI deployment |
| `gemini` | Google Gemini API key |
| `litellm-proxy` | You already route LLM traffic through a central LiteLLM proxy |
| `ollama` | You want local-only inference, no API keys leave the network |
| `custom` | Any other OpenAI-schema-compatible endpoint |

If the operator is hesitant about sending plugin metadata to a third party, recommend `ollama` and walk through the Docker sidecar option below.

## Phase 2 — Collect credentials

### For hosted providers (anthropic / openai / azure-openai / gemini / litellm-proxy / custom)

Ask for:

- **API key** — store in the operator's password manager first; Atrium will encrypt it at rest but never exposes the plaintext after creation.
- **Base URL** (optional) — only needed for Azure OpenAI, LiteLLM proxies, or custom endpoints. Examples:
  - Azure: `https://{resource}.openai.azure.com/openai/deployments/{deployment}`
  - LiteLLM: `https://litellm.yourcompany.com`
- **Default model** (optional) — sensible fallbacks if skipped:
  - Anthropic: `claude-sonnet-4-6`
  - OpenAI: `gpt-4o-mini`
  - Azure OpenAI: `gpt-4o`
  - Gemini: `gemini-2.5-flash`

### For Ollama (local, no key required)

Confirm Ollama is either already running on `localhost:11434` or will be started as a Docker sidecar.

If the operator wants the sidecar:

```bash
docker compose --profile ollama up -d
```

Then pull a model. Recommend `gemma3:4b` (~3GB, fits on most machines). Other lightweight options: `gemma3:1b`, `qwen2.5:3b`.

```bash
docker compose exec ollama ollama pull gemma3:4b
```

Store:
- **Base URL**: `http://ollama:11434/v1` (Docker network) or `http://localhost:11434/v1` (bare-metal)
- **Default model**: whatever was pulled
- **API key**: leave blank — the skill's seeding script inserts a sentinel value so the vault schema is happy, but no auth header is sent to Ollama.

## Phase 3 — Seed the provider into the vault

Two paths depending on whether the operator has shell access to the host, or only the web UI.

### Path A — shell access (recommended)

Run this one-liner from the atrium repo root:

```bash
LLM_PROVIDER=<provider> \
LLM_API_KEY=<key-or-blank-for-ollama> \
LLM_DISPLAY_NAME=<human-readable> \
LLM_BASE_URL=<optional-base-url> \
LLM_DEFAULT_MODEL=<optional-model> \
pnpm exec tsx <<'TSX'
import { prisma } from "./lib/prisma";
import { encryptSecret } from "./lib/crypto";

const provider = process.env.LLM_PROVIDER!;
const apiKey = process.env.LLM_API_KEY || "local-no-auth";
await prisma.providerConfig.upsert({
  where: { provider },
  create: {
    provider,
    displayName: process.env.LLM_DISPLAY_NAME ?? `${provider} (bootstrap)`,
    apiKeyCipher: encryptSecret(apiKey),
    apiKeyTail: apiKey.slice(-4),
    baseUrl: process.env.LLM_BASE_URL || null,
    defaultModel: process.env.LLM_DEFAULT_MODEL || null,
    enabled: true,
  },
  update: {
    displayName: process.env.LLM_DISPLAY_NAME ?? `${provider} (bootstrap)`,
    apiKeyCipher: encryptSecret(apiKey),
    apiKeyTail: apiKey.slice(-4),
    baseUrl: process.env.LLM_BASE_URL || null,
    defaultModel: process.env.LLM_DEFAULT_MODEL || null,
    enabled: true,
  },
});
console.log("✓ provider seeded:", provider);
TSX
```

### Path B — web UI

Direct the operator to `<atrium.publicUrl>/admin/providers`, click "Add / update a provider", fill in the form, and submit. Ask the operator to confirm when done.

## Phase 4 — Test connectivity

From the provider list at `/admin/providers`, click **Test** on the new provider's row. The button fires a `POST` to the test-provider server action which issues a trivial completion request and reports back.

Expected success: **"✓ pong"** (or similar short response) within a few seconds.

Common failure modes:

| Error | Cause |
|---|---|
| `401 Unauthorized` | Wrong API key. Check the value, not the envelope — trailing whitespace is common. |
| `Connection refused` (Ollama) | Sidecar isn't running or wrong baseUrl. `docker compose ps` to verify. |
| `model not found` | Model string doesn't match what's pulled/available. For Ollama, run `docker compose exec ollama ollama list`. |
| `timeout` | Reachability issue. If behind a proxy, set the provider's `baseUrl` to the proxy. |

## Phase 5 — Try a curation call

Walk the operator through using the provider for a real call:

1. Open any plugin in the catalog that has `Needs curation` (e.g. `/plugins/meeting-notes` in the seed data).
2. Click **✨ Suggest** in the Curation panel.
3. Wait ~5 seconds.

Expected: the category dropdown + tag chips fill with the LLM's suggestion, and the panel shows which provider responded.

If no plugins in the catalog have `Needs curation`, suggest creating one via `/users/[id]/upload` just to test.

## Phase 6 — Handoff

Summarize:

```
Provider registered:  <provider>
Base URL:             <baseUrl or "default">
Default model:        <model>
Key:                  …<last 4 chars>   (encrypted at rest)
Test result:          ✓ <first 40 chars of model response>

AI curation is now available across the catalog. Operators can add
additional providers at /admin/providers; the most-recently-updated
enabled provider is used by default.
```
