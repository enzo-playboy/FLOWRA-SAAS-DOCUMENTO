import { redis } from "./redis";

const PREFIX = "prodfind:";

// Cache de leitura. Falha silenciosa: se o Redis der pau, a request
// segue sem cache (não derruba o server).
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const v = await redis.get<T>(PREFIX + key);
    return (v ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(PREFIX + key, value, { ex: ttlSeconds });
  } catch {
    // ignora falha de cache
  }
}
