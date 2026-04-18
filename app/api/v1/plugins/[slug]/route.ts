import { NextResponse } from "next/server";
import { findPlugin } from "@/data/plugins";
import { hydratePlugins } from "@/lib/overrides";
import { verifyBearer, requireScope } from "@/lib/api-auth";
import { limit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/plugins/{slug}
 *
 * Returns the full manifest for a plugin, including provider-specific
 * fragments (Claude commands/agents/skills/hooks/MCP, OpenAI actions,
 * Gemini extensions) and a `versions[]` array.
 *
 * Auth: bearer token with scope `read:catalog`.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = limit(`v1:plugins:detail:${clientKey(req)}`, 120);
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

  const { slug } = await params;
  const base = findPlugin(slug);
  if (!base) {
    return NextResponse.json(
      { error: "plugin not found" },
      { status: 404, headers: rateLimitHeaders(rl) },
    );
  }
  const [plugin] = await hydratePlugins([base]);
  if (!plugin || plugin.policyState !== "approved") {
    return NextResponse.json(
      { error: "plugin not available" },
      { status: 404, headers: rateLimitHeaders(rl) },
    );
  }

  return NextResponse.json(plugin, { headers: rateLimitHeaders(rl) });
}
