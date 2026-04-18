import Link from "next/link";
import type { Plugin, Source } from "@/lib/types";
import { PROVIDER_LABELS } from "@/lib/types";
import { Badge } from "./badge";
import { formatNumber, formatRelative } from "@/lib/utils";

type Props = {
  plugin: Plugin;
  source?: Source;
};

const trustLabel: Record<Source["trust"], string> = {
  official: "Official",
  verified: "Verified",
  community: "Community",
  internal: "Internal",
};

const trustVariant: Record<Source["trust"], "accent" | "info" | "neutral" | "ok"> = {
  official: "accent",
  verified: "info",
  community: "neutral",
  internal: "ok",
};

export function PluginCard({ plugin, source }: Props) {
  const maxSignal = plugin.signals.reduce((worst, s) => {
    const rank = { info: 0, low: 1, medium: 2, high: 3 }[s.severity];
    return rank > worst ? rank : worst;
  }, -1);

  const signalBadge =
    maxSignal === 3
      ? { variant: "danger" as const, label: "Review required" }
      : maxSignal === 2
        ? { variant: "warn" as const, label: "Review advised" }
        : null;

  const feature = [
    plugin.commands.length ? `${plugin.commands.length} cmd` : null,
    plugin.agents.length ? `${plugin.agents.length} agent` : null,
    plugin.skills.length ? `${plugin.skills.length} skill` : null,
    plugin.mcpServers.length ? `${plugin.mcpServers.length} mcp` : null,
    plugin.hooks.length ? `${plugin.hooks.length} hook` : null,
    plugin.actions?.length ? `${plugin.actions.length} action` : null,
    plugin.extensions?.length ? `${plugin.extensions.length} ext` : null,
  ].filter(Boolean) as string[];

  const uncurated = plugin.keywords.length === 0 && plugin.category === "other";

  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="group block rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-5 transition-colors hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-sunken)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15.5px] font-semibold tracking-tight text-[color:var(--color-fg)]">
              {plugin.name}
            </h3>
            <span className="font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
              {plugin.version}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[color:var(--color-fg-subtle)]">
            by {plugin.author.name}
            {source ? ` · ${source.name}` : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="neutral">{PROVIDER_LABELS[plugin.provider]}</Badge>
          {source ? (
            <Badge variant={trustVariant[source.trust]}>{trustLabel[source.trust]}</Badge>
          ) : null}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-[color:var(--color-fg-muted)]">
        {plugin.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge>{plugin.category}</Badge>
        {feature.map((f) => (
          <span
            key={f}
            className="font-mono text-[11px] text-[color:var(--color-fg-subtle)]"
          >
            · {f}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[color:var(--color-border)] pt-3">
        <div className="flex items-center gap-3 text-[11.5px] text-[color:var(--color-fg-subtle)]">
          {plugin.usage ? (
            <>
              <span>
                <span className="font-mono text-[color:var(--color-fg-muted)]">
                  {formatNumber(plugin.usage.installs30d)}
                </span>{" "}
                installs · 30d
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="font-mono text-[color:var(--color-fg-muted)]">
                  {formatNumber(plugin.usage.activeUsers7d)}
                </span>{" "}
                active · 7d
              </span>
            </>
          ) : (
            <span className="italic">telemetry off</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {uncurated ? <Badge variant="info">Needs curation</Badge> : null}
          {signalBadge ? <Badge variant={signalBadge.variant}>{signalBadge.label}</Badge> : null}
          <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
            updated {formatRelative(plugin.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
