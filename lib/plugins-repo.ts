import { prisma } from "./prisma";
import type {
  Plugin,
  PluginCategory,
  PluginProvider,
  PluginVersionSummary,
  SecuritySignal,
  UsageSnapshot,
  Hook,
  OpenAiAction,
  GeminiExtension,
  Skill,
  SlashCommand,
  Subagent,
  McpServer,
} from "./types";

/**
 * DB-backed plugin catalog.
 *
 * Plugins now live in the `Plugin` table, populated by `pnpm db:seed` from
 * `prisma/fixtures/plugins.ts`. Each plugin has rows in `PluginVersion`
 * (latest version's manifest is a JSON blob) and zero-or-more
 * `SecuritySignal` rows. Aggregated usage is stashed on `Plugin.usageJson`
 * until v0.3's real `UsageDaily` aggregation lands.
 *
 * `hydratePlugins()` (in lib/overrides.ts) still merges `PluginOverride` on
 * top of the rows this module returns — category/keyword overrides and
 * version pins apply after we load.
 */

interface ManifestBlob {
  commands?: SlashCommand[];
  agents?: Subagent[];
  skills?: Skill[];
  hooks?: Hook[];
  mcpServers?: McpServer[];
  actions?: OpenAiAction[];
  extensions?: GeminiExtension[];
}

type PrismaPluginRow = Awaited<ReturnType<typeof prisma.plugin.findFirst>>;
type LoadedRow = NonNullable<PrismaPluginRow> & {
  versions: Array<{ version: string; releasedAt: Date; changelog: string | null; manifest: string }>;
  signals: Array<{
    id: string;
    severity: string;
    title: string;
    detail: string;
    scanner: string;
  }>;
  source: { key: string };
};

export async function listAllPlugins(): Promise<Plugin[]> {
  const rows = (await prisma.plugin.findMany({
    include: {
      versions: { orderBy: { releasedAt: "desc" } },
      signals: { orderBy: { createdAt: "desc" } },
      source: true,
    },
    orderBy: { createdAt: "asc" },
  })) as unknown as LoadedRow[];
  return rows.map(fromRow);
}

export async function findPluginBySlug(slug: string): Promise<Plugin | undefined> {
  const row = (await prisma.plugin.findFirst({
    where: { slug },
    include: {
      versions: { orderBy: { releasedAt: "desc" } },
      signals: { orderBy: { createdAt: "desc" } },
      source: true,
    },
  })) as unknown as LoadedRow | null;
  return row ? fromRow(row) : undefined;
}

/** Slugs of every plugin currently in the catalog. Used by Next `generateStaticParams`. */
export async function allPluginSlugs(): Promise<string[]> {
  const rows = await prisma.plugin.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

function fromRow(row: LoadedRow): Plugin {
  const latest = row.versions[0];
  const manifest = latest ? safeParseManifest(latest.manifest) : {};
  const usage = row.usageJson ? safeParseUsage(row.usageJson) : undefined;
  const forkedFrom = row.forkedFromJson ? safeParseForkedFrom(row.forkedFromJson) : undefined;

  const versions: PluginVersionSummary[] = row.versions.map((v) => ({
    version: v.version,
    releasedAt: v.releasedAt.toISOString(),
    changelog: v.changelog ?? undefined,
  }));

  const signals: SecuritySignal[] = row.signals.map((s) => ({
    id: s.id,
    severity: s.severity as SecuritySignal["severity"],
    title: s.title,
    detail: s.detail,
    scanner: s.scanner,
  }));

  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    version: row.version,
    provider: (row.provider as PluginProvider) ?? "claude-code",
    category: row.category as PluginCategory,
    author: {
      name: row.authorName ?? "Unknown",
      email: row.authorEmail ?? undefined,
      url: row.authorUrl ?? undefined,
    },
    keywords: row.keywords ? row.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
    homepage: row.homepage ?? undefined,
    license: row.license ?? undefined,
    sourceId: row.source.key,
    commands: manifest.commands ?? [],
    agents: manifest.agents ?? [],
    skills: manifest.skills ?? [],
    hooks: manifest.hooks ?? [],
    mcpServers: manifest.mcpServers ?? [],
    actions: manifest.actions,
    extensions: manifest.extensions,
    versions,
    signals,
    usage,
    policyState: row.policyState as Plugin["policyState"],
    updatedAt: row.updatedAt.toISOString(),
    forkedFrom,
  };
}

function safeParseManifest(raw: string): ManifestBlob {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ManifestBlob) : {};
  } catch {
    return {};
  }
}

function safeParseUsage(raw: string): UsageSnapshot | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<UsageSnapshot>;
    if (
      typeof parsed.installs30d !== "number" ||
      typeof parsed.installsAllTime !== "number" ||
      typeof parsed.activeUsers7d !== "number" ||
      !Array.isArray(parsed.topCommands)
    ) {
      return undefined;
    }
    return parsed as UsageSnapshot;
  } catch {
    return undefined;
  }
}

function safeParseForkedFrom(raw: string): Plugin["forkedFrom"] | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.sourceId === "string" &&
      typeof parsed.slug === "string" &&
      typeof parsed.atVersion === "string"
    ) {
      return parsed as NonNullable<Plugin["forkedFrom"]>;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
