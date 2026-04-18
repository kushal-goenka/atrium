import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("persists across reloads via localStorage", async ({ page }) => {
    await page.goto("/");
    // System-preference branch applies dark by default in this CI run.
    // Click the "light" button to explicitly pick light.
    await page.getByRole("button", { name: "Theme: light" }).click();

    // Applied immediately: <html> should no longer have .dark.
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Reload — the init script should read localStorage and preserve light.
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Flip to dark; should persist.
    await page.getByRole("button", { name: "Theme: dark" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("three-state toggle exposes aria-pressed correctly", async ({ page }) => {
    await page.goto("/");
    const dark = page.getByRole("button", { name: "Theme: dark" });

    await dark.click();
    await expect(dark).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Theme: light" }).click();
    await expect(dark).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("URL-persisted filters", () => {
  test("typing in search updates the URL after debounce", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/Search plugins/).fill("figma");
    // Wait for the 250ms debounce + router.replace to settle.
    await expect(page).toHaveURL(/\?q=figma/, { timeout: 2000 });
  });

  test("deep-link hydrates the filter UI", async ({ page }) => {
    await page.goto("/?category=data&source=acme-internal");

    // Only Acme internal data plugins should be visible.
    await expect(page.getByRole("link", { name: /Snowflake Analyst/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Incident Commander/ })).toHaveCount(0);

    // The category chip for Data should be in the selected state (accent styling).
    const dataChip = page.getByRole("button", { name: "Data", exact: true });
    await expect(dataChip).toBeVisible();

    // The source dropdown reflects the URL value.
    await expect(page.locator("#source-filter")).toHaveValue("acme-internal");
  });

  test("Clear filters resets all three filters", async ({ page }) => {
    await page.goto("/?q=spark&category=data");

    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page).toHaveURL(/^[^?]+$|^.+\/$/);
    await expect(page.getByPlaceholder(/Search plugins/)).toHaveValue("");
  });
});
