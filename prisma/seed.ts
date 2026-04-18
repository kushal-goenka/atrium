/**
 * Seed the database with the built-in federated sources.
 *
 * Run manually: `pnpm db:seed`
 * Auto-run on: `pnpm db:push` (configured via the `prisma.seed` hook in package.json)
 *
 * Idempotent — safe to run multiple times.
 */

import { PrismaClient } from "@prisma/client";
import { sources as staticSources } from "../data/plugins";

const prisma = new PrismaClient();

const ROLES = [
  { key: "viewer", name: "Viewer", description: "Browse-only access.", builtIn: true },
  { key: "installer", name: "Installer", description: "Browse + install approved plugins.", builtIn: true },
  { key: "curator", name: "Curator", description: "Review and approve plugins, manage sources.", builtIn: true },
  { key: "admin", name: "Admin", description: "Full access. Can manage users and policies.", builtIn: true },
];

async function main() {
  console.log("🌱 seeding…");

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      create: role,
      update: { name: role.name, description: role.description, builtIn: role.builtIn },
    });
  }
  console.log(`  ✓ ${ROLES.length} roles`);

  for (const s of staticSources) {
    await prisma.source.upsert({
      where: { key: s.id },
      create: {
        key: s.id,
        name: s.name,
        kind: s.kind,
        url: s.url ?? null,
        trust: s.trust,
      },
      update: {
        name: s.name,
        kind: s.kind,
        url: s.url ?? null,
        trust: s.trust,
      },
    });
  }
  console.log(`  ✓ ${staticSources.length} sources`);

  console.log("✓ done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
