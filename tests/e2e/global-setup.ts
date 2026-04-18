import { spawnSync } from "node:child_process";
import { unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Runs once before the e2e suite starts.
 *
 * Local dev: fresh DB, schema push, seed, build. Zero-setup from a dev's POV.
 *
 * CI: skips each step if a marker indicates it's already done. CI runs these
 * explicitly before `pnpm test:e2e` to avoid the Playwright webServer racing
 * the build (webServer can start in parallel with globalSetup).
 */
export default async function globalSetup() {
  const dbPath = resolve(__dirname, "../../prisma/e2e.db");
  const buildMarker = resolve(__dirname, "../../.next/BUILD_ID");

  const env = {
    ...process.env,
    DATABASE_URL: "file:./prisma/e2e.db",
    AUTH_SECRET:
      process.env.AUTH_SECRET ?? "e2e-secret-at-least-32-characters-long",
  };

  if (!process.env.CI) {
    if (existsSync(dbPath)) unlinkSync(dbPath);

    ensure(
      spawnSync("pnpm", ["exec", "prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
        stdio: "inherit",
        env,
      }),
      "prisma db push",
    );

    ensure(
      spawnSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], { stdio: "inherit", env }),
      "seed",
    );
  }

  if (!existsSync(buildMarker)) {
    ensure(
      spawnSync("pnpm", ["exec", "next", "build"], { stdio: "inherit", env }),
      "next build",
    );
  }
}

function ensure(result: { status: number | null }, label: string) {
  if (result.status !== 0) throw new Error(`${label} failed (exit ${result.status})`);
}
