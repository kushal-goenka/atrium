import { prisma } from "./prisma";
import type { Source } from "./types";

/**
 * All sources visible to the catalog, oldest-first so the built-in seed
 * rows always lead regardless of when user-added sources appeared.
 *
 * `pluginCount` is computed with a single grouped query after the source
 * list is loaded.
 */
export async function listAllSources(): Promise<Source[]> {
  const [rows, counts] = await Promise.all([
    prisma.source.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.plugin.groupBy({
      by: ["sourceId"],
      _count: { _all: true },
    }),
  ]);

  const countBySourceId = new Map<string, number>();
  for (const c of counts) countBySourceId.set(c.sourceId, c._count._all);

  return rows.map((row) => ({
    id: row.key,
    name: row.name,
    kind: (row.kind as Source["kind"]) ?? "http",
    url: row.url ?? undefined,
    trust: (row.trust as Source["trust"]) ?? "community",
    lastSyncedAt: row.updatedAt.toISOString(),
    pluginCount: countBySourceId.get(row.id) ?? 0,
  }));
}

/** Look up a single source by its key (the stable external id). */
export async function findSourceByKey(key: string): Promise<Source | undefined> {
  const row = await prisma.source.findUnique({ where: { key } });
  if (!row) return undefined;
  const count = await prisma.plugin.count({ where: { sourceId: row.id } });
  return {
    id: row.key,
    name: row.name,
    kind: (row.kind as Source["kind"]) ?? "http",
    url: row.url ?? undefined,
    trust: (row.trust as Source["trust"]) ?? "community",
    lastSyncedAt: row.updatedAt.toISOString(),
    pluginCount: count,
  };
}

export interface NewSourceInput {
  key: string;
  name: string;
  kind: "git" | "http" | "local";
  url?: string;
  trust: "official" | "verified" | "community" | "internal";
}

export async function createSource(input: NewSourceInput) {
  return prisma.source.create({
    data: {
      key: input.key,
      name: input.name,
      kind: input.kind,
      url: input.url,
      trust: input.trust,
    },
  });
}

export function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
