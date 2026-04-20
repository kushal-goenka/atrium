/**
 * Seed the database with the built-in federated sources + the fixture
 * plugin catalog.
 *
 * Run manually: `pnpm db:seed`
 * Auto-run on: `pnpm db:push` (configured via the `prisma.seed` hook in package.json)
 *
 * Idempotent — safe to run multiple times. Re-runs upsert the same rows
 * so you can tweak the fixture and re-seed without a wipe.
 */

import { PrismaClient } from "@prisma/client";
import { sources as fixtureSources, plugins as fixturePlugins } from "./fixtures/plugins";

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

  // Sources first — plugins FK to them.
  const sourceIdByKey = new Map<string, string>();
  for (const s of fixtureSources) {
    const row = await prisma.source.upsert({
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
    sourceIdByKey.set(s.id, row.id);
  }
  console.log(`  ✓ ${fixtureSources.length} sources`);

  // Plugins + their versions + signals.
  let pluginCount = 0;
  let versionCount = 0;
  let signalCount = 0;

  for (const p of fixturePlugins) {
    const sourcePk = sourceIdByKey.get(p.sourceId);
    if (!sourcePk) {
      console.warn(`  ! plugin ${p.slug}: unknown sourceId ${p.sourceId}, skipping`);
      continue;
    }

    const manifestJson = JSON.stringify({
      commands: p.commands,
      agents: p.agents,
      skills: p.skills,
      hooks: p.hooks,
      mcpServers: p.mcpServers,
      actions: p.actions,
      extensions: p.extensions,
    });

    const pluginRow = await prisma.plugin.upsert({
      where: { sourceId_slug: { sourceId: sourcePk, slug: p.slug } },
      create: {
        sourceId: sourcePk,
        slug: p.slug,
        name: p.name,
        provider: p.provider,
        version: p.version,
        category: p.category,
        description: p.description,
        authorName: p.author.name,
        authorEmail: p.author.email ?? null,
        authorUrl: p.author.url ?? null,
        homepage: p.homepage ?? null,
        license: p.license ?? null,
        keywords: p.keywords.join(","),
        policyState: p.policyState,
        usageJson: p.usage ? JSON.stringify(p.usage) : null,
        forkedFromJson: p.forkedFrom ? JSON.stringify(p.forkedFrom) : null,
      },
      update: {
        name: p.name,
        provider: p.provider,
        version: p.version,
        category: p.category,
        description: p.description,
        authorName: p.author.name,
        authorEmail: p.author.email ?? null,
        authorUrl: p.author.url ?? null,
        homepage: p.homepage ?? null,
        license: p.license ?? null,
        keywords: p.keywords.join(","),
        policyState: p.policyState,
        usageJson: p.usage ? JSON.stringify(p.usage) : null,
        forkedFromJson: p.forkedFrom ? JSON.stringify(p.forkedFrom) : null,
      },
    });
    pluginCount += 1;

    // Versions: upsert by (pluginId, version). Each version stores the full manifest blob.
    for (const v of p.versions) {
      await prisma.pluginVersion.upsert({
        where: { pluginId_version: { pluginId: pluginRow.id, version: v.version } },
        create: {
          pluginId: pluginRow.id,
          version: v.version,
          releasedAt: new Date(v.releasedAt),
          changelog: v.changelog ?? null,
          // Only the current version stores the full manifest; historical
          // versions get the manifest-at-release-time when we actually
          // ingest from git. For the fixture we persist the same blob.
          manifest: v.version === p.version ? manifestJson : "{}",
        },
        update: {
          releasedAt: new Date(v.releasedAt),
          changelog: v.changelog ?? null,
          manifest: v.version === p.version ? manifestJson : "{}",
        },
      });
      versionCount += 1;
    }

    // Signals: wipe + recreate for this plugin. No unique index on
    // (plugin, scanner, title) so upsert isn't clean; re-create is fine
    // because signals are a view over the manifest.
    await prisma.securitySignal.deleteMany({ where: { pluginId: pluginRow.id } });
    for (const s of p.signals) {
      await prisma.securitySignal.create({
        data: {
          pluginId: pluginRow.id,
          scanner: s.scanner,
          severity: s.severity,
          title: s.title,
          detail: s.detail,
        },
      });
      signalCount += 1;
    }
  }
  console.log(`  ✓ ${pluginCount} plugins · ${versionCount} versions · ${signalCount} signals`);

  console.log("✓ done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
