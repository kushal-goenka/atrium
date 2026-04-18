import { test, expect } from "@playwright/test";

test.describe("Plugin detail", () => {
  test("renders manifest sections and install snippet", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/plugins/incident-commander");

    await expect(page.getByRole("heading", { name: "Incident Commander" })).toBeVisible();

    // Manifest sections render.
    await expect(page.getByRole("heading", { name: "Slash commands" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Subagents" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MCP servers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Versions" })).toBeVisible();

    // Security signals panel is present for this plugin.
    await expect(page.getByRole("heading", { name: "Security signals" })).toBeVisible();

    // Install snippet uses the branded hostname (via ATRIUM_PUBLIC_URL env).
    await expect(page.getByText("/plugin install incident-commander@", { exact: false })).toBeVisible();
  });

  test("Flag for re-scan button confirms inline", async ({ page }) => {
    await page.goto("/plugins/incident-commander");

    const flag = page.getByRole("button", { name: "Flag for re-scan" });
    await flag.click();

    await expect(page.getByText(/Re-scan queued for/)).toBeVisible();
  });

  test("404s for unknown plugin slug", async ({ page }) => {
    const res = await page.goto("/plugins/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
