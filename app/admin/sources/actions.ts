"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSource, slugifyKey } from "@/lib/sources";
import { prisma } from "@/lib/prisma";
import { fetchFromGit } from "@/lib/ingest/git";
import { fetchFromHttp } from "@/lib/ingest/http";

export interface CreateSourceState {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "kind" | "url" | "trust", string>>;
}

export async function createSourceAction(
  _prev: CreateSourceState,
  formData: FormData,
): Promise<CreateSourceState> {
  const name = (formData.get("name") ?? "").toString().trim();
  const kind = (formData.get("kind") ?? "").toString().trim() as "git" | "http" | "local";
  const url = (formData.get("url") ?? "").toString().trim();
  const trust = (formData.get("trust") ?? "community").toString().trim() as
    | "official"
    | "verified"
    | "community"
    | "internal";

  const fieldErrors: CreateSourceState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Required";
  if (!["git", "http", "local"].includes(kind)) fieldErrors.kind = "Pick a source kind";
  if (kind !== "local" && !url) fieldErrors.url = "Required for this source kind";
  if (url && !/^https?:\/\//.test(url) && kind !== "local") {
    fieldErrors.url = "Must be a full https:// URL";
  }
  if (!["official", "verified", "community", "internal"].includes(trust)) {
    fieldErrors.trust = "Invalid trust tier";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  try {
    const key = slugifyKey(name);
    if (!key) return { ok: false, error: "Name must contain letters or numbers." };

    await createSource({
      key,
      name,
      kind,
      url: url || undefined,
      trust,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "A source with that name already exists." };
    }
    return { ok: false, error: `Failed to create source: ${msg}` };
  }

  revalidatePath("/admin");
  revalidatePath("/sources");
  redirect("/admin");
}

export interface SyncSourceResult {
  ok: boolean;
  pluginCount?: number;
  error?: string;
  unchanged?: boolean;
}

/**
 * Runs an ingest against the named source, stores a MarketplaceSnapshot,
 * and writes an AuditLog row. Returns a serializable result for the UI.
 *
 * The plugin-table reconciliation (upserting Plugin + PluginVersion from the
 * parsed manifest) is intentionally deferred — ships in the follow-up PR
 * alongside plugin migration off the static fixture.
 */
export async function syncSourceAction(sourceKey: string): Promise<SyncSourceResult> {
  const source = await prisma.source.findUnique({ where: { key: sourceKey } });
  if (!source) return { ok: false, error: `Unknown source: ${sourceKey}` };
  if (source.kind === "local") {
    return { ok: false, error: "Local sources can't be auto-synced — re-upload instead." };
  }
  if (!source.url) return { ok: false, error: "Source has no URL to sync from." };

  let contentHash: string;
  let raw: string;
  let pluginCount: number;

  try {
    const result =
      source.kind === "git"
        ? await fetchFromGit(source.url)
        : await fetchFromHttp(source.url);
    contentHash = result.contentHash;
    raw = result.raw;
    pluginCount = result.manifest.plugins.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.marketplaceSnapshot
      .create({
        data: {
          sourceId: source.id,
          contentHash: `error-${Date.now()}`,
          manifest: "",
          error: msg,
        },
      })
      .catch(() => {
        /* best-effort audit; never throw back to the caller for this */
      });
    return { ok: false, error: msg };
  }

  // Dedupe: if we've already seen this exact manifest, record the sync but
  // don't create a new snapshot.
  const existing = await prisma.marketplaceSnapshot.findFirst({
    where: { sourceId: source.id, contentHash },
  });

  if (existing) {
    await prisma.source.update({
      where: { id: source.id },
      data: { updatedAt: new Date() },
    });
    await recordAudit("SOURCE_SYNC", "source", source.id, `no changes · ${pluginCount} plugins`);
    revalidatePath("/admin");
    revalidatePath("/sources");
    return { ok: true, pluginCount, unchanged: true };
  }

  await prisma.marketplaceSnapshot.create({
    data: {
      sourceId: source.id,
      contentHash,
      manifest: raw,
    },
  });
  await prisma.source.update({
    where: { id: source.id },
    data: { updatedAt: new Date() },
  });
  await recordAudit("SOURCE_SYNC", "source", source.id, `${pluginCount} plugins observed`);

  revalidatePath("/admin");
  revalidatePath("/sources");
  return { ok: true, pluginCount };
}

async function recordAudit(
  action: string,
  targetKind: string,
  targetId: string,
  detail: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorKind: "system",
        action,
        targetKind,
        targetId,
        detail,
      },
    });
  } catch {
    // Audit failures are not a user-facing error surface.
  }
}
