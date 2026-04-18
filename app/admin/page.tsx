import Link from "next/link";
import { plugins } from "@/data/plugins";
import { listAllSources } from "@/lib/sources";
import { Badge } from "@/components/badge";
import { formatNumber, formatRelative } from "@/lib/utils";
import { ApprovalActions } from "@/components/approval-actions";

const auditLog = [
  { at: "2026-04-17T08:12:00Z", actor: "ingest", action: "sync", target: "Acme Corp internal", detail: "2 plugins updated" },
  { at: "2026-04-17T07:44:00Z", actor: "alice@acme.corp", action: "install", target: "incident-commander@2.3.1", detail: "via Claude Code" },
  { at: "2026-04-17T06:02:00Z", actor: "ingest", action: "sync", target: "Anthropic reference", detail: "no changes" },
  { at: "2026-04-16T22:18:00Z", actor: "jordan@acme.corp", action: "approve", target: "spark-etl@0.2.0", detail: "promoted from quarantine" },
  { at: "2026-04-16T17:40:00Z", actor: "scanner", action: "signal", target: "k8s-operator@1.5.2", detail: "high: kubectl shell access" },
  { at: "2026-04-16T12:08:00Z", actor: "jordan@acme.corp", action: "quarantine", target: "k8s-operator@1.5.2", detail: "pending security review" },
];

export default async function AdminDashboard() {
  const sources = await listAllSources();
  const quarantined = plugins.filter((p) => p.policyState === "quarantined");
  const highSignals = plugins.filter((p) => p.signals.some((s) => s.severity === "high"));
  const totalInstalls30d = plugins.reduce((a, p) => a + (p.usage?.installs30d ?? 0), 0);
  const activeUsers7d = plugins.reduce((a, p) => a + (p.usage?.activeUsers7d ?? 0), 0);

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--color-border)] pb-6">
        <div>
          <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
            Admin
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
            Operational health of your atrium. Metrics last updated{" "}
            <span className="font-mono">{formatRelative("2026-04-17T08:12:00Z")}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sources/new"
            className="inline-flex h-9 items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-3 text-[13px] font-medium hover:border-[color:var(--color-border-strong)]"
          >
            Add source
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex h-9 items-center rounded-md bg-[color:var(--color-accent)] px-3 text-[13px] font-medium text-[color:var(--color-accent-fg)]"
          >
            Manage users
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Plugins" value={plugins.length.toString()} hint={`${quarantined.length} quarantined`} />
        <Stat label="Sources" value={sources.length.toString()} hint="all healthy" />
        <Stat label="Installs · 30d" value={formatNumber(totalInstalls30d)} hint="across all plugins" />
        <Stat label="Active users · 7d" value={formatNumber(activeUsers7d)} hint="unique, dedup" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title="Approvals queue" hint={`${quarantined.length} awaiting review`}>
          {quarantined.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
              Nothing in the queue.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {quarantined.map((p) => (
                <li key={p.slug} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/plugins/${p.slug}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-[color:var(--color-fg-subtle)]">
                      {p.sourceId} · {p.version}
                    </p>
                    {p.signals.length ? (
                      <p className="mt-1 text-[12.5px] text-[color:var(--color-fg-muted)]">
                        {p.signals[0]?.title}
                      </p>
                    ) : null}
                  </div>
                  <ApprovalActions pluginName={p.name} pluginSlug={p.slug} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Sources" hint={`${sources.length} connected`}>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {sources.map((s) => (
              <li key={s.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.name}</span>
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
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                      {s.url ?? s.kind}
                    </p>
                  </div>
                  <div className="text-right text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    <div>{s.pluginCount} plugins</div>
                    {s.lastSyncedAt ? (
                      <div className="mt-0.5">synced {formatRelative(s.lastSyncedAt)}</div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Audit log" hint="immutable · last 24h">
          <ul className="divide-y divide-[color:var(--color-border)]">
            {auditLog.map((ev, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 text-[12.5px]">
                <span className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  {formatRelative(ev.at)}
                </span>
                <span>
                  <span className="font-mono text-[color:var(--color-fg-muted)]">{ev.actor}</span>{" "}
                  <span className="font-medium text-[color:var(--color-fg)]">{ev.action}</span>{" "}
                  <span className="font-mono text-[color:var(--color-fg-muted)]">{ev.target}</span>
                </span>
                <span className="text-right text-[color:var(--color-fg-subtle)]">{ev.detail}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="High-severity signals" hint={`${highSignals.length} open`}>
          {highSignals.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
              No high-severity signals.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {highSignals.flatMap((p) =>
                p.signals
                  .filter((s) => s.severity === "high")
                  .map((s) => (
                    <li key={`${p.slug}-${s.id}`} className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/25 bg-[color:var(--color-danger)]/5 p-3">
                      <Link href={`/plugins/${p.slug}`} className="text-[13px] font-medium hover:underline">
                        {p.name}
                      </Link>
                      <p className="mt-1 text-[12.5px] text-[color:var(--color-fg-muted)]">
                        {s.title}
                      </p>
                    </li>
                  )),
              )}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-[24px] tracking-tight text-[color:var(--color-fg)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11.5px] text-[color:var(--color-fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {hint ? (
          <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">{hint}</span>
        ) : null}
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}
