import { NextResponse } from "next/server";
import { listAllSources, createSource, slugifyKey } from "@/lib/sources";
import { verifyBearer, requireScope } from "@/lib/api-auth";
import { limit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = limit(`v1:sources:${clientKey(req)}`, 120);
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

  const sources = await listAllSources();
  return NextResponse.json({ sources }, { headers: rateLimitHeaders(rl) });
}

/**
 * POST /api/v1/sources
 *   body: { name, kind: "git"|"http"|"local", url?, trust: "official"|"verified"|"community"|"internal" }
 *
 * Auth: bearer token with scope `write:sources`.
 */
export async function POST(req: Request) {
  const rl = limit(`v1:sources:post:${clientKey(req)}`, 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const auth = await verifyBearer(req);
  const denied = requireScope(auth, "write:sources");
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 401, headers: rateLimitHeaders(rl) });
  }

  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    kind?: unknown;
    url?: unknown;
    trust?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const kind = typeof body.kind === "string" ? body.kind : "";
  const url = typeof body.url === "string" ? body.url.trim() : undefined;
  const trust = typeof body.trust === "string" ? body.trust : "community";

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400, headers: rateLimitHeaders(rl) });
  if (!["git", "http", "local"].includes(kind)) {
    return NextResponse.json({ error: "kind must be git|http|local" }, { status: 400, headers: rateLimitHeaders(rl) });
  }
  if (kind !== "local" && !url) {
    return NextResponse.json({ error: "url required for git/http kinds" }, { status: 400, headers: rateLimitHeaders(rl) });
  }
  if (!["official", "verified", "community", "internal"].includes(trust)) {
    return NextResponse.json({ error: "invalid trust tier" }, { status: 400, headers: rateLimitHeaders(rl) });
  }

  try {
    const source = await createSource({
      key: slugifyKey(name),
      name,
      kind: kind as "git" | "http" | "local",
      url,
      trust: trust as "official" | "verified" | "community" | "internal",
    });
    return NextResponse.json({ source }, { status: 201, headers: rateLimitHeaders(rl) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("Unique constraint") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status, headers: rateLimitHeaders(rl) });
  }
}
