import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { limit, rateLimitHeaders, clientKey } from "@/lib/rate-limit";

describe("limit()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("allows the first N requests within the window", () => {
    for (let i = 0; i < 5; i++) {
      const r = limit(`k1-${i}`, 5);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4);
    }
  });

  it("denies the N+1th request within the window", () => {
    const key = `k2-${Math.random()}`;
    let last = limit(key, 3);
    expect(last.allowed).toBe(true);
    last = limit(key, 3);
    expect(last.allowed).toBe(true);
    last = limit(key, 3);
    expect(last.allowed).toBe(true);
    last = limit(key, 3);
    expect(last.allowed).toBe(false);
  });

  it("resets after the 60s window elapses", () => {
    const key = `k3-${Math.random()}`;
    for (let i = 0; i < 3; i++) limit(key, 3);
    expect(limit(key, 3).allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(limit(key, 3).allowed).toBe(true);
  });
});

describe("rateLimitHeaders", () => {
  it("emits standard x-ratelimit-* headers", () => {
    const headers = rateLimitHeaders({
      allowed: true,
      remaining: 12,
      resetAt: 1_700_000_000_000,
      limit: 60,
    });
    expect(headers).toMatchObject({
      "x-ratelimit-limit": "60",
      "x-ratelimit-remaining": "12",
    });
    expect((headers as Record<string, string>)["x-ratelimit-reset"]).toBe("1700000000");
  });
});

describe("clientKey", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 9.9.9.9" },
    });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "5.6.7.8" },
    });
    expect(clientKey(req)).toBe("5.6.7.8");
  });

  it("uses a default when both headers absent", () => {
    expect(clientKey(new Request("https://example.com"))).toBe("local");
  });
});
