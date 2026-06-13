import { NextResponse } from 'next/server'
import { getExchangeRate } from '@/lib/skinscan/exchange'

export async function GET() {
  try {
    const rate = await getExchangeRate()
    return NextResponse.json({ rate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch exchange rate' }, { status: 500 })
  }
}
