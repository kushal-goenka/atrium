"use client";

import { useActionState, useState } from "react";
import { upsertProviderAction, type UpsertProviderState } from "./actions";

const INITIAL: UpsertProviderState = { ok: false };

const PROVIDERS = [
  { key: "anthropic", label: "Anthropic", baseHint: "", modelHint: "claude-sonnet-4-6", local: false },
  { key: "openai", label: "OpenAI", baseHint: "", modelHint: "gpt-4o-mini", local: false },
  { key: "azure-openai", label: "Azure OpenAI", baseHint: "https://{name}.openai.azure.com/openai/deployments/{id}", modelHint: "gpt-4o", local: false },
  { key: "gemini", label: "Google Gemini", baseHint: "", modelHint: "gemini-2.5-flash", local: false },
  { key: "litellm-proxy", label: "LiteLLM proxy", baseHint: "https://litellm.yourcompany.com", modelHint: "gpt-4o-mini", local: false },
  { key: "ollama", label: "Ollama (local)", baseHint: "http://ollama:11434/v1", modelHint: "llama3.2", local: true },
  { key: "custom", label: "Custom (OpenAI-schema)", baseHint: "https://…", modelHint: "your-model", local: false },
];

export function ProviderForm() {
  const [state, formAction, pending] = useActionState(upsertProviderAction, INITIAL);
  const [selected, setSelected] = useState<string>("anthropic");
  const info = PROVIDERS.find((p) => p.key === selected)!;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5"
    >
      {state.ok ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-ok)]/30 bg-[color:var(--color-ok)]/10 px-3 py-2 text-[12.5px] text-[color:var(--color-ok)]">
          ✓ Saved. Reload to see the updated list.
        </div>
      ) : null}
      {state.error ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-[12.5px] text-[color:var(--color-danger)]">
          {state.error}
        </div>
      ) : null}

      <Field label="Provider">
        <select
          name="provider"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        >
          {PROVIDERS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.provider ? (
          <ErrorLine>{state.fieldErrors.provider}</ErrorLine>
        ) : null}
      </Field>

      <Field label="Display name">
        <input
          name="displayName"
          type="text"
          required
          placeholder="Prod Anthropic key"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[14px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
        {state.fieldErrors?.displayName ? (
          <ErrorLine>{state.fieldErrors.displayName}</ErrorLine>
        ) : null}
      </Field>

      <Field
        label="API key"
        hint={
          info.local
            ? "Local providers (Ollama) run in your network and don't need a key — leave blank."
            : "Encrypted at rest with your AUTH_SECRET."
        }
      >
        <input
          name="apiKey"
          type="password"
          required={!info.local}
          autoComplete="off"
          placeholder={info.local ? "(not needed)" : "sk-…"}
          disabled={info.local}
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none disabled:opacity-60"
        />
        {state.fieldErrors?.apiKey ? <ErrorLine>{state.fieldErrors.apiKey}</ErrorLine> : null}
      </Field>

      <Field label="Base URL" hint={info.baseHint || "Optional. Leave blank for the provider's default."}>
        <input
          name="baseUrl"
          type="url"
          placeholder={info.baseHint || "https://api.example.com/v1"}
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
        {state.fieldErrors?.baseUrl ? <ErrorLine>{state.fieldErrors.baseUrl}</ErrorLine> : null}
      </Field>

      <Field label="Default model" hint={`e.g. ${info.modelHint}`}>
        <input
          name="defaultModel"
          type="text"
          placeholder={info.modelHint}
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 font-mono text-[13px] focus:border-[color:var(--color-border-strong)] focus:outline-none"
        />
      </Field>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="enabled" defaultChecked className="accent-[color:var(--color-accent)]" />
        Enabled
      </label>

      <div className="flex items-center gap-3 border-t border-[color:var(--color-border)] pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-[color:var(--color-accent)] px-4 text-[13.5px] font-medium text-[color:var(--color-accent-fg)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save provider"}
        </button>
        <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
          Replaces any existing config for this provider.
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[color:var(--color-fg)]">{label}</span>
        {hint ? (
          <span className="truncate text-[11px] text-[color:var(--color-fg-subtle)]">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[12px] text-[color:var(--color-danger)]">{children}</p>;
}
