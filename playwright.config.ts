import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: ["**/global-setup.ts"],
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm exec next start -p 3100",
        url: "http://localhost:3100",
        timeout: 120_000,
        reuseExistingServer: !isCI,
        env: {
          DATABASE_URL: "file:./prisma/e2e.db",
          AUTH_SECRET: "e2e-secret-at-least-32-characters-long",
          ATRIUM_ORG_NAME: "Acme Corp",
          ATRIUM_ORG_SHORT_NAME: "Acme",
          ATRIUM_PUBLIC_URL: "https://atrium.acme.corp",
        },
      },
});
