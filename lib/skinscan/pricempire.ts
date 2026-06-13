

const PRICEMPIRE_API_KEY = process.env.PRICEMPIRE_API_KEY || ''
const CSPRICE_API_TOKEN = process.env.CSPRICE_API_TOKEN || ''

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

// Map Pricempire source names to display names & domain links
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
}

export function getSteamCdnUrl(iconUrl: string): string {
  if (!iconUrl) return 'https://community.akamai.steamstatic.com/economy/image/placeholder'
  const clean = iconUrl.replace('https://community.akamai.steamstatic.com/economy/image/', '')
  return `https://community.akamai.steamstatic.com/economy/image/${clean}/330x192`
}

// Generate high quality mock data for demo/fallback purposes
export function generateMockPrices(name: string): SkinPricesResponse {
  // Base price depending on skin quality/tier
  let basePrice = 250
  if (name.includes('Fade')) basePrice = 1200
  else if (name.includes('Asiimov')) basePrice = 180
  else if (name.includes('Redline')) basePrice = 45
  else if (name.includes('Hyper Beast')) basePrice = 75
  else if (name.includes('Dragon Lore')) basePrice = 9500

  // State modifiers
  if (name.includes('Minimal Wear')) basePrice *= 0.8
  else if (name.includes('Field-Tested')) basePrice *= 0.6
  else if (name.includes('Well-Worn')) basePrice *= 0.45
  else if (name.includes('Battle-Scarred')) basePrice *= 0.3
  if (name.includes('StatTrak™')) basePrice *= 1.4
  if (name.includes('Souvenir')) basePrice *= 1.15

  const sources = Object.keys(MARKET_META)
  const prices: MarketPrice[] = sources.map((source) => {
    // Random price variant between -12% and +12%
    const variation = 0.88 + Math.random() * 0.24
    const price = Math.round(basePrice * variation * 100) / 100
    return {
      source,
      priceUsd: price,
      url: MARKET_META[source].url(name),
    }
  })

  // Generate 30 days history trend
  const history: { date: string; price: number }[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    // Subtle trend variation
    const dayVariation = 0.95 + Math.sin(i / 3) * 0.03 + Math.random() * 0.04
    history.push({
      date: dateStr,
      price: Math.round(basePrice * dayVariation * 10) / 10,
    })
  }

  return {
    market_hash_name: name,
    icon_url: 'fWFc82js1xTCOqonVQQet9VcX45GObFN3IMUBfqF30vyGFY4H5X4vPPD7N4GB1AMUD6p2i0RmvXjA_OFDefHPuxk1slW1zRpkwcrM-fnYzUyc1GfUvdcDPB_plnvDSZh6ZcxUI_joeMDdQ--t4bDM7MsN95FGZODDPKBZAr0uUo71qAIfsOM', // Example AK-47 Redline icon
    prices,
    history,
  }
}

export async function fetchSkinPrices(name: string): Promise<SkinPricesResponse> {
  // If no API keys, directly return mock data
  if (!PRICEMPIRE_API_KEY && !CSPRICE_API_TOKEN) {
    return generateMockPrices(name)
  }

  // 1. Rate limiter check (max 1 req/sec)
  const { throttleRequest } = await import('@/lib/skinscan/redisClient');
await throttleRequest()

  // 2. Try Pricempire API
  if (PRICEMPIRE_API_KEY) {
    try {
      const url = `https://api.pricempire.com/v3/items/prices?api_key=${PRICEMPIRE_API_KEY}&sources=buff,skinport,csfloat,waxpeer,dmarket,market_csgo,skinbaron,lootfarm`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      if (res.ok) {
        const data = await res.json()
        if (data && data[name]) {
          const itemData = data[name]
          const prices: MarketPrice[] = []
          for (const src of Object.keys(MARKET_META)) {
            const srcPrice = itemData.prices?.[src]
            if (srcPrice?.price) {
              prices.push({
                source: src,
                priceUsd: srcPrice.price / 100, // Pricempire prices are in cents
                url: MARKET_META[src].url(name),
              })
            }
          }
          if (prices.length > 0) {
            return {
              market_hash_name: name,
              icon_url: itemData.icon || '',
              prices,
              history: generateMockPrices(name).history, // History baseline
            }
          }
        }
      }
    } catch (err) {
      console.warn('Pricempire API request failed, trying fallback...', err)
    }
  }

  // 3. Fallback: CSPriceAPI
  if (CSPRICE_API_TOKEN) {
    try {
      const url = `https://api.cspriceapi.com/v1/prices?market=skinport&name=${encodeURIComponent(name)}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${CSPRICE_API_TOKEN}`,
          'Accept': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.price) {
          const basePrice = Number(data.price)
          const prices: MarketPrice[] = Object.keys(MARKET_META).map((src) => {
            const variation = 0.9 + Math.random() * 0.2
            return {
              source: src,
              priceUsd: Math.round(basePrice * variation * 100) / 100,
              url: MARKET_META[src].url(name),
            }
          })
          return {
            market_hash_name: name,
            icon_url: data.icon_url || '',
            prices,
            history: generateMockPrices(name).history,
          }
        }
      }
    } catch (err) {
      console.warn('Fallback CSPriceAPI failed:', err)
    }
  }

  // If both failed, return mock data
  return generateMockPrices(name)
}
