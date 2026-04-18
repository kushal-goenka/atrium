import { spawnSync } from "node:child_process";
import { unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Runs once before the e2e suite starts:
 * 1. Removes the previous e2e database (for a clean slate)
 * 2. Pushes the Prisma schema to the e2e database
 * 3. Seeds the built-in sources + roles
 * 4. Builds the Next app so `next start` can serve it
 */
export default async function globalSetup() {
  const dbPath = resolve(__dirname, "../../prisma/e2e.db");
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  const env = {
    ...process.env,
    DATABASE_URL: "file:./prisma/e2e.db",
  };

  const push = spawnSync(
    "pnpm",
    ["exec", "prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    { stdio: "inherit", env },
  );
  if (push.status !== 0) throw new Error("prisma db push failed");

  const seed = spawnSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], {
    stdio: "inherit",
    env,
  });
  if (seed.status !== 0) throw new Error("db:seed failed");

  const build = spawnSync(
    "pnpm",
    ["exec", "next", "build"],
    {
      stdio: "inherit",
      env: {
        ...env,
        AUTH_SECRET: "e2e-secret-at-least-32-characters-long",
      },
    },
  );
  if (build.status !== 0) throw new Error("next build failed");
}
