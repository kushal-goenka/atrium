import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe. Returns 200 only if the database responds.
 * docker-compose.yml healthcheck and the k8s readinessProbe both hit this.
 */
export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "down" = "down";
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    // Cheapest possible query that exercises the connection pool.
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    db = "ok";
  } catch {
    db = "down";
  }

  const healthy = db === "ok";
  const body = {
    status: healthy ? "ok" : "degraded",
    version: process.env.npm_package_version ?? "0.0.0",
    uptimeMs: Math.round(process.uptime() * 1000),
    checks: {
      db: { status: db, latencyMs: dbLatencyMs },
    },
    tookMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
