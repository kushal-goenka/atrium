import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badge";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Forks" };
export const dynamic = "force-dynamic";

export default async function ForksPage() {
  const forks = await prisma.pluginFork.findMany({
    orderBy: { createdAt: "desc" },
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
          Admin · forks
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Forks</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-[color:var(--color-fg-muted)]">
          Internal copies of external plugins. Each fork captures the upstream manifest at fork
          time and can diverge independently. Upstream changes never overwrite a fork.
        </p>
      </header>

      {forks.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-8 py-12 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
          No forks yet. Fork a plugin from its detail page to start.
        </div>
      ) : (
        <ul className="space-y-3">
          {forks.map((f) => (
            <li
              key={f.id}
              className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">fork</Badge>
                    <code className="font-mono text-[13px] text-[color:var(--color-fg)]">
                      {f.forkSourceKey}:{f.forkSlug}
                    </code>
                  </div>
                  <p className="mt-1 text-[12px] text-[color:var(--color-fg-muted)]">
                    forked from{" "}
                    <Link
                      href={`/plugins/${f.upstreamSlug}`}
                      className="font-mono text-[color:var(--color-accent)] hover:underline"
                    >
                      {f.upstreamSourceKey}:{f.upstreamSlug}
                    </Link>{" "}
                    at{" "}
                    <code className="font-mono text-[color:var(--color-fg-muted)]">
                      {f.forkedAtVersion}
                    </code>
                  </p>
                  {f.notes ? (
                    <p className="mt-1 text-[12px] text-[color:var(--color-fg-subtle)]">
                      {f.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/forks/${f.id}`}
                    className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)] px-2.5 py-1 text-[11.5px] font-medium hover:border-[color:var(--color-border-strong)]"
                  >
                    View diff
                  </Link>
                  <span className="text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    {formatRelative(f.createdAt.toISOString())}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
