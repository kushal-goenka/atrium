import { test, expect } from "@playwright/test";

test.describe("Admin dashboard", () => {
  test("renders stats and panels", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Plugins", { exact: true })).toBeVisible();
    await expect(page.getByText("Sources", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Approvals queue" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  });

  test("approve button flips to approved state", async ({ page }) => {
    await page.goto("/admin");

    const approveBtn = page.getByRole("button", { name: "Approve" }).first();
    await approveBtn.click();

    await expect(page.getByText(/Approved · /)).toBeVisible();
  });

  test("Add source link goes to /admin/sources/new", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: "Add source" }).click();

    await expect(page).toHaveURL("/admin/sources/new");
    await expect(page.getByRole("heading", { name: "Add a source" })).toBeVisible();
  });

  test("Manage users link opens the users page", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: "Manage users" }).click();

    await expect(page).toHaveURL("/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});

test.describe("Add source flow", () => {
  test("rejects empty name", async ({ page }) => {
    await page.goto("/admin/sources/new");

    // HTML5 validation triggers before server; still assert the button wires up.
    const submit = page.getByRole("button", { name: "Add source" });
    await submit.click();

    // The native browser validation pseudo-class kicks in — form shouldn't navigate.
    await expect(page).toHaveURL("/admin/sources/new");
  });

  test("creates a new source and shows it on /admin", async ({ page }) => {
    await page.goto("/admin/sources/new");

    const unique = `E2E Partner ${Math.random().toString(36).slice(2, 7)}`;
    await page.locator('input[name="name"]').fill(unique);
    await page.locator('input[name="url"]').fill("https://github.com/example/e2e-plugins");
    await page.locator('select[name="trust"]').selectOption("verified");

    await page.getByRole("button", { name: "Add source" }).click();
    await expect(page).toHaveURL("/admin");

    // New source appears in the Sources panel.
    await expect(page.getByText(unique)).toBeVisible();
  });
});
