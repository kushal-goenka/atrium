import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/utils";
import type { MarketplaceSnapshot } from "@prisma/client";

/**
 * Last 3 sync snapshots for a source. Renders nothing if no syncs have run.
 * Shown compactly under each source card on /sources.
 */
export async function SourceSnapshots({ sourceKey }: { sourceKey: string }) {
  const source = await prisma.source.findUnique({
    where: { key: sourceKey },
    select: { id: true },
  });
  if (!source) return null;

  const snapshots = await prisma.marketplaceSnapshot.findMany({
    where: { sourceId: source.id },
    orderBy: { fetchedAt: "desc" },
    take: 3,
  });

  if (snapshots.length === 0) return null;

  return (
    <div className="mt-4 border-t border-[color:var(--color-border)] pt-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--color-fg-subtle)]">
        Recent syncs
      </p>
      <ul className="mt-2 space-y-1">
        {snapshots.map((s) => (
          <li key={s.id} className="flex items-baseline gap-3 text-[12px]">
            <span className="font-mono text-[11px] text-[color:var(--color-fg-subtle)]">
              {formatRelative(s.fetchedAt.toISOString())}
            </span>
            {s.error ? (
              <span className="truncate text-[color:var(--color-danger)]" title={s.error}>
                ✕ {trimError(s.error)}
              </span>
            ) : (
              <span className="text-[color:var(--color-fg-muted)]">
                ✓ <span className="font-mono text-[11px]">{hashPrefix(s.contentHash)}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function hashPrefix(hash: string): string {
  return hash.length > 10 ? hash.slice(0, 10) : hash;
}

function trimError(msg: string): string {
  const firstLine = msg.split("\n")[0] ?? msg;
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine;
}

// Re-export for callers that type against the model directly.
export type { MarketplaceSnapshot };
