import { prisma } from "./prisma";
import type { Plugin, PluginCategory } from "./types";

/** Stable composite key: `<sourceId>:<pluginSlug>` */
export function pluginKey(plugin: Pick<Plugin, "sourceId" | "slug">): string {
  return `${plugin.sourceId}:${plugin.slug}`;
}

/**
 * Merges persisted PluginOverride records into the static plugin list.
 * Overrides can change: category, keywords, pinned version, hidden flag.
 *
 * Returns a fresh array; never mutates the inputs.
 */
export async function hydratePlugins(plugins: Plugin[]): Promise<Plugin[]> {
  if (plugins.length === 0) return plugins;

  const keys = plugins.map(pluginKey);
  const overrides = await prisma.pluginOverride
    .findMany({ where: { pluginKey: { in: keys } } })
    .catch(() => []);

  if (overrides.length === 0) return plugins;

  const byKey = new Map(overrides.map((o) => [o.pluginKey, o]));
  return plugins
    .map((p) => {
      const o = byKey.get(pluginKey(p));
      if (!o) return p;
      const next: Plugin = { ...p };
      if (o.categoryOverride) {
        next.category = o.categoryOverride as PluginCategory;
      }
      if (o.keywordsOverride) {
        try {
          const parsed = JSON.parse(o.keywordsOverride);
          if (Array.isArray(parsed)) {
            next.keywords = parsed.filter((k): k is string => typeof k === "string");
          }
        } catch {
          /* ignore parse failure, keep original */
        }
      }
      if (o.pinnedVersion) {
        next.pinnedVersion = o.pinnedVersion;
        // Expose pinned version as the surface version too, so browse UI matches.
        next.version = o.pinnedVersion;
      }
      if (o.hidden) {
        // Hidden means "not visible in browse"; we filter below.
        return null;
      }
      return next;
    })
    .filter((p): p is Plugin => p !== null);
}

export async function setOverride(
  key: string,
  data: {
    categoryOverride?: string | null;
    keywordsOverride?: string[] | null;
    pinnedVersion?: string | null;
    hidden?: boolean;
    note?: string;
  },
) {
  const existing = await prisma.pluginOverride.findUnique({ where: { pluginKey: key } });
  const keywordsJson =
    data.keywordsOverride === null
      ? null
      : data.keywordsOverride
        ? JSON.stringify(data.keywordsOverride)
        : undefined;

  if (existing) {
    return prisma.pluginOverride.update({
      where: { pluginKey: key },
      data: {
        categoryOverride:
          data.categoryOverride === undefined ? undefined : data.categoryOverride,
        keywordsOverride: keywordsJson,
        pinnedVersion: data.pinnedVersion === undefined ? undefined : data.pinnedVersion,
        hidden: data.hidden,
        note: data.note,
      },
    });
  }
  return prisma.pluginOverride.create({
    data: {
      pluginKey: key,
      categoryOverride: data.categoryOverride ?? null,
      keywordsOverride: keywordsJson ?? null,
      pinnedVersion: data.pinnedVersion ?? null,
      hidden: data.hidden ?? false,
      note: data.note,
    },
  });
}
