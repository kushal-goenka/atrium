/**
 * Per-key sliding-window rate limiter, in-memory.
 *
 * Good enough for a single-process atrium deployment. When we horizontally
 * scale behind a load balancer, swap this module out for a Redis-backed
 * implementation; callers only depend on the `limit()` signature.
 */

interface WindowState {
  windowStart: number;
  count: number;
}

const BUCKETS = new Map<string, WindowState>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function limit(key: string, perMinute = 60): RateLimitResult {
  const now = Date.now();
  const windowMs = 60_000;
  const state = BUCKETS.get(key);

  if (!state || now - state.windowStart >= windowMs) {
    BUCKETS.set(key, { windowStart: now, count: 1 });
    return {
      allowed: true,
      remaining: perMinute - 1,
      resetAt: now + windowMs,
      limit: perMinute,
    };
  }

  state.count += 1;
  const remaining = Math.max(0, perMinute - state.count);
  const resetAt = state.windowStart + windowMs;
  return {
    allowed: state.count <= perMinute,
    remaining,
    resetAt,
    limit: perMinute,
  };
}

export function rateLimitHeaders(res: RateLimitResult): HeadersInit {
  return {
    "x-ratelimit-limit": String(res.limit),
    "x-ratelimit-remaining": String(res.remaining),
    "x-ratelimit-reset": String(Math.floor(res.resetAt / 1000)),
  };
}

export function clientKey(req: Request): string {
  // Trust x-forwarded-for behind a reverse proxy, fall back to a header
  // guaranteed to differ across clients only in dev.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}
