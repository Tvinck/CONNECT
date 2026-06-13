// lib/skinscan/redisClient.ts
/**
 * Thin wrapper that can be imported from anywhere (client or server).
 * It lazily re‑exports the server‑only implementation so the client bundle
 * never includes `ioredis`.
 */
import type * as ServerRedis from './server/redis';

export const getCache = async (...args: Parameters<typeof ServerRedis.getCache>) => {
  const { getCache } = await import('./server/redis');
  return getCache(...args);
};

export const setCache = async (...args: Parameters<typeof ServerRedis.setCache>) => {
  const { setCache } = await import('./server/redis');
  return setCache(...args);
};

export const throttleRequest = async (...args: Parameters<typeof ServerRedis.throttleRequest>) => {
  const { throttleRequest } = await import('./server/redis');
  return throttleRequest(...args);
};
