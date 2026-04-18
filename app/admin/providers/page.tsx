import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { ProviderForm } from "./form";
import { ProviderTestButton } from "./test-button";
import { ProviderDeleteButton } from "./delete-button";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "LLM providers" };
export const dynamic = "force-dynamic";

const PROVIDER_INFO: Record<
  string,
  { label: string; badge: "accent" | "info" | "ok" | "neutral" }
> = {
  anthropic: { label: "Anthropic", badge: "accent" },
  openai: { label: "OpenAI", badge: "info" },
  "azure-openai": { label: "Azure OpenAI", badge: "info" },
  gemini: { label: "Google Gemini", badge: "info" },
  "litellm-proxy": { label: "LiteLLM proxy", badge: "ok" },
  custom: { label: "Custom (OpenAI-schema)", badge: "neutral" },
};

export default async function ProvidersPage() {
  const providers = await prisma.providerConfig.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to admin
      </Link>

      <header className="mt-4 mb-6 border-b border-[color:var(--color-border)] pb-6">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Admin · providers
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">LLM providers</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
          Atrium uses these keys for AI features like automatic category/tag curation. Keys are
          encrypted at rest with AES-256-GCM using a key derived from your <code className="font-mono text-[12.5px]">AUTH_SECRET</code>.
          Point <em>baseUrl</em> at a LiteLLM proxy to centralize routing.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-3 text-[14px] font-semibold">Configured providers</h2>
          {providers.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-6 py-12 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
              No providers yet. Add one on the right to enable AI features.
            </div>
          ) : (
            <ul className="space-y-3">
              {providers.map((p) => {
                const info = PROVIDER_INFO[p.provider] ?? {
                  label: p.provider,
                  badge: "neutral" as const,
                };
                return (
                  <li
                    key={p.id}
                    className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{p.displayName}</span>
                          <Badge variant={info.badge}>{info.label}</Badge>
                          {!p.enabled ? <Badge variant="warn">Disabled</Badge> : null}
                        </div>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12.5px]">
                          <dt className="text-[color:var(--color-fg-subtle)]">Key</dt>
                          <dd className="font-mono text-[color:var(--color-fg-muted)]">
                            ••••{p.apiKeyTail}
                          </dd>
                          {p.baseUrl ? (
                            <>
                              <dt className="text-[color:var(--color-fg-subtle)]">Base URL</dt>
                              <dd className="truncate font-mono text-[color:var(--color-fg-muted)]">
                                {p.baseUrl}
                              </dd>
                            </>
                          ) : null}
                          {p.defaultModel ? (
                            <>
                              <dt className="text-[color:var(--color-fg-subtle)]">Model</dt>
                              <dd className="font-mono text-[color:var(--color-fg-muted)]">
                                {p.defaultModel}
                              </dd>
                            </>
                          ) : null}
                          {p.lastUsedAt ? (
                            <>
                              <dt className="text-[color:var(--color-fg-subtle)]">Last used</dt>
                              <dd className="text-[color:var(--color-fg-muted)]">
                                {formatRelative(p.lastUsedAt.toISOString())}
                              </dd>
                            </>
                          ) : null}
                        </dl>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <ProviderTestButton providerKey={p.provider} />
                        <ProviderDeleteButton providerKey={p.provider} label={p.displayName} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="mb-3 text-[14px] font-semibold">Add / update a provider</h2>
          <ProviderForm />
        </aside>
      </div>
    </div>
  );
}
