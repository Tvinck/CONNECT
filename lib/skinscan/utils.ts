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

export function getSkinBasePrice(fullName: string): number {
  // 1. Extract base name without wear, e.g. "AWP | Crakow! (Battle-Scarred)" -> "AWP | Crakow!"
  const baseName = fullName.includes('(') ? fullName.split('(')[0].trim() : fullName

  // Default base prices by category
  let basePrice = 8

  if (baseName.includes('★')) {
    basePrice = 150
  } else if (baseName.includes('AWP')) {
    basePrice = 20
  } else if (baseName.includes('AK-47') || baseName.includes('M4A4') || baseName.includes('M4A1-S')) {
    basePrice = 15
  } else if (baseName.includes('USP-S') || baseName.includes('Glock-18') || baseName.includes('Desert Eagle')) {
    basePrice = 8
  }

  // Exact finish matches (overrides default base price)
  const FINISH_PRICES: Record<string, number> = {
    // Ultra High Tier
    'Dragon Lore': 9500,
    'Gungnir': 8500,
    'Howl': 3500,
    'Lotus': 8000,
    'Desert Hydra': 1800,
    'Gold Arabesque': 1500,
    'Medusa': 1600,
    'Fade': 950,
    'Doppler': 800,
    'Marble Fade': 850,
    'Crimson Web': 550,
    'Lore': 650,
    'Tiger Tooth': 450,
    'Slaughter': 400,
    'Autotronic': 380,
    'Vanilla': 300,
    'Fire Serpent': 650,

    // High Tier
    'Inheritance': 150,
    'Temukau': 180,
    'Vulcan': 380,
    'Case Hardened': 220,
    'Printstream': 120,
    'Oni Taiji': 280,
    'Lightning Strike': 220,
    'Blaze': 450,
    'Kill Confirmed': 90,
    'Asiimov': 80,
    'Bloodsport': 85,
    'Head Shot': 80,
    'Crakow!': 60, // AWP | Бдыщ!

    // Mid Tier
    'Chrome Cannon': 90,
    'Duality': 25,
    'The Traitor': 60,
    'Player Two': 70,
    'Bullet Queen': 50,
    'In Living Color': 50,
    'Wildfire': 75,
    'Hyper Beast': 60,
    'Empress': 55,
    'Neon Rider': 55,
    'Golden Coil': 65,
    'Chantico\'s Fire': 45,
    'Jaguar': 95,
    'Frontside Misty': 30,
    'Aquamarine Revenge': 45,
    'Wasteland Rebel': 40,
    'Redline': 30,
    'Desolate Space': 25,
    'Point Disarray': 25,
    'Mecha Industries': 20,
    'Buzz Kill': 20,
    'Fever Dream': 15,
    'Decimator': 18,
    'Neo-Noir': 25,
    'Water Elemental': 15,
    'Searing Rage': 15,
    'Black Nile': 10,
    'Atheris': 8,
    'Amber Fade': 15,
    'Chameleon': 10
  }

  // Find if name contains any of the finishes
  for (const [finish, price] of Object.entries(FINISH_PRICES)) {
    if (baseName.includes(finish)) {
      basePrice = price
      break
    }
  }

  // 2. State modifiers based on wear in the name
  let multiplier = 0.8 // Default to Field-Tested (0.8) if no wear specified
  if (fullName.includes('Factory New')) multiplier = 2.0
  else if (fullName.includes('Minimal Wear')) multiplier = 1.3
  else if (fullName.includes('Field-Tested')) multiplier = 0.8
  else if (fullName.includes('Well-Worn')) multiplier = 0.55
  else if (fullName.includes('Battle-Scarred')) multiplier = 0.3

  // StatTrak and Souvenir multipliers
  if (fullName.includes('StatTrak™')) multiplier *= 1.4
  if (fullName.includes('Souvenir')) multiplier *= 1.15

  return basePrice * multiplier
}


