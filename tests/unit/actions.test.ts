/**
 * Server-action validation tests.
 *
 * These exercise the pure validation pathway of `createSourceAction` — they
 * don't hit the database because validation fails before that. Prisma-hitting
 * tests would be better placed in an integration harness with a test DB.
 */

import { describe, it, expect, vi } from "vitest";

// Stub next/cache and next/navigation since the action imports them at module load.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/sources", async () => {
  const actual = await vi.importActual<typeof import("@/lib/sources")>("@/lib/sources");
  return { ...actual, createSource: vi.fn() };
});

import { createSourceAction } from "@/app/admin/sources/actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("createSourceAction validation", () => {
  it("rejects empty name", async () => {
    const state = await createSourceAction(
      { ok: false },
      fd({ name: "", kind: "git", url: "https://x.com/y", trust: "community" }),
    );
    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.name).toBe("Required");
  });

  it("rejects missing url when kind is git", async () => {
    const state = await createSourceAction(
      { ok: false },
      fd({ name: "X", kind: "git", url: "", trust: "community" }),
    );
    expect(state.fieldErrors?.url).toMatch(/required/i);
  });

  it("accepts empty url when kind is local", async () => {
    // local is a legitimate "no url" kind.
    await expect(
      createSourceAction(
        { ok: false },
        fd({ name: "Local uploads", kind: "local", url: "", trust: "internal" }),
      ),
    ).rejects.toThrow(/REDIRECT:\/admin/);
  });

  it("rejects non-http(s) urls for git/http kinds", async () => {
    const state = await createSourceAction(
      { ok: false },
      fd({ name: "X", kind: "http", url: "ftp://example.com/mkt.json", trust: "community" }),
    );
    expect(state.fieldErrors?.url).toMatch(/https?:\/\//i);
  });

  it("rejects invalid trust tier", async () => {
    const state = await createSourceAction(
      { ok: false },
      fd({ name: "X", kind: "git", url: "https://x.com/y", trust: "vip" }),
    );
    expect(state.fieldErrors?.trust).toBeDefined();
  });

  it("rejects invalid kind", async () => {
    const state = await createSourceAction(
      { ok: false },
      fd({ name: "X", kind: "torrent", url: "https://x.com/y", trust: "community" }),
    );
    expect(state.fieldErrors?.kind).toBeDefined();
  });
});
