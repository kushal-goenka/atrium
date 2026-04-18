import { Suspense } from "react";
import { plugins as staticPlugins } from "@/data/plugins";
import { Catalog } from "@/components/catalog";
import { formatRelative } from "@/lib/utils";
import { getBranding } from "@/lib/branding";
import { listAllSources } from "@/lib/sources";
import { hydratePlugins } from "@/lib/overrides";

// Reads from DB (sources + overrides) — can't prerender at build.
export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const brand = getBranding();
  const [sources, plugins] = await Promise.all([
    listAllSources(),
    hydratePlugins(staticPlugins),
  ]);

  const mostRecent = plugins.reduce<string>(
    (acc, p) => (p.updatedAt > acc ? p.updatedAt : acc),
    "1970-01-01T00:00:00Z",
  );

  return (
    <div>
      <section className="mb-10 border-b border-[color:var(--color-border)] pb-8">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          {brand.orgName} · {brand.atriumHostname}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-[color:var(--color-fg)]">
          Plugins approved for your org
        </h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-[color:var(--color-fg-muted)]">
          Every plugin here has been reviewed against your organization&apos;s security policy.
          Install from Claude Code, ChatGPT, Gemini, or any agent framework that speaks the
          underlying protocol.
          {brand.proposalUrl || brand.supportEmail ? (
            <>
              {" "}Want to propose one?{" "}
              <a
                href={brand.proposalUrl ?? `mailto:${brand.supportEmail}`}
                className="text-[color:var(--color-accent)] underline-offset-4 hover:underline"
              >
                Submit a request.
              </a>
            </>
          ) : null}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-[12.5px] text-[color:var(--color-fg-subtle)]">
          <span>
            <span className="font-mono text-[color:var(--color-fg-muted)]">{plugins.length}</span> plugins
          </span>
          <span>
            <span className="font-mono text-[color:var(--color-fg-muted)]">{sources.length}</span> federated sources
          </span>
          <span>catalog synced {formatRelative(mostRecent)}</span>
        </div>
      </section>

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog plugins={plugins} sources={sources} />
      </Suspense>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[180px] animate-pulse rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]"
        />
      ))}
    </div>
  );
}
