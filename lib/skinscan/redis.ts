'use client'

/**
 * Simplified cache layer for SkinScan.
 * Uses an in‑memory Map as the primary store and, **only on the server**,
 * lazily loads `ioredis` to optionally use a Redis instance when `REDIS_URL`
 * is provided. This avoids bundling the Node‑only `ioredis` package into the
 * client bundle, fixing the Next.js build error.
 */

// In‑memory fallback cache
interface MemoryCacheItem {
  value: string
  expiresAt: number
}
const memoryCache = new Map<string, MemoryCacheItem>()

let redisClient: any = null
let redisInitialized = false

async function initRedisIfNeeded() {
  if (redisInitialized) return
  redisInitialized = true
  if (!process.env.REDIS_URL) return
  try {
    // Dynamic import – only executed on the server at runtime.
    const RedisModule = await import('ioredis')
    const Redis = RedisModule.default ?? RedisModule
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    })
    redisClient.on('error', (err: Error) => {
      console.warn('Redis error, falling back to memory cache:', err.message)
    })
  } catch (e) {
    console.warn('ioredis could not be loaded; using memory cache only')
  }
}

export async function getCache(key: string): Promise<string | null> {
  // Ensure Redis is initialized only on server side.
  if (typeof window === 'undefined') {
    await initRedisIfNeeded()
  }
  if (redisClient) {
    try {
      const val = await redisClient.get(key)
      if (val != null) return val as string
    } catch {
      // fall back to memory
    }
  }
  const item = memoryCache.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return item.value
}

export async function setCache(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (typeof window === 'undefined') {
    await initRedisIfNeeded()
  }
  if (redisClient) {
    try {
      await redisClient.set(key, value, 'EX', ttlSeconds)
      return
    } catch {
      // fallback to memory
    }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

// Global rate limiter (client and server safe)
let lastRequestTime = 0
export async function throttleRequest(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  const delay = 1000 - elapsed
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  lastRequestTime = Date.now()
}
