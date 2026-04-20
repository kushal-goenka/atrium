import { NextResponse } from "next/server";
import { listAllPlugins } from "@/lib/plugins-repo";
import { hydratePlugins } from "@/lib/overrides";
import { verifyBearer, requireScope } from "@/lib/api-auth";
import { limit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/plugins
 *
 * Query parameters:
 *   - provider=claude-code|openai|gemini|mcp|generic
 *   - category=productivity|data|devops|…
 *   - source=<sourceId>
 *   - q=<free-text search over name/description/keywords>
 *
 * Auth: bearer token with scope `read:catalog`.
 * Response: { plugins: PluginPublic[], total: number }
 */
export async function GET(req: Request) {
  const rl = limit(`v1:plugins:${clientKey(req)}`, 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const auth = await verifyBearer(req);
  const denied = requireScope(auth, "read:catalog");
  if (denied) {
    return NextResponse.json(
      { error: denied },
      { status: 401, headers: rateLimitHeaders(rl) },
    );
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const category = url.searchParams.get("category");
  const source = url.searchParams.get("source");
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const hydrated = await hydratePlugins(await listAllPlugins());

  const filtered = hydrated.filter((p) => {
    if (p.policyState !== "approved") return false;
    if (provider && p.provider !== provider) return false;
    if (category && p.category !== category) return false;
    if (source && p.sourceId !== source) return false;
    if (q) {
      const haystack = [
        p.name,
        p.description,
        p.author.name,
        ...p.keywords,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const shaped = filtered.map(shape);

  return NextResponse.json(
    { plugins: shaped, total: shaped.length },
    { headers: rateLimitHeaders(rl) },
  );
}

function shape(p: Awaited<ReturnType<typeof listAllPlugins>>[number]) {
  return {
    slug: p.slug,
    name: p.name,
    version: p.pinnedVersion ?? p.version,
    provider: p.provider,
    category: p.category,
    description: p.description,
    author: p.author,
    keywords: p.keywords,
    homepage: p.homepage,
    license: p.license,
    sourceId: p.sourceId,
    policyState: p.policyState,
    pinnedVersion: p.pinnedVersion,
    capabilities: {
      commands: p.commands.map((c) => c.name),
      agents: p.agents.map((a) => a.name),
      skills: p.skills.map((s) => s.name),
      mcpServers: p.mcpServers.map((m) => m.name),
      actions: p.actions?.map((a) => a.name) ?? [],
      extensions: p.extensions?.map((e) => e.name) ?? [],
    },
    updatedAt: p.updatedAt,
  };
}
