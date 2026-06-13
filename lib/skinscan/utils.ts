// lib/skinscan/utils.ts
/**
 * Utility functions, types and constants safe for client-side imports.
 * This file must NOT import from pricempire.ts, redisClient.ts or any server-only module.
 */

export interface MarketPrice {
  source: string
  price: number // USD cents
  url: string
  available: boolean
}

export interface SkinPricesResponse {
  name: string
  iconUrl: string
  prices: MarketPrice[]
  cachedAt?: number
}

export const MARKET_META: Record<string, { name: string; url: (name: string) => string }> = {
  steam: {
    name: 'Steam Market',
    url: (name) => `https://steamcommunity.com/market/listings/730/${encodeURIComponent(name)}`,
  },
  cs2trader: {
    name: 'CS2Trader',
    url: (name) => `https://cs2trader.com/skin/${encodeURIComponent(name)}`,
  },
  skinport: {
    name: 'Skinport',
    url: (name) => `https://skinport.com/item/${encodeURIComponent(name)}`,
  },
  dmarket: {
    name: 'DMarket',
    url: (name) => `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(name)}`,
  },
  bitskins: {
    name: 'BitSkins',
    url: (name) => `https://bitskins.com/market/csgo?search=${encodeURIComponent(name)}`,
  },
  csgotm: {
    name: 'CS.MONEY',
    url: (name) => `https://cs.money/csgo/trade/?name=${encodeURIComponent(name)}`,
  },
  loot_farm: {
    name: 'Loot.Farm',
    url: (name) => `https://loot.farm/#csgo,s:${encodeURIComponent(name)}`,
  },
  buff163: {
    name: 'Buff163',
    url: (name) => `https://buff.163.com/goods?game=csgo&search=${encodeURIComponent(name)}`,
  },
}

export function getSteamCdnUrl(iconUrl: string): string {
  if (!iconUrl) return 'https://community.akamai.steamstatic.com/economy/image/placeholder'
  const clean = iconUrl.replace('https://community.akamai.steamstatic.com/economy/image/', '')
  return `https://community.akamai.steamstatic.com/economy/image/${clean}/330x192`
}
