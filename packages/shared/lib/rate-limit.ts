import { Ratelimit } from "@upstash/ratelimit";

let _rl: Map<string, Ratelimit> | null = null;

function getLimiter(key: string, requests: number, window: string): Ratelimit {
  if (!_rl) _rl = new Map();
  if (!_rl.has(key)) {
    // In-memory sliding window — works without Redis in edge/serverless.
    // Switch to Redis-backed limiter by passing { redis: kv } when available.
    _rl.set(
      key,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(requests, window as any),
        prefix: `rl:${key}`,
      })
    );
  }
  return _rl.get(key)!;
}

function getRedis() {
  // Lazy-load Vercel KV; falls back to in-memory ephemeral store if not configured.
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = require("@vercel/kv");
      return kv;
    }
  } catch {}
  return Ratelimit.ephemeralCache();
}

/**
 * Check a rate limit for a given identifier (IP, email, user ID).
 * Returns { allowed: boolean }.
 */
export async function checkRateLimit(
  limitName: string,
  identifier: string,
  requests: number,
  window: string
): Promise<{ allowed: boolean }> {
  try {
    const limiter = getLimiter(limitName, requests, window);
    const { success } = await limiter.limit(identifier);
    return { allowed: success };
  } catch {
    // If rate limiting infrastructure fails, allow the request through.
    return { allowed: true };
  }
}
