import { NextResponse } from "next/server";
import { plugins } from "@/data/plugins";
import { getBranding } from "@/lib/branding";

export const runtime = "nodejs";
export const revalidate = 60; // re-aggregate at most once per minute

/**
 * Anthropic-compatible marketplace.json endpoint.
 *
 * Claude Code consumes this via:
 *   /plugin marketplace add https://atrium.yourcompany.com
 *
 * The response aggregates every plugin across all federated sources that
 * matches the current policy (approved + not blocked for the caller's role).
 *
 * In the alpha, policy is "only approved plugins for anyone"; M2 adds
 * role-aware filtering and per-caller trust decisions.
 */
export async function GET() {
  const brand = getBranding();

  const approved = plugins.filter((p) => p.policyState === "approved");

  const body = {
    name: `atrium@${brand.atriumHostname}`,
    owner: { name: brand.orgName, url: brand.orgUrl ?? undefined },
    plugins: approved.map((p) => ({
      name: p.slug,
      source: p.homepage ?? `./plugins/${p.slug}`,
      description: p.description,
      version: p.version,
      category: p.category,
      author: p.author,
      keywords: p.keywords,
      license: p.license,
      homepage: p.homepage,
    })),
  };

  return NextResponse.json(body, {
    headers: {
      // Advertise the atrium origin so Claude Code can tell clones apart.
      "x-atrium-host": brand.atriumHostname,
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
