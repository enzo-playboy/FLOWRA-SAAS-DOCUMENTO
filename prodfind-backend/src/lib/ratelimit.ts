import { redis } from "./redis";

// Rate limit com janela deslizante (sorted set no Redis).
// Fallback em memória se o Redis não estiver configurado.
const mem = new Map<string, number[]>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const clean = now - windowMs;

  if (redis) {
    const rk = `ratelimit:${key}`;
    await redis.zremrangebyscore(rk, 0, clean);
    const count = await redis.zcard(rk);
    if (count >= limit) {
      const oldest = await redis.zrange(rk, 0, 0);
      const retry = oldest.length
        ? Math.ceil((Number(oldest[0]) - clean) / 1000)
        : windowSeconds;
      return { ok: false, remaining: 0, retryAfter: retry };
    }
    await redis.zadd(rk, { score: now, member: String(now) });
    await redis.expire(rk, windowSeconds);
    return { ok: true, remaining: limit - count - 1, retryAfter: 0 };
  }

  // fallback em memória
  const arr = (mem.get(key) ?? []).filter((t) => t > clean);
  if (arr.length >= limit) {
    return { ok: false, remaining: 0, retryAfter: windowSeconds };
  }
  arr.push(now);
  mem.set(key, arr);
  return { ok: true, remaining: limit - arr.length, retryAfter: 0 };
}
