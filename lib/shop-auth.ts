import { NextResponse } from 'next/server'

/**
 * Validates incoming requests to shop API endpoints.
 * Allows requests that match any of:
 * 1. Authorization: Bearer <SHOP_API_KEY>
 * 2. Origin exactly matches bazzar-serts.shop (frontend)
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
  
  // Allow requests from our frontend (exact origin match to prevent subdomain spoofing)
  const allowedOrigins = ['https://bazzar-serts.shop']
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000')
  }
  
  // Check origin header (exact match — NOT startsWith to prevent bazzar-serts.shop.evil.com bypass)
  if (origin && allowedOrigins.includes(origin)) {
    return null
  }
  
  // Check referer header (extract origin from full URL for safe comparison)
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (allowedOrigins.includes(refererOrigin)) return null
    } catch { /* invalid referer URL — deny */ }
  }
  
  // Deny — include full CORS headers so browser can display the error
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { 
      status: 401, 
      headers: { 
        'Access-Control-Allow-Origin': 'https://bazzar-serts.shop',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      } 
    }
  )
}
