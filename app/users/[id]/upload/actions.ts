"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/users";
import { slugifyKey } from "@/lib/sources";

export interface UploadSkillState {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description" | "body" | "category", string>>;
}

const CATEGORIES = new Set([
  "productivity",
  "data",
  "devops",
  "security",
  "design",
  "writing",
  "research",
  "ops",
  "finance",
  "sales",
  "other",
]);

export async function uploadSkillAction(
  _prev: UploadSkillState,
  formData: FormData,
): Promise<UploadSkillState> {
  const targetUserId = (formData.get("targetUserId") ?? "").toString();
  const name = (formData.get("name") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const body = (formData.get("body") ?? "").toString();
  const category = (formData.get("category") ?? "other").toString();
  const keywords = (formData.get("keywords") ?? "").toString().trim();

  // Uploading is always on the current user's profile. We reject impersonation
  // attempts via URL manipulation.
  const me = await currentUser();
  if (targetUserId && targetUserId !== me.id) {
    return { ok: false, error: "You can only upload skills on your own profile." };
  }

  const fieldErrors: UploadSkillState["fieldErrors"] = {};
  if (name.length < 3) fieldErrors.name = "Name must be at least 3 characters";
  if (name.length > 80) fieldErrors.name = "Keep name under 80 characters";
  if (description.length < 10) fieldErrors.description = "Describe what the skill does (10+ chars)";
  if (description.length > 400) fieldErrors.description = "Keep description under 400 characters";
  if (body.length < 40) fieldErrors.body = "Body is too short — paste your SKILL.md contents (40+ chars)";
  if (body.length > 40_000) fieldErrors.body = "Body too large (40kb limit)";
  if (!CATEGORIES.has(category)) fieldErrors.category = "Invalid category";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const baseSlug = slugifyKey(`${me.id}-${name}`);
  const slug = await uniqueSlug(baseSlug);

  try {
    const created = await prisma.uploadedSkill.create({
      data: {
        slug,
        name,
        description,
        body,
        keywords,
        category,
        uploadedBy: me.id,
        uploaderName: me.name,
      },
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "user",
          action: "POLICY_UPDATE",
          targetKind: "uploaded_skill",
          targetId: created.id,
          detail: `${me.id} uploaded "${name}" (awaiting review)`,
        },
      })
      .catch(() => {});
    revalidatePath(`/users/${me.id}`);
    revalidatePath("/admin");
    redirect(`/users/${me.id}?uploaded=${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function reviewUploadedSkillAction(
  id: string,
  decision: "approved" | "rejected",
): Promise<{ ok: boolean; error?: string }> {
  const me = await currentUser();
  if (me.role !== "admin" && me.role !== "curator") {
    return { ok: false, error: "only admins and curators can review uploads" };
  }

  try {
    const updated = await prisma.uploadedSkill.update({
      where: { id },
      data: { policyState: decision },
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: decision === "approved" ? "PLUGIN_APPROVE" : "PLUGIN_BLOCK",
          targetKind: "uploaded_skill",
          targetId: id,
          detail: `${updated.name}: ${decision}`,
        },
      })
      .catch(() => {});
    revalidatePath("/admin/uploads");
    revalidatePath(`/users/${updated.uploadedBy}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.uploadedSkill.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
