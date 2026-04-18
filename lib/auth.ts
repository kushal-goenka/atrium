import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Atrium supports three auth modes, chosen via `ATRIUM_AUTH_MODE`:
 *
 *   - "open"            (default)   No login. Everyone sees everything that policy allows.
 *                                   Best for internal-only deployments behind a VPN/SSO proxy.
 *
 *   - "admin-password"  Simple.    /admin/* requires a shared password. Browse stays open.
 *                                   Set `ATRIUM_ADMIN_PASSWORD=…` to enable.
 *
 *   - "sso"             (planned)  OIDC / SAML per-user identity. Arrives in v0.2.
 *
 * Auth mode is independent of the user-switcher: that's a display concept for
 * impersonation, whereas AuthMode gates actions.
 */

export type AuthMode = "open" | "admin-password" | "sso";

const SESSION_COOKIE = "atrium-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h

export function getAuthMode(): AuthMode {
  const raw = (process.env.ATRIUM_AUTH_MODE ?? "open").toLowerCase();
  if (raw === "admin-password" || raw === "sso") return raw;
  return "open";
}

export function getConfiguredPassword(): string | null {
  const pwd = process.env.ATRIUM_ADMIN_PASSWORD;
  return pwd && pwd.length >= 8 ? pwd : null;
}

/**
 * True if the current viewer can take admin actions.
 * In "open" mode: always true.
 * In "admin-password" mode: only if the session cookie is present + valid.
 */
export async function isAdmin(): Promise<boolean> {
  const mode = getAuthMode();
  if (mode === "open") return true;
  if (mode === "sso") return false; // TODO v0.2 — NextAuth integration

  const store = await cookies();
  const sig = store.get(SESSION_COOKIE)?.value ?? "";
  return verifySession(sig);
}

export function signSession(): string {
  const secret = requireSecret();
  const payload = `admin:${Date.now()}`;
  const mac = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${mac}`;
}

export function verifySession(raw: string): boolean {
  if (!raw) return false;
  const parts = raw.split(":");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const [prefix, ts, macHex] = parts;
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE * 1000) return false;

  const secret = requireSecret();
  const expected = createHmac("sha256", secret).update(`${prefix}:${ts}`).digest("hex");
  const a = Buffer.from(macHex!, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be 32+ characters to use admin-password mode");
  }
  return s;
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
