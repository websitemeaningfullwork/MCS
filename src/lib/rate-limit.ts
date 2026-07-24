import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window rate limiter with a pluggable backing store.
 *
 * Two backends, selected automatically at call time:
 *
 *   1. **Upstash Redis** (preferred in production) — used when BOTH
 *      `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. Talks
 *      to the REST API with plain `fetch`, so this adds NO npm dependency and
 *      no vendor lock-in: unset the env vars and the code path goes away.
 *      Counters are shared across every instance, which is what makes the limit
 *      an actual control rather than a speed bump.
 *
 *   2. **In-memory map** (fallback) — the original behaviour. State lives in a
 *      single server instance's memory, so on a horizontally scaled/serverless
 *      deployment (e.g. Vercel) it only throttles bursts that happen to land on
 *      the same instance. Fine for local dev and small single-instance
 *      deployments; NOT a hard security control.
 *
 * The public API is unchanged, so every existing call site keeps working and
 * transparently gains distributed limiting the moment the env vars are set.
 *
 * Fail-open by design: if Redis is unreachable we allow the request rather than
 * locking users out of login/checkout during an infrastructure blip. A rate
 * limiter is a defence-in-depth measure, not the thing standing between an
 * attacker and the data — RLS and the server-side authz checks are.
 */

// ---------------------------------------------------------------------------
// In-memory backend
// ---------------------------------------------------------------------------
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
 * Synchronous, single-instance rate limit. Returns `true` when the action is
 * allowed, `false` when the caller has exceeded `limit` requests within
 * `windowMs` for the given `key`.
 *
 * Prefer `rateLimitByIp()` — it uses the distributed backend when configured.
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

// ---------------------------------------------------------------------------
// Upstash Redis backend
// ---------------------------------------------------------------------------

/** True when the distributed backend is configured. */
export function distributedRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/**
 * INCR the key and, on the first hit of a window, set its TTL. Two round trips
 * are avoided by using Upstash's pipeline endpoint. Returns the post-increment
 * counter, or null when the backend is unavailable (caller then fails open).
 */
async function redisIncrWithTtl(
  key: string,
  windowMs: number,
): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // INCR then PEXPIRE ... NX — NX only sets the TTL when the key has none,
      // i.e. on the first request of a window, so the window is fixed rather
      // than sliding forward on every hit.
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body: unknown = await res.json();
    if (!Array.isArray(body) || body.length === 0) return null;
    const first = body[0] as { result?: unknown; error?: unknown };
    if (first?.error || typeof first?.result !== "number") return null;
    return first.result;
  } catch {
    // Network/DNS/timeout — fail open (see the file header).
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Best-effort client IP from proxy headers; falls back to a constant bucket. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Rate-limit by client IP under a named scope. Returns `true` when allowed.
 * Defaults: 5 requests per 60s.
 *
 * Uses the distributed backend when configured, otherwise the in-memory one.
 */
export async function rateLimitByIp(
  scope: string,
  limit = 5,
  windowMs = 60_000,
): Promise<boolean> {
  const ip = await clientIp();
  const key = `${scope}:${ip}`;

  if (distributedRateLimitEnabled()) {
    // Window the key so counters expire naturally even if PEXPIRE is lost.
    const window = Math.floor(Date.now() / windowMs);
    const count = await redisIncrWithTtl(`rl:${key}:${window}`, windowMs);
    // null => backend unavailable; fall back to the in-memory limiter rather
    // than dropping the limit entirely.
    if (count !== null) return count <= limit;
  }

  return rateLimit(key, limit, windowMs);
}
