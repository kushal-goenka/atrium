import { describe, it, expect } from "vitest";
import { generateToken, hashToken, requireScope, type AuthResult } from "@/lib/api-auth";

describe("generateToken", () => {
  it("produces a prefixed 32-hex-char token", () => {
    const t = generateToken();
    expect(t).toMatch(/^at_[0-9a-f]{32}$/);
  });

  it("produces different tokens on each call", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(set.size).toBe(100);
  });
});

describe("hashToken", () => {
  it("produces a stable SHA-256 hex for identical inputs", () => {
    const a = hashToken("at_abc");
    const b = hashToken("at_abc");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("differs across inputs", () => {
    expect(hashToken("at_a")).not.toBe(hashToken("at_b"));
  });
});

describe("requireScope", () => {
  const auth: AuthResult = {
    tokenId: "t",
    userId: "u",
    scopes: new Set(["read:catalog"]),
    name: "test",
  };

  it("allows when scope present", () => {
    expect(requireScope(auth, "read:catalog")).toBeNull();
  });

  it("denies when scope missing", () => {
    const err = requireScope(auth, "write:sources");
    expect(err).toMatch(/missing scope: write:sources/);
  });

  it("denies when unauthenticated", () => {
    const err = requireScope(null, "read:catalog");
    expect(err).toMatch(/bearer token required/);
  });
});
