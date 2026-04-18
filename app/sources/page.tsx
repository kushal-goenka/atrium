import Link from "next/link";
import { plugins } from "@/data/plugins";
import { listAllSources } from "@/lib/sources";
import { Badge } from "@/components/badge";
import { SyncSourceButton } from "@/components/sync-source-button";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Sources" };
export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await listAllSources();

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--color-border)] pb-6">
        <div>
          <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
            Federation
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
            Atrium aggregates plugins from multiple upstream marketplaces. Each source has a trust
            tier and its plugins are policy-filtered before reaching developers.
          </p>
        </div>
        <Link
          href="/admin/sources/new"
          className="inline-flex h-9 shrink-0 items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[13px] font-medium hover:border-[color:var(--color-border-strong)]"
        >
          Add source
        </Link>
      </header>

      <ul className="space-y-4">
        {sources.map((s) => {
          const pluginsFromSource = plugins.filter((p) => p.sourceId === s.id);
          return (
            <li
              key={s.id}
              className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-semibold">{s.name}</h2>
                    <Badge
                      variant={
                        s.trust === "official"
                          ? "accent"
                          : s.trust === "verified"
                            ? "info"
                            : s.trust === "internal"
                              ? "ok"
                              : "neutral"
                      }
                    >
                      {s.trust}
                    </Badge>
                    <Badge>{s.kind}</Badge>
                  </div>
                  <p className="mt-1 truncate font-mono text-[12px] text-[color:var(--color-fg-subtle)]">
                    {s.url ?? `(local, no URL)`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[12px] text-[color:var(--color-fg-subtle)]">
                  <div>
                    <span className="font-mono text-[color:var(--color-fg-muted)]">
                      {s.pluginCount}
                    </span>{" "}
                    plugins
                    {s.lastSyncedAt ? (
                      <span className="ml-2">· synced {formatRelative(s.lastSyncedAt)}</span>
                    ) : null}
                  </div>
                  <SyncSourceButton
                    sourceKey={s.id}
                    disabled={s.kind === "local"}
                    disabledReason="Local sources upload fresh bundles rather than syncing."
                  />
                </div>
              </div>

              {pluginsFromSource.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pluginsFromSource.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/plugins/${p.slug}`}
                      className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] px-2.5 py-1 text-[12px] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]"
                    >
                      {p.name}{" "}
                      <span className="font-mono text-[10.5px] text-[color:var(--color-fg-subtle)]">
                        {p.version}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
