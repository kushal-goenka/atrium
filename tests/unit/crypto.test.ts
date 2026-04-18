import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";

const saved = process.env.AUTH_SECRET;

describe("crypto (AES-256-GCM)", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long-enough";
  });
  afterAll(() => {
    if (saved !== undefined) process.env.AUTH_SECRET = saved;
    else delete process.env.AUTH_SECRET;
  });

  it("round-trips a short value", () => {
    const ct = encryptSecret("hello");
    expect(ct.startsWith("v1:")).toBe(true);
    expect(decryptSecret(ct)).toBe("hello");
  });

  it("round-trips a realistic API key", () => {
    const key = "sk-proj-" + "a".repeat(48);
    const ct = encryptSecret(key);
    expect(decryptSecret(ct)).toBe(key);
  });

  it("produces different ciphertexts for identical plaintexts (fresh IV)", () => {
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("fails closed on tampered ciphertext", () => {
    const ct = encryptSecret("secret");
    const [v, iv, tag, ctB64] = ct.split(":");
    // Flip a bit in the ciphertext payload.
    const bad = Buffer.from(ctB64!, "base64");
    bad[0] ^= 0x01;
    const tampered = `${v}:${iv}:${tag}:${bad.toString("base64")}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("fails on version mismatch", () => {
    expect(() => decryptSecret("v999:a:b:c")).toThrow(/unsupported/);
  });

  it("refuses to operate without AUTH_SECRET", () => {
    const cur = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    expect(() => encryptSecret("x")).toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = cur;
  });

  it("refuses a short AUTH_SECRET", () => {
    const cur = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "too-short";
    expect(() => encryptSecret("x")).toThrow(/32/);
    process.env.AUTH_SECRET = cur;
  });
});

describe("maskSecret", () => {
  it("shows last 4 characters with bullets for the rest", () => {
    expect(maskSecret("sk-abcdef")).toContain("cdef");
    expect(maskSecret("sk-abcdef")).toMatch(/^•+/);
  });

  it("caps bullet count for very long secrets", () => {
    const masked = maskSecret("x".repeat(100));
    expect(masked.length).toBeLessThanOrEqual(20);
  });

  it("gracefully handles short values", () => {
    expect(maskSecret("ab")).toBe("••••");
  });
});
