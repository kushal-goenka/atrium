"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createApiToken, type Scope } from "@/lib/api-auth";
import { currentUser } from "@/lib/users";

export interface CreateTokenResult {
  ok: boolean;
  /** Plaintext token — shown to the admin exactly once. */
  token?: string;
  tokenId?: string;
  name?: string;
  error?: string;
}

const VALID_SCOPES: Scope[] = ["read:catalog", "write:sources", "write:plugins"];

export async function createTokenAction(formData: FormData): Promise<CreateTokenResult> {
  const name = (formData.get("name") ?? "").toString().trim();
  if (!name) return { ok: false, error: "name required" };

  const scopes = VALID_SCOPES.filter((s) => formData.get(`scope:${s}`) === "on");
  if (scopes.length === 0) return { ok: false, error: "select at least one scope" };

  const user = await currentUser();

  try {
    const { token, id } = await createApiToken({
      userId: user.id,
      name,
      scopes,
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "TOKEN_CREATE",
          targetKind: "api_token",
          targetId: id,
          detail: `"${name}" scopes=${scopes.join(",")}`,
        },
      })
      .catch(() => {});
    revalidatePath("/admin/tokens");
    return { ok: true, token, tokenId: id, name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function revokeTokenAction(tokenId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "TOKEN_REVOKE",
          targetKind: "api_token",
          targetId: tokenId,
          detail: "revoked via admin UI",
        },
      })
      .catch(() => {});
    revalidatePath("/admin/tokens");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
