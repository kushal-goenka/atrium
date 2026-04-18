import { prisma } from "../prisma";
import { decryptSecret } from "../crypto";

/**
 * Thin provider-agnostic LLM client. Supports:
 *   - Anthropic  (default model: claude-sonnet-4-6)
 *   - OpenAI     (default model: gpt-4o-mini)
 *   - Gemini     (default model: gemini-2.5-flash)
 *   - LiteLLM / Azure / custom (OpenAI-compatible schema)
 *
 * The call always returns a string (the model's text) or throws. We
 * intentionally don't expose streaming here — curation is batch-ish.
 */

export interface CompletionRequest {
  system: string;
  user: string;
  maxOutputTokens?: number;
  /** Override which provider to use. Default: pick the first enabled one. */
  preferredProvider?: string;
}

export interface CompletionResponse {
  text: string;
  /** Which provider actually responded. */
  provider: string;
  /** Which model responded (useful for audit). */
  model: string;
}

export async function complete(req: CompletionRequest): Promise<CompletionResponse> {
  const rows = await prisma.providerConfig.findMany({
    where: { enabled: true },
    orderBy: { updatedAt: "desc" },
  });
  if (rows.length === 0) {
    throw new Error(
      "No LLM provider configured. Add one in Admin → Providers before using AI features.",
    );
  }

  const picked = req.preferredProvider
    ? rows.find((r) => r.provider === req.preferredProvider)
    : rows[0];
  if (!picked) {
    throw new Error(`Preferred provider '${req.preferredProvider}' is not configured.`);
  }

  const apiKey = decryptSecret(picked.apiKeyCipher);

  // The per-provider switch isolates the provider-specific request shape.
  // Ollama runs locally and speaks the OpenAI chat/completions schema — we
  // reuse callOpenAI, skip the Authorization header, and default baseUrl to
  // the Docker sidecar.
  const dispatch: Record<string, () => Promise<CompletionResponse>> = {
    anthropic: () => callAnthropic(apiKey, picked.baseUrl, picked.defaultModel, req),
    openai: () => callOpenAI(apiKey, picked.baseUrl, picked.defaultModel, req),
    "azure-openai": () => callOpenAI(apiKey, picked.baseUrl, picked.defaultModel, req),
    "litellm-proxy": () => callOpenAI(apiKey, picked.baseUrl, picked.defaultModel, req),
    gemini: () => callGemini(apiKey, picked.baseUrl, picked.defaultModel, req),
    custom: () => callOpenAI(apiKey, picked.baseUrl, picked.defaultModel, req),
    ollama: () =>
      callOpenAI(
        apiKey, // unused — omitted from headers below
        picked.baseUrl ?? "http://localhost:11434/v1",
        picked.defaultModel ?? "gemma3:4b",
        req,
        { sendAuth: false },
      ),
  };

  const fn = dispatch[picked.provider];
  if (!fn) throw new Error(`Unsupported provider: ${picked.provider}`);

  const res = await fn();
  await prisma.providerConfig
    .update({ where: { id: picked.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return res;
}

async function callAnthropic(
  apiKey: string,
  baseUrl: string | null,
  defaultModel: string | null,
  req: CompletionRequest,
): Promise<CompletionResponse> {
  const url = (baseUrl ?? "https://api.anthropic.com") + "/v1/messages";
  const model = defaultModel ?? "claude-sonnet-4-6";
  const body = {
    model,
    max_tokens: req.maxOutputTokens ?? 512,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  return { text, provider: "anthropic", model };
}

async function callOpenAI(
  apiKey: string,
  baseUrl: string | null,
  defaultModel: string | null,
  req: CompletionRequest,
  opts: { sendAuth?: boolean } = {},
): Promise<CompletionResponse> {
  const url = (baseUrl ?? "https://api.openai.com/v1") + "/chat/completions";
  const model = defaultModel ?? "gpt-4o-mini";
  const body = {
    model,
    max_tokens: req.maxOutputTokens ?? 512,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
  };
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.sendAuth !== false) {
    headers.authorization = `Bearer ${apiKey}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, provider: "openai-compatible", model };
}

async function callGemini(
  apiKey: string,
  baseUrl: string | null,
  defaultModel: string | null,
  req: CompletionRequest,
): Promise<CompletionResponse> {
  const model = defaultModel ?? "gemini-2.5-flash";
  const base =
    baseUrl ?? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const url = `${base}?key=${encodeURIComponent(apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
    generationConfig: { maxOutputTokens: req.maxOutputTokens ?? 512 },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text, provider: "gemini", model };
}

/** Quick no-op call used by the "Test" button in the admin UI. */
export async function testProvider(providerKey: string): Promise<{ ok: boolean; error?: string; sample?: string }> {
  try {
    const { text } = await complete({
      system: "You are a connectivity tester. Reply with the literal string 'pong'.",
      user: "ping",
      preferredProvider: providerKey,
      maxOutputTokens: 10,
    });
    return { ok: true, sample: text.trim().slice(0, 40) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
