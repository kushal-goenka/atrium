import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  getAuthMode,
  getConfiguredPassword,
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const password = form?.get("password")?.toString() ?? "";
  const next = form?.get("next")?.toString() || "/admin";

  if (getAuthMode() !== "admin-password") {
    return NextResponse.redirect(new URL(next, req.url), { status: 303 });
  }

  const configured = getConfiguredPassword();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "ATRIUM_ADMIN_PASSWORD not set" },
      { status: 500 },
    );
  }

  // Constant-time string compare via Buffer + timingSafeEqual.
  const a = Buffer.from(password);
  const b = Buffer.from(configured);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (!match) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
