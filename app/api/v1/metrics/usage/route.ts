import { NextResponse } from "next/server";
import { listAllPlugins } from "@/lib/plugins-repo";
import { hydratePlugins } from "@/lib/overrides";
import { verifyBearer, requireScope } from "@/lib/api-auth";
import { limit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/metrics/usage
 *
 * Aggregates the installs30d / activeUsers7d / command-invocation counts
 * across all approved plugins. Real telemetry lands once the Install +
 * UsageDaily tables are populated — until then this surfaces the seeded
 * demo numbers.
 *
 * Auth: bearer token with scope `read:catalog`.
 */
export async function GET(req: Request) {
  const rl = limit(`v1:metrics:${clientKey(req)}`, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const auth = await verifyBearer(req);
  const denied = requireScope(auth, "read:catalog");
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 401, headers: rateLimitHeaders(rl) });
  }

  const plugins = await hydratePlugins(await listAllPlugins());
  const approved = plugins.filter((p) => p.policyState === "approved");

  const totals = approved.reduce(
    (acc, p) => {
      const u = p.usage;
      if (!u) return acc;
      acc.installs30d += u.installs30d;
      acc.installsAllTime += u.installsAllTime;
      acc.activeUsers7d += u.activeUsers7d;
      acc.commands30d += u.topCommands.reduce((s, c) => s + c.count, 0);
      return acc;
    },
    { installs30d: 0, installsAllTime: 0, activeUsers7d: 0, commands30d: 0 },
  );

  const byPlugin = approved
    .filter((p) => p.usage)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      provider: p.provider,
      installs30d: p.usage!.installs30d,
      installsAllTime: p.usage!.installsAllTime,
      activeUsers7d: p.usage!.activeUsers7d,
      topCommands: p.usage!.topCommands,
    }))
    .sort((a, b) => b.installs30d - a.installs30d);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      totals,
      plugins: byPlugin,
    },
    { headers: rateLimitHeaders(rl) },
  );
}
