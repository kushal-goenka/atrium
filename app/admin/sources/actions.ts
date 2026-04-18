"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSource, slugifyKey } from "@/lib/sources";

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
