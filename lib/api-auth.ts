import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

/**
 * API token model:
 *   - user-visible form: `at_<32 hex chars>` (shown once on creation)
 *   - stored form:       SHA-256 hex of the user-visible form
 *
 * Scopes are stored as a CSV string in ApiToken.scopes. Built-in scopes:
 *   - "read:catalog"  — list/detail plugins + sources + metrics
 *   - "write:sources" — create/update sources
 *   - "write:plugins" — approve/quarantine/override plugins
 *
 * The token grants whatever union of scopes was assigned at creation.
 */

export type Scope = "read:catalog" | "write:sources" | "write:plugins";

export function generateToken(): string {
  return `at_${randomBytes(16).toString("hex")}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createApiToken(input: {
  userId: string;
  name: string;
  scopes: Scope[];
  expiresAt?: Date | null;
}) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const row = await prisma.apiToken.create({
    data: {
      userId: input.userId,
      name: input.name,
      tokenHash,
      scopes: input.scopes.join(","),
      expiresAt: input.expiresAt ?? null,
    },
  });
  // Return the plaintext once — caller is responsible for showing it to the
  // user and then discarding. DB never persists the plaintext.
  return { token, id: row.id };
}

export async function verifyBearer(req: Request): Promise<AuthResult | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const raw = match[1]!.trim();
  if (!raw.startsWith("at_")) return null;

  const tokenHash = hashToken(raw);
  const row = await prisma.apiToken.findUnique({ where: { tokenHash } });
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  const scopes = row.scopes.split(",").map((s) => s.trim()) as Scope[];

  // Fire-and-forget lastUsedAt update. Errors swallowed — this is telemetry.
  prisma.apiToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    tokenId: row.id,
    userId: row.userId,
    scopes: new Set(scopes),
    name: row.name,
  };
}

export interface AuthResult {
  tokenId: string;
  userId: string;
  scopes: Set<Scope>;
  name: string;
}

export function requireScope(auth: AuthResult | null, scope: Scope): string | null {
  if (!auth) return "bearer token required";
  if (!auth.scopes.has(scope)) return `token missing scope: ${scope}`;
  return null;
}
