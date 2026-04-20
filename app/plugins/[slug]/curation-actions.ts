"use server";

import { revalidatePath } from "next/cache";
import { findPluginBySlug } from "@/lib/plugins-repo";
import { prisma } from "@/lib/prisma";
import { suggestCuration } from "@/lib/ai/curation";
import { pluginKey, setOverride } from "@/lib/overrides";

export interface SuggestResult {
  ok: boolean;
  category?: string;
  keywords?: string[];
  rationale?: string;
  provider?: string;
  model?: string;
  error?: string;
}

export async function suggestCurationAction(slug: string): Promise<SuggestResult> {
  const plugin = await findPluginBySlug(slug);
  if (!plugin) return { ok: false, error: "plugin not found" };

  try {
    const s = await suggestCuration(plugin);
    await prisma.curationSuggestion.create({
      data: {
        pluginKey: pluginKey(plugin),
        field: "category+keywords",
        suggested: JSON.stringify({ category: s.category, keywords: s.keywords }),
        generatedBy: s.provider,
      },
    });
    return {
      ok: true,
      category: s.category,
      keywords: s.keywords,
      rationale: s.rationale,
      provider: s.provider,
      model: s.model,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function applyCurationAction(
  slug: string,
  category: string,
  keywords: string[],
): Promise<{ ok: boolean; error?: string }> {
  const plugin = await findPluginBySlug(slug);
  if (!plugin) return { ok: false, error: "plugin not found" };

  try {
    await setOverride(pluginKey(plugin), {
      categoryOverride: category,
      keywordsOverride: keywords,
      note: "curation applied",
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "POLICY_UPDATE",
          targetKind: "plugin",
          targetId: slug,
          detail: `curation: ${category}, ${keywords.length} tags`,
        },
      })
      .catch(() => {});
    revalidatePath("/");
    revalidatePath(`/plugins/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
