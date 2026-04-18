import { test, expect } from "@playwright/test";

test.describe("/api/health", () => {
  test("returns 200 with db check when healthy", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.db.status).toBe("ok");
    expect(typeof body.uptimeMs).toBe("number");
    expect(typeof body.version).toBe("string");
  });

  test("is uncached", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});
