import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { FlagForRescan } from "@/components/flag-for-rescan";
import { InstallPanel } from "@/components/install-panel";
import { CurationPanel } from "@/components/curation-panel";
import { PinForkPanel } from "@/components/pin-fork-panel";
import { formatNumber, formatRelative } from "@/lib/utils";
import { getBranding } from "@/lib/branding";
import { hydratePlugins } from "@/lib/overrides";
import { findPluginBySlug } from "@/lib/plugins-repo";
import { findSourceByKey } from "@/lib/sources";
import { PROVIDER_LABELS, type SecuritySignal } from "@/lib/types";

// Reads from DB.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const plugin = await findPluginBySlug(slug);
  if (!plugin) return {};
  return {
    title: plugin.name,
    description: plugin.description,
  };
}

const severityVariant: Record<SecuritySignal["severity"], "info" | "neutral" | "warn" | "danger"> = {
  info: "info",
  low: "neutral",
  medium: "warn",
  high: "danger",
};

export default async function PluginDetail(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const raw = await findPluginBySlug(slug);
  if (!raw) return notFound();
  const [plugin] = await hydratePlugins([raw]);
  if (!plugin) return notFound();
  const source = await findSourceByKey(plugin.sourceId);
  const brand = getBranding();

  const trustLabel =
    source?.trust === "official"
      ? "Official source"
      : source?.trust === "verified"
        ? "Verified source"
        : source?.trust === "internal"
          ? "Internal source"
          : "Community source";

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to browse
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{plugin.category}</Badge>
            <Badge>{PROVIDER_LABELS[plugin.provider]}</Badge>
            {source ? <Badge>{trustLabel}</Badge> : null}
            {plugin.policyState === "quarantined" ? (
              <Badge variant="warn">Quarantined</Badge>
            ) : null}
            {plugin.policyState === "blocked" ? <Badge variant="danger">Blocked</Badge> : null}
            {plugin.pinnedVersion ? (
              <Badge variant="info">Pinned · v{plugin.pinnedVersion}</Badge>
            ) : null}
            {plugin.forkedFrom ? (
              <Badge variant="info">
                Fork of {plugin.forkedFrom.slug}@{plugin.forkedFrom.atVersion}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-[color:var(--color-fg)]">
            {plugin.name}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[color:var(--color-fg-muted)]">
            {plugin.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-[color:var(--color-fg-subtle)]">
            <span>
              by <span className="text-[color:var(--color-fg-muted)]">{plugin.author.name}</span>
            </span>
            {source ? (
              <span>
                from <span className="text-[color:var(--color-fg-muted)]">{source.name}</span>
              </span>
            ) : null}
            {plugin.license ? <span>{plugin.license}</span> : null}
            <span>updated {formatRelative(plugin.updatedAt)}</span>
          </div>

          {plugin.signals.length > 0 ? (
            <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold tracking-tight text-[color:var(--color-fg)]">
                  Security signals
                </h2>
                <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
                  scanners · {new Set(plugin.signals.map((s) => s.scanner)).size}
                </span>
              </div>
              <ul className="mt-3 space-y-3">
                {plugin.signals.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={severityVariant[s.severity]}>{s.severity}</Badge>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-[color:var(--color-fg)]">
                          {s.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                          {s.detail}
                        </p>
                        <p className="mt-2 font-mono text-[11px] text-[color:var(--color-fg-subtle)]">
                          scanner: {s.scanner}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {plugin.commands.length > 0 ? (
            <Section title="Slash commands" count={plugin.commands.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.commands.map((c) => (
                  <li key={c.name} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <code className="font-mono text-[13px] text-[color:var(--color-accent)]">
                          {c.name}
                        </code>
                        {c.argumentHint ? (
                          <code className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                            {c.argumentHint}
                          </code>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                        {c.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.agents.length > 0 ? (
            <Section title="Subagents" count={plugin.agents.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.agents.map((a) => (
                  <li key={a.name} className="py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                        {a.name}
                      </code>
                      {a.model ? (
                        <Badge>{a.model}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {a.description}
                    </p>
                    {a.tools?.length ? (
                      <p className="mt-1 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                        tools: {a.tools.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.skills.length > 0 ? (
            <Section title="Skills" count={plugin.skills.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.skills.map((s) => (
                  <li key={s.name} className="py-3">
                    <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                      {s.name}
                    </code>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {s.description}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.mcpServers.length > 0 ? (
            <Section title="MCP servers" count={plugin.mcpServers.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.mcpServers.map((m) => (
                  <li key={m.name} className="py-3">
                    <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                      {m.name}
                    </code>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {m.description ?? "—"}
                    </p>
                    <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                      $ {m.command} {m.args?.join(" ")}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.actions && plugin.actions.length > 0 ? (
            <Section title="OpenAI actions" count={plugin.actions.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.actions.map((a) => (
                  <li key={a.name} className="py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                        {a.name}
                      </code>
                      {a.scope ? (
                        <Badge variant={a.scope === "write" ? "warn" : "neutral"}>
                          {a.scope}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {a.description}
                    </p>
                    {a.schemaUrl ? (
                      <a
                        href={a.schemaUrl}
                        className="mt-1 block truncate font-mono text-[11.5px] text-[color:var(--color-accent)] hover:underline"
                      >
                        {a.schemaUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.extensions && plugin.extensions.length > 0 ? (
            <Section title="Gemini extensions" count={plugin.extensions.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.extensions.map((e) => (
                  <li key={e.name} className="py-3">
                    <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                      {e.name}
                    </code>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-fg-muted)]">
                      {e.description}
                    </p>
                    {e.trigger ? (
                      <p className="mt-1 text-[11.5px] text-[color:var(--color-fg-subtle)]">
                        Trigger: <em className="not-italic">{e.trigger}</em>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {plugin.hooks.length > 0 ? (
            <Section title="Hooks" count={plugin.hooks.length}>
              <ul className="divide-y divide-[color:var(--color-border)]">
                {plugin.hooks.map((h, i) => (
                  <li key={i} className="py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="warn">{h.event}</Badge>
                      {h.timeoutMs ? (
                        <span className="font-mono text-[11px] text-[color:var(--color-fg-subtle)]">
                          timeout {h.timeoutMs}ms
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-[color:var(--color-fg-muted)]">
                      $ {h.command}
                    </p>
                    {h.description ? (
                      <p className="mt-1 text-[12.5px] text-[color:var(--color-fg-subtle)]">
                        {h.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Versions" count={plugin.versions.length}>
            <ul className="divide-y divide-[color:var(--color-border)]">
              {plugin.versions.map((v) => (
                <li key={v.version} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-[13px] font-semibold text-[color:var(--color-fg)]">
                        {v.version}
                      </code>
                      <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
                        {formatRelative(v.releasedAt)}
                      </span>
                    </div>
                    {v.changelog ? (
                      <p className="mt-1 text-[13px] text-[color:var(--color-fg-muted)]">
                        {v.changelog}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <InstallPanel
            plugin={plugin}
            hostname={brand.atriumHostname}
            orgName={brand.orgName}
          />

          {plugin.usage ? (
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
              <h2 className="text-[13px] font-semibold tracking-tight text-[color:var(--color-fg)]">
                Usage in your org
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-y-3">
                <Metric label="Installs · 30d" value={formatNumber(plugin.usage.installs30d)} />
                <Metric label="All-time" value={formatNumber(plugin.usage.installsAllTime)} />
                <Metric label="Active · 7d" value={formatNumber(plugin.usage.activeUsers7d)} />
                <Metric label="Commands run · 30d" value={formatNumber(plugin.usage.topCommands.reduce((a, c) => a + c.count, 0))} />
              </dl>
              {plugin.usage.topCommands.length ? (
                <div className="mt-4 border-t border-[color:var(--color-border)] pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                    Top commands
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {plugin.usage.topCommands.map((c) => (
                      <li key={c.name} className="flex items-center justify-between text-[12.5px]">
                        <code className="font-mono text-[color:var(--color-fg-muted)]">{c.name}</code>
                        <span className="font-mono text-[color:var(--color-fg-subtle)]">{formatNumber(c.count)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <CurationPanel
            pluginSlug={plugin.slug}
            currentCategory={plugin.category}
            currentKeywords={plugin.keywords}
          />

          <PinForkPanel
            pluginSlug={plugin.slug}
            pluginVersion={plugin.version}
            versions={plugin.versions.map((v) => ({ version: v.version }))}
            currentPin={plugin.pinnedVersion}
            sourceKind={source?.kind ?? "git"}
          />

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-[color:var(--color-fg)]">
              Provenance
            </h2>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <Row label="Source" value={source?.name ?? "—"} />
              <Row label="Kind" value={source?.kind ?? "—"} />
              <Row label="Last synced" value={source?.lastSyncedAt ? formatRelative(source.lastSyncedAt) : "—"} />
              <Row label="Policy state" value={plugin.policyState} />
              {plugin.homepage ? (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[color:var(--color-fg-subtle)]">Homepage</dt>
                  <dd className="min-w-0">
                    <a href={plugin.homepage} className="block truncate text-[color:var(--color-accent)] hover:underline">
                      {plugin.homepage.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <FlagForRescan pluginSlug={plugin.slug} />
        </aside>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline justify-between border-b border-[color:var(--color-border)] pb-2">
        <h2 className="text-[14px] font-semibold tracking-tight text-[color:var(--color-fg)]">
          {title}
        </h2>
        <span className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">{label}</dt>
      <dd className="mt-0.5 font-mono text-[17px] text-[color:var(--color-fg)]">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[color:var(--color-fg-subtle)]">{label}</dt>
      <dd className="truncate text-[color:var(--color-fg-muted)]">{value}</dd>
    </div>
  );
}
