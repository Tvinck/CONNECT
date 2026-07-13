import { NextResponse } from 'next/server'
import { isAllowedOrigin, getShopCorsHeaders } from './cors'

/**
 * Validates incoming requests to shop API endpoints.
 * Allows requests that match any of:
 * 1. Authorization: Bearer <SHOP_API_KEY>
 * 2. Origin exactly matches allowed frontend origins
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
  
  // Check origin header (exact match — prevents subdomain spoofing)
  if (origin && isAllowedOrigin(origin)) {
    return null
  }
  
  // Check referer header (extract origin from full URL for safe comparison)
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (isAllowedOrigin(refererOrigin)) return null
    } catch { /* invalid referer URL — deny */ }
  }
  
  // Deny — include full CORS headers so browser can display the error
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: corsHeaders }
  )
}
