/**
 * Shared CORS configuration for all API routes.
 * 
 * Supports multiple frontend origins:
 * - https://bazzar-serts.shop (production domain)
 * - https://bazzar-serts.vercel.app (Vercel preview)
 * - localhost (development only)
 */

/** All allowed production origins for the frontend */
const PRODUCTION_ORIGINS = [
  'https://bazzar-serts.shop',
  'https://www.bazzar-serts.shop',
  'https://bazzar-serts.vercel.app',
]

/** Returns the correct Access-Control-Allow-Origin for the given request origin */
export function getCorsOrigin(requestOrigin: string | null): string {
  const origin = requestOrigin || ''
  const allowedOrigins = [...PRODUCTION_ORIGINS]
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000')
  }
  return allowedOrigins.includes(origin) ? origin : PRODUCTION_ORIGINS[0]
}

/** Standard CORS headers for shop API routes */
export function getShopCorsHeaders(requestOrigin: string | null) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(requestOrigin),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  } as const
}

/** Check if an origin is in the allowed list */
export function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [...PRODUCTION_ORIGINS]
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000')
  }
  return allowedOrigins.includes(origin)
}
