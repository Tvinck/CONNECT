import { NextResponse } from 'next/server'

/**
 * Validates incoming requests to shop API endpoints.
 * Allows requests that match any of:
 * 1. Authorization: Bearer <SHOP_API_KEY>
 * 2. Origin from bazzar-serts.shop (frontend)
 * 3. Vercel Cron secret (for scheduled tasks)
 */
export function validateShopRequest(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const origin = request.headers.get('origin') || ''
  const referer = request.headers.get('referer') || ''
  
  // Allow Vercel Cron with CRON_SECRET
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return null
  }
  
  // Allow requests with SHOP_API_KEY
  if (process.env.SHOP_API_KEY && authHeader === `Bearer ${process.env.SHOP_API_KEY}`) {
    return null
  }
  
  // Allow requests from our frontend
  const allowedOrigins = ['https://bazzar-serts.shop', 'http://localhost:5173', 'http://localhost:3000']
  if (allowedOrigins.some(o => origin.startsWith(o) || referer.startsWith(o))) {
    return null
  }
  
  // Deny everything else
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: { 'Access-Control-Allow-Origin': 'https://bazzar-serts.shop' } }
  )
}
