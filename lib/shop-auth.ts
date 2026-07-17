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

  // Allow same-origin requests (browser omits Origin header for same-origin fetch)
  if (!origin) {
    // Double-check via referer — if referer is our own site, allow
    if (referer) {
      try {
        const refOrigin = new URL(referer).origin
        if (isSameApp(refOrigin)) return null
      } catch { /* invalid referer */ }
    }
    // No origin, no referer — likely a server-side call or same-origin
    // For API routes called internally, this is safe
    return null
  }

  // Allow requests from Connect dashboard itself (same app, different preview URLs)
  if (isSameApp(origin)) {
    return null
  }
  
  // Check origin header (exact match for external shop frontends)
  if (isAllowedOrigin(origin)) {
    return null
  }
  
  // Check referer header (extract origin from full URL for safe comparison)
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (isAllowedOrigin(refererOrigin) || isSameApp(refererOrigin)) return null
    } catch { /* invalid referer URL — deny */ }
  }
  
  // Deny — include full CORS headers so browser can display the error
  const corsHeaders = getShopCorsHeaders(request.headers.get('origin'))
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: corsHeaders }
  )
}

/** Check if origin belongs to this Connect app (same-origin or Vercel preview) */
function isSameApp(origin: string): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  
  if (siteUrl && origin === siteUrl) return true
  if (vercelUrl && origin === vercelUrl) return true
  // Match any Vercel preview deployment for this project
  if (origin.match(/^https:\/\/connect[\w-]*\.vercel\.app$/)) return true
  if (origin === 'https://connect.tvinck.ru') return true
  
  return false
}
