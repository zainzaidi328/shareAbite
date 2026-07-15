// Simple in-memory sliding-window rate limiter. Suitable for a single
// server instance; swap for Upstash/Redis when scaling horizontally.

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return { ok: false, remaining: 0 };
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return { ok: true, remaining: limit - timestamps.length };
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local"
  );
}
