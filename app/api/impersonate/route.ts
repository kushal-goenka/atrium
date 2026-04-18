import { NextResponse } from "next/server";
import { ACTING_AS_COOKIE, MOCK_USERS } from "@/lib/users";

export const runtime = "nodejs";

/**
 * Dev-only "acting as" endpoint used by the user switcher in the nav.
 * Real SSO replaces this in v0.2; impersonation becomes admin-scoped then.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const userId = form?.get("userId")?.toString() ?? "";
  const redirectTo = form?.get("redirectTo")?.toString() || "/";

  const valid = MOCK_USERS.some((u) => u.id === userId);
  if (!valid) return NextResponse.json({ ok: false, error: "unknown user" }, { status: 400 });

  const res = NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  res.cookies.set(ACTING_AS_COOKIE, userId, {
    httpOnly: false, // client needs to read it for display (demo only)
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
