import { prisma } from "./prisma";
import type { Source } from "./types";
import { sources as staticSources } from "@/data/plugins";

/**
 * Lists all sources visible to the catalog: the built-in seed sources plus
 * any sources admins have added via the Add-source flow.
 *
 * Reads are ordered to prefer DB rows over static duplicates by `key`.
 */
export async function listAllSources(): Promise<Source[]> {
  const dbRows = await prisma.source
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch(() => []);

  const dbSources: Source[] = dbRows.map((row) => ({
    id: row.key,
    name: row.name,
    kind: (row.kind as Source["kind"]) ?? "http",
    url: row.url ?? undefined,
    trust: (row.trust as Source["trust"]) ?? "community",
    lastSyncedAt: row.updatedAt.toISOString(),
    pluginCount: 0, // populated lazily; 0 until first sync
  }));

  const seen = new Set(dbSources.map((s) => s.id));
  const merged = [...dbSources, ...staticSources.filter((s) => !seen.has(s.id))];
  return merged;
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
