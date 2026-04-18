import { test, expect } from "@playwright/test";

test.describe("/mkt/marketplace.json", () => {
  test("returns a Claude-compatible manifest", async ({ request }) => {
    const res = await request.get("/mkt/marketplace.json");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    // Marketplace name is the org's (from ATRIUM_ORG_NAME), not "atrium@…".
    expect(typeof body.name).toBe("string");
    expect(body.name.length).toBeGreaterThan(0);
    expect(body.owner).toBeDefined();
    expect(Array.isArray(body.plugins)).toBe(true);
    expect(body.plugins.length).toBeGreaterThan(0);

    // Every plugin has the core required fields Claude Code expects.
    for (const p of body.plugins) {
      expect(typeof p.name).toBe("string");
      expect(typeof p.description).toBe("string");
      expect(typeof p.version).toBe("string");
      expect(typeof p.source).toBe("string");
    }
  });

  test("excludes quarantined and blocked plugins", async ({ request }) => {
    const res = await request.get("/mkt/marketplace.json");
    const body = await res.json();
    // k8s-operator is quarantined in the seed catalog.
    const slugs = body.plugins.map((p: { name: string }) => p.name);
    expect(slugs).not.toContain("k8s-operator");
  });

  test("advertises the atrium host header", async ({ request }) => {
    const res = await request.get("/mkt/marketplace.json");
    expect(res.headers()["x-atrium-host"]).toBeTruthy();
  });
});
