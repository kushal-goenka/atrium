import { NextResponse } from "next/server";
import { plugins as staticPlugins } from "@/data/plugins";
import { getBranding } from "@/lib/branding";
import { hydratePlugins } from "@/lib/overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anthropic-compatible marketplace.json endpoint.
 *
 * Claude Code consumes this via:
 *   /plugin marketplace add https://atrium.yourcompany.com
 *
 * The response aggregates every plugin across all federated sources that
 * matches the current policy (approved + not blocked for the caller's role).
 *
 * Pinned versions: if an admin has pinned a plugin, we serve the pinned
 * version string — upstream drift does not affect what's served.
 */
export async function GET() {
  const brand = getBranding();
  const plugins = await hydratePlugins(staticPlugins);

  // Only Claude Code-compatible plugins (commands/agents/skills/hooks/mcp) go in
  // this endpoint's output; OpenAI/Gemini plugins are fetched by their own
  // clients. This keeps the manifest Anthropic-conformant.
  const approved = plugins.filter(
    (p) => p.policyState === "approved" && (p.provider === "claude-code" || p.provider === "mcp"),
  );

  const body = {
    name: `atrium@${brand.atriumHostname}`,
    owner: { name: brand.orgName, url: brand.orgUrl ?? undefined },
    plugins: approved.map((p) => ({
      name: p.slug,
      source: p.homepage ?? `./plugins/${p.slug}`,
      description: p.description,
      version: p.pinnedVersion ?? p.version,
      category: p.category,
      author: p.author,
      keywords: p.keywords,
      license: p.license,
      homepage: p.homepage,
    })),
  };

  return NextResponse.json(body, {
    headers: {
      "x-atrium-host": brand.atriumHostname,
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
