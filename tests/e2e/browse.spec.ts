import { test, expect } from "@playwright/test";

test.describe("Browse page", () => {
  test("loads with the expected plugins and branding", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Plugins approved for your org" })).toBeVisible();

    // Branding env vars flow into the header (text is lowercased in the DOM; CSS uppercases it).
    await expect(page.getByText("Acme Corp · atrium.acme.corp")).toBeVisible();

    // Plugins render.
    await expect(page.getByRole("link", { name: /Incident Commander/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Deploy Guard/ })).toBeVisible();

    // Nav exposes the three primary routes.
    await expect(page.getByRole("link", { name: "Browse", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sources", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin", exact: true })).toBeVisible();
  });

  test("search filters the catalog in place", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder(/Search plugins/).fill("figma");
    await expect(page.getByRole("link", { name: /Figma Bridge/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Incident Commander/ })).toHaveCount(0);
  });

  test("category chip narrows the list", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Data", exact: true }).click();
    await expect(page.getByRole("link", { name: /Snowflake Analyst/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Incident Commander/ })).toHaveCount(0);
  });

  test("clicking a plugin card navigates to detail", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Incident Commander/ }).first().click();

    await expect(page).toHaveURL(/\/plugins\/incident-commander/);
    await expect(page.getByRole("heading", { name: "Incident Commander" })).toBeVisible();
  });
});
