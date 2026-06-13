import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/skinscan/redisClient'
import { fetchSkinPrices } from '@/lib/skinscan/pricempire'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const exterior = searchParams.get('exterior') || ''

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 })
  }

  const fullName = exterior ? `${name} (${exterior})` : name
  const cacheKey = `skin_prices:${fullName.replace(/\s+/g, '_')}`

  try {
    // 1. Try cache
    const cached = await getCache(cacheKey)
    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }

    // 2. Cache miss -> Fetch prices
    const pricesData = await fetchSkinPrices(fullName)

    // 3. Store in cache (5 minutes TTL)
    await setCache(cacheKey, JSON.stringify(pricesData), 300)

    return NextResponse.json(pricesData)
  } catch (err: any) {
    console.error('Error fetching skin prices:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
