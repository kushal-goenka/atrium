"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { testProvider } from "@/lib/ai/client";

export interface UpsertProviderState {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"provider" | "displayName" | "apiKey" | "baseUrl" | "defaultModel", string>>;
}

const ALLOWED = new Set([
  "anthropic",
  "openai",
  "azure-openai",
  "gemini",
  "litellm-proxy",
  "custom",
]);

export async function upsertProviderAction(
  _prev: UpsertProviderState,
  formData: FormData,
): Promise<UpsertProviderState> {
  const provider = (formData.get("provider") ?? "").toString().trim();
  const displayName = (formData.get("displayName") ?? "").toString().trim();
  const apiKey = (formData.get("apiKey") ?? "").toString();
  const baseUrl = (formData.get("baseUrl") ?? "").toString().trim();
  const defaultModel = (formData.get("defaultModel") ?? "").toString().trim();
  const enabled = formData.get("enabled") === "on";

  const fieldErrors: UpsertProviderState["fieldErrors"] = {};
  if (!ALLOWED.has(provider)) fieldErrors.provider = "Pick a supported provider";
  if (!displayName) fieldErrors.displayName = "Required";
  if (!apiKey || apiKey.length < 8) fieldErrors.apiKey = "API key looks too short";
  if (baseUrl && !/^https?:\/\//.test(baseUrl)) fieldErrors.baseUrl = "Must be a full URL";

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  try {
    const cipher = encryptSecret(apiKey);
    const tail = apiKey.slice(-4);

    await prisma.providerConfig.upsert({
      where: { provider },
      create: {
        provider,
        displayName,
        apiKeyCipher: cipher,
        apiKeyTail: tail,
        baseUrl: baseUrl || null,
        defaultModel: defaultModel || null,
        enabled,
      },
      update: {
        displayName,
        apiKeyCipher: cipher,
        apiKeyTail: tail,
        baseUrl: baseUrl || null,
        defaultModel: defaultModel || null,
        enabled,
      },
    });

    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "TOKEN_CREATE",
          targetKind: "provider",
          targetId: provider,
          detail: `key …${tail} registered`,
        },
      })
      .catch(() => {});
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  revalidatePath("/admin/providers");
  return { ok: true };
}

export async function deleteProviderAction(providerKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.providerConfig.delete({ where: { provider: providerKey } });
    await prisma.auditLog
      .create({
        data: {
          actorKind: "admin",
          action: "TOKEN_REVOKE",
          targetKind: "provider",
          targetId: providerKey,
          detail: "provider removed",
        },
      })
      .catch(() => {});
    revalidatePath("/admin/providers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function testProviderAction(providerKey: string) {
  return testProvider(providerKey);
}
