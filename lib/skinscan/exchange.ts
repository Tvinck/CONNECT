import { getCache, setCache } from '@/lib/skinscan/redisClient'

const CACHE_KEY = 'exchange_rate_usd_rub'
const CACHE_TTL = 3600 // 1 hour

export async function getExchangeRate(): Promise<number> {
  // Try to read cache
  try {
    const cached = await getCache(CACHE_KEY)
    if (cached) {
      const rate = Number(cached)
      if (!isNaN(rate) && rate > 0) return rate
    }
  } catch (err) {
    console.warn('Failed to read exchange rate cache:', err)
  }

  // Fetch from CB RF API
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js')
    if (res.ok) {
      const data = await res.json()
      const rate = data?.Valute?.USD?.Value
      if (rate && typeof rate === 'number' && rate > 0) {
        await setCache(CACHE_KEY, String(rate), CACHE_TTL)
        return rate
      }
    }
  } catch (err) {
    console.warn('Failed to fetch real exchange rate from CB RF, using fallback:', err)
  }

  // Fallback to reasonable static rate
  return 92.5
}
