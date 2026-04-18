import { prisma } from "./prisma";
import type { Source } from "./types";
import { plugins } from "@/data/plugins";

/**
 * Count of plugins observed for each source. Will be replaced by a DB query
 * once plugins migrate off the static fixture in M1.
 */
function pluginCountFor(sourceKey: string): number {
  return plugins.filter((p) => p.sourceId === sourceKey).length;
}

/**
 * All sources visible to the catalog, oldest-first so the built-in seed
 * rows (official → verified → internal) always lead regardless of when
 * user-added sources appeared.
 */
export async function listAllSources(): Promise<Source[]> {
  const rows = await prisma.source.findMany({
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.key,
    name: row.name,
    kind: (row.kind as Source["kind"]) ?? "http",
    url: row.url ?? undefined,
    trust: (row.trust as Source["trust"]) ?? "community",
    lastSyncedAt: row.updatedAt.toISOString(),
    pluginCount: pluginCountFor(row.key),
  }));
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
