import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchFromHttp } from "@/lib/ingest/http";

const MANIFEST = {
  name: "test-marketplace",
  plugins: [{ name: "x", description: "y", version: "1.0.0" }],
};

describe("fetchFromHttp", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.NODE_ENV;
  // Cast through unknown because @types/node marks NODE_ENV read-only
  // even though Node itself allows reassignment at runtime.
  const env = process.env as unknown as Record<string, string | undefined>;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    env.NODE_ENV = originalEnv;
  });

  it("fetches and parses a valid manifest", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(MANIFEST), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchFromHttp("https://example.com/marketplace.json");
    expect(result.manifest.name).toBe("test-marketplace");
    expect(result.manifest.plugins).toHaveLength(1);
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.raw).toBe(JSON.stringify(MANIFEST));
  });

  it("computes stable content hash for identical bodies", async () => {
    const body = JSON.stringify(MANIFEST);
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(new Response(body))
      .mockResolvedValueOnce(new Response(body));

    const a = await fetchFromHttp("https://example.com/mkt.json");
    const b = await fetchFromHttp("https://example.com/mkt.json");
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("throws on non-2xx", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response("not found", { status: 404 }),
    );
    await expect(fetchFromHttp("https://example.com/x.json")).rejects.toThrow(/HTTP 404/);
  });

  it("throws on unsupported protocol", async () => {
    await expect(fetchFromHttp("ftp://example.com/x")).rejects.toThrow(/unsupported protocol/);
  });

  it("rejects http:// in production", async () => {
    env.NODE_ENV = "production";
    await expect(fetchFromHttp("http://example.com/x.json")).rejects.toThrow(/not permitted/);
  });

  it("allows http:// in development", async () => {
    env.NODE_ENV = "development";
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify(MANIFEST)));
    await expect(fetchFromHttp("http://localhost:8080/x.json")).resolves.toBeDefined();
  });

  it("throws on oversized content-length", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(MANIFEST), {
        headers: { "content-length": String(10 * 1024 * 1024) },
      }),
    );
    await expect(fetchFromHttp("https://example.com/x.json")).rejects.toThrow(/too large/);
  });

  it("throws on malformed JSON", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response("{not json"));
    await expect(fetchFromHttp("https://example.com/x.json")).rejects.toThrow(/invalid JSON/);
  });
});
