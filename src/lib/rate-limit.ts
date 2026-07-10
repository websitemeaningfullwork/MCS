import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * NOTE: state lives in a single server instance's memory, so on a horizontally
 * scaled/serverless deployment (e.g. Vercel) it only throttles bursts that hit
 * the same instance. It is a cheap first line of defence against casual abuse,
 * NOT a hard security control — move to Redis/Upstash or a DB counter if you
 * need guarantees across instances.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns `true` when the action is allowed, `false` when the caller has
 * exceeded `limit` requests within `windowMs` for the given `key`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Best-effort client IP from proxy headers; falls back to a constant bucket. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Convenience: rate-limit by client IP under a named scope. Returns `true` when
 * allowed. Defaults: 5 requests per 60s.
 */
export async function rateLimitByIp(
  scope: string,
  limit = 5,
  windowMs = 60_000,
): Promise<boolean> {
  const ip = await clientIp();
  return rateLimit(`${scope}:${ip}`, limit, windowMs);
}
