import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight admin gate. When ATRIUM_AUTH_MODE=admin-password, requests to
 * /admin/* without a session cookie are redirected to /login. We don't do
 * HMAC verification here (middleware runs at the edge and we want to avoid
 * platform-specific crypto) — the admin page itself enforces the signature
 * via `isAdmin()` on the server, so this is defense-in-depth.
 */
export function middleware(req: NextRequest) {
  const mode = process.env.ATRIUM_AUTH_MODE ?? "open";
  if (mode !== "admin-password") return NextResponse.next();

  const path = req.nextUrl.pathname;
  if (!path.startsWith("/admin")) return NextResponse.next();

  const session = req.cookies.get("atrium-session")?.value;
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
