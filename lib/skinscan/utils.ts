// lib/skinscan/utils.ts
/**
 * Utility functions, types and constants safe for client-side imports.
 * This file must NOT import from pricempire.ts, redisClient.ts or any server-only module.
 */

export interface MarketPrice {
  source: string
  priceUsd: number
  priceRub?: number
  url: string
}

export interface SkinPricesResponse {
  market_hash_name: string
  icon_url: string
  prices: MarketPrice[]
  history: { date: string; price: number }[]
}

export const MARKET_META: Record<string, { name: string; url: (name: string) => string }> = {
  market_csgo: { name: 'Market.CSGO', url: (n) => `https://market.csgo.com/ru/?search=${encodeURIComponent(n)}&utm_source=skinscan` },
  skinport: { name: 'Skinport', url: (n) => `https://skinport.com/market?search=${encodeURIComponent(n)}&utm_source=skinscan` },
  dmarket: { name: 'DMarket', url: (n) => `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(n)}&utm_source=skinscan` },
  waxpeer: { name: 'Waxpeer', url: (n) => `https://waxpeer.com/all?game=csgo&search=${encodeURIComponent(n)}&utm_source=skinscan` },
  csfloat: { name: 'CSFloat', url: (n) => `https://csfloat.com/search?sort_by=lowest_price&type=buy&search=${encodeURIComponent(n)}&utm_source=skinscan` },
  skinbaron: { name: 'SkinBaron', url: (n) => `https://skinbaron.de/ru/search?searchQuery=${encodeURIComponent(n)}&utm_source=skinscan` },
  bitskins: { name: 'BitSkins', url: (n) => `https://bitskins.com/?market_hash_name=${encodeURIComponent(n)}&utm_source=skinscan` },
  buff: { name: 'BUFF163', url: (n) => `https://buff.163.com/market/goods?search=${encodeURIComponent(n)}&utm_source=skinscan` },
  lootfarm: { name: 'LootFarm', url: (n) => `https://loot.farm/&utm_source=skinscan` },
  whitemarket: { name: 'White.market', url: (n) => `https://white.market/market?search=${encodeURIComponent(n)}&utm_source=skinscan` },
  shadowpay: { name: 'ShadowPay', url: (n) => `https://shadowpay.com/en?search=${encodeURIComponent(n)}&utm_source=skinscan` },
  csgoempire: { name: 'CSGOEmpire', url: (n) => `https://csgoempire.com/marketplace/search?query=${encodeURIComponent(n)}` },
  c5game: { name: 'C5Game', url: (n) => `https://c5game.com/search?keywords=${encodeURIComponent(n)}` },
  mannco: { name: 'Mannco.store', url: (n) => `https://mannco.store/market?search=${encodeURIComponent(n)}` },
  swapgg: { name: 'Swap.gg', url: (n) => `https://swap.gg/market/csgo?search=${encodeURIComponent(n)}` },
  tradeitgg: { name: 'Tradeit.gg', url: (n) => `https://tradeit.gg/csgo/trade?search=${encodeURIComponent(n)}` },
  gamerpay: { name: 'GamerPay', url: (n) => `https://gamerpay.gg/market/csgo?search=${encodeURIComponent(n)}` },
  steam: { name: 'Steam Market', url: (n) => `https://steamcommunity.com/market/listings/730/${encodeURIComponent(n)}` }
}

export const RU_TRANSLATIONS: Record<string, string> = {
  'Кольцо Капли': 'Drop_Of_Rain_Ring'
}

/**
 * Fetch current USD→RUB exchange rate from CoinGecko (no API key needed).
 * Returns rate as number (RUB per 1 USD).
 */
export async function getRubRate(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=rub')
    const data = await res.json()
    return data.usd.rub ?? 92.5
  } catch (e) {
    console.warn('Failed to fetch RUB rate, defaulting to 92.5')
    return 92.5
  }
}

export function getSteamCdnUrl(iconUrl: string): string {
  if (!iconUrl) return 'https://community.akamai.steamstatic.com/economy/image/placeholder'
  const clean = iconUrl.replace('https://community.akamai.steamstatic.com/economy/image/', '')
  return `https://community.akamai.steamstatic.com/economy/image/${clean}/330x192`
}

export function getSkinBasePrice(name: string): number {
  let basePrice = 15 // Default base price

  // Knives & Gloves
  if (name.includes('★')) {
    basePrice = 200
    if (name.includes('Fade')) basePrice = 950
    else if (name.includes('Doppler')) basePrice = 800
    else if (name.includes('Crimson Web')) basePrice = 550
    else if (name.includes('Lore')) basePrice = 650
    else if (name.includes('Tiger Tooth')) basePrice = 450
    else if (name.includes('Autotronic')) basePrice = 380
    else if (name.includes('Slaughter')) basePrice = 400
    else if (name.includes('Marble Fade')) basePrice = 850
    else if (name.includes('Vanilla')) basePrice = 300
    else if (name.includes('Pandora')) basePrice = 1800
    else if (name.includes('Kimono')) basePrice = 900
    else if (name.includes('Plaid')) basePrice = 400
  } 
  // AWP & Snipers
  else if (name.includes('AWP') || name.includes('SSG 08') || name.includes('SCAR-20') || name.includes('G3SG1')) {
    basePrice = 12
    if (name.includes('Dragon Lore')) basePrice = 9500
    else if (name.includes('Gungnir')) basePrice = 8500
    else if (name.includes('Desert Hydra')) basePrice = 1800
    else if (name.includes('Lightning Strike')) basePrice = 220
    else if (name.includes('Medusa')) basePrice = 1600
    else if (name.includes('Asiimov')) basePrice = 120
    else if (name.includes('Hyper Beast')) basePrice = 60
    else if (name.includes('Oni Taiji')) basePrice = 280
    else if (name.includes('Wildfire')) basePrice = 75
  }
  // Rifles
  else if (name.includes('AK-47') || name.includes('M4A4') || name.includes('M4A1-S') || name.includes('Galil') || name.includes('FAMAS') || name.includes('SG 553') || name.includes('AUG')) {
    basePrice = 15
    if (name.includes('Howl')) basePrice = 3500
    else if (name.includes('Lotus')) basePrice = 8000
    else if (name.includes('Gold Arabesque')) basePrice = 1500
    else if (name.includes('Fire Serpent')) basePrice = 650
    else if (name.includes('Vulcan')) basePrice = 380
    else if (name.includes('Case Hardened')) basePrice = 220
    else if (name.includes('Printstream')) basePrice = 120
    else if (name.includes('Asiimov')) basePrice = 60
    else if (name.includes('Fuel Injector')) basePrice = 130
    else if (name.includes('Bloodsport')) basePrice = 85
    else if (name.includes('Empress')) basePrice = 55
    else if (name.includes('Neon Rider')) basePrice = 45
    else if (name.includes('Redline')) basePrice = 30
    else if (name.includes('Searing Rage')) basePrice = 15
  }
  // Pistols
  else if (name.includes('Glock-18') || name.includes('USP-S') || name.includes('Desert Eagle') || name.includes('P250') || name.includes('Five-SeveN') || name.includes('Tec-9') || name.includes('CZ75') || name.includes('Revolver')) {
    basePrice = 6
    if (name.includes('Blaze')) basePrice = 450
    else if (name.includes('Fade')) basePrice = 950
    else if (name.includes('Printstream')) basePrice = 60
    else if (name.includes('Kill Confirmed')) basePrice = 50
    else if (name.includes('Neo-Noir')) basePrice = 25
  }

  // Field-Tested baseline multiplier
  return basePrice * 0.8
}

