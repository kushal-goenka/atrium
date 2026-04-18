import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Minimal AES-256-GCM wrapper for storing secrets at rest.
 *
 * The encryption key is derived from `AUTH_SECRET` via SHA-256. This means:
 *   - Rotating `AUTH_SECRET` invalidates all existing ciphertexts.
 *   - Secrets aren't recoverable without the runtime env.
 *   - No user input is ever used as a key directly.
 *
 * Ciphertext layout on disk (string): `v1:${iv_b64}:${tag_b64}:${ct_b64}`.
 * The `v1` prefix gives us a migration lane if we ever change primitives.
 */

const VERSION = "v1";

function keyFromEnv(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a 32+ character string before encrypting secrets.",
    );
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plaintext: string): string {
  const key = keyFromEnv();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error(`unsupported ciphertext version: ${parts[0] ?? "?"}`);
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const key = keyFromEnv();
  const iv = Buffer.from(ivB64!, "base64");
  const tag = Buffer.from(tagB64!, "base64");
  const ct = Buffer.from(ctB64!, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/** Masks a secret for display — keeps the last 4 chars visible. */
export function maskSecret(value: string): string {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(value.length - 4, 16))}${value.slice(-4)}`;
}
