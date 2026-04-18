"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/users";

export interface CreateSuggestionState {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Partial<Record<"title" | "body" | "kind", string>>;
}

// Suggestion kinds are intentionally about *what agents should do better*,
// not about Atrium-the-product. Bugs in Atrium itself belong on GitHub.
const KINDS = new Set([
  "plugin-request",
  "skill-request",
  "capability-gap",
  "integration",
  "general",
]);
const PROVIDERS = new Set(["claude-code", "openai", "gemini", "mcp", "generic"]);

export async function createSuggestionAction(
  _prev: CreateSuggestionState,
  formData: FormData,
): Promise<CreateSuggestionState> {
  const title = (formData.get("title") ?? "").toString().trim();
  const body = (formData.get("body") ?? "").toString().trim();
  const kind = (formData.get("kind") ?? "plugin-request").toString();
  const provider = (formData.get("provider") ?? "").toString();

  const fieldErrors: CreateSuggestionState["fieldErrors"] = {};
  if (title.length < 4) fieldErrors.title = "Needs at least 4 characters";
  if (title.length > 160) fieldErrors.title = "Keep it under 160 characters";
  if (body.length < 10) fieldErrors.body = "Needs at least 10 characters";
  if (body.length > 4000) fieldErrors.body = "Keep it under 4000 characters";
  if (!KINDS.has(kind)) fieldErrors.kind = "Invalid kind";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  try {
    const user = await currentUser();
    const created = await prisma.suggestion.create({
      data: {
        title,
        body,
        kind,
        provider: provider && PROVIDERS.has(provider) ? provider : null,
        createdBy: user.id,
        createdByName: user.name,
      },
    });

    // Auto-upvote own suggestion (one vote).
    await prisma.suggestionVote
      .create({
        data: {
          suggestionId: created.id,
          userId: user.id,
        },
      })
      .catch(() => {});
    await prisma.suggestion.update({
      where: { id: created.id },
      data: { votes: 1 },
    }).catch(() => {});

    revalidatePath("/suggestions");
    redirect(`/suggestions/${created.id}`);
  } catch (err) {
    // next/navigation `redirect()` throws a NEXT_REDIRECT sentinel — let it bubble.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function toggleVoteAction(suggestionId: string): Promise<{ ok: boolean; voted: boolean; votes: number; error?: string }> {
  const user = await currentUser();
  try {
    const existing = await prisma.suggestionVote.findUnique({
      where: {
        suggestionId_userId: {
          suggestionId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      await prisma.suggestionVote.delete({ where: { id: existing.id } });
      await prisma.suggestion.update({
        where: { id: suggestionId },
        data: { votes: { decrement: 1 } },
      });
      const s = await prisma.suggestion.findUnique({ where: { id: suggestionId }, select: { votes: true } });
      revalidatePath("/suggestions");
      revalidatePath(`/suggestions/${suggestionId}`);
      return { ok: true, voted: false, votes: s?.votes ?? 0 };
    }

    await prisma.suggestionVote.create({
      data: { suggestionId, userId: user.id },
    });
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: { votes: { increment: 1 } },
    });
    const s = await prisma.suggestion.findUnique({ where: { id: suggestionId }, select: { votes: true } });
    revalidatePath("/suggestions");
    revalidatePath(`/suggestions/${suggestionId}`);
    return { ok: true, voted: true, votes: s?.votes ?? 0 };
  } catch (err) {
    return {
      ok: false,
      voted: false,
      votes: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function setSuggestionStatusAction(
  id: string,
  status: "open" | "under-review" | "in-progress" | "shipped" | "closed",
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.suggestion.update({ where: { id }, data: { status } });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "POLICY_UPDATE",
          targetKind: "suggestion",
          targetId: id,
          detail: `status → ${status}`,
        },
      })
      .catch(() => {});
    revalidatePath("/suggestions");
    revalidatePath(`/suggestions/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
