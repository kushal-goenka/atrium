"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findPluginBySlug } from "@/lib/plugins-repo";
import { pluginKey, setOverride } from "@/lib/overrides";

export async function pinVersionAction(
  slug: string,
  version: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const plugin = await findPluginBySlug(slug);
  if (!plugin) return { ok: false, error: "plugin not found" };

  // Allow pinning to null (i.e. unpinning).
  if (version !== null) {
    const valid = plugin.versions.some((v) => v.version === version);
    if (!valid) return { ok: false, error: `unknown version: ${version}` };
  }

  try {
    await setOverride(pluginKey(plugin), {
      pinnedVersion: version,
      note: version ? `pinned to ${version}` : "unpinned",
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "POLICY_UPDATE",
          targetKind: "plugin",
          targetId: slug,
          detail: version ? `pinned to ${version}` : "unpinned",
        },
      })
      .catch(() => {});
    revalidatePath("/");
    revalidatePath(`/plugins/${slug}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function forkPluginAction(
  slug: string,
  opts: { internalSourceKey: string; note?: string },
): Promise<{ ok: boolean; forkKey?: string; error?: string }> {
  const plugin = await findPluginBySlug(slug);
  if (!plugin) return { ok: false, error: "plugin not found" };
  if (plugin.sourceId === opts.internalSourceKey) {
    return { ok: false, error: "already in the internal source" };
  }

  const internalSource = await prisma.source.findUnique({
    where: { key: opts.internalSourceKey },
  });
  if (!internalSource) {
    return { ok: false, error: `unknown internal source: ${opts.internalSourceKey}` };
  }
  if (internalSource.kind !== "local") {
    return { ok: false, error: "forks can only target local sources" };
  }

  const forkSlug = await nextAvailableSlug(opts.internalSourceKey, `${plugin.slug}-fork`);

  try {
    await prisma.pluginFork.create({
      data: {
        forkSlug,
        forkSourceKey: opts.internalSourceKey,
        upstreamSlug: plugin.slug,
        upstreamSourceKey: plugin.sourceId,
        forkedAtVersion: plugin.version,
        snapshotManifest: JSON.stringify(plugin),
        notes: opts.note,
      },
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "POLICY_UPDATE",
          targetKind: "plugin",
          targetId: slug,
          detail: `forked to ${opts.internalSourceKey}:${forkSlug} @ ${plugin.version}`,
        },
      })
      .catch(() => {});
    revalidatePath("/admin/forks");
    revalidatePath(`/plugins/${slug}`);
    return { ok: true, forkKey: `${opts.internalSourceKey}:${forkSlug}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function nextAvailableSlug(sourceKey: string, base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.pluginFork.findFirst({
      where: { forkSourceKey: sourceKey, forkSlug: candidate },
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
