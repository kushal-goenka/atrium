import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findPlugin } from "@/data/plugins";
import { diffPlugins } from "@/lib/diff";
import { Badge } from "@/components/badge";
import { formatRelative } from "@/lib/utils";
import type { Plugin } from "@/lib/types";

export const metadata = { title: "Fork diff" };
export const dynamic = "force-dynamic";

export default async function ForkDiffPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fork = await prisma.pluginFork.findUnique({ where: { id } });
  if (!fork) notFound();

  let snapshot: Plugin | null = null;
  try {
    snapshot = JSON.parse(fork.snapshotManifest) as Plugin;
  } catch {
    snapshot = null;
  }

  const upstream = findPlugin(fork.upstreamSlug);
  const changes =
    snapshot && upstream ? diffPlugins(snapshot, upstream) : [];

  return (
    <div>
      <Link
        href="/admin/forks"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)]"
      >
        ← Back to forks
      </Link>

      <header className="mt-4 mb-6 border-b border-[color:var(--color-border)] pb-6">
        <p className="text-[11.5px] font-mono uppercase tracking-[0.08em] text-[color:var(--color-fg-subtle)]">
          Admin · forks · diff
        </p>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight">
          <code className="font-mono">{fork.forkSourceKey}:{fork.forkSlug}</code>
        </h1>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-fg-muted)]">
          Forked from{" "}
          <Link
            href={`/plugins/${fork.upstreamSlug}`}
            className="font-mono text-[color:var(--color-accent)] hover:underline"
          >
            {fork.upstreamSourceKey}:{fork.upstreamSlug}
          </Link>{" "}
          at <code className="font-mono">{fork.forkedAtVersion}</code> · {formatRelative(fork.createdAt.toISOString())}.
        </p>
      </header>

      {!snapshot ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-4 py-3 text-[13px] text-[color:var(--color-danger)]">
          Could not parse fork snapshot JSON.
        </div>
      ) : !upstream ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--color-warn)]/30 bg-[color:var(--color-warn)]/10 px-4 py-3 text-[13px] text-[color:var(--color-warn)]">
          Upstream plugin <code className="font-mono">{fork.upstreamSlug}</code> no longer exists in
          the catalog. Your fork continues to serve the snapshotted copy — no action required.
        </div>
      ) : changes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border-strong)] px-8 py-12 text-center text-[13px] text-[color:var(--color-fg-subtle)]">
          No changes since the fork. Upstream and your snapshot are identical.
        </div>
      ) : (
        <section>
          <h2 className="mb-3 text-[14px] font-semibold">
            {changes.length} change{changes.length === 1 ? "" : "s"} since fork
          </h2>
          <ul className="divide-y divide-[color:var(--color-border)] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elev)]">
            {changes.map((c, i) => (
              <li key={i} className="grid grid-cols-[100px_1fr] gap-4 px-4 py-3 sm:grid-cols-[120px_1fr_1fr]">
                <div>
                  <Badge
                    variant={
                      c.kind === "added"
                        ? "ok"
                        : c.kind === "removed"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {c.kind}
                  </Badge>
                  <p className="mt-1 font-mono text-[11.5px] text-[color:var(--color-fg-subtle)]">
                    {c.path}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                    before (fork snapshot)
                  </p>
                  <p className="mt-0.5 break-words font-mono text-[12.5px] text-[color:var(--color-fg-muted)]">
                    {"before" in c ? c.before : <span className="italic">—</span>}
                  </p>
                </div>
                <div className="min-w-0 sm:block">
                  <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
                    after (upstream now)
                  </p>
                  <p className="mt-0.5 break-words font-mono text-[12.5px] text-[color:var(--color-fg-muted)]">
                    {"after" in c ? c.after : <span className="italic">—</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--color-info)]/30 bg-[color:var(--color-info)]/10 px-4 py-3 text-[12.5px] text-[color:var(--color-info)]">
            <span className="font-semibold">Merging from upstream</span> lands in M2 — for now,
            this diff lets you review changes before manually updating the fork snapshot.
          </div>
        </section>
      )}

      {fork.notes ? (
        <div className="mt-6 rounded-[var(--radius)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-sunken)] p-3 text-[12.5px] text-[color:var(--color-fg-muted)]">
          <span className="font-medium text-[color:var(--color-fg)]">Fork note:</span> {fork.notes}
        </div>
      ) : null}
    </div>
  );
}
