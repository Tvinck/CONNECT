// lib/skinscan/server/redis.ts
/**
 * Server‑only Redis cache.
 * Dynamically loads ioredis *only* on the server at runtime.
 */
let redisClient: any = null;
let initialized = false;

async function initRedis() {
  if (initialized) return;
  initialized = true;
  if (!process.env.REDIS_URL) return;
  try {
    const RedisModule = await import('ioredis');
    const Redis = (RedisModule as any).default ?? RedisModule;
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    redisClient.on('error', (err: Error) => {
      console.warn('Redis error – falling back to memory cache:', err.message);
    });
  } catch {
    console.warn('ioredis could not be loaded – using in‑memory cache only');
  }
}

/** In‑memory fallback cache (shared across server requests) */
interface MemoryCacheItem {
  value: string;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheItem>();

export async function getCache(key: string): Promise<string | null> {
  if (typeof window !== 'undefined') return null; // client side: no cache
  await initRedis();
  if (redisClient) {
    try {
      const v = await redisClient.get(key);
      if (v != null) return v as string;
    } catch {}
  }
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

export async function setCache(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  if (typeof window !== 'undefined') return; // client side: noop
  await initRedis();
  if (redisClient) {
    try {
      await redisClient.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {}
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Rate‑limiter (client & server safe) */
let lastReq = 0;
export async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastReq;
  const delay = 1000 - elapsed;
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  lastReq = Date.now();
}
